import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Conversation } from "@/lib/db/models/Conversation";
import { createConversationSchema } from "@/lib/security/validation";
import { formatErrorResponse } from "@/lib/security/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ conversations: [] });
    }
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(50)
      .lean();

    const formatted = conversations.map((c: any) => ({
      id: c._id.toString(),
      title: c.title || "Untitled Chat",
      mode: c.mode || "chat",
      modelPreference: c.modelPreference || "auto",
      updatedAt: c.updatedAt || c.createdAt || new Date(),
    }));

    return NextResponse.json({ conversations: formatted });
  } catch (err) {
    return formatErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createConversationSchema.parse(body);

    await connectToDatabase();

    const conv = await Conversation.create({
      title: parsed.title || "New Chat",
      mode: parsed.mode,
      modelPreference: parsed.modelPreference || "auto",
    });

    return NextResponse.json({
      conversation: {
        id: conv._id.toString(),
        title: conv.title,
        mode: conv.mode,
        modelPreference: conv.modelPreference,
        updatedAt: conv.updatedAt,
      },
    });
  } catch (err) {
    return formatErrorResponse(err);
  }
}
