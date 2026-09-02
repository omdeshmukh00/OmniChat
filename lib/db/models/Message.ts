import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessageContent {
  type: "text" | "image" | "file" | "audio" | "tool-call" | "tool-result";
  text?: string;
  fileId?: Types.ObjectId;
  mimeType?: string;
  url?: string;
  name?: string;
}

export interface IMessageImageGen {
  prompt: string;
  model: string;
  provider: string;
  status: "idle" | "generating" | "completed" | "failed" | "quota_error" | "provider_error";
  assetUrl?: string;
  mimeType?: string;
  errorCode?: string;
  error?: any;
}

export interface IMessage extends Omit<Document, "model"> {
  conversationId: Types.ObjectId;
  role: "system" | "user" | "assistant" | "tool";
  content: IMessageContent[];
  type?: "text" | "image_generation";
  imageGeneration?: IMessageImageGen;
  provider?: string;
  model?: string;
  status: "pending" | "streaming" | "complete" | "error" | "cancelled";
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    estimatedCostUsd?: number;
  };
  latencyMs?: number;
  error?: {
    code?: string;
    message: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageContentSchema = new Schema<IMessageContent>(
  {
    type: {
      type: String,
      enum: ["text", "image", "file", "audio", "tool-call", "tool-result"],
      required: true,
    },
    text: { type: String },
    fileId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    mimeType: { type: String },
    url: { type: String },
    name: { type: String },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["system", "user", "assistant", "tool"],
      required: true,
    },
    content: [MessageContentSchema],
    type: { type: String, default: "text" },
    imageGeneration: { type: Schema.Types.Mixed },
    provider: { type: String },
    model: { type: String },
    status: {
      type: String,
      enum: ["pending", "streaming", "complete", "error", "cancelled"],
      default: "complete",
    },
    usage: {
      inputTokens: { type: Number },
      outputTokens: { type: Number },
      totalTokens: { type: Number },
      estimatedCostUsd: { type: Number },
    },
    latencyMs: { type: Number },
    error: {
      code: { type: String },
      message: { type: String },
    },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const MessageModel =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export const Message = MessageModel;
