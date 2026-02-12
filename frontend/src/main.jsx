import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import providers
import { AuthProvider } from './contexts/AuthContext'
import { UserProvider } from './contexts/UserContext'
import { ThemeProvider } from './contexts/ThemeContext'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </UserProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
