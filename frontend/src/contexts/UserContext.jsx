import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getRoles } from '@/services/roleService'; // Import the service we made

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user } = useAuth();
  const [rolePermissions, setRolePermissions] = useState(null);

  // 1. Fetch the latest permissions matrix when the user loads
  useEffect(() => {
    const loadPermissions = async () => {
      if (user?.role) {
        try {
          // Get all roles to find the current user's specific permissions
          // In a larger app, you'd have an endpoint like /api/users/me/permissions
          const allRoles = await getRoles();
          
          // Handle case where user.role might be an object or string
          const userRoleName = typeof user.role === 'string' ? user.role : user.role.name;
          
          const myRole = allRoles.find(r => r.name === userRoleName);
          
          if (myRole && myRole.permissions) {
            setRolePermissions(myRole.permissions);
          }
        } catch (error) {
          console.error("Failed to load permissions", error);
        }
      }
    };

    loadPermissions();
  }, [user]);

  // 2. Helper function to check if user has access
  // Usage: can('recruitment', 'read')
  const can = (module, action = 'read') => {
    // Super Admins usually have bypass, but let's stick to the matrix
    if (!rolePermissions) return false; // fast fail if loading
    
    // Case insensitive safety
    if (user?.role === 'Super Admin' || user?.role === 'SUPER ADMIN') return true;

    const modulePerms = rolePermissions[module];
    if (!modulePerms) return false;

    return modulePerms[action] === true;
  };

  const enrichedUser = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      permissions: rolePermissions, // Attach permissions to user object
      can, // Attach the helper function
    };
  }, [user, rolePermissions]);

  return (
    <UserContext.Provider value={{ user: enrichedUser, loading: !rolePermissions && !!user }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export default UserContext;