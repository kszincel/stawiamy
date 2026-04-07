"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const URL_REGEX = /https?:\/\/[^\s,;)}\]]+/gi;
const ACCEPT = "image/*,application/pdf,.doc,.docx,.txt,.md";
const MAX_ATTACHMENTS = 5;

export interface Attachment {
  url: string;
  filename: string;
  size: number;
  type: string;
}

interface PendingAttachment extends Partial<Attachment> {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploading: boolean;
  error?: string;
  url?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(type: string) {
  return type.startsWith("image/");
}

export default function ChatInput({
  variant = "hero",
}: {
  variant?: "hero" | "cta";
}) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    const remaining = MAX_ATTACHMENTS - attachments.length;
    const toUpload = files.slice(0, remaining);

    for (const file of toUpload) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setAttachments((prev) => [
        ...prev,
        {
          id,
          filename: file.name,
          size: file.size,
          type: file.type,
          uploading: true,
        },
      ]);

      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, uploading: false, url: data.url }
              : a
          )
        );
      } catch (err) {
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  uploading: false,
                  error:
                    err instanceof Error ? err.message : "Błąd uploadu",
                }
              : a
          )
        );
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;
    if (attachments.some((a) => a.uploading)) return;
    setIsLoading(true);
    setError(null);

    const ready: Attachment[] = attachments
      .filter((a) => a.url && !a.error)
      .map((a) => ({
        url: a.url!,
        filename: a.filename,
        size: a.size,
        type: a.type,
      }));

    const urlMatch = prompt.match(URL_REGEX);
    const detectedUrl = urlMatch ? urlMatch[0] : null;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          attachments: ready.length > 0 ? ready : undefined,
          url: detectedUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Błąd serwera (${res.status})`);
      }

      const data = (await res.json()) as { projectId: string };
      if (!data.projectId) throw new Error("Brak identyfikatora projektu");

      router.push(`/preview?id=${encodeURIComponent(data.projectId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      setIsLoading(false);
    }
  };

  if (variant === "cta") {
    return (
      <div className="flex w-full max-w-xl flex-col gap-2">
        <div className="flex w-full items-center gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Opisz swój pomysł..."
            disabled={isLoading}
            className="flex-1 rounded-full bg-[#1a1a1a] px-6 py-4 text-white placeholder:text-[#adaaaa] outline-none border border-[#484847] focus:border-[#81ecff] transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-full bg-[#81ecff] px-8 py-4 font-semibold text-[#005762] hover:bg-[#00d4ec] transition-colors shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-[#005762] animate-spin" />
                <span>Generuję...</span>
              </>
            ) : (
              "Zbuduj preview"
            )}
          </button>
        </div>
        {error && <p className="text-sm text-[#ff716c] px-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />
      <div className="rounded-[2rem] bg-[#000000] border border-[#484847] p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Strona, aplikacja, automatyzacja, agent AI... Opisz swój pomysł."
          rows={3}
          disabled={isLoading}
          className="w-full resize-none bg-transparent text-white placeholder:text-[#adaaaa] outline-none px-2 py-2 text-base disabled:opacity-50"
        />

        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-2 pb-2">
            {attachments.map((a) => (
              <div
                key={a.id}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                  a.error
                    ? "border-[#ff716c] bg-[#ff716c]/10 text-[#ff716c]"
                    : "border-[#484847] bg-[#1a1a1a] text-white"
                }`}
              >
                {a.uploading ? (
                  <div className="h-3 w-3 rounded-full border-2 border-transparent border-t-[#81ecff] animate-spin" />
                ) : isImage(a.type) ? (
                  <span className="material-symbols-outlined text-sm text-[#81ecff]">
                    image
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-sm text-[#c3f400]">
                    description
                  </span>
                )}
                <span className="max-w-[160px] truncate">{a.filename}</span>
                <span className="text-[#adaaaa]">
                  {formatFileSize(a.size)}
                </span>
                <button
                  onClick={() => removeAttachment(a.id)}
                  className="text-[#adaaaa] hover:text-white cursor-pointer"
                  aria-label="Usuń"
                >
                  &#x2715;
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || attachments.length >= MAX_ATTACHMENTS}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#484847] text-[#adaaaa] hover:border-[#767575] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Dodaj załącznik"
          >
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={isLoading || attachments.some((a) => a.uploading)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#81ecff] text-[#005762] hover:bg-[#00d4ec] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-[#005762] animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-xl">
                  arrow_upward
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-[#ff716c] mt-3 px-2">{error}</p>}
    </div>
  );
}
