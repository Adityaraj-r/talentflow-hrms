import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "@/components/ui/Sidebar"
import Header from "@/components/ui/Header"

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [companyName, setCompanyName] = useState("")

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const cached = localStorage.getItem("companyName")
        if (cached) setCompanyName(cached)

        const { data } = await axios.get("http://localhost:5001/api/settings/company-info")
        if (data.success && data.companyName) {
          setCompanyName(data.companyName)
          localStorage.setItem("companyName", data.companyName)
        }
      } catch (error) {
        if (!companyName) setCompanyName("HRMS System")
      }
    }
    fetchSettings()
  }, [])

  return (
    <div className="min-h-screen bg-muted/10">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        companyName={companyName}
      />

      <div 
        className={`
          flex flex-col min-h-screen transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}
        `}
      >
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6">
           {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout