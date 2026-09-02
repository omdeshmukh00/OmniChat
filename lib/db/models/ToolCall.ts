import mongoose, { Document, Schema, Types } from "mongoose";

export interface IToolCall extends Document {
  conversationId: Types.ObjectId;
  messageId?: Types.ObjectId;
  toolId: string;
  input: unknown;
  output?: unknown;
  status: "pending" | "running" | "complete" | "error" | "cancelled";
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

const ToolCallSchema = new Schema<IToolCall>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    messageId: { type: Schema.Types.ObjectId, ref: "Message" },
    toolId: { type: String, required: true },
    input: { type: Schema.Types.Mixed },
    output: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["pending", "running", "complete", "error", "cancelled"],
      default: "pending",
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

ToolCallSchema.index({ conversationId: 1, createdAt: 1 });

export const ToolCallModel =
  mongoose.models.ToolCall ||
  mongoose.model<IToolCall>("ToolCall", ToolCallSchema);
