import { stripe } from "./index.js";

// Create a Stripe Payment Intent with a specified amount
// This is for one-off payments, i.e. for unauthenticated users
export async function createPaymentIntent(amount: number) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    // receipt_email: 'example@test.com'
  });

  // paymentIntent.status gives you information on the payment status

  return paymentIntent;
}
