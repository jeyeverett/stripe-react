import { FieldValue } from "firebase-admin/firestore";
import { stripe } from "./index.js";
import { db } from "./firebase.js";
import { getOrCreateCustomer } from "./customers.js";
// Attaches a payment method to the Stripe customer, subscribes to a Stripe plan, and saves the plan to firestore
export async function createSubscription(userId, priceId, payment_method) {
    const { id } = await getOrCreateCustomer(userId);
    // attach the payment method to the customer (may not be necessary if you already have a payment method)
    await stripe.paymentMethods.attach(payment_method, { customer: id });
    // set payment method as the default (may not be necessary if you already have a default)
    await stripe.customers.update(id, {
        invoice_settings: { default_payment_method: payment_method },
    });
    const subscription = await stripe.subscriptions.create({
        customer: id,
        items: [{ price: priceId }],
        expand: ["latest_invoice.payment_intent"],
    });
    const invoice = subscription.latest_invoice;
    const payment_intent = invoice.payment_intent;
    // on subscription, Stripe will try to charge the cusotmer's card
    if (payment_intent.status === "succeeded") {
        await db
            .collection("users")
            .doc(userId)
            .set({
            stripeCustomerId: id,
            activePlans: FieldValue.arrayUnion(subscription.id),
        }, { merge: true } // make sure to include this if you want to retain the other data in the doc
        );
    }
    return subscription;
}
export async function cancelSubscription(userId, subscriptionId) {
    const customer = await getOrCreateCustomer(userId);
    if (customer.metadata.firebaseUID !== userId) {
        throw new Error("Firebase UID does not match Stripe Customer.");
    }
    // immediately cancel the subscription
    const subscription = await stripe.subscriptions.del(subscriptionId);
    // cancel subscription at the end of the period
    // need to set up a webhook to listen for this event and then update the user's plan
    // const subscription = await stripe.subscriptions.update(subscriptionId, {
    //   cancel_at_period_end: true,
    // });
    if (subscription.status === "canceled") {
        await db
            .collection("users")
            .doc(userId)
            .update({ activePlans: FieldValue.arrayRemove(subscription.id) });
    }
    return subscription;
}
/* Returns all the subscriptions linked to a Firebase userID in stripe */
export async function listSubscriptions(userId) {
    const { id } = await getOrCreateCustomer(userId);
    const subscriptions = await stripe.subscriptions.list({ customer: id });
    return subscriptions;
}
//# sourceMappingURL=billing.js.map