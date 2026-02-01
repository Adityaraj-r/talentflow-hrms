import { useState } from "react"
import Sidebar from "../ui/Sidebar"
import Header from "../ui/Header"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useNavigate } from "react-router-dom"

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="w-full">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        userRole={user?.role}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content - Dynamically adjust margin based on sidebar state */}
      <div 
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${
          isCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <Header 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          user={user}
          theme={theme}
          toggleTheme={toggleTheme}
          onLogout={handleLogout}
        />
        
        <main className="w-full px-6">

          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
