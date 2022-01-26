import { stripe } from "./index.js";
import Stripe from "stripe";
import { db } from "./firebase.js";
import { FieldValue } from "firebase-admin/firestore";

//Specific webhook event type handlers
const webhookHandlers = {
  "checkout.session.completed": async (data: Stripe.Event.Data) => {
    // code
  },
  "payment_intent.succeeded": async (data: Stripe.PaymentIntent) => {
    // code
  },
  "payment_intent.payment_failed": async (data: Stripe.PaymentIntent) => {
    // code
  },
  "customer.subscription.deleted": async (data: Stripe.Subscription) => {
    // code
  },
  "customer.subscription.created": async (
    subscription: Stripe.Subscription
  ) => {
    const customer = (await stripe.customers.retrieve(
      subscription.customer as string
    )) as Stripe.Customer;

    const userId = customer.metadata.firebaseUID;
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      activePlans: FieldValue.arrayUnion(subscription.id),
    });
  },
  "invoice.payment_succeeded": async (invoice: Stripe.Invoice) => {
    // code
  },
  "invoice.payment_failed": async (invoice: Stripe.Invoice) => {
    const customer = (await stripe.customers.retrieve(
      invoice.customer as string
    )) as Stripe.Customer;
    const userSnapshot = await db
      .collection("users")
      .doc(customer.metadata.firebaseUID)
      .get();
    // Don't cancel the subscription right away, instead update the user's status and notify them the subscription will be canceled in a few days
    await userSnapshot.ref.update({ status: "PAST_DUE" });
  },
};

// We need to validate the webhook secret and then call the handler for the event type
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  try {
    const event = await stripe.webhooks.constructEventAsync(
      req["rawBody"],
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    await webhookHandlers[event.type](event.data.object);
    res.send({ received: true });
  } catch (error: any) {
    console.log(error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

/* NOTES */
/* 
  To test webhooks locally you need to download the stripe CLI and set up forwarding to the localhost
  Note that you need to run the the stripe CLI, from the CLI, in the folder the contains the .exe file
  See https://stripe.com/docs/stripe-cli

  When you run the command "stripe listen --forward-to localhost:8080/webhooks" you get a webhook signing secret, e.g. "whsec_yGGfghOBARASDsgUcS3qtzj8AmHebj" (not a real secret)

  trigger events with:
    "stripe trigger payment_intent.created"
    "stripe trigger payment_intent.succeeded"

  See all events with "stripe trigger --help"
*/
