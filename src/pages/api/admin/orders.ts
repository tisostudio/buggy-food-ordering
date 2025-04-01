import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();

  // Verify authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_do_not_use_in_production"
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }

  // GET - fetch orders
  if (req.method === "GET") {
    try {
      let query = {};
      const { status } = req.query;

      if (status && typeof status === "string") {
        query = { status };
      }

      const orders = await Order.find(query)
        .populate("user", "name email")
        .populate("restaurant", "name")
        .sort({ createdAt: -1 });

      return res.status(200).json({ orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ message: "Failed to fetch orders" });
    }
  }

  // PATCH - update order status
  if (req.method === "PATCH") {
    try {
      const { orderId, status } = req.body;

      if (!orderId || !status) {
        return res
          .status(400)
          .json({ message: "Order ID and status are required" });
      }

      const validStatuses = [
        "pending",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.status = status;
      await order.save();

      return res.status(200).json({ message: "Order status updated", order });
    } catch (error) {
      console.error("Error updating order:", error);
      return res.status(500).json({ message: "Failed to update order" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
