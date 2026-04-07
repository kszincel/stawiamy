import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { code } = (await request.json()) as { code?: string };

    if (!code || typeof code !== "string") {
      return Response.json(
        { valid: false, error: "Kod jest wymagany" },
        { status: 400 }
      );
    }

    const normalized = code.trim().toUpperCase();

    const { data, error } = await supabase
      .from("discount_codes")
      .select("code, discount_percent, max_uses, used_count, active, expires_at")
      .eq("code", normalized)
      .eq("active", true)
      .maybeSingle();

    if (error || !data) {
      return Response.json({ valid: false, error: "Kod nie istnieje lub jest nieaktywny" });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return Response.json({ valid: false, error: "Kod wygasł" });
    }

    if (data.max_uses != null && data.used_count >= data.max_uses) {
      return Response.json({ valid: false, error: "Kod został wykorzystany" });
    }

    return Response.json({
      valid: true,
      discount_percent: data.discount_percent,
      code: data.code,
    });
  } catch (e) {
    return Response.json(
      {
        valid: false,
        error: e instanceof Error ? e.message : "Błąd walidacji kodu",
      },
      { status: 500 }
    );
  }
}
