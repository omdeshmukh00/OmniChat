import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Conversation } from "@/lib/db/models/Conversation";
import { Message } from "@/lib/db/models/Message";
import { updateConversationSchema } from "@/lib/security/validation";
import { formatErrorResponse, AppError } from "@/lib/security/errors";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Conversation not found",
        statusCode: 404,
      });
    }

    await connectToDatabase();

    // Fetch Conversation & Messages in parallel
    const [conversation, messages] = await Promise.all([
      Conversation.findById(id).lean(),
      Message.find({ conversationId: id }).sort({ createdAt: 1 }).lean(),
    ]);

    if (!conversation) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Conversation not found",
        statusCode: 404,
      });
    }

    const formattedMessages = messages.map((m: any) => {
      const isImageGen =
        m.type === "image_generation" ||
        Boolean(m.imageGeneration) ||
        (m.content && m.content.some((c: any) => c.type === "image" || (c.url && c.url.includes("/api/image/asset"))));

      let imageGenObj = m.imageGeneration;
      if (!imageGenObj && isImageGen) {
        const imgContent = m.content ? m.content.find((c: any) => c.type === "image" || c.url) : null;
        const textContent = m.content ? m.content.find((c: any) => c.text)?.text : "";
        imageGenObj = {
          prompt: textContent || "Generated image",
          model: m.model || "black-forest-labs/FLUX.1-schnell",
          provider: m.provider || "huggingface",
          status: m.status === "error" ? "failed" : "completed",
          assetUrl: imgContent?.url || "",
          error: m.error ? (typeof m.error === "object" ? m.error.message || JSON.stringify(m.error) : String(m.error)) : undefined,
        };
      }

      return {
        id: m._id.toString(),
        role: m.role,
        content: m.content ? m.content.map((c: any) => c.text).filter(Boolean).join("\n") : "",
        type: isImageGen ? "image_generation" : "text",
        imageGeneration: imageGenObj || undefined,
        provider: m.provider,
        model: m.model,
        status: m.status,
        error: m.error ? (typeof m.error === "object" ? m.error.message || JSON.stringify(m.error) : String(m.error)) : undefined,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    });

    return NextResponse.json({
      conversation: {
        id: (conversation as any)._id.toString(),
        title: (conversation as any).title,
        mode: (conversation as any).mode,
      },
      messages: formattedMessages,
    });
  } catch (err) {
    return formatErrorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: true, deletedId: id });
    }

    // Trigger non-blocking database deletions in background
    (async () => {
      try {
        await connectToDatabase();
        await Promise.all([
          Conversation.findByIdAndDelete(id),
          Message.deleteMany({ conversationId: id }),
        ]);
      } catch (err) {
        console.warn("Background conversation delete error:", err);
      }
    })();

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    return formatErrorResponse(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Conversation not found",
        statusCode: 404,
      });
    }

    const body = await req.json();
    const parsed = updateConversationSchema.parse(body);

    await connectToDatabase();

    const updated = (await Conversation.findByIdAndUpdate(id, parsed, {
      new: true,
    }).lean()) as any;

    if (!updated) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Conversation not found",
        statusCode: 404,
      });
    }

    return NextResponse.json({
      conversation: {
        id: updated._id.toString(),
        title: updated.title,
        pinned: updated.pinned,
        archived: updated.archived,
      },
    });
  } catch (err) {
    return formatErrorResponse(err);
  }
}
