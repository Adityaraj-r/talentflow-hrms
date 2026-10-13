import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, DollarSign, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import * as payrollService from "@/services/payrollService"
import apiClient from "@/services/apiClient"
import { toast } from "sonner"

/**
 * CEO / executive payroll cost view — analytics from processed runs + workforce basic benchmark.
 */
const PayrollCostDashboard = () => {
  const [analytics, setAnalytics] = useState(null)
  const [workforce, setWorkforce] = useState(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [a, w] = await Promise.all([
          payrollService.getPayrollAnalytics(year),
          apiClient.get("/executive/analytics/workforce").catch(() => null),
        ])
        if (!cancelled) {
          setAnalytics(a?.data ?? a)
          const body = w?.data ?? w
          setWorkforce(body?.kpis ?? body?.data?.kpis ?? null)
        }
      } catch (e) {
        if (!cancelled) toast.error(e?.error || e?.message || "Failed to load payroll analytics")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [year])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const runs = analytics?.runs || []

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-2xl">Payroll &amp; Cost</h1>
          <p className="text-muted-foreground">
            Disbursed payroll totals by month and benchmark workforce salary cost.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="w-24 p-2 border rounded-md bg-transparent text-sm"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          />
          <Button variant="outline" asChild>
            <Link to="/ceo/analytics" className="gap-2">
              Workforce analytics <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Monthly basic benchmark
            </CardTitle>
            <CardDescription>Sum of active employee basic (not same as processed payroll).</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ₹{(workforce?.monthlyPayrollCost ?? 0).toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Trend: {workforce?.payrollGrowth ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processed payroll ({year})</CardTitle>
            <CardDescription>Disbursed / locked runs only.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{runs.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Runs in selected year</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly net by run</CardTitle>
          <CardDescription>From posted payroll engine.</CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No disbursed payroll data for this year.</p>
          ) : (
            <ul className="divide-y">
              {runs.map((r, i) => (
                <li key={i} className="py-3 flex justify-between text-sm">
                  <span>{r.month} {r.year}</span>
                  <span className="font-mono">₹{(r.totalNet || 0).toLocaleString("en-IN")} · {r.headcount} staff</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PayrollCostDashboard
