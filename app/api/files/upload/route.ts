import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { FileAsset } from "@/lib/db/models/FileAsset";
import { validateAndSanitizeFile } from "@/lib/security/file-security";
import { formatErrorResponse, AppError } from "@/lib/security/errors";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new AppError({
        code: "INVALID_REQUEST",
        message: "No file provided in form payload.",
        statusCode: 400,
      });
    }

    // Validate size & MIME type
    const validated = validateAndSanitizeFile({
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    });

    if (!validated.valid) {
      throw new AppError({
        code: "INVALID_FILE",
        message: validated.error || "Invalid file uploaded.",
        statusCode: 400,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataBase64 = buffer.toString("base64");
    let extractedText = "";

    // Extract text content for supported text/document formats
    if (
      file.type.startsWith("text/") ||
      file.type === "application/json" ||
      file.type === "text/csv"
    ) {
      extractedText = buffer.toString("utf-8", 0, Math.min(buffer.length, 100000));
    } else if (file.type === "application/pdf") {
      // Basic text extraction for PDF text streams
      const rawString = buffer.toString("utf-8");
      const matches = rawString.match(/\(([^)]+)\)\s*Tj/g);
      if (matches) {
        extractedText = matches
          .map((m) => m.replace(/[()Tj]/g, ""))
          .join(" ")
          .slice(0, 50000);
      } else {
        extractedText = `[PDF Document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`;
      }
    } else {
      extractedText = `[Attached File: ${file.name} (${file.type})]`;
    }

    await connectToDatabase();

    const asset = await FileAsset.create({
      name: validated.safeName,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storageProvider: "memory",
      storageKey: validated.storageKey,
      dataBase64,
      extractedText,
      status: "ready",
    });

    return NextResponse.json({
      file: {
        id: asset._id.toString(),
        name: asset.name,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        extractedText: asset.extractedText,
        dataBase64,
      },
    });
  } catch (err) {
    return formatErrorResponse(err);
  }
}
