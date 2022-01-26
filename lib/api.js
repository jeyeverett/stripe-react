import express from "express";
import cors from "cors";
import { createSetupIntent, listPaymentMethods } from "./customers.js";
import { createStripeCheckoutSession } from "./checkout.js";
import { createPaymentIntent } from "./payments.js";
import { handleStripeWebhook } from "./webhooks.js";
import { auth } from "./firebase.js";
export const app = express();
// modify the express.json middleware to set the rawBody for webhook handling
// We need the rawBody to verify stripe's webhook secret and ensure the webhook request is coming from them
app.use(express.json({
    verify: (req, res, buffer) => (req["rawBody"] = buffer),
}));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true }));
// Authorization middleware - see function at bottom
app.use(decodeJWT);
app.post("/test", (req, res) => {
    const amount = req.body.amount;
    res.status(200).send({ withTax: amount * 7 });
});
app.post("/checkouts/", catchAsync(async ({ body }, res) => {
    res.send(await createStripeCheckoutSession(body.line_items));
}));
app.post("/payments/", catchAsync(async ({ body }, res) => {
    res.send(await createPaymentIntent(body.amount));
}));
/* Customers and Setup Intents */
// store card info on Stripe customer
app.post("/wallet", catchAsync(async (req, res) => {
    const { uid } = validateUser(req);
    const setupIntent = await createSetupIntent(uid);
    res.send(setupIntent);
}));
// get all cards attached to a Stripe customer
app.get("/wallet", catchAsync(async (req, res) => {
    const { uid } = validateUser(req);
    const wallet = await listPaymentMethods(uid);
    res.send(wallet.data);
}));
// Stripe webhook handler
app.post("/webhooks", catchAsync(handleStripeWebhook));
// catch async errors
function catchAsync(callback) {
    return (req, res, next) => {
        callback(req, res, next).catch(next);
    };
}
async function decodeJWT(req, res, next) {
    var _a, _b;
    if ((_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.startsWith("Bearer")) {
        const idToken = req.headers.authorization.split(" ")[1];
        try {
            const decodedToken = await auth.verifyIdToken(idToken);
            req["currentUser"] = decodedToken;
        }
        catch (err) {
            console.log(err);
        }
    }
    next();
}
function validateUser(req) {
    const user = req["currentUser"];
    if (!user) {
        throw new Error("You must be logged in to make this request.");
    }
    return user;
}
//# sourceMappingURL=api.js.map