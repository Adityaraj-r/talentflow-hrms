import { Request, Response } from "express";
import mongoose from "mongoose";
import Task from "../models/task.model";
import User from "../models/User.model";

const VALID_STATUSES = ["TO_DO", "IN_PROGRESS", "DONE"] as const;
type TaskStatus = typeof VALID_STATUSES[number];

export const getMyTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const tasks = await Task.find({ assignedTo: userId })
      .populate("assignedBy", "firstName lastName email role")
      .sort({ dueDate: 1 });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error("getMyTasks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const role = user.role?.toUpperCase();
    let query: Record<string, unknown> = {};

    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      query = {};
    } else if (
      role === "PROJECT_MANAGER" ||
      role === "HR_MANAGER" ||
      role === "DEPARTMENT_MANAGER" ||
      role === "DIRECT_MANAGER"
    ) {
      query = { createdBy: user.id };
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "firstName lastName department role employeeCode")
      .populate("assignedBy", "firstName lastName role")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error("getAllTasks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const createTask = async (req: Request, res: Response) => {
  try {
    const createdBy = req.user?.id;
    const { title, description, assignedTo, priority, dueDate } = req.body;

    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "title, assignedTo, and dueDate are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ success: false, message: "Invalid assignedTo user ID" });
    }

    const validPriorities = ["HIGH", "MEDIUM", "LOW"];
    const normalizedPriority = priority?.toUpperCase() ?? "MEDIUM";
    if (!validPriorities.includes(normalizedPriority)) {
      return res.status(400).json({ success: false, message: "priority must be HIGH, MEDIUM, or LOW" });
    }

    const newTask = await Task.create({
      title: title.trim(),
      description: description?.trim() ?? "",
      assignedTo,
      assignedBy: createdBy,
      status: "TO_DO",
      priority: normalizedPriority,
      dueDate,
      createdBy,
    });

    const populated = await Task.findById(newTask._id)
      .populate("assignedTo", "firstName lastName department role employeeCode")
      .populate("assignedBy", "firstName lastName role");

    res.status(201).json({
      success: true,
      message: "Task created and assigned successfully",
      data: populated,
    });
  } catch (error) {
    console.error("createTask error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TO_DO: ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE"],
  DONE: ["IN_PROGRESS"],
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!VALID_STATUSES.includes(status as TaskStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const role = user.role?.toUpperCase();
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const isAssignee = task.assignedTo?.toString() === user.id;
    const isCreator = task.createdBy?.toString() === user.id;

    if (!isAdmin && !isAssignee && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "You can only update status of your own tasks",
      });
    }

    const currentStatus = task.status as TaskStatus;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
    const isReopenByCreator =
      currentStatus === "DONE" &&
      status === "IN_PROGRESS" &&
      (isAdmin || isCreator);

    if (!allowed.includes(status as TaskStatus) && !isReopenByCreator) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${currentStatus} to ${status}`,
      });
    }

    task.status = status as TaskStatus;
    await task.save();

    res.json({ success: true, message: "Task status updated", data: task });
  } catch (error) {
    console.error("updateTaskStatus error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const role = user.role?.toUpperCase();
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const isCreator = task.createdBy?.toString() === user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "Only the task creator or Admin can edit this task",
      });
    }

    const { title, description, assignedTo, priority, dueDate } = req.body;

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority !== undefined) task.priority = priority.toUpperCase();
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    const updated = await Task.findById(id)
      .populate("assignedTo", "firstName lastName department role")
      .populate("assignedBy", "firstName lastName role");

    res.json({ success: true, message: "Task updated successfully", data: updated });
  } catch (error) {
    console.error("updateTask error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const role = user.role?.toUpperCase();
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const isCreator = task.createdBy?.toString() === user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "Only the task creator or Admin can delete this task",
      });
    }

    await Task.findByIdAndDelete(id);

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("deleteTask error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getTaskAnalytics = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const role = user.role?.toUpperCase();
    let matchFilter: Record<string, unknown> = {};

    if (
      role === "ADMIN" ||
      role === "SUPER_ADMIN" ||
      role === "CEO" ||
      role === "COUNTRY_MANAGER" ||
      role === "HR_MANAGER"
    ) {
      matchFilter = {};
    } else if (
      role === "PROJECT_MANAGER" ||
      role === "DEPARTMENT_MANAGER" ||
      role === "DIRECT_MANAGER"
    ) {
      matchFilter = { createdBy: new mongoose.Types.ObjectId(user.id) };
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [summary] = await Task.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] } },
          toDo: { $sum: { $cond: [{ $eq: ["$status", "TO_DO"] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$status", "DONE"] }, { $lt: ["$dueDate", today] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    interface PriorityGroup { _id: string; count: number }
    const byPriority: PriorityGroup[] = await Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        total: summary?.total ?? 0,
        completed: summary?.done ?? 0,
        inProgress: summary?.inProgress ?? 0,
        toDo: summary?.toDo ?? 0,
        overdue: summary?.overdue ?? 0,
        byPriority: byPriority.map((p: PriorityGroup) => ({
          priority: p._id,
          count: p.count,
        })),
      },
    });
  } catch (error) {
    console.error("getTaskAnalytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getAssignableUsers = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const role = user.role?.toUpperCase();
    const userDepartment = (user as any).department as string | undefined;
    const NON_ASSIGNABLE = ["CEO", "COUNTRY_MANAGER"];
    let filter: Record<string, unknown> = { isActive: true, isDeleted: false };

    if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "PROJECT_MANAGER") {
      filter.role = { $nin: NON_ASSIGNABLE };
    } else if (role === "HR_MANAGER") {
      filter.role = { $in: ["HR_OFFICER", "EMPLOYEE", "DIRECT_MANAGER", "DEPARTMENT_MANAGER"] };
    } else if (role === "DEPARTMENT_MANAGER") {
      filter.role = { $in: ["DIRECT_MANAGER", "EMPLOYEE"] };
      filter.department = userDepartment;
    } else if (role === "DIRECT_MANAGER") {
      filter.role = "EMPLOYEE";
      filter.directManager = new mongoose.Types.ObjectId(user.id);
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const users = await User.find(filter)
      .select("firstName lastName email role department employeeCode")
      .sort({ firstName: 1 });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error("getAssignableUsers error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};