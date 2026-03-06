import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getRoles } from '@/services/roleService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user } = useAuth();
  const [rolePermissions, setRolePermissions] = useState(null);

  useEffect(() => {
    const loadPermissions = async () => {
      if (user?.role) {
        try {

          const allRoles = await getRoles();
          
          const userRoleName = typeof user.role === 'string' ? user.role : user.role.name;
          
          const normalize = (str) => str?.toLowerCase().replace(/[\s_]/g, '')
          const myRole = allRoles.find(r => normalize(r.name) === normalize(userRoleName))
          
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

  const can = (module, action = 'read') => {
    if (!rolePermissions) return false;
    
    if (user?.role === 'Super Admin' || user?.role === 'SUPER ADMIN') return true;

    const modulePerms = rolePermissions[module];
    if (!modulePerms) return false;

    return modulePerms[action] === true;
  };

  const enrichedUser = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      permissions: rolePermissions,
      can,
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