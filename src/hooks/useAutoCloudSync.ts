import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { FirebaseSyncService } from '../services/firebaseSync';

export interface CloudSyncState {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncStatus: 'synced' | 'syncing' | 'idle' | 'error';
  errorMessage?: string;
  syncNow: () => Promise<boolean>;
}

export function useAutoCloudSync(
  userId: string = 'rashed01',
  onDataHydrated?: () => void
): CloudSyncState {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('mh_last_cloud_sync_time');
        return saved ? new Date(saved) : null;
      }
    } catch (e) {}
    return null;
  });
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'idle' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const isSyncingRef = useRef(false);

  const performSync = useCallback(async (): Promise<boolean> => {
    if (isSyncingRef.current) return false;
    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncStatus('syncing');
    setErrorMessage(undefined);

    try {
      // 1. Pull latest data from cloud Firestore
      const res = await FirebaseSyncService.restoreAllFromFirebase(userId);
      const now = new Date();
      setLastSyncedAt(now);
      setSyncStatus('synced');

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('mh_last_cloud_sync_time', now.toISOString());
        }
      } catch (e) {}

      if (onDataHydrated) {
        onDataHydrated();
      }

      return res.success;
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err?.message || 'Sync failed');
      return false;
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  }, [userId, onDataHydrated]);

  // Initial Sync on Mount
  useEffect(() => {
    const timer = setTimeout(() => {
      performSync();
    }, 1500); // slight debounce on startup
    return () => clearTimeout(timer);
  }, [performSync]);

  // Sync on App Foreground / Window Focus (Cross-Device Refresh)
  useEffect(() => {
    // 1. Web Window Focus
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWindowFocus = () => {
        performSync();
      };
      window.addEventListener('focus', handleWindowFocus);
      return () => {
        window.removeEventListener('focus', handleWindowFocus);
      };
    }

    // 2. Native Mobile AppState Change
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        performSync();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [performSync]);

  return {
    isSyncing,
    lastSyncedAt,
    syncStatus,
    errorMessage,
    syncNow: performSync,
  };
}
