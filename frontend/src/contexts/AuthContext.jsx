import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const setAuthState = (userData, token) => {
    setUser(userData);
    setUserData(userData);
    setUserRole(userData.role);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const clearAuthState = () => {
    setUser(null);
    setUserData(null);
    setUserRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    fetch('http://localhost:5001/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((res) => {
        setUser(res.data);
        setUserData(res.data);
        setUserRole(res.data.role);
        setIsAuthenticated(true);
        localStorage.setItem('userRole', res.data.role);
        localStorage.setItem('userData', JSON.stringify(res.data));
      })
      .catch(() => clearAuthState())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    // Backend returns { success, token, data: { id, email, role, ... } }
    setAuthState(data.data, data.token);
    return { success: true, user: data.data };
  };

  const logout = () => {
    clearAuthState();
    window.location.href = '/login';
  };

  const value = {
    user,
    userRole,
    userData,
    loading,
    isAuthenticated,
    currentUser: user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
