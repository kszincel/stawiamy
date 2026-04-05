"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatInput({
  variant = "hero",
}: {
  variant?: "hero" | "cta";
}) {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    router.push(`/preview?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  if (variant === "cta") {
    return (
      <div className="flex w-full max-w-xl items-center gap-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Opisz swój pomysł..."
          className="flex-1 rounded-full bg-[#1a1a1a] px-6 py-4 text-white placeholder:text-[#adaaaa] outline-none border border-[#484847] focus:border-[#81ecff] transition-colors"
        />
        <button
          onClick={handleSubmit}
          className="rounded-full bg-[#81ecff] px-8 py-4 font-semibold text-[#005762] hover:bg-[#00d4ec] transition-colors shrink-0 cursor-pointer"
        >
          Zbuduj preview
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-[2rem] bg-[#000000] border border-[#484847] p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Powiedz nam co chcesz postawić..."
          rows={3}
          className="w-full resize-none bg-transparent text-white placeholder:text-[#adaaaa] outline-none px-2 py-2 text-base"
        />
        <div className="flex items-center justify-between pt-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#484847] text-[#adaaaa] hover:border-[#767575] transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              className="rounded-full bg-[#1a1a1a] border border-[#484847] px-5 py-2 text-sm font-medium text-white hover:bg-[#262626] transition-colors cursor-pointer"
            >
              Zbuduj
            </button>
            <button className="rounded-full bg-[#1a1a1a] border border-[#484847] px-5 py-2 text-sm font-medium text-[#adaaaa] hover:bg-[#262626] transition-colors cursor-pointer">
              Zaplanuj
            </button>
            <button
              onClick={handleSubmit}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#81ecff] text-[#005762] hover:bg-[#00d4ec] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">
                arrow_upward
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
