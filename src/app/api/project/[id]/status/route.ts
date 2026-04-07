import { createClient } from "@/lib/supabase-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = (await request.json()) as { status?: string };

  if (!status) {
    return Response.json({ error: "status jest wymagany" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email !== "konrad@ikonmedia.pl") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project, error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error || !project) {
    return Response.json(
      { error: error?.message || "Failed" },
      { status: 500 }
    );
  }

  if (status === "deposit_paid" && !project.ai_processed_at) {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "deposit_paid",
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
          details: project.details,
          contact_email: project.contact_email,
          contact_name: project.contact_name,
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);
    }
  }

  return Response.json({ success: true, project });
}
