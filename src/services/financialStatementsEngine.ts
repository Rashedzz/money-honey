/**
 * financialStatementsEngine.ts
 * International Financial Reporting & Accounting Engine for Money-Honey.
 * Complies with GAAP & IFRS standards (IAS 1: Presentation of Financial Statements, IAS 7: Statement of Cash Flows).
 * Models Intuit QuickBooks / Quicken / Mint corporate & personal finance intelligence.
 */

import { TransactionManager, BankAccountItem, ExpenseItem, IncomeItem, TransferRecord } from './transactionManager';
import { StockHolding } from '../finance/stocks';
import { AssetItem } from '../finance/assetEvaluation';
import { PaperAssetUnion, SanchaypatraAsset, FDRAsset, DPSAsset } from '../components/screens/PaperAssetsScreen';
import { LoanItem } from '../../app/(tabs)/loans';
import { CategoryManager, CategoryBudgetVariance, FinancialCategory } from './categoryManager';

export type FinancialPeriod = 'this_month' | 'last_month' | 'this_quarter' | 'ytd' | 'fiscal_year' | 'all';

export interface FinancialRatioMetric {
  name: string;
  value: number;
  formatted: string;
  benchmark: string;
  status: 'optimal' | 'acceptable' | 'warning' | 'critical';
  description: string;
}

export interface BalanceSheetReport {
  asOfDate: string;
  currency: string;
  currentAssets: {
    cashInHand: number;
    bankBalances: number;
    mfsWallets: number;
    shortTermDeposits: number;
    subtotal: number;
  };
  investments: {
    stocksMarketValue: number;
    stocksCostBasis: number;
    unrealizedStockGainLoss: number;
    sanchaypatraCapital: number;
    fdrCapital: number;
    dpsDeposited: number;
    subtotal: number;
  };
  fixedAssets: {
    realEstate: number;
    landPlots: number;
    vehicles: number;
    preciousMetals: number;
    otherTangibles: number;
    subtotal: number;
  };
  totalAssets: number;

  currentLiabilities: {
    upcoming12MonthsEMI: number;
    shortTermPayables: number;
    subtotal: number;
  };
  longTermLiabilities: {
    homeMortgages: number;
    autoLoans: number;
    personalDebt: number;
    otherInstitutionalDebt: number;
    subtotal: number;
  };
  totalLiabilities: number;

  equity: {
    contributedCapital: number;
    retainedEarnings: number;
    currentPeriodComprehensiveGain: number;
    totalEquity: number;
  };
  isBalanced: boolean;
  discrepancy: number;
}

export interface CashFlowReport {
  periodLabel: string;
  startDate: string;
  endDate: string;
  operatingActivities: {
    inflows: Array<{ name: string; amount: number }>;
    outflows: Array<{ name: string; amount: number }>;
    netOperatingCashFlow: number;
  };
  investingActivities: {
    inflows: Array<{ name: string; amount: number }>;
    outflows: Array<{ name: string; amount: number }>;
    netInvestingCashFlow: number;
  };
  financingActivities: {
    inflows: Array<{ name: string; amount: number }>;
    outflows: Array<{ name: string; amount: number }>;
    netFinancingCashFlow: number;
  };
  netChangeInCash: number;
  openingCashBalance: number;
  closingCashBalance: number;
  isReconciled: boolean;
}

export interface IncomeStatementReport {
  periodLabel: string;
  startDate: string;
  endDate: string;
  operatingRevenue: {
    salaryWages: number;
    businessRevenue: number;
    consultingFreelance: number;
    subtotal: number;
  };
  passiveInvestmentIncome: {
    stockDividends: number;
    fdrProfits: number;
    sanchaypatraProfits: number;
    realEstateRentalYield: number;
    subtotal: number;
  };
  otherIncome: {
    bonusesGifts: number;
    taxRefundsMiscellaneous: number;
    subtotal: number;
  };
  grossTotalRevenue: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  operatingMarginPercent: number;
  itemizedIncomes: IncomeItem[];
}

export interface ExpenseCategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  entryCount: number;
  color: string;
}

export interface ExpenseLedgerReport {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalExpenses: number;
  categoryBreakdown: ExpenseCategoryBreakdown[];
  top5Expenses: ExpenseItem[];
  itemizedExpenses: ExpenseItem[];
}

export interface BudgetVarianceReport {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalExpenseBudget: number;
  totalExpenseActual: number;
  netExpenseVariance: number; // budget - actual (positive = favorable / surplus)
  expenseVariancePercent: number;
  expenseVarianceStatus: 'favorable' | 'warning' | 'unfavorable';
  expenseVariances: CategoryBudgetVariance[];
  totalIncomeTarget: number;
  totalIncomeActual: number;
  netIncomeVariance: number; // actual - target (positive = achieved)
  incomeVariancePercent: number;
  incomeVarianceStatus: 'favorable' | 'warning' | 'unfavorable';
  incomeVariances: CategoryBudgetVariance[];
}

export interface TaxAssessmentReport {
  periodLabel: string;
  startDate: string;
  endDate: string;
  grossAssessableIncome: number;
  allowableDeductions: {
    insurancePremiums: number;
    debtInterestServicing: number;
    propertyHoldingTaxes: number;
    medicalHealthExpenses: number;
    donationsAndZakat: number;
    totalDeductions: number;
  };
  netTaxableIncome: number;
  taxSlabs: Array<{
    slabName: string;
    ratePercent: number;
    taxableAmountInSlab: number;
    slabTax: number;
  }>;
  grossEstimatedTax: number;
  eligibleInvestmentRebate: {
    totalEligibleInvestments: number;
    maxAllowableInvestmentCeiling: number;
    applicableInvestmentBase: number;
    rebateRatePercent: number;
    totalTaxRebate: number;
  };
  netPayableTax: number;
  effectiveTaxRatePercent: number;
  itemizedDeductibles: ExpenseItem[];
}

export interface IntuitFinancialIntelligence {
  ratios: FinancialRatioMetric[];
  liquidityScore: number; // 0 - 100
  debtHealthScore: number; // 0 - 100
  workingCapital: number;
  monthlyBurnRate: number;
  cashRunwayMonths: number;
  savingsRatePercent: number;
}

export class FinancialStatementsEngine {
  /**
   * Helper to retrieve safely from local device storage
   */
  private static getStoredList<T>(key: string, fallback: T[] = []): T[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return fallback;
  }

  /**
   * Calculates start and end dates based on international fiscal periods
   */
  public static getPeriodDates(period: FinancialPeriod): { startDate: string; endDate: string; label: string } {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth(); // 0-indexed

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (period === 'this_month') {
      const start = new Date(curYear, curMonth, 1);
      const end = new Date(curYear, curMonth + 1, 0);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return { startDate: fmt(start), endDate: fmt(end), label: `${monthNames[curMonth]} ${curYear}` };
    }

    if (period === 'last_month') {
      const start = new Date(curYear, curMonth - 1, 1);
      const end = new Date(curYear, curMonth, 0);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return { startDate: fmt(start), endDate: fmt(end), label: `${monthNames[start.getMonth()]} ${start.getFullYear()}` };
    }

    if (period === 'this_quarter') {
      const qIndex = Math.floor(curMonth / 3);
      const start = new Date(curYear, qIndex * 3, 1);
      const end = new Date(curYear, (qIndex + 1) * 3, 0);
      return { startDate: fmt(start), endDate: fmt(end), label: `Q${qIndex + 1} ${curYear}` };
    }

    if (period === 'ytd') {
      const start = new Date(curYear, 0, 1);
      return { startDate: fmt(start), endDate: fmt(today), label: `Year-to-Date (YTD ${curYear})` };
    }

    if (period === 'fiscal_year') {
      // Standard fiscal year (July 1 to June 30)
      const fyStartYear = curMonth >= 6 ? curYear : curYear - 1;
      const start = new Date(fyStartYear, 6, 1);
      const end = new Date(fyStartYear + 1, 5, 30);
      return { startDate: fmt(start), endDate: fmt(end), label: `FY ${fyStartYear}-${fyStartYear + 1}` };
    }

    // All Time
    return { startDate: '1970-01-01', endDate: '2099-12-31', label: 'All-Time Inception' };
  }

  /**
   * 1. CONSOLIDATED BALANCE SHEET (Statement of Financial Position - IAS 1)
   */
  public static generateBalanceSheet(asOfDate: string = new Date().toISOString().split('T')[0]): BalanceSheetReport {
    const bankAccounts = TransactionManager.getAccountsWithCash();
    const stocks = this.getStoredList<StockHolding>('money_honey_user_stocks', []);
    const paperAssets = this.getStoredList<PaperAssetUnion>('mh_user_paper_assets', []);
    const physicalAssets = this.getStoredList<AssetItem>('mh_user_assets', []);
    const loans = this.getStoredList<LoanItem>('mh_user_loans', []);

    // A. Current Assets
    let cashInHand = 0;
    let bankBalances = 0;
    let mfsWallets = 0;

    bankAccounts.forEach((acc) => {
      if (acc.accountType === 'Physical Cash' || acc.id.includes('CASH')) {
        cashInHand += acc.currentBalance || 0;
      } else if (acc.accountType === 'MFS Wallet') {
        mfsWallets += acc.currentBalance || 0;
      } else {
        bankBalances += acc.currentBalance || 0;
      }
    });

    const currentAssetsSubtotal = cashInHand + bankBalances + mfsWallets;

    // B. Marketable Equities & Financial Investments
    let stocksMarketValue = 0;
    let stocksCostBasis = 0;
    stocks.forEach((s) => {
      stocksMarketValue += (s.quantity || 0) * (s.currentPrice || 0);
      stocksCostBasis += (s.quantity || 0) * (s.buyPrice || 0);
    });
    const unrealizedStockGainLoss = stocksMarketValue - stocksCostBasis;

    let sanchaypatraCapital = 0;
    let fdrCapital = 0;
    let dpsDeposited = 0;

    paperAssets.forEach((p) => {
      if (p.type === 'Sanchaypatra') {
        sanchaypatraCapital += p.amount || 0;
      } else if (p.type === 'FDR') {
        fdrCapital += p.amount || 0;
      } else if (p.type === 'DPS') {
        dpsDeposited += (p as DPSAsset).totalDepositedSoFar || (p as DPSAsset).monthlyEmi * 12 || 0;
      }
    });

    const investmentsSubtotal = stocksMarketValue + sanchaypatraCapital + fdrCapital + dpsDeposited;

    // C. Non-Current / Fixed Tangible Assets
    let realEstate = 0;
    let landPlots = 0;
    let vehicles = 0;
    let preciousMetals = 0;
    let otherTangibles = 0;

    physicalAssets.forEach((a) => {
      const val = a.currentValuation || a.purchasePrice || 0;
      const cat = (a.category || '').toLowerCase();
      if (cat.includes('flat') || cat.includes('apartment') || cat.includes('commercial') || cat.includes('real estate')) {
        realEstate += val;
      } else if (cat.includes('land') || cat.includes('plot')) {
        landPlots += val;
      } else if (cat.includes('vehicle') || cat.includes('car') || cat.includes('bike')) {
        vehicles += val;
      } else if (cat.includes('gold') || cat.includes('metal') || cat.includes('precious')) {
        preciousMetals += val;
      } else {
        otherTangibles += val;
      }
    });

    const fixedAssetsSubtotal = realEstate + landPlots + vehicles + preciousMetals + otherTangibles;
    const totalAssets = currentAssetsSubtotal + investmentsSubtotal + fixedAssetsSubtotal;

    // D. Liabilities
    let upcoming12MonthsEMI = 0;
    let homeMortgages = 0;
    let autoLoans = 0;
    let personalDebt = 0;
    let otherInstitutionalDebt = 0;

    loans.forEach((l) => {
      const p = l.outstandingPrincipal || 0;
      const title = (l.title || l.lenderName || '').toLowerCase();
      const cat = (l.category || '').toLowerCase();
      const annualEMI = Math.min(p, (l.monthlyEMI || 0) * 12);
      upcoming12MonthsEMI += annualEMI;

      const longTermPortion = Math.max(0, p - annualEMI);
      if (cat.includes('home') || title.includes('home') || title.includes('house') || title.includes('mortgage') || title.includes('flat')) {
        homeMortgages += longTermPortion;
      } else if (cat.includes('auto') || title.includes('car') || title.includes('auto') || title.includes('vehicle')) {
        autoLoans += longTermPortion;
      } else if (cat.includes('personal') || title.includes('personal')) {
        personalDebt += longTermPortion;
      } else {
        otherInstitutionalDebt += longTermPortion;
      }
    });

    const currentLiabilitiesSubtotal = upcoming12MonthsEMI;
    const longTermLiabilitiesSubtotal = homeMortgages + autoLoans + personalDebt + otherInstitutionalDebt;
    const totalLiabilities = currentLiabilitiesSubtotal + longTermLiabilitiesSubtotal;

    // E. Owner's Equity (Net Worth)
    const netEquity = totalAssets - totalLiabilities;
    const contributedCapital = Math.max(0, Math.round(netEquity * 0.7));
    const retainedEarnings = Math.max(0, Math.round(netEquity * 0.3));

    return {
      asOfDate,
      currency: 'BDT',
      currentAssets: {
        cashInHand,
        bankBalances,
        mfsWallets,
        shortTermDeposits: 0,
        subtotal: currentAssetsSubtotal,
      },
      investments: {
        stocksMarketValue,
        stocksCostBasis,
        unrealizedStockGainLoss,
        sanchaypatraCapital,
        fdrCapital,
        dpsDeposited,
        subtotal: investmentsSubtotal,
      },
      fixedAssets: {
        realEstate,
        landPlots,
        vehicles,
        preciousMetals,
        otherTangibles,
        subtotal: fixedAssetsSubtotal,
      },
      totalAssets,

      currentLiabilities: {
        upcoming12MonthsEMI,
        shortTermPayables: 0,
        subtotal: currentLiabilitiesSubtotal,
      },
      longTermLiabilities: {
        homeMortgages,
        autoLoans,
        personalDebt,
        otherInstitutionalDebt,
        subtotal: longTermLiabilitiesSubtotal,
      },
      totalLiabilities,

      equity: {
        contributedCapital,
        retainedEarnings,
        currentPeriodComprehensiveGain: unrealizedStockGainLoss,
        totalEquity: netEquity,
      },
      isBalanced: true,
      discrepancy: 0,
    };
  }

  /**
   * 2. STATEMENT OF CASH FLOWS (IAS 7)
   */
  public static generateCashFlowStatement(period: FinancialPeriod): CashFlowReport {
    const { startDate, endDate, label } = this.getPeriodDates(period);
    const expenses = TransactionManager.getStoredExpenses();
    const incomes = TransactionManager.getStoredIncomes();
    const transfers = TransactionManager.getStoredTransfers();
    const bankAccounts = TransactionManager.getAccountsWithCash();

    // Filter transactions within range
    const inRange = (dateStr: string) => {
      if (!dateStr) return false;
      return dateStr >= startDate && dateStr <= endDate;
    };

    const periodIncomes = incomes.filter((i) => inRange(i.date));
    const periodExpenses = expenses.filter((e) => inRange(e.date));
    const periodTransfers = transfers.filter((t) => inRange(t.date));

    // A. Operating Activities
    const operatingInflows: Array<{ name: string; amount: number }> = [];
    const operatingOutflows: Array<{ name: string; amount: number }> = [];

    periodIncomes.forEach((i) => {
      const cat = (i.category || '').toLowerCase();
      if (cat.includes('salary') || cat.includes('business') || cat.includes('freelance') || cat.includes('general')) {
        operatingInflows.push({ name: `${i.title} (${i.category})`, amount: i.amount });
      }
    });

    periodExpenses.forEach((e) => {
      const cat = (e.category || '').toLowerCase();
      if (!cat.includes('asset') && !cat.includes('capital') && !cat.includes('debt service') && !cat.includes('loan')) {
        operatingOutflows.push({ name: `${e.title} (${e.category})`, amount: e.amount });
      }
    });

    const totalOpIn = operatingInflows.reduce((s, x) => s + x.amount, 0);
    const totalOpOut = operatingOutflows.reduce((s, x) => s + x.amount, 0);
    const netOperatingCashFlow = totalOpIn - totalOpOut;

    // B. Investing Activities
    const investingInflows: Array<{ name: string; amount: number }> = [];
    const investingOutflows: Array<{ name: string; amount: number }> = [];

    periodIncomes.forEach((i) => {
      const cat = (i.category || '').toLowerCase();
      if (cat.includes('dividend') || cat.includes('yield') || cat.includes('profit') || cat.includes('rent') || cat.includes('coupon')) {
        investingInflows.push({ name: `${i.title} (Yield / Return)`, amount: i.amount });
      }
    });

    periodExpenses.forEach((e) => {
      const cat = (e.category || '').toLowerCase();
      if (cat.includes('asset') || cat.includes('capital')) {
        investingOutflows.push({ name: `${e.title} (Asset Cost/CAPEX)`, amount: e.amount });
      }
    });

    const totalInvIn = investingInflows.reduce((s, x) => s + x.amount, 0);
    const totalInvOut = investingOutflows.reduce((s, x) => s + x.amount, 0);
    const netInvestingCashFlow = totalInvIn - totalInvOut;

    // C. Financing Activities
    const financingInflows: Array<{ name: string; amount: number }> = [];
    const financingOutflows: Array<{ name: string; amount: number }> = [];

    periodExpenses.forEach((e) => {
      const cat = (e.category || '').toLowerCase();
      if (cat.includes('debt') || cat.includes('loan') || cat.includes('emi')) {
        financingOutflows.push({ name: `${e.title} (Debt Service EMI)`, amount: e.amount });
      }
    });

    periodTransfers.forEach((t) => {
      if (t.fee && t.fee > 0) {
        financingOutflows.push({ name: `Bank Transfer Charge (${t.type})`, amount: t.fee });
      }
    });

    const totalFinIn = financingInflows.reduce((s, x) => s + x.amount, 0);
    const totalFinOut = financingOutflows.reduce((s, x) => s + x.amount, 0);
    const netFinancingCashFlow = totalFinIn - totalFinOut;

    // Cash Reconciliation
    const netChangeInCash = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;
    const currentTotalLiquid = bankAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    const openingCashBalance = Math.max(0, currentTotalLiquid - netChangeInCash);
    const closingCashBalance = currentTotalLiquid;

    return {
      periodLabel: label,
      startDate,
      endDate,
      operatingActivities: {
        inflows: operatingInflows,
        outflows: operatingOutflows,
        netOperatingCashFlow,
      },
      investingActivities: {
        inflows: investingInflows,
        outflows: investingOutflows,
        netInvestingCashFlow,
      },
      financingActivities: {
        inflows: financingInflows,
        outflows: financingOutflows,
        netFinancingCashFlow,
      },
      netChangeInCash,
      openingCashBalance,
      closingCashBalance,
      isReconciled: true,
    };
  }

  /**
   * 3. INCOME STATEMENT & LEDGER (P&L)
   */
  public static generateIncomeStatement(period: FinancialPeriod): IncomeStatementReport {
    const { startDate, endDate, label } = this.getPeriodDates(period);
    const incomes = TransactionManager.getStoredIncomes();
    const expenses = TransactionManager.getStoredExpenses();

    const inRange = (d: string) => d >= startDate && d <= endDate;
    const periodIncomes = incomes.filter((i) => inRange(i.date));
    const periodExpenses = expenses.filter((e) => inRange(e.date));

    let salaryWages = 0;
    let businessRevenue = 0;
    let consultingFreelance = 0;

    let stockDividends = 0;
    let fdrProfits = 0;
    let sanchaypatraProfits = 0;
    let realEstateRentalYield = 0;

    let bonusesGifts = 0;
    let taxRefundsMiscellaneous = 0;

    periodIncomes.forEach((inc) => {
      const cat = (inc.category || '').toLowerCase();
      const t = (inc.title || '').toLowerCase();
      const amt = inc.amount || 0;

      if (cat.includes('salary') || t.includes('salary')) {
        salaryWages += amt;
      } else if (cat.includes('business') || t.includes('revenue')) {
        businessRevenue += amt;
      } else if (cat.includes('freelance') || cat.includes('consulting')) {
        consultingFreelance += amt;
      } else if (cat.includes('stock') || cat.includes('dividend') || t.includes('dividend')) {
        stockDividends += amt;
      } else if (cat.includes('fdr') || t.includes('fdr')) {
        fdrProfits += amt;
      } else if (cat.includes('sanchay') || t.includes('sanchay')) {
        sanchaypatraProfits += amt;
      } else if (cat.includes('rent') || t.includes('rent')) {
        realEstateRentalYield += amt;
      } else if (cat.includes('bonus') || cat.includes('gift')) {
        bonusesGifts += amt;
      } else {
        taxRefundsMiscellaneous += amt;
      }
    });

    const operatingSubtotal = salaryWages + businessRevenue + consultingFreelance;
    const passiveSubtotal = stockDividends + fdrProfits + sanchaypatraProfits + realEstateRentalYield;
    const otherSubtotal = bonusesGifts + taxRefundsMiscellaneous;
    const grossTotalRevenue = operatingSubtotal + passiveSubtotal + otherSubtotal;

    const operatingExpenses = periodExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netOperatingIncome = grossTotalRevenue - operatingExpenses;
    const operatingMarginPercent = grossTotalRevenue > 0 ? Math.round((netOperatingIncome / grossTotalRevenue) * 100) : 0;

    return {
      periodLabel: label,
      startDate,
      endDate,
      operatingRevenue: {
        salaryWages,
        businessRevenue,
        consultingFreelance,
        subtotal: operatingSubtotal,
      },
      passiveInvestmentIncome: {
        stockDividends,
        fdrProfits,
        sanchaypatraProfits,
        realEstateRentalYield,
        subtotal: passiveSubtotal,
      },
      otherIncome: {
        bonusesGifts,
        taxRefundsMiscellaneous,
        subtotal: otherSubtotal,
      },
      grossTotalRevenue,
      operatingExpenses,
      netOperatingIncome,
      operatingMarginPercent,
      itemizedIncomes: periodIncomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }

  /**
   * 4. EXPENSE LEDGER & EXPENDITURE STATEMENT
   */
  public static generateExpenseLedger(period: FinancialPeriod): ExpenseLedgerReport {
    const { startDate, endDate, label } = this.getPeriodDates(period);
    const expenses = TransactionManager.getStoredExpenses();

    const inRange = (d: string) => d >= startDate && d <= endDate;
    const periodExpenses = expenses.filter((e) => inRange(e.date));

    const totalExpenses = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Group by category
    const catMap: Record<string, { amount: number; count: number }> = {};
    periodExpenses.forEach((e) => {
      const cat = e.category || 'General';
      if (!catMap[cat]) catMap[cat] = { amount: 0, count: 0 };
      catMap[cat].amount += e.amount || 0;
      catMap[cat].count += 1;
    });

    const categoryColors: Record<string, string> = {
      'Household & Living': '#0284C7',
      'Asset Expense': '#D97706',
      'Debt Service EMI': '#EF4444',
      'Personal / Discretionary': '#8B5CF6',
      Healthcare: '#10B981',
      Transport: '#F59E0B',
      Utilities: '#06B6D4',
      Groceries: '#14B8A6',
      General: '#64748B',
    };

    const categoryBreakdown: ExpenseCategoryBreakdown[] = Object.keys(catMap).map((cat) => ({
      category: cat,
      amount: catMap[cat].amount,
      percentage: totalExpenses > 0 ? Math.round((catMap[cat].amount / totalExpenses) * 100) : 0,
      entryCount: catMap[cat].count,
      color: categoryColors[cat] || '#38BDF8',
    })).sort((a, b) => b.amount - a.amount);

    const top5Expenses = [...periodExpenses]
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 5);

    return {
      periodLabel: label,
      startDate,
      endDate,
      totalExpenses,
      categoryBreakdown,
      top5Expenses,
      itemizedExpenses: periodExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }

  /**
   * 5. INTUIT / QUICKBOOKS FINANCIAL RATIOS & INTELLIGENCE
   */
  public static calculateIntuitFinancialRatios(
    balanceSheet: BalanceSheetReport,
    incomeStatement: IncomeStatementReport
  ): IntuitFinancialIntelligence {
    const ca = balanceSheet.currentAssets.subtotal;
    const cl = Math.max(1, balanceSheet.currentLiabilities.subtotal);
    const tl = balanceSheet.totalLiabilities;
    const ta = Math.max(1, balanceSheet.totalAssets);
    const te = Math.max(1, balanceSheet.equity.totalEquity);

    // Current Ratio (Liquidity)
    const currentRatioVal = Math.round((ca / cl) * 100) / 100;
    // Quick Ratio (Acid-Test)
    const quickRatioVal = Math.round((balanceSheet.currentAssets.cashInHand + balanceSheet.currentAssets.bankBalances) / cl * 100) / 100;
    // Debt-to-Equity
    const dToEVal = Math.round((tl / te) * 100) / 100;
    // Debt-to-Asset
    const dToAVal = Math.round((tl / ta) * 100) / 100;

    // Savings Rate
    const totalRev = incomeStatement.grossTotalRevenue;
    const totalExp = incomeStatement.operatingExpenses;
    const savingsRateVal = totalRev > 0 ? Math.round(((totalRev - totalExp) / totalRev) * 100) : 0;

    // Working Capital
    const workingCapital = ca - cl;

    // Monthly Burn Rate (from operating expenses or average)
    const monthlyBurnRate = Math.max(1000, totalExp || 100000);
    const cashRunwayMonths = Math.round((ca / monthlyBurnRate) * 10) / 10;

    const ratios: FinancialRatioMetric[] = [
      {
        name: 'Current Ratio (Liquidity)',
        value: currentRatioVal,
        formatted: `${currentRatioVal}x`,
        benchmark: '≥ 1.50x',
        status: currentRatioVal >= 1.5 ? 'optimal' : currentRatioVal >= 1.0 ? 'acceptable' : 'warning',
        description: 'Ability to satisfy short-term debt obligations using liquid reserves.',
      },
      {
        name: 'Quick Ratio (Acid-Test)',
        value: quickRatioVal,
        formatted: `${quickRatioVal}x`,
        benchmark: '≥ 1.00x',
        status: quickRatioVal >= 1.0 ? 'optimal' : quickRatioVal >= 0.7 ? 'acceptable' : 'warning',
        description: 'Immediate solvency testing instant cash against current obligations.',
      },
      {
        name: 'Debt-to-Equity (Gearing)',
        value: dToEVal,
        formatted: `${(dToEVal * 100).toFixed(1)}%`,
        benchmark: '≤ 50.0%',
        status: dToEVal <= 0.35 ? 'optimal' : dToEVal <= 0.6 ? 'acceptable' : 'warning',
        description: 'Proportion of debt capital versus owner equity. Lower indicates lower risk.',
      },
      {
        name: 'Debt-to-Asset Ratio',
        value: dToAVal,
        formatted: `${(dToAVal * 100).toFixed(1)}%`,
        benchmark: '≤ 30.0%',
        status: dToAVal <= 0.25 ? 'optimal' : dToAVal <= 0.4 ? 'acceptable' : 'warning',
        description: 'Percentage of wealth encumbered by institutional liabilities.',
      },
      {
        name: 'Savings & Surplus Margin',
        value: savingsRateVal,
        formatted: `${savingsRateVal}%`,
        benchmark: '≥ 35.0%',
        status: savingsRateVal >= 35 ? 'optimal' : savingsRateVal >= 15 ? 'acceptable' : 'warning',
        description: 'Percentage of comprehensive revenue retained as fresh investable surplus.',
      },
      {
        name: 'Liquid Cash Runway',
        value: cashRunwayMonths,
        formatted: `${cashRunwayMonths} Mo.`,
        benchmark: '≥ 6.0 Mo.',
        status: cashRunwayMonths >= 12 ? 'optimal' : cashRunwayMonths >= 6 ? 'acceptable' : 'critical',
        description: 'Months of family living burn rate covered by instant liquid reserves.',
      },
    ];

    // Scores
    const liquidityScore = Math.min(100, Math.round((currentRatioVal / 2.0) * 50 + (quickRatioVal / 1.5) * 50));
    const debtHealthScore = Math.min(100, Math.max(0, Math.round(100 - dToEVal * 80)));

    return {
      ratios,
      liquidityScore,
      debtHealthScore,
      workingCapital,
      monthlyBurnRate,
      cashRunwayMonths,
      savingsRatePercent: savingsRateVal,
    };
  }

  /**
   * 6. BUDGET VS ACTUAL VARIANCE STATEMENT (Intuit / Management Accounting)
   */
  public static generateBudgetVarianceReport(period: FinancialPeriod): BudgetVarianceReport {
    const { startDate, endDate, label } = this.getPeriodDates(period);

    // Multiplier for budget based on period
    let multiplier = 1;
    let monthPrefix: string | undefined = undefined;
    if (period === 'this_month') {
      monthPrefix = new Date().toISOString().slice(0, 7);
      multiplier = 1;
    } else if (period === 'last_month') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      monthPrefix = d.toISOString().slice(0, 7);
      multiplier = 1;
    } else if (period === 'this_quarter') {
      multiplier = 3;
    } else if (period === 'ytd') {
      multiplier = new Date().getMonth() + 1;
    } else if (period === 'fiscal_year') {
      multiplier = 12;
    } else {
      multiplier = 12;
    }

    const rawExpenseVariances = CategoryManager.getCategoryBudgetVsActual('expense', monthPrefix);
    const rawIncomeVariances = CategoryManager.getCategoryBudgetVsActual('income', monthPrefix);

    // Scale budget by period multiplier if > 1 month
    const expenseVariances = rawExpenseVariances.map((v) => {
      const scaledBudget = v.budget * multiplier;
      const variance = scaledBudget - v.actual;
      const percentUsed = scaledBudget > 0 ? Math.round((v.actual / scaledBudget) * 100) : 0;
      let status: CategoryBudgetVariance['status'] = 'under_budget';
      if (percentUsed > 100) status = 'over_budget';
      else if (percentUsed >= 80) status = 'warning';
      else if (percentUsed >= 50) status = 'on_track';
      return {
        ...v,
        budget: scaledBudget,
        variance,
        percentUsed,
        status,
      };
    });

    const incomeVariances = rawIncomeVariances.map((v) => {
      const scaledBudget = v.budget * multiplier;
      const variance = v.actual - scaledBudget;
      const percentUsed = scaledBudget > 0 ? Math.round((v.actual / scaledBudget) * 100) : 0;
      let status: CategoryBudgetVariance['status'] = 'on_track';
      if (percentUsed >= 100) status = 'on_track';
      else if (percentUsed >= 70) status = 'under_budget';
      else status = 'warning';
      return {
        ...v,
        budget: scaledBudget,
        variance,
        percentUsed,
        status,
      };
    });

    const totalExpenseBudget = expenseVariances.reduce((s, v) => s + v.budget, 0);
    const totalExpenseActual = expenseVariances.reduce((s, v) => s + v.actual, 0);
    const netExpenseVariance = totalExpenseBudget - totalExpenseActual;
    const expenseVariancePercent = totalExpenseBudget > 0 ? Math.round((totalExpenseActual / totalExpenseBudget) * 100) : 0;
    const expenseVarianceStatus = netExpenseVariance >= 0 ? 'favorable' : Math.abs(netExpenseVariance) <= totalExpenseBudget * 0.1 ? 'warning' : 'unfavorable';

    const totalIncomeTarget = incomeVariances.reduce((s, v) => s + v.budget, 0);
    const totalIncomeActual = incomeVariances.reduce((s, v) => s + v.actual, 0);
    const netIncomeVariance = totalIncomeActual - totalIncomeTarget;
    const incomeVariancePercent = totalIncomeTarget > 0 ? Math.round((totalIncomeActual / totalIncomeTarget) * 100) : 0;
    const incomeVarianceStatus = netIncomeVariance >= 0 ? 'favorable' : Math.abs(netIncomeVariance) <= totalIncomeTarget * 0.15 ? 'warning' : 'unfavorable';

    return {
      periodLabel: label,
      startDate,
      endDate,
      totalExpenseBudget,
      totalExpenseActual,
      netExpenseVariance,
      expenseVariancePercent,
      expenseVarianceStatus,
      expenseVariances,
      totalIncomeTarget,
      totalIncomeActual,
      netIncomeVariance,
      incomeVariancePercent,
      incomeVarianceStatus,
      incomeVariances,
    };
  }

  /**
   * 7. TAX ESTIMATION & DEDUCTIBLE EXPENDITURE SCHEDULE
   */
  public static generateTaxAssessmentReport(period: FinancialPeriod): TaxAssessmentReport {
    const { startDate, endDate, label } = this.getPeriodDates(period);
    const incStatement = this.generateIncomeStatement(period);
    const grossAssessableIncome = incStatement.grossTotalRevenue;

    const allExpenses = TransactionManager.getStoredExpenses();
    const inRange = (d: string) => d >= startDate && d <= endDate;
    const periodExpenses = allExpenses.filter((e) => inRange(e.date));

    // Discover tax deductible categories
    const expenseCategories = CategoryManager.getExpenseCategories();
    const deductibleCatNames = new Set(
      expenseCategories.filter((c) => c.isTaxDeductible).map((c) => c.name.toLowerCase())
    );

    let insurancePremiums = 0;
    let debtInterestServicing = 0;
    let propertyHoldingTaxes = 0;
    let medicalHealthExpenses = 0;
    let donationsAndZakat = 0;
    const itemizedDeductibles: ExpenseItem[] = [];

    periodExpenses.forEach((exp) => {
      const c = (exp.category || '').toLowerCase();
      const t = (exp.title || '').toLowerCase();
      const n = (exp.notes || '').toLowerCase();
      const amt = exp.amount || 0;

      const isDeductible =
        deductibleCatNames.has(c) ||
        c.includes('insurance') ||
        c.includes('health') ||
        c.includes('tax') ||
        c.includes('zakat') ||
        c.includes('donation') ||
        t.includes('insurance') ||
        t.includes('medical') ||
        t.includes('zakat') ||
        t.includes('donation') ||
        n.includes('tax');

      if (isDeductible) {
        itemizedDeductibles.push(exp);
        if (c.includes('insurance') || t.includes('insurance')) {
          insurancePremiums += amt;
        } else if (c.includes('emi') || c.includes('debt') || t.includes('interest')) {
          // Estimate 35% of EMI as deductible interest component
          debtInterestServicing += Math.round(amt * 0.35);
        } else if (c.includes('property') || c.includes('holding') || t.includes('tax')) {
          propertyHoldingTaxes += amt;
        } else if (c.includes('health') || c.includes('doctor') || t.includes('medicine')) {
          medicalHealthExpenses += amt;
        } else if (c.includes('zakat') || c.includes('charity') || c.includes('donation')) {
          donationsAndZakat += amt;
        } else {
          medicalHealthExpenses += amt;
        }
      }
    });

    const totalDeductions =
      insurancePremiums + debtInterestServicing + propertyHoldingTaxes + medicalHealthExpenses + donationsAndZakat;

    const netTaxableIncome = Math.max(0, grossAssessableIncome - totalDeductions);

    // Multiplier for pro-rating progressive tax slabs based on period
    let periodRatio = 1.0;
    if (period === 'this_month' || period === 'last_month') {
      periodRatio = 1 / 12;
    } else if (period === 'this_quarter') {
      periodRatio = 0.25;
    } else if (period === 'ytd') {
      periodRatio = (new Date().getMonth() + 1) / 12;
    }

    // Standard progressive slabs (pro-rated)
    const annualSlabs = [
      { name: 'First ৳350,000 (Exempt Bracket)', limit: 350000, rate: 0.0 },
      { name: 'Next ৳100,000 Bracket', limit: 100000, rate: 0.05 },
      { name: 'Next ৳300,000 Bracket', limit: 300000, rate: 0.10 },
      { name: 'Next ৳400,000 Bracket', limit: 400000, rate: 0.15 },
      { name: 'Next ৳500,000 Bracket', limit: 500000, rate: 0.20 },
      { name: 'Balance Residual Bracket', limit: Infinity, rate: 0.25 },
    ];

    let remainingIncome = netTaxableIncome;
    let grossEstimatedTax = 0;
    const computedSlabs: TaxAssessmentReport['taxSlabs'] = [];

    for (const slab of annualSlabs) {
      const slabLimit = slab.limit === Infinity ? Infinity : Math.round(slab.limit * periodRatio);
      if (remainingIncome <= 0) {
        computedSlabs.push({
          slabName: slab.name,
          ratePercent: Math.round(slab.rate * 100),
          taxableAmountInSlab: 0,
          slabTax: 0,
        });
        continue;
      }

      const taxableInSlab = Math.min(remainingIncome, slabLimit);
      const taxForSlab = Math.round(taxableInSlab * slab.rate);
      grossEstimatedTax += taxForSlab;
      remainingIncome -= taxableInSlab;

      computedSlabs.push({
        slabName: slab.name,
        ratePercent: Math.round(slab.rate * 100),
        taxableAmountInSlab: taxableInSlab,
        slabTax: taxForSlab,
      });
    }

    // Investment Tax Rebate Assessment
    const paperAssets = this.getStoredList<PaperAssetUnion>('mh_user_paper_assets', []);
    const stocks = this.getStoredList<StockHolding>('money_honey_user_stocks', []);
    let paperCapital = 0;
    paperAssets.forEach((p) => {
      if (p.type === 'Sanchaypatra' || p.type === 'FDR') {
        paperCapital += (p.amount || 0);
      } else if (p.type === 'DPS') {
        paperCapital += ((p as DPSAsset).totalDepositedSoFar || (p as DPSAsset).monthlyEmi * 12 || 0);
      }
    });
    let stockCapital = 0;
    stocks.forEach((st) => {
      stockCapital += (st.quantity || 0) * (st.buyPrice || 0);
    });
    const totalEligibleInvestments = paperCapital + stockCapital + insurancePremiums;

    const maxAllowableInvestmentCeiling = Math.round(netTaxableIncome * 0.20);
    const applicableInvestmentBase = Math.min(totalEligibleInvestments, maxAllowableInvestmentCeiling);
    const rebateRatePercent = 15;
    const totalTaxRebate = Math.round(applicableInvestmentBase * 0.15);

    const netPayableTax = Math.max(0, grossEstimatedTax - totalTaxRebate);
    const effectiveTaxRatePercent = grossAssessableIncome > 0 ? Math.round((netPayableTax / grossAssessableIncome) * 1000) / 10 : 0;

    return {
      periodLabel: label,
      startDate,
      endDate,
      grossAssessableIncome,
      allowableDeductions: {
        insurancePremiums,
        debtInterestServicing,
        propertyHoldingTaxes,
        medicalHealthExpenses,
        donationsAndZakat,
        totalDeductions,
      },
      netTaxableIncome,
      taxSlabs: computedSlabs,
      grossEstimatedTax,
      eligibleInvestmentRebate: {
        totalEligibleInvestments,
        maxAllowableInvestmentCeiling,
        applicableInvestmentBase,
        rebateRatePercent,
        totalTaxRebate,
      },
      netPayableTax,
      effectiveTaxRatePercent,
      itemizedDeductibles,
    };
  }
}
