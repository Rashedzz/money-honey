import { useState, useEffect, useCallback } from 'react';
import {
  liveStockFeedService,
  LiveStockSummary,
  MarketExchange,
  MarketSessionInfo,
  getMarketSessionInfo,
} from '../services/liveStockFeedService';

export const useLiveStockFeed = (initialExchange: MarketExchange = 'ALL') => {
  const [exchange, setExchange] = useState<MarketExchange>(initialExchange);
  const [stocks, setStocks] = useState<LiveStockSummary[]>(() =>
    liveStockFeedService.getStocks(initialExchange)
  );
  const [session, setSession] = useState<MarketSessionInfo>(() => getMarketSessionInfo());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(() =>
    liveStockFeedService.getLastRefreshedAt()
  );

  const reloadData = useCallback(() => {
    setStocks(liveStockFeedService.getStocks(exchange));
    setSession(getMarketSessionInfo());
    setLastRefreshedAt(liveStockFeedService.getLastRefreshedAt());
  }, [exchange]);

  useEffect(() => {
    reloadData();
    const unsub = liveStockFeedService.subscribe(reloadData);

    // Auto-refresh from network on mount
    liveStockFeedService.refreshMarketData().then(() => {
      reloadData();
    });

    // Check market session every minute
    const interval = setInterval(() => {
      setSession(getMarketSessionInfo());
    }, 60000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [reloadData]);

  const refreshNow = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await liveStockFeedService.refreshMarketData();
      reloadData();
    } finally {
      setIsRefreshing(false);
    }
  }, [reloadData]);

  return {
    stocks,
    session,
    exchange,
    setExchange,
    isRefreshing,
    lastRefreshedAt,
    refreshNow,
  };
};
