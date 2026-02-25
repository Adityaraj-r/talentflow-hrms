"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState,useRef } from "react"
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
  Search, 
  X, 
  Briefcase,Layout, Users, UserPlus, Repeat, Folder, FileText,ShieldCheck,
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

  // --- OMNIBAR SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState({ modules: [], users: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef(null)
  const inputRef = useRef(null)

 const APP_MODULES = [
    { id: 'mod-1', title: 'Admin Dashboard', path: '/admin/dashboard', icon: Layout },
    { id: 'mod-2', title: 'User Management (All Employees)', path: '/dashboard/users', icon: Users },
    { id: 'mod-3', title: 'Onboarding & KYC', path: '/onboarding', icon: UserPlus },
    { id: 'mod-4', title: 'Transfers & Promotions', path: '/employee-transfer', icon: Repeat },
    { id: 'mod-5', title: 'Digital Locker (Docs)', path: '/digital-locker', icon: Folder },
    { id: 'mod-6', title: 'Staff Requisition', path: '/staff-requisition', icon: FileText },
    { id: 'mod-7', title: 'System Settings', path: '/settings', icon: Settings },
    { id: 'mod-8', title: 'Roles & Permissions', path: '/roles', icon: ShieldCheck },
    { id: 'mod-9', title: 'Company Structure', path: '/structure', icon: Layout }
  ];

  const handleNavigation = (path) => {
    setShowDropdown(false);
    setSearchQuery('');
    navigate(path);
  };

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // HYBRID SEARCH API CALL
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ modules: [], users: [] })
      setShowDropdown(false)
      return
    }

    const fetchResults = async () => {
      setIsSearching(true)
      try {
        const queryLower = searchQuery.toLowerCase();
        
        // A. Search Static App Modules locally
        const matchedModules = APP_MODULES.filter(mod => 
          mod.title.toLowerCase().includes(queryLower)
        );

        // B. Search Employees via Backend API
        const token = localStorage.getItem('token')
        const response = await axios.get(`http://localhost:5001/api/admin/users?search=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        // C. Combine results!
        setResults({
          modules: matchedModules.slice(0, 3), // Show top 3 matching pages
          users: response.data.data.slice(0, 4) // Show top 4 matching employees
        }) 
        setShowDropdown(true)
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setIsSearching(false)
      }
    }
    const debounceTimer = setTimeout(fetchResults, 300) 
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const ALLOWED_SEARCH_ROLES = [
    'ADMIN', 
    'CEO', 
    'HR_MANAGER', 
    'COUNTRY_MANAGER', 
    'DEPARTMENT_MANAGER'
  ];

  const userRole = user?.role?.name || user?.role || '';
  const canUseSearch = ALLOWED_SEARCH_ROLES.includes(userRole);

  useEffect(() => {
    // SECURITY: If the user doesn't have permission, do not attach the event listener!
    if (!canUseSearch) return; 

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [canUseSearch])

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

      {/* --- OMNIBAR SEARCH UI (CONDITIONALLY RENDERED) --- */}
      {canUseSearch && (
        <div className="hidden md:flex flex-1 max-w-md mx-6 relative" ref={searchRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            
            <input
              ref={inputRef}
              type="text"
              placeholder="Search employees, emails, or roles..."
              className="w-full h-9 pl-10 pr-16 rounded-full border bg-muted/30 focus:bg-muted/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowDropdown(true)}
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button onClick={() => {setSearchQuery(''); setResults({ modules: [], users: [] });}} className="p-1 hover:bg-muted rounded-full transition-colors">
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground bg-background px-1.5 py-0.5 rounded border shadow-sm">
                  Ctrl K
                </span>
              )}
            </div>

            {/* Floating Dropdown Results Menu */}
            {showDropdown && (
              <div className="absolute top-full mt-2 w-full bg-card border rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 max-h-[400px] overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Searching system...</div>
                ) : (results.modules.length > 0 || results.users.length > 0) ? (
                  <div className="py-2">
                    
                    {/* --- RENDER MATCHING MODULES/PAGES --- */}
                    {results.modules.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase bg-muted/30">System Pages</div>
                        <ul>
                          {results.modules.map(mod => {
                            const Icon = mod.icon;
                            return (
                              <li 
                                key={mod.id} 
                                onClick={() => handleNavigation(mod.path)} 
                                className="px-4 py-2.5 hover:bg-muted/50 cursor-pointer flex items-center gap-3 transition-colors group"
                              >
                                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium text-foreground">{mod.title}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {/* --- RENDER MATCHING EMPLOYEES --- */}
                    {results.users.length > 0 && (
                      <div>
                        <div className="px-4 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase bg-muted/30">Employees Directory</div>
                        <ul>
                          {results.users.map(u => (
                            <li 
                              key={u._id} 
                              onClick={() => handleNavigation(`/profile/${u._id}`)} 
                              className="px-4 py-2.5 hover:bg-muted/50 cursor-pointer flex items-center gap-3 transition-colors"
                            >
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 uppercase shrink-0">
                                {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-semibold text-foreground truncate">{u.firstName} {u.lastName}</span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                  <Briefcase className="h-3 w-3 shrink-0" /> 
                                  {u.role?.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                     <Search className="h-8 w-8 opacity-20" />
                     <p>No matches found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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