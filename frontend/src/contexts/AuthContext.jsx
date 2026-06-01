import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '@/services/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]                   = useState(null);
  const [userData, setUserData]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const setAuthState = (userData, token) => {
    setUser(userData);
    setUserData(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
    // Only store role string — NOT full userData object (XSS risk)
    localStorage.setItem('userRole', typeof userData.role === 'string'
      ? userData.role
      : userData.role?.name || '');
  };

  const clearAuthState = () => {
    setUser(null);
    setUserData(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  };

  // On mount: validate token by fetching profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    apiClient.get('/auth/profile')
      .then((res) => {
        // apiClient interceptor returns response.data
        // backend returns { success: true, data: { user object } }
        const userData = res.data ?? res;
        setUser(userData);
        setUserData(userData);
        setIsAuthenticated(true);
        localStorage.setItem('userRole', typeof userData.role === 'string'
          ? userData.role
          : userData.role?.name || '');
      })
      .catch(() => {
        clearAuthState();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    console.log('Auth login called', { email, password });
    // apiClient returns response.data → { success, token, data: { user } }
    const res = await apiClient.post('/auth/login', { email, password });
    console.log('Auth login response', res);

    // Backend shape: { success: true, token: "...", data: { id, email, role, ... } }
    const userData = res.data ?? res;
    const token    = res.token;

    if (!token) throw new Error('Login failed — no token received');

    setAuthState(userData, token);
    return { success: true, user: userData };
  };

  const logout = () => {
    clearAuthState();
    window.location.href = '/login';
  };

  // userRole derived from user — never stale
  const userRole = user
    ? (typeof user.role === 'string' ? user.role : user.role?.name || '')
    : null;

  const value = {
    user,
    userRole,          // derived, always in sync with user
    userData,
    loading,
    isAuthenticated,
    currentUser: user, // alias for backward compatibility
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
