import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user } = useAuth();
  
  const enrichedUser = {
    ...user,
    name: user?.name || user?.email?.split('@')[0] || 'User',
    employeeType: user?.employeeType || 'Full-Time',
  };
  
  return (
    <UserContext.Provider value={{ user: enrichedUser }}>
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
