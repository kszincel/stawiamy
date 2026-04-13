import { createClient } from "@/lib/supabase-server";

const ADMIN_EMAIL = "konrad@ikonmedia.pl";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await request.json();
  if (!content || typeof content !== "string" || !content.trim()) {
    return Response.json({ error: "Brak treści notatki" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("admin_notes")
    .eq("id", id)
    .single();

  const existing = Array.isArray(project?.admin_notes)
    ? (project.admin_notes as Array<{ content: string; created_at: string }>)
    : [];

  const note = { content: content.trim(), created_at: new Date().toISOString() };
  const updated = [...existing, note];

  const { error } = await supabase
    .from("projects")
    .update({ admin_notes: updated })
    .eq("id", id);

  if (error) {
    return Response.json({ error: `DB update failed: ${error.message}` }, { status: 500 });
  }

  return Response.json(note);
}
