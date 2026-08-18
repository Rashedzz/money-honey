/**
 * World-Class Financial Planning & Wealth Architecture Suite
 * Includes Rule of 72, FIRE 4% Rule, 50/30/20 Wealth Audit,
 * Human Life Value (HLV), Emergency Runway, and Consultant Recommendations.
 */

export interface RuleOf72Item {
  instrument: string;
  annualRatePct: number;
  yearsToDouble: number;
  color: string;
  category: string;
}

export interface FIREPlan {
  annualExpenses: number;
  fireCorpusTarget: number; // 25x Annual Expenses (4% Rule)
  currentLiquidNetWorth: number;
  fireProgressPct: number;
  monthlySafeWithdrawalAmount: number;
  estimatedYearsToFIRE: number;
  fireStatus: 'Emerging' | 'On Track' | 'Accelerated' | 'Financially Free';
}

export interface WealthAllocation503020 {
  totalIncome: number;
  needs: { amount: number; actualPct: number; targetPct: 50; status: 'optimal' | 'high' };
  wants: { amount: number; actualPct: number; targetPct: 30; status: 'optimal' | 'high' };
  savings: { amount: number; actualPct: number; targetPct: 20; status: 'optimal' | 'low' };
  consultantGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
}

export interface ConsultantRecommendation {
  id: string;
  category: 'Debt Strategy' | 'Asset Optimization' | 'Emergency Buffer' | 'Tax & Retirement';
  severity: 'CRITICAL' | 'STRATEGIC' | 'GROWTH';
  title: string;
  directive: string;
  impact: string;
  icon: string;
}

export interface FinancialPlanningSuite {
  ruleOf72: RuleOf72Item[];
  firePlan: FIREPlan;
  budget503020: WealthAllocation503020;
  emergencyRunwayMonths: number;
  humanLifeValueTarget: number;
  consultantRecommendations: ConsultantRecommendation[];
}

export const calculateFinancialPlanningSuite = (
  monthlyIncome: number = 238500,
  monthlyExpense: number = 102500,
  cashInHand: number = 1200000,
  totalLoans: number = 5040000,
  totalAssetsValuation: number = 53075000,
  activeLifeInsuranceCover: number = 15000000,
  ageYears: number = 34.2
): FinancialPlanningSuite => {
  // 1. Rule of 72 Doubling Time
  const ruleOf72Rates = [
    { instrument: 'Purbachal Land (Real Estate)', annualRatePct: 15.5, color: '#00E5B3', category: 'Tangible Asset' },
    { instrument: 'National Savings (Sanchaypatra)', annualRatePct: 11.52, color: '#7B6EF6', category: 'Govt Fixed' },
    { instrument: 'Equities / Blue-Chip Index', annualRatePct: 12.0, color: '#00B4D8', category: 'Capital Markets' },
    { instrument: 'Bank Fixed Deposit (FDR)', annualRatePct: 9.5, color: '#FFB547', category: 'Bank Deposit' },
    { instrument: 'Standard Savings Account', annualRatePct: 6.5, color: '#FF4757', category: 'Liquid Cash' },
  ];

  const ruleOf72: RuleOf72Item[] = ruleOf72Rates.map((r) => ({
    ...r,
    yearsToDouble: Number((72 / r.annualRatePct).toFixed(1)),
  }));

  // 2. FIRE (Financial Independence) 4% Rule
  const annualExpenses = monthlyExpense * 12;
  const fireCorpusTarget = annualExpenses * 25; // 25x expenses
  const netLiquidCapital = Math.max(0, cashInHand + totalAssetsValuation * 0.4 - totalLoans);
  const fireProgressPct = Math.min(100, Number(((netLiquidCapital / fireCorpusTarget) * 100).toFixed(1)));
  const monthlySafeWithdrawalAmount = Math.round(fireCorpusTarget * 0.04 / 12);

  const monthlySavings = Math.max(1000, monthlyIncome - monthlyExpense);
  const remainingCorpus = Math.max(0, fireCorpusTarget - netLiquidCapital);
  const estimatedYearsToFIRE = Number((remainingCorpus / (monthlySavings * 12 * 1.08)).toFixed(1));

  let fireStatus: FIREPlan['fireStatus'] = 'Emerging';
  if (fireProgressPct >= 100) fireStatus = 'Financially Free';
  else if (fireProgressPct >= 50) fireStatus = 'Accelerated';
  else if (fireProgressPct >= 25) fireStatus = 'On Track';

  const firePlan: FIREPlan = {
    annualExpenses,
    fireCorpusTarget,
    currentLiquidNetWorth: netLiquidCapital,
    fireProgressPct,
    monthlySafeWithdrawalAmount,
    estimatedYearsToFIRE,
    fireStatus,
  };

  // 3. 50/30/20 Allocation Health Check
  const needsAmount = monthlyExpense * 0.72; // Rent, EMIs, utilities, groceries
  const wantsAmount = monthlyExpense * 0.28; // Dining, leisure, travel
  const savingsAmount = Math.max(0, monthlyIncome - monthlyExpense);

  const needsPct = Math.round((needsAmount / (monthlyIncome || 1)) * 100);
  const wantsPct = Math.round((wantsAmount / (monthlyIncome || 1)) * 100);
  const savingsPct = Math.round((savingsAmount / (monthlyIncome || 1)) * 100);

  let consultantGrade: WealthAllocation503020['consultantGrade'] = 'A';
  if (savingsPct >= 40) consultantGrade = 'A+';
  else if (savingsPct >= 20 && needsPct <= 55) consultantGrade = 'A';
  else if (savingsPct >= 15) consultantGrade = 'B';
  else consultantGrade = 'C';

  const budget503020: WealthAllocation503020 = {
    totalIncome: monthlyIncome,
    needs: { amount: Math.round(needsAmount), actualPct: needsPct, targetPct: 50, status: needsPct > 50 ? 'high' : 'optimal' },
    wants: { amount: Math.round(wantsAmount), actualPct: wantsPct, targetPct: 30, status: wantsPct > 30 ? 'high' : 'optimal' },
    savings: { amount: Math.round(savingsAmount), actualPct: savingsPct, targetPct: 20, status: savingsPct >= 20 ? 'optimal' : 'low' },
    consultantGrade,
  };

  // 4. Emergency Runway & Human Life Value (HLV)
  const emergencyRunwayMonths = Number((cashInHand / (monthlyExpense || 1)).toFixed(1));
  const workingYearsRemaining = Math.max(5, 60 - ageYears);
  const humanLifeValueTarget = Math.round((monthlyIncome * 12 - monthlyExpense * 0.3) * Math.min(20, workingYearsRemaining));

  // 5. Renowned Consultant Directives
  const consultantRecommendations: ConsultantRecommendation[] = [
    {
      id: 'REC-01',
      category: 'Asset Optimization',
      severity: 'STRATEGIC',
      title: 'Monetize ৳ 2.55 Cr in Idle Land & Gold Assets',
      directive:
        'Your portfolio holds significant capital locked in 0-yield assets (Purbachal Land & Gold). Consider developing residential rental units or taking an agricultural lease on unused land to unlock +৳ 45,000/mo in recurring cash flow.',
      impact: 'Boosts annual cash yield from 2.3% to 4.8% without selling core equity.',
      icon: 'trending-up',
    },
    {
      id: 'REC-02',
      category: 'Debt Strategy',
      severity: totalLoans > cashInHand * 3 ? 'CRITICAL' : 'STRATEGIC',
      title: 'Accelerated Prepayment on 11.5% Vehicle Loan',
      directive:
        'Direct ৳ 25,000 of monthly savings surplus toward principal prepayment on the EBL Auto Loan (৳ 5.4L remaining) to eliminate 24 months of depreciating interest drag.',
      impact: 'Saves ৳ 1,18,000 in compound interest and frees up ৳ 22,500/mo in cash flow.',
      icon: 'card',
    },
    {
      id: 'REC-03',
      category: 'Emergency Buffer',
      severity: emergencyRunwayMonths >= 6 ? 'GROWTH' : 'CRITICAL',
      title: `Maintain 6-12 Months Emergency Runway (${emergencyRunwayMonths} Mo Current)`,
      directive:
        emergencyRunwayMonths >= 6
          ? 'Your liquid cash reserves of ৳ 12.0 Lakhs comfortably cover 11.7 months of full household burn. Excess liquidity should be deployed into 11.52% Sanchaypatra certificates.'
          : 'Increase liquid emergency deposits to at least 6 months of household burn.',
      impact: 'Protects family balance sheet from forced asset liquidations during economic downturns.',
      icon: 'shield-checkmark',
    },
    {
      id: 'REC-04',
      category: 'Tax & Retirement',
      severity: 'GROWTH',
      title: 'Compound Sanchaypatra Coupons into FDR Stacks',
      directive:
        'Route quarterly coupon disbursements (৳ 28,500 every 3 months) directly into high-yield 9.5% FDR recurring deposit ladders rather than allowing cash to sit idle in low-interest savings.',
      impact: 'Accelerates Rule of 72 capital doubling time to 5.4 years through automated compounding.',
      icon: 'repeat',
    },
  ];

  return {
    ruleOf72,
    firePlan,
    budget503020,
    emergencyRunwayMonths,
    humanLifeValueTarget,
    consultantRecommendations,
  };
};
