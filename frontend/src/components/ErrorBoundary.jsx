import React from 'react';
import { Button } from './ui/button';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                We apologize, but an unexpected error occurred while rendering this page. The issue has been logged.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => window.location.reload()} className="w-full gap-2">
                <RefreshCcw className="w-4 h-4" /> Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full gap-2">
                <Home className="w-4 h-4" /> Go to Dashboard
              </Button>
            </div>
            
            {true && (
              <div className="mt-6 text-left bg-slate-100 dark:bg-slate-950 p-4 rounded-lg overflow-x-auto text-xs font-mono text-red-600 dark:text-red-400">
                {this.state.error?.toString()}
                <br />
                {this.state.error?.stack}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
