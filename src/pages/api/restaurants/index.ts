import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import { SortOrder } from "mongoose";

interface RestaurantQuery {
  name?: { $regex: unknown; $options: string };
  cuisine?: string | string[] | {$in: string[]};
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

      const page = Math.max(1, parseInt(req.query.page as string) || 1);;
      const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
      
      const skip = (page - 1) * limit;
      console.log("API: Pagination:", { page, limit, skip });

      
      const query: RestaurantQuery = {};

      
      if (search) {
        query.name = { $regex: search, $options: "i" }; 
      }

      
      if (cuisine) {
        if (Array.isArray(cuisine) && cuisine.length > 0) {
          query.cuisine = { $in: cuisine};  // Handle multiple cuisines using $in
        } else {
          query.cuisine = cuisine;  // Handle a single cuisine
        }
      }

      
      
      if (featured === "true") {
        query.featured =true;
      }else if(featured === "false"){
        query.featured = false;
      }

      console.log("API: Query built:", JSON.stringify(query));

      
      const totalCount = await Restaurant.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);
      console.log("API: Pagination data:", { totalCount, totalPages });

      const querySort:{ [key: string]: SortOrder } = { featured: -1 };
      if (sort) {
        const sortField = (sort as string).replace("-", "");
        const sortDirection = (sort as string).startsWith("-") ? -1 : 1;
        querySort[sortField] = sortDirection;
      }
      
      const restaurants = await Restaurant.find(query)
        .sort(querySort)
        .skip(skip)
        .limit(limit)
        .select("-menu"); 

      console.log("API: Restaurants found:", restaurants.length);

      
      
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

    res.setHeader("Allow", ["GET"]); 
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Error in restaurants API:", error);
    
    return res.status(500).json({ message: "Server error" });
  }
}