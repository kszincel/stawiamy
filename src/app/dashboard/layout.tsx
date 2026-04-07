import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardNav from "./components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = user.email === "konrad@ikonmedia.pl";

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      <DashboardNav email={user.email ?? ""} isAdmin={isAdmin} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
