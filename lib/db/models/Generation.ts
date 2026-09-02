import mongoose, { Document, Schema, Types } from "mongoose";

export interface IGeneration extends Omit<Document, "model"> {
  userId: Types.ObjectId;
  conversationId?: Types.ObjectId;
  type: "image" | "audio" | "document";
  prompt?: string;
  provider: string;
  model?: string;
  outputUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const GenerationSchema = new Schema<IGeneration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    type: { type: String, enum: ["image", "audio", "document"], required: true },
    prompt: { type: String },
    provider: { type: String, required: true },
    model: { type: String },
    outputUrl: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const GenerationModel =
  mongoose.models.Generation ||
  mongoose.model<IGeneration>("Generation", GenerationSchema);

export const Generation = GenerationModel;

