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

    // Trigger n8n agent webhook (non-blocking - fire and forget)
    const webhookUrl = process.env.N8N_AGENT_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "project_finalized",
          projectId: project.id,
          prompt: project.prompt,
          product_type: project.product_type,
          package: project.package,
          preview_type: project.preview_type,
          estimated_price: project.estimated_price,
          deposit_amount: project.deposit_amount,
          description: project.description,
          features: project.features,
          timeline: project.timeline,
          brief: project.brief,
          preview_screenshot_url: project.preview_screenshot_url,
          preview_html_url: project.preview_html_url,
          source_url: project.source_url,
          details,
          contact_email: email,
          contact_name: name,
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => {
        console.error("n8n webhook failed:", err);
      });
    }

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
