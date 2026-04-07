"use client";

import { useState, useTransition } from "react";

interface Props {
  projectId: string;
  actions: string[];
  completed: string[];
  isAdmin: boolean;
}

export default function RecommendedActions({
  projectId,
  actions,
  completed,
  isAdmin,
}: Props) {
  const [done, setDone] = useState<string[]>(completed);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = actions.length;
  const doneCount = actions.filter((a) => done.includes(a)).length;

  const toggle = (action: string) => {
    if (!isAdmin) return;
    const next = done.includes(action)
      ? done.filter((a) => a !== action)
      : [...done, action];
    setDone(next);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/project/${projectId}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: next }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Błąd zapisu");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Błąd zapisu");
        // revert
        setDone(done);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-[#adaaaa]">
          {doneCount} / {total} zrobione
        </div>
        {isPending && (
          <div className="text-xs text-[#81ecff]">zapisywanie…</div>
        )}
      </div>
      <div className="h-1 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
        <div
          className="h-full bg-[#c3f400] transition-all"
          style={{ width: total > 0 ? `${(doneCount / total) * 100}%` : "0%" }}
        />
      </div>
      <ul className="space-y-2">
        {actions.map((action, i) => {
          const isDone = done.includes(action);
          return (
            <li key={i}>
              <label
                className={`flex items-start gap-3 rounded-[0.5rem] border border-[#484847]/50 bg-[#1a1a1a] p-3 transition-colors ${
                  isAdmin ? "cursor-pointer hover:border-[#81ecff]/40" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  disabled={!isAdmin || isPending}
                  onChange={() => toggle(action)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#c3f400]"
                />
                <span
                  className={`text-sm leading-relaxed ${
                    isDone ? "text-[#adaaaa] line-through" : "text-white"
                  }`}
                >
                  {action}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {error && <div className="text-xs text-[#ff716c]">{error}</div>}
    </div>
  );
}
