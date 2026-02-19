import { Request, Response } from "express";
import Department from "../models/Department.model";
import User from "../models/User.model";

export const syncDepartmentsFromUsers = async (req: Request, res: Response) => {
  try {
    const distinct = await User.distinct("department", { department: { $ne: null } });

    const cleanNames: string[] = distinct
      .map((name: string) => (name || "").trim())
      .filter(Boolean);

    const existing = await Department.find({}, "name").lean();
    const existingNames = existing.map(d => d.name);

    const missing = cleanNames.filter(name => !existingNames.includes(name));

    if (missing.length === 0) {
      return res.status(200).json({
        success: true,
        created: 0,
        message: "No new departments to create",
      });
    }

    const docs = await Department.insertMany(
      missing.map(name => ({ name, description: "", manager: null })),
      { ordered: false }
    );

    return res.status(201).json({
      success: true,
      created: docs.length,
      names: missing,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to sync departments",
      error: error.message,
    });
  }
};
