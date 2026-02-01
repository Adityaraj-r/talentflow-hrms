import mongoose, { Schema, Document } from "mongoose"

export interface ISalaryStructure extends Document {
  employeeId: string
  basic: number
  hra: number
  pf: number
  tax: number
  effectiveFrom: Date
}

const SalaryStructureSchema = new Schema<ISalaryStructure>(
  {
    employeeId: { type: String, required: true },
    basic: Number,
    hra: Number,
    pf: Number,
    tax: Number,
    effectiveFrom: Date,
  },
  { timestamps: true }
)

export default mongoose.model<ISalaryStructure>(
  "SalaryStructure",
  SalaryStructureSchema
)
