import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import type Stripe from "stripe";

// To set up Stripe webhook:
// 1. Go to https://dashboard.stripe.com/webhooks
// 2. Add endpoint: https://stawiamy.vercel.app/api/checkout/webhook
// 3. Select event: checkout.session.completed
// 4. Copy signing secret (whsec_...)
// 5. Set STRIPE_WEBHOOK_SECRET in Vercel env vars

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
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return new Response(
      `Webhook Error: ${err instanceof Error ? err.message : "invalid"}`,
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const projectId = session.metadata?.project_id;
    const discountCode = session.metadata?.discount_code || null;
    const finalAmount = session.metadata?.final_amount
      ? parseInt(session.metadata.final_amount, 10)
      : null;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;

    if (!projectId) {
      console.error("Webhook: no project_id in session metadata");
      return new Response("ok", { status: 200 });
    }

    const { data: updated, error } = await supabase
      .from("projects")
      .update({
        status: "deposit_paid",
        stripe_payment_intent_id: paymentIntentId,
        final_deposit_amount: finalAmount,
        deposit_paid_at: new Date().toISOString(),
        discount_code: discountCode || null,
      })
      .eq("id", projectId)
      .select()
      .single();

    if (error || !updated) {
      console.error("Webhook: project update failed", error);
      return new Response("update failed", { status: 500 });
    }

    if (discountCode) {
      const { data: dcRow } = await supabase
        .from("discount_codes")
        .select("used_count")
        .eq("code", discountCode)
        .single();
      if (dcRow) {
        await supabase
          .from("discount_codes")
          .update({ used_count: (dcRow.used_count || 0) + 1 })
          .eq("code", discountCode);
      }
    }

    await triggerN8n(updated);
  }

  return new Response("ok", { status: 200 });
}
