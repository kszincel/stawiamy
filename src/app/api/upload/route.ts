import { supabase } from "@/lib/supabase";

export const maxDuration = 30;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "Brak pliku" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `Typ pliku niedozwolony: ${file.type}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return Response.json(
        { error: `Plik za duży (max 20 MB)` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "bin";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("project-attachments")
      .upload(filename, file, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      return Response.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrl } = supabase.storage
      .from("project-attachments")
      .getPublicUrl(filename);

    return Response.json({
      url: publicUrl.publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      },
      { status: 500 }
    );
  }
}
