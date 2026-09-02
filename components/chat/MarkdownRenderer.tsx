"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
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
          className="flex items-center gap-1 text-[11px] hover:text-textPrimary transition-colors py-0.5 px-1.5 rounded hover:bg-surfaceHover"
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
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-borderSubtle text-textSecondary">
          {dataRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-surfaceHover">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-2 border-r border-borderSubtle last:border-r-0">
                  {cell}
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

  // Split content into code blocks vs standard text
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(renderFormattedText(textBefore, `text-${lastIndex}`));
    }
    const lang = match[1];
    const code = match[2];
    parts.push(<CodeBlock key={`code-${match.index}`} language={lang} code={code} />);
    lastIndex = codeBlockRegex.lastIndex;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(renderFormattedText(remainingText, `text-${lastIndex}`));
  }

  return <div className="space-y-2.5 text-[15px] leading-relaxed">{parts}</div>;
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

    // Bullet list
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const listContent = line.trim().substring(2);
      elements.push(
        <div key={`${keyPrefix}-list-${idx}`} className="flex items-start gap-2 pl-2 my-1 text-textPrimary">
          <span className="text-emerald-500 font-bold">•</span>
          <span>{parseInlineFormatting(listContent)}</span>
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
          <span>{parseInlineFormatting(numMatch[2])}</span>
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
      <p key={`${keyPrefix}-p-${idx}`} className="my-0.5 text-textPrimary">
        {parseInlineFormatting(line)}
      </p>
    );
  });

  if (tableRows.length > 0) {
    elements.push(<TableBlock key={`${keyPrefix}-table-end`} rows={[...tableRows]} />);
  }

  return <React.Fragment key={keyPrefix}>{elements}</React.Fragment>;
}

function parseInlineFormatting(str: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const tokens = str.split(inlineRegex);

  tokens.forEach((token, idx) => {
    if (!token) return;
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-surface text-emerald-600 dark:text-emerald-300 font-mono text-xs border border-borderSubtle"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={idx} className="font-semibold text-textPrimary">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={idx} className="italic text-textSecondary">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      parts.push(<span key={idx}>{token}</span>);
    }
  });

  return parts;
}
