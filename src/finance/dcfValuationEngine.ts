/**
 * DCF (Discounted Cash Flow) Valuation Engine for Bangladesh Equities
 * Implements the complete step-by-step financial statement waterfall
 * Dynamically calibrated with company-specific revenue, EBITDA margins, and share counts.
 */

export interface DcfWaterfallStep {
  stepName: string;
  amountCrore: number; // ৳ Crore
  formulaDescription: string;
}

export interface DcfValuationResult {
  symbol: string;
  currentPrice: number;
  intrinsicValuePerShare: number;
  marginOfSafetyPercent: number;
  classification: '🟢 Undervalued (Buy Zone)' | '🟡 Fairly Valued' | '🔴 Overvalued';

  // Step-by-Step Waterfall
  revenueCrore: number;
  ebitdaCrore: number;
  ebitCrore: number;
  effectiveTaxRatePercent: number;
  taxAmountCrore: number;
  nopatCrore: number;             // Net Operating Profit After Tax
  depreciationCrore: number;
  capexCrore: number;
  changeInWorkingCapitalCrore: number;
  freeCashFlowCrore: number;      // Unlevered Free Cash Flow (FCFF)

  // Valuation Parameters
  waccPercent: number;            // Discount Rate (Weighted Average Cost of Capital)
  terminalGrowthRatePercent: number; // Long-term terminal growth rate in Bangladesh
  forecastPeriodYears: number;
  presentValueOfForecastFcfCrore: number;
  terminalValueCrore: number;
  presentValueOfTerminalValueCrore: number;
  enterpriseValueCrore: number;
  netDebtCrore: number;
  equityValueCrore: number;
  sharesOutstandingMillion: number;

  waterfallSteps: DcfWaterfallStep[];
}

export function calculateDetailedDCF(
  symbol: string,
  currentPrice: number,
  sharesMillion?: number,
  baseRevenueCrore?: number,
  ebitdaMargin?: number,
  wacc = 11.5,
  terminalGrowth = 4.5
): DcfValuationResult {
  const sym = symbol.toUpperCase().trim();

  // 1. Resolve company-specific financial statement parameters
  let revenue = baseRevenueCrore;
  let margin = ebitdaMargin;
  let shares = sharesMillion;
  let capexRatio = 0.20;

  if (sym === 'GP') {
    revenue = revenue ?? 15850;
    margin = margin ?? 0.61;
    shares = shares ?? 1350.3;
    capexRatio = 0.16;
  } else if (sym === 'SQURPHARMA') {
    revenue = revenue ?? 5850;
    margin = margin ?? 0.32;
    shares = shares ?? 886.45;
    capexRatio = 0.20;
  } else if (sym === 'BRACBANK') {
    revenue = revenue ?? 6850;
    margin = margin ?? 0.38;
    shares = shares ?? 1608.8;
    capexRatio = 0.10;
  } else if (sym === 'BATBC') {
    revenue = revenue ?? 8450;
    margin = margin ?? 0.44;
    shares = shares ?? 540.0;
    capexRatio = 0.12;
  } else if (sym === 'MARICO') {
    revenue = revenue ?? 1480;
    margin = margin ?? 0.36;
    shares = shares ?? 31.5;
    capexRatio = 0.08;
  } else if (sym === 'LHBL') {
    revenue = revenue ?? 2850;
    margin = margin ?? 0.33;
    shares = shares ?? 1161.4;
    capexRatio = 0.15;
  } else {
    // Dynamic derivation for any other security based on price and shares
    shares = shares && shares > 0 ? shares : 100;
    revenue = revenue ?? Math.round((currentPrice * shares * 0.35) / 10);
    margin = margin ?? 0.25;
    capexRatio = 0.18;
  }

  const ebitda = revenue * margin;
  const depr = ebitda * 0.18;
  const ebit = ebitda - depr;
  const taxRate = 22.5; // Bangladesh corporate tax rate for listed companies
  const tax = ebit * (taxRate / 100);
  const nopat = ebit - tax;

  const capex = ebitda * capexRatio;
  const deltaWc = revenue * 0.025;
  const fcf = nopat + depr - capex - deltaWc;

  // 5-Year Projection & Discounting
  let pvFcfTotal = 0;
  let projectedFcf = fcf;
  const fcfGrowthRate = 0.12; // 12% expected FCF growth for prime DSE leaders

  for (let t = 1; t <= 5; t++) {
    projectedFcf = projectedFcf * (1 + fcfGrowthRate);
    const discountFactor = Math.pow(1 + wacc / 100, t);
    pvFcfTotal += projectedFcf / discountFactor;
  }

  // Terminal Value using Gordon Growth Model: TV = FCF5 * (1+g) / (WACC - g)
  const terminalFcf = projectedFcf * (1 + terminalGrowth / 100);
  const terminalValue = terminalFcf / ((wacc - terminalGrowth) / 100);
  const pvTerminalValue = terminalValue / Math.pow(1 + wacc / 100, 5);

  const enterpriseValue = pvFcfTotal + pvTerminalValue;
  const netDebt = sym === 'BATBC' || sym === 'MARICO' ? 0 : 120; // ৳ Cr
  const equityValue = enterpriseValue - netDebt;
  const intrinsicPerShare = Math.round(((equityValue * 10) / shares) * 10) / 10;

  const diff = intrinsicPerShare - currentPrice;
  const marginOfSafety = Math.round((diff / intrinsicPerShare) * 1000) / 10;

  let classification: DcfValuationResult['classification'] = '🟡 Fairly Valued';
  if (marginOfSafety >= 15) classification = '🟢 Undervalued (Buy Zone)';
  else if (marginOfSafety <= -10) classification = '🔴 Overvalued';

  const waterfallSteps: DcfWaterfallStep[] = [
    { stepName: '1. Total Revenue', amountCrore: Math.round(revenue), formulaDescription: 'Gross annual sales' },
    { stepName: '2. EBITDA', amountCrore: Math.round(ebitda), formulaDescription: 'Operating earnings before Depr/Amort (' + Math.round(margin * 100) + '% margin)' },
    { stepName: '3. EBIT (Operating Profit)', amountCrore: Math.round(ebit), formulaDescription: 'EBITDA - Depreciation (৳' + Math.round(depr) + ' Cr)' },
    { stepName: '4. Corporate Tax Deduction', amountCrore: Math.round(-tax), formulaDescription: '22.5% statutory rate for listed entities' },
    { stepName: '5. NOPAT', amountCrore: Math.round(nopat), formulaDescription: 'Net Operating Profit After Tax' },
    { stepName: '6. (+) Depreciation Added Back', amountCrore: Math.round(depr), formulaDescription: 'Non-cash accounting expense' },
    { stepName: '7. (-) Capital Expenditures (Capex)', amountCrore: Math.round(-capex), formulaDescription: 'Plant, machinery & facility reinvestment' },
    { stepName: '8. (-) Change in Working Capital', amountCrore: Math.round(-deltaWc), formulaDescription: 'Inventories and accounts receivables' },
    { stepName: '9. Unlevered Free Cash Flow (FCFF)', amountCrore: Math.round(fcf), formulaDescription: 'Cash available to all capital providers' },
    { stepName: '10. Terminal Value (Gordon Growth)', amountCrore: Math.round(terminalValue), formulaDescription: 'Terminal FCF / (WACC ' + wacc + '% - g ' + terminalGrowth + '%)' },
    { stepName: '11. Equity Intrinsic Value', amountCrore: Math.round(equityValue), formulaDescription: 'PV of FCF + PV of TV - Net Debt' },
  ];

  return {
    symbol,
    currentPrice,
    intrinsicValuePerShare: intrinsicPerShare,
    marginOfSafetyPercent: marginOfSafety,
    classification,
    revenueCrore: Math.round(revenue),
    ebitdaCrore: Math.round(ebitda),
    ebitCrore: Math.round(ebit),
    effectiveTaxRatePercent: taxRate,
    taxAmountCrore: Math.round(tax),
    nopatCrore: Math.round(nopat),
    depreciationCrore: Math.round(depr),
    capexCrore: Math.round(capex),
    changeInWorkingCapitalCrore: Math.round(deltaWc),
    freeCashFlowCrore: Math.round(fcf),
    waccPercent: wacc,
    terminalGrowthRatePercent: terminalGrowth,
    forecastPeriodYears: 5,
    presentValueOfForecastFcfCrore: Math.round(pvFcfTotal),
    terminalValueCrore: Math.round(terminalValue),
    presentValueOfTerminalValueCrore: Math.round(pvTerminalValue),
    enterpriseValueCrore: Math.round(enterpriseValue),
    netDebtCrore: netDebt,
    equityValueCrore: Math.round(equityValue),
    sharesOutstandingMillion: shares,
    waterfallSteps,
  };
}
