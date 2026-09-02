import mongoose, { Document, Schema, Types } from "mongoose";

export interface IFileAsset extends Document {
  userId: Types.ObjectId;
  conversationId?: Types.ObjectId;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: string;
  storageKey?: string;
  dataBase64?: string;
  providerFileRefs?: Record<string, string>;
  extractedText?: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  createdAt: Date;
}

const FileAssetSchema = new Schema<IFileAsset>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", index: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storageProvider: { type: String, default: "local" },
    storageKey: { type: String },
    dataBase64: { type: String },
    providerFileRefs: { type: Map, of: String },
    extractedText: { type: String },
    status: {
      type: String,
      enum: ["uploaded", "processing", "ready", "failed"],
      default: "uploaded",
    },
  },
  { timestamps: true }
);

FileAssetSchema.index({ userId: 1, createdAt: -1 });
FileAssetSchema.index({ conversationId: 1, createdAt: -1 });

export const FileAssetModel =
  mongoose.models.FileAsset ||
  mongoose.model<IFileAsset>("FileAsset", FileAssetSchema);

export const FileAsset = FileAssetModel;

