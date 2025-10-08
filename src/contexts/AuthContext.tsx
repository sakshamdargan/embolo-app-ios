import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { User, RegistrationData } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegistrationData) => Promise<{ success: boolean; error?: string }>;
  requestLoginOTP: (username: string) => Promise<{ success: boolean; error?: string }>;
  requestRegisterOTP: (phone: string, email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = authService.getToken();
      const savedUser = authService.getCurrentUser();

      if (token && savedUser) {
        // Validate token with server
        const isValid = await authService.validateToken();
        if (isValid) {
          setUser(savedUser);
        } else {
          // Token invalid, clear storage
          authService.logout();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      authService.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, otp: string) => {
    try {
      const response = await authService.login(username, otp);
      if (response.success) {
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (data: RegistrationData) => {
    try {
      const response = await authService.register(data);
      if (response.success) {
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Registration failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const requestLoginOTP = async (username: string) => {
    try {
      const response = await authService.requestLoginOTP(username);
      return { success: response.success, error: response.success ? undefined : response.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const requestRegisterOTP = async (phone: string, email: string) => {
    try {
      const response = await authService.requestRegisterOTP(phone, email);
      return { success: response.success, error: response.success ? undefined : response.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const validateToken = async () => {
    try {
      return await authService.validateToken();
    } catch (error) {
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    requestLoginOTP,
    requestRegisterOTP,
    logout,
    validateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
