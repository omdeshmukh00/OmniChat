import mongoose, { Document, Schema, Types } from "mongoose";

export interface IConversation extends Document {
  userId: Types.ObjectId;
  title: string;
  modelPreference?: string;
  mode: "chat" | "image" | "search" | "voice" | "document";
  pinned: boolean;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    title: { type: String, required: true, default: "New chat" },
    modelPreference: { type: String },
    mode: {
      type: String,
      enum: ["chat", "image", "search", "voice", "document"],
      default: "chat",
    },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes matching PRD requirements
ConversationSchema.index({ userId: 1, updatedAt: -1 });

export const ConversationModel =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export const Conversation = ConversationModel;

