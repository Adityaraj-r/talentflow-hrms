import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getMyPermissions, can } from '@/services/permissionService';
import { Loader2 } from 'lucide-react';

const ADMIN_ROLES = ['ADMIN', 'SUPER ADMIN'];

const RoleBasedRoute = ({ children, allowedRoles, requiredPermission }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const [permLoading, setPermLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  const userRoleStr = typeof user?.role === 'string'
    ? user.role
    : user?.role?.name || '';

  useEffect(() => {
    if (!requiredPermission || !user) return;


    if (ADMIN_ROLES.includes(userRoleStr.toUpperCase())) {
      setHasPermission(true);
      return;
    }

    const check = async () => {
      setPermLoading(true);
      try {
        const permissions = await getMyPermissions(userRoleStr);
        setHasPermission(can(permissions, requiredPermission.module, requiredPermission.action));
      } catch {
        setHasPermission(false);
      } finally {
        setPermLoading(false);
      }
    };

    check();
  }, [user, requiredPermission, userRoleStr]);

  // Loading states
  if (loading || permLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Verifying access...</p>
          <p className="text-sm text-gray-500">Checking your permissions</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Matrix check
  if (requiredPermission) {
    if (hasPermission === null) return null;
    return hasPermission ? children : <Navigate to="/unauthorized" replace />;
  }

  // Static role check
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = userRoleStr.toUpperCase();
    const normalized = allowedRoles.map(r => r.toUpperCase());

    if (!normalized.includes(userRole)) {
      if (userRole === 'SUPER ADMIN' && normalized.includes('ADMIN')) return children;
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default RoleBasedRoute;
