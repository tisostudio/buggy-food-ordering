import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import Restaurant from "@/models/Restaurant";
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
  let decoded;

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_do_not_use_in_production"
    );
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }

  // GET - fetch restaurants
  if (req.method === "GET") {
    try {
      const restaurants = await Restaurant.find().sort({ name: 1 });
      return res.status(200).json({ restaurants });
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      return res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  }

  // PATCH - update restaurant details
  if (req.method === "PATCH") {
    try {
      const {
        restaurantId,
        manuallyClosed,
        openingHours,
        deliveryTime,
        minOrderAmount,
        deliveryFee,
      } = req.body;

      if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID is required" });
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Update the restaurant fields if provided
      if (manuallyClosed !== undefined) {
        restaurant.manuallyClosed = manuallyClosed;
      }

      if (openingHours) {
        if (openingHours.open) restaurant.openingHours.open = openingHours.open;
        if (openingHours.close)
          restaurant.openingHours.close = openingHours.close;
        if (openingHours.daysOpen)
          restaurant.openingHours.daysOpen = openingHours.daysOpen;
      }

      if (deliveryTime !== undefined) {
        restaurant.deliveryTime = deliveryTime;
      }

      if (minOrderAmount !== undefined) {
        restaurant.minOrderAmount = minOrderAmount;
      }

      if (deliveryFee !== undefined) {
        restaurant.deliveryFee = deliveryFee;
      }

      await restaurant.save();

      return res.status(200).json({
        message: "Restaurant updated successfully",
        restaurant,
      });
    } catch (error) {
      console.error("Error updating restaurant:", error);
      return res.status(500).json({ message: "Failed to update restaurant" });
    }
  }

  res.setHeader("Allow", ["GET","PATCH"]);
  return res.status(405).json({ message: "Method not allowed" });
}
