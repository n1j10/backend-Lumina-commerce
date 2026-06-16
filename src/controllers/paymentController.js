import Order from "../models/Order.js";

export async function paymentWebhook(req, res) {
  try {
    const { requestId, status, orderId } = req.body;

    const order = await Order.findOne({
      $or: [{ paymentRequestId: requestId }, { _id: orderId }],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status === "SUCCESS" || status === "PAID" || req.body.success) {
      order.status = "paid";
    } else if (status === "FAILED" || status === "CANCELLED") {
      order.status = "cancelled";
    }

    await order.save();
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function confirmPayment(req, res) {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "pending") {
      order.status = "paid";
      await order.save();
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
