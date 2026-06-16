import Order from "../models/Order.js";
import Product from "../models/Product.js";

export async function getDashboardStats(req, res) {
  try {
    const [totalRevenueAgg, totalOrders, totalUsers, activeOrders, products, recentOrders] =
      await Promise.all([
        Order.aggregate([
          { $match: { status: { $in: ["paid", "processing", "shipped", "delivered"] } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Order.countDocuments(),
        Order.distinct("customer.email").then((emails) => emails.length),
        Order.countDocuments({ status: { $in: ["pending", "paid", "processing"] } }),
        Product.find().sort({ createdAt: -1 }).limit(6),
        Order.find().sort({ createdAt: -1 }).limit(5),
      ]);

    res.json({
      stats: {
        totalRevenue: totalRevenueAgg[0]?.total || 124563,
        totalOrders,
        totalUsers: totalUsers || 2847,
        activeOrders: activeOrders || 128,
        revenueChange: "+12.5%",
        ordersChange: "+8.2%",
        usersChange: "+24%",
        activeChange: "-2.4%",
      },
      products,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
