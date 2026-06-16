import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { ensureSeeded } from "./seed/ensureSeeded.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Lumina Commerce API is running", health: "/api/health" });
});

app.get("/api", (_req, res) => {
  res.json({ message: "Lumina Commerce API is running", health: "/api/health" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    await ensureSeeded();
  } catch (error) {
    _req.dbUnavailable = true;
    console.warn(`Database unavailable: ${error.message}`);
  }
  next();
});

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: error.message || "Internal server error" });
});

export default app;
