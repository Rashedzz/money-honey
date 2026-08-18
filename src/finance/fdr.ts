/**
 * FDR (Fixed Deposit Receipt) calculation module.
 * Precise monetary calculations use integer math internally.
 */

/**
 * Details of an FDR calculation.
 */
export interface FDRCalculation {
  grossMonthlyInterest: number;
  taxDeducted: number;
  netMonthlyReturn: number;
  grossAnnualInterest: number;
  netAnnualReturn: number;
  grossMaturityValue: number;
  netMaturityValue: number;
  effectiveNetRate: number; // after tax
}

/**
 * Countdown state for FDR maturity.
 */
export interface FDRCountdown {
  daysRemaining: number;
  weeksRemaining: number;
  maturityDate: Date;
  isUrgent: boolean;
  urgencyLevel: 'safe' | 'warning' | 'critical'; // >21d | 8-21d | <=7d
  percentageElapsed: number; // 0-100
}

/**
 * Schedule for FDR disbursements.
 */
export interface FDRDisbursementSchedule {
  disbursementNumber: number;
  disbursementDate: Date;
  grossAmount: number;
  taxDeducted: number;
  netAmount: number;
}

/**
 * Calculates Fixed Deposit returns based on standard banking formulas.
 * 
 * @param principal - The initial deposit amount.
 * @param annualRatePercent - The annual interest rate percentage.
 * @param tenorMonths - The deposit duration in months.
 * @param sourceTaxPercent - The tax percentage deducted at source (TDS).
 * @param payoutFrequency - How often interest is paid out.
 * @returns An FDRCalculation object detailing the returns.
 */
export function calculateFDR(
  principal: number,
  annualRatePercent: number,
  tenorMonths: number,
  sourceTaxPercent: number,
  payoutFrequency: 'monthly' | 'at_maturity'
): FDRCalculation {
  const principalCents = Math.round(principal * 100);
  
  // Monthly simple interest
  const grossMonthlyInterestCents = Math.round(principalCents * (annualRatePercent / 1200));
  const taxDeductedMonthlyCents = Math.round(grossMonthlyInterestCents * (sourceTaxPercent / 100));
  const netMonthlyReturnCents = grossMonthlyInterestCents - taxDeductedMonthlyCents;
  
  const grossAnnualInterestCents = grossMonthlyInterestCents * 12;
  const netAnnualReturnCents = netMonthlyReturnCents * 12;
  
  const totalGrossInterestCents = grossMonthlyInterestCents * tenorMonths;
  const totalNetInterestCents = netMonthlyReturnCents * tenorMonths;
  
  const grossMaturityValueCents = principalCents + totalGrossInterestCents;
  const netMaturityValueCents = principalCents + totalNetInterestCents;
  
  const effectiveNetRate = (annualRatePercent * (100 - sourceTaxPercent)) / 100;
  
  return {
    grossMonthlyInterest: grossMonthlyInterestCents / 100,
    taxDeducted: taxDeductedMonthlyCents / 100,
    netMonthlyReturn: netMonthlyReturnCents / 100,
    grossAnnualInterest: grossAnnualInterestCents / 100,
    netAnnualReturn: netAnnualReturnCents / 100,
    grossMaturityValue: grossMaturityValueCents / 100,
    netMaturityValue: netMaturityValueCents / 100,
    effectiveNetRate
  };
}

/**
 * Generates the disbursement schedule for an FDR.
 * 
 * @param fdrId - Identifier for the FDR.
 * @param principal - The initial deposit amount.
 * @param annualRatePercent - The annual interest rate percentage.
 * @param tenorMonths - The duration in months.
 * @param sourceTaxPercent - The tax percentage deducted at source (TDS).
 * @param startDate - The starting date of the FDR.
 * @param payoutFrequency - How often interest is paid out.
 * @returns An array of FDRDisbursementSchedule representing payout events.
 */
export function generateFDRDisbursementSchedule(
  fdrId: string,
  principal: number,
  annualRatePercent: number,
  tenorMonths: number,
  sourceTaxPercent: number,
  startDate: Date,
  payoutFrequency: 'monthly' | 'at_maturity'
): FDRDisbursementSchedule[] {
  const schedule: FDRDisbursementSchedule[] = [];
  const calc = calculateFDR(principal, annualRatePercent, tenorMonths, sourceTaxPercent, payoutFrequency);
  
  if (payoutFrequency === 'monthly') {
    for (let month = 1; month <= tenorMonths; month++) {
      const disbursementDate = new Date(startDate);
      disbursementDate.setMonth(disbursementDate.getMonth() + month);
      
      schedule.push({
        disbursementNumber: month,
        disbursementDate,
        grossAmount: calc.grossMonthlyInterest,
        taxDeducted: calc.taxDeducted,
        netAmount: calc.netMonthlyReturn
      });
    }
  } else {
    // at_maturity
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(maturityDate.getMonth() + tenorMonths);
    
    schedule.push({
      disbursementNumber: 1,
      disbursementDate: maturityDate,
      grossAmount: calc.grossMonthlyInterest * tenorMonths,
      taxDeducted: calc.taxDeducted * tenorMonths,
      netAmount: calc.netMonthlyReturn * tenorMonths
    });
  }
  
  return schedule;
}

/**
 * Calculates a countdown and urgency state for an FDR maturity date.
 * 
 * @param maturityDate - The date the FDR matures.
 * @param startDate - The date the FDR was initiated.
 * @returns An FDRCountdown object detailing time remaining.
 */
export function getFDRCountdown(maturityDate: Date, startDate: Date): FDRCountdown {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const mDate = new Date(maturityDate);
  mDate.setHours(0, 0, 0, 0);
  
  const sDate = new Date(startDate);
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
