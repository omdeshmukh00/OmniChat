import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Conversation } from "@/lib/db/models/Conversation";
import { Message } from "@/lib/db/models/Message";
import { createConversationSchema } from "@/lib/security/validation";
import { formatErrorResponse } from "@/lib/security/errors";

export const runtime = "nodejs";

function buildSearchRegex(query: string): string {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (/^\w/.test(query)) {
    return `\\b${escaped}`;
  }
  return escaped;
}

export async function GET(req: NextRequest) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ conversations: [] });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (query) {
      const searchPattern = buildSearchRegex(query);

      // 1. Search Message contents matching word boundary regex
      const matchingMessages = await Message.find({
        "content.text": { $regex: searchPattern, $options: "i" },
      })
        .select("conversationId content role createdAt")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      const matchedConvIdMap = new Map<string, string>();
      for (const msg of matchingMessages as any[]) {
        if (msg.conversationId && !matchedConvIdMap.has(msg.conversationId)) {
          const textContent = msg.content?.find((c: any) => c.text)?.text || "";
          matchedConvIdMap.set(msg.conversationId, textContent);
        }
      }

      const matchingConvIds = Array.from(matchedConvIdMap.keys());

      // 2. Search Conversations matching title OR containing matching messages
      const conversations = await Conversation.find({
        $or: [
          { title: { $regex: searchPattern, $options: "i" } },
          { _id: { $in: matchingConvIds.filter((id) => id && id.length === 24) } },
        ],
      })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(50)
        .lean();

      const formatted = conversations.map((c: any) => {
        const idStr = c._id.toString();
        const snippet = matchedConvIdMap.get(idStr) || "";
        return {
          id: idStr,
          title: c.title || "Untitled Chat",
          mode: c.mode || "chat",
          modelPreference: c.modelPreference || "auto",
          updatedAt: c.updatedAt || c.createdAt || new Date(),
          matchSnippet: snippet ? snippet.slice(0, 90) + (snippet.length > 90 ? "..." : "") : undefined,
        };
      });

      return NextResponse.json({ conversations: formatted });
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
