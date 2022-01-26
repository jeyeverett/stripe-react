import express, { Request, Response, NextFunction } from "express";
import { createStripeCheckoutSession } from "./checkout.js";
import { createPaymentIntent } from "./payments.js";
import { handleStripeWebhook } from "./webhooks.js";
export const app = express();

// modify the express.json middleware to set the rawBody for webhook handling
// We need the rawBody to verify stripe's webhook secret and ensure the webhook request is coming from them
app.use(
  express.json({
    verify: (req, res, buffer) => (req["rawBody"] = buffer),
  })
);
app.use(express.urlencoded({ extended: true }));

import cors from "cors";
app.use(cors({ origin: true }));

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

// Stripe webhook handler
app.post("/webhooks", catchAsync(handleStripeWebhook));

// catch async errors
function catchAsync(callback: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    callback(req, res, next).catch(next);
  };
}
