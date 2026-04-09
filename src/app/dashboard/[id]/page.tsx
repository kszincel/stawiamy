import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "../status";
import StatusUpdater from "./StatusUpdater";
import EditDetails from "./EditDetails";
import PaymentSection from "./PaymentSection";
import PaymentToast from "./PaymentToast";
import RecommendedActions from "./RecommendedActions";
import AdminChat from "./AdminChat";
import ArtifactViewer from "./ArtifactViewer";
import WorkspaceLauncher from "./WorkspaceLauncher";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

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

interface Attachment {
  url: string;
  filename: string;
  size: number;
  type: string;
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

const FIELD_LABELS: Record<string, string> = {
  expected_output: "Oczekiwany efekt końcowy",
  target_audience: "Grupa docelowa",
  target_users: "Użytkownicy",
  business_goal: "Główny cel",
  sections: "Sekcje",
  visual_style: "Styl wizualny",
  brand_colors: "Kolory marki",
  main_cta: "Główny przycisk akcji",
  integrations: "Integracje",
  main_features: "Najważniejsze funkcje",
  auth_method: "Metoda logowania",
  data_storage: "Przechowywane dane",
  mobile_priority: "Priorytet mobile",
  trigger: "Co uruchamia automatyzację",
  data_sources: "Źródła danych",
  destinations: "Gdzie zapisywać rezultaty",
  frequency: "Częstotliwość uruchamiania",
  error_handling: "Obsługa błędów",
  existing_tools: "Obecnie używane narzędzia",
  agent_purpose: "Cel agenta",
  knowledge_sources: "Źródła wiedzy",
  review_method: "Sposób sprawdzania efektów",
  persona: "Sposób zachowania",
  purpose: "Cel produktu",
  input_fields: "Pola wejściowe",
  logic: "Logika / formuły",
  output_format: "Format wyjścia",
  save_results: "Zapis wyników",
  additional_notes: "Dodatkowe uwagi",
};

function humanizeKey(k: string): string {
  if (FIELD_LABELS[k]) return FIELD_LABELS[k];
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

  // Auth check: admin sees all, owner sees own (by user_id or contact_email)
  if (!isAdmin) {
    const isOwnerByEmail = !!user?.email && project.contact_email === user.email;
    const isOwnerById = !!user?.id && project.user_id === user.id;
    if (!isOwnerByEmail && !isOwnerById) notFound();
  }

  const features: string[] = Array.isArray(project.features) ? project.features : [];
  const details = (project.details as Record<string, unknown>) || {};
  const sourceImages: string[] = Array.isArray(project.source_images) ? project.source_images : [];
  const attachments: Attachment[] = Array.isArray(project.attachments) ? project.attachments : [];
  const missingInfo: string[] = Array.isArray(project.ai_missing_info) ? project.ai_missing_info : [];
  const recommendedActions: string[] = Array.isArray(project.ai_recommended_actions)
    ? (project.ai_recommended_actions as string[]).filter((x): x is string => typeof x === "string")
    : [];
  const adminNotes: Array<{ content: string; created_at: string }> = Array.isArray(
    project.admin_notes
  )
    ? (project.admin_notes as Array<{ content: string; created_at: string }>)
    : [];
  const completedActions: string[] = Array.isArray(project.completed_actions)
    ? (project.completed_actions as string[]).filter((x): x is string => typeof x === "string")
    : [];

  const isOwner = !!user?.email && project.contact_email === user.email;
  const paidStatuses = ["deposit_paid", "in_progress", "delivered", "completed"];
  const isPaid = paidStatuses.includes(project.status || "");

  return (
    <div className="space-y-6">
      <PaymentToast />
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

      {/* Delivery progress (e.g. PhD thesis) */}
      {(() => {
        const ds = (project.delivery_state as { initialized?: boolean; sections?: Array<{ name: string; status: string; written_at?: string }>; last_section_written?: string } | null) || null;
        if (!ds || !ds.initialized || !Array.isArray(ds.sections)) return null;
        const allSections = ds.sections;
        const sections = allSections.filter((s) => s.status !== "skip");
        const skippedCount = allSections.length - sections.length;
        const done = sections.filter((s) => s.status === "done").length;
        const total = sections.length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        return (
          <Section title="Postęp realizacji">
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-[#c3f400]">{done} / {total}{skippedCount > 0 && <span className="text-sm text-[#adaaaa] ml-2 font-normal">(+{skippedCount} pominięte)</span>}</div>
                <div className="text-xs text-[#adaaaa]">
                  {ds.last_section_written ? `Ostatnio: ${ds.last_section_written}` : ""}
                </div>
              </div>
              <div className="h-2 rounded-full bg-[#0e0e0e] border border-[#484847]/50 overflow-hidden">
                <div className="h-full bg-[#c3f400] transition-all" style={{ width: `${pct}%` }} />
              </div>
              {project.delivered_file_url && (
                <a
                  href={`${project.delivered_file_url}?t=${new Date(project.delivery_updated_at || Date.now()).getTime()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#c3f400] text-[#0e0e0e] text-xs font-bold px-4 py-2 hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Pobierz aktualną wersję ({project.delivered_file_name || "plik"})
                </a>
              )}
              <ul className="space-y-1.5 max-h-[400px] overflow-y-auto pr-2">
                {sections.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={`material-symbols-outlined text-base mt-0.5 ${s.status === "done" ? "text-[#c3f400]" : "text-[#484847]"}`}>
                      {s.status === "done" ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <span className={s.status === "done" ? "text-white" : "text-[#adaaaa]"}>{s.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        );
      })()}

      {/* Payment section for owner when finalized */}
      {isOwner && !isAdmin && project.status === "finalized" && project.deposit_amount && (
        <PaymentSection
          projectId={project.id}
          depositAmount={project.deposit_amount}
        />
      )}

      {/* Paid badge */}
      {isOwner && !isAdmin && isPaid && (
        <div className="rounded-[0.75rem] border border-[#c3f400] bg-[#c3f400]/10 p-4 text-sm text-[#c3f400] font-bold">
          ✓ Zapłacono
        </div>
      )}

      {/* Admin status updater */}
      {isAdmin && (
        <Section title="Akcje admina">
          <StatusUpdater
            projectId={project.id}
            currentStatus={project.status || "preview_generating"}
          />
        </Section>
      )}

      {/* Owner edit (only when not admin and email matches) */}
      {!isAdmin && user?.email && project.contact_email === user.email && (
        <Section title="Twoje dane">
          <EditDetails
            projectId={project.id}
            productType={(project.product_type || "website") as
              | "website"
              | "app"
              | "automation"
              | "agent"
              | "digital_product"
              | "redesign"}
            prompt={project.prompt}
            details={(project.details as Record<string, unknown>) || null}
            contactEmail={project.contact_email}
            contactName={project.contact_name}
            sourceUrl={project.source_url}
            status={project.status}
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

      {/* Attachments */}
      {attachments.length > 0 && (
        <Section title="Załączniki">
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

      {/* Admin-only: technical brief, artifact, missing info, recommended actions */}
      {isAdmin && (
        <>
          <div className="rounded-[0.5rem] border border-[#c3f400]/30 bg-[#c3f400]/5 px-4 py-2 text-xs text-[#c3f400] uppercase tracking-wider font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">lock</span>
            Sekcje widoczne tylko dla admina
          </div>

          <WorkspaceLauncher projectId={project.id} />

          <Section title="Chat z Claude">
            <AdminChat projectId={project.id} />
          </Section>

          {adminNotes.length > 0 && (
            <Section title="Notatki administratora">
              <ul className="space-y-3">
                {adminNotes.map((n, i) => (
                  <li
                    key={i}
                    className="rounded-[0.5rem] border border-[#81ecff]/30 bg-[#0e0e0e] p-4"
                  >
                    <div className="text-xs text-[#81ecff] uppercase tracking-wider mb-2">
                      {formatDate(n.created_at)}
                    </div>
                    <div className="text-sm text-white whitespace-pre-wrap">
                      {n.content}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(project.ai_brief || project.brief) && (
            <Section title="Brief AI (admin only)">
              <div className="rounded-[0.5rem] bg-[#0e0e0e] border border-[#484847]/50 p-4 leading-relaxed">
                <MarkdownRenderer content={String(project.ai_brief || project.brief)} />
              </div>
            </Section>
          )}

          {project.ai_artifact && (
            <Section title="Artefakt AI (admin only)">
              <ArtifactViewer
                projectId={project.id}
                artifact={
                  typeof project.ai_artifact === "string"
                    ? project.ai_artifact
                    : JSON.stringify(project.ai_artifact, null, 2)
                }
              />
            </Section>
          )}

          {missingInfo.length > 0 && (
            <Section title="Brakujące informacje (admin only)">
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

          {recommendedActions.length > 0 && (
            <Section title="Zalecane akcje (admin only)">
              <RecommendedActions
                projectId={project.id}
                actions={recommendedActions}
                completed={completedActions}
                isAdmin={isAdmin}
              />
            </Section>
          )}
        </>
      )}
    </div>
  );
}
