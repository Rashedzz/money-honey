/**
 * categoryManager.ts
 * Enterprise Category & Budget Management Subsystem for Money-Honey.
 * Manages customizable Income Categories and Expense Categories with monthly budget limits,
 * revenue targets, tax-deductibility flags, icons, colors, and live variance tracking.
 */

import { FirebaseSyncService } from './firebaseSync';
import { TransactionManager } from './transactionManager';

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  monthlyBudget: number; // For expenses: limit; For income: target
  isTaxDeductible?: boolean;
  notes?: string;
  isSystem?: boolean;
}

export interface CategoryBudgetVariance {
  category: FinancialCategory;
  budget: number;
  actual: number;
  variance: number; // budget - actual
  percentUsed: number;
  status: 'under_budget' | 'on_track' | 'warning' | 'over_budget';
  transactionCount: number;
}

export const CATEGORIES_STORAGE_KEY = 'mh_user_financial_categories';
const CATEGORY_UPDATE_EVENT = 'mh_categories_updated';

// 15+ Industry Standard Default Expense Categories
export const DEFAULT_EXPENSE_CATEGORIES: FinancialCategory[] = [
  {
    id: 'CAT-EXP-01',
    name: 'Household & House Rent',
    type: 'expense',
    icon: '🏠',
    color: '#0284C7',
    monthlyBudget: 50000,
    isTaxDeductible: false,
    notes: 'Rent, flat service charges, home security',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-02',
    name: 'Groceries & Kitchen Supplies',
    type: 'expense',
    icon: '🛒',
    color: '#10B981',
    monthlyBudget: 35000,
    isTaxDeductible: false,
    notes: 'Supermarket, vegetables, fish, meat, dairy',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-03',
    name: 'Utilities (Electricity, Gas, Net)',
    type: 'expense',
    icon: '⚡',
    color: '#F59E0B',
    monthlyBudget: 15000,
    isTaxDeductible: false,
    notes: 'DESCO, Titas Gas, WASA, fiber internet, phone bills',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-04',
    name: 'Vehicle Fuel, Octane & Service',
    type: 'expense',
    icon: '🚗',
    color: '#EF4444',
    monthlyBudget: 20000,
    isTaxDeductible: false,
    notes: 'Octane, engine oil, workshop maintenance, toll',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-05',
    name: 'Debt Service EMI & Bank Loans',
    type: 'expense',
    icon: '💳',
    color: '#DC2626',
    monthlyBudget: 60000,
    isTaxDeductible: true,
    notes: 'Home loan, auto loan, institutional EMI obligations',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-06',
    name: 'Healthcare, Doctors & Medicine',
    type: 'expense',
    icon: '🏥',
    color: '#EC4899',
    monthlyBudget: 12000,
    isTaxDeductible: true,
    notes: 'Prescriptions, specialist visits, hospital tests',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-07',
    name: 'Children Education & School Fees',
    type: 'expense',
    icon: '🎓',
    color: '#8B5CF6',
    monthlyBudget: 25000,
    isTaxDeductible: false,
    notes: 'Tuition fees, coaching, books, exam registrations',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-08',
    name: 'Property Maintenance & Municipal Tax',
    type: 'expense',
    icon: '🏢',
    color: '#D97706',
    monthlyBudget: 10000,
    isTaxDeductible: true,
    notes: 'Holding tax, land revenue tax, flat renovations',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-09',
    name: 'Dining Out, Cafes & Outings',
    type: 'expense',
    icon: '🍽️',
    color: '#06B6D4',
    monthlyBudget: 15000,
    isTaxDeductible: false,
    notes: 'Family weekend restaurants, coffee, food delivery',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-10',
    name: 'Shopping, Apparel & Footwear',
    type: 'expense',
    icon: '🛍️',
    color: '#6366F1',
    monthlyBudget: 18000,
    isTaxDeductible: false,
    notes: 'Clothing, personal accessories, electronics',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-11',
    name: 'Life & Health Insurance Premiums',
    type: 'expense',
    icon: '🛡️',
    color: '#3B82F6',
    monthlyBudget: 15000,
    isTaxDeductible: true,
    notes: 'Eligible for Income Tax Rebate under tax ordinance',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-12',
    name: 'Professional Subscriptions & Tech',
    type: 'expense',
    icon: '💻',
    color: '#64748B',
    monthlyBudget: 6000,
    isTaxDeductible: true,
    notes: 'Cloud hosting, SaaS software, business tools',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-13',
    name: 'Charity, Zakat & Donations',
    type: 'expense',
    icon: '🎁',
    color: '#A855F7',
    monthlyBudget: 10000,
    isTaxDeductible: true,
    notes: 'Zakat ul-Mal, humanitarian donations, religious gifts',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-14',
    name: 'Bank Charges, VAT & Transfer Fees',
    type: 'expense',
    icon: '🧾',
    color: '#94A3B8',
    monthlyBudget: 2500,
    isTaxDeductible: false,
    notes: 'BEFTN / RTGS charges, excise duty, card annual fee',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-15',
    name: 'Personal & Contingency Expenses',
    type: 'expense',
    icon: '📦',
    color: '#475569',
    monthlyBudget: 8000,
    isTaxDeductible: false,
    notes: 'Unplanned household or personal emergency outflows',
    isSystem: true,
  },
];

// 10+ Industry Standard Default Income Categories
export const DEFAULT_INCOME_CATEGORIES: FinancialCategory[] = [
  {
    id: 'CAT-INC-01',
    name: 'Primary Employment Salary',
    type: 'income',
    icon: '💼',
    color: '#10B981',
    monthlyBudget: 160000,
    isTaxDeductible: false,
    notes: 'Monthly basic salary, allowances, executive compensation',
    isSystem: true,
  },
  {
    id: 'CAT-INC-02',
    name: 'Commercial Business Revenue',
    type: 'income',
    icon: '🏢',
    color: '#0284C7',
    monthlyBudget: 120000,
    isTaxDeductible: false,
    notes: 'Direct business proceeds, customer sales, corporate draws',
    isSystem: true,
  },
  {
    id: 'CAT-INC-03',
    name: 'Consulting & Professional Services',
    type: 'income',
    icon: '💻',
    color: '#8B5CF6',
    monthlyBudget: 45000,
    isTaxDeductible: false,
    notes: 'Advisory retainers, freelance contracts, expert fees',
    isSystem: true,
  },
  {
    id: 'CAT-INC-04',
    name: 'Residential Real Estate Rental Yield',
    type: 'income',
    icon: '🏠',
    color: '#F59E0B',
    monthlyBudget: 40000,
    isTaxDeductible: false,
    notes: 'Apartment monthly tenant rent collected',
    isSystem: true,
  },
  {
    id: 'CAT-INC-05',
    name: 'DSE/CSE Listed Stock Dividends',
    type: 'income',
    icon: '📈',
    color: '#0D9488',
    monthlyBudget: 18000,
    isTaxDeductible: false,
    notes: 'Cash dividends from portfolio equities (BEPZA/DSE listed)',
    isSystem: true,
  },
  {
    id: 'CAT-INC-06',
    name: 'National Savings (Sanchaypatra) Profits',
    type: 'income',
    icon: '📜',
    color: '#EC4899',
    monthlyBudget: 28000,
    isTaxDeductible: false,
    notes: 'Quarterly profit coupons from Govt Sanchaypatra',
    isSystem: true,
  },
  {
    id: 'CAT-INC-07',
    name: 'Fixed Deposit (FDR) Term Interest',
    type: 'income',
    icon: '🏦',
    color: '#06B6D4',
    monthlyBudget: 15000,
    isTaxDeductible: false,
    notes: 'Monthly / maturity interest credited from bank FDRs',
    isSystem: true,
  },
  {
    id: 'CAT-INC-08',
    name: 'Festival Bonus & Annual Incentives',
    type: 'income',
    icon: '🏆',
    color: '#A855F7',
    monthlyBudget: 25000,
    isTaxDeductible: false,
    notes: 'Eid bonuses, performance incentives, annual gratuity',
    isSystem: true,
  },
  {
    id: 'CAT-INC-09',
    name: 'Capital Gains on Asset Disposals',
    type: 'income',
    icon: '💰',
    color: '#14B8A6',
    monthlyBudget: 0,
    isTaxDeductible: false,
    notes: 'Realized gains on land, gold, or equity divestments',
    isSystem: true,
  },
  {
    id: 'CAT-INC-10',
    name: 'Foreign Remittance & Family Transfers',
    type: 'income',
    icon: '🌐',
    color: '#3B82F6',
    monthlyBudget: 0,
    isTaxDeductible: false,
    notes: 'Wage earner remittances, family contributions',
    isSystem: true,
  },
];

const categorySubscribers = new Set<() => void>();

export const notifyCategoriesChanged = () => {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(CATEGORY_UPDATE_EVENT));
    } catch (e) {}
  }
  categorySubscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {}
  });
};

export class CategoryManager {
  /**
   * Reads raw categories from storage or initializes defaults
   */
  public static getAllCategories(): FinancialCategory[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {}

    // First time init: Seed with default comprehensive categories
    const initial = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    this.saveAllCategories(initial);
    return initial;
  }

  /**
   * Saves categories list and syncs
   */
  public static saveAllCategories(categories: FinancialCategory[], userId: string = 'rashed01'): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
      }
      FirebaseSyncService.pushCategory(userId, 'financial_categories', categories);
      notifyCategoriesChanged();
    } catch (e) {}
  }

  /**
   * Retrieves categories filtered by type
   */
  public static getCategories(type?: 'expense' | 'income'): FinancialCategory[] {
    const all = this.getAllCategories();
    if (!type) return all;
    return all.filter((c) => c.type === type);
  }

  public static getExpenseCategories(): FinancialCategory[] {
    return this.getCategories('expense');
  }

  public static getIncomeCategories(): FinancialCategory[] {
    return this.getCategories('income');
  }

  public static getTotalExpenseBudget(): number {
    return this.getExpenseCategories().reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);
  }

  public static getTotalIncomeTarget(): number {
    return this.getIncomeCategories().reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);
  }

  /**
   * Adds a new category
   */
  public static addCategory(categoryData: Omit<FinancialCategory, 'id'>): FinancialCategory {
    const all = this.getAllCategories();
    const newCat: FinancialCategory = {
      ...categoryData,
      id: `CAT-${categoryData.type.toUpperCase()}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    };

    const updated = [...all, newCat];
    this.saveAllCategories(updated);
    return newCat;
  }

  /**
   * Updates an existing category
   */
  public static updateCategory(category: FinancialCategory): void {
    const all = this.getAllCategories();
    const updated = all.map((c) => (c.id === category.id ? category : c));
    this.saveAllCategories(updated);
  }

  /**
   * Deletes a category
   */
  public static deleteCategory(id: string): void {
    const all = this.getAllCategories();
    const updated = all.filter((c) => c.id !== id);
    this.saveAllCategories(updated);
  }

  /**
   * Resets categories to standard enterprise defaults
   */
  public static resetToDefaults(): void {
    const initial = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    this.saveAllCategories(initial);
  }

  /**
   * Computes Budget vs Actual variance for a given timeframe (default: current month)
   */
  public static getCategoryBudgetVsActual(
    type: 'expense' | 'income' = 'expense',
    monthPrefix?: string
  ): CategoryBudgetVariance[] {
    const categories = this.getCategories(type);
    const targetMonth = monthPrefix || new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    const txList =
      type === 'expense'
        ? TransactionManager.getStoredExpenses()
        : TransactionManager.getStoredIncomes();

    // Filter transactions in month
    const monthTx = txList.filter((tx) => tx.date && tx.date.startsWith(targetMonth));

    return categories.map((cat) => {
      // Find transactions matching this category name (case-insensitive fuzzy)
      const matching = monthTx.filter((t) => {
        const tCat = (t.category || '').toLowerCase();
        const cName = cat.name.toLowerCase();
        return tCat === cName || cName.includes(tCat) || tCat.includes(cName);
      });

      const actual = matching.reduce((sum, t) => sum + (t.amount || 0), 0);
      const budget = cat.monthlyBudget || 0;
      const variance = budget - actual;
      const percentUsed = budget > 0 ? Math.round((actual / budget) * 100) : 0;

      let status: CategoryBudgetVariance['status'] = 'under_budget';
      if (type === 'expense') {
        if (percentUsed > 100) status = 'over_budget';
        else if (percentUsed >= 80) status = 'warning';
        else if (percentUsed >= 50) status = 'on_track';
      } else {
        // For income, higher is better
        if (percentUsed >= 100) status = 'on_track';
        else if (percentUsed >= 70) status = 'under_budget';
        else status = 'warning';
      }

      return {
        category: cat,
        budget,
        actual,
        variance,
        percentUsed,
        status,
        transactionCount: matching.length,
      };
    }).sort((a, b) => b.actual - a.actual);
  }

  /**
   * Subscribes to category updates
   */
  public static subscribeToCategoryUpdates(callback: () => void): () => void {
    categorySubscribers.add(callback);
    if (typeof window !== 'undefined') {
      const handler = () => callback();
      window.addEventListener(CATEGORY_UPDATE_EVENT, handler);
      return () => {
        categorySubscribers.delete(callback);
        window.removeEventListener(CATEGORY_UPDATE_EVENT, handler);
      };
    }
    return () => {
      categorySubscribers.delete(callback);
    };
  }
}
