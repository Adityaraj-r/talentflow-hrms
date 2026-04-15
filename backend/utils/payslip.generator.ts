import PDFDocument from "pdfkit"
import Payroll from "../models/payroll.model"
import type { PeriodBounds } from "../services/payrollCalculation.service"

const MONTHS_ORDER = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

const TEXT = "#0f172a"
const MUTED = "#64748b"
const BORDER = "#1e293b"
const HEADER_BLUE = "#1e40af"
const SECTION_BG = "#dbeafe"

export type SlipLine = {
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

export type PayslipYtd = {
  regular: number
  otherEarnings: number
  gross: number
  net: number
  medicare: number
  socialSecurity: number
  federalTax: number
  stateTax: number
  otherDeductions: number
  totalDeductions: number
}

/** Sum payroll lines for this user from Jan through current month (inclusive) in the same year. */
export async function computePayslipYearToDate(
  year: number,
  currentMonth: string,
  userIdStr: string
): Promise<PayslipYtd> {
  const maxIdx = MONTHS_ORDER.indexOf(currentMonth as (typeof MONTHS_ORDER)[number])
  const empty: PayslipYtd = {
    regular: 0,
    otherEarnings: 0,
    gross: 0,
    net: 0,
    medicare: 0,
    socialSecurity: 0,
    federalTax: 0,
    stateTax: 0,
    otherDeductions: 0,
    totalDeductions: 0,
  }
  if (maxIdx < 0) return empty

  const runs = await Payroll.find({
    year,
    $or: [{ runKind: "regular" }, { runKind: { $exists: false } }],
  }).lean()

  const acc = { ...empty }
  for (const run of runs) {
    const mi = MONTHS_ORDER.indexOf(run.month as (typeof MONTHS_ORDER)[number])
    if (mi < 0 || mi > maxIdx) continue
    const line = run.employees?.find((e: { employeeId: string }) => e.employeeId === userIdStr)
    if (!line) continue
    const snap = normalizeSlip(line as SlipLine)
    const er = snap.earnings
    const other =
      (er.hra || 0) +
      (er.allowances || 0) +
      (er.bonus || 0) +
      (er.overtime || 0) +
      (er.reimbursement || 0) +
      (er.performanceBonus || 0)
    acc.regular += er.basic || 0
    acc.otherEarnings += other
    acc.gross += snap.grossPay
    acc.net += snap.netPay
    const d = snap.deductions as Record<string, number | undefined> & { _legacyTotal?: number }
    if (d._legacyTotal != null && d._legacyTotal > 0) {
      acc.otherDeductions += Number(d._legacyTotal)
      acc.totalDeductions += Number(d._legacyTotal)
    } else {
      acc.socialSecurity += d.pf || 0
      acc.medicare += d.esi || 0
      acc.federalTax += d.tds || 0
      acc.stateTax += d.pt || 0
      const od =
        (d.insurance || 0) + (d.other || 0) + (d.lopAmount || 0) + (d.advanceTotal || 0)
      acc.otherDeductions += od
      acc.totalDeductions += snap.totalDeductions
    }
  }
  return acc
}

function fmtUSDate(isoYmd: string): string {
  const p = isoYmd.split("-").map(Number)
  if (p.length !== 3 || !p[0]) return isoYmd
  const [y, m, d] = p
  return `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}`
}

function paymentDateAfterPeriod(endIso: string): string {
  const end = new Date(`${endIso}T12:00:00.000Z`)
  const next = new Date(end.getTime())
  next.setUTCDate(next.getUTCDate() + 1)
  const y = next.getUTCFullYear()
  const m = next.getUTCMonth() + 1
  const d = next.getUTCDate()
  return `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}`
}

function money(sym: string, n: number): string {
  return `${sym}${Math.round(n).toLocaleString("en-IN")}`
}

export type PayslipContext = {
  payroll: {
    month: string
    year: number
    disbursedAt?: Date
    generatedAt?: Date
  }
  slip: SlipLine
  period: PeriodBounds
  employerName: string
  employerAddress: string
  employeeName: string
  employeeCode: string
  position: string
  employeeAddress: string
  employeePhone?: string
  employeeEmail?: string
  paymentMethod: string
  companyPhone?: string
  companyEmail?: string
  currencySymbol: string
  defaultMonthWorkingHours: number
  ytd: PayslipYtd
  /** Sanitized base filename without extension (employee code) */
  fileBaseName: string
}

function amountToWordsIndian(num: number): string {
  const n = Math.max(0, Math.round(num))
  if (n === 0) return "Zero Only"
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  const under100 = (x: number) => {
    if (x < 20) return ones[x]
    return `${tens[Math.floor(x / 10)]}${x % 10 ? ` ${ones[x % 10]}` : ""}`
  }
  const under1000 = (x: number) => {
    if (x < 100) return under100(x)
    return `${ones[Math.floor(x / 100)]} Hundred${x % 100 ? ` ${under100(x % 100)}` : ""}`
  }
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const hundred = n % 1000
  const parts: string[] = []
  if (crore) parts.push(`${under1000(crore)} Crore`)
  if (lakh) parts.push(`${under1000(lakh)} Lakh`)
  if (thousand) parts.push(`${under1000(thousand)} Thousand`)
  if (hundred) parts.push(under1000(hundred))
  return `${parts.join(" ")} Only`
}

/** Builds salary slip PDF; attachment filename `{employeeCode}.pdf`. */
export const generatePayslip = (res: any, ctx: PayslipContext) => {
  const snap = normalizeSlip(ctx.slip)
  const doc = new PDFDocument({ margin: 36, size: "A4" })
  const pageW = 595.28
  const left = 36
  const right = pageW - 36
  const contentW = right - left

  const chunks: Buffer[] = []
  doc.on("data", (chunk: Buffer) => chunks.push(chunk))
  doc.on("end", () => {
    const pdfBuffer = Buffer.concat(chunks)
    const safeName = `${ctx.fileBaseName.replace(/[^\w.-]/g, "_")}.pdf`
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Length", pdfBuffer.length)
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`)
    res.end(pdfBuffer)
  })
  doc.on("error", (err: Error) => {
    console.error("PDF generation error:", err)
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: "PDF generation failed" })
    }
  })

  const sym = ctx.currencySymbol
  const otherCurrent =
    (snap.earnings.hra || 0) +
    (snap.earnings.allowances || 0) +
    (snap.earnings.bonus || 0) +
    (snap.earnings.overtime || 0) +
    (snap.earnings.reimbursement || 0) +
    (snap.earnings.performanceBonus || 0)

  const d = snap.deductions as Record<string, number | undefined> & { _legacyTotal?: number }
  let pf = 0,
    esi = 0,
    pt = 0,
    tds = 0,
    otherDed = 0
  if (d._legacyTotal != null && d._legacyTotal > 0) {
    otherDed = Number(d._legacyTotal)
  } else {
    pf = d.pf || 0
    esi = d.esi || 0
    tds = d.tds || 0
    pt = d.pt || 0
    otherDed =
      (d.insurance || 0) + (d.other || 0) + (d.lopAmount || 0) + (d.advanceTotal || 0)
  }

  const payDt = ctx.payroll.disbursedAt
    ? fmtUSDate(ctx.payroll.disbursedAt.toISOString().slice(0, 10))
    : paymentDateAfterPeriod(ctx.period.endStr)

  const companyName = ctx.employerName || "Indux Tech.Pvt. Ltd."
  let cy = 28

  doc.font("Helvetica-Bold").fontSize(17).fillColor(HEADER_BLUE).text(companyName, left, cy, {
    width: contentW,
    align: "center",
  })
  cy = doc.y + 4
  doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(
    `${ctx.payroll.month} ${ctx.payroll.year} · Confidential`,
    left,
    cy,
    { width: contentW, align: "center" }
  )
  cy = doc.y + 10

  doc.rect(left, cy, contentW, 30).fill(HEADER_BLUE)
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16).text("Salary Slip", left, cy + 6, {
    width: contentW,
    align: "center",
  })
  cy += 30

  const sectionBar = (title: string) => {
    doc.rect(left, cy, contentW, 22).fill(SECTION_BG)
    doc.strokeColor(BORDER).rect(left, cy, contentW, 22).stroke()
    doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(10).text(title, left, cy + 6, {
      width: contentW,
      align: "center",
    })
    cy += 22
  }

  const fieldLine = (label: string, value: string, y: number, labelW: number) => {
    doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT).text(`${label}:`, left + 10, y, { width: labelW })
    doc.font("Helvetica").fontSize(9).text(value || "—", left + 10 + labelW, y, {
      width: contentW - labelW - 20,
    })
  }

  sectionBar("Company Information")
  const companyH = 86
  doc.rect(left, cy, contentW, companyH).stroke(BORDER)
  let ly = cy + 10
  const lw = 140
  fieldLine("Company Name", companyName, ly, lw)
  ly += 18
  fieldLine("Address", ctx.employerAddress || "—", ly, lw)
  ly += 18
  fieldLine("Phone", ctx.companyPhone || "—", ly, lw)
  ly += 18
  fieldLine("Email", ctx.companyEmail || "—", ly, lw)
  cy += companyH

  sectionBar("Employee Information")
  const empH = 104
  doc.rect(left, cy, contentW, empH).stroke(BORDER)
  ly = cy + 10
  fieldLine("Name", ctx.employeeName || "—", ly, lw)
  ly += 18
  fieldLine("Address", ctx.employeeAddress || "—", ly, lw)
  ly += 18
  fieldLine("Phone", ctx.employeePhone || "—", ly, lw)
  ly += 18
  fieldLine("Email", ctx.employeeEmail || "—", ly, lw)
  ly += 18
  fieldLine("Employee Code", ctx.employeeCode || "—", ly, lw)
  cy += empH

  const rowH = 21
  const colW = [contentW * 0.34, contentW * 0.16, contentW * 0.34, contentW * 0.16]
  const colX = [left, left + colW[0], left + colW[0] + colW[1], left + colW[0] + colW[1] + colW[2]]

  const drawRow = (cells: [string, string, string, string], opts: { header?: boolean; bold?: boolean } = {}) => {
    const { header, bold } = opts
    if (header) {
      doc.rect(left, cy, contentW, rowH).fill(SECTION_BG).stroke(BORDER)
    } else {
      doc.rect(left, cy, contentW, rowH).stroke(BORDER)
    }
    for (let i = 1; i < 4; i += 1) {
      doc.moveTo(colX[i], cy).lineTo(colX[i], cy + rowH).stroke(BORDER)
    }
    const font = bold ? "Helvetica-Bold" : "Helvetica"
    doc.fillColor(TEXT).font(font).fontSize(9)
    doc.text(cells[0], colX[0] + 6, cy + 6, { width: colW[0] - 12, align: "left" })
    doc.text(cells[1], colX[1] + 4, cy + 6, { width: colW[1] - 8, align: "right" })
    doc.text(cells[2], colX[2] + 6, cy + 6, { width: colW[2] - 12, align: "left" })
    doc.text(cells[3], colX[3] + 4, cy + 6, { width: colW[3] - 8, align: "right" })
    cy += rowH
  }

  drawRow(["Earnings", "Amount", "Deductions", "Amount"], { header: true })
  drawRow(["Basic", money(sym, snap.earnings.basic || 0), "Provident Fund", money(sym, pf)])
  drawRow(["HRA", money(sym, snap.earnings.hra || 0), "ESI", money(sym, esi)])
  drawRow(["Special Allowance", money(sym, snap.earnings.allowances || 0), "Professional Tax", money(sym, pt)])
  drawRow(["Gross Salary", money(sym, snap.grossPay), "Salary Advance", money(sym, d.advanceTotal || 0)], { bold: true })
  drawRow(["Other Earnings", money(sym, otherCurrent), "TDS", money(sym, tds)])
  drawRow(["Incentives", money(sym, snap.earnings.performanceBonus || 0), "Other Deduction", money(sym, otherDed)])
  drawRow(["Bonus", money(sym, snap.earnings.bonus || 0), "", ""])
  drawRow(["Over Time Pay", money(sym, snap.earnings.overtime || 0), "", ""])
  drawRow(["Total Earnings", money(sym, snap.grossPay), "", ""], { bold: true })

  const wordsLine = `In words: ${amountToWordsIndian(snap.netPay)}`
  doc.font("Helvetica").fontSize(9)
  const wordsH = doc.heightOfString(wordsLine, { width: contentW - 24 })
  const netTop = cy
  const netLine1 = 28
  const netBlockH = netLine1 + Math.max(28, wordsH + 16)

  doc.rect(left, netTop, contentW, netBlockH).fill("#eff6ff").stroke(BORDER)
  doc.moveTo(left + colW[0], netTop).lineTo(left + colW[0], netTop + netLine1).stroke(BORDER)
  doc.moveTo(left + colW[0] + colW[1], netTop).lineTo(left + colW[0] + colW[1], netTop + netLine1).stroke(BORDER)
  doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(11)
  doc.text("Net Pay", left + 8, netTop + 8, { width: colW[0] - 12, align: "center" })
  doc.text(money(sym, snap.netPay), left + colW[0] + 8, netTop + 8, { width: colW[1] - 12, align: "right" })
  doc.moveTo(left, netTop + netLine1).lineTo(left + contentW, netTop + netLine1).stroke(BORDER)
  doc.font("Helvetica").fontSize(9).fillColor(TEXT)
  doc.text(wordsLine, left + 12, netTop + netLine1 + 8, { width: contentW - 24 })
  cy = netTop + netBlockH + 14

  const footH = 52
  doc.rect(left, cy, contentW / 2, footH).fill(SECTION_BG).stroke(BORDER)
  doc.rect(left + contentW / 2, cy, contentW / 2, footH).fill(SECTION_BG).stroke(BORDER)
  doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(10)
  doc.text("Prepared By:", left + 12, cy + 32)
  doc.text("Received By:", left + contentW / 2 + 12, cy + 32)

  doc.font("Helvetica").fontSize(8).fillColor(MUTED)
  doc.text(`Pay period: ${fmtUSDate(ctx.period.startStr)} – ${fmtUSDate(ctx.period.endStr)}`, left, cy + footH + 8, {
    width: contentW * 0.55,
  })
  doc.text(`Payment date: ${payDt}  ·  ${ctx.paymentMethod || "—"}`, left + contentW * 0.45, cy + footH + 8, {
    width: contentW * 0.55,
    align: "right",
  })

  doc.end()
}
