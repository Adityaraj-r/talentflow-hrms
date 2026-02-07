import { Request, Response } from "express";
import Task from "../models/task.model";

export const getMyTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Pulling assignedBy details so the employee knows exactly who to contact 
    // for task clarifications. Sorted by dueDate so the most urgent tasks stay at the top.
    const tasks = await Task.find({ assignedTo: userId })
      .populate("assignedBy", "firstName lastName email") 
      .sort({ dueDate: 1 }); 

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error("getMyTasks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const assignedBy = req.user?.id;
    const { title, description, assignedTo, priority, dueDate } = req.body;

    // Validation to ensure the task has at least a title, a recipient, and a deadline.
    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newTask = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy,
      priority,
      dueDate,
      status: "Pending" // Tasks remain 'Pending' until the employee moves them to 'In Progress' or 'Done'.
    });

    res.status(201).json({ success: true, message: "Task assigned successfully", data: newTask });
  } catch (error) {
    console.error("createTask error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};