"use client";

import { useState, useRef, useEffect } from "react";
import { User, Sparkles, Copy, Check, AlertCircle, RotateCw, MoreHorizontal, Pencil, X, Send, FileText } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { GeneratedImage } from "@/components/generated/generated-image";

export interface MessageUI {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  type?: "text" | "image_generation";
  attachments?: Array<{
    id: string;
    name: string;
    type?: string;
    mimeType?: string;
    url?: string;
    previewUrl?: string;
  }>;
  imageGeneration?: {
    prompt: string;
    model: string;
    provider: string;
    status: "idle" | "generating" | "completed" | "failed" | "quota_error" | "provider_error";
    assetUrl?: string;
    mimeType?: string;
    aspectRatio?: string;
    width?: number;
    height?: number;
    errorCode?: string;
    error?: any;
  };
  provider?: string;
  model?: string;
  status?: "pending" | "streaming" | "complete" | "error";
  error?: string;
  timestamp?: string;
}

interface MessageListProps {
  messages: MessageUI[];
  isStreaming?: boolean;
  onRegenerate?: (messageId: string) => void;
  onRetryImage?: (messageId: string, prompt: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

export function MessageList({
  messages,
  isStreaming,
  onRegenerate,
  onRetryImage,
  onEditMessage,
}: MessageListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (msg: MessageUI) => {
    setEditingMessageId(msg.id);
    setEditText(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editText.trim()) return;
    if (onEditMessage) {
      onEditMessage(msgId, editText.trim());
    }
    setEditingMessageId(null);
    setEditText("");
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-3xl mx-auto w-full">
      {messages.map((msg) => {
        const isUser = msg.role === "user";
        const isCopied = copiedId === msg.id;
        const isEditing = editingMessageId === msg.id;
        const isImageGen = msg.type === "image_generation" || Boolean(msg.imageGeneration);

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3.5 group animate-fade-in ${
              isUser ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar Badge */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
                isUser
                  ? "bg-surface border-borderSubtle text-textPrimary"
                  : "bg-emerald-950/60 border-emerald-800/60 text-emerald-400"
              }`}
            >
              {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>

            {/* Content Area */}
            <div className={`flex-1 min-w-0 ${isUser ? "text-right" : "text-left"}`}>
              {/* Header meta */}
              <div
                className={`flex items-center gap-2 mb-1.5 text-xs text-textMuted ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                <span className="font-semibold text-textPrimary">
                  {isUser
                    ? "You"
                    : isImageGen
                    ? `${msg.imageGeneration?.provider === "huggingface" ? "Hugging Face" : "Google"} (${msg.imageGeneration?.model || "FLUX.1-schnell"})`
                    : msg.provider
                    ? `${msg.provider} (${msg.model || "default"})`
                    : "OmniChat"}
                </span>
                {msg.timestamp && <span>• {msg.timestamp}</span>}
              </div>

              {/* Message Content */}
              {isUser ? (
                isEditing ? (
                  /* User Inline Message Editor */
                  <div className="w-full max-w-[90%] ml-auto bg-cardBg border border-emerald-500/50 p-3 rounded-2xl space-y-2 text-left shadow-lg">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full bg-surface border border-borderSubtle rounded-xl p-2.5 text-sm text-textPrimary focus:outline-none focus:border-emerald-500 resize-none"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 rounded-lg border border-borderSubtle text-xs text-textMuted hover:text-textPrimary hover:bg-surfaceHover transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(msg.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal User Message Bubble with Attachment Cards */
                  <div className="inline-block relative group/user text-right">
                    <div className="flex flex-col items-end gap-1.5 max-w-[85%] ml-auto">
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-2 mb-1">
                          {msg.attachments.map((att: any, idx: number) => (
                            <div
                              key={att.id || idx}
                              className="overflow-hidden rounded-2xl border border-borderSubtle bg-cardBg shadow-sm max-w-[220px]"
                            >
                              {att.type === "image" || (att.mimeType && att.mimeType.startsWith("image/")) ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={att.url || att.previewUrl}
                                  alt={att.name || "Attached Image"}
                                  className="w-full max-h-48 object-cover rounded-2xl"
                                />
                              ) : (
                                <div className="flex items-center gap-2 p-2.5 text-xs text-textPrimary">
                                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                  <span className="truncate">{att.name || "Attachment"}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="bg-userMsgBg border border-userMsgBorder text-userMsgText px-4 py-2.5 rounded-3xl text-[15px] leading-relaxed text-left break-words shadow-sm w-full">
                        {msg.content}
                      </div>
                    </div>

                    {/* User Action Buttons (Edit, Copy) shown on hover */}
                    <div className="absolute right-0 top-full mt-1 flex items-center gap-1 opacity-0 group-hover/user:opacity-100 transition-opacity z-10">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(msg)}
                        className="p-1.5 rounded-lg bg-surface border border-borderSubtle text-textMuted hover:text-textPrimary hover:bg-surfaceHover transition-colors cursor-pointer"
                        title="Edit message"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1.5 rounded-lg bg-surface border border-borderSubtle text-textMuted hover:text-textPrimary hover:bg-surfaceHover transition-colors cursor-pointer"
                        title="Copy text"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )
              ) : isImageGen && msg.imageGeneration ? (
                <GeneratedImage
                  prompt={msg.imageGeneration.prompt}
                  status={msg.imageGeneration.status}
                  assetUrl={msg.imageGeneration.assetUrl}
                  model={msg.imageGeneration.model}
                  provider={msg.imageGeneration.provider}
                  errorCode={msg.imageGeneration.errorCode}
                  error={msg.imageGeneration.error}
                  onRegenerate={() => onRegenerate?.(msg.id)}
                  onRetry={() => onRetryImage?.(msg.id, msg.imageGeneration?.prompt || "")}
                />
              ) : (
                <div className="text-textPrimary text-[15px] leading-relaxed w-full">
                  {msg.status === "error" ? (
                    <div className="flex items-center gap-2 text-rose-400 bg-rose-950/30 border border-rose-800/40 p-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        {typeof msg.error === "object" && msg.error !== null
                          ? (msg.error as any).message || JSON.stringify(msg.error)
                          : String(msg.error || "An error occurred generating response.")}
                      </span>
                    </div>
                  ) : (
                    <div>
                      {/* Markdown rendering with real-time streaming cursor */}
                      {msg.status === "streaming" && !msg.content ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono animate-pulse py-1">
                          <Sparkles className="w-4 h-4 animate-spin text-emerald-500" />
                          <span>Thinking...</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <MarkdownRenderer content={msg.content} />
                          {msg.status === "streaming" && (
                            <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1 align-middle rounded-xs" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Assistant Message Actions Toolbar for Normal Text Messages */}
              {!isUser && !isImageGen && msg.status !== "error" && msg.status !== "streaming" && (
                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="p-1 rounded-md text-textMuted hover:text-textPrimary hover:bg-surfaceHover transition-colors cursor-pointer"
                    title="Copy text"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {onRegenerate && (
                    <button
                      onClick={() => onRegenerate(msg.id)}
                      className="p-1 rounded-md text-textMuted hover:text-textPrimary hover:bg-surfaceHover transition-colors cursor-pointer"
                      title="Regenerate response"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    className="p-1 rounded-md text-textMuted hover:text-textPrimary hover:bg-surfaceHover transition-colors cursor-pointer"
                    title="More actions"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
