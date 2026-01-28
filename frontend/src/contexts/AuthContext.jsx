// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null); // For ProtectedRoute compatibility
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email, password) => {
    try {
      console.log('🔐 Starting login for:', email);
      
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase authentication successful');
      
      // 2. Get Firebase ID token
      const token = await firebaseUser.getIdToken();
      console.log('✅ Got Firebase token');
      
      // 3. Call backend to get user profile from MongoDB
      console.log('📡 Calling backend profile API...');
      const response = await fetch('http://localhost:5001/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Backend response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch user profile from backend');
      }
      
      const data = await response.json();
      console.log('✅ Profile data received:', data);
      
      // 4. Store user data
      setUserRole(data.data.role);
      setUserData(data.data);
      setUser(data.data);
      setIsAuthenticated(true);
      localStorage.setItem('userRole', data.data.role);
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(data.data));
      
      console.log('✅ Login successful! Role:', data.data.role);
      
      // Force page reload to dashboard - this bypasses Google's password prompt
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
      
      return { success: true, user: data.data };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUser(null);
      setUserRole(null);
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userRole');
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('token', token);
          
          const response = await fetch('http://localhost:5001/api/auth/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.data.role);
            setUserData(data.data);
            setUser(data.data);
            setIsAuthenticated(true);
            localStorage.setItem('userRole', data.data.role);
            localStorage.setItem('userData', JSON.stringify(data.data));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setIsAuthenticated(false);
        }
      } else {
        setUserRole(null);
        setUserData(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('userRole');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    user,
    userRole,
    userData,
    loading,
    isAuthenticated,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
