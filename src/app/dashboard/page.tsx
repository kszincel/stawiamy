import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { StatusBadge } from "./status";

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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user?.email === "konrad@ikonmedia.pl";

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      "id, prompt, product_type, package, estimated_price, status, contact_email, contact_name, preview_screenshot_url, created_at"
    )
    .order("created_at", { ascending: false });

  const list: Project[] = (projects ?? []) as Project[];

  // Stats for admin
  const totalRevenue = list.reduce((sum, p) => sum + (p.estimated_price || 0), 0);
  const statusCounts = list.reduce<Record<string, number>>((acc, p) => {
    const s = p.status || "unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
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
              Sfinalizowanych
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

      {list.length === 0 ? (
        <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-[#484847] mb-4 block">
            inbox
          </span>
          <h2 className="text-lg font-bold text-white mb-2">Brak projektów</h2>
          <p className="text-sm text-[#adaaaa] mb-6">
            Wróć na stronę główną i opisz swój pomysł.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#c3f400] text-[#0e0e0e] font-bold px-6 py-3 text-sm hover:opacity-90 transition-opacity"
          >
            Stwórz projekt
          </Link>
        </div>
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
