/**
 * Asset Evaluation & Wealth Intelligence Engine for Money-Honey
 */

export interface AssetItem {
  id: string; // e.g. "AST-101"
  name: string; // e.g. "Purbachal 5-Katha Plot"
  category: string; // "Real Estate" | "Precious Metals" | "Vehicle" | "Commercial" | "Agriculture"
  purchasePrice: number; // ৳
  currentValuation: number; // ৳
  quantity?: number; // e.g. 5
  uom?: string; // e.g. "Katha", "Bhori", "Sq. Ft", "Units"
  currentRatePerUoM?: number; // ৳ / unit
  monthlyIncome: number; // ৳ / month (0 for idle assets)
  appreciationRateAnnualPct: number; // % annual growth
  isIdle: boolean; // true if monthlyIncome === 0
  acquiredDate: string;
  notes?: string;
  color?: string;
}

export interface AssetEvaluationSummary {
  totalAssetValuation: number;
  totalMonthlyAssetIncome: number;
  totalAnnualAssetIncome: number;
  overallAnnualYieldPct: number;
  totalIdleAssetValuation: number;
  idleCapitalPct: number;
  incomeGeneratingCount: number;
  idleCount: number;
  topIncomeGenerator: {
    asset: AssetItem;
    monthlyIncome: number;
    annualYieldPct: number;
  } | null;
  topFutureGrowthAsset: {
    asset: AssetItem;
    projected5YearValuation: number;
    annualGrowthPct: number;
    growthSummary: string;
  } | null;
  categoryBreakdown: Array<{
    category: string;
    valuation: number;
    monthlyIncome: number;
    percentage: number;
    color: string;
  }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Real Estate': '#00E5B3',
  'Precious Metals': '#FFB547',
  'Vehicles': '#00B4D8',
  'Commercial': '#7B6EF6',
  'Agriculture': '#32CD32',
  'Equities': '#FF6B35',
  'Other': '#8892A4',
};

export const evaluateAssets = (assets: AssetItem[]): AssetEvaluationSummary => {
  const totalValuation = assets.reduce((sum, a) => sum + a.currentValuation, 0) || 1;
  const totalMonthlyIncome = assets.reduce((sum, a) => sum + a.monthlyIncome, 0);
  const totalAnnualIncome = totalMonthlyIncome * 12;
  const overallYieldPct = Number(((totalAnnualIncome / totalValuation) * 100).toFixed(2));

  const idleAssets = assets.filter((a) => a.monthlyIncome === 0);
  const incomeAssets = assets.filter((a) => a.monthlyIncome > 0);

  const totalIdleValuation = idleAssets.reduce((sum, a) => sum + a.currentValuation, 0);
  const idleCapitalPct = Number(((totalIdleValuation / totalValuation) * 100).toFixed(1));

  // 1. Top Income Generator (highest monthly income / yield)
  let topIncomeGenerator: AssetEvaluationSummary['topIncomeGenerator'] = null;
  if (incomeAssets.length > 0) {
    const sortedByIncome = [...incomeAssets].sort((a, b) => b.monthlyIncome - a.monthlyIncome);
    const top = sortedByIncome[0];
    const annualYield = (top.monthlyIncome * 12 / top.currentValuation) * 100;
    topIncomeGenerator = {
      asset: top,
      monthlyIncome: top.monthlyIncome,
      annualYieldPct: Number(annualYield.toFixed(2)),
    };
  }

  // 2. Top Future Growth Star (highest capital appreciation rate % and 5-year projection)
  let topFutureGrowthAsset: AssetEvaluationSummary['topFutureGrowthAsset'] = null;
  if (assets.length > 0) {
    const sortedByGrowth = [...assets].sort((a, b) => b.appreciationRateAnnualPct - a.appreciationRateAnnualPct);
    const topGrowth = sortedByGrowth[0];
    const rate = topGrowth.appreciationRateAnnualPct / 100;
    const projected5YearValuation = Math.round(topGrowth.currentValuation * Math.pow(1 + rate, 5));
    
    topFutureGrowthAsset = {
      asset: topGrowth,
      projected5YearValuation,
      annualGrowthPct: topGrowth.appreciationRateAnnualPct,
      growthSummary: topGrowth.quantity && topGrowth.uom
        ? `${topGrowth.quantity} ${topGrowth.uom} @ ৳${(topGrowth.currentRatePerUoM || 0).toLocaleString('en-IN')}/${topGrowth.uom} (+${topGrowth.appreciationRateAnnualPct}% YoY)`
        : `+${topGrowth.appreciationRateAnnualPct}% Estimated Annual Appreciation`,
    };
  }

  // 3. Category Breakdown
  const catMap = new Map<string, { valuation: number; monthlyIncome: number }>();
  assets.forEach((a) => {
    const existing = catMap.get(a.category) || { valuation: 0, monthlyIncome: 0 };
    catMap.set(a.category, {
      valuation: existing.valuation + a.currentValuation,
      monthlyIncome: existing.monthlyIncome + a.monthlyIncome,
    });
  });

  const categoryBreakdown = Array.from(catMap.entries()).map(([category, data]) => ({
    category,
    valuation: data.valuation,
    monthlyIncome: data.monthlyIncome,
    percentage: Math.round((data.valuation / totalValuation) * 100),
    color: CATEGORY_COLORS[category] || '#8892A4',
  }));

  return {
    totalAssetValuation: totalValuation === 1 && assets.length === 0 ? 0 : totalValuation,
    totalMonthlyAssetIncome: totalMonthlyIncome,
    totalAnnualAssetIncome: totalAnnualIncome,
    overallAnnualYieldPct: overallYieldPct,
    totalIdleAssetValuation: totalIdleValuation,
    idleCapitalPct,
    incomeGeneratingCount: incomeAssets.length,
    idleCount: idleAssets.length,
    topIncomeGenerator,
    topFutureGrowthAsset,
    categoryBreakdown,
  };
};
