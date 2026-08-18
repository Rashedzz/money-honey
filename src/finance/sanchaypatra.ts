/**
 * Sanchaypatra (Bangladesh National Savings) calculation module.
 */
import { FDRCountdown } from './fdr';

export type SanchaypatraType = 
  | 'five_year'           // 5-year Bangladesh Sanchaypatra
  | 'three_month_profit'  // 3-Month Profit Based Sanchaypatra  
  | 'family_savings'      // Family Savings Certificate
  | 'pensioner';          // Pensioner Savings Certificate

export interface SanchaypatraRateTable {
  type: SanchaypatraType;
  nameEn: string;
  nameBn: string;
  tenorYears: number;
  annualRatePercent: number;
  profitInterval: 'monthly' | 'three_monthly' | 'at_maturity';
  maxInvestment: number; // BDT (0 = unlimited)
  lastUpdated: string; // ISO date
}

export interface SanchaypatraCalculation {
  grossProfitPerInterval: number;
  taxDeducted: number;
  netProfitPerInterval: number;
  annualGrossProfit: number;
  annualNetProfit: number;
  totalGrossProfit: number;
  totalTaxDeducted: number;
  totalNetProfit: number;
  maturityValue: number; // principal + totalNetProfit
  effectiveNetRate: number;
}

export interface CouponScheduleEntry {
  couponNumber: number;
  couponDate: Date;
  grossAmount: number;
  taxDeducted: number;
  netAmount: number;
  isCollected: boolean;
}

export const SANCHAYPATRA_RATES: SanchaypatraRateTable[] = [
  {
    type: 'five_year',
    nameEn: '5-year Bangladesh Sanchaypatra',
    nameBn: '৫-বছর মেয়াদী বাংলাদেশ সঞ্চয়পত্র',
    tenorYears: 5,
    annualRatePercent: 11.28,
    profitInterval: 'at_maturity',
    maxInvestment: 0,
    lastUpdated: '2024-01-01'
  },
  {
    type: 'three_month_profit',
    nameEn: '3-Month Profit Based Sanchaypatra',
    nameBn: '৩-মাস অন্তর মুনাফাভিত্তিক সঞ্চয়পত্র',
    tenorYears: 5,
    annualRatePercent: 11.04,
    profitInterval: 'three_monthly',
    maxInvestment: 0,
    lastUpdated: '2024-01-01'
  },
  {
    type: 'family_savings',
    nameEn: 'Family Savings Certificate',
    nameBn: 'পরিবার সঞ্চয়পত্র',
    tenorYears: 5,
    annualRatePercent: 11.52,
    profitInterval: 'monthly',
    maxInvestment: 4500000,
    lastUpdated: '2024-01-01'
  },
  {
    type: 'pensioner',
    nameEn: 'Pensioner Savings Certificate',
    nameBn: 'পেনশনার সঞ্চয়পত্র',
    tenorYears: 5,
    annualRatePercent: 11.76,
    profitInterval: 'three_monthly',
    maxInvestment: 5000000,
    lastUpdated: '2024-01-01'
  }
];

/**
 * Returns the hardcoded list of Sanchaypatra rate tables.
 * 
 * @returns Array of SanchaypatraRateTable.
 */
export function getSanchaypatraRates(): SanchaypatraRateTable[] {
  return SANCHAYPATRA_RATES;
}

/**
 * Retrieves the specific rate table for a given Sanchaypatra type.
 * 
 * @param type - The type of Sanchaypatra.
 * @returns The associated SanchaypatraRateTable.
 * @throws If type is not found.
 */
export function getRateForType(type: SanchaypatraType): SanchaypatraRateTable {
  const rate = SANCHAYPATRA_RATES.find(r => r.type === type);
  if (!rate) {
    throw new Error(`Sanchaypatra rate not found for type: ${type}`);
  }
  return rate;
}

/**
 * Calculates returns for a Sanchaypatra investment.
 * 
 * @param type - Type of Sanchaypatra.
 * @param investmentAmount - Principal amount in BDT.
 * @param sourceTaxPercent - Tax deducted at source percentage.
 * @param customRatePercent - Optional override for the standard rate.
 * @returns Detailed SanchaypatraCalculation object.
 */
export function calculateSanchaypatra(
  type: SanchaypatraType,
  investmentAmount: number,
  sourceTaxPercent: number,
  customRatePercent?: number
): SanchaypatraCalculation {
  const rateTable = getRateForType(type);
  const rate = customRatePercent ?? rateTable.annualRatePercent;
  
  let intervalsPerYear = 1;
  if (rateTable.profitInterval === 'monthly') intervalsPerYear = 12;
  if (rateTable.profitInterval === 'three_monthly') intervalsPerYear = 4;
  
  const principalCents = Math.round(investmentAmount * 100);
  
  let grossProfitPerIntervalCents = 0;
  if (rateTable.profitInterval === 'at_maturity') {
    grossProfitPerIntervalCents = Math.round(principalCents * (rate / 100) * rateTable.tenorYears);
  } else {
    grossProfitPerIntervalCents = Math.round(principalCents * (rate / (100 * intervalsPerYear)));
  }
  
  const taxDeductedCents = Math.round(grossProfitPerIntervalCents * (sourceTaxPercent / 100));
  const netProfitPerIntervalCents = grossProfitPerIntervalCents - taxDeductedCents;
  
  const totalIntervals = rateTable.profitInterval === 'at_maturity' ? 1 : rateTable.tenorYears * intervalsPerYear;
  
  const annualGrossProfitCents = rateTable.profitInterval === 'at_maturity' 
    ? Math.round(principalCents * (rate / 100)) 
    : grossProfitPerIntervalCents * intervalsPerYear;
    
  const annualNetProfitCents = rateTable.profitInterval === 'at_maturity'
    ? annualGrossProfitCents - Math.round(annualGrossProfitCents * (sourceTaxPercent / 100))
    : netProfitPerIntervalCents * intervalsPerYear;
    
  const totalGrossProfitCents = grossProfitPerIntervalCents * totalIntervals;
  const totalTaxDeductedCents = taxDeductedCents * totalIntervals;
  const totalNetProfitCents = netProfitPerIntervalCents * totalIntervals;
  
  const maturityValueCents = principalCents + totalNetProfitCents;
  const effectiveNetRate = rate * (100 - sourceTaxPercent) / 100;
  
  return {
    grossProfitPerInterval: grossProfitPerIntervalCents / 100,
    taxDeducted: taxDeductedCents / 100,
    netProfitPerInterval: netProfitPerIntervalCents / 100,
    annualGrossProfit: annualGrossProfitCents / 100,
    annualNetProfit: annualNetProfitCents / 100,
    totalGrossProfit: totalGrossProfitCents / 100,
    totalTaxDeducted: totalTaxDeductedCents / 100,
    totalNetProfit: totalNetProfitCents / 100,
    maturityValue: maturityValueCents / 100,
    effectiveNetRate
  };
}

/**
 * Generates the coupon schedule for Sanchaypatra payouts.
 * 
 * @param sanchaypatraId - Identifier.
 * @param type - Sanchaypatra type.
 * @param investmentAmount - Investment principal.
 * @param sourceTaxPercent - TDS percentage.
 * @param issueDate - Issue date.
 * @param customRatePercent - Optional rate override.
 * @returns Array of CouponScheduleEntry objects.
 */
export function generateCouponSchedule(
  sanchaypatraId: string,
  type: SanchaypatraType,
  investmentAmount: number,
  sourceTaxPercent: number,
  issueDate: Date,
  customRatePercent?: number
): CouponScheduleEntry[] {
  const rateTable = getRateForType(type);
  const calc = calculateSanchaypatra(type, investmentAmount, sourceTaxPercent, customRatePercent);
  
  const schedule: CouponScheduleEntry[] = [];
  const intervals = rateTable.profitInterval === 'at_maturity' 
    ? 1 
    : rateTable.profitInterval === 'monthly' ? rateTable.tenorYears * 12 : rateTable.tenorYears * 4;
    
  for (let i = 1; i <= intervals; i++) {
    const couponDate = new Date(issueDate);
    if (rateTable.profitInterval === 'monthly') {
      couponDate.setMonth(couponDate.getMonth() + i);
    } else if (rateTable.profitInterval === 'three_monthly') {
      couponDate.setMonth(couponDate.getMonth() + (i * 3));
    } else {
      couponDate.setFullYear(couponDate.getFullYear() + rateTable.tenorYears);
    }
    
    schedule.push({
      couponNumber: i,
      couponDate,
      grossAmount: calc.grossProfitPerInterval,
      taxDeducted: calc.taxDeducted,
      netAmount: calc.netProfitPerInterval,
      isCollected: false
    });
  }
  
  return schedule;
}

/**
 * Calculates countdown details for Sanchaypatra maturity.
 * 
 * @param maturityDate - Maturity date.
 * @param issueDate - Issue date.
 * @returns Reused FDRCountdown object.
 */
export function getSanchaypatraCountdown(maturityDate: Date, issueDate: Date): FDRCountdown {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const mDate = new Date(maturityDate);
  mDate.setHours(0, 0, 0, 0);
  
  const sDate = new Date(issueDate);
  sDate.setHours(0, 0, 0, 0);
  
  const timeDiff = mDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  
  const totalDuration = mDate.getTime() - sDate.getTime();
  const elapsed = today.getTime() - sDate.getTime();
  let percentageElapsed = (elapsed / totalDuration) * 100;
  
  if (percentageElapsed < 0) percentageElapsed = 0;
  if (percentageElapsed > 100) percentageElapsed = 100;
  
  let urgencyLevel: 'safe' | 'warning' | 'critical' = 'safe';
  if (daysRemaining <= 7) urgencyLevel = 'critical';
  else if (daysRemaining <= 21) urgencyLevel = 'warning';
  
  return {
    daysRemaining,
    weeksRemaining: Math.floor(daysRemaining / 7),
    maturityDate,
    isUrgent: daysRemaining <= 21,
    urgencyLevel,
    percentageElapsed: Math.round(percentageElapsed * 100) / 100
  };
}

/**
 * Validates if the given investment amount exceeds government limits.
 * 
 * @param type - Sanchaypatra type.
 * @param amount - Investment amount to validate.
 * @returns Object with validity status and message.
 */
export function validateInvestmentLimit(type: SanchaypatraType, amount: number): { valid: boolean; message: string } {
  const rateTable = getRateForType(type);
  if (rateTable.maxInvestment > 0 && amount > rateTable.maxInvestment) {
    return {
      valid: false,
      message: `Amount exceeds maximum limit of BDT ${rateTable.maxInvestment.toLocaleString('en-IN')} for ${rateTable.nameEn}`
    };
  }
  
  return { valid: true, message: 'Amount is within valid limits.' };
}
