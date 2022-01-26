import { stripe } from "./index.js";
import { db } from "./firebase.js";
// Get an existing Stripe customer || create a new record
export async function getOrCreateCustomer(userId, params) {
    const userSnapshot = await db.collection("users").doc(userId).get();
    const { stripeCustomerId, email } = userSnapshot.data();
    // if the customerId doesn't exist, create it
    if (!stripeCustomerId) {
        const customer = await stripe.customers.create(Object.assign({ email, metadata: {
                firebaseUID: userId,
            } }, params));
        // update firestore with the stripe customer id
        await userSnapshot.ref.update({ stripeCustomerId: customer.id });
        return customer;
    }
    else {
        return (await stripe.customers.retrieve(stripeCustomerId));
    }
}
// create a SetupIntent used to save a credit card for later use
export async function createSetupIntent(userId) {
    const { id } = await getOrCreateCustomer(userId);
    return stripe.setupIntents.create({
        customer: id,
    });
}
// return all payment sources associated with a user
export async function listPaymentMethods(userId) {
    const { id } = await getOrCreateCustomer(userId);
    return await stripe.customers.listPaymentMethods(id, {
        type: "card",
    });
}
/* NOTES */
/*
  To create a subscription, you need to create one in Stripe, under Products
*/
//# sourceMappingURL=customers.js.map