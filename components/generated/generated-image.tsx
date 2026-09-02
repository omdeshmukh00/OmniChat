"use client";

import { useState } from "react";
import { Sparkles, Download, Copy, RefreshCw, AlertCircle, Check, MoreHorizontal, ChevronDown, ChevronUp, FileText } from "lucide-react";

export interface GeneratedImageProps {
  prompt: string;
  status: "idle" | "generating" | "completed" | "failed" | "quota_error" | "provider_error";
  assetUrl?: string;
  mimeType?: string;
  model?: string;
  provider?: string;
  errorCode?: string;
  error?: any;
  onRegenerate?: () => void;
  onRetry?: () => void;
}

export function GeneratedImage({
  prompt,
  status,
  assetUrl,
  mimeType = "image/jpeg",
  model = "black-forest-labs/FLUX.1-schnell",
  provider = "huggingface",
  errorCode,
  error,
  onRegenerate,
  onRetry,
}: GeneratedImageProps) {
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showDevDetails, setShowDevDetails] = useState(false);

  const handleDownload = async () => {
    if (!assetUrl) return;
    try {
      const response = await fetch(assetUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `omnichat-flux-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement("a");
      link.href = assetUrl;
      link.download = "generated-image.jpg";
      link.target = "_blank";
      link.click();
    }
  };

  const handleCopyImageLink = async () => {
    if (!assetUrl) return;
    try {
      const fullUrl = assetUrl.startsWith("http")
        ? assetUrl
        : `${window.location.origin}${assetUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Copy image link error:", err);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {}
  };

  // 1. GENERATING / SKELETON STATE
  if (status === "generating" || status === "idle") {
    return (
      <div className="w-full max-w-lg rounded-2xl bg-cardBg border border-cardBorder p-4 space-y-3 shadow-md animate-fade-in select-none">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-500">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Creating image with FLUX.1-schnell…</span>
        </div>

        {/* Polished Skeleton Image Container */}
        <div className="w-full aspect-square rounded-xl bg-surface border border-borderSubtle relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surfaceHover/40 to-transparent animate-pulse" />
          <Sparkles className="w-8 h-8 text-emerald-500/40 animate-pulse" />
          <span className="text-xs text-textMuted mt-2 font-mono">
            {model}
          </span>
        </div>

        <div className="text-xs text-textMuted italic truncate">
          Prompt: &quot;{prompt}&quot;
        </div>
      </div>
    );
  }

  // 2. ERROR STATE (QUOTA / PROVIDER FAILURE)
  if (status === "failed" || status === "quota_error" || status === "provider_error" || errorCode === "IMAGE_PROVIDER_QUOTA") {
    const isQuota = errorCode === "IMAGE_PROVIDER_QUOTA" || status === "quota_error";

    const titleText = isQuota
      ? "Image generation quota reached"
      : "Image generation failed";

    const mainErrorMsg = typeof error === "object" && error !== null
      ? (error as any).message || JSON.stringify(error)
      : String(error || "An unexpected error occurred while generating the image. Please try again.");

    const secondaryGuidance = "Verify provider credentials or retry generation.";

    const rawErrorString = typeof error === "object" && error !== null ? JSON.stringify(error, null, 2) : String(error || "");

    return (
      <div className="w-full max-w-lg rounded-2xl bg-cardBg border border-rose-900/40 p-4 space-y-3 shadow-md animate-fade-in select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-400">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{titleText}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surfaceHover border border-borderSubtle text-xs font-semibold text-textPrimary transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-textPrimary leading-relaxed">{mainErrorMsg}</p>
          <p className="text-[11px] text-textMuted">{secondaryGuidance}</p>
        </div>

        {/* Collapsible Developer Details */}
        <div className="pt-2 border-t border-borderSubtle/60">
          <button
            onClick={() => setShowDevDetails(!showDevDetails)}
            className="flex items-center gap-1 text-[11px] font-mono text-textMuted hover:text-textPrimary transition-colors cursor-pointer"
          >
            {showDevDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <span>Developer Details</span>
          </button>

          {showDevDetails && (
            <div className="mt-2 p-2.5 rounded-lg bg-surface/60 border border-borderSubtle text-[10px] font-mono text-textMuted space-y-1 overflow-x-auto">
              <div>Provider: Hugging Face</div>
              <div>Model: {model}</div>
              {errorCode && <div>Error Code: {errorCode}</div>}
              {rawErrorString && (
                <pre className="whitespace-pre-wrap break-all text-[10px] opacity-80 pt-1 border-t border-borderSubtle/40">
                  {rawErrorString}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. COMPLETED STATE WITH REAL GENERATED IMAGE
  return (
    <div className="w-full max-w-lg rounded-2xl bg-cardBg border border-cardBorder p-4 space-y-3.5 shadow-lg animate-fade-in select-none">
      <div className="flex items-center justify-between text-xs text-textMuted border-b border-borderSubtle pb-2">
        <div className="flex items-center gap-2 font-medium text-textPrimary">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>Generated image</span>
        </div>
        <span className="font-mono text-[11px] bg-surface px-2 py-0.5 rounded border border-borderSubtle">
          {model}
        </span>
      </div>

      {/* Render Actual Image */}
      <div className="w-full rounded-xl overflow-hidden border border-borderSubtle bg-black/40 flex items-center justify-center">
        {assetUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={assetUrl}
            alt={prompt || "Generated AI image"}
            className="w-full h-auto object-cover max-h-[512px] rounded-xl transition-all"
            loading="lazy"
          />
        ) : (
          <div className="p-8 text-center text-xs text-textMuted">
            Image unavailable
          </div>
        )}
      </div>

      {/* Prompt Label */}
      <div className="text-xs text-textMuted leading-relaxed">
        <span className="font-semibold text-textPrimary">Prompt:</span> &quot;{prompt}&quot;
      </div>

      {/* Action Toolbar: Download, Copy, Regenerate, More */}
      <div className="flex items-center justify-between pt-1 border-t border-borderSubtle">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surfaceHover border border-borderSubtle text-xs font-semibold text-textPrimary transition-colors cursor-pointer"
            title="Download image file"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Download</span>
          </button>

          <button
            onClick={handleCopyImageLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surfaceHover border border-borderSubtle text-xs font-semibold text-textPrimary transition-colors cursor-pointer"
            title="Copy direct image URL"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-textMuted" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5 relative">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surfaceHover border border-borderSubtle text-xs font-semibold text-textPrimary transition-colors cursor-pointer"
              title="Regenerate image"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
              <span>Regenerate</span>
            </button>
          )}

          <button
            onClick={() => setShowMore(!showMore)}
            className="p-1.5 rounded-lg bg-surface hover:bg-surfaceHover border border-borderSubtle text-textMuted hover:text-textPrimary transition-colors cursor-pointer"
            title="More actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMore && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-dropdownBg border border-borderSubtle rounded-xl shadow-xl p-1.5 z-30 animate-fade-in text-xs space-y-1">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surfaceHover flex items-center gap-2 text-textPrimary transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>{copiedPrompt ? "Prompt Copied!" : "Copy Prompt Text"}</span>
              </button>
              <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-textMuted border-t border-borderSubtle pt-1 mt-1">
                Asset Metadata
              </div>
              <div className="px-2.5 py-0.5 text-textMuted truncate text-[11px]">
                Format: {mimeType}
              </div>
              <div className="px-2.5 py-0.5 text-textMuted truncate text-[11px]">
                Provider: Hugging Face
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
