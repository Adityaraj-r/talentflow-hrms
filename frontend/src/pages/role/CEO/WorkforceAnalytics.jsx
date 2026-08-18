import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Stethoscope, Briefcase, DollarSign, Activity, TrendingDown, Loader2 } from "lucide-react"
import apiClient from "@/services/apiClient"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const WorkforceAnalytics = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiClient.get('/executive/analytics/workforce')
        const responseBody = res.data || res;
        const analyticsPayload = responseBody.data || responseBody;
        setData(analyticsPayload)
      } catch (error) {
        console.error("Failed to load executive analytics", error)
        toast.error("Failed to compile analytics. Check console.")
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p>Compiling Executive Metrics...</p>
        </div>
      </div>
    )
  }

  const kpis = data?.kpis || {}
  const charts = data?.charts || {}

  const isPositive = (trendStr) => !trendStr?.startsWith('-')

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-2xl">Workforce Analytics</h1>
        <p className="text-muted-foreground">High-level KPIs and critical business intelligence metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard 
          title="Total Headcount" 
          value={kpis.totalHeadcount ?? 0} 
          icon={Users} 
          trend={kpis.headcountGrowth} 
          trendGood={isPositive(kpis.headcountGrowth)} 
          color="text-purple-600" bg="bg-purple-100 dark:bg-purple-900/20" 
        />
        <KPICard title="Active Today" value={kpis.activeToday ?? 0} icon={UserCheck} color="text-green-600" bg="bg-green-100 dark:bg-green-900/20" />
        <KPICard title="On Leave Today" value={kpis.onLeaveToday ?? 0} icon={Stethoscope} color="text-orange-500" bg="bg-orange-100 dark:bg-orange-900/20" />
        <KPICard title="Open Requisitions" value={kpis.openRequisitions ?? 0} icon={Briefcase} color="text-purple-600" bg="bg-purple-100 dark:bg-purple-900/20" />
        
        <KPICard 
          title="Monthly Payroll Cost" 
          value={`₹${(kpis.monthlyPayrollCost || 0).toLocaleString('en-IN')}`} 
          icon={DollarSign} 
          trend={kpis.payrollGrowth} 
          trendGood={!isPositive(kpis.payrollGrowth)} 
          color="text-emerald-600" bg="bg-emerald-100 dark:bg-emerald-900/20" 
        />
        <KPICard title="Avg Performance" value={`${kpis.avgPerformanceScore ?? 0} / 5.0`} icon={Activity} color="text-purple-600" bg="bg-purple-100 dark:bg-purple-900/20" />
        <KPICard title="Attrition Rate (30d)" value={`${kpis.attritionRate30d ?? 0}%`} icon={TrendingDown} color="text-red-600" bg="bg-red-100 dark:bg-red-900/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">6-Month Headcount Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {charts.headcountTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.headcountTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHeadcount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  <Area type="monotone" dataKey="headcount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHeadcount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No historical data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">Department Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {charts.departmentDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.departmentDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {charts.departmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No department data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">Gender Diversity</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {charts.genderDiversity?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.genderDiversity}
                    cx="50%" cy="50%"
                    innerRadius={80} outerRadius={110}
                    paddingAngle={5} dataKey="value"
                    stroke="none"
                  >
                    {charts.genderDiversity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No demographic data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const KPICard = ({ title, value, icon: Icon, trend, trendGood, color, bg }) => (
  <Card className="shadow-sm border-none transition-all hover:shadow-md dark:bg-slate-900">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={cn("p-3 rounded-xl", bg, color)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={cn("font-medium", trendGood ? "text-green-600 dark:text-green-400" :"text-green-600 dark:text-green-400")}>
            {trend}
          </span>
          <span className="text-muted-foreground ml-2">vs last month</span>
        </div>
      )}
    </CardContent>
  </Card>
)

export default WorkforceAnalytics