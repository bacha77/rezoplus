import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { upsertSubscription } from "@/lib/stripe-db";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // Fallback for local testing without webhook secret
      event = JSON.parse(body);
    }
  } catch (error: any) {
    console.error("[WEBHOOK_ERROR]", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    if (!session?.metadata?.userId) {
      return new NextResponse("User id is required", { status: 400 });
    }

    await upsertSubscription(
      session.metadata.userId,
      subscription.customer as string,
      subscription.id,
      subscription.items.data[0].price.id,
      subscription.status,
      new Date(subscription.current_period_end * 1000)
    );
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // We can't rely on session.metadata here for recurring payments, 
    // but the customer id is already saved in the DB, so we can just update using upsert logic 
    // if we had a method to update by stripe_subscription_id. 
    // For Turso, we only have userId as primary key in upsertSubscription.
    // Let's create a custom update for invoices:
    const { client } = require("@/lib/db");
    await client.execute({
      sql: `
        UPDATE subscriptions 
        SET stripe_price_id = ?, status = ?, current_period_end = ? 
        WHERE stripe_subscription_id = ?
      `,
      args: [
        subscription.items.data[0].price.id,
        subscription.status,
        new Date(subscription.current_period_end * 1000).toISOString(),
        subscription.id
      ]
    });
  }

  return new NextResponse(null, { status: 200 });
}
