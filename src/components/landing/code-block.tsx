"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyToClipboard, cn } from "@/lib/utils";

const KEYWORDS =
  /\b(import|from|export|const|let|new|await|async|if|else|return|throw|interface|type|class|extends|function)\b/;
const TOKEN_RE = new RegExp(
  `(//.*$)|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')|(${KEYWORDS.source})|(\\b\\d+(?:\\.\\d+)?\\b)`,
  "gm",
);

function highlight(line: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of line.matchAll(TOKEN_RE)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(line.slice(last, start));
    const [full, comment, string, keyword, , number] = m;
    if (comment)
      parts.push(
        <span key={key++} className="text-muted/70 italic">
          {full}
        </span>,
      );
    else if (string)
      parts.push(
        <span key={key++} className="text-success">
          {full}
        </span>,
      );
    else if (keyword)
      parts.push(
        <span key={key++} className="text-brand-muted">
          {full}
        </span>,
      );
    else if (number)
      parts.push(
        <span key={key++} className="text-warning">
          {full}
        </span>,
      );
    last = start + full.length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

/** Syntax-tinted code snippet with a copy button — no external highlighter dependency. */
export function CodeBlock({
  code,
  label,
  className,
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className={cn("border-border bg-surface overflow-hidden rounded-lg border", className)}>
      <div className="border-border/70 flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-muted font-mono text-[11px] tracking-wide">
          {label ?? "TypeScript"}
        </span>
        <button
          type="button"
          data-cursor
          onClick={onCopy}
          className="text-muted hover:text-foreground flex items-center gap-1.5 text-[12px] transition-colors"
        >
          {copied ? (
            <>
              <Check className="text-success size-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-[1.65]">
        <code className="font-mono">
          {code.split("\n").map((line, i) => (
            <div key={i} className="whitespace-pre">
              {highlight(line) || " "}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
