import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  preferences: {
    theme: "light" | "dark" | "system";
    defaultProvider?: string;
    defaultModel?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, unique: true, sparse: true, index: true },
    displayName: { type: String },
    avatarUrl: { type: String },
    preferences: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "dark" },
      defaultProvider: { type: String, default: "auto" },
      defaultModel: { type: String, default: "auto" },
    },
  },
  { timestamps: true }
);

export const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
