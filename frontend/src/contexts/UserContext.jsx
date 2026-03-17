import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "./AuthContext";
import apiClient from "../services/apiClient";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [rolePermissions, setRolePermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user?.role || !isAuthenticated) {
        setRolePermissions(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await apiClient.get("/roles");
        const roles = res.data ?? res;
        const roleName =
          typeof user.role === "string" ? user.role : user.role?.name;
        const matchedRole = roles.find(
          (r) =>
            r.name?.toLowerCase().replace(/\s+/g, "") ===
            roleName?.toLowerCase().replace(/\s+/g, "")
        );
        setRolePermissions(matchedRole?.permissions ?? {});
      } catch (err) {
        setRolePermissions({});
      } finally {
        setLoading(false);
      }
    };
    loadPermissions();
  }, [user?.role, isAuthenticated]); // FIXED: was [user] — caused stale closure on can()

  // FIXED: can() is inside useMemo so it always uses the current rolePermissions
  const enrichedUser = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      can: (module, action = "read") => {
        if (!rolePermissions) return false;
        // SUPER ADMIN bypasses all checks
        const roleName =
          typeof user.role === "string"
            ? user.role.toUpperCase()
            : user.role?.name?.toUpperCase();
        if (roleName === "SUPER ADMIN" || roleName === "SUPER_ADMIN")
          return true;
        return rolePermissions?.[module]?.[action] === true;
      },
    };
  }, [user, rolePermissions]);

  const value = {
    user: enrichedUser,
    userData: enrichedUser,
    currentUser: enrichedUser,
    loading: loading || !rolePermissions,
  };

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

export default UserContext;
