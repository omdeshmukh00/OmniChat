import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Conversation } from "@/lib/db/models/Conversation";
import { Message } from "@/lib/db/models/Message";
import { Generation } from "@/lib/db/models/Generation";
import { FileAsset } from "@/lib/db/models/FileAsset";
import { ImageGenerator } from "@/lib/image/generator";
import { formatErrorResponse } from "@/lib/security/errors";

export const runtime = "nodejs";

const generateImageSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(2000, "Prompt is too long"),
  conversationId: z.string().optional(),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = generateImageSchema.parse(body);

    const isNewConv = !parsed.conversationId || !mongoose.Types.ObjectId.isValid(parsed.conversationId);
    const convObjectId = !isNewConv ? new mongoose.Types.ObjectId(parsed.conversationId) : new mongoose.Types.ObjectId();
    const conversationId = convObjectId.toString();
    const titleSnippet = parsed.prompt.slice(0, 40) + (parsed.prompt.length > 40 ? "..." : "");

    await connectToDatabase();

    // Create conversation document if new
    if (isNewConv) {
      await Conversation.create({
        _id: convObjectId,
        title: titleSnippet,
        mode: "image",
        modelPreference: "auto",
      }).catch(() => {});
    }

    // Record user prompt message
    await Message.create({
      conversationId,
      role: "user",
      content: [{ type: "text", text: parsed.prompt }],
      status: "complete",
    }).catch(() => {});

    let result;
    try {
      result = await ImageGenerator.generate({
        prompt: parsed.prompt,
        aspectRatio: parsed.aspectRatio,
      });
    } catch (genErr: any) {
      const errCode = genErr?.code || "PROVIDER_ERROR";
      const errMsg = genErr?.message || "Image generation failed.";
      
      await Message.create({
        conversationId,
        role: "assistant",
        type: "image_generation",
        content: [{ type: "text", text: parsed.prompt }],
        imageGeneration: {
          prompt: parsed.prompt,
          model: "gemini-2.5-flash-image",
          provider: "google",
          status: "failed",
          errorCode: errCode,
          error: errMsg,
        },
        provider: "google",
        model: "gemini-2.5-flash-image",
        status: "error",
        error: { code: errCode, message: errMsg },
      }).catch(() => {});

      return NextResponse.json(
        {
          success: false,
          code: errCode,
          conversationId,
          provider: "google",
          model: "gemini-2.5-flash-image",
          error: errMsg,
        },
        { status: genErr?.statusCode || 400 }
      );
    }

    if (!result.success || !result.image?.data) {
      const errMsg = result.error || "Image generation failed.";
      await Message.create({
        conversationId,
        role: "assistant",
        type: "image_generation",
        content: [{ type: "text", text: parsed.prompt }],
        imageGeneration: {
          prompt: parsed.prompt,
          model: "gemini-2.5-flash-image",
          provider: "google",
          status: "failed",
          errorCode: "GENERATION_FAILED",
          error: errMsg,
        },
        provider: "google",
        model: "gemini-2.5-flash-image",
        status: "error",
        error: { message: errMsg },
      }).catch(() => {});

      return NextResponse.json(
        {
          success: false,
          code: "GENERATION_FAILED",
          conversationId,
          provider: "google",
          model: "gemini-2.5-flash-image",
          error: errMsg,
        },
        { status: 400 }
      );
    }

    // Store generated image binary asset in FileAsset collection
    const fileAsset = await FileAsset.create({
      conversationId: convObjectId,
      name: `generated-${Date.now()}.${result.image.mimeType === "image/png" ? "png" : "jpg"}`,
      mimeType: result.image.mimeType || "image/jpeg",
      sizeBytes: Math.round((result.image.data.length * 3) / 4),
      storageProvider: "mongodb-gridfs",
      dataBase64: result.image.data,
      status: "ready",
    });

    const assetUrl = `/api/image/asset/${fileAsset._id.toString()}`;

    // Record Assistant Message with generated asset URL and structured imageGeneration metadata
    await Message.create({
      conversationId,
      role: "assistant",
      type: "image_generation",
      content: [{ type: "image", url: assetUrl, text: parsed.prompt }],
      imageGeneration: {
        prompt: parsed.prompt,
        model: result.model,
        provider: result.provider,
        status: "completed",
        assetUrl,
        mimeType: result.image.mimeType || "image/jpeg",
        aspectRatio: result.aspectRatio || parsed.aspectRatio || "1:1",
        width: result.width || 1024,
        height: result.height || 1024,
      },
      provider: result.provider,
      model: result.model,
      status: "complete",
    }).catch(() => {});

    // Record Telemetry
    await Generation.create({
      type: "image",
      prompt: parsed.prompt,
      provider: result.provider,
      model: result.model,
      outputUrl: assetUrl,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      conversationId,
      type: "image",
      image: {
        assetUrl,
        mimeType: result.image.mimeType || "image/jpeg",
      },
      prompt: result.prompt,
      model: result.model,
      provider: result.provider,
      aspectRatio: result.aspectRatio || parsed.aspectRatio || "1:1",
      width: result.width || 1024,
      height: result.height || 1024,
    });
  } catch (err) {
    return formatErrorResponse(err);
  }
}
