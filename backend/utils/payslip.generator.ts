import PDFDocument from "pdfkit"

export const generatePayslip = (res: any, payroll: any, emp: any) => {
  const doc = new PDFDocument()
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename=payslip.pdf`)

  doc.text(`Payslip - ${payroll.month} ${payroll.year}`)
  doc.text(`Employee ID: ${emp.employeeId}`)
  doc.text(`Basic: ${emp.basic}`)
  doc.text(`HRA: ${emp.hra}`)
  doc.text(`Deductions: ${emp.deductions}`)
  doc.text(`Net Pay: ${emp.netPay}`)

  doc.pipe(res)
  doc.end()
}
export const downloadPayslip = async (
  req: AuthRequest,
  res: Response
) => {
  const payroll = await Payroll.findById(req.params.payrollId)
  const emp = payroll!.employees.find(
    e => e.employeeId === req.params.employeeId
  )

  generatePayslip(res, payroll, emp)
}
