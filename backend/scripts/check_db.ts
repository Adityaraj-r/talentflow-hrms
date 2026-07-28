import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Job from "../models/job.model";
import Requisition from "../models/Requisition.model";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "";

if (!MONGO_URI) {
  console.error("MONGO_URI not found in .env");
  process.exit(1);
}

const checkDb = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const jobs = await Job.find({}).lean();
    console.log(`Found ${jobs.length} jobs:`);
    jobs.forEach(j => {
      console.log(`Job: ${j.jobTitle}, status: ${j.status}, hiringRoles:`, JSON.stringify(j.hiringRoles, null, 2));
    });

    const reqs = await Requisition.find({}).lean();
    console.log(`Found ${reqs.length} requisitions:`);
    reqs.forEach(r => {
      console.log(`Requisition: ${r.position}, status: ${r.status}, hiringRoles:`, JSON.stringify(r.hiringRoles, null, 2));
    });

  } catch (error) {
    console.error("Error checking db:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
};

checkDb();
