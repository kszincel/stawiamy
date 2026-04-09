import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

const LOCKED_STATUSES = new Set(["in_progress", "delivered", "cancelled"]);
const EDITABLE_FIELDS = ["prompt", "details", "contact_name", "source_url"] as const;
type EditableField = (typeof EDITABLE_FIELDS)[number];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const serverClient = await createClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing, error: fetchErr } = await serverClient
    .from("projects")
    .select("id, contact_email, status")
    .eq("id", id)
    .single();

  if (fetchErr || !existing) {
    return Response.json({ error: "Projekt nie został znaleziony" }, { status: 404 });
  }

  const isOwner =
    !!existing.contact_email && existing.contact_email === user.email;

  if (!isOwner) {
    return Response.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  if (LOCKED_STATUSES.has(existing.status || "")) {
    return Response.json(
      { error: "Projekt jest zablokowany do edycji" },
      { status: 409 }
    );
  }

  const updates: Record<string, unknown> = {};
  for (const k of EDITABLE_FIELDS as readonly EditableField[]) {
    if (k in body) updates[k] = body[k];
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Brak pól do aktualizacji" }, { status: 400 });
  }

  const { data: project, error: updateErr } = await serverClient
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateErr || !project) {
    return Response.json(
      { error: updateErr?.message || "Nie udało się zapisać" },
      { status: 500 }
    );
  }

  return Response.json({ success: true, project });
}

const ADMIN_EMAIL = "konrad@ikonmedia.pl";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const serverClient = await createClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (user?.email !== ADMIN_EMAIL) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // First verify the project exists
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) {
    return Response.json({ error: "Projekt nie istnieje" }, { status: 404 });
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return Response.json(
      { error: `Nie udało się usunąć: ${error.message}` },
      { status: 500 }
    );
  }

  // Bust Next.js cache so dashboard list refreshes
  revalidatePath("/dashboard");

  return Response.json({ success: true });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    return Response.json(
      { error: "Projekt nie został znaleziony" },
      { status: 404 }
    );
  }

  return Response.json(project);
}
