import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import Payroll from "../models/payroll.model"
import SalaryStructure from "../models/salaryStructure.model"
import Attendance from "../models/attendance.model"

export const generatePayroll = async (
  req: AuthRequest,
  res: Response
) => {
  const { month, year, employeeIds } = req.body

  const employeesPayroll = []

  for (const empId of employeeIds) {
    const salary = await SalaryStructure.findOne({ employeeId: empId })
    const attendance = await Attendance.findOne({ employeeId: empId, month, year })

    const perDay = salary!.basic / attendance!.totalDays
    const lopDeduction = attendance!.lopDays * perDay

    const netPay =
      salary!.basic +
      salary!.hra -
      salary!.pf -
      salary!.tax -
      lopDeduction

    employeesPayroll.push({
      employeeId: empId,
      basic: salary!.basic,
      hra: salary!.hra,
      allowances: 0,
      bonus: 0,
      deductions: salary!.pf + salary!.tax + lopDeduction,
      lopDays: attendance!.lopDays,
      netPay,
    })
  }

  const payroll = await Payroll.create({
    month,
    year,
    employees: employeesPayroll,
    status: "Generated",
  })

  res.status(201).json({ success: true, data: payroll })
}
export const updatePayrollStatus = async (
  req: AuthRequest,
  res: Response
) => {
  const payroll = await Payroll.findById(req.params.id)
  if (!payroll) return res.status(404).json({ error: "Payroll not found" })

  payroll.status = req.body.status
  await payroll.save()

  res.json({ success: true, data: payroll })
}
