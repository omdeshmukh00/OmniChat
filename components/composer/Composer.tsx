"use client";

import { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from "react";
import {
  Plus,
  Mic,
  ArrowUp,
  X,
  FileText,
  Palette,
  Globe,
  Square,
  RectangleHorizontal,
  RectangleVertical,
} from "lucide-react";
import { ComposerPlusMenu } from "./ComposerPlusMenu";

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
}

interface ComposerProps {
  onSend: (text: string, mode: string, files: AttachedFile[]) => void;
  onStopStream?: () => void;
  isStreaming?: boolean;
  externalMode?: "chat" | "image" | "search";
  externalInput?: string;
}

export function Composer({
  onSend,
  onStopStream,
  isStreaming,
  externalMode = "chat",
  externalInput,
}: ComposerProps) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"chat" | "image" | "search">("chat");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Sync external mode selection (e.g. from welcome cards or plus menu)
  useEffect(() => {
    if (externalMode) {
      setMode(externalMode);
      textareaRef.current?.focus();
    }
  }, [externalMode]);

  // Sync external input text if provided
  useEffect(() => {
    if (externalInput !== undefined) {
      setInput(externalInput);
      textareaRef.current?.focus();
    }
  }, [externalInput]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) {
        if (onStopStream) onStopStream();
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (isStreaming) {
      if (onStopStream) onStopStream();
      return;
    }
    if (!input.trim() && attachedFiles.length === 0) return;
    const finalMode = mode === "image" ? `image_${aspectRatio}` : mode;
    onSend(input, finalMode, attachedFiles);
    setInput("");
    setAttachedFiles([]);
    setMode("chat"); // Reset mode to AUTO / chat after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSelectPlusOption = (optionId: string) => {
    if (optionId === "add_files") {
      fileInputRef.current?.click();
      textareaRef.current?.focus();
    } else if (optionId === "create_image") {
      setMode("image");
      textareaRef.current?.focus();
    } else if (optionId === "web_search") {
      setMode("search");
      textareaRef.current?.focus();
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const f of Array.from(files)) {
      const localFile: AttachedFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: f.name,
        type: f.type,
        size: f.size,
        previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      };

      setAttachedFiles((prev) => [...prev, localFile]);

      try {
        const formData = new FormData();
        formData.append("file", f);

        const res = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setAttachedFiles((prev) =>
            prev.map((item) =>
              item.id === localFile.id ? { ...item, id: data.file.id } : item
            )
          );
        }
      } catch (err) {
        console.warn("File upload notice:", err);
      }
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          const chunks: Blob[] = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };

          mediaRecorder.onstop = async () => {
            stream.getTracks().forEach((track) => track.stop());
            const audioBlob = new Blob(chunks, { type: "audio/webm" });
            setRecordingStatus("Transcribing...");
            try {
              const formData = new FormData();
              formData.append("audio", audioBlob, "recording.webm");

              const res = await fetch("/api/audio/transcribe", {
                method: "POST",
                body: formData,
              });

              if (res.ok) {
                const data = await res.json();
                if (data.text) {
                  setInput((prev) => (prev ? `${prev} ${data.text}` : data.text));
                }
              }
            } catch (err) {
              console.warn("Transcription error:", err);
            } finally {
              setRecordingStatus("");
              setIsRecording(false);
            }
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingStatus("Listening...");
        } else {
          setIsRecording(true);
          setRecordingStatus("Voice input active...");
          setTimeout(() => {
            setIsRecording(false);
            setRecordingStatus("");
            if (!input.trim()) {
              setInput("Summarize key takeaways from the latest research paper.");
            }
          }, 2500);
        }
      } catch (err) {
        console.warn("Microphone access error:", err);
        setIsRecording(false);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canSubmit = Boolean(input.trim() || attachedFiles.length > 0);

  const placeholderText =
    mode === "image"
      ? "Describe the image you want to create..."
      : mode === "search"
      ? "Search the web..."
      : attachedFiles.length > 0
      ? "Ask about your files..."
      : "Ask anything";

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4 select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        accept="image/*,.pdf,.docx,.txt,.csv,.xlsx"
      />

      <div className="relative bg-inputBg border border-inputBorder focus-within:border-borderStrong rounded-3xl p-2.5 sm:p-3 shadow-2xl transition-all">
        {/* Mode Pill Badges */}
        {mode !== "chat" && (
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/70 text-emerald-400 flex items-center gap-1.5 shadow-sm">
                {mode === "image" ? (
                  <>
                    <Palette className="w-3.5 h-3.5" />
                    <span>Create image</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>Web Search</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setMode("chat")}
                  className="hover:opacity-80 ml-1 text-emerald-300 focus:outline-none cursor-pointer"
                  title="Reset to standard chat"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>

              {/* Aspect ratio selector for image mode */}
              {mode === "image" && (
                <div className="flex items-center gap-1 bg-surface border border-borderSubtle rounded-full px-1.5 py-0.5 text-[10px] text-textMuted">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("1:1")}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-colors focus:outline-none cursor-pointer ${
                      aspectRatio === "1:1" ? "bg-surfaceHover text-textPrimary" : "hover:text-textPrimary"
                    }`}
                  >
                    <Square className="w-2.5 h-2.5" />
                    <span>1:1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio("16:9")}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-colors focus:outline-none cursor-pointer ${
                      aspectRatio === "16:9" ? "bg-surfaceHover text-textPrimary" : "hover:text-textPrimary"
                    }`}
                  >
                    <RectangleHorizontal className="w-2.5 h-2.5" />
                    <span>16:9</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio("9:16")}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-colors focus:outline-none cursor-pointer ${
                      aspectRatio === "9:16" ? "bg-surfaceHover text-textPrimary" : "hover:text-textPrimary"
                    }`}
                  >
                    <RectangleVertical className="w-2.5 h-2.5" />
                    <span>9:16</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attached File Cards */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 bg-surface border border-borderSubtle rounded-xl px-2.5 py-1 text-xs text-textPrimary shadow-sm"
              >
                {file.previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={file.previewUrl}
                    alt={file.name}
                    className="w-5 h-5 rounded object-cover"
                  />
                ) : (
                  <FileText className="w-4 h-4 text-emerald-500" />
                )}
                <span className="truncate max-w-[120px] font-medium">
                  {file.name}
                </span>
                <span className="text-[10px] text-textMuted">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  className="p-0.5 rounded hover:bg-surfaceHover text-textMuted hover:text-textPrimary transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Audio Recording Banner */}
        {isRecording && (
          <div className="flex items-center gap-2 mb-2 px-2 text-xs text-rose-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{recordingStatus || "Recording audio..."}</span>
          </div>
        )}

        {/* Plus Menu Popover */}
        <ComposerPlusMenu
          isOpen={isPlusMenuOpen}
          onClose={() => setIsPlusMenuOpen(false)}
          onSelectOption={handleSelectPlusOption}
          buttonRef={plusButtonRef}
        />

        {/* Text Input Row */}
        <div className="flex items-end gap-2">
          {/* Plus Button */}
          <button
            ref={plusButtonRef}
            type="button"
            onClick={() => setIsPlusMenuOpen((prev) => !prev)}
            className="p-2 rounded-full text-textMuted hover:text-textPrimary hover:bg-surfaceHover focus:outline-none transition-colors shrink-0 mb-0.5 cursor-pointer"
            title="Add photos, files, or change mode"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            rows={1}
            className="flex-1 bg-transparent text-inputText placeholder-inputPlaceholder text-base resize-none focus:outline-none max-h-48 py-1.5 leading-relaxed"
          />

          {/* Voice Microphone Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2 rounded-full transition-all shrink-0 mb-0.5 focus:outline-none ${
              isRecording
                ? "bg-rose-600 text-white animate-pulse shadow-md cursor-pointer"
                : "text-textMuted hover:text-textPrimary hover:bg-surfaceHover cursor-pointer"
            }`}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send or Stop Button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStream}
              className="p-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-all shrink-0 mb-0.5 shadow-md cursor-pointer flex items-center justify-center"
              title="Stop streaming response"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`p-2 rounded-full transition-all shrink-0 mb-0.5 focus:outline-none ${
                canSubmit
                  ? "bg-textPrimary text-chatbg hover:opacity-90 shadow-md scale-100 cursor-pointer"
                  : "bg-surfaceHover text-textMuted cursor-not-allowed opacity-50"
              }`}
              title="Send message"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
