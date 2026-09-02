/**
 * DCF (Discounted Cash Flow) Valuation Engine for Bangladesh Equities
 * Implements the complete step-by-step financial statement waterfall
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
  sharesMillion: number,
  baseRevenueCrore = 4850,
  ebitdaMargin = 0.28,
  wacc = 11.5,
  terminalGrowth = 4.5
): DcfValuationResult {
  const revenue = baseRevenueCrore;
  const ebitda = revenue * ebitdaMargin;
  const depr = ebitda * 0.18;
  const ebit = ebitda - depr;
  const taxRate = 22.5; // Bangladesh corporate tax rate for listed companies
  const tax = ebit * (taxRate / 100);
  const nopat = ebit - tax;

  const capex = ebitda * 0.22;
  const deltaWc = revenue * 0.03;
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
  const netDebt = 120; // ৳ Cr
  const equityValue = enterpriseValue - netDebt;
  const intrinsicPerShare = Math.round(((equityValue * 10) / sharesMillion) * 10) / 10;

  const diff = intrinsicPerShare - currentPrice;
  const marginOfSafety = Math.round((diff / intrinsicPerShare) * 1000) / 10;

  let classification: DcfValuationResult['classification'] = '🟡 Fairly Valued';
  if (marginOfSafety >= 15) classification = '🟢 Undervalued (Buy Zone)';
  else if (marginOfSafety <= -10) classification = '🔴 Overvalued';

  const waterfallSteps: DcfWaterfallStep[] = [
    { stepName: '1. Total Revenue', amountCrore: Math.round(revenue), formulaDescription: 'Gross annual sales' },
    { stepName: '2. EBITDA', amountCrore: Math.round(ebitda), formulaDescription: 'Operating earnings before Depr/Amort' },
    { stepName: '3. EBIT (Operating Profit)', amountCrore: Math.round(ebit), formulaDescription: 'EBITDA - Depreciation (৳' + Math.round(depr) + ' Cr)' },
    { stepName: '4. Corporate Tax Deduction', amountCrore: Math.round(-tax), formulaDescription: '22.5% statutory rate for listed entities' },
    { stepName: '5. NOPAT', amountCrore: Math.round(nopat), formulaDescription: 'Net Operating Profit After Tax' },
    { stepName: '6. (+) Depreciation Added Back', amountCrore: Math.round(depr), formulaDescription: 'Non-cash accounting expense' },
    { stepName: '7. (-) Capital Expenditures (Capex)', amountCrore: Math.round(-capex), formulaDescription: 'Plant, machinery & facility reinvestment' },
    { stepName: '8. (-) Change in Working Capital', amountCrore: Math.round(-deltaWc), formulaDescription: 'Inventories and accounts receivables' },
    { stepName: '9. Unlevered Free Cash Flow (FCFF)', amountCrore: Math.round(fcf), formulaDescription: 'Cash available to all capital providers' },
    { stepName: '10. Terminal Value (Gordon Growth)', amountCrore: Math.round(terminalValue), formulaDescription: 'Terminal FCF / (WACC 11.5% - g 4.5%)' },
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
    sharesOutstandingMillion: sharesMillion,
    waterfallSteps,
  };
}
