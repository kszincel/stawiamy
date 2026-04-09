"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteProject({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/project/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Nie udało się usunąć projektu");
        setDeleting(false);
        setConfirming(false);
      }
    } catch {
      alert("Błąd sieci");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1 text-xs text-[#ff716c] hover:text-[#ff716c]/80 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">delete</span>
        Usuń projekt
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#ff716c]">Na pewno?</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded px-3 py-1 text-xs bg-[#ff716c] text-white font-bold hover:opacity-90 disabled:opacity-50"
      >
        {deleting ? "Usuwam..." : "Tak, usuń"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded px-3 py-1 text-xs border border-[#484847] text-[#adaaaa] hover:text-white"
      >
        Anuluj
      </button>
    </div>
  );
}
