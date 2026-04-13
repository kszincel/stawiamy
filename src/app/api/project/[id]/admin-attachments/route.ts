import { createClient } from "@/lib/supabase-server";
import { supabase as supabaseAdmin } from "@/lib/supabase";

const ADMIN_EMAIL = "konrad@ikonmedia.pl";

const ALLOWED_EXTS = [
  "pdf","jpg","jpeg","png","webp","gif","heic","doc","docx",
  "xls","xlsx","odt","ods","csv","txt","md","json","zip",
];
const MAX_SIZE = 20 * 1024 * 1024;

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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "Brak pliku" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) {
    return Response.json({ error: `Typ pliku niedozwolony: ${ext}` }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: "Plik za duży (max 20 MB)" }, { status: 400 });
  }

  const safeExt = ext || "bin";
  const storageName = `admin-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${safeExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("project-attachments")
    .upload(storageName, file, {
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: publicUrl } = supabaseAdmin.storage
    .from("project-attachments")
    .getPublicUrl(storageName);

  const attachment = {
    url: publicUrl.publicUrl,
    filename: file.name,
    size: file.size,
    type: file.type,
    uploaded_at: new Date().toISOString(),
  };

  // Append to admin_attachments array
  const { data: project } = await supabase
    .from("projects")
    .select("admin_attachments")
    .eq("id", id)
    .single();

  const existing = Array.isArray(project?.admin_attachments) ? project.admin_attachments : [];
  const updated = [...existing, attachment];

  const { error: updateError } = await supabase
    .from("projects")
    .update({ admin_attachments: updated })
    .eq("id", id);

  if (updateError) {
    return Response.json({ error: `DB update failed: ${updateError.message}` }, { status: 500 });
  }

  return Response.json(attachment);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json();

  const { data: project } = await supabase
    .from("projects")
    .select("admin_attachments")
    .eq("id", id)
    .single();

  const existing = Array.isArray(project?.admin_attachments) ? project.admin_attachments : [];
  const updated = existing.filter((a: { url: string }) => a.url !== url);

  await supabase
    .from("projects")
    .update({ admin_attachments: updated })
    .eq("id", id);

  return Response.json({ ok: true });
}
