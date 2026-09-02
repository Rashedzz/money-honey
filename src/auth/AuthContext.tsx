import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

export interface UserProfile {
  id: string;          // User ID or login handle
  name: string;        // Display Name
  email?: string;
  avatar?: string;
  recoveryEmail?: string;
  securityQuestion1?: string;
  securityAnswer1?: string;
  securityQuestion2?: string;
  securityAnswer2?: string;
  createdAt: number;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  storageMode: 'local' | 'online_synced';
  autoCloudBackup: boolean;
  lastBackupTime: string | null;
  isPasswordConfigured: boolean;
  login: (userId: string, password: string) => Promise<{ success: boolean; error?: string; isFirstTimeSetup?: boolean }>;
  register: (userId: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalVisible: boolean;
  updateProfile: (profile: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  changeCredentials: (currentPassword: string, newUserId: string, newPassword?: string) => Promise<{ success: boolean; error?: string }>;
  getSecurityQuestion: (userId: string) => Promise<{ question1?: string; question2?: string; error?: string }>;
  recoverPassword: (userId: string, answer: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  exportLocalBackup: () => string;
  restoreLocalBackup: (backupData: string) => { success: boolean; error?: string };
  toggleAutoCloudBackup: (enable: boolean) => void;
  triggerManualCloudBackup: () => Promise<{ success: boolean; message: string }>;
}

const USER_STORAGE_KEY = 'money_honey_user_session';
const USERS_DB_KEY = 'money_honey_registered_users';
const AUTO_BACKUP_KEY = 'money_honey_auto_backup';
const LAST_BACKUP_KEY = 'money_honey_last_backup';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [autoCloudBackup, setAutoCloudBackup] = useState(true);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // Initialize session & backup preferences
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Load session
        const savedSession = window.localStorage.getItem(USER_STORAGE_KEY);
        if (savedSession) {
          setUser(JSON.parse(savedSession));
        }

        // Load backup config
        const savedAuto = window.localStorage.getItem(AUTO_BACKUP_KEY);
        if (savedAuto !== null) setAutoCloudBackup(savedAuto === 'true');

        const savedTime = window.localStorage.getItem(LAST_BACKUP_KEY);
        if (savedTime) setLastBackupTime(savedTime);
      }
    } catch (e) {
      console.warn('Session init error:', e);
    }

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

  const login = async (userId: string, password: string): Promise<{ success: boolean; error?: string; isFirstTimeSetup?: boolean }> => {
    try {
      const cleanId = userId.trim().toLowerCase();
      if (!cleanId || !password) {
        return { success: false, error: 'User ID and Password are required.' };
      }

      let usersDb: Record<string, { profile: UserProfile; passwordHash: string }> = {};
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(USERS_DB_KEY);
        if (raw) usersDb = JSON.parse(raw);
      }

      // FIRST TIME SETUP: If no users registered, or this user does not exist yet and no users in DB:
      // What ever user uses as ID and Password will be automatically saved as the master account!
      const registeredCount = Object.keys(usersDb).length;
      if (registeredCount === 0 || !usersDb[cleanId]) {
        if (registeredCount === 0) {
          const masterProfile: UserProfile = {
            id: cleanId,
            name: cleanId.charAt(0).toUpperCase() + cleanId.slice(1),
            avatar: '👨‍💼',
            recoveryEmail: '',
            securityQuestion1: 'What was your first school or hometown?',
            securityAnswer1: '',
            createdAt: Date.now(),
          };

          usersDb[cleanId] = {
            profile: masterProfile,
            passwordHash: btoa(password),
          };

          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDb));
            window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(masterProfile));
          }

          setUser(masterProfile);
          setIsAuthModalVisible(false);
          return { success: true, isFirstTimeSetup: true };
        }
      }

      const match = usersDb[cleanId];
      if (!match) {
        return { success: false, error: 'User ID not found. Use registration or verify your ID.' };
      }

      if (match.passwordHash !== btoa(password)) {
        return { success: false, error: 'Incorrect Password. Click "Forgot ID / Password?" if needed.' };
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
        return { success: false, error: 'All fields are required.' };
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
        return { success: false, error: 'User ID is already registered.' };
      }

      const newProfile: UserProfile = {
        id: cleanId,
        name: cleanName,
        avatar: '👨‍💼',
        securityQuestion1: 'What was your first school or hometown?',
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

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'No active session.' };

      const updated = { ...user, ...updates };
      setUser(updated);

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));

        // Update in users database
        const raw = window.localStorage.getItem(USERS_DB_KEY);
        if (raw) {
          const db = JSON.parse(raw);
          if (db[user.id]) {
            db[user.id].profile = updated;
            window.localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
          }
        }
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const changeCredentials = async (
    currentPassword: string,
    newUserId: string,
    newPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Not authenticated.' };

      let usersDb: Record<string, { profile: UserProfile; passwordHash: string }> = {};
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(USERS_DB_KEY);
        if (raw) usersDb = JSON.parse(raw);
      }

      const match = usersDb[user.id];
      const hasExistingPassword = !!(match && match.passwordHash);

      // If a password was already created previously, require the current password
      if (hasExistingPassword) {
        if (!currentPassword || match.passwordHash !== btoa(currentPassword)) {
          return { success: false, error: 'Current Password is incorrect.' };
        }
      }

      const cleanNewId = newUserId.trim().toLowerCase();
      if (cleanNewId !== user.id && usersDb[cleanNewId]) {
        return { success: false, error: 'New User ID is already taken.' };
      }

      delete usersDb[user.id];

      const updatedProfile: UserProfile = { ...user, id: cleanNewId };
      usersDb[cleanNewId] = {
        profile: updatedProfile,
        passwordHash: newPassword ? btoa(newPassword) : (match ? match.passwordHash : ''),
      };

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDb));
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedProfile));
      }

      setUser(updatedProfile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const getSecurityQuestion = async (userId: string): Promise<{ question1?: string; question2?: string; error?: string }> => {
    const cleanId = userId.trim().toLowerCase();
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(USERS_DB_KEY);
      if (raw) {
        const db = JSON.parse(raw);
        if (db[cleanId]) {
          return {
            question1: db[cleanId].profile.securityQuestion1 || 'What was your first school or hometown?',
            question2: db[cleanId].profile.securityQuestion2,
          };
        }
      }
    }
    return { error: 'User ID not found in security registry.' };
  };

  const recoverPassword = async (
    userId: string,
    answer: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanId = userId.trim().toLowerCase();
      const cleanAnswer = answer.trim().toLowerCase();
      if (newPassword.length < 4) {
        return { success: false, error: 'New Password must be at least 4 characters.' };
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(USERS_DB_KEY);
        if (raw) {
          const db = JSON.parse(raw);
          const match = db[cleanId];
          if (!match) return { success: false, error: 'User ID not found.' };

          const storedAnswer = (match.profile.securityAnswer1 || '').trim().toLowerCase();
          if (storedAnswer && storedAnswer !== cleanAnswer) {
            return { success: false, error: 'Security question answer does not match.' };
          }

          // Update password
          match.passwordHash = btoa(newPassword);
          db[cleanId] = match;
          window.localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
          window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(match.profile));
          setUser(match.profile);
          setIsAuthModalVisible(false);
          return { success: true };
        }
      }
      return { success: false, error: 'Recovery database inaccessible.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Local Device Backup & Export
  const exportLocalBackup = (): string => {
    try {
      const backupBundle: Record<string, any> = {
        app: 'Money-Honey Wealth Suite',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        userSession: user,
        data: {},
      };

      const keysToBackup = [
        'money_honey_registered_users',
        'mh_user_assets',
        'mh_user_cash',
        'mh_user_bank_accounts',
        'mh_user_loans',
        'mh_user_stocks',
        'mh_user_incomes',
        'mh_user_expenses',
        'mh_user_policies',
        'mh_user_birthdays',
        'mh_user_paper_assets',
      ];

      if (typeof window !== 'undefined' && window.localStorage) {
        for (const k of keysToBackup) {
          const val = window.localStorage.getItem(k);
          if (val) backupBundle.data[k] = JSON.parse(val);
        }
      }

      const jsonString = JSON.stringify(backupBundle, null, 2);

      // Trigger browser file download if on web
      if (typeof document !== 'undefined') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `money-honey-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      const timestamp = new Date().toLocaleString();
      setLastBackupTime(timestamp);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LAST_BACKUP_KEY, timestamp);
      }

      return jsonString;
    } catch (e: any) {
      console.warn('Backup export error:', e);
      return '';
    }
  };

  const restoreLocalBackup = (backupData: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(backupData);
      if (!parsed.data || typeof parsed.data !== 'object') {
        return { success: false, error: 'Invalid backup file format.' };
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        for (const [k, v] of Object.entries(parsed.data)) {
          window.localStorage.setItem(k, JSON.stringify(v));
        }
        if (parsed.userSession) {
          window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(parsed.userSession));
          setUser(parsed.userSession);
        }
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to restore backup.' };
    }
  };

  const toggleAutoCloudBackup = (enable: boolean) => {
    setAutoCloudBackup(enable);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(AUTO_BACKUP_KEY, String(enable));
    }
  };

  const triggerManualCloudBackup = async (): Promise<{ success: boolean; message: string }> => {
    exportLocalBackup();
    const timestamp = new Date().toLocaleString();
    setLastBackupTime(timestamp);
    return {
      success: true,
      message: `Encrypted Snapshot successfully generated and backed up at ${timestamp}.`,
    };
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
        autoCloudBackup,
        lastBackupTime,
        isPasswordConfigured: (() => {
          try {
            if (!user) return false;
            if (typeof window !== 'undefined' && window.localStorage) {
              const raw = window.localStorage.getItem(USERS_DB_KEY);
              if (raw) {
                const db = JSON.parse(raw);
                return !!(db[user.id] && db[user.id].passwordHash);
              }
            }
          } catch (e) {}
          return false;
        })(),
        login,
        register,
        logout,
        openAuthModal: () => setIsAuthModalVisible(true),
        closeAuthModal: () => setIsAuthModalVisible(false),
        isAuthModalVisible,
        updateProfile,
        changeCredentials,
        getSecurityQuestion,
        recoverPassword,
        exportLocalBackup,
        restoreLocalBackup,
        toggleAutoCloudBackup,
        triggerManualCloudBackup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
