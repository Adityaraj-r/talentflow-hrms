import { useState } from "react"
import Sidebar from "../ui/Sidebar"
import Header from "../ui/Header"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useSettings } from "../../contexts/SettingsContext"
import { useNavigate } from "react-router-dom"

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        userRole={user?.role}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        companyName={settings.companyName}
      />

      <div 
        className={`flex h-full flex-1 flex-col bg-background transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:ml-20" : "lg:ml-72" 
        }`}
      >
        <Header
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          theme={theme}
          toggleTheme={toggleTheme}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout