"use client";

import { useMemo, useState } from "react";

interface DetailsFormInitialValues {
  values?: Record<string, string | string[]>;
  email?: string;
  name?: string;
  notes?: string;
}

interface DetailsFormProps {
  projectId: string;
  productType: "website" | "app" | "automation" | "agent" | "digital_product" | "redesign";
  onSuccess: () => void;
  mode?: "create" | "edit";
  initialValues?: DetailsFormInitialValues;
  onSubmitOverride?: (payload: {
    projectId: string;
    email: string;
    name?: string;
    details: Record<string, unknown>;
  }) => Promise<void>;
}

type FieldType = "text" | "textarea" | "select" | "multiselect" | "email";

interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

const WEBSITE_FIELDS: FieldDef[] = [
  { id: "target_audience", label: "Dla kogo jest ta strona?", type: "textarea", placeholder: "Opisz grupę docelową, branżę, typowego klienta..." },
  { id: "business_goal", label: "Jaki jest główny cel?", type: "text", placeholder: "np. sprzedaż, leady, prezentacja" },
  { id: "sections", label: "Jakie sekcje?", type: "multiselect", options: ["Hero", "Features", "Pricing", "Testimonials", "FAQ", "Kontakt", "Blog", "Galeria"] },
  { id: "visual_style", label: "Styl wizualny", type: "select", options: ["Minimalistyczny", "Bogaty/Kolorowy", "Premium/Editorial", "Korporacyjny", "Eksperymentalny"] },
  { id: "brand_colors", label: "Kolory marki (jeśli są)", type: "text", placeholder: "np. granat #1a2b4c, akcent pomarańczowy" },
  { id: "main_cta", label: "Główny przycisk akcji", type: "text", placeholder: "np. 'Kup teraz', 'Zostaw kontakt'" },
  { id: "integrations", label: "Potrzebne integracje?", type: "text", placeholder: "Stripe, Mailchimp, analytics..." },
];

const APP_FIELDS: FieldDef[] = [
  { id: "target_users", label: "Kto będzie korzystał z aplikacji?", type: "textarea", placeholder: "Role, persony, scenariusze użycia..." },
  { id: "main_features", label: "Najważniejsze funkcje", type: "textarea", placeholder: "Lista najważniejszych funkcjonalności" },
  { id: "auth_method", label: "Logowanie", type: "select", options: ["Bez logowania", "Email + hasło", "Magic link", "Google OAuth", "Inne"] },
  { id: "data_storage", label: "Jakie dane będą przechowywane?", type: "text", placeholder: "np. profile użytkowników, zamówienia..." },
  { id: "integrations", label: "Integracje z zewnętrznymi API?", type: "text", placeholder: "np. Stripe, Google Maps, OpenAI..." },
  { id: "mobile_priority", label: "Priorytet mobile", type: "select", options: ["Tylko desktop", "Mobile-first", "Responsywne"] },
];

const AUTOMATION_FIELDS: FieldDef[] = [
  { id: "trigger", label: "Co ma uruchamiać automatyzację?", type: "textarea", placeholder: "np. nowy email, cron, webhook, zmiana w bazie" },
  { id: "data_sources", label: "Skąd ma pobierać dane?", type: "textarea", placeholder: "np. Gmail, Google Sheets, API..." },
  { id: "destinations", label: "Gdzie ma wysyłać/zapisywać rezultaty?", type: "textarea", placeholder: "np. Slack, baza danych, email..." },
  { id: "frequency", label: "Jak często ma się uruchamiać?", type: "text", placeholder: "np. co godzinę, raz dziennie, na żądanie" },
  { id: "error_handling", label: "Co ma się dziać przy błędach?", type: "text", placeholder: "powiadomienie, retry, log" },
  { id: "existing_tools", label: "Z jakich narzędzi już korzystasz?", type: "text", placeholder: "n8n, Zapier, Make..." },
];

const AGENT_FIELDS: FieldDef[] = [
  { id: "agent_purpose", label: "Co dokładnie ma robić agent?", type: "textarea", placeholder: "Główne zadanie i kontekst..." },
  { id: "input_format", label: "Jak agent będzie otrzymywał polecenia?", type: "text", placeholder: "chat, formularz, API, email" },
  { id: "output_format", label: "W jakim formacie ma zwracać odpowiedź?", type: "text", placeholder: "tekst, JSON, PDF, email..." },
  { id: "knowledge_sources", label: "Z jakiej wiedzy ma korzystać?", type: "textarea", placeholder: "dokumenty, baza danych, web scraping, własna wiedza" },
  { id: "tools_needed", label: "Jakie narzędzia ma mieć dostępne?", type: "textarea", placeholder: "np. Google search, kalkulator, czytanie PDF, wysyłanie emaili" },
  { id: "persona", label: "Jak ma się zachowywać?", type: "text", placeholder: "formalny, przyjacielski, ekspert" },
  { id: "escalation", label: "Kiedy ma przekazać do człowieka?", type: "text", placeholder: "np. gdy nie zna odpowiedzi" },
];

const DIGITAL_PRODUCT_FIELDS: FieldDef[] = [
  { id: "purpose", label: "Co ma robić ten produkt cyfrowy?", type: "textarea", placeholder: "Główna wartość dla użytkownika..." },
  { id: "input_fields", label: "Jakie pola wejściowe?", type: "textarea", placeholder: "Lista pól, jakie wypełnia użytkownik" },
  { id: "logic", label: "Jaka logika/formuły?", type: "textarea", placeholder: "Opis działania (jeśli kalkulator)" },
  { id: "output_format", label: "Format wyjścia", type: "text", placeholder: "PDF, lista, wykres, tekst" },
  { id: "save_results", label: "Czy zapisywać wyniki?", type: "select", options: ["Nie", "Tak, lokalnie w przeglądarce", "Tak, w bazie danych"] },
];

const REQUIRED_BY_TYPE: Record<DetailsFormProps["productType"], string[]> = {
  website: ["target_audience", "business_goal", "sections", "visual_style", "main_cta"],
  redesign: ["target_audience", "business_goal", "sections", "visual_style", "main_cta"],
  app: ["target_users", "main_features", "auth_method", "mobile_priority"],
  automation: ["trigger", "data_sources", "destinations", "frequency"],
  agent: ["agent_purpose", "input_format", "output_format", "knowledge_sources", "tools_needed"],
  digital_product: ["purpose", "input_fields", "output_format", "save_results"],
};

function getFieldsForType(type: DetailsFormProps["productType"]): FieldDef[] {
  const required = REQUIRED_BY_TYPE[type];
  let base: FieldDef[];
  switch (type) {
    case "website":
    case "redesign":
      base = WEBSITE_FIELDS;
      break;
    case "app":
      base = APP_FIELDS;
      break;
    case "automation":
      base = AUTOMATION_FIELDS;
      break;
    case "agent":
      base = AGENT_FIELDS;
      break;
    case "digital_product":
      base = DIGITAL_PRODUCT_FIELDS;
      break;
  }
  return base.map((f) => ({ ...f, required: required.includes(f.id) }));
}

const inputClass =
  "w-full rounded-[0.5rem] bg-[#1a1a1a] border border-[#484847] px-4 py-3 text-white placeholder:text-[#6a6a6a] focus:outline-none focus:border-[#81ecff] transition-colors";

export default function DetailsForm({
  projectId,
  productType,
  onSuccess,
  mode = "create",
  initialValues,
  onSubmitOverride,
}: DetailsFormProps) {
  const fields = useMemo(() => getFieldsForType(productType), [productType]);
  const isEdit = mode === "edit";

  const [values, setValues] = useState<Record<string, string | string[]>>(
    initialValues?.values || {}
  );
  const [email, setEmail] = useState(initialValues?.email || "");
  const [name, setName] = useState(initialValues?.name || "");
  const [notes, setNotes] = useState(initialValues?.notes || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function setValue(id: string, value: string | string[]) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  function toggleMulti(id: string, option: string) {
    const current = (values[id] as string[]) || [];
    if (current.includes(option)) {
      setValue(id, current.filter((o) => o !== option));
    } else {
      setValue(id, [...current, option]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email jest wymagany.");
      return;
    }

    for (const f of fields) {
      if (!f.required) continue;
      const v = values[f.id];
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
        setError(`Pole "${f.label}" jest wymagane.`);
        return;
      }
    }

    setSubmitting(true);

    const details: Record<string, unknown> = { ...values };
    if (notes) details.additional_notes = notes;

    try {
      if (onSubmitOverride) {
        await onSubmitOverride({ projectId, email, name: name || undefined, details });
      } else {
        const res = await fetch("/api/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, email, name: name || undefined, details }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Błąd serwera (${res.status})`);
        }
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(f: FieldDef) {
    const value = values[f.id];
    const labelEl = (
      <label className="block text-sm font-medium text-white mb-2">
        {f.label}
        {f.required && <span className="text-[#81ecff] ml-1">*</span>}
      </label>
    );

    if (f.type === "textarea") {
      return (
        <div key={f.id}>
          {labelEl}
          <textarea
            className={`${inputClass} min-h-[100px] resize-y`}
            placeholder={f.placeholder}
            value={(value as string) || ""}
            onChange={(e) => setValue(f.id, e.target.value)}
          />
        </div>
      );
    }

    if (f.type === "select") {
      return (
        <div key={f.id}>
          {labelEl}
          <select
            className={inputClass}
            value={(value as string) || ""}
            onChange={(e) => setValue(f.id, e.target.value)}
          >
            <option value="">Wybierz...</option>
            {f.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (f.type === "multiselect") {
      const selected = (value as string[]) || [];
      return (
        <div key={f.id}>
          {labelEl}
          <div className="flex flex-wrap gap-2">
            {f.options?.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggleMulti(f.id, opt)}
                  className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors cursor-pointer ${
                    active
                      ? "bg-[#81ecff] border-[#81ecff] text-[#005762]"
                      : "bg-[#1a1a1a] border-[#484847] text-white hover:border-[#81ecff]/50"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div key={f.id}>
        {labelEl}
        <input
          type="text"
          className={inputClass}
          placeholder={f.placeholder}
          value={(value as string) || ""}
          onChange={(e) => setValue(f.id, e.target.value)}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {isEdit ? "Edytuj szczegóły" : "Doprecyzuj projekt"}
        </h2>
        <p className="text-sm text-[#adaaaa]">
          {isEdit
            ? "Zaktualizuj odpowiedzi i dane kontaktowe. Zmiany są widoczne natychmiast."
            : "Im więcej szczegółów, tym lepszy efekt. Wszystkie odpowiedzi pomagają nam dostarczyć dokładnie to czego potrzebujesz."}
        </p>
      </div>

      <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-8 space-y-6">
        {fields.map(renderField)}
      </div>

      <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-8 space-y-6">
        <h3 className="text-lg font-bold text-white">Kontakt</h3>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Email kontaktowy <span className="text-[#81ecff] ml-1">*</span>
          </label>
          <input
            type="email"
            required
            className={inputClass}
            placeholder="ty@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Imię (opcjonalnie)</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Jak się do Ciebie zwracać"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Dodatkowe uwagi</label>
          <textarea
            className={`${inputClass} min-h-[100px] resize-y`}
            placeholder="Cokolwiek jeszcze chcesz dodać..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-[0.5rem] border border-[#ff716c]/40 bg-[#ff716c]/10 px-4 py-3 text-sm text-[#ff716c]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#81ecff] py-4 text-center font-semibold text-[#005762] hover:bg-[#00d4ec] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting
          ? isEdit
            ? "Zapisywanie..."
            : "Wysyłanie..."
          : isEdit
          ? "Zapisz zmiany"
          : "Wyślij i otrzymaj brief"}
      </button>
    </form>
  );
}
