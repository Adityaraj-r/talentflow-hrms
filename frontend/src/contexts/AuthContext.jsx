import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import apiClient from '@/services/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

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

  // Tokens are no longer handled here at all — the server sets them as
  // httpOnly cookies via Set-Cookie, which the browser stores and sends
  // automatically. JS can't read or write them, by design.
  const setAuthState = (userData) => {
    setUser(userData);
    setUserData(userData);
    setIsAuthenticated(true);
    // Only store role string — NOT full userData object (XSS risk).
    // This is fine to keep in localStorage: a role name isn't a credential.
    localStorage.setItem('userRole', typeof userData.role === 'string'
      ? userData.role
      : userData.role?.name || '');
  };

  const clearAuthState = () => {
    setUser(null);
    setUserData(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userRole');
  };

  // On mount: we attempt profile fetch with raw axios so a 401 response for guest
  // users on public pages does not trigger global forceLogout to /login.
  useEffect(() => {
    axios.get(`${API_BASE_URL}/auth/profile`, {
      withCredentials: true,
      headers: { "ngrok-skip-browser-warning": "true" }
    })
      .then((res) => {
        const userData = res.data?.data ?? res.data;
        if (userData && (userData.id || userData._id || userData.email)) {
          setUser(userData);
          setUserData(userData);
          setIsAuthenticated(true);
          localStorage.setItem('userRole', typeof userData.role === 'string'
            ? userData.role
            : userData.role?.name || '');
        } else {
          clearAuthState();
        }
      })
      .catch(() => {
        clearAuthState();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    // apiClient returns response.data → { success, message, data: { user } }
    // accessToken/refreshToken are no longer in the body — the server sets
    // them as httpOnly cookies directly on this response.
    const res = await apiClient.post('/auth/login', { email, password });

    const userData = res.data ?? res;
    setAuthState(userData);
    return { success: true, user: userData };
  };

  // refreshToken is sent automatically via its httpOnly cookie — nothing
  // for this function to read or pass along manually anymore.
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
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
