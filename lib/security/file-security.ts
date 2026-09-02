import path from "path";

const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  // Documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/m4a",
]);

export interface ValidateFileOptions {
  name: string;
  mimeType: string;
  sizeBytes: number;
  maxSizeBytes?: number;
}

export interface SanitizedFileInfo {
  valid: boolean;
  safeName: string;
  storageKey: string;
  error?: string;
}

export function sanitizeFilename(filename: string): string {
  // Strip path traversal sequences and keep only basename
  const basename = path.basename(filename);
  // Replace unsafe characters
  return basename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function validateAndSanitizeFile(
  options: ValidateFileOptions
): SanitizedFileInfo {
  const { name, mimeType, sizeBytes, maxSizeBytes = 20 * 1024 * 1024 } = options;

  if (sizeBytes > maxSizeBytes) {
    return {
      valid: false,
      safeName: "",
      storageKey: "",
      error: `File size exceeds limit of ${Math.round(maxSizeBytes / (1024 * 1024))}MB`,
    };
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
    return {
      valid: false,
      safeName: "",
      storageKey: "",
      error: `Unsupported file type: ${mimeType}`,
    };
  }

  const safeName = sanitizeFilename(name);
  const fileExt = path.extname(safeName) || ".bin";
  const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15);
  const storageKey = `uploads/${Date.now()}_${uniqueId}${fileExt}`;

  return {
    valid: true,
    safeName,
    storageKey,
  };
}
