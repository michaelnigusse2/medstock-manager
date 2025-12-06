import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User } from '@/types/pharmacy';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = 'http://localhost:3000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pharmacy_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async (jwt: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setToken(null);
        localStorage.removeItem('pharmacy_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setToken(null);
      localStorage.removeItem('pharmacy_token');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        await fetchUser(token);
      }
      setIsLoading(false);
    };
    validateToken();
  }, [token, fetchUser]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const { token: newToken } = await response.json();
        setToken(newToken);
        localStorage.setItem('pharmacy_token', newToken);
        await fetchUser(newToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, [fetchUser]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pharmacy_token');
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'Admin',
    login,
    logout,
    isLoading,
  };

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper loading spinner component
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
