import { stripe } from "./index.js";
import { db } from "./firebase.js";
import Stripe from "stripe";

// Get an existing Stripe customer || create a new record

export async function getOrCreateCustomer(
  userId: string,
  params?: Stripe.CustomerCreateParams
) {
  const userSnapshot = await db.collection("users").doc(userId).get();
  const { stripeCustomerId, email } = userSnapshot.data();

  // if the customerId doesn't exist, create it
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        firebaseUID: userId, // We want to link our firebase user ids to stripe (needed for webhooks later)
      },
      ...params,
    });
    // update firestore with the stripe customer id
    await userSnapshot.ref.update({ stripeCustomerId: customer.id });
    return customer;
  } else {
    return await stripe.customers.retrieve(stripeCustomerId);
  }
}
