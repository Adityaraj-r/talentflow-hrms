import { useState, useEffect, useCallback } from "react"
import { 
  Slack, Github, Mail, Video, Server, 
  CheckCircle2, Power, RefreshCw 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import adminService from "@/services/adminService"
import { DataTable } from "@/components/ui/data-table"
import { ActionIcon } from "@/components/ui/action-icon"
import { Settings } from "lucide-react"

const Integrations = () => {
  const [loading, setLoading] = useState(null)
  const [integrations, setIntegrations] = useState([
    {
      id: "slack",
      name: "Slack",
      description: "Receive HR notifications and leave requests directly in Slack channels.",
      icon: Slack,
      color: "text-purple-500",
      bg: "bg-purple-100",
      status: "Connected",
      connectedUser: "Company Workspace",
      lastSync: "Today, 10:30 AM"
    },
    {
      id: "google_workspace",
      name: "Google Workspace",
      description: "Sync employee emails, calendars, and SSO login with Google.",
      icon: Mail,
      color: "text-purple-500",
      bg: "bg-purple-100",
      status: "Disconnected",
      connectedUser: null,
      lastSync: null
    },
    {
      id: "google_meet",
      name: "Google Meet",
      description: "Auto-generate meeting links for interviews and team syncs.",
      icon: Video,
      color: "text-purple-600",
      bg: "bg-purple-50",
      status: "Connected",
      connectedUser: "Enterprise Account",
      lastSync: "Yesterday, 4:00 PM"
    },
    {
      id: "github",
      name: "GitHub",
      description: "Link engineering activity to performance metrics automatically.",
      icon: Github,
      color: "text-gray-700",
      bg: "bg-gray-100",
      status: "Disconnected",
      connectedUser: null,
      lastSync: null
    },
    {
      id: "aws",
      name: "AWS S3",
      description: "Store employee documents and backups securely in S3 buckets.",
      icon: Server,
      color: "text-orange-500",
      bg: "bg-orange-100",
      status: "Connected",
      connectedUser: "hrms-prod-storage",
      lastSync: "Today, 12:00 AM"
    }
  ])

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        toast.success("Google Workspace linked successfully")
        setIntegrations(prev => prev.map(item => 
          (item.id === "google_workspace" || item.id === "google_meet") 
            ? { ...item, status: "Connected", lastSync: "Just now", connectedUser: "Active Workspace" } 
            : item
        ))
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleConfigure = useCallback(async (id) => {
    if (id === "google_workspace" || id === "google_meet") {
      setLoading(id)
      try {
        const response = await adminService.getGoogleAuthUrl()
        if (response.url) {
          window.open(response.url, "GoogleAuth", "width=600,height=700")
        }
      } catch (error) {
        toast.error("Failed to initialize Google connection")
      } finally {
        setLoading(null)
      }
      return
    }
    toast.info(`Configuration for ${id} coming soon`)
  }, [])

  const handleToggle = (id) => {
    setLoading(id)
    setTimeout(() => {
      setIntegrations(prev => prev.map(item => {
        if (item.id === id) {
          const newStatus = item.status === "Connected" ? "Disconnected" : "Connected"
          return { 
            ...item, 
            status: newStatus,
            lastSync: newStatus === "Connected" ? "Just now" : null 
          }
        }
        return item
      }))
      setLoading(null)
      toast.success("Integration status updated")
    }, 800)
  }

  return (
    <div className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Integrations</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">Manage enterprise connections with third-party services.</p>
        </div>
        <Button variant="outline" size="sm">
           <RefreshCw className="mr-2 h-4 w-4" /> Sync All
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden">
        <DataTable
          columns={[
            {
              accessorKey: "integration",
              header: "Integration",
              cell: ({ row }) => {
                const item = row.original;
                return (
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", item.bg)}>
                      <item.icon className={cn("h-6 w-6", item.color)} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                );
              }
            },
            {
              accessorKey: "statusInfo",
              header: "Status",
              cell: ({ row }) => {
                const item = row.original;
                return item.status === "Connected" ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" /> Connected
                    </div>
                    {item.lastSync && <span className="text-[10px] text-muted-foreground">Last sync: {item.lastSync}</span>}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Power className="h-4 w-4" /> Disconnected
                  </div>
                );
              }
            },
            {
              accessorKey: "connectedUser",
              header: "Linked Account",
              cell: ({ row }) => (
                <span className="text-xs font-medium">
                  {row.original.status === "Connected" ? row.original.connectedUser : "—"}
                </span>
              )
            },
            {
              id: "actions",
              header: () => <div className="text-right">Actions</div>,
              cell: ({ row }) => {
                const item = row.original;
                return (
                  <div className="flex justify-end items-center gap-3">
                    <Switch 
                      checked={item.status === "Connected"} 
                      onCheckedChange={() => handleToggle(item.id)}
                      disabled={loading === item.id}
                    />
                    <ActionIcon
                      icon={Settings}
                      tooltip="Configure"
                      onClick={() => handleConfigure(item.id)}
                      disabled={loading === item.id}
                    />
                  </div>
                );
              }
            }
          ]}
          data={integrations}
          searchable={false}
        />
      </div>
    </div>
  )
}

export default Integrations