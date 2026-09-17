import { client } from "./db";

export const getSubscription = async (userId: string): Promise<any> => {
  const result = await client.execute({
    sql: 'SELECT * FROM subscriptions WHERE user_id = ?',
    args: [userId]
  });
  return result.rows[0];
};

export const upsertSubscription = async (
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  status: string,
  currentPeriodEnd: Date
): Promise<void> => {
  await client.execute({
    sql: `
      INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_end)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        stripe_customer_id = excluded.stripe_customer_id,
        stripe_subscription_id = excluded.stripe_subscription_id,
        stripe_price_id = excluded.stripe_price_id,
        status = excluded.status,
        current_period_end = excluded.current_period_end
    `,
    args: [
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      status,
      currentPeriodEnd.toISOString()
    ]
  });
};
