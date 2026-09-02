import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Conversation } from "@/lib/db/models/Conversation";
import { Message } from "@/lib/db/models/Message";
import { FileAsset } from "@/lib/db/models/FileAsset";
import { UsageEvent } from "@/lib/db/models/UsageEvent";
import { AutoRouter } from "@/lib/ai/router";
import { createChatSchema } from "@/lib/security/validation";
import { formatErrorResponse } from "@/lib/security/errors";
import { AIRequest, NormalizedAttachment } from "@/lib/ai/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createChatSchema.parse(body);

    const firstUserMsg = parsed.messages[parsed.messages.length - 1];
    const initialText = firstUserMsg?.content.find((c) => c.text)?.text || "New Chat";
    const titleSnippet = initialText.slice(0, 40) + (initialText.length > 40 ? "..." : "");

    // Pre-generate ObjectIds in memory for instant zero-latency stream initialization
    const isNewConv = !parsed.conversationId || !mongoose.Types.ObjectId.isValid(parsed.conversationId);
    const convObjectId = !isNewConv
      ? new mongoose.Types.ObjectId(parsed.conversationId)
      : new mongoose.Types.ObjectId();
    const conversationId = convObjectId.toString();
    const assistantMsgObjectId = new mongoose.Types.ObjectId();

    await connectToDatabase();

    // Fetch attached files if provided
    const attachments: NormalizedAttachment[] = [];
    if (parsed.attachmentIds && parsed.attachmentIds.length > 0) {
      const validIds = parsed.attachmentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length > 0) {
        const fileDocs = await FileAsset.find({ _id: { $in: validIds } }).lean();
        for (const doc of fileDocs as any[]) {
          attachments.push({
            id: doc._id.toString(),
            name: doc.name || "Attachment",
            mimeType: doc.mimeType || "image/png",
            sizeBytes: doc.sizeBytes || 1024,
            url: `/api/image/asset/${doc._id.toString()}`,
            dataBase64: doc.dataBase64,
          });
        }
      }
    }

    // Prepare AI Request & Select Provider
    const normalizedMessages = parsed.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const aiRequest: AIRequest = {
      mode: parsed.mode as any,
      provider: parsed.provider,
      model: parsed.model,
      messages: normalizedMessages,
      attachments,
    };

    const { provider, model } = AutoRouter.selectProviderAndModel(aiRequest);

    // Asynchronously persist conversation and user/assistant messages in background without blocking stream start
    const persistPromise = (async () => {
      try {
        if (isNewConv) {
          await Conversation.create({
            _id: convObjectId,
            title: titleSnippet,
            mode: parsed.mode === "auto" ? "chat" : parsed.mode,
            modelPreference: parsed.model || parsed.provider || "auto",
          }).catch(() => {});
        }
        await Message.create({
          conversationId,
          role: firstUserMsg.role,
          content: firstUserMsg.content,
          provider: parsed.provider,
          model: parsed.model,
          attachments: attachments.map((a) => ({
            id: a.id,
            name: a.name,
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
            url: a.url,
            type: a.mimeType.startsWith("image/") ? "image" : "file",
          })),
          status: "complete",
        }).catch(() => {});

        await Message.create({
          _id: assistantMsgObjectId,
          conversationId,
          role: "assistant",
          content: [{ type: "text", text: "" }],
          provider: provider.id,
          model,
          status: "streaming",
        }).catch(() => {});
      } catch (e) {
        console.warn("Background DB persist warning:", e);
      }
    })();

    // Setup SSE Stream Response with instant TTFB (< 20ms)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        const startTime = Date.now();

        try {
          // Send conversation metadata instantly
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "meta",
                conversationId,
                messageId: assistantMsgObjectId.toString(),
                provider: provider.id,
                model,
              })}\n\n`
            )
          );

          // Stream chunks from selected provider adapter
          for await (const chunk of provider.stream({ ...aiRequest, model })) {
            if (chunk.textDelta) {
              fullText += chunk.textDelta;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "delta",
                    textDelta: chunk.textDelta,
                  })}\n\n`
                )
              );
            }
          }

          // Ensure DB records are created before finalizing
          await persistPromise;

          // Mark Assistant Message Complete in MongoDB
          await Message.findByIdAndUpdate(assistantMsgObjectId, {
            content: [{ type: "text", text: fullText }],
            status: "complete",
            latencyMs: Date.now() - startTime,
          }).catch(() => {});

          // Record Usage Telemetry Event
          await UsageEvent.create({
            provider: provider.id,
            model,
            route: "/api/chat",
            latencyMs: Date.now() - startTime,
            success: true,
          }).catch(() => {});

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                fullText,
                status: "complete",
              })}\n\n`
            )
          );
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Error streaming response";
          await persistPromise;
          await Message.findByIdAndUpdate(assistantMsgObjectId, {
            status: "error",
            error: { message: errMsg },
          }).catch(() => {});

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: errMsg,
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return formatErrorResponse(err);
  }
}
