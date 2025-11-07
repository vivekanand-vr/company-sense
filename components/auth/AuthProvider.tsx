"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthState, LoginCredentials } from '@/types/auth';
import { 
  login as apiLogin, 
  logout as apiLogout, 
  verifyToken, 
  getStoredToken, 
  getStoredUser,
  clearStoredAuth 
} from '@/lib/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  // Initialize auth state from storage
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken || !storedUser) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
        });
        return;
      }

      // Verify token with backend
      const verifyResponse = await verifyToken();
      
      if (verifyResponse.success) {
        setAuthState({
          isAuthenticated: true,
          user: verifyResponse.data.user,
          token: storedToken,
          loading: false,
        });
      } else {
        // Token is invalid, clear storage
        clearStoredAuth();
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
        });
      }
    } catch (error) {
      // Verification failed, clear auth
      clearStoredAuth();
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const response = await apiLogin(credentials);
      
      if (response.success) {
        setAuthState({
          isAuthenticated: true,
          user: response.data.user,
          token: response.data.token,
          loading: false,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      });
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}