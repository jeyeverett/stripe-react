import { stripe } from "./index.js";
import { db } from "./firebase.js";
import Stripe from "stripe";

type Customer = Stripe.Customer & { metadata: Object };

// Get an existing Stripe customer || create a new record
export async function getOrCreateCustomer(
  userId: string,
  params?: Stripe.CustomerCreateParams
): Promise<Customer> {
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
    return (await stripe.customers.retrieve(stripeCustomerId)) as Customer;
  }
}

// create a SetupIntent used to save a credit card for later use
export async function createSetupIntent(userId: string) {
  const { id } = await getOrCreateCustomer(userId);

  return stripe.setupIntents.create({
    customer: id,
  });
}

// return all payment sources associated with a user
export async function listPaymentMethods(userId: string) {
  const { id } = await getOrCreateCustomer(userId);

  return await stripe.customers.listPaymentMethods(id, {
    type: "card",
  });
}

/* NOTES */
/* 
  To create a subscription, you need to create one in Stripe, under Products
*/
