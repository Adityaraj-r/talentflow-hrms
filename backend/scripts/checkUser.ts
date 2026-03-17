import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import User from "../models/User.model";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "";

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env");
  process.exit(1);
}

const checkUser = async (identifier: string) => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Search by email OR _id
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);

    const user = isObjectId
      ? await User.findById(identifier).lean()
      : await User.findOne({ email: identifier }).lean();

    if (!user) {
      console.log(`❌ No user found for: ${identifier}`);
    } else {
      console.log("✅ User Found:");
      console.log(JSON.stringify(user, null, 2));
    }
  } catch (error) {
    console.error("❌ Error checking user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Get identifier from command line: npx ts-node scripts/checkUser.ts <email_or_id>
const identifier = process.argv[2];

if (!identifier) {
  console.error("❌ Usage: npx ts-node scripts/checkUser.ts <email_or_objectId>");
  process.exit(1);
}

checkUser(identifier);
