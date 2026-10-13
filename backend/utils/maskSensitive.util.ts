/** Mask PAN for API responses (show last 4). */
export function maskPan(pan: string | undefined): string | undefined {
  if (!pan || pan.length < 4) return pan ? "****" : undefined
  return `XXXXXX${pan.slice(-4)}`
}

/** Mask Aadhaar-style numeric id. */
export function maskAadhaar(aadhar: string | undefined): string | undefined {
  if (!aadhar || aadhar.length < 4) return aadhar ? "****" : undefined
  return `XXXXXXXX${aadhar.replace(/\s/g, "").slice(-4)}`
}

export function maskBankAccount(acct: string | undefined): string | undefined {
  if (!acct || acct.length < 4) return acct ? "****" : undefined
  return `****${acct.slice(-4)}`
}
