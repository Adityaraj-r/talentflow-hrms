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
      color: "text-blue-500",
      bg: "bg-blue-100",
      status: "Disconnected",
      connectedUser: null,
      lastSync: null
    },
    {
      id: "google_meet",
      name: "Google Meet",
      description: "Auto-generate meeting links for interviews and team syncs.",
      icon: Video,
      color: "text-blue-600",
      bg: "bg-blue-50",
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">Manage enterprise connections with third-party services.</p>
        </div>
        <Button variant="outline" size="sm">
           <RefreshCw className="mr-2 h-4 w-4" /> Sync All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => (
          <Card key={item.id} className="flex flex-col transition-all border-none shadow-sm bg-card hover:shadow-md">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className={cn("p-3 rounded-xl", item.bg)}>
                  <item.icon className={cn("h-8 w-8", item.color)} />
                </div>
                <Switch 
                  checked={item.status === "Connected"} 
                  onCheckedChange={() => handleToggle(item.id)}
                  disabled={loading === item.id}
                />
              </div>
              <CardTitle className="mt-4 text-lg">{item.name}</CardTitle>
              <CardDescription className="h-10 line-clamp-2 mt-2 text-xs">
                {item.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-4 flex-1">
               {item.status === "Connected" ? (
                 <div className="flex items-center gap-2 text-[11px] text-green-600 bg-green-500/5 p-2 rounded-md border border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-black uppercase tracking-widest">Active</span>
                    <span className="text-green-600/60 ml-auto font-medium">
                        {item.lastSync}
                    </span>
                 </div>
               ) : (
                 <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 p-2 rounded-md border border-muted">
                    <Power className="h-4 w-4" />
                    <span className="font-black uppercase tracking-widest">Disconnected</span>
                 </div>
               )}
            </CardContent>

            <CardFooter className="pt-0 border-t bg-muted/20 p-4">
                <div className="w-full flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    <span className="truncate max-w-[150px]">
                        {item.status === "Connected" ? `Linked: ${item.connectedUser}` : "Not linked"}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 hover:bg-background shadow-none"
                      onClick={() => handleConfigure(item.id)}
                      disabled={loading === item.id}
                    >
                      {loading === item.id ? "..." : "Configure"}
                    </Button>
                </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Integrations