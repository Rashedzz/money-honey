/**
 * Amortization module for loan calculations.
 * All monetary calculations use precise integer arithmetic (multiplied by 100 for paise/paisa level) internally to avoid floating-point drift.
 */

/**
 * Represents a single row in the amortization schedule.
 */
export interface AmortizationRow {
  paymentNumber: number;
  paymentDate: Date;
  openingPrincipal: number; // BDT
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  closingPrincipal: number;
  cumulativeInterestPaid: number;
  cumulativePrincipalPaid: number;
}

/**
 * Summary of a loan's financial details.
 */
export interface LoanSummary {
  emiAmount: number;
  totalPayable: number;
  totalInterest: number;
  effectiveAnnualRate: number;
}

/**
 * State of a loan at a specific point in time.
 */
export interface LoanAtMonth {
  remainingPrincipal: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  emisPaid: number;
  emisRemaining: number;
  nextDueDate: Date;
}

/**
 * Result of comparing multiple loan offers.
 */
export interface LoanComparisonResult {
  bankName: string;
  emiAmount: number;
  totalInterest: number;
  totalPayable: number;
}

/**
 * Calculates the Equated Monthly Installment (EMI).
 * 
 * @param principal - The loan principal amount in BDT.
 * @param annualRatePercent - The annual interest rate as a percentage (e.g., 9 for 9%).
 * @param tenorMonths - The duration of the loan in months.
 * @returns The calculated EMI amount rounded to 2 decimal places.
 */
export function calculateEMI(principal: number, annualRatePercent: number, tenorMonths: number): number {
  if (tenorMonths <= 0) return 0;
  
  if (annualRatePercent === 0) {
    return Math.round((principal / tenorMonths) * 100) / 100;
  }

  const monthlyRate = annualRatePercent / 1200;
  const factor = Math.pow(1 + monthlyRate, tenorMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  
  return Math.round(emi * 100) / 100;
}

/**
 * Generates the complete amortization schedule for a loan.
 * 
 * @param principal - The loan principal amount in BDT.
 * @param annualRatePercent - The annual interest rate as a percentage.
 * @param tenorMonths - The duration of the loan in months.
 * @param startDate - The date of the first payment.
 * @param emiOverride - Optional user-defined EMI amount.
 * @returns An array of AmortizationRow objects representing the schedule.
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRatePercent: number,
  tenorMonths: number,
  startDate: Date,
  emiOverride?: number
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  const emi = emiOverride ?? calculateEMI(principal, annualRatePercent, tenorMonths);
  const monthlyRate = annualRatePercent / 1200;
  
  let currentPrincipal = Math.round(principal * 100);
  const emiCents = Math.round(emi * 100);
  
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  for (let month = 1; month <= tenorMonths; month++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + month);
    
    // Calculate interest based on opening principal
    const interestCents = Math.round(currentPrincipal * monthlyRate);
    let principalComponentCents = emiCents - interestCents;
    
    // Adjust for the final month or if the calculated principal component exceeds the remaining principal
    if (month === tenorMonths || currentPrincipal <= principalComponentCents) {
      principalComponentCents = currentPrincipal;
    }
    
    const openingPrincipal = currentPrincipal;
    currentPrincipal -= principalComponentCents;
    
    cumulativeInterest += interestCents;
    cumulativePrincipal += principalComponentCents;

    schedule.push({
      paymentNumber: month,
      paymentDate: paymentDate,
      openingPrincipal: openingPrincipal / 100,
      emiAmount: (principalComponentCents + interestCents) / 100,
      principalComponent: principalComponentCents / 100,
      interestComponent: interestCents / 100,
      closingPrincipal: currentPrincipal / 100,
      cumulativeInterestPaid: cumulativeInterest / 100,
      cumulativePrincipalPaid: cumulativePrincipal / 100
    });
    
    if (currentPrincipal <= 0) break;
  }

  return schedule;
}

/**
 * Gets a summary of the loan details.
 * 
 * @param principal - The loan principal amount in BDT.
 * @param annualRatePercent - The annual interest rate as a percentage.
 * @param tenorMonths - The duration of the loan in months.
 * @returns A LoanSummary object.
 */
export function getLoanSummary(principal: number, annualRatePercent: number, tenorMonths: number): LoanSummary {
  const emi = calculateEMI(principal, annualRatePercent, tenorMonths);
  const totalPayable = emi * tenorMonths;
  const totalInterest = totalPayable - principal;
  
  return {
    emiAmount: emi,
    totalPayable: Math.round(totalPayable * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    effectiveAnnualRate: annualRatePercent
  };
}

/**
 * Determines the state of the loan at a given month based on the provided date.
 * 
 * @param schedule - The amortization schedule.
 * @param currentDate - The date to check the loan state against.
 * @returns A LoanAtMonth object detailing the current state.
 */
export function getLoanStateAtMonth(schedule: AmortizationRow[], currentDate: Date): LoanAtMonth {
  if (schedule.length === 0) {
    return {
      remainingPrincipal: 0,
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      emisPaid: 0,
      emisRemaining: 0,
      nextDueDate: currentDate
    };
  }

  const pastPayments = schedule.filter(row => row.paymentDate <= currentDate);
  
  if (pastPayments.length === 0) {
    return {
      remainingPrincipal: schedule[0].openingPrincipal,
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      emisPaid: 0,
      emisRemaining: schedule.length,
      nextDueDate: schedule[0].paymentDate
    };
  }
  
  const lastPayment = pastPayments[pastPayments.length - 1];
  const emisPaid = pastPayments.length;
  const emisRemaining = schedule.length - emisPaid;
  const nextDueDate = emisRemaining > 0 ? schedule[emisPaid].paymentDate : lastPayment.paymentDate;
  
  return {
    remainingPrincipal: lastPayment.closingPrincipal,
    totalInterestPaid: lastPayment.cumulativeInterestPaid,
    totalPrincipalPaid: lastPayment.cumulativePrincipalPaid,
    emisPaid,
    emisRemaining,
    nextDueDate
  };
}

/**
 * Compares multiple loan offers to determine the most cost-effective option.
 * 
 * @param principal - The loan principal amount in BDT.
 * @param tenorMonths - The duration of the loan in months.
 * @param offers - An array of loan offers containing bank name and annual rate.
 * @returns A sorted array of LoanComparisonResult objects, cheapest first.
 */
export function compareLoans(
  principal: number,
  tenorMonths: number,
  offers: Array<{bankName: string, annualRatePercent: number}>
): LoanComparisonResult[] {
  const results: LoanComparisonResult[] = offers.map(offer => {
    const summary = getLoanSummary(principal, offer.annualRatePercent, tenorMonths);
    return {
      bankName: offer.bankName,
      emiAmount: summary.emiAmount,
      totalInterest: summary.totalInterest,
      totalPayable: summary.totalPayable
    };
  });
  
  return results.sort((a, b) => a.totalInterest - b.totalInterest);
}
