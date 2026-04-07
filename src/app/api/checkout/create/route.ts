import { createClient } from "@/lib/supabase-server";
import { stripe } from "@/lib/stripe";

interface Body {
  projectId: string;
  discountCode?: string;
}

const ADMIN_EMAIL = "konrad@ikonmedia.pl";

async function triggerN8n(project: Record<string, unknown>) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
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
    });
  } catch (e) {
    console.error("n8n webhook error:", e);
  }
}

export async function POST(request: Request) {
  try {
    const { projectId, discountCode } = (await request.json()) as Body;

    if (!projectId) {
      return Response.json({ error: "projectId jest wymagany" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return Response.json({ error: "Projekt nie istnieje" }, { status: 404 });
    }

    const isAdmin = user.email === ADMIN_EMAIL;
    const isOwner = project.contact_email === user.email;
    if (!isAdmin && !isOwner) {
      return Response.json({ error: "Brak dostępu" }, { status: 403 });
    }

    if (!project.deposit_amount || project.deposit_amount <= 0) {
      return Response.json(
        { error: "Brak kwoty zaliczki dla tego projektu" },
        { status: 400 }
      );
    }

    const baseAmount: number = project.deposit_amount;
    let discountPercent = 0;
    let appliedCode: string | null = null;

    if (discountCode && discountCode.trim()) {
      const normalized = discountCode.trim().toUpperCase();
      const { data: dc } = await supabase
        .from("discount_codes")
        .select("code, discount_percent, max_uses, used_count, active, expires_at")
        .eq("code", normalized)
        .eq("active", true)
        .maybeSingle();

      if (!dc) {
        return Response.json({ error: "Nieprawidłowy kod rabatowy" }, { status: 400 });
      }
      if (dc.expires_at && new Date(dc.expires_at) < new Date()) {
        return Response.json({ error: "Kod rabatowy wygasł" }, { status: 400 });
      }
      if (dc.max_uses != null && dc.used_count >= dc.max_uses) {
        return Response.json({ error: "Kod rabatowy został wykorzystany" }, { status: 400 });
      }
      discountPercent = dc.discount_percent;
      appliedCode = dc.code;
    }

    const finalAmount = Math.round(baseAmount * (1 - discountPercent / 100));

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://stawiamy.vercel.app";

    if (finalAmount === 0) {
      const { data: updated, error: updateErr } = await supabase
        .from("projects")
        .update({
          status: "deposit_paid",
          discount_code: appliedCode,
          final_deposit_amount: 0,
          deposit_paid_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select()
        .single();

      if (updateErr || !updated) {
        return Response.json(
          { error: updateErr?.message || "Aktualizacja projektu nie powiodła się" },
          { status: 500 }
        );
      }

      if (appliedCode) {
        // Increment used_count
        const { data: dcRow } = await supabase
          .from("discount_codes")
          .select("used_count")
          .eq("code", appliedCode)
          .single();
        if (dcRow) {
          await supabase
            .from("discount_codes")
            .update({ used_count: (dcRow.used_count || 0) + 1 })
            .eq("code", appliedCode);
        }
      }

      await triggerN8n(updated);

      return Response.json({
        free: true,
        redirectUrl: `/dashboard/${projectId}?payment=success`,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "blik", "p24"],
      line_items: [
        {
          price_data: {
            currency: "pln",
            product_data: {
              name: `Zaliczka: ${project.product_type || "Projekt"}${
                project.package ? ` - ${project.package}` : ""
              }`,
              description: project.description
                ? String(project.description).substring(0, 200)
                : undefined,
            },
            unit_amount: finalAmount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/${projectId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/${projectId}?payment=cancelled`,
      metadata: {
        project_id: projectId,
        discount_code: appliedCode || "",
        original_amount: baseAmount.toString(),
        final_amount: finalAmount.toString(),
      },
      customer_email: project.contact_email || undefined,
    });

    await supabase
      .from("projects")
      .update({ stripe_session_id: session.id })
      .eq("id", projectId);

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("checkout/create error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Błąd tworzenia płatności" },
      { status: 500 }
    );
  }
}
