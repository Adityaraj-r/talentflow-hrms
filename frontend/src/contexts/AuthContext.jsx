import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

  const setAuthState = (userData, accessToken, refreshToken) => {
    setUser(userData);
    setUserData(userData);
    setIsAuthenticated(true);
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    // Only store role string — NOT full userData object (XSS risk)
    localStorage.setItem('userRole', typeof userData.role === 'string'
      ? userData.role
      : userData.role?.name || '');
  };

  const clearAuthState = () => {
    setUser(null);
    setUserData(null);
    setIsAuthenticated(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
  };

  // On mount: validate token by fetching profile
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
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
    // apiClient returns response.data → { success, token, accessToken, refreshToken, data: { user } }
    const res = await apiClient.post('/auth/login', { email, password });

    const userData     = res.data ?? res;
    const accessToken  = res.accessToken;
    const refreshToken = res.refreshToken;

    if (!accessToken) throw new Error('Login failed — no access token received');

    setAuthState(userData, accessToken, refreshToken);
    return { success: true, user: userData };
  };

  // Now revokes the refresh token server-side before clearing local state,
  // so a "logged out" session can't still be used to mint new access tokens.
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      // Don't block the user from leaving just because the revoke call failed
      console.error('Logout revoke failed:', err);
    } finally {
      clearAuthState();
      window.location.href = '/login';
    }
  }, []);

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
