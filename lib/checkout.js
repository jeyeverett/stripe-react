import { stripe } from "./index.js";
// Creates a Stripe Checkout session
// Expects a single parameter "line_items" as an array of the given type
export async function createStripeCheckoutSession(line_items) {
    const url = process.env.WEBAPP_URL;
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        success_url: `${url}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${url}/failed`,
    });
    return session;
}
/*
Example Item
{
name: 'T-shirt',
description: 'Organic cotton t-shirt',
images: ['https://example.com/t-shirt.png],
amount: 500, //cents not dollars
currency: 'usd',
quantity: 1

}
*/
//# sourceMappingURL=checkout.js.map