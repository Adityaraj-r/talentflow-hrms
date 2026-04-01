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

const LABEL_BG = "#f0f0ff"
const BAR_BG = "#e8e8ff"
const TEXT = "#1a1a1a"
const MUTED = "#555555"

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
  return `${sym}${Math.round(n).toLocaleString("en-US")}`
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
  paymentMethod: string
  currencySymbol: string
  defaultMonthWorkingHours: number
  ytd: PayslipYtd
  /** Sanitized base filename without extension (employee code) */
  fileBaseName: string
}

/** Builds Pay Stub PDF; attachment filename `{employeeCode}.pdf`. */
export const generatePayslip = (res: any, ctx: PayslipContext) => {
  const snap = normalizeSlip(ctx.slip)
  const doc = new PDFDocument({ margin: 48, size: "LETTER" })
  const pageW = 612
  const left = 48
  const right = pageW - 48
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
  const hours = Math.max(1, ctx.defaultMonthWorkingHours)
  const basic = snap.earnings.basic || 0
  const rateRegular = basic > 0 ? Math.round((basic / hours) * 100) / 100 : 0
  const otherCurrent =
    (snap.earnings.hra || 0) +
    (snap.earnings.allowances || 0) +
    (snap.earnings.bonus || 0) +
    (snap.earnings.overtime || 0) +
    (snap.earnings.reimbursement || 0) +
    (snap.earnings.performanceBonus || 0)
  const rateOther =
    otherCurrent > 0 && hours > 0 ? Math.round((otherCurrent / hours) * 100) / 100 : 0

  const d = snap.deductions as Record<string, number | undefined> & { _legacyTotal?: number }
  let medicare = 0,
    socialSecurity = 0,
    federalTax = 0,
    stateTax = 0,
    otherDed = 0
  if (d._legacyTotal != null && d._legacyTotal > 0) {
    otherDed = Number(d._legacyTotal)
  } else {
    medicare = d.esi || 0
    socialSecurity = d.pf || 0
    federalTax = d.tds || 0
    stateTax = d.pt || 0
    otherDed =
      (d.insurance || 0) + (d.other || 0) + (d.lopAmount || 0) + (d.advanceTotal || 0)
  }

  const y = ctx.ytd

  let cy = 48

  doc.font("Helvetica-Bold").fontSize(22).fillColor(TEXT).text("Pay Stub", left, cy, {
    width: contentW,
    align: "center",
  })
  cy = doc.y + 16

  doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT).text(ctx.employerName, left, cy)
  cy = doc.y + 4
  doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(ctx.employerAddress || " ", left, cy, {
    width: contentW * 0.55,
  })
  cy = doc.y + 14

  const labelX = left
  const valX = left + 118
  const rowH = 16
  const addField = (label: string, value: string) => {
    doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT).text(label, labelX, cy)
    doc.font("Helvetica").fontSize(9).fillColor(TEXT).text(value, valX, cy, { width: contentW - valX + left - 8 })
    cy += rowH
  }
  addField("Employee Name:", ctx.employeeName)
  addField("Employee ID No:", ctx.employeeCode)
  addField("Position/Title:", ctx.position || "—")
  addField("Address:", ctx.employeeAddress || "—")
  addField("Payment Method:", ctx.paymentMethod)
  cy += 8

  const barH = 26
  doc.rect(left, cy, contentW, barH).fill(BAR_BG)
  const colW = contentW / 3
  const pFrom = fmtUSDate(ctx.period.startStr)
  const pTo = fmtUSDate(ctx.period.endStr)
  const payDt = ctx.payroll.disbursedAt
    ? fmtUSDate(ctx.payroll.disbursedAt.toISOString().slice(0, 10))
    : paymentDateAfterPeriod(ctx.period.endStr)
  doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(8)
  doc.text("Payment Period (From)", left + 8, cy + 6, { width: colW - 16 })
  doc.font("Helvetica").fontSize(9).text(pFrom, left + 8, cy + 14, { width: colW - 16 })
  doc.font("Helvetica-Bold").fontSize(8).text("Payment Period (To)", left + colW + 8, cy + 6, { width: colW - 16 })
  doc.font("Helvetica").fontSize(9).text(pTo, left + colW + 8, cy + 14, { width: colW - 16 })
  doc.font("Helvetica-Bold").fontSize(8).text("Payment Date", left + 2 * colW + 8, cy + 6, { width: colW - 16 })
  doc.font("Helvetica").fontSize(9).text(payDt, left + 2 * colW + 8, cy + 14, { width: colW - 16 })
  cy += barH + 14

  const colLabelW = 108
  const colRate = 72
  const colHours = 52
  const colCur = 92
  const colYtd = 92
  const xRate = left + colLabelW
  const xHours = xRate + colRate
  const xCur = xHours + colHours
  const xYtd = xCur + colCur

  const drawHeader = (titles: string[]) => {
    doc.rect(left, cy, contentW, 18).fill(LABEL_BG)
    doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(8)
    doc.text(titles[0], left + 6, cy + 5, { width: colLabelW - 8 })
    doc.text(titles[1], xRate, cy + 5, { width: colRate - 4, align: "right" })
    doc.text(titles[2], xHours, cy + 5, { width: colHours - 4, align: "right" })
    doc.text(titles[3], xCur, cy + 5, { width: colCur - 4, align: "right" })
    doc.text(titles[4], xYtd, cy + 5, { width: colYtd - 4, align: "right" })
    cy += 18
  }

  doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT).text("Earnings", left, cy)
  cy = doc.y + 6
  drawHeader(["", "Rate", "Hours", "Current Total", "YTD"])

  const earnRow = (
    name: string,
    rate: number,
    hrs: number,
    cur: number,
    ytdVal: number
  ) => {
    const h = 20
    doc.rect(left, cy, colLabelW, h).fill(LABEL_BG)
    doc.fillColor(TEXT).font("Helvetica").fontSize(9).text(name, left + 6, cy + 5, { width: colLabelW - 10 })
    doc
      .rect(xRate, cy, colRate + colHours + colCur + colYtd, h)
      .fill("#ffffff")
    doc.fillColor(TEXT).font("Helvetica").fontSize(9)
    doc.text(rate > 0 ? money(sym, rate) : "—", xRate, cy + 5, { width: colRate - 6, align: "right" })
    doc.text(String(hrs), xHours, cy + 5, { width: colHours - 6, align: "right" })
    doc.text(money(sym, cur), xCur, cy + 5, { width: colCur - 6, align: "right" })
    doc.text(money(sym, ytdVal), xYtd, cy + 5, { width: colYtd - 6, align: "right" })
    cy += h
  }

  earnRow("Regular", rateRegular, hours, basic, y.regular)
  earnRow("Other", rateOther, otherCurrent > 0 ? hours : 0, otherCurrent, y.otherEarnings)

  const grossH = 20
  doc.rect(left, cy, colLabelW, grossH).fill(LABEL_BG)
  doc.font("Helvetica-Bold").fontSize(9).text("Gross", left + 6, cy + 6, { width: colLabelW - 10 })
  doc.rect(xRate, cy, colRate + colHours + colCur + colYtd, grossH).fill("#fafafa")
  doc.font("Helvetica-Bold").fillColor(TEXT)
  doc.text("", xRate, cy + 6, { width: colRate + colHours - 6 })
  doc.text(money(sym, snap.grossPay), xCur, cy + 6, { width: colCur - 6, align: "right" })
  doc.text(money(sym, y.gross), xYtd, cy + 6, { width: colYtd - 6, align: "right" })
  cy += grossH + 16

  doc.font("Helvetica-Bold").fontSize(11).text("Deductions", left, cy)
  cy = doc.y + 6
  drawHeader(["", "", "", "Current Total", "YTD"])

  const dedRow = (name: string, cur: number, ytdVal: number) => {
    const h = 20
    doc.rect(left, cy, colLabelW, h).fill(LABEL_BG)
    doc.fillColor(TEXT).font("Helvetica").fontSize(9).text(name, left + 6, cy + 5, { width: colLabelW - 10 })
    doc.rect(xRate, cy, colRate + colHours + colCur + colYtd, h).fill("#ffffff")
    doc.fillColor(TEXT)
    doc.text(money(sym, cur), xCur, cy + 5, { width: colCur - 6, align: "right" })
    doc.text(money(sym, ytdVal), xYtd, cy + 5, { width: colYtd - 6, align: "right" })
    cy += h
  }

  dedRow("Medicare", medicare, y.medicare)
  dedRow("Social Security", socialSecurity, y.socialSecurity)
  dedRow("Federal Tax", federalTax, y.federalTax)
  dedRow("State Tax", stateTax, y.stateTax)
  dedRow("Other", otherDed, y.otherDeductions)

  const totDedH = 20
  doc.rect(left, cy, colLabelW, totDedH).fill(LABEL_BG)
  doc.font("Helvetica-Bold").fontSize(9).text("Total Deductions", left + 6, cy + 5, { width: colLabelW - 10 })
  doc.rect(xRate, cy, colRate + colHours + colCur + colYtd, totDedH).fill("#fafafa")
  doc.fillColor(TEXT)
  doc.text(money(sym, snap.totalDeductions), xCur, cy + 5, { width: colCur - 6, align: "right" })
  doc.text(money(sym, y.totalDeductions), xYtd, cy + 5, { width: colYtd - 6, align: "right" })
  cy += totDedH + 16

  const netH = 24
  doc.rect(left, cy, colLabelW, netH).fill(LABEL_BG)
  doc.font("Helvetica-Bold").fontSize(10).text("Net Pay", left + 6, cy + 7, { width: colLabelW - 10 })
  doc.rect(xRate, cy, colRate + colHours + colCur + colYtd, netH).fill("#f5f5ff")
  doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(10)
  doc.text(money(sym, snap.netPay), xCur, cy + 7, { width: colCur - 6, align: "right" })
  doc.text(money(sym, y.net), xYtd, cy + 7, { width: colYtd - 6, align: "right" })
  cy += netH + 20

  doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(
    "Amounts reflect this payroll run. YTD includes all regular runs for this calendar year through this pay period.",
    left,
    cy,
    { width: contentW, align: "center" }
  )

  doc.end()
}
