import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email: "admin@ovs.com" });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const admin = await User.create({
      fullName: process.env.ADMIN_NAME || "Main Admin",
      email: process.env.ADMIN_EMAIL || "admin@ovs.com",
      mobileNumber: process.env.ADMIN_MOBILE || "9999999999",
      password: process.env.ADMIN_PASSWORD || "Admin@123",
      role: "super_admin",
      dob: "2000-01-01",
      ageVerified: true,
      mobileVerified: true,
      verificationStatus: "approved",
      isEligibleToVote: false,
      isActive: true,
    });

    console.log("Admin created successfully");
    console.log({
      id: admin._id,
      email: admin.email,
      role: admin.role,
    });

    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
