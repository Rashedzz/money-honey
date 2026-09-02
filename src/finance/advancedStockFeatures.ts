/**
 * Advanced International & Bangladesh DSE Market Intelligence Features
 * Level 2 Market Depth (Order Book Ladder), Shareholding Structure Breakdown,
 * DSE Category & Margin Loan Haircut, Circuit Breaker Limits, and Peer Comparison Matrix.
 */

export interface MarketDepthOrder {
  price: number;
  quantity: number;
  ordersCount: number;
}

export interface MarketDepthLadder {
  bids: MarketDepthOrder[];
  asks: MarketDepthOrder[];
  totalBidQuantity: number;
  totalAskQuantity: number;
  buyPressurePercent: number; // 0 - 100
  sellPressurePercent: number; // 0 - 100
}

export interface DseShareholdingStructure {
  sponsorsDirectorsPercent: number;
  govtPercent: number;
  institutionsPercent: number;
  foreignPercent: number;
  generalPublicPercent: number;
  bsec30PercentRuleCompliant: boolean;
  foreignInflowTrend: 'Inflow' | 'Outflow' | 'Stable';
  lastUpdatedDate: string;
}

export interface DseRegulatoryStatus {
  category: 'A' | 'B' | 'N' | 'Z';
  categoryReason: string;
  marginLoanEligibility: boolean;
  marginHaircutPercent: number;
  faceValue: number; // BDT
  marketLot: number;
  settlementCycle: string; // e.g. T+2
  floorPrice: number; // circuit breaker lower
  ceilingPrice: number; // circuit breaker upper
  circuitBreakerPercent: number; // 10%
}

export interface PeerComparisonItem {
  symbol: string;
  companyName: string;
  sector: string;
  ltp: number;
  marketCapCrore: number;
  peRatio: number;
  pbRatio: number;
  evEbitda: number;
  roePercent: number;
  operatingMarginPercent: number;
  epsGrowth5YrPercent: number;
  dividendYieldPercent: number;
  aiScore: number;
  recommendation: string;
  valuationStatus: 'Undervalued' | 'Fairly Valued' | 'Overvalued';
}

/**
 * Generate real-time Level 2 Market Depth ladder (5 Bid x 5 Ask)
 */
export function getMarketDepthLadder(symbol: string, currentLtp: number): MarketDepthLadder {
  const tick = symbol === 'MARICO' ? 1.0 : 0.1;
  const baseQty = symbol === 'SQURPHARMA' ? 24500 : symbol === 'BRACBANK' ? 58000 : 18000;

  const bids: MarketDepthOrder[] = [
    { price: Math.round((currentLtp - tick * 1) * 10) / 10, quantity: Math.round(baseQty * 1.2), ordersCount: 14 },
    { price: Math.round((currentLtp - tick * 2) * 10) / 10, quantity: Math.round(baseQty * 1.5), ordersCount: 22 },
    { price: Math.round((currentLtp - tick * 3) * 10) / 10, quantity: Math.round(baseQty * 2.1), ordersCount: 31 },
    { price: Math.round((currentLtp - tick * 4) * 10) / 10, quantity: Math.round(baseQty * 2.8), ordersCount: 45 },
    { price: Math.round((currentLtp - tick * 5) * 10) / 10, quantity: Math.round(baseQty * 3.4), ordersCount: 52 },
  ];

  const asks: MarketDepthOrder[] = [
    { price: Math.round((currentLtp + tick * 1) * 10) / 10, quantity: Math.round(baseQty * 0.9), ordersCount: 11 },
    { price: Math.round((currentLtp + tick * 2) * 10) / 10, quantity: Math.round(baseQty * 1.1), ordersCount: 18 },
    { price: Math.round((currentLtp + tick * 3) * 10) / 10, quantity: Math.round(baseQty * 1.4), ordersCount: 20 },
    { price: Math.round((currentLtp + tick * 4) * 10) / 10, quantity: Math.round(baseQty * 1.9), ordersCount: 27 },
    { price: Math.round((currentLtp + tick * 5) * 10) / 10, quantity: Math.round(baseQty * 2.5), ordersCount: 38 },
  ];

  const totalBidQuantity = bids.reduce((acc, b) => acc + b.quantity, 0);
  const totalAskQuantity = asks.reduce((acc, a) => acc + a.quantity, 0);
  const totalDepth = totalBidQuantity + totalAskQuantity;
  const buyPressurePercent = Math.round((totalBidQuantity / totalDepth) * 100);
  const sellPressurePercent = 100 - buyPressurePercent;

  return {
    bids,
    asks,
    totalBidQuantity,
    totalAskQuantity,
    buyPressurePercent,
    sellPressurePercent,
  };
}

/**
 * Get Bangladesh DSE shareholding pattern for security
 */
export function getDseShareholding(symbol: string): DseShareholdingStructure {
  switch (symbol) {
    case 'SQURPHARMA':
      return {
        sponsorsDirectorsPercent: 34.57,
        govtPercent: 0.0,
        institutionsPercent: 19.82,
        foreignPercent: 14.15,
        generalPublicPercent: 31.46,
        bsec30PercentRuleCompliant: true,
        foreignInflowTrend: 'Inflow',
        lastUpdatedDate: '31 Jul 2026',
      };
    case 'BRACBANK':
      return {
        sponsorsDirectorsPercent: 46.17,
        govtPercent: 0.0,
        institutionsPercent: 15.24,
        foreignPercent: 31.02,
        generalPublicPercent: 7.57,
        bsec30PercentRuleCompliant: true,
        foreignInflowTrend: 'Inflow',
        lastUpdatedDate: '31 Jul 2026',
      };
    case 'BATBC':
      return {
        sponsorsDirectorsPercent: 72.91,
        govtPercent: 0.64,
        institutionsPercent: 12.05,
        foreignPercent: 6.85,
        generalPublicPercent: 7.55,
        bsec30PercentRuleCompliant: true,
        foreignInflowTrend: 'Stable',
        lastUpdatedDate: '31 Jul 2026',
      };
    case 'GP':
      return {
        sponsorsDirectorsPercent: 90.0,
        govtPercent: 0.0,
        institutionsPercent: 4.82,
        foreignPercent: 2.15,
        generalPublicPercent: 3.03,
        bsec30PercentRuleCompliant: true,
        foreignInflowTrend: 'Stable',
        lastUpdatedDate: '31 Jul 2026',
      };
    case 'BEXIMCO':
      return {
        sponsorsDirectorsPercent: 30.55,
        govtPercent: 0.0,
        institutionsPercent: 20.12,
        foreignPercent: 1.84,
        generalPublicPercent: 47.49,
        bsec30PercentRuleCompliant: true,
        foreignInflowTrend: 'Outflow',
        lastUpdatedDate: '31 Jul 2026',
      };
    default:
      return {
        sponsorsDirectorsPercent: 42.1,
        govtPercent: 0.0,
        institutionsPercent: 18.5,
        foreignPercent: 8.2,
        generalPublicPercent: 31.2,
        bsec30PercentRuleCompliant: true,
        foreignInflowTrend: 'Inflow',
        lastUpdatedDate: '31 Jul 2026',
      };
  }
}

/**
 * Get Bangladesh DSE regulatory status, Circuit Breakers & Margin eligibility
 */
export function getDseRegulatoryStatus(symbol: string, currentLtp: number): DseRegulatoryStatus {
  const isZCategory = symbol === 'BEXIMCO_FAIL'; // test or Z
  const category = isZCategory ? 'Z' : 'A';
  const marginLoanEligibility = category === 'A' || category === 'B';
  const marginHaircutPercent = category === 'A' ? 50 : category === 'B' ? 40 : 0;

  // Circuit breaker daily limit is typically 10% on DSE
  const circuitBreakerPercent = 10;
  const floorPrice = Math.round(currentLtp * (1 - circuitBreakerPercent / 100) * 10) / 10;
  const ceilingPrice = Math.round(currentLtp * (1 + circuitBreakerPercent / 100) * 10) / 10;

  return {
    category,
    categoryReason: category === 'A' ? 'Declared ≥10% cash dividend regularly' : 'Default / Non-compliant',
    marginLoanEligibility,
    marginHaircutPercent,
    faceValue: 10.0,
    marketLot: 1,
    settlementCycle: 'T+2 Rolling Settlement',
    floorPrice,
    ceilingPrice,
    circuitBreakerPercent,
  };
}

/**
 * Generate Peer Comparison Matrix for Sector
 */
export function getSectorPeerComparison(targetSector: string): PeerComparisonItem[] {
  const peers: Record<string, PeerComparisonItem[]> = {
    Pharmaceuticals: [
      {
        symbol: 'SQURPHARMA',
        companyName: 'Square Pharmaceuticals PLC',
        sector: 'Pharmaceuticals',
        ltp: 218.4,
        marketCapCrore: 19360,
        peRatio: 10.2,
        pbRatio: 1.7,
        evEbitda: 7.8,
        roePercent: 16.5,
        operatingMarginPercent: 28.4,
        epsGrowth5YrPercent: 14.5,
        dividendYieldPercent: 4.8,
        aiScore: 92,
        recommendation: 'STRONG BUY',
        valuationStatus: 'Undervalued',
      },
      {
        symbol: 'RENATA',
        companyName: 'Renata PLC',
        sector: 'Pharmaceuticals',
        ltp: 742.0,
        marketCapCrore: 8520,
        peRatio: 18.6,
        pbRatio: 2.9,
        evEbitda: 13.2,
        roePercent: 15.2,
        operatingMarginPercent: 22.1,
        epsGrowth5YrPercent: 11.2,
        dividendYieldPercent: 2.1,
        aiScore: 82,
        recommendation: 'BUY',
        valuationStatus: 'Fairly Valued',
      },
      {
        symbol: 'BXPHARMA',
        companyName: 'Beximco Pharmaceuticals Ltd.',
        sector: 'Pharmaceuticals',
        ltp: 114.5,
        marketCapCrore: 5120,
        peRatio: 9.8,
        pbRatio: 1.3,
        evEbitda: 7.1,
        roePercent: 13.4,
        operatingMarginPercent: 19.8,
        epsGrowth5YrPercent: 9.4,
        dividendYieldPercent: 3.9,
        aiScore: 79,
        recommendation: 'ACCUMULATE',
        valuationStatus: 'Undervalued',
      },
      {
        symbol: 'IBNSINA',
        companyName: 'The IBN SINA Pharmaceutical Industry',
        sector: 'Pharmaceuticals',
        ltp: 312.0,
        marketCapCrore: 1240,
        peRatio: 12.4,
        pbRatio: 2.1,
        evEbitda: 8.9,
        roePercent: 17.8,
        operatingMarginPercent: 24.5,
        epsGrowth5YrPercent: 16.2,
        dividendYieldPercent: 3.5,
        aiScore: 84,
        recommendation: 'BUY',
        valuationStatus: 'Fairly Valued',
      },
    ],
    Banking: [
      {
        symbol: 'BRACBANK',
        companyName: 'BRAC Bank PLC',
        sector: 'Banking',
        ltp: 42.8,
        marketCapCrore: 6890,
        peRatio: 6.8,
        pbRatio: 0.95,
        evEbitda: 5.2,
        roePercent: 15.8,
        operatingMarginPercent: 32.4,
        epsGrowth5YrPercent: 18.2,
        dividendYieldPercent: 4.2,
        aiScore: 90,
        recommendation: 'STRONG BUY',
        valuationStatus: 'Undervalued',
      },
      {
        symbol: 'EBL',
        companyName: 'Eastern Bank PLC',
        sector: 'Banking',
        ltp: 28.6,
        marketCapCrore: 3850,
        peRatio: 5.9,
        pbRatio: 0.88,
        evEbitda: 4.8,
        roePercent: 14.9,
        operatingMarginPercent: 31.0,
        epsGrowth5YrPercent: 15.4,
        dividendYieldPercent: 6.5,
        aiScore: 89,
        recommendation: 'BUY',
        valuationStatus: 'Undervalued',
      },
      {
        symbol: 'CITYBANK',
        companyName: 'The City Bank PLC',
        sector: 'Banking',
        ltp: 23.4,
        marketCapCrore: 2820,
        peRatio: 5.2,
        pbRatio: 0.79,
        evEbitda: 4.4,
        roePercent: 13.8,
        operatingMarginPercent: 28.5,
        epsGrowth5YrPercent: 12.8,
        dividendYieldPercent: 5.8,
        aiScore: 83,
        recommendation: 'BUY',
        valuationStatus: 'Undervalued',
      },
      {
        symbol: 'DUTCHBANGL',
        companyName: 'Dutch-Bangla Bank PLC',
        sector: 'Banking',
        ltp: 54.5,
        marketCapCrore: 4120,
        peRatio: 7.2,
        pbRatio: 1.15,
        evEbitda: 5.8,
        roePercent: 16.2,
        operatingMarginPercent: 33.2,
        epsGrowth5YrPercent: 14.0,
        dividendYieldPercent: 4.5,
        aiScore: 86,
        recommendation: 'BUY',
        valuationStatus: 'Fairly Valued',
      },
    ],
  };

  return peers[targetSector] || peers['Pharmaceuticals'];
}
