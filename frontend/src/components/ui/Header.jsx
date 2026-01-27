"use client"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Bell, Menu, Sun, Moon, User, LogOut, Settings, ChevronDown, ArrowLeft } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const Header = ({ toggleSidebar, user, theme, toggleTheme, onLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New leave request from John Doe", read: false },
    { id: 2, message: "Staff requisition approved", read: false },
    { id: 3, message: "Payroll processing complete", read: true },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  // Check if we can go back (not on home/dashboard)
  const canGoBack = location.pathname !== "/" && 
                    location.pathname !== "/dashboard" && 
                    location.pathname !== "/admin/dashboard" && 
                    location.pathname !== "/employee/dashboard"

  return (
    <header 
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between h-16 px-4 sm:px-6 border-b bg-white dark:bg-gray-800 dark:border-gray-700 transition-all duration-300"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Mobile Menu Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="lg:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        {/* Back Button - Shows when not on main dashboards */}
        {canGoBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hidden sm:flex"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        {/* HRMS Title - Hidden on mobile to avoid overlap */}
        <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
          HRMS System
        </h1>
        
        {/* Mobile-only simplified title */}
        <h1 className="text-lg font-bold text-gray-800 dark:text-white sm:hidden">
          HRMS
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Back Button Mobile - Shows on mobile when applicable */}
        {canGoBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="sm:hidden"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  Mark all as read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start",
                    !notification.read && "bg-muted/50"
                  )}
                >
                  <span className="text-sm">{notification.message}</span>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="py-2 px-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/notifications" className="w-full text-center text-sm">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={user?.profileImage || "/placeholder.svg"} 
                  alt={user?.name || user?.firstName || 'User'} 
                />
                <AvatarFallback>
                  {(user?.name || user?.firstName || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex md:flex-col md:items-start">
                <span className="text-sm font-medium">
                  {user?.firstName || user?.name || 'User'}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {user?.role?.toLowerCase() || 'Employee'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600">
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
