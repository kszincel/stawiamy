"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DetailsForm from "@/app/components/DetailsForm";

type ProductType =
  | "website"
  | "app"
  | "automation"
  | "agent"
  | "digital_product"
  | "redesign";

interface Props {
  projectId: string;
  productType: ProductType;
  prompt: string | null;
  details: Record<string, unknown> | null;
  contactEmail: string | null;
  contactName: string | null;
  sourceUrl: string | null;
  status: string | null;
}

const LOCKED = new Set(["in_progress", "delivered", "cancelled"]);

export default function EditDetails({
  projectId,
  productType,
  prompt: initialPrompt,
  details,
  contactEmail,
  contactName,
  sourceUrl: initialSourceUrl,
  status,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [sourceUrl, setSourceUrl] = useState(initialSourceUrl || "");
  const [savedToast, setSavedToast] = useState("");

  const locked = LOCKED.has(status || "");

  if (locked) {
    return (
      <div className="text-xs text-[#adaaaa]">
        Projekt jest zablokowany do edycji (status: {status}).
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] border border-[#484847] px-4 py-2 text-sm font-medium text-white hover:bg-[#262626] transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-base">edit</span>
        Edytuj szczegóły
      </button>
    );
  }

  // Split details into form values and notes
  const initialNotes =
    typeof details?.additional_notes === "string"
      ? (details.additional_notes as string)
      : "";
  const initialValues: Record<string, string | string[]> = {};
  if (details) {
    for (const [k, v] of Object.entries(details)) {
      if (k === "additional_notes") continue;
      if (typeof v === "string" || Array.isArray(v)) {
        initialValues[k] = v as string | string[];
      }
    }
  }

  async function savePromptAndSource() {
    const res = await fetch(`/api/project/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt || null,
        source_url: sourceUrl || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Błąd serwera (${res.status})`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Edycja szczegółów</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-sm text-[#adaaaa] hover:text-white transition-colors cursor-pointer"
        >
          Anuluj
        </button>
      </div>

      <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Opis projektu (prompt)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full rounded-[0.5rem] bg-[#1a1a1a] border border-[#484847] px-4 py-3 text-white placeholder:text-[#6a6a6a] focus:outline-none focus:border-[#81ecff] transition-colors min-h-[100px] resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            URL źródła (opcjonalnie)
          </label>
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full rounded-[0.5rem] bg-[#1a1a1a] border border-[#484847] px-4 py-3 text-white placeholder:text-[#6a6a6a] focus:outline-none focus:border-[#81ecff] transition-colors"
          />
        </div>
      </div>

      <DetailsForm
        projectId={projectId}
        productType={productType}
        mode="edit"
        initialValues={{
          values: initialValues,
          email: contactEmail || "",
          name: contactName || "",
          notes: initialNotes,
        }}
        onSubmitOverride={async ({ email, name, details: nextDetails }) => {
          await savePromptAndSource();
          const res = await fetch(`/api/project/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              details: nextDetails,
              contact_name: name || null,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Błąd serwera (${res.status})`);
          }
          // Note: contact_email is not editable here (used as account identity)
          void email;
        }}
        onSuccess={() => {
          setSavedToast("Zapisano");
          router.refresh();
          setTimeout(() => setSavedToast(""), 3000);
        }}
      />

      {savedToast && (
        <div className="text-xs text-[#c3f400]">{savedToast}</div>
      )}
    </div>
  );
}
