import React, { createContext, useContext, ReactNode } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { login, logout, register } from '../store/slices/authSlice';
import { User } from '../store/slices/authSlice';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string; mfaToken?: string }) => Promise<any>;
  logout: () => Promise<any>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const handleLogin = async (credentials: {
    email: string;
    password: string;
    mfaToken?: string;
  }) => {
    return dispatch(login(credentials) as any);
  };

  const handleLogout = async () => {
    return dispatch(logout() as any);
  };

  const handleRegister = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => {
    return dispatch(register(userData) as any);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};