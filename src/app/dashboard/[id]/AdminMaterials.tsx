"use client";

import { useState, useRef } from "react";

interface AdminAttachment {
  url: string;
  filename: string;
  size: number;
  type: string;
  uploaded_at: string;
}

interface AdminNote {
  content: string;
  created_at: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fileIcon(type: string): string {
  if (type === "application/pdf") return "picture_as_pdf";
  if (type.startsWith("image/")) return "image";
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv"))
    return "table_chart";
  return "description";
}

export default function AdminMaterials({
  projectId,
  initialAttachments,
  initialNotes,
}: {
  projectId: string;
  initialAttachments: AdminAttachment[];
  initialNotes: AdminNote[];
}) {
  const [attachments, setAttachments] = useState<AdminAttachment[]>(initialAttachments);
  const [notes, setNotes] = useState<AdminNote[]>(initialNotes);
  const [uploading, setUploading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/project/${projectId}/admin-attachments`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Upload failed");
        return;
      }
      const attachment = await res.json();
      setAttachments((prev) => [...prev, attachment]);
    } finally {
      setUploading(false);
    }
  }

  async function removeFile(url: string) {
    const res = await fetch(`/api/project/${projectId}/admin-attachments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      setAttachments((prev) => prev.filter((a) => a.url !== url));
    }
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/project/${projectId}/admin-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Nie udało się dodać notatki");
        return;
      }
      const note = await res.json();
      setNotes((prev) => [...prev, note]);
      setNoteText("");
    } finally {
      setSavingNote(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFile(files[0]);
  }

  return (
    <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-6 space-y-6">
      <h2 className="text-xs font-bold text-[#adaaaa] uppercase tracking-wider">
        Materiały admina
      </h2>

      {/* File upload */}
      <div>
        <div
          className={`rounded-[0.5rem] border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-[#c3f400] bg-[#c3f400]/10"
              : "border-[#484847] hover:border-[#81ecff]/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="material-symbols-outlined text-2xl text-[#adaaaa] mb-2 block">
            upload_file
          </span>
          <div className="text-sm text-[#adaaaa]">
            {uploading ? "Uploadowanie..." : "Przeciągnij plik lub kliknij"}
          </div>
          <div className="text-xs text-[#484847] mt-1">PDF, obrazy, dokumenty, CSV, ZIP (max 20 MB)</div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Uploaded files list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-[#adaaaa] uppercase tracking-wider mb-2">
            Pliki ({attachments.length})
          </div>
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-[0.5rem] border border-[#484847]/50 bg-[#0e0e0e] px-4 py-3"
            >
              <span className="material-symbols-outlined text-[#81ecff] text-lg">
                {fileIcon(att.type)}
              </span>
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white hover:text-[#81ecff] transition-colors flex-1 truncate"
              >
                {att.filename}
              </a>
              <span className="text-xs text-[#484847] shrink-0">
                {formatFileSize(att.size)}
              </span>
              {att.uploaded_at && (
                <span className="text-xs text-[#484847] shrink-0 hidden sm:inline">
                  {formatDate(att.uploaded_at)}
                </span>
              )}
              <button
                onClick={() => removeFile(att.url)}
                className="text-[#484847] hover:text-[#ff716c] transition-colors shrink-0"
                title="Usuń"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Admin notes */}
      <div className="border-t border-[#484847]/30 pt-6 space-y-4">
        <div className="text-xs text-[#adaaaa] uppercase tracking-wider">Notatki</div>

        {notes.length > 0 && (
          <div className="space-y-3">
            {notes.map((n, i) => (
              <div
                key={i}
                className="rounded-[0.5rem] border border-[#81ecff]/30 bg-[#0e0e0e] p-4"
              >
                <div className="text-xs text-[#81ecff] uppercase tracking-wider mb-2">
                  {formatDate(n.created_at)}
                </div>
                <div className="text-sm text-white whitespace-pre-wrap">{n.content}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Dodaj notatkę do projektu..."
            rows={2}
            className="flex-1 rounded-[0.5rem] border border-[#484847] bg-[#0e0e0e] px-4 py-3 text-sm text-white placeholder-[#484847] resize-none focus:outline-none focus:border-[#81ecff]/50"
          />
          <button
            onClick={addNote}
            disabled={savingNote || !noteText.trim()}
            className="self-end px-4 py-3 rounded-[0.5rem] bg-[#81ecff] text-[#0e0e0e] text-sm font-bold hover:bg-[#81ecff]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {savingNote ? "..." : "Dodaj"}
          </button>
        </div>
      </div>
    </div>
  );
}
