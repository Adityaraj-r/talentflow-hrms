import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";
import http from "http";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import User from "../models/User.model";
import Job from "../models/job.model";

const PORT = 5001;

const makeRequest = (token: string, jobId: string) => {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: PORT,
        path: `/api/job-openings/${jobId}`,
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode || 0, body: data });
        });
      }
    );

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
};

const run = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI || "";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    
    const user = await User.findOne({ email: "malhar@hrms.com" });
    if (!user) {
      console.error("Malhar user not found in DB");
      process.exit(1);
    }

    console.log("Using user:", { email: user.email, role: user.role });

    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, secret, { expiresIn: "1h" });

    // Find the java developer closed job from the screenshot
    const targetJob = await Job.findOne({ status: "Closed", jobTitle: /java developer/i });
    if (!targetJob) {
      console.error("Target closed job not found");
      process.exit(1);
    }

    console.log("Sending live delete for:", { title: targetJob.jobTitle, status: targetJob.status, id: targetJob._id });

    const response = await makeRequest(token, targetJob._id.toString());
    console.log("Response Status:", response.status);
    console.log("Response Body:", response.body);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
