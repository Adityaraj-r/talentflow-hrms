import { createContext, useContext, useState, useEffect } from 'react'
import apiClient from '@/services/apiClient'

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
      hrSmtpHost: '',
      hrSmtpPort: '',
      hrSmtpSecure: false,
      hrSmtpUser: '',
      hrSmtpPass: '',
      hrSmtpPassConfigured: false,
    }
  })
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('idToken');
    if (token) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [])

 const fetchSettings = async () => {
    try {
      setLoading(true)
      // Hit the new dedicated settings route directly
      const response = await apiClient.get('/settings/settings')
      
      // Safely unbox the data regardless of Axios interceptor setup
      const settingsData = response.data?.settings || response.settings || response.data || response
      
      if (settingsData && Object.keys(settingsData).length > 0) {
        setSettings(settingsData)
        localStorage.setItem('systemSettings', JSON.stringify(settingsData))
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

 const updateSettings = async (newSettings) => {
    try {
      setLoading(true)
     const response = await apiClient.put('/settings/settings', newSettings)
      const settingsData = response.data?.settings || response.settings || response.data || response
      
      if (settingsData) {
        setSettings(settingsData)
        localStorage.setItem('systemSettings', JSON.stringify(settingsData))
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