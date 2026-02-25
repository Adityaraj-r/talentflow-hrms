"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import axios from "axios"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {
  Bell,
  Menu,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  ChevronDown,
  ArrowLeft,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const fetchRealTimeNotifications = async () => {
      const firstName = user?.firstName || user?.name?.split(" ")[0] || ""
      
      if (firstName) {
        try {
          const res = await axios.get(`http://localhost:5001/api/transfers/all`)
          
          const myTransfers = res.data.filter((t) => t.employeeName && t.employeeName.includes(firstName))
          const latest = myTransfers[0]
          
          if (latest && (latest.status === "Approved" || latest.status === "Rejected")) {
            setNotifications([
              {
                id: latest._id,
                message: `Transfer to ${latest.newDepartment} has been ${latest.status}`,
                read: false,
                time: "Just now",
              },
            ])
          }
        } catch (err) {
          console.error("Failed to fetch notifications:", err)
        }
      }
    }

    fetchRealTimeNotifications()
    const interval = setInterval(fetchRealTimeNotifications, 10000)
    return () => clearInterval(interval)
  }, [user])

  const unreadCount = notifications.filter((n) => !n.read).length
  
  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }
  
  const canGoBack = !["/", "/dashboard", "/admin/dashboard", "/employee/dashboard"].includes(location.pathname)

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 transition-all duration-300 sm:px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
        {canGoBack && (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hidden sm:flex">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-bold text-foreground">HRMS System</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative focus:outline-none">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 px-1.5 py-0.5 text-[10px] flex h-4 min-w-4 items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto py-1 text-xs">
                  Mark all as read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-75 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn("flex cursor-pointer flex-col items-start p-3", !notification.read && "bg-muted/50")}
                  >
                    <span className="text-sm font-medium">{notification.message}</span>
                    <span className="text-xs text-muted-foreground mt-1">{notification.time}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="py-4 px-4 text-center text-sm text-muted-foreground">No notifications</div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {(user?.firstName || user?.name || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex text-left">
                <span className="text-sm font-medium leading-none">{user?.firstName || user?.name || "Admin"}</span>
                <span className="text-[10px] uppercase text-muted-foreground">
                  {user?.role?.name || user?.role || "Admin"}
                </span>
              </div>
              <ChevronDown className="hidden h-4 w-4 md:block text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex cursor-pointer items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex cursor-pointer items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Header