import { supabase } from "@/lib/supabase";

export const maxDuration = 30;

interface FinalizeBody {
  projectId: string;
  email: string;
  name?: string;
  details: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const { projectId, email, name, details } = (await request.json()) as FinalizeBody;

    if (!projectId || !email || !details) {
      return Response.json(
        { error: "projectId, email i details są wymagane" },
        { status: 400 }
      );
    }

    // Update project with details and contact info
    const { data: project, error: updateError } = await supabase
      .from("projects")
      .update({
        details,
        contact_email: email,
        contact_name: name || null,
        status: "finalized",
        finalized_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single();

    if (updateError || !project) {
      return Response.json(
        { error: `Nie udało się zapisać szczegółów: ${updateError?.message}` },
        { status: 500 }
      );
    }

    // No n8n webhook here - it only fires after deposit payment via /api/project/[id]/status

    // Send magic link so user can track progress in dashboard (best-effort)
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://stawiamy.vercel.app";
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback?next=/dashboard/${project.id}`,
          shouldCreateUser: true,
        },
      });
    } catch (e) {
      console.error("Magic link error:", e);
    }

    return Response.json({
      success: true,
      projectId: project.id,
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
