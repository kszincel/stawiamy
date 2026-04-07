"use client";

import { createClient } from "@/lib/supabase-browser";
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

  async function update(next: string) {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("projects")
      .update({ status: next })
      .eq("id", projectId);
    if (err) {
      setError(err.message);
    } else {
      setStatus(next);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-[#adaaaa] uppercase tracking-wider">
        Zmień status
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
    </div>
  );
}
