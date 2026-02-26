import { createContext, useContext, useState, useEffect } from 'react'
import adminService from '@/services/adminService'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // Safe localStorage parsing
    try {
      const cached = localStorage.getItem('systemSettings')
      if (cached && cached !== 'undefined' && cached !== 'null') {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.error('Failed to parse cached settings:', error)
      localStorage.removeItem('systemSettings') // Clear corrupted data
    }
    
    // Default settings
    return {
      companyName: 'HRMS',
      companyEmail: '',
      timezone: 'UTC',
      dateFormat: 'DD/MM/YYYY',
      currency: 'USD',
      language: 'en',
      enableEmailNotifications: true,
      enablePushNotifications: false,
      enableSMSNotifications: false,
      sessionTimeout: 30,
      requireMFA: false,
      passwordExpiryDays: 90,
    }
  })
  
  const [loading, setLoading] = useState(false)

  // Fetch settings only when authenticated
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('idToken')
    
    // Only fetch if user is logged in
    if (token) {
      fetchSettings()
    }
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const data = await adminService.getSettings()
      if (data && data.settings) {
        setSettings(data.settings)
        // Cache in localStorage
        localStorage.setItem('systemSettings', JSON.stringify(data.settings))
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      // Use cached settings on error
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings) => {
    try {
      setLoading(true)
      const data = await adminService.updateSettings(newSettings)
      if (data && data.settings) {
        setSettings(data.settings)
        // Update cache
        localStorage.setItem('systemSettings', JSON.stringify(data.settings))
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to update settings:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}