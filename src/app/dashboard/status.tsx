export type ProjectStatus =
  | "preview_generating"
  | "preview_ready"
  | "finalized"
  | "deposit_paid"
  | "in_progress"
  | "delivered"
  | "cancelled";

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  preview_generating: "Generowanie podglądu",
  preview_ready: "Podgląd gotowy",
  finalized: "Oczekuje na zaliczkę",
  deposit_paid: "Zaliczka opłacona",
  in_progress: "W realizacji",
  delivered: "Dostarczony",
  cancelled: "Anulowany",
};

export const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
  preview_generating: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", border: "rgba(245,158,11,0.4)" },
  preview_ready: { bg: "rgba(129,236,255,0.1)", text: "#81ecff", border: "rgba(129,236,255,0.4)" },
  finalized: { bg: "rgba(195,244,0,0.1)", text: "#c3f400", border: "rgba(195,244,0,0.4)" },
  deposit_paid: { bg: "rgba(195,244,0,0.1)", text: "#c3f400", border: "rgba(195,244,0,0.4)" },
  in_progress: { bg: "rgba(129,236,255,0.1)", text: "#81ecff", border: "rgba(129,236,255,0.4)" },
  delivered: { bg: "rgba(34,197,94,0.1)", text: "#22c55e", border: "rgba(34,197,94,0.4)" },
  cancelled: { bg: "rgba(255,113,108,0.1)", text: "#ff716c", border: "rgba(255,113,108,0.4)" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = (status as ProjectStatus) in STATUS_LABELS ? (status as ProjectStatus) : "preview_generating";
  const color = STATUS_COLORS[s];
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
      style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
    >
      {STATUS_LABELS[s]}
    </span>
  );
}
