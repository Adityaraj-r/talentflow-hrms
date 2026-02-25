import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, LogOut, Home, Shield } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-2 border-red-200 dark:border-red-900">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto bg-red-100 dark:bg-red-900 rounded-full p-6 w-fit">
            <div className="relative">
              <Shield className="h-16 w-16 text-red-600 dark:text-red-400" />
              <div className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">Access Denied</CardTitle>
            <CardDescription className="text-base mt-2">
              You don't have permission to access this resource
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Details */}
          <div className="bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Why am I seeing this?</h3>
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <p>• You attempted to access a page that requires different permissions</p>
                  <p>• Your current role: <span className="font-semibold capitalize">{user?.role || 'Unknown'}</span></p>
                  <p>• This area is restricted to authorized personnel only</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Session Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{user?.email || 'Not available'}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Role:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{user?.role || 'Not available'}</p>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Need Access?</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              If you believe you should have access to this page, please contact your system administrator 
              or HR department to request the necessary permissions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex-1 h-12 text-base font-medium border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/dashboard-redirect')}
              variant="outline"
              className="flex-1 h-12 text-base font-medium border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <Home className="h-5 w-5 mr-2" />
              Go to Dashboard
            </Button>
            <Button
              onClick={logout}
              variant="destructive"
              className="flex-1 h-12 text-base font-medium"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center pt-4 border-t dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Error Code: 403 - Forbidden | Session ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;
