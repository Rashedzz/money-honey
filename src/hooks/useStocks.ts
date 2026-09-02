import { useState, useEffect } from 'react';
import { StockHolding, calculatePortfolioSummary } from '../finance/stocks';

const STOCKS_STORAGE_KEY = 'money_honey_user_stocks';

export const useStocks = () => {
  const [stocks, setStocks] = useState<StockHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load stocks on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STOCKS_STORAGE_KEY);
        if (raw) {
          setStocks(JSON.parse(raw));
        }
      }
    } catch (e) {
      console.warn('Error loading stocks:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save stocks to persistent local device storage
  const saveStocks = (newStocks: StockHolding[]) => {
    setStocks(newStocks);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(newStocks));
      }
    } catch (e) {
      console.warn('Error saving stocks:', e);
    }
  };

  const addStock = async (data: Omit<StockHolding, 'id' | 'createdAt'>) => {
    const newStock: StockHolding = {
      ...data,
      id: `stock_${Date.now()}`,
      createdAt: Date.now(),
    };
    const updated = [newStock, ...stocks];
    saveStocks(updated);
    return newStock;
  };

  const updateStockPrice = async (id: string, newPrice: number) => {
    const updated = stocks.map((s) => (s.id === id ? { ...s, currentPrice: newPrice } : s));
    saveStocks(updated);
  };

  const deleteStock = async (id: string) => {
    const updated = stocks.filter((s) => s.id !== id);
    saveStocks(updated);
  };

  const summary = calculatePortfolioSummary(stocks);

  return {
    stocks,
    summary,
    isLoading,
    addStock,
    updateStockPrice,
    deleteStock,
  };
};
