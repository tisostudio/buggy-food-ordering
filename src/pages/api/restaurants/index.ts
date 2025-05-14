import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import Restaurant, { IRestaurant } from "@/models/Restaurant";


interface RestaurantQuery {
  name?: { $regex: unknown; $options: string };
  cuisine?: string | string[];
  featured?: boolean;
}



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("API: Restaurant endpoint called");
    await connectDB();
    console.log("API: DB connected");

    if (req.method === "GET") {
      
      const { cuisine, sort, featured, search } = req.query;
      console.log("API: Query params:", { cuisine, sort, featured, search });

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const skip = (page - 1) * limit;
      console.log("API: Pagination:", { page, limit, skip });

      
      const query: RestaurantQuery = {};

      
      if (search) {
        query.name = { $regex: search, $options: "" }; 
      }

      
      if (cuisine) {
        
        query.cuisine = cuisine;
      }

      
      
      if (featured) {
        query.featured = featured === "true";
      }

      console.log("API: Query built:", JSON.stringify(query));

      
      const totalCount = await Restaurant.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);
      console.log("API: Pagination data:", { totalCount, totalPages });

      
      let restaurants = await Restaurant.find(query)
        .sort({ featured: -1 })
        .skip(skip)
        .limit(limit)
        .select("-menu"); 
      restaurants = restaurants.filter(r => isRestaurantOpen(r.openingHours) && !r.manuallyClosed);

      console.log("API: Restaurants found:", restaurants.length);

      
      if (sort) {
        const sortField = (sort as string).replace("-", "");
        const sortDirection = (sort as string).startsWith("-") ? -1 : 1;

        
        restaurants = restaurants.sort((a, b) => {
          const aValue = a.get(sortField);
          const bValue = b.get(sortField);
          if (aValue < bValue) return -1 * sortDirection;
          if (aValue > bValue) return 1 * sortDirection;
          return 0;
        });
      }

      
      return res.status(200).json({
        restaurants,
        totalCount, 
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          
          hasMore: page < totalPages,
        },
      });
    }

    
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Error in restaurants API:", error);
    
    return res.status(500).json({ message: "Server error" });
  }
}

function isRestaurantOpen(openingHours: IRestaurant["openingHours"]): boolean {
  const now = new Date();
  const currentDay = now.getDay(); 

  if (!openingHours.daysOpen.includes(currentDay)) {
    return false;
  }

  const currentTime = now.toTimeString().slice(0, 5); 
  const { open, close } = openingHours;

  return currentTime >= open && currentTime < close;
}
