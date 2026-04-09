"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ArchiveProject({
  projectId,
  isArchived,
}: {
  projectId: string;
  isArchived: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/project/${projectId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isArchived ? "cancelled" : "archived" }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Nie udało się zmienić statusu");
      }
    } catch {
      alert("Błąd sieci");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs text-[#adaaaa] hover:text-white transition-colors disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-sm">
        {isArchived ? "unarchive" : "archive"}
      </span>
      {loading
        ? "Zmieniam..."
        : isArchived
        ? "Przywróć z archiwum"
        : "Archiwizuj projekt"}
    </button>
  );
}
