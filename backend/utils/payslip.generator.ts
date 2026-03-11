import PDFDocument from "pdfkit"

export const generatePayslip = (res: any, payroll: any, emp: any) => {
  const doc = new PDFDocument({ margin: 50 })

  const chunks: Buffer[] = []
  doc.on("data", (chunk: Buffer) => chunks.push(chunk))
  doc.on("end", () => {
    const pdfBuffer = Buffer.concat(chunks)
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Length", pdfBuffer.length)
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payslip-${emp.employeeId}-${payroll.month}-${payroll.year}.pdf`
    )
    res.end(pdfBuffer)
  })
  doc.on("error", (err: Error) => {
    console.error("PDF generation error:", err)
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: "PDF generation failed" })
    }
  })

  // ── Header ──────────────────────────────────────────────────────────────────
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .fillColor("#1a1a2e")
    .text("SALARY SLIP", { align: "center" })
    .moveDown(0.3)

  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor("#444444")
    .text(`${payroll.month} ${payroll.year}`, { align: "center" })
    .moveDown(1)

  // ── Top Divider ─────────────────────────────────────────────────────────────
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(1.5)
    .strokeColor("#cccccc")
    .stroke()
    .moveDown(0.8)

  // ── Employee Info ────────────────────────────────────────────────────────────
  doc.fontSize(11).fillColor("#000000")

  doc
    .font("Helvetica-Bold")
    .text("Employee ID:", 50, doc.y, { continued: true, width: 200 })
    .font("Helvetica")
    .text(`  ${emp.employeeId}`)
    .moveDown(0.4)

  // ── Section Divider ──────────────────────────────────────────────────────────
  doc.moveDown(0.5)
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(0.5)
    .strokeColor("#cccccc")
    .stroke()
    .moveDown(0.8)

  // ── Earnings Section ─────────────────────────────────────────────────────────
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor("#1a1a2e")
    .text("EARNINGS", 50)
    .moveDown(0.4)

  doc.fontSize(10).font("Helvetica").fillColor("#333333")

  const earningsRows: [string, string][] = [
    ["Basic Salary",     `Rs. ${(emp.basic      || 0).toLocaleString()}`],
    ["HRA",              `Rs. ${(emp.hra         || 0).toLocaleString()}`],
    ["Other Allowances", `Rs. ${(emp.allowances  || 0).toLocaleString()}`],
    ["Bonus",            `Rs. ${(emp.bonus       || 0).toLocaleString()}`],
  ]

  earningsRows.forEach(([label, value]) => {
    doc.text(label, 70, doc.y, { continued: true, width: 350 })
    doc.text(value, { align: "right" })
    doc.moveDown(0.35)
  })

  const gross =
    (emp.basic     || 0) +
    (emp.hra       || 0) +
    (emp.allowances|| 0) +
    (emp.bonus     || 0)

  doc.moveDown(0.3)
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(0.5)
    .strokeColor("#cccccc")
    .stroke()
    .moveDown(0.4)

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("Gross Salary", 70, doc.y, { continued: true, width: 350 })
    .text(`Rs. ${gross.toLocaleString()}`, { align: "right" })

  // ── Deductions Section ───────────────────────────────────────────────────────
  doc.moveDown(1)
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor("#1a1a2e")
    .text("DEDUCTIONS", 50)
    .moveDown(0.4)

  doc.fontSize(10).font("Helvetica").fillColor("#333333")

  doc
    .text("Provident Fund (PF)", 70, doc.y, { continued: true, width: 350 })
    .text(`Rs. ${(emp.deductions || 0).toLocaleString()}`, { align: "right" })
    .moveDown(0.35)

  if (emp.lopDays > 0) {
    doc
      .text(`LOP Deduction (${emp.lopDays} days)`, 70, doc.y, { continued: true, width: 350 })
      .text(`${emp.lopDays} days`, { align: "right" })
      .moveDown(0.35)
  }

  doc.moveDown(0.3)
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(0.5)
    .strokeColor("#cccccc")
    .stroke()
    .moveDown(0.4)

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("Total Deductions", 70, doc.y, { continued: true, width: 350 })
    .text(`Rs. ${(emp.deductions || 0).toLocaleString()}`, { align: "right" })

  // ── Net Pay ──────────────────────────────────────────────────────────────────
  doc.moveDown(1)
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(2)
    .strokeColor("#1a1a2e")
    .stroke()
    .moveDown(0.6)

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#1a1a2e")
    .text("NET PAY", 50, doc.y, { continued: true, width: 350 })
    .text(`Rs. ${(emp.netPay || 0).toLocaleString()}`, { align: "right" })

  doc.moveDown(0.4)
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(2)
    .strokeColor("#1a1a2e")
    .stroke()

  // ── Footer ───────────────────────────────────────────────────────────────────
  doc.moveDown(3)
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("gray")
    .text(
      "This is a system-generated payslip and does not require a signature.",
      50,
      doc.y,
      { align: "center", width: 500 }
    )

  doc.end()
}
