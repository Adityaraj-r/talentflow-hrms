import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import providers
import { AuthProvider } from './contexts/AuthContext'
import { UserProvider } from './contexts/UserContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <UserProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </UserProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
)
