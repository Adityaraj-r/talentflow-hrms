import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string;
  assignedTo: mongoose.Types.ObjectId; 
  assignedBy: mongoose.Types.ObjectId; 
  status: "Pending" | "In Progress" | "Completed" | "Overdue";
  priority: "High" | "Medium" | "Low";
  dueDate: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },

    // The 'assignedTo' and 'assignedBy' both point to the 'User' collection.
    // One represents the executor (Employee), the other the creator (Admin/Manager).
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Overdue"],
      default: "Pending",
    },

    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },

    // Important: The system should ideally have a background job to flip 
    // status to 'Overdue' if the current date passes this dueDate.
    dueDate: { type: Date, required: true },
  },
  { 
    // timestamps help us track how long a task stayed in 'In Progress' 
    // vs when it was originally created.
    timestamps: true 
  }
);

export default mongoose.model<ITask>("Task", TaskSchema);