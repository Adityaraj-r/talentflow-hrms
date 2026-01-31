import mongoose, { Schema, Document } from "mongoose"

export interface IEmployeePayroll {
  employeeId: string
  basic: number
  hra: number
  allowances: number
  bonus: number
  deductions: number
  lopDays: number
  netPay: number
}

export interface IPayroll extends Document {
  month: string
  year: number
  employees: IEmployeePayroll[]
  status: "Draft" | "Generated" | "HR Reviewed" | "Admin Approved" | "Paid"
}

const EmployeePayrollSchema = new Schema<IEmployeePayroll>({
  employeeId: { type: String, required: true },
  basic: Number,
  hra: Number,
  allowances: Number,
  bonus: Number,
  deductions: Number,
  lopDays: Number,
  netPay: Number,
})

const PayrollSchema = new Schema<IPayroll>(
  {
    month: { type: String, required: true },
    year: { type: Number, required: true },
    employees: [EmployeePayrollSchema],
    status: {
      type: String,
      enum: ["Draft", "Generated", "HR Reviewed", "Admin Approved", "Paid"],
      default: "Draft",
    },
  },
  { timestamps: true }
)

export default mongoose.model<IPayroll>("Payroll", PayrollSchema)
