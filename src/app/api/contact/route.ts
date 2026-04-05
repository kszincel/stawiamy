import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { name, email, message, projectId } = await request.json() as {
      name?: string;
      email: string;
      message: string;
      projectId?: string;
    };

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return Response.json(
        { error: "Prawidłowy adres email jest wymagany" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return Response.json(
        { error: "Wiadomość jest wymagana" },
        { status: 400 }
      );
    }

    // Save to Supabase
    const { error: insertError } = await supabase
      .from("inquiries")
      .insert({
        name: name?.trim() || null,
        email: email.trim(),
        message: message.trim(),
        project_id: projectId || null,
      });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return Response.json(
        { error: "Nie udało się zapisać wiadomości" },
        { status: 500 }
      );
    }

    // Send webhook to n8n (non-blocking, skip if not configured)
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name?.trim() || null,
          email: email.trim(),
          message: message.trim(),
          projectId: projectId || null,
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => {
        console.error("n8n webhook error:", err);
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Contact error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      },
      { status: 500 }
    );
  }
}
