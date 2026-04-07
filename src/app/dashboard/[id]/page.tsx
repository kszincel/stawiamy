import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "../status";
import StatusUpdater from "./StatusUpdater";

export const dynamic = "force-dynamic";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(n: number | null) {
  if (!n) return "—";
  return `${n.toLocaleString("pl-PL")} PLN`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-6">
      <h2 className="text-xs font-bold text-[#adaaaa] uppercase tracking-wider mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-[#adaaaa] mb-1">{label}</div>
      <div className="text-sm text-white">{value || "—"}</div>
    </div>
  );
}

function renderDetailValue(v: unknown): React.ReactNode {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) {
    if (v.length === 0) return "—";
    return (
      <ul className="space-y-1">
        {v.map((item, i) => (
          <li key={i} className="text-sm text-white">
            • {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof v === "object") {
    return (
      <pre className="text-xs text-white whitespace-pre-wrap font-mono">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  if (typeof v === "boolean") return v ? "Tak" : "Nie";
  return String(v);
}

function humanizeKey(k: string): string {
  return k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user?.email === "konrad@ikonmedia.pl";

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const features: string[] = Array.isArray(project.features) ? project.features : [];
  const details = (project.details as Record<string, unknown>) || {};
  const sourceImages: string[] = Array.isArray(project.source_images) ? project.source_images : [];
  const missingInfo: string[] = Array.isArray(project.ai_missing_info) ? project.ai_missing_info : [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[#adaaaa] hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Wszystkie projekty
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-3">
            <StatusBadge status={project.status || "preview_generating"} />
            <div>
              <div className="text-xs text-[#adaaaa] uppercase tracking-wider mb-1">
                {project.package || project.product_type || "Projekt"}
              </div>
              <div className="text-3xl font-bold text-[#c3f400]">
                {formatPrice(project.estimated_price)}
              </div>
              {project.deposit_amount && (
                <div className="text-sm text-[#adaaaa] mt-1">
                  Zaliczka: {formatPrice(project.deposit_amount)}
                </div>
              )}
            </div>
          </div>
          <div className="text-right space-y-2 text-sm">
            <div>
              <div className="text-xs text-[#adaaaa]">Utworzono</div>
              <div className="text-white">{formatDate(project.created_at)}</div>
            </div>
            {project.finalized_at && (
              <div>
                <div className="text-xs text-[#adaaaa]">Sfinalizowano</div>
                <div className="text-white">{formatDate(project.finalized_at)}</div>
              </div>
            )}
            {project.contact_email && (
              <div>
                <div className="text-xs text-[#adaaaa]">Kontakt</div>
                <div className="text-white">
                  {project.contact_name && `${project.contact_name} · `}
                  {project.contact_email}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin status updater */}
      {isAdmin && (
        <Section title="Akcje admina">
          <StatusUpdater
            projectId={project.id}
            currentStatus={project.status || "preview_generating"}
          />
        </Section>
      )}

      {/* Original prompt */}
      {project.prompt && (
        <Section title="Oryginalny opis">
          <div className="rounded-[0.5rem] bg-[#0e0e0e] border border-[#484847]/50 p-4 font-mono text-sm text-white whitespace-pre-wrap">
            {project.prompt}
          </div>
        </Section>
      )}

      {/* Classification */}
      <Section title="Klasyfikacja AI">
        <div className="space-y-4">
          {project.description && (
            <Field label="Opis" value={project.description} />
          )}
          {features.length > 0 && (
            <div>
              <div className="text-xs text-[#adaaaa] mb-2">Funkcjonalności</div>
              <ul className="space-y-1.5">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white">
                    <span className="text-[#81ecff] mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {project.timeline && (
            <Field label="Czas realizacji" value={project.timeline} />
          )}
        </div>
      </Section>

      {/* Form details */}
      {Object.keys(details).length > 0 && (
        <Section title="Szczegóły z formularza">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(details).map(([k, v]) => (
              <Field key={k} label={humanizeKey(k)} value={renderDetailValue(v)} />
            ))}
          </div>
        </Section>
      )}

      {/* Source */}
      {(project.source_url || sourceImages.length > 0) && (
        <Section title="Materiały źródłowe">
          {project.source_url && (
            <div className="mb-4">
              <Field
                label="URL źródła"
                value={
                  <a
                    href={project.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#81ecff] hover:underline break-all"
                  >
                    {project.source_url}
                  </a>
                }
              />
            </div>
          )}
          {sourceImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sourceImages.map((img, i) => (
                <div
                  key={i}
                  className="rounded-[0.5rem] border border-[#484847] overflow-hidden bg-[#0e0e0e]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Załącznik ${i + 1}`} className="w-full" />
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Stitch design preview */}
      {project.preview_screenshot_url && (
        <Section title="Podgląd designu">
          <div className="space-y-3">
            <div className="rounded-[0.5rem] border border-[#484847] overflow-hidden bg-[#0e0e0e]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.preview_screenshot_url}
                alt="Podgląd"
                className="w-full"
              />
            </div>
            {project.preview_html_url && (
              <a
                href={project.preview_html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#81ecff] hover:underline"
              >
                <span className="material-symbols-outlined text-base">code</span>
                Otwórz interaktywny podgląd HTML
                <span className="material-symbols-outlined text-base">arrow_outward</span>
              </a>
            )}
          </div>
        </Section>
      )}

      {/* AI brief */}
      {(project.ai_brief || project.brief) && (
        <Section title="Brief AI">
          <div className="rounded-[0.5rem] bg-[#0e0e0e] border border-[#484847]/50 p-4 text-sm text-white whitespace-pre-wrap leading-relaxed">
            {project.ai_brief || project.brief}
          </div>
        </Section>
      )}

      {/* AI artifact */}
      {project.ai_artifact && (
        <Section title="Artefakt AI">
          <pre className="rounded-[0.5rem] bg-[#0e0e0e] border border-[#484847]/50 p-4 text-xs text-white whitespace-pre-wrap font-mono overflow-x-auto">
            {typeof project.ai_artifact === "string"
              ? project.ai_artifact
              : JSON.stringify(project.ai_artifact, null, 2)}
          </pre>
        </Section>
      )}

      {/* Missing info */}
      {missingInfo.length > 0 && (
        <Section title="Brakujące informacje">
          <ul className="space-y-1.5">
            {missingInfo.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white">
                <span className="text-[#ff716c] mt-0.5">!</span>
                {m}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
