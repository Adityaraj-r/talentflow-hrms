import mongoose, { Schema, Document } from "mongoose"

export interface ISalaryStructure extends Document {
  userId:         mongoose.Types.ObjectId 
  employeeId:     string                   
  basic:          number
  hra:            number
  transport:      number
  medical:        number
  otherAllowance: number
  pf:             number
  tax:            number
  insurance:      number
  effectiveFrom:  Date
}

const SalaryStructureSchema = new Schema<ISalaryStructure>(
  {
    userId: {
      type:    Schema.Types.ObjectId,
      ref:     "User",
      default: null,
    },
    employeeId: { type: String, default: null },
    basic:          { type: Number, default: 0 },
    hra:            { type: Number, default: 0 },
    transport:      { type: Number, default: 0 },
    medical:        { type: Number, default: 0 },
    otherAllowance: { type: Number, default: 0 },
    pf:             { type: Number, default: 0 },
    tax:            { type: Number, default: 0 },
    insurance:      { type: Number, default: 0 },
    effectiveFrom:  { type: Date,   default: null },
  },
  { timestamps: true }
)

export default mongoose.model<ISalaryStructure>("SalaryStructure", SalaryStructureSchema)
