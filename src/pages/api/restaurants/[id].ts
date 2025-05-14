import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import Restaurant from "@/models/Restaurant";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      await connectDB();

      
      const restaurant = await Restaurant.findById(id);

      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      
      console.log("API - Restaurant data:", {
        id: restaurant._id,
        name: restaurant.name,
        openingHours: restaurant.openingHours,
      });

      
      restaurant.menu = restaurant.menu.filter((item:{available:boolean}) => item.available);
      return res.status(200).json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      return res.status(500).json({ message: "Error fetching restaurant" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method not allowed" });
  }
}
