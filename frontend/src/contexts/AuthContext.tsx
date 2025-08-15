import { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/api";

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // In a real app, you'd verify the token with a /api/me endpoint.
        // For now, we'll just set the token and assume it's valid.
        // The user object could be populated from the token payload if needed.
        setToken(token);
      }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    const response = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      setIsLoading(false);
      throw new Error(data.error || 'Failed to login');
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    setIsLoading(false);
  };

  const register = async (email, username, password) => {
    setIsLoading(true);
    const response = await fetch(`${apiBase}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      setIsLoading(false);
      throw new Error(data.error || 'Failed to register');
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };


  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
