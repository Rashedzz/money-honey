/**
 * Net Worth and Cash Flow Projection module.
 */

export interface AccountBalance {
  accountId: string;
  accountName: string;
  bankName: string;
  balance: number;
  accountType: string;
}

export interface InvestmentValue {
  id: string;
  name: string;
  type: 'fdr' | 'sanchaypatra';
  principalInvested: number;
  currentValue: number; // principal + accrued interest to date
  maturityDate: Date;
}

export interface LoanLiability {
  loanId: string;
  title: string;
  outstandingPrincipal: number;
  emiAmount: number;
  nextDueDate: Date;
}

export interface NetWorthSnapshot {
  totalBankBalance: number;
  totalFDRValue: number;
  totalSanchaypatraValue: number;
  totalInvestments: number;
  totalLoanLiabilities: number;
  netWorth: number;  // assets - liabilities
  assetAllocation: {
    cash: number;           // % of total assets
    fixedDeposits: number;  // %
    savings: number;        // % (Sanchaypatra)
  };
  calculatedAt: Date;
}

export interface MonthlyCashFlowProjection {
  month: string; // 'YYYY-MM'
  projectedIncome: {
    salary: number;
    fdrReturns: number;
    sanchaypatraCoupons: number;
    other: number;
    total: number;
  };
  projectedExpenses: {
    emis: number;
    recurringBills: number;
    budgetedExpenses: number;
    total: number;
  };
  netCashFlow: number;
  savingsRate: number; // %
}

/**
 * Calculates current net worth snapshot from accounts, investments, and loans.
 * 
 * @param accounts - Array of bank account balances.
 * @param investments - Array of investment assets.
 * @param loans - Array of loan liabilities.
 * @returns A NetWorthSnapshot detailing assets and liabilities.
 */
export function calculateNetWorth(
  accounts: AccountBalance[],
  investments: InvestmentValue[],
  loans: LoanLiability[]
): NetWorthSnapshot {
  let totalBankBalance = 0;
  accounts.forEach(acc => totalBankBalance += acc.balance);
  
  let totalFDRValue = 0;
  let totalSanchaypatraValue = 0;
  
  investments.forEach(inv => {
    if (inv.type === 'fdr') totalFDRValue += inv.currentValue;
    else if (inv.type === 'sanchaypatra') totalSanchaypatraValue += inv.currentValue;
  });
  
  const totalInvestments = totalFDRValue + totalSanchaypatraValue;
  const totalAssets = totalBankBalance + totalInvestments;
  
  let totalLoanLiabilities = 0;
  loans.forEach(loan => totalLoanLiabilities += loan.outstandingPrincipal);
  
  const netWorth = totalAssets - totalLoanLiabilities;
  
  let cashPercent = 0, fdrPercent = 0, savingsPercent = 0;
  if (totalAssets > 0) {
    cashPercent = (totalBankBalance / totalAssets) * 100;
    fdrPercent = (totalFDRValue / totalAssets) * 100;
    savingsPercent = (totalSanchaypatraValue / totalAssets) * 100;
  }
  
  return {
    totalBankBalance,
    totalFDRValue,
    totalSanchaypatraValue,
    totalInvestments,
    totalLoanLiabilities,
    netWorth,
    assetAllocation: {
      cash: Math.round(cashPercent * 100) / 100,
      fixedDeposits: Math.round(fdrPercent * 100) / 100,
      savings: Math.round(savingsPercent * 100) / 100
    },
    calculatedAt: new Date()
  };
}

/**
 * Calculates accrued value of an FDR up to today.
 * 
 * @param principal - Investment principal.
 * @param annualRatePercent - Annual interest rate.
 * @param sourceTaxPercent - TDS percentage.
 * @param startDate - Date the FDR was opened.
 * @returns Current net accrued value of the FDR.
 */
export function calculateCurrentFDRValue(
  principal: number,
  annualRatePercent: number,
  sourceTaxPercent: number,
  startDate: Date
): number {
  const today = new Date();
  if (today < startDate) return principal;
  
  const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  if (daysDiff <= 0) return principal;
  
  // Simplified daily simple interest calculation
  const dailyRate = (annualRatePercent / 100) / 365;
  const grossInterest = principal * dailyRate * daysDiff;
  const taxDeducted = grossInterest * (sourceTaxPercent / 100);
  const netInterest = grossInterest - taxDeducted;
  
  return Math.round((principal + netInterest) * 100) / 100;
}

/**
 * Calculates accrued value of a Sanchaypatra up to today.
 * 
 * @param investmentAmount - Investment principal.
 * @param annualRatePercent - Annual profit rate.
 * @param sourceTaxPercent - TDS percentage.
 * @param issueDate - Issue date.
 * @returns Current net accrued value of the Sanchaypatra.
 */
export function calculateCurrentSanchaypatraValue(
  investmentAmount: number,
  annualRatePercent: number,
  sourceTaxPercent: number,
  issueDate: Date
): number {
  const today = new Date();
  if (today < issueDate) return investmentAmount;
  
  const daysDiff = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 3600 * 24));
  if (daysDiff <= 0) return investmentAmount;
  
  const dailyRate = (annualRatePercent / 100) / 365;
  const grossInterest = investmentAmount * dailyRate * daysDiff;
  const taxDeducted = grossInterest * (sourceTaxPercent / 100);
  const netInterest = grossInterest - taxDeducted;
  
  return Math.round((investmentAmount + netInterest) * 100) / 100;
}

/**
 * Projects monthly cash flows forward for a specified number of months.
 * 
 * @param params - Income and expense parameters for projection.
 * @param monthsAhead - Number of months to project forward.
 * @returns Array of MonthlyCashFlowProjection objects.
 */
export function projectMonthlyCashFlow(
  params: {
    salaryPerMonth: number;
    fdrMonthlyReturns: number;
    sanchaypatraMonthlyReturns: number;
    otherIncome: number;
    totalEMIs: number;
    recurringBills: number;
    budgetedExpenses: number;
  },
  monthsAhead: number
): MonthlyCashFlowProjection[] {
  const projections: MonthlyCashFlowProjection[] = [];
  const today = new Date();
  
  const totalIncome = params.salaryPerMonth + params.fdrMonthlyReturns + params.sanchaypatraMonthlyReturns + params.otherIncome;
  const totalExpenses = params.totalEMIs + params.recurringBills + params.budgetedExpenses;
  const netCashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;
  
  for (let i = 0; i < monthsAhead; i++) {
    const projectionDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthString = `${projectionDate.getFullYear()}-${String(projectionDate.getMonth() + 1).padStart(2, '0')}`;
    
    projections.push({
      month: monthString,
      projectedIncome: {
        salary: params.salaryPerMonth,
        fdrReturns: params.fdrMonthlyReturns,
        sanchaypatraCoupons: params.sanchaypatraMonthlyReturns,
        other: params.otherIncome,
        total: totalIncome
      },
      projectedExpenses: {
        emis: params.totalEMIs,
        recurringBills: params.recurringBills,
        budgetedExpenses: params.budgetedExpenses,
        total: totalExpenses
      },
      netCashFlow: netCashFlow,
      savingsRate: Math.round(savingsRate * 100) / 100
    });
  }
  
  return projections;
}

/**
 * Formats a number to Bangladesh currency standard (BDT / Tk).
 * Groups by 2 for lakhs and crores, with thousands grouped by 3.
 * 
 * @param amount - Numeric amount to format.
 * @param showDecimals - Whether to append decimal values (.00).
 * @returns Formatted BDT string (e.g. '৳ 1,23,456.78').
 */
export function formatBDT(amount: number, showDecimals: boolean = true): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Extract integer and decimal parts
  const integerPart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - integerPart) * 100);
  
  let str = integerPart.toString();
  
  // 100,000 becomes 1,00,000
  // Apply grouping for South Asian Numbering System
  if (str.length > 3) {
    const lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    str = formattedOtherNumbers + "," + lastThree;
  }
  
  let finalString = `৳ ${str}`;
  
  if (showDecimals) {
    finalString += `.${decimalPart.toString().padStart(2, '0')}`;
  }
  
  if (isNegative) {
    finalString = `- ${finalString}`;
  }
  
  return finalString;
}
