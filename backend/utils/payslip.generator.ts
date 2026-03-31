import PDFDocument from "pdfkit"

type SlipLine = {
  employeeId: string
  earnings?: {
    basic?: number
    hra?: number
    allowances?: number
    bonus?: number
    overtime?: number
    reimbursement?: number
    performanceBonus?: number
  }
  deductions?: {
    pf?: number
    esi?: number
    pt?: number
    tds?: number
    insurance?: number
    other?: number
    lopAmount?: number
    advanceTotal?: number
  }
  grossPay?: number
  totalDeductions?: number
  netPay?: number
  lopDays?: number
  /** legacy flat shape */
  basic?: number
  hra?: number
  allowances?: number
  bonus?: number
  legacyDeductionsTotal?: number
}

function normalizeSlip(emp: SlipLine) {
  if (emp.earnings && emp.deductions) {
    return {
      earnings: emp.earnings,
      deductions: emp.deductions,
      grossPay: emp.grossPay ?? 0,
      totalDeductions: emp.totalDeductions ?? 0,
      netPay: emp.netPay ?? 0,
      lopDays: emp.lopDays ?? 0,
    }
  }
  const legDed = (emp as { deductions?: number }).deductions
  const gross =
    (emp.basic || 0) + (emp.hra || 0) + (emp.allowances || 0) + (emp.bonus || 0)
  return {
    earnings: {
      basic: emp.basic || 0,
      hra: emp.hra || 0,
      allowances: emp.allowances || 0,
      bonus: emp.bonus || 0,
      overtime: 0,
      reimbursement: 0,
      performanceBonus: 0,
    },
    deductions: {
      pf: 0,
      esi: 0,
      pt: 0,
      tds: 0,
      insurance: 0,
      other: 0,
      lopAmount: 0,
      advanceTotal: 0,
      _legacyTotal: legDed ?? emp.legacyDeductionsTotal ?? 0,
    },
    grossPay: gross,
    totalDeductions: legDed ?? emp.legacyDeductionsTotal ?? 0,
    netPay: emp.netPay ?? Math.round(gross - (legDed ?? emp.legacyDeductionsTotal ?? 0)),
    lopDays: emp.lopDays || 0,
  }
}

/** PDF uses frozen snapshot only — no recomputation of net/gross */
export const generatePayslip = (res: any, payroll: any, emp: SlipLine) => {
  const snap = normalizeSlip(emp)
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

  doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1.5).strokeColor("#cccccc").stroke().moveDown(0.8)

  doc.fontSize(11).fillColor("#000000")
  doc
    .font("Helvetica-Bold")
    .text("Employee ID:", 50, doc.y, { continued: true, width: 200 })
    .font("Helvetica")
    .text(`  ${emp.employeeId}`)
    .moveDown(0.8)

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor("#1a1a2e")
    .text("EARNINGS", 50)
    .moveDown(0.4)

  doc.fontSize(10).font("Helvetica").fillColor("#333333")

  const er = snap.earnings
  const earnRows: [string, string][] = [
    ["Basic", `Rs. ${(er.basic || 0).toLocaleString()}`],
    ["HRA", `Rs. ${(er.hra || 0).toLocaleString()}`],
    ["Allowances", `Rs. ${(er.allowances || 0).toLocaleString()}`],
    ["Bonus", `Rs. ${(er.bonus || 0).toLocaleString()}`],
    ["Overtime", `Rs. ${(er.overtime || 0).toLocaleString()}`],
    ["Reimbursement", `Rs. ${(er.reimbursement || 0).toLocaleString()}`],
    ["Performance bonus", `Rs. ${(er.performanceBonus || 0).toLocaleString()}`],
  ]
  earnRows.forEach(([label, value]) => {
    doc.text(label, 70, doc.y, { continued: true, width: 350 })
    doc.text(value, { align: "right" })
    doc.moveDown(0.35)
  })

  doc.moveDown(0.3)
  doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor("#cccccc").stroke().moveDown(0.4)
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Gross Salary", 70, doc.y, { continued: true, width: 350 })
    .text(`Rs. ${snap.grossPay.toLocaleString()}`, { align: "right" })

  doc.moveDown(1)
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1a2e").text("DEDUCTIONS", 50).moveDown(0.4)
  doc.fontSize(10).font("Helvetica").fillColor("#333333")

  const d = snap.deductions as any
  if (d._legacyTotal != null) {
    doc
      .text("Deductions (aggregated)", 70, doc.y, { continued: true, width: 350 })
      .text(`Rs. ${Number(d._legacyTotal).toLocaleString()}`, { align: "right" })
      .moveDown(0.35)
  } else {
    const rows: [string, string][] = [
      ["PF", `Rs. ${(d.pf || 0).toLocaleString()}`],
      ["ESI", `Rs. ${(d.esi || 0).toLocaleString()}`],
      ["Professional Tax", `Rs. ${(d.pt || 0).toLocaleString()}`],
      ["TDS", `Rs. ${(d.tds || 0).toLocaleString()}`],
      ["Insurance", `Rs. ${(d.insurance || 0).toLocaleString()}`],
      ["Other", `Rs. ${(d.other || 0).toLocaleString()}`],
      [
        `LOP (${snap.lopDays} days)`,
        `Rs. ${(d.lopAmount || 0).toLocaleString()}`,
      ],
      ["Salary advance recovery", `Rs. ${(d.advanceTotal || 0).toLocaleString()}`],
    ]
    rows.forEach(([label, value]) => {
      doc.text(label, 70, doc.y, { continued: true, width: 350 })
      doc.text(value, { align: "right" })
      doc.moveDown(0.35)
    })
  }

  doc.moveDown(0.3)
  doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor("#cccccc").stroke().moveDown(0.4)
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Total Deductions", 70, doc.y, { continued: true, width: 350 })
    .text(`Rs. ${snap.totalDeductions.toLocaleString()}`, { align: "right" })

  doc.moveDown(1)
  doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(2).strokeColor("#1a1a2e").stroke().moveDown(0.6)
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#1a1a2e")
    .text("NET PAY", 50, doc.y, { continued: true, width: 350 })
    .text(`Rs. ${snap.netPay.toLocaleString()}`, { align: "right" })

  doc.moveDown(0.4)
  doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(2).strokeColor("#1a1a2e").stroke()

  doc.moveDown(3)
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("gray")
    .text(
      "Frozen payroll snapshot — system-generated payslip.",
      50,
      doc.y,
      { align: "center", width: 500 }
    )

  doc.end()
}
