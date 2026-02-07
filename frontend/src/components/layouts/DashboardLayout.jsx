import { useState } from "react"
import Sidebar from "../ui/Sidebar"
import Header from "../ui/Header"

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="min-h-screen bg-muted/10">
      {/* 1. Sidebar (Fixed Left) */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* 2. Main Content Wrapper*/}
      <div 
        className={`
          flex flex-col min-h-screen transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}
        `}
      >
        {/* 3. Header (Sticky Top) */}
        <Header toggleSidebar={toggleSidebar} />

        {/* 4. Page Content */}
        <main className="flex-1 p-6">
           {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout