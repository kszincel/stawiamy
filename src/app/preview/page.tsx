"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import DetailsForm from "../components/DetailsForm";

type ProductType =
  | "website"
  | "app"
  | "automation"
  | "agent"
  | "digital_product"
  | "redesign";

type PackageKey =
  | "digital_product"
  | "start"
  | "standard"
  | "custom"
  | "redesign"
  | "automation"
  | "agent";

type PreviewType = "design" | "brief";

interface Attachment {
  url: string;
  filename: string;
  size: number;
  type: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentIcon(type: string): string {
  if (type === "application/pdf") return "picture_as_pdf";
  if (type.startsWith("image/")) return "image";
  return "description";
}

function AttachmentsCard({ attachments }: { attachments: Attachment[] }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div>
      <span className="text-xs font-medium text-[#adaaaa] uppercase tracking-wider mb-3 block">
        Załączniki
      </span>
      <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-6">
        <ul className="space-y-3">
          {attachments.map((a, i) => {
            const isImg = a.type.startsWith("image/");
            return (
              <li key={i} className="flex items-center gap-4">
                {isImg ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={a.url}
                    alt={a.filename}
                    className="h-12 w-12 rounded-[0.5rem] border border-[#484847] object-cover bg-[#0e0e0e]"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#c3f400]">
                      {attachmentIcon(a.type)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {a.filename}
                  </div>
                  <div className="text-xs text-[#adaaaa]">
                    {formatFileSize(a.size)}
                  </div>
                </div>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#81ecff] hover:underline text-sm shrink-0 inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">
                    download
                  </span>
                  Pobierz
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

interface Project {
  id: string;
  prompt: string;
  product_type: ProductType;
  package: PackageKey;
  preview_type: PreviewType;
  estimated_price: number;
  deposit_amount: number;
  description: string;
  features: string[];
  timeline: string;
  source_url: string | null;
  source_images: string[] | null;
  status: string;
  preview_screenshot_url: string | null;
  preview_html_url: string | null;
  brief: string | null;
  attachments: Attachment[] | null;
  contact_email: string | null;
}

function SubmittedSuccess({ projectId, contactEmail }: { projectId: string; contactEmail: string | null }) {
  const [copied, setCopied] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const projectUrl = typeof window !== "undefined" ? `${window.location.origin}/preview?id=${projectId}` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(projectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function resendMagicLink() {
    if (!contactEmail) return;
    setResendState("sending");
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contactEmail, projectId }),
      });
      if (!res.ok) throw new Error("Failed");
      setResendState("sent");
      setTimeout(() => setResendState("idle"), 5000);
    } catch {
      setResendState("error");
      setTimeout(() => setResendState("idle"), 5000);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 text-center animate-fade-in">
      <div className="h-16 w-16 rounded-full bg-[#81ecff]/10 border border-[#81ecff] flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-[#81ecff]">check</span>
      </div>
      <div className="max-w-lg">
        <h2 className="text-2xl font-bold text-white mb-3">Świetnie!</h2>
        <p className="text-[#adaaaa] leading-relaxed mb-2">
          Otrzymaliśmy Twoje zgłoszenie. Aby kontynuować (zapłacić zaliczkę i śledzić postęp), zapisz sobie ten link do projektu:
        </p>
      </div>

      {/* Project URL with copy button */}
      <div className="w-full max-w-lg flex items-center gap-2 rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-2">
        <code className="flex-1 text-xs text-[#81ecff] truncate px-2 font-mono">{projectUrl}</code>
        <button
          onClick={copyLink}
          className="flex-shrink-0 rounded-[0.25rem] bg-[#c3f400] text-[#0e0e0e] font-bold px-4 py-2 text-xs hover:opacity-90 transition-opacity"
        >
          {copied ? "Skopiowane ✓" : "Kopiuj"}
        </button>
      </div>

      <p className="text-xs text-[#adaaaa] max-w-md">
        Wysłaliśmy też magic link na <strong className="text-white">{contactEmail}</strong> - kliknij go żeby zalogować się i śledzić postęp w panelu klienta. Sprawdź też folder spam.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={resendMagicLink}
          disabled={resendState === "sending" || !contactEmail}
          className="rounded-full border border-[#484847] text-[#adaaaa] hover:text-white hover:border-[#81ecff] font-medium px-5 py-2.5 text-sm transition-colors disabled:opacity-40"
        >
          {resendState === "sending" ? "Wysyłanie..." : resendState === "sent" ? "Wysłano ✓" : resendState === "error" ? "Błąd, spróbuj ponownie" : "Wyślij magic link ponownie"}
        </button>
        <a
          href={`/preview?id=${projectId}`}
          className="rounded-full bg-[#81ecff] text-[#005762] font-bold px-5 py-2.5 text-sm hover:opacity-90 transition-opacity"
        >
          Otwórz projekt
        </a>
      </div>
    </div>
  );
}

const LOADING_MESSAGES = [
  "Analizujemy Twój pomysł...",
  "Dobieramy najlepsze rozwiązania...",
  "Projektujemy interfejs...",
  "Generujemy podgląd...",
  "Dopracowujemy detale...",
  "Prawie gotowe...",
];

const PACKAGE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  digital_product: {
    label: "Produkt cyfrowy",
    icon: "widgets",
    color: "#70aaff",
  },
  start: { label: "Pakiet Start", icon: "web", color: "#81ecff" },
  standard: {
    label: "Pakiet Standard",
    icon: "dashboard",
    color: "#81ecff",
  },
  redesign: {
    label: "Redesign",
    icon: "refresh",
    color: "#81ecff",
  },
  custom: {
    label: "Pakiet Custom",
    icon: "architecture",
    color: "#c3f400",
  },
  automation: { label: "Automatyzacja", icon: "bolt", color: "#c3f400" },
  agent: { label: "Agent AI", icon: "smart_toy", color: "#c3f400" },
};

function BriefRenderer({ brief }: { brief: string }) {
  const lines = brief.split("\n");
  return (
    <div className="space-y-2 font-mono text-sm leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        const headerMatch = trimmed.match(/^\*\*(.+?):\*\*\s*(.*)$/);
        if (headerMatch) {
          return (
            <div key={i} className="pt-2">
              <span className="font-bold text-[#81ecff]">{headerMatch[1]}:</span>
              {headerMatch[2] && <span className="text-white ml-2">{headerMatch[2]}</span>}
            </div>
          );
        }
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={i} className="flex gap-3 pl-2">
              <span className="text-[#c3f400] shrink-0">{numMatch[1]}.</span>
              <span className="text-white">{numMatch[2]}</span>
            </div>
          );
        }
        const boldOnly = trimmed.match(/^\*\*(.+?)\*\*$/);
        if (boldOnly) {
          return <div key={i} className="font-bold text-[#81ecff] pt-2">{boldOnly[1]}</div>;
        }
        return <p key={i} className="text-[#adaaaa]">{trimmed}</p>;
      })}
    </div>
  );
}

const FINALIZED_STATUSES = new Set([
  "details_submitted",
  "in_progress",
  "delivered",
  "finalized",
]);

function PreviewContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id") || "";

  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string>("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const status: "loading" | "ready" | "error" = error
    ? "error"
    : project && project.status !== "preview_generating"
    ? "ready"
    : "loading";

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/project/${projectId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Projekt nie został znaleziony.");
        }
        throw new Error(`Błąd serwera (${res.status})`);
      }
      const data = (await res.json()) as Project;
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    }
  }, [projectId]);

  // Initial load + missing id guard
  useEffect(() => {
    if (!projectId) {
      setError("Brak identyfikatora projektu. Wróć na stronę główną i opisz swój pomysł.");
      return;
    }
    fetchProject();
  }, [projectId, fetchProject]);

  // Polling while generating
  useEffect(() => {
    if (!project) return;
    if (project.status !== "preview_generating") {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      fetchProject();
    }, 3000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [project, fetchProject]);

  // Rotate loading messages
  useEffect(() => {
    if (status !== "loading") return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [status]);

  const packageInfo = project
    ? PACKAGE_CONFIG[project.package] || PACKAGE_CONFIG.start
    : null;

  const sourceImages = project?.source_images || [];
  const sourceScreenshotUrl = project?.source_url
    ? `https://api.microlink.io/?url=${encodeURIComponent(project.source_url)}&screenshot=true&meta=false&embed=screenshot.url`
    : null;

  const isFinalized = project ? FINALIZED_STATUSES.has(project.status) : false;

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

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Prompt display */}
        {project?.prompt && (
          <div className="mb-10">
            <span className="text-xs font-medium text-[#adaaaa] uppercase tracking-wider mb-3 block">
              Twój brief
            </span>
            <div className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-6">
              <p className="text-white leading-relaxed">{project.prompt}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-24 gap-6 animate-fade-in">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-2 border-[#484847]" />
              <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-transparent border-t-[#81ecff] animate-spin" />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">
                {LOADING_MESSAGES[loadingMessageIndex]}
              </h2>
              <p className="text-sm text-[#adaaaa]">
                To może potrwać 1-2 minuty. Możesz spokojnie odświeżyć stronę - postęp nie zniknie.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4">
              {LOADING_MESSAGES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= loadingMessageIndex
                      ? "w-6 bg-[#81ecff]"
                      : "w-1.5 bg-[#484847]"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-24 gap-6 animate-fade-in">
            <span className="material-symbols-outlined text-5xl text-[#ff716c]">
              error
            </span>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">
                Coś poszło nie tak
              </h2>
              <p className="text-sm text-[#adaaaa] max-w-md">{error}</p>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <a
                href="/"
                className="rounded-full bg-[#1a1a1a] border border-[#484847] px-6 py-3 text-sm font-medium text-white hover:bg-[#262626] transition-colors"
              >
                Wróć na stronę główną
              </a>
            </div>
          </div>
        )}

        {/* Ready state */}
        {status === "ready" && project && packageInfo && (
          <div className="space-y-8 animate-fade-in">
            {/* Source site screenshots (redesign mode) */}
            {(sourceScreenshotUrl || sourceImages.length > 0) && (
              <div>
                <span className="text-xs font-medium text-[#adaaaa] uppercase tracking-wider mb-3 block">
                  Obecna strona
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sourceScreenshotUrl && (
                    <div className="rounded-[0.5rem] border border-[#484847] overflow-hidden bg-[#131313]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sourceScreenshotUrl}
                        alt="Obecna strona"
                        className="w-full"
                      />
                      {project.source_url && (
                        <div className="px-4 py-2 text-xs text-[#adaaaa] truncate">
                          {project.source_url}
                        </div>
                      )}
                    </div>
                  )}
                  {sourceImages.map((img, i) => (
                    <div key={i} className="rounded-[0.5rem] border border-[#484847] overflow-hidden bg-[#131313]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`Załącznik ${i + 1}`}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.attachments && project.attachments.length > 0 && (
              <AttachmentsCard attachments={project.attachments} />
            )}

            {project.preview_type === "design" && (sourceScreenshotUrl || sourceImages.length > 0) && (
              <span className="text-xs font-medium text-[#81ecff] uppercase tracking-wider block">
                Nowy design
              </span>
            )}

            {/* Brief (automation/agent) */}
            {project.preview_type === "brief" && project.brief ? (
              <div>
                <p className="text-sm text-[#adaaaa] mb-3">
                  Tak będzie wyglądać Twoja automatyzacja:
                </p>
                <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-8">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#484847]/50">
                    <span className="material-symbols-outlined text-[#c3f400]">description</span>
                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                      Brief techniczny
                    </span>
                  </div>
                  <BriefRenderer brief={project.brief} />
                </div>
              </div>
            ) : project.preview_type === "design" && project.preview_screenshot_url ? (
              <div className="mx-auto max-w-3xl rounded-[0.75rem] border border-[#484847] overflow-hidden bg-[#131313]">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border-b border-[#484847]/50">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#ff716c]/60" />
                    <div className="h-3 w-3 rounded-full bg-[#c3f400]/60" />
                    <div className="h-3 w-3 rounded-full bg-[#81ecff]/60" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-6 rounded-full bg-[#0e0e0e] border border-[#484847]/50 max-w-sm mx-auto" />
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto bg-[#0e0e0e] flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.preview_screenshot_url}
                    alt="Podgląd projektu"
                    className="max-w-full h-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-6 text-sm text-[#adaaaa]">
                Nie udało się wygenerować wizualnego podglądu, ale możesz przejść dalej i wypełnić formularz.
              </div>
            )}

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Classification card */}
              <div className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ color: packageInfo.color }}
                  >
                    {packageInfo.icon}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {packageInfo.label}
                    </h3>
                    <span className="text-xs text-[#adaaaa]">
                      {project.timeline}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-[#adaaaa] leading-relaxed mb-6">
                  {project.description}
                </p>

                <div className="space-y-3">
                  <span className="text-xs font-medium text-[#adaaaa] uppercase tracking-wider">
                    Co zawiera
                  </span>
                  {project.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <span className="text-[#81ecff] mt-0.5 shrink-0 text-sm">
                        &#x2713;
                      </span>
                      <span className="text-sm text-white">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price card */}
              <div className="rounded-[0.5rem] border border-[#81ecff]/30 bg-[#1a1a1a] p-8 shadow-[0_0_40px_-12px_rgba(129,236,255,0.1)] flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {packageInfo.label}
                  </h3>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-white font-[var(--font-plus-jakarta)]">
                      {project.estimated_price.toLocaleString("pl-PL")}
                    </span>
                    <span className="text-lg text-[#adaaaa] ml-2">PLN</span>
                  </div>

                  <div className="rounded-[0.5rem] bg-[#0e0e0e] border border-[#484847]/50 p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#adaaaa]">
                        Zaliczka (30%)
                      </span>
                      <span className="text-lg font-bold text-[#c3f400]">
                        {project.deposit_amount.toLocaleString("pl-PL")} PLN
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-8">
                    {[
                      "Hosting i domena w cenie",
                      "Wsparcie po wdrożeniu",
                      "Kod źródłowy w pakiecie",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-[#adaaaa]"
                      >
                        <span className="h-1 w-1 rounded-full bg-[#484847]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-[#adaaaa] leading-relaxed">
                  Wypełnij formularz poniżej żeby otrzymać szczegółowy brief i wycenę.
                </p>
              </div>
            </div>

            {/* Details form / success */}
            <div className="pt-4 border-t border-[#484847]/30">
              {submitted || isFinalized ? (
                <SubmittedSuccess projectId={project.id} contactEmail={project.contact_email} />
              ) : (
                <div className="pt-8">
                  <DetailsForm
                    projectId={project.id}
                    productType={project.product_type}
                    onSuccess={() => setSubmitted(true)}
                  />
                </div>
              )}
            </div>

            {/* HTML preview link */}
            {project.preview_type === "design" && project.preview_html_url && (
              <div className="text-center">
                <a
                  href={project.preview_html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#81ecff] hover:underline"
                >
                  <span className="material-symbols-outlined text-base">
                    code
                  </span>
                  Zobacz interaktywny podgląd HTML
                  <span className="material-symbols-outlined text-base">
                    arrow_outward
                  </span>
                </a>
              </div>
            )}
          </div>
        )}
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
