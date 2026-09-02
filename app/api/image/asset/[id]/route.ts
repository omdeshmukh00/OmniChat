import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { FileAsset } from "@/lib/db/models/FileAsset";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new Response("Invalid asset ID", { status: 404 });
    }

    await connectToDatabase();
    const asset = (await FileAsset.findById(id).lean()) as any;

    if (!asset || !asset.dataBase64) {
      return new Response("Asset not found", { status: 404 });
    }

    const buffer = Buffer.from(asset.dataBase64, "base64");

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch {
    return new Response("Error retrieving asset", { status: 500 });
  }
}
