import express from "express";
import { createStripeCheckoutSession } from "./checkout.js";
export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
import cors from "cors";
app.use(cors({ origin: true }));
app.post("/test", (req, res) => {
    const amount = req.body.amount;
    res.status(200).send({ withTax: amount * 7 });
});
app.post("/checkouts/", catchAsync(async ({ body }, res) => {
    res.send(await createStripeCheckoutSession(body.line_items));
}));
// catch async errors
function catchAsync(callback) {
    return (req, res, next) => {
        callback(req, res, next).catch(next);
    };
}
//# sourceMappingURL=api.js.map