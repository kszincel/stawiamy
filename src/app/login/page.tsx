"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setError("");
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          shouldCreateUser: true,
        },
      });
      if (err) throw err;
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <a href="/" className="flex items-center gap-0 justify-center mb-10">
          <span className="text-2xl font-bold tracking-tighter text-white">stawiamy</span>
          <span className="text-2xl font-bold tracking-tighter text-[#81ecff]">.ai</span>
        </a>

        <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Zaloguj się do panelu</h1>
          <p className="text-sm text-[#adaaaa] mb-8">
            Wyślemy Ci link logowania na email - kliknij go, żeby się zalogować.
          </p>

          {status === "sent" ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="h-14 w-14 rounded-full bg-[#81ecff]/10 border border-[#81ecff] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-[#81ecff]">mail</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Sprawdź email</h2>
                <p className="text-sm text-[#adaaaa]">
                  Wysłaliśmy link logowania na <span className="text-white">{email}</span>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#adaaaa] uppercase tracking-wider mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ty@example.com"
                  className="w-full rounded-[0.5rem] bg-[#1a1a1a] border border-[#484847] px-4 py-3 text-white placeholder-[#484847] focus:outline-none focus:border-[#81ecff] transition-colors"
                />
              </div>

              {status === "error" && (
                <div className="rounded-[0.5rem] border border-[#ff716c]/40 bg-[#ff716c]/5 px-4 py-3 text-sm text-[#ff716c]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-[#c3f400] text-[#0e0e0e] font-bold px-6 py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {status === "loading" ? "Wysyłanie..." : "Wyślij link logowania"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
