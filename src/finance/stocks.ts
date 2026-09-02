export type StockExchange = 'DSE' | 'CSE' | 'GLOBAL';

export interface StockHolding {
  id: string;
  symbol: string;               // e.g. GP, BEXIMCO, BATBC, BRACBANK, SQURPHARMA
  companyName: string;          // e.g. Grameenphone Ltd.
  exchange: StockExchange;      // DSE (Dhaka Stock Exchange), CSE, or GLOBAL
  quantity: number;             // Shares owned
  buyPrice: number;             // Average Purchase Price (BDT)
  currentPrice: number;         // Current Market Price (BDT)
  sector: string;               // e.g. Telecommunication, Banking, Pharmaceuticals
  dividendYieldPercent?: number;// e.g. 5.2%
  notes?: string;
  createdAt: number;
}

export interface StockPortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  isProfitable: boolean;
  totalHoldingsCount: number;
  holdingsByExchange: {
    dse: number;
    cse: number;
    global: number;
  };
}

export const calculateStockHoldingMetrics = (stock: StockHolding) => {
  const invested = stock.quantity * stock.buyPrice;
  const current = stock.quantity * stock.currentPrice;
  const gainLoss = current - invested;
  const gainLossPercent = invested > 0 ? (gainLoss / invested) * 100 : 0;

  return {
    invested,
    current,
    gainLoss,
    gainLossPercent,
    isProfitable: gainLoss >= 0,
  };
};

export const calculatePortfolioSummary = (stocks: StockHolding[]): StockPortfolioSummary => {
  let totalInvested = 0;
  let currentValue = 0;
  let dseCount = 0;
  let cseCount = 0;
  let globalCount = 0;

  for (const s of stocks) {
    totalInvested += s.quantity * s.buyPrice;
    currentValue += s.quantity * s.currentPrice;
    if (s.exchange === 'DSE') dseCount++;
    else if (s.exchange === 'CSE') cseCount++;
    else globalCount++;
  }

  const totalGainLoss = currentValue - totalInvested;
  const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  return {
    totalInvested,
    currentValue,
    totalGainLoss,
    totalGainLossPercent,
    isProfitable: totalGainLoss >= 0,
    totalHoldingsCount: stocks.length,
    holdingsByExchange: {
      dse: dseCount,
      cse: cseCount,
      global: globalCount,
    },
  };
};
