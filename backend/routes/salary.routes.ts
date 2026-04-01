import express from "express"
import { protect, authorize } from "../middleware/auth.middleware"
import Employee from "../models/Employee.model"
import User from "../models/User.model"

const router = express.Router()
router.use(protect)

const HR_ROLES = [
  "HRMANAGER", "HR_MANAGER",
  "HROFFICER",  "HR_OFFICER",
  "PAYROLLOFFICER", "PAYROLL_OFFICER",
  "ADMIN", "SUPER_ADMIN", "SUPER ADMIN", "SUPERADMIN"
]

const resolveEmployee = async (user: any, selectFields = "salary employeeCode") => {
  let employee = null

  if (user.employeeId) {
    employee = await Employee.findById(user.employeeId).select(selectFields)
  }

  // Fallback to email if employeeId is null or points to a deleted doc
  if (!employee && user.email) {
    employee = await Employee.findOne({ email: user.email }).select(selectFields)
    if (employee) {
      await User.findByIdAndUpdate(user._id, { employeeId: employee._id })
      console.log(`[salary.routes] Updated employeeId for ${user.email}`)
    }
  }

  return employee
}

router.get("/:userId", authorize(...HR_ROLES), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("employeeId firstName lastName email")
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" })

    const employee = await resolveEmployee(user)
    if (!employee)
      return res.status(404).json({ success: false, error: "No employee profile found" })

    res.json({
      success: true,
      data: {
        employeeId:     employee._id,
        employeeCode:   employee.employeeCode,
        basic:          employee.salary?.basic                 || 0,
        hra:            employee.salary?.allowances?.hra       || 0,
        transport:      employee.salary?.allowances?.transport || 0,
        medical:        employee.salary?.allowances?.medical   || 0,
        otherAllowance: employee.salary?.allowances?.other     || 0,
        pf:             employee.salary?.deductions?.pf        || 0,
        tax:            employee.salary?.deductions?.tax       || 0,
        insurance:      employee.salary?.deductions?.insurance || 0,
      },
    })
  } catch (err: any) {
    console.error("SALARY GET ERROR:", err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get("/:userId/self", authorize("EMPLOYEE", ...HR_ROLES), async (req, res) => {
  try {
    const requestingUser = (req as any).user

    if (
      requestingUser.role.toUpperCase() === "EMPLOYEE" &&
      requestingUser.id !== req.params.userId
    ) {
      return res.status(403).json({
        success: false,
        error: "You can only view your own salary details",
      })
    }

    const user = await User.findById(req.params.userId)
      .select("employeeId firstName lastName email")
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" })

    const employee = await resolveEmployee(
      user,
      "salary employeeCode joiningDate designation department"
    )
    if (!employee)
      return res.status(404).json({ success: false, error: "No employee profile found" })

    res.json({
      success: true,
      data: {
        employeeCode:   employee.employeeCode,
        designation:    employee.designation,
        department:     employee.department,
        joiningDate:    employee.joiningDate,
        basic:          employee.salary?.basic                 || 0,
        hra:            employee.salary?.allowances?.hra       || 0,
        transport:      employee.salary?.allowances?.transport || 0,
        medical:        employee.salary?.allowances?.medical   || 0,
        otherAllowance: employee.salary?.allowances?.other     || 0,
        pf:             employee.salary?.deductions?.pf        || 0,
        tax:            employee.salary?.deductions?.tax       || 0,
        insurance:      employee.salary?.deductions?.insurance || 0,
      },
    })
  } catch (err: any) {
    console.error("SALARY SELF GET ERROR:", err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put("/:userId", authorize(...HR_ROLES), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("employeeId email")
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" })

    const { basic, hra, transport, medical, otherAllowance, pf, tax, insurance } = req.body

    if (!basic || Number(basic) <= 0)
      return res.status(400).json({
        success: false,
        error: "Basic salary is required and must be > 0",
      })

    // Use full doc (no .select) so we can save
    let employee = null
    if (user.employeeId) {
      employee = await Employee.findById(user.employeeId)
    }
    if (!employee && user.email) {
      employee = await Employee.findOne({ email: user.email })
      if (employee) {
        await User.findByIdAndUpdate(user._id, { employeeId: employee._id })
        console.log(`[salary.routes] Updated employeeId for ${user.email}`)
      }
    }

    if (!employee)
      return res.status(404).json({ success: false, error: "No employee profile found" })

    employee.salary = {
      basic:    Number(basic),
      currency: "INR",
      allowances: {
        hra:       Number(hra            || 0),
        transport: Number(transport      || 0),
        medical:   Number(medical        || 0),
        other:     Number(otherAllowance || 0),
      },
      deductions: {
        pf:        Number(pf        || 0),
        tax:       Number(tax       || 0),
        insurance: Number(insurance || 0),
      },
    }

    await employee.save({ validateBeforeSave: false })

    res.json({ success: true, data: employee.salary })
  } catch (err: any) {
    console.error("SALARY PUT ERROR:", err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router