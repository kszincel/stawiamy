"use client";

import { useState } from "react";

interface Props {
  projectId: string;
  artifact: string;
}

function tryParseJSON(s: string): unknown | null {
  try {
    return JSON.parse(s);
  } catch {
    // Try extracting first {...} or [...] block
    const match = s.match(/[\{\[][\s\S]*[\}\]]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export default function ArtifactViewer({ projectId, artifact }: Props) {
  const [copied, setCopied] = useState(false);

  const parsed = tryParseJSON(artifact);
  const isParsedJSON = parsed !== null;
  // Detect if it LOOKS like JSON (starts with { or [) even if not parseable
  const trimmed = artifact.trim();
  const looksLikeJSON = trimmed.startsWith("{") || trimmed.startsWith("[");
  const treatAsJSON = isParsedJSON || looksLikeJSON;
  const display = isParsedJSON ? JSON.stringify(parsed, null, 2) : artifact;

  function downloadAs(filename: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function copyContent() {
    await navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={copyContent}
          className="rounded-full bg-[#1a1a1a] border border-[#484847] hover:border-[#81ecff] text-white text-xs font-medium px-4 py-2 transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">
            {copied ? "check" : "content_copy"}
          </span>
          {copied ? "Skopiowane" : "Kopiuj"}
        </button>
        <button
          onClick={() =>
            downloadAs(
              treatAsJSON ? `${projectId}-workflow.json` : `${projectId}-spec.md`,
              display,
              treatAsJSON ? "application/json" : "text/markdown"
            )
          }
          className="rounded-full bg-[#c3f400] text-[#0e0e0e] text-xs font-bold px-4 py-2 hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Pobierz {treatAsJSON ? "JSON" : "MD"}
        </button>
        {isParsedJSON && (
          <span className="text-[10px] uppercase tracking-wider text-[#c3f400] bg-[#c3f400]/10 border border-[#c3f400]/30 px-2 py-1 rounded-full font-bold">
            n8n workflow ✓
          </span>
        )}
        {treatAsJSON && !isParsedJSON && (
          <span className="text-[10px] uppercase tracking-wider text-[#ff716c] bg-[#ff716c]/10 border border-[#ff716c]/30 px-2 py-1 rounded-full font-bold">
            JSON z błędami - sprawdź ręcznie
          </span>
        )}
      </div>
      <pre className="rounded-[0.5rem] bg-[#0e0e0e] border border-[#484847]/50 p-4 text-xs text-white whitespace-pre-wrap font-mono overflow-x-auto max-h-[500px] overflow-y-auto">
        {display}
      </pre>
    </div>
  );
}
