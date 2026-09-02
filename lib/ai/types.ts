export type MessageRole = "system" | "user" | "assistant" | "tool";

export type ChatMode = "auto" | "chat" | "search" | "image" | "voice" | "document";

export interface NormalizedAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
  dataBase64?: string;
  extractedText?: string;
}

export interface NormalizedMessageContent {
  type: "text" | "image" | "file" | "audio" | "tool-call" | "tool-result";
  text?: string;
  fileId?: string;
  mimeType?: string;
  url?: string;
  name?: string;
}

export interface NormalizedMessage {
  id?: string;
  role: MessageRole;
  content: NormalizedMessageContent[];
  provider?: string;
  model?: string;
  createdAt?: Date;
}

export interface ProviderCapabilities {
  chat: boolean;
  streaming: boolean;
  vision: boolean;
  documents: boolean;
  imageGeneration: boolean;
  speechToText: boolean;
  textToSpeech: boolean;
  webSearch: boolean;
  toolCalling: boolean;
  structuredOutput: boolean;
}

export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: ProviderCapabilities;
  contextWindow?: number;
  maxOutputTokens?: number;
  isDefault?: boolean;
}

export interface AIRequest {
  mode: ChatMode;
  provider?: string;
  model?: string;
  messages: NormalizedMessage[];
  attachments?: NormalizedAttachment[];
  temperature?: number;
  maxOutputTokens?: number;
  systemPrompt?: string;
  stop?: string[];
}

export interface Usage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

export interface AIResponse {
  provider: string;
  model: string;
  text: string;
  finishReason?: "stop" | "length" | "tool_calls" | "content_filter" | "error";
  usage?: Usage;
  latencyMs?: number;
  raw?: unknown;
}

export interface AIChunk {
  provider: string;
  model: string;
  textDelta: string;
  isComplete: boolean;
  finishReason?: string;
  usage?: Usage;
}
