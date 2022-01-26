import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { createSetupIntent, listPaymentMethods } from "./customers.js";
import { createStripeCheckoutSession } from "./checkout.js";
import { createPaymentIntent } from "./payments.js";
import { handleStripeWebhook } from "./webhooks.js";
import { auth } from "./firebase.js";
import {
  cancelSubscription,
  createSubscription,
  listSubscriptions,
} from "./billing.js";
export const app = express();

// modify the express.json middleware to set the rawBody for webhook handling
// We need the rawBody to verify stripe's webhook secret and ensure the webhook request is coming from them
app.use(
  express.json({
    verify: (req, res, buffer) => (req["rawBody"] = buffer),
  })
);
app.use(express.urlencoded({ extended: true }));

app.use(cors({ origin: true }));

// Authorization middleware - see function at bottom
app.use(decodeJWT);

app.post("/test", (req: Request, res: Response) => {
  const amount = req.body.amount;
  res.status(200).send({ withTax: amount * 7 });
});

app.post(
  "/checkouts/",
  catchAsync(async ({ body }: Request, res: Response) => {
    res.send(await createStripeCheckoutSession(body.line_items));
  })
);

app.post(
  "/payments/",
  catchAsync(async ({ body }: Request, res: Response) => {
    res.send(await createPaymentIntent(body.amount));
  })
);

/* Customers and Setup Intents */

// store card info on Stripe customer
app.post(
  "/wallet",
  catchAsync(async (req: Request, res: Response) => {
    const { uid } = validateUser(req);
    const setupIntent = await createSetupIntent(uid);
    res.send(setupIntent);
  })
);

// get all cards attached to a Stripe customer
app.get(
  "/wallet",
  catchAsync(async (req: Request, res: Response) => {
    const { uid } = validateUser(req);
    const wallet = await listPaymentMethods(uid);
    res.send(wallet.data);
  })
);

/* Billing and Subscriptions */

// create and charge new subscription
app.post(
  "/subscriptions/",
  catchAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);
    const { plan, payment_method } = req.body;
    const subscription = await createSubscription(
      user.uid,
      plan,
      payment_method
    );
    res.send(subscription);
  })
);

// get all subscriptions for a customer
app.get(
  "/subscriptions/",
  catchAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);
    const subscriptions = await listSubscriptions(user.uid);
    res.send(subscriptions.data);
  })
);

// Unsubscribe or cancel a subscription
app.patch(
  "/subscriptions/:id",
  catchAsync(async (req: Request, res: Response) => {
    const { uid } = await validateUser(req);
    res.send(await cancelSubscription(uid, req.params.id));
  })
);

/* Webhooks */

// Stripe webhook handler
app.post("/webhooks", catchAsync(handleStripeWebhook));

// catch async errors
function catchAsync(callback: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    callback(req, res, next).catch(next);
  };
}

async function decodeJWT(req: Request, res: Response, next: NextFunction) {
  if (req.headers?.authorization?.startsWith("Bearer")) {
    const idToken = req.headers.authorization.split(" ")[1];
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      req["currentUser"] = decodedToken;
    } catch (err) {
      console.log(err);
    }
  }
  next();
}

function validateUser(req: Request) {
  const user = req["currentUser"];

  if (!user) {
    throw new Error("You must be logged in to make this request.");
  }

  return user;
}
