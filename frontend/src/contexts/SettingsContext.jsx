import { createContext, useContext, useState, useEffect } from 'react'
import adminService from '../services/adminService'

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
    // Try to load from localStorage first (instant, no flash)
    const cached = localStorage.getItem('systemSettings')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (e) {
        return {
          companyName: 'HRMS',
          companyEmail: '',
          companyPhone: '',
          companyAddress: '',
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
          currency: 'INR',
          language: 'en',
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          weeklyReports: true,
          sessionTimeout: 30,
          passwordExpiry: 90,
          twoFactorAuth: false,
        }
      }
    }
    return {
      companyName: 'HRMS',
      companyEmail: '',
      companyPhone: '',
      companyAddress: '',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      currency: 'INR',
      language: 'en',
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      weeklyReports: true,
      sessionTimeout: 30,
      passwordExpiry: 90,
      twoFactorAuth: false,
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await adminService.getSettings()
      if (response.success && response.data) {
        setSettings(response.data)
        // Cache in localStorage for instant load next time
        localStorage.setItem('systemSettings', JSON.stringify(response.data))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update settings (call this after saving in SystemSettings)
  const refreshSettings = async () => {
    await loadSettings()
  }

  const value = {
    settings,
    isLoading,
    refreshSettings,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
