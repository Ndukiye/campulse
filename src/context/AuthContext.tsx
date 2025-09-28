import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  email: string;
  name?: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  signUp: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

// Simple mock users for development - replace with real backend later
const MOCK_USERS = [
  { id: '1', email: 'test@campulse.com', password: 'password123', name: 'Test User' },
  { id: '2', email: 'demo@campulse.com', password: 'demo123', name: 'Demo User' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    checkStoredSession();
  }, []);

  const checkStoredSession = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('campulse_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error checking stored session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Simple mock authentication - replace with real backend
      const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        return { error: 'Invalid email or password' };
      }

      const userData = { id: foundUser.id, email: foundUser.email, name: foundUser.name };
      setUser(userData);
      await AsyncStorage.setItem('campulse_user', JSON.stringify(userData));
      
      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('campulse_user');
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // Simple mock registration - replace with real backend
      const existingUser = MOCK_USERS.find(u => u.email === email);
      
      if (existingUser) {
        return { error: 'User with this email already exists' };
      }

      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' };
      }

      // In a real app, you'd create the user in your backend
      const newUser = { 
        id: Date.now().toString(), 
        email, 
        name: name || 'New User' 
      };
      
      setUser(newUser);
      await AsyncStorage.setItem('campulse_user', JSON.stringify(newUser));
      
      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 