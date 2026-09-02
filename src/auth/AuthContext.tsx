import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

export interface UserProfile {
  id: string;          // User ID or login handle
  name: string;        // Display Name
  email?: string;
  avatar?: string;
  createdAt: number;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  storageMode: 'local' | 'online_synced';
  login: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userId: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalVisible: boolean;
}

const USER_STORAGE_KEY = 'money_honey_user_session';
const USERS_DB_KEY = 'money_honey_registered_users';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Initialize session from local storage & monitor network
  useEffect(() => {
    // 1. Load active session from local device
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(USER_STORAGE_KEY);
        if (saved) {
          setUser(JSON.parse(saved));
        } else {
          // Default initial profile for immediate access
          const defaultUser: UserProfile = {
            id: 'rashed01',
            name: 'Rashed Rahman',
            avatar: '👨‍💼',
            createdAt: Date.now(),
          };
          setUser(defaultUser);
          window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultUser));
        }
      }
    } catch (e) {
      console.warn('Local session load error:', e);
    }

    // 2. Monitor online/offline availability
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setIsOnline(window.navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const login = async (userId: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanId = userId.trim().toLowerCase();
      if (!cleanId || !password) {
        return { success: false, error: 'User ID and Password are required.' };
      }

      // Check registered users in local storage
      let usersDb: Record<string, { profile: UserProfile; passwordHash: string }> = {};
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(USERS_DB_KEY);
        if (raw) usersDb = JSON.parse(raw);
      }

      // Allow master account if first time
      if (!usersDb[cleanId] && cleanId === 'rashed01') {
        const profile: UserProfile = {
          id: 'rashed01',
          name: 'Rashed Rahman',
          avatar: '👨‍💼',
          createdAt: Date.now(),
        };
        setUser(profile);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
        }
        setIsAuthModalVisible(false);
        return { success: true };
      }

      const match = usersDb[cleanId];
      if (!match) {
        return { success: false, error: 'User ID not found. Please register first.' };
      }

      // Simple hash match
      const inputHash = btoa(password);
      if (match.passwordHash !== inputHash) {
        return { success: false, error: 'Incorrect Password. Please try again.' };
      }

      setUser(match.profile);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(match.profile));
      }
      setIsAuthModalVisible(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const register = async (userId: string, name: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanId = userId.trim().toLowerCase();
      const cleanName = name.trim();
      if (!cleanId || !cleanName || !password) {
        return { success: false, error: 'All fields (User ID, Name, Password) are required.' };
      }
      if (password.length < 4) {
        return { success: false, error: 'Password must be at least 4 characters.' };
      }

      let usersDb: Record<string, { profile: UserProfile; passwordHash: string }> = {};
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(USERS_DB_KEY);
        if (raw) usersDb = JSON.parse(raw);
      }

      if (usersDb[cleanId]) {
        return { success: false, error: 'User ID is already registered. Please login.' };
      }

      const newProfile: UserProfile = {
        id: cleanId,
        name: cleanName,
        avatar: '👨‍💼',
        createdAt: Date.now(),
      };

      usersDb[cleanId] = {
        profile: newProfile,
        passwordHash: btoa(password),
      };

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDb));
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newProfile));
      }

      setUser(newProfile);
      setIsAuthModalVisible(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
    setIsAuthModalVisible(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isOnline,
        storageMode: isOnline ? 'online_synced' : 'local',
        login,
        register,
        logout,
        openAuthModal: () => setIsAuthModalVisible(true),
        closeAuthModal: () => setIsAuthModalVisible(false),
        isAuthModalVisible,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
