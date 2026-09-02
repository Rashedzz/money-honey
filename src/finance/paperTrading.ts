export interface PaperTradePosition {
  id: string;
  symbol: string;
  companyName: string;
  shares: number;
  buyPrice: number;
  currentPrice: number;
  buyDate: string;
  targetPrice?: number;
  stopLoss?: number;
}

export interface PaperTradeHistory {
  id: string;
  symbol: string;
  shares: number;
  buyPrice: number;
  sellPrice: number;
  profitOrLoss: number;
  returnPercent: number;
  closeDate: string;
}

export interface PaperPortfolioState {
  cashBalance: number;
  startingCapital: number;
  positions: PaperTradePosition[];
  tradeHistory: PaperTradeHistory[];
}

const STORAGE_KEY = 'mh_virtual_portfolio';
const DEFAULT_CAPITAL = 1000000; // ৳ 10 Lakhs Virtual Starting Capital

export function getStoredPaperPortfolio(): PaperPortfolioState {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {}
  return {
    cashBalance: DEFAULT_CAPITAL,
    startingCapital: DEFAULT_CAPITAL,
    positions: [],
    tradeHistory: [],
  };
}

export function saveStoredPaperPortfolio(state: PaperPortfolioState) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {}
}

export function buyPaperStock(
  portfolio: PaperPortfolioState,
  symbol: string,
  companyName: string,
  price: number,
  shares: number,
  targetPrice?: number,
  stopLoss?: number
): { success: boolean; error?: string; updated: PaperPortfolioState } {
  const cost = price * shares;
  if (cost > portfolio.cashBalance) {
    return { success: false, error: 'Insufficient virtual cash balance.', updated: portfolio };
  }

  const existingIdx = portfolio.positions.findIndex((p) => p.symbol === symbol);
  let updatedPositions = [...portfolio.positions];

  if (existingIdx >= 0) {
    const existing = updatedPositions[existingIdx];
    const totalShares = existing.shares + shares;
    const avgBuyPrice = (existing.buyPrice * existing.shares + cost) / totalShares;

    updatedPositions[existingIdx] = {
      ...existing,
      shares: totalShares,
      buyPrice: avgBuyPrice,
      currentPrice: price,
      targetPrice: targetPrice || existing.targetPrice,
      stopLoss: stopLoss || existing.stopLoss,
    };
  } else {
    const newPos: PaperTradePosition = {
      id: `PT-${Date.now()}`,
      symbol,
      companyName,
      shares,
      buyPrice: price,
      currentPrice: price,
      buyDate: new Date().toISOString().slice(0, 10),
      targetPrice,
      stopLoss,
    };
    updatedPositions = [newPos, ...updatedPositions];
  }

  const updated: PaperPortfolioState = {
    ...portfolio,
    cashBalance: portfolio.cashBalance - cost,
    positions: updatedPositions,
  };

  saveStoredPaperPortfolio(updated);
  return { success: true, updated };
}

export function sellPaperStock(
  portfolio: PaperPortfolioState,
  positionId: string,
  sellPrice: number
): { success: boolean; error?: string; updated: PaperPortfolioState } {
  const pos = portfolio.positions.find((p) => p.id === positionId);
  if (!pos) return { success: false, error: 'Position not found.', updated: portfolio };

  const proceeds = pos.shares * sellPrice;
  const pnl = proceeds - pos.shares * pos.buyPrice;
  const retPct = ((sellPrice - pos.buyPrice) / pos.buyPrice) * 100;

  const historyItem: PaperTradeHistory = {
    id: `PTH-${Date.now()}`,
    symbol: pos.symbol,
    shares: pos.shares,
    buyPrice: pos.buyPrice,
    sellPrice,
    profitOrLoss: pnl,
    returnPercent: retPct,
    closeDate: new Date().toISOString().slice(0, 10),
  };

  const updated: PaperPortfolioState = {
    ...portfolio,
    cashBalance: portfolio.cashBalance + proceeds,
    positions: portfolio.positions.filter((p) => p.id !== positionId),
    tradeHistory: [historyItem, ...portfolio.tradeHistory],
  };

  saveStoredPaperPortfolio(updated);
  return { success: true, updated };
}

export function resetPaperPortfolio(): PaperPortfolioState {
  const resetState: PaperPortfolioState = {
    cashBalance: DEFAULT_CAPITAL,
    startingCapital: DEFAULT_CAPITAL,
    positions: [],
    tradeHistory: [],
  };
  saveStoredPaperPortfolio(resetState);
  return resetState;
}
