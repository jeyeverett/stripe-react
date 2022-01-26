import { stripe } from "./index.js";
//Specific webhook event type handlers
const webhookHandlers = {
    "payment_intent.succeeded": async (data) => {
        // code
    },
    "payment_intent.failed": async (data) => {
        // code
    },
};
// We need to validate the webhook secret and then call the handler for the event type
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    try {
        const event = await stripe.webhooks.constructEventAsync(req["rawBody"], sig, process.env.STRIPE_WEBHOOK_SECRET);
        await webhookHandlers[event.type](event.data.object);
        res.send({ received: true });
    }
    catch (error) {
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
    "stripe trigger payment_intent.failed"

  See all events with "stripe trigger --help"
*/
//# sourceMappingURL=webhooks.js.map