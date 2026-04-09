import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { StatusBadge } from "./status";
import ChatInput from "../components/ChatInput";

export const dynamic = "force-dynamic";

interface Project {
  id: string;
  prompt: string | null;
  product_type: string | null;
  package: string | null;
  estimated_price: number | null;
  status: string | null;
  contact_email: string | null;
  contact_name: string | null;
  preview_screenshot_url: string | null;
  created_at: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(n: number | null) {
  if (!n) return "—";
  return `${n.toLocaleString("pl-PL")} PLN`;
}

type FilterKey = "all" | "paid" | "unpaid" | "cancelled";

const FILTER_STATUSES: Record<FilterKey, string[] | null> = {
  all: null,
  paid: ["deposit_paid", "in_progress", "delivered"],
  unpaid: ["preview_generating", "preview_ready", "finalized"],
  cancelled: ["cancelled"],
};

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "Wszystkie",
  paid: "Opłacone",
  unpaid: "Nieopłacone",
  cancelled: "Anulowane",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user?.email === "konrad@ikonmedia.pl";

  let query = supabase
    .from("projects")
    .select(
      "id, prompt, product_type, package, estimated_price, status, contact_email, contact_name, preview_screenshot_url, created_at"
    )
    .order("created_at", { ascending: false });

  // Non-admin sees only their own projects (by user_id or contact_email)
  if (!isAdmin && user) {
    query = query.or(
      `user_id.eq.${user.id},contact_email.eq.${user.email}`
    );
  }

  const { data: projects, error } = await query;

  const allList: Project[] = (projects ?? []) as Project[];

  // Admin filter. Default: "paid" for admin, "all" for non-admin.
  const defaultFilter: FilterKey = isAdmin ? "paid" : "all";
  const activeFilter: FilterKey = isAdmin && filterParam && filterParam in FILTER_STATUSES
    ? (filterParam as FilterKey)
    : defaultFilter;
  const filterStatuses = FILTER_STATUSES[activeFilter];
  const list: Project[] = filterStatuses
    ? allList.filter((p) => p.status && filterStatuses.includes(p.status))
    : allList;

  // Counts per filter (computed from full list, for tab badges)
  const filterCounts: Record<FilterKey, number> = {
    all: allList.length,
    paid: allList.filter((p) => p.status && FILTER_STATUSES.paid!.includes(p.status)).length,
    unpaid: allList.filter((p) => p.status && FILTER_STATUSES.unpaid!.includes(p.status)).length,
    cancelled: allList.filter((p) => p.status && FILTER_STATUSES.cancelled!.includes(p.status)).length,
  };

  // Stats for admin (always computed from full list, ignoring active filter)
  const totalRevenue = allList.reduce((sum, p) => sum + (p.estimated_price || 0), 0);
  const statusCounts = allList.reduce<Record<string, number>>((acc, p) => {
    const s = p.status || "unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {isAdmin ? "Wszystkie projekty" : "Twoje projekty"}
          </h1>
          <p className="text-sm text-[#adaaaa]">
            {list.length === 0
              ? "Brak projektów"
              : `${list.length} ${list.length === 1 ? "projekt" : list.length < 5 ? "projekty" : "projektów"}`}
          </p>
        </div>
        {list.length > 0 && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#81ecff] px-5 py-2.5 text-sm font-bold text-[#005762] hover:bg-[#00d4ec] transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Nowy projekt
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-[0.5rem] border border-[#ff716c]/40 bg-[#ff716c]/5 px-4 py-3 text-sm text-[#ff716c]">
          {error.message}
        </div>
      )}

      {isAdmin && list.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-[0.5rem] border border-[#484847] bg-[#131313] p-5">
            <div className="text-xs font-medium text-[#adaaaa] uppercase tracking-wider mb-2">
              Wszystkich projektów
            </div>
            <div className="text-2xl font-bold text-white">{list.length}</div>
          </div>
          <div className="rounded-[0.5rem] border border-[#484847] bg-[#131313] p-5">
            <div className="text-xs font-medium text-[#adaaaa] uppercase tracking-wider mb-2">
              Wartość pipeline
            </div>
            <div className="text-2xl font-bold text-[#c3f400]">
              {formatPrice(totalRevenue)}
            </div>
          </div>
          <div className="rounded-[0.5rem] border border-[#484847] bg-[#131313] p-5">
            <div className="text-xs font-medium text-[#adaaaa] uppercase tracking-wider mb-2">
              Aktywnych
            </div>
            <div className="text-2xl font-bold text-[#81ecff]">
              {(statusCounts.finalized || 0) +
                (statusCounts.deposit_paid || 0) +
                (statusCounts.in_progress || 0) +
                (statusCounts.delivered || 0)}
            </div>
          </div>
          <div className="rounded-[0.5rem] border border-[#484847] bg-[#131313] p-5">
            <div className="text-xs font-medium text-[#adaaaa] uppercase tracking-wider mb-2">
              W realizacji
            </div>
            <div className="text-2xl font-bold text-white">
              {statusCounts.in_progress || 0}
            </div>
          </div>
        </div>
      )}

      {isAdmin && allList.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-[#484847]/50 pb-4">
          {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => {
            const active = key === activeFilter;
            return (
              <Link
                key={key}
                href={key === "all" ? "/dashboard" : `/dashboard?filter=${key}`}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                  active
                    ? "bg-[#81ecff] border-[#81ecff] text-[#005762]"
                    : "bg-[#1a1a1a] border-[#484847] text-[#adaaaa] hover:border-[#81ecff]/50 hover:text-white"
                }`}
              >
                {FILTER_LABELS[key]}
                <span
                  className={`text-xs rounded-full px-2 py-0.5 ${
                    active ? "bg-[#005762]/20 text-[#005762]" : "bg-[#484847]/50 text-[#adaaaa]"
                  }`}
                >
                  {filterCounts[key]}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {list.length === 0 ? (
        allList.length > 0 && isAdmin ? (
          <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-8 text-center">
            <p className="text-sm text-[#adaaaa]">
              Brak projektów w kategorii &quot;{FILTER_LABELS[activeFilter]}&quot;.
            </p>
          </div>
        ) : (
        <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-8 md:p-12 flex flex-col items-center text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tighter text-white mb-3 font-[var(--font-plus-jakarta)]">
            Stwórz swój pierwszy projekt
          </h2>
          <p className="text-sm text-[#adaaaa] mb-8 max-w-xl">
            Opisz czego potrzebujesz - dostaniesz podgląd w kilka minut.
          </p>
          <ChatInput variant="hero" />
        </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/${p.id}`}
              className="group rounded-[0.75rem] border border-[#484847] bg-[#131313] overflow-hidden hover:border-[#81ecff]/50 transition-colors"
            >
              <div className="aspect-video bg-[#1a1a1a] overflow-hidden border-b border-[#484847]/50 relative">
                {p.preview_screenshot_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.preview_screenshot_url}
                    alt=""
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-[#484847]">
                      image
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge status={p.status || "preview_generating"} />
                  <span className="text-xs text-[#adaaaa] shrink-0">
                    {formatDate(p.created_at)}
                  </span>
                </div>

                <p className="text-sm text-white line-clamp-2 leading-relaxed">
                  {p.prompt || "Bez opisu"}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#484847]/30">
                  <span className="text-xs text-[#adaaaa] capitalize">
                    {p.package || p.product_type || "—"}
                  </span>
                  <span className="text-sm font-bold text-[#c3f400]">
                    {formatPrice(p.estimated_price)}
                  </span>
                </div>

                {isAdmin && p.contact_email && (
                  <div className="text-xs text-[#adaaaa] truncate pt-1">
                    {p.contact_name ? `${p.contact_name} · ` : ""}
                    {p.contact_email}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
