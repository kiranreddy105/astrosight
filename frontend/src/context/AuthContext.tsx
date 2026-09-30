import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthTokenResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register' | 'reset';
  accountModalOpen: boolean;
  openAuthModal: (tab?: 'login' | 'register' | 'reset') => void;
  closeAuthModal: () => void;
  openAccountModal: () => void;
  closeAccountModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, planetPreference: 'Moon' | 'Mars') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (fullName?: string, planetPreference?: 'Moon' | 'Mars') => Promise<UserProfile>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'astrosight_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'reset'>('login');
  const [accountModalOpen, setAccountModalOpen] = useState<boolean>(false);

  // Initialize API auth token and fetch profile on startup
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        api.setAuthToken(storedToken);
        setToken(storedToken);
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err) {
          console.warn('Session expired or invalid, logging out:', err);
          localStorage.removeItem(TOKEN_KEY);
          api.setAuthToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const openAuthModal = (tab: 'login' | 'register' | 'reset' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const openAccountModal = () => {
    setAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    setAccountModalOpen(false);
  };

  const login = async (email: string, password: string) => {
    const res: AuthTokenResponse = await api.login({ email, password });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    api.setAuthToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    closeAuthModal();
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    planetPreference: 'Moon' | 'Mars'
  ) => {
    const res: AuthTokenResponse = await api.register({
      email,
      password,
      full_name: fullName,
      planet_preference: planetPreference
    });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    api.setAuthToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    closeAuthModal();
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      api.setAuthToken(null);
      setToken(null);
      setUser(null);
      setAccountModalOpen(false);
    }
  };

  const updateProfile = async (fullName?: string, planetPreference?: 'Moon' | 'Mars') => {
    const updated = await api.updateProfile({ full_name: fullName, planet_preference: planetPreference });
    setUser(updated);
    return updated;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.changePassword({ current_password: currentPassword, new_password: newPassword });
  };

  const deleteAccount = async () => {
    await api.deleteAccount();
    localStorage.removeItem(TOKEN_KEY);
    api.setAuthToken(null);
    setToken(null);
    setUser(null);
    setAccountModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        authModalOpen,
        authModalTab,
        accountModalOpen,
        openAuthModal,
        closeAuthModal,
        openAccountModal,
        closeAccountModal,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
