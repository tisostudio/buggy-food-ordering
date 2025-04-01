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

  if (req.method === "GET") {
    try {
      const { restaurantId } = req.query;

      if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID is required" });
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      return res.status(200).json({ menuItems: restaurant.menu });
    } catch (error) {
      console.error("Error fetching menu items:", error);
      return res.status(500).json({ message: "Failed to fetch menu items" });
    }
  }

  // PATCH - update menu item availability
  if (req.method === "PATCH") {
    try {
      const { restaurantId, menuItemId, available } = req.body;

      if (!restaurantId || !menuItemId || available === undefined) {
        return res.status(400).json({
          message:
            "Restaurant ID, menu item ID, and availability status are required",
        });
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Find the menu item
      const menuItemIndex = restaurant.menu.findIndex(
        (item: any) => item._id.toString() === menuItemId
      );

      if (menuItemIndex === -1) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      // Update the availability
      restaurant.menu[menuItemIndex].available = available;
      await restaurant.save();

      return res.status(200).json({
        message: "Menu item availability updated",
        menuItem: restaurant.menu[menuItemIndex],
      });
    } catch (error) {
      console.error("Error updating menu item:", error);
      return res.status(500).json({ message: "Failed to update menu item" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
