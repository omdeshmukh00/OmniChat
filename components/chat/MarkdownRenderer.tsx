"use client";

import React, { useState, useRef } from "react";
import { Copy, Check, ExternalLink, Globe } from "lucide-react";
import katex from "katex";

interface MarkdownRendererProps {
  content: string;
}

function LinkHoverPreview({
  href,
  linkText,
  displayUrl,
}: {
  href: string;
  linkText: string;
  displayUrl?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  let domain = "";
  try {
    const urlObj = new URL(href);
    domain = urlObj.hostname;
  } catch {
    domain = href;
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const cleanUrl = displayUrl || href;

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-500 dark:text-emerald-400 hover:underline font-medium hover:opacity-90 inline-flex items-center gap-1 cursor-pointer break-all"
        onClick={(e) => e.stopPropagation()}
      >
        <span>{linkText}</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-75 inline shrink-0" />
      </a>

      {/* ChatGPT-style Floating Hover Modal / Popover */}
      {isHovered && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#1e1e20] border border-[#333336] text-xs text-textPrimary shadow-2xl animate-fade-in pointer-events-auto whitespace-nowrap"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Domain Favicon */}
          <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-surface">
            {!faviconError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={faviconUrl}
                alt={domain}
                className="w-3.5 h-3.5 object-contain"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>

          {/* Clean Truncated URL */}
          <span className="truncate max-w-[220px] md:max-w-[280px] font-mono text-[11.5px] text-textSecondary">
            {cleanUrl}
          </span>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-md hover:bg-[#2c2c30] text-textMuted hover:text-textPrimary transition-colors cursor-pointer shrink-0 ml-0.5"
            title="Copy link address"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
    </span>
  );
}

function MathBlock({ math, displayMode }: { math: string; displayMode: boolean }) {
  try {
    const html = katex.renderToString(math.trim(), {
      displayMode,
      throwOnError: false,
    });
    return (
      <span
        dangerouslySetInnerHTML={{ __html: html }}
        className={
          displayMode
            ? "block my-3 text-center overflow-x-auto py-1 text-textPrimary"
            : "inline-block px-0.5 align-middle text-textPrimary"
        }
      />
    );
  } catch (error) {
    return <code className="font-mono text-xs text-emerald-400">{math}</code>;
  }
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-borderSubtle bg-codeBg text-xs font-mono">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-borderSubtle text-textMuted">
        <span className="text-[11px] font-medium tracking-wide uppercase text-emerald-500">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] hover:text-textPrimary transition-colors py-0.5 px-1.5 rounded hover:bg-surfaceHover cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto text-textPrimary leading-relaxed">
        <pre>{code}</pre>
      </div>
    </div>
  );
}

function TableBlock({ rows }: { rows: string[] }) {
  if (rows.length === 0) return null;
  const header = rows[0].split("|").map((cell) => cell.trim()).filter(Boolean);
  const dataRows = rows.slice(2).map((row) =>
    row.split("|").map((cell) => cell.trim()).filter(Boolean)
  );

  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-borderSubtle">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-surface text-textPrimary font-semibold border-b border-borderSubtle">
          <tr>
            {header.map((col, idx) => (
              <th key={idx} className="px-3 py-2 border-r border-borderSubtle last:border-r-0">
                {parseInlineFormatting(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-borderSubtle text-textSecondary">
          {dataRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-surfaceHover">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-2 border-r border-borderSubtle last:border-r-0">
                  {parseInlineFormatting(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // 1. Split content into code blocks vs text
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(renderNonCodeSection(textBefore, `text-${lastIndex}`));
    }
    const lang = match[1];
    const code = match[2];
    parts.push(<CodeBlock key={`code-${match.index}`} language={lang} code={code} />);
    lastIndex = codeBlockRegex.lastIndex;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(renderNonCodeSection(remainingText, `text-${lastIndex}`));
  }

  return <div className="space-y-2.5 text-[15px] leading-relaxed break-words">{parts}</div>;
}

function renderNonCodeSection(text: string, keyPrefix: string): React.ReactNode {
  // Extract display block math ($$...$$ or \[...\]) before splitting lines
  const elements: React.ReactNode[] = [];
  const displayMathRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\])/g;

  const segments = text.split(displayMathRegex);

  segments.forEach((seg, idx) => {
    if (!seg) return;

    if ((seg.startsWith("$$") && seg.endsWith("$$")) || (seg.startsWith("\\[") && seg.endsWith("\\]"))) {
      const mathContent = seg.startsWith("$$") ? seg.slice(2, -2) : seg.slice(2, -2);
      elements.push(
        <MathBlock key={`${keyPrefix}-displaymath-${idx}`} math={mathContent} displayMode={true} />
      );
    } else {
      elements.push(renderFormattedText(seg, `${keyPrefix}-seg-${idx}`));
    }
  });

  return <React.Fragment key={keyPrefix}>{elements}</React.Fragment>;
}

function renderFormattedText(text: string, keyPrefix: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let tableRows: string[] = [];

  lines.forEach((line, idx) => {
    // Check if table row
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      tableRows.push(line.trim());
      return;
    } else if (tableRows.length > 0) {
      elements.push(<TableBlock key={`${keyPrefix}-table-${idx}`} rows={[...tableRows]} />);
      tableRows = [];
    }

    // Headers
    if (line.trim().startsWith("### ")) {
      elements.push(
        <h3 key={`${keyPrefix}-h3-${idx}`} className="text-base font-semibold text-textPrimary mt-3 mb-1">
          {parseInlineFormatting(line.trim().substring(4))}
        </h3>
      );
      return;
    }

    if (line.trim().startsWith("## ")) {
      elements.push(
        <h2 key={`${keyPrefix}-h2-${idx}`} className="text-lg font-semibold text-textPrimary mt-4 mb-1">
          {parseInlineFormatting(line.trim().substring(3))}
        </h2>
      );
      return;
    }

    if (line.trim().startsWith("# ")) {
      elements.push(
        <h1 key={`${keyPrefix}-h1-${idx}`} className="text-xl font-bold text-textPrimary mt-4 mb-1">
          {parseInlineFormatting(line.trim().substring(2))}
        </h1>
      );
      return;
    }

    // Bullet list
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const listContent = line.trim().substring(2);
      elements.push(
        <div key={`${keyPrefix}-list-${idx}`} className="flex items-start gap-2 pl-2 my-1 text-textPrimary">
          <span className="text-emerald-500 font-bold">•</span>
          <span className="flex-1">{parseInlineFormatting(listContent)}</span>
        </div>
      );
      return;
    }

    // Numbered list
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`${keyPrefix}-numlist-${idx}`} className="flex items-start gap-2 pl-2 my-1 text-textPrimary">
          <span className="text-emerald-500 font-semibold">{numMatch[1]}.</span>
          <span className="flex-1">{parseInlineFormatting(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Blockquote
    if (line.trim().startsWith("> ")) {
      elements.push(
        <blockquote
          key={`${keyPrefix}-quote-${idx}`}
          className="pl-3 py-1 my-1.5 border-l-2 border-emerald-500/60 bg-surface text-textMuted italic rounded-r"
        >
          {parseInlineFormatting(line.trim().substring(2))}
        </blockquote>
      );
      return;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={`${keyPrefix}-space-${idx}`} className="h-1.5" />);
      return;
    }

    // Regular line
    elements.push(
      <p key={`${keyPrefix}-p-${idx}`} className="my-0.5 text-textPrimary leading-relaxed">
        {parseInlineFormatting(line)}
      </p>
    );
  });

  if (tableRows.length > 0) {
    elements.push(<TableBlock key={`${keyPrefix}-table-end`} rows={[...tableRows]} />);
  }

  return <React.Fragment key={keyPrefix}>{elements}</React.Fragment>;
}

function formatUrlWithUtmSource(urlStr: string): string {
  try {
    if (!urlStr || !urlStr.startsWith("http")) return urlStr;
    const urlObj = new URL(urlStr);

    let host = "localhost:3000";
    if (typeof window !== "undefined" && window.location && window.location.host) {
      host = window.location.host;
    }

    urlObj.searchParams.set("utm_source", host);
    return urlObj.toString();
  } catch {
    return urlStr;
  }
}

function parseInlineFormatting(str: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Tokenize Math (\(...$\), $...$), Links [text](url), raw URLs, inline code `code`, bold **text**, and italic *text*
  const inlineRegex = /(\\\(.*?\\\)|(?:\$)[^\$\n]+?\$|\[[^\]]+\]\([\s\S]+?\)|https?:\/\/[^\s<)]+|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const tokens = str.split(inlineRegex);

  tokens.forEach((token, idx) => {
    if (!token) return;

    // 1. Inline Math: \( math \) or $ math $
    if ((token.startsWith("\\(") && token.endsWith("\\)")) || (token.startsWith("$") && token.endsWith("$"))) {
      const math = token.startsWith("\\(") ? token.slice(2, -2) : token.slice(1, -1);
      if (math.trim()) {
        parts.push(<MathBlock key={idx} math={math} displayMode={false} />);
        return;
      }
    }

    // 2. Markdown Links: [Link Title](https://example.com)
    const markdownLinkMatch = token.match(/^\[([\s\S]+?)\]\(([\s\S]+?)\)$/);
    if (markdownLinkMatch) {
      const linkText = markdownLinkMatch[1].trim();
      const rawUrl = markdownLinkMatch[2].trim().replace(/\s+/g, "");
      const linkUrl = formatUrlWithUtmSource(rawUrl);
      parts.push(
        <LinkHoverPreview
          key={idx}
          href={linkUrl}
          linkText={linkText}
          displayUrl={rawUrl}
        />
      );
      return;
    }

    // 3. Raw Plain-Text URLs: https://omni-chat-rosy.vercel.app/...
    if (/^https?:\/\/[^\s<)]+$/.test(token)) {
      const rawUrl = token.trim();
      const cleanUrl = formatUrlWithUtmSource(rawUrl);
      parts.push(
        <LinkHoverPreview
          key={idx}
          href={cleanUrl}
          linkText={rawUrl}
          displayUrl={rawUrl}
        />
      );
      return;
    }

    // 4. Inline Code: `const x = 1;`
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-surface text-emerald-600 dark:text-emerald-300 font-mono text-xs border border-borderSubtle break-all"
        >
          {token.slice(1, -1)}
        </code>
      );
      return;
    }

    // 5. Bold Text: **strong**
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={idx} className="font-semibold text-textPrimary">
          {token.slice(2, -2)}
        </strong>
      );
      return;
    }

    // 6. Italic Text: *emphasis*
    if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={idx} className="italic text-textSecondary">
          {token.slice(1, -1)}
        </em>
      );
      return;
    }

    // 7. Default Text
    parts.push(<span key={idx}>{token}</span>);
  });

  return parts;
}

