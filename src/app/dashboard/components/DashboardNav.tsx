"use client";

import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  email: string;
  isAdmin: boolean;
}

export default function DashboardNav({ email, isAdmin }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="border-b border-[#484847]/30 px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <a href="/" className="flex items-center gap-0">
          <span className="text-xl font-bold tracking-tighter text-white">stawiamy</span>
          <span className="text-xl font-bold tracking-tighter text-[#81ecff]">.ai</span>
        </a>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#adaaaa] hidden sm:block">{email}</span>
            {isAdmin && (
              <span className="rounded-full bg-[#c3f400]/10 border border-[#c3f400]/40 px-2 py-0.5 text-xs font-bold text-[#c3f400] uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={signOut}
            disabled={loading}
            className="rounded-full bg-[#1a1a1a] border border-[#484847] px-4 py-2 text-sm font-medium text-white hover:bg-[#262626] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Wyloguj
          </button>
        </div>
      </div>
    </nav>
  );
}
