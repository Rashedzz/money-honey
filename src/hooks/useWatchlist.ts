import { useState, useEffect, useCallback } from 'react';

const WATCHLIST_STORAGE_KEY = 'money_honey_interested_stocks';
const DEFAULT_INTERESTED_STOCKS = ['GP', 'SQURPHARMA', 'BATBC', 'BRACBANK'];

export interface WatchlistHook {
  interestedSymbols: string[];
  isInterested: (symbol: string) => boolean;
  toggleInterested: (symbol: string) => void;
  addInterested: (symbol: string) => void;
  removeInterested: (symbol: string) => void;
  clearWatchlist: () => void;
}

export const useWatchlist = (): WatchlistHook => {
  const [interestedSymbols, setInterestedSymbols] = useState<string[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setInterestedSymbols(parsed);
            return;
          }
        }
        // First launch fallback: seed default high-conviction DSE blue chips
        setInterestedSymbols(DEFAULT_INTERESTED_STOCKS);
        window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(DEFAULT_INTERESTED_STOCKS));
      } else {
        setInterestedSymbols(DEFAULT_INTERESTED_STOCKS);
      }
    } catch (e) {
      console.warn('Failed to load interested stocks:', e);
      setInterestedSymbols(DEFAULT_INTERESTED_STOCKS);
    }
  }, []);

  // Save changes to local storage
  const persistSymbols = (symbols: string[]) => {
    setInterestedSymbols(symbols);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(symbols));
      }
    } catch (e) {
      console.warn('Failed to save interested stocks:', e);
    }
  };

  const isInterested = useCallback(
    (symbol: string): boolean => {
      const clean = symbol.trim().toUpperCase();
      return interestedSymbols.includes(clean);
    },
    [interestedSymbols]
  );

  const toggleInterested = useCallback(
    (symbol: string) => {
      const clean = symbol.trim().toUpperCase();
      if (interestedSymbols.includes(clean)) {
        persistSymbols(interestedSymbols.filter((s) => s !== clean));
      } else {
        persistSymbols([clean, ...interestedSymbols]);
      }
    },
    [interestedSymbols]
  );

  const addInterested = useCallback(
    (symbol: string) => {
      const clean = symbol.trim().toUpperCase();
      if (!interestedSymbols.includes(clean)) {
        persistSymbols([clean, ...interestedSymbols]);
      }
    },
    [interestedSymbols]
  );

  const removeInterested = useCallback(
    (symbol: string) => {
      const clean = symbol.trim().toUpperCase();
      persistSymbols(interestedSymbols.filter((s) => s !== clean));
    },
    [interestedSymbols]
  );

  const clearWatchlist = useCallback(() => {
    persistSymbols([]);
  }, []);

  return {
    interestedSymbols,
    isInterested,
    toggleInterested,
    addInterested,
    removeInterested,
    clearWatchlist,
  };
};
