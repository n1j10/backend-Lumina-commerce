import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { qiPaymentService } from "../services/qiPaymentService.js";

function generateOrderNumber() {
  return `LM-${Date.now().toString(36).toUpperCase()}`;
}

export async function createOrder(req, res) {
  try {
    const { customer, shipping, items, paymentMethod = "qi-card" } = req.body;

    if (!items?.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = items.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      return {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
        variant: item.variant || "",
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = Number((subtotal * 0.08).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customer,
      shipping,
      items: orderItems,
      subtotal,
      tax,
      total,
      paymentMethod,
      status: "pending",
    });

    const apiBase = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const payment = await qiPaymentService.createPayment({
      amount: total,
      orderId: order._id.toString(),
      finishUrl: `${clientUrl}/payment/success?orderId=${order._id}`,
      notificationUrl: `${apiBase}/api/payments/webhook`,
    });

    order.paymentRequestId = payment.requestId;
    order.paymentUrl = payment.paymentUrl;
    await order.save();

    res.status(201).json({
      order,
      paymentUrl: payment.paymentUrl,
      mock: payment.mock || false,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getOrders(req, res) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getOrderById(req, res) {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
