import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const EMAIL_REGEX = /\S+@\S+\.\S+/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      addresses: [],
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "fallback_secret_do_not_use_in_production"
    );

    return res.status(201).json({
      message: "Registration successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
});
  } catch (error: unknown) {
    console.error("Registration error:", error);

    if ((error as {code : number}).code === 11000){
      return res
        .status(409)
        .json({ message: "Email Already Exists" });

    }

    return res
      .status(500)
      .json({ message: "Registration failed. Please try again." });
  }
}
