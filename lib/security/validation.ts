import { z } from "zod";

export const chatModeSchema = z.enum([
  "auto",
  "chat",
  "search",
  "image",
  "voice",
  "document",
]);

export const messageRoleSchema = z.enum(["system", "user", "assistant", "tool"]);

export const messageContentPartSchema = z.object({
  type: z.enum(["text", "image", "file", "audio", "tool-call", "tool-result"]),
  text: z.string().optional(),
  fileId: z.string().optional(),
  mimeType: z.string().optional(),
  url: z.string().url().optional(),
  name: z.string().optional(),
});

export const messageInputSchema = z.object({
  role: messageRoleSchema,
  content: z.array(messageContentPartSchema).min(1),
  provider: z.string().optional(),
  model: z.string().optional(),
});

export const createChatSchema = z.object({
  conversationId: z.string().optional(),
  mode: chatModeSchema.default("chat"),
  provider: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  messages: z.array(messageInputSchema).min(1),
  attachmentIds: z.array(z.string()).optional(),
});

export const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  mode: chatModeSchema.default("chat"),
  modelPreference: z.string().optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
