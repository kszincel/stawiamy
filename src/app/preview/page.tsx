"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PreviewContent() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt") || "";

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white font-[var(--font-inter)]">
      {/* Nav */}
      <nav className="border-b border-[#484847]/30 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/" className="flex items-center gap-0">
            <span className="text-xl font-bold tracking-tighter text-white">
              stawiamy
            </span>
            <span className="text-xl font-bold tracking-tighter text-[#81ecff]">
              .ai
            </span>
          </a>
          <a
            href="/"
            className="rounded-full bg-[#1a1a1a] border border-[#484847] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#262626] transition-colors"
          >
            Nowy projekt
          </a>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Prompt display */}
        {prompt && (
          <div className="mb-12">
            <span className="text-xs font-medium text-[#adaaaa] uppercase tracking-wider mb-3 block">
              Twój brief
            </span>
            <div className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-6">
              <p className="text-white leading-relaxed">{prompt}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-2 border-[#484847]" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-transparent border-t-[#81ecff] animate-spin" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              Generujemy Twój preview
              <span className="dot-pulse inline-flex ml-1">
                <span className="text-[#81ecff]">.</span>
                <span className="text-[#81ecff]">.</span>
                <span className="text-[#81ecff]">.</span>
              </span>
            </h2>
            <p className="text-sm text-[#adaaaa]">
              To może zająć kilka minut. Nie zamykaj tej strony.
            </p>
          </div>
        </div>

        {/* Preview placeholder */}
        <div className="rounded-[0.5rem] border border-dashed border-[#484847] bg-[#131313] min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-[#484847] mb-3 block">
              preview
            </span>
            <p className="text-sm text-[#484847]">
              Podgląd pojawi się tutaj
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-transparent border-t-[#81ecff] animate-spin" />
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
