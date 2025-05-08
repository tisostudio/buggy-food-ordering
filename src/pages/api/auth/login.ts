import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { email, password } = req.body;

    
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      
      
      return res.status(401).json({ message: "Invalid credentials" });
    }

    
    const isValid = await user.comparePassword(password);

    if (!isValid) {
      
      return res.status(401).json({ message: "Invalid credentials" });
    }

    
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "fallback_secret_do_not_use_in_production",
      {expiresIn:10} // Setting Expiry of token to 10 second for testing. 
    );

    
    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        addresses: user.addresses,
      },
      token,
    });
  } catch (error: unknown) {
    console.error("Login error:", error);

    
    return res
      .status(500)
      .json({
        message:
          "Authentication failed due to a server error. Please try again later.",
      });
  }
}
