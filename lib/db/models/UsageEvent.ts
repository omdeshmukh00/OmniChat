import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUsageEvent extends Omit<Document, "model"> {
  userId?: Types.ObjectId;
  provider: string;
  model?: string;
  route: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  latencyMs?: number;
  success: boolean;
  createdAt: Date;
}

const UsageEventSchema = new Schema<IUsageEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    provider: { type: String, required: true },
    model: { type: String },
    route: { type: String, required: true },
    inputTokens: { type: Number },
    outputTokens: { type: Number },
    estimatedCostUsd: { type: Number },
    latencyMs: { type: Number },
    success: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UsageEventSchema.index({ userId: 1, createdAt: -1 });

export const UsageEventModel =
  mongoose.models.UsageEvent ||
  mongoose.model<IUsageEvent>("UsageEvent", UsageEventSchema);

export const UsageEvent = UsageEventModel;

