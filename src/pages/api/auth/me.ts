import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";


const getAuthUser = async (req: NextApiRequest) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];

    
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_do_not_use_in_production"
    ) as { id: string };

    if (!decoded || !decoded.id) {
      return null;
    }

    
    const user = await User.findById(decoded.id);
    return user;
  } catch (error) {
    
    console.error("Auth error:", error);
    return null;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    
    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        addresses: user.addresses,
        phoneNumber: user.phoneNumber,
        
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Failed to fetch user profile" });
  }
}
