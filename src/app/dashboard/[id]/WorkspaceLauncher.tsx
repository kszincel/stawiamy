"use client";

import { useCallback, useEffect, useState } from "react";

interface WorkspaceState {
  status: "none" | "requested" | "provisioning" | "ready";
  workspacePath?: string;
  repoUrl?: string;
  sshCommand?: string;
  tmuxAttach?: string;
  manualCommand?: string;
  message?: string;
}

export default function WorkspaceLauncher({ projectId }: { projectId: string }) {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/project/${projectId}/workspace`);
      if (res.ok) {
        setState(await res.json());
      }
    } catch {
      // silent
    }
  }, [projectId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll while provisioning
  useEffect(() => {
    if (!state || (state.status !== "requested" && state.status !== "provisioning")) return;
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [state, fetchStatus]);

  async function requestWorkspace() {
    setLoading(true);
    try {
      const res = await fetch(`/api/project/${projectId}/workspace`, {
        method: "POST",
      });
      if (res.ok) {
        setState(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function syncFromWorkspace() {
    setLoading(true);
    try {
      // This will be handled by the manual sync button — for now just refetch status
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!state) {
    return (
      <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-6">
        <div className="h-4 w-32 bg-[#484847]/50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-[0.75rem] border border-[#c3f400]/30 bg-[#131313] p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#c3f400]">terminal</span>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Claude Code
        </h3>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
          state.status === "ready"
            ? "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30"
            : state.status === "provisioning" || state.status === "requested"
            ? "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30"
            : "bg-[#484847]/30 text-[#adaaaa] border border-[#484847]"
        }`}>
          {state.status === "ready" ? "Gotowy" :
           state.status === "provisioning" || state.status === "requested" ? "Przygotowuję..." :
           "Brak workspace"}
        </span>
      </div>

      {state.status === "none" && (
        <div>
          <p className="text-sm text-[#adaaaa] mb-4">
            Utwórz workspace żeby pracować nad tym projektem w Claude Code na serwerze.
          </p>
          <button
            onClick={requestWorkspace}
            disabled={loading}
            className="rounded-[0.5rem] bg-[#c3f400] px-5 py-2.5 text-sm font-bold text-[#0e0e0e] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Tworzę..." : "Otwórz w Claude Code"}
          </button>
        </div>
      )}

      {(state.status === "requested" || state.status === "provisioning") && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-[#c3f400] animate-spin" />
            <p className="text-sm text-[#adaaaa]">
              Workspace jest przygotowywany. To trwa ok. 1-2 minuty.
            </p>
          </div>
          {state.manualCommand && (
            <div>
              <p className="text-xs text-[#adaaaa] mb-2">Lub odpal ręcznie:</p>
              <div className="flex items-center gap-2 rounded-[0.5rem] border border-[#484847] bg-[#0e0e0e] p-2">
                <code className="flex-1 text-xs text-[#c3f400] font-mono truncate px-2">
                  {state.manualCommand}
                </code>
                <button
                  onClick={() => copy(state.manualCommand!, "manual")}
                  className="shrink-0 rounded px-3 py-1 text-xs bg-[#1a1a1a] border border-[#484847] text-white hover:border-[#c3f400] transition-colors"
                >
                  {copied === "manual" ? "✓" : "Kopiuj"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {state.status === "ready" && (
        <div className="space-y-4">
          {/* SSH command */}
          <div>
            <p className="text-xs text-[#adaaaa] mb-2">Rozpocznij sesje:</p>
            <div className="flex items-center gap-2 rounded-[0.5rem] border border-[#484847] bg-[#0e0e0e] p-2">
              <code className="flex-1 text-xs text-[#c3f400] font-mono truncate px-2">
                {state.sshCommand}
              </code>
              <button
                onClick={() => copy(state.sshCommand!, "ssh")}
                className="shrink-0 rounded px-3 py-1 text-xs bg-[#1a1a1a] border border-[#484847] text-white hover:border-[#c3f400] transition-colors"
              >
                {copied === "ssh" ? "✓" : "Kopiuj"}
              </button>
            </div>
          </div>

          {/* Tmux attach */}
          <div>
            <p className="text-xs text-[#adaaaa] mb-2">Wróć do istniejącej sesji:</p>
            <div className="flex items-center gap-2 rounded-[0.5rem] border border-[#484847] bg-[#0e0e0e] p-2">
              <code className="flex-1 text-xs text-[#c3f400] font-mono truncate px-2">
                {state.tmuxAttach}
              </code>
              <button
                onClick={() => copy(state.tmuxAttach!, "tmux")}
                className="shrink-0 rounded px-3 py-1 text-xs bg-[#1a1a1a] border border-[#484847] text-white hover:border-[#c3f400] transition-colors"
              >
                {copied === "tmux" ? "✓" : "Kopiuj"}
              </button>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 pt-2 border-t border-[#484847]/30">
            {state.repoUrl && (
              <a
                href={state.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#81ecff] hover:underline"
              >
                <span className="material-symbols-outlined text-sm">code</span>
                GitHub
                <span className="material-symbols-outlined text-xs">arrow_outward</span>
              </a>
            )}
            <button
              onClick={syncFromWorkspace}
              disabled={loading}
              className="inline-flex items-center gap-1 text-xs text-[#adaaaa] hover:text-white transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              Sync BRIEF z workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
