"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LandingNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setEmail(data.session?.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e]/60 backdrop-blur-xl border-b border-[#484847]/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-0">
          <span className="text-xl font-bold tracking-tighter text-white font-[var(--font-inter)]">
            stawiamy
          </span>
          <span className="text-xl font-bold tracking-tighter text-[#81ecff] font-[var(--font-inter)]">
            .ai
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#how-it-works"
            className="text-sm text-[#adaaaa] hover:text-white transition-colors"
          >
            Jak to działa
          </a>
          <a
            href="#services"
            className="text-sm text-[#adaaaa] hover:text-white transition-colors"
          >
            Oferta
          </a>
          <a
            href="#showcase"
            className="text-sm text-[#adaaaa] hover:text-white transition-colors"
          >
            Realizacje
          </a>
          {email && (
            <a
              href="/dashboard"
              className="text-sm text-[#adaaaa] hover:text-white transition-colors"
            >
              Panel
            </a>
          )}
        </div>

        <div className="flex items-center gap-3">
          {email && (
            <span className="hidden sm:inline text-xs text-[#adaaaa] truncate max-w-[160px]">
              {email}
            </span>
          )}
          <a
            href="#cta"
            className={`rounded-full bg-[#81ecff] px-5 py-2.5 text-sm font-bold text-[#005762] hover:bg-[#00d4ec] transition-opacity ${scrolled ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            Opisz pomysł
          </a>
        </div>
      </div>
    </nav>
  );
}
