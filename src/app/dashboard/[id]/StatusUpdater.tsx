"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATUS_LABELS, ProjectStatus } from "../status";

const ORDER: ProjectStatus[] = [
  "preview_generating",
  "preview_ready",
  "finalized",
  "deposit_paid",
  "in_progress",
  "delivered",
  "cancelled",
];

export default function StatusUpdater({
  projectId,
  currentStatus,
}: {
  projectId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function update(next: string) {
    setSaving(true);
    setError("");
    setToast("");
    try {
      const res = await fetch(`/api/project/${projectId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Błąd serwera (${res.status})`);
      } else {
        setStatus(next);
        setToast(
          next === "deposit_paid"
            ? "Status zaktualizowany. Agent AI uruchomiony."
            : "Status zaktualizowany."
        );
        router.refresh();
        setTimeout(() => setToast(""), 3000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nieoczekiwany błąd");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-xs font-medium text-[#adaaaa] uppercase tracking-wider">
          Zmień status
        </div>
        <span className="rounded-full bg-[#c3f400]/10 border border-[#c3f400]/40 px-2 py-0.5 text-[10px] font-bold text-[#c3f400] uppercase tracking-wider">
          Admin
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ORDER.map((s) => (
          <button
            key={s}
            onClick={() => update(s)}
            disabled={saving || s === status}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer disabled:cursor-default ${
              s === status
                ? "bg-[#81ecff]/10 border-[#81ecff] text-[#81ecff]"
                : "bg-[#1a1a1a] border-[#484847] text-white hover:bg-[#262626]"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {error && (
        <div className="text-xs text-[#ff716c]">{error}</div>
      )}
      {toast && (
        <div className="text-xs text-[#c3f400]">{toast}</div>
      )}
    </div>
  );
}
