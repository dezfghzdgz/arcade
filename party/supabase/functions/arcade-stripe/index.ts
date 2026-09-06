// Stripe webhook pro Arcade Pass -> profiles.pass_until. Nasazení:
//   supabase functions deploy arcade-stripe --no-verify-jwt
//   supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_...
// Stripe -> Webhooks -> URL funkce, eventy: checkout.session.completed, invoice.paid, customer.subscription.updated, customer.subscription.deleted
// Payment Link (recurring, monthly) -> After payment: https://tvoje-adresa/?paid=1
import Stripe from "https://esm.sh/stripe@16?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
Deno.serve(async (req) => {
  let event: Stripe.Event;
  try { event = await stripe.webhooks.constructEventAsync(await req.text(), req.headers.get("stripe-signature")!, Deno.env.get("STRIPE_WEBHOOK_SECRET")!); }
  catch (e) { return new Response(`bad signature: ${e.message}`, { status: 400 }); }
  const untilOf = (sub: Stripe.Subscription) => new Date(((sub.status === "canceled" && sub.ended_at) ? sub.ended_at : sub.current_period_end) * 1000).toISOString();
  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.client_reference_id && s.subscription) { const sub = await stripe.subscriptions.retrieve(s.subscription as string); await db.from("profiles").update({ pass_until: untilOf(sub), stripe_customer: s.customer as string, stripe_subscription: sub.id }).eq("id", s.client_reference_id); }
  } else if (event.type === "invoice.paid") {
    const inv = event.data.object as Stripe.Invoice;
    if (inv.subscription) { const sub = await stripe.subscriptions.retrieve(inv.subscription as string); await db.from("profiles").update({ pass_until: untilOf(sub) }).eq("stripe_subscription", sub.id); }
  } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await db.from("profiles").update({ pass_until: untilOf(sub) }).eq("stripe_subscription", sub.id);
  }
  return new Response("ok");
});
