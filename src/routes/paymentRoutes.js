import { Router } from "express";
import { confirmPayment, paymentWebhook } from "../controllers/paymentController.js";

const router = Router();

router.post("/webhook", paymentWebhook);
router.post("/confirm/:orderId", confirmPayment);

export default router;
