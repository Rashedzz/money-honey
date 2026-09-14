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

// 14 Authentic Industry Standard Expense Categories (Synchronized with real schedules)
export const DEFAULT_EXPENSE_CATEGORIES: FinancialCategory[] = [
  {
    id: 'CAT-EXP-01',
    name: 'House Living Rent & Maintenance',
    type: 'expense',
    icon: '🏠',
    color: '#0284C7',
    monthlyBudget: 35000,
    isTaxDeductible: false,
    notes: 'House living rent & building service charges (linked to Sonali Bank)',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-02',
    name: 'Electricity, Gas & Utility Bills',
    type: 'expense',
    icon: '⚡',
    color: '#F59E0B',
    monthlyBudget: 8500,
    isTaxDeductible: false,
    notes: 'DESCO, Titas Gas, WASA, fiber internet & mobile bills (Cash/Bank)',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-03',
    name: 'Groceries & Kitchen Supplies',
    type: 'expense',
    icon: '🛒',
    color: '#10B981',
    monthlyBudget: 25000,
    isTaxDeductible: false,
    notes: 'Supermarket, kitchen bazaar, dairy, vegetables, fish & meat',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-04',
    name: 'Debt Service EMI & Bank Loans',
    type: 'expense',
    icon: '💳',
    color: '#DC2626',
    monthlyBudget: 40000,
    isTaxDeductible: true,
    notes: 'Bank loan EMI installments & institutional obligations',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-05',
    name: 'Vehicle Fuel, Octane & Service',
    type: 'expense',
    icon: '🚗',
    color: '#EF4444',
    monthlyBudget: 12000,
    isTaxDeductible: false,
    notes: 'Octane, vehicle maintenance, lubricants, toll & bridge fees',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-06',
    name: 'Healthcare, Doctors & Medicine',
    type: 'expense',
    icon: '🏥',
    color: '#EC4899',
    monthlyBudget: 8000,
    isTaxDeductible: true,
    notes: 'Prescriptions, diagnostic tests, doctor consultations',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-07',
    name: 'Children Education & School Fees',
    type: 'expense',
    icon: '🎓',
    color: '#8B5CF6',
    monthlyBudget: 20000,
    isTaxDeductible: false,
    notes: 'School tuition, coaching, books & educational supplies',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-08',
    name: 'Personal & Contingency Expenses',
    type: 'expense',
    icon: '📦',
    color: '#475569',
    monthlyBudget: 10000,
    isTaxDeductible: false,
    notes: 'Emergency household buffer & unforeseen personal outflows',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-09',
    name: 'Dining Out, Cafes & Social Gatherings',
    type: 'expense',
    icon: '🍽️',
    color: '#06B6D4',
    monthlyBudget: 12000,
    isTaxDeductible: false,
    notes: 'Family weekend restaurants, coffee & social entertainment',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-10',
    name: 'Shopping, Apparel & Footwear',
    type: 'expense',
    icon: '🛍️',
    color: '#6366F1',
    monthlyBudget: 10000,
    isTaxDeductible: false,
    notes: 'Clothing, personal wear, shoes & personal gadgets',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-11',
    name: 'Life & Health Insurance Premiums',
    type: 'expense',
    icon: '🛡️',
    color: '#3B82F6',
    monthlyBudget: 10000,
    isTaxDeductible: true,
    notes: 'Insurance policy premium installments (Tax rebate eligible)',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-12',
    name: 'Professional Subscriptions & Tech Tools',
    type: 'expense',
    icon: '💻',
    color: '#64748B',
    monthlyBudget: 5000,
    isTaxDeductible: true,
    notes: 'Cloud hosting, AI/SaaS tools, digital workstation licenses',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-13',
    name: 'Charity, Zakat & Sadqah',
    type: 'expense',
    icon: '🎁',
    color: '#A855F7',
    monthlyBudget: 8000,
    isTaxDeductible: true,
    notes: 'Zakat ul-Mal, philanthropic donations & community welfare',
    isSystem: true,
  },
  {
    id: 'CAT-EXP-14',
    name: 'Bank Charges, Excise Duty & Transfer Fees',
    type: 'expense',
    icon: '🧾',
    color: '#94A3B8',
    monthlyBudget: 1500,
    isTaxDeductible: false,
    notes: 'BEFTN / RTGS charges, excise duty, card fees & SMS alerts',
    isSystem: true,
  },
];

// 10 Authentic Income Categories (Synchronized with user schedules & Sanchaypatra)
export const DEFAULT_INCOME_CATEGORIES: FinancialCategory[] = [
  {
    id: 'CAT-INC-01',
    name: 'Primary Tech Salary (Sonali Bank PLC)',
    type: 'income',
    icon: '💼',
    color: '#10B981',
    monthlyBudget: 100000,
    isTaxDeductible: false,
    notes: 'Monthly corporate payroll direct deposit into Sonali Bank PLC (credited 5th–10th)',
    isSystem: true,
  },
  {
    id: 'CAT-INC-02',
    name: 'Executive Salary & Allowance (Cash in Hand)',
    type: 'income',
    icon: '💵',
    color: '#059669',
    monthlyBudget: 25000,
    isTaxDeductible: false,
    notes: 'Physical cash disbursement for executive allowances & living expenses (received 5th–10th)',
    isSystem: true,
  },
  {
    id: 'CAT-INC-03',
    name: 'National Savings (Sanchaypatra 3-Mo Profit)',
    type: 'income',
    icon: '📜',
    color: '#EC4899',
    monthlyBudget: 29531,
    isTaxDeductible: false,
    notes: 'Monthly equivalent of ৳88,593.75 quarterly profit across 9 certificates (deposited to Sonali Bank)',
    isSystem: true,
  },
  {
    id: 'CAT-INC-04',
    name: 'IT Consultancy Retainer',
    type: 'income',
    icon: '💻',
    color: '#8B5CF6',
    monthlyBudget: 45000,
    isTaxDeductible: false,
    notes: 'Direct client consultancy retainer payment in cash',
    isSystem: true,
  },
  {
    id: 'CAT-INC-05',
    name: 'Apartment Rental Income',
    type: 'income',
    icon: '🏠',
    color: '#F59E0B',
    monthlyBudget: 32000,
    isTaxDeductible: false,
    notes: 'Residential flat rental income credited to Sonali Bank PLC on the 5th',
    isSystem: true,
  },
  {
    id: 'CAT-INC-06',
    name: 'DSE/CSE Listed Stock Dividends',
    type: 'income',
    icon: '📈',
    color: '#0D9488',
    monthlyBudget: 12000,
    isTaxDeductible: false,
    notes: 'Annual & interim cash dividends from stock market equities',
    isSystem: true,
  },
  {
    id: 'CAT-INC-07',
    name: 'Fixed Deposit (FDR) Profit',
    type: 'income',
    icon: '🏦',
    color: '#06B6D4',
    monthlyBudget: 15000,
    isTaxDeductible: false,
    notes: 'Monthly / maturity profit credited from banking FDRs',
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
    notes: 'Eid bonuses and corporate executive performance incentives',
    isSystem: true,
  },
  {
    id: 'CAT-INC-09',
    name: 'Capital Gains on Investments',
    type: 'income',
    icon: '💰',
    color: '#14B8A6',
    monthlyBudget: 0,
    isTaxDeductible: false,
    notes: 'Realized profits on equity, bullion or asset divestments',
    isSystem: true,
  },
  {
    id: 'CAT-INC-10',
    name: 'Foreign Remittance & Transfers',
    type: 'income',
    icon: '🌐',
    color: '#3B82F6',
    monthlyBudget: 0,
    isTaxDeductible: false,
    notes: 'Inward foreign currency remittances and transfers',
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
   * Reads raw categories from storage or initializes defaults with auto-migration
   */
  public static getAllCategories(): FinancialCategory[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Auto-migrate if stored categories are old placeholder/demo data
            const hasLegacyDemo = parsed.some(
              (c: FinancialCategory) =>
                (c.id === 'CAT-INC-01' && c.monthlyBudget === 160000) ||
                c.name === 'Primary Employment Salary' ||
                (c.id === 'CAT-EXP-01' && c.monthlyBudget === 50000)
            );
            if (hasLegacyDemo) {
              const migrated = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
              this.saveAllCategories(migrated);
              return migrated;
            }
            return parsed;
          }
        }
      }
    } catch (e) {}

    // First time init: Seed with authentic comprehensive categories
    const initial = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    this.saveAllCategories(initial);
    return initial;
  }

  /**
   * Automatically synchronizes category budget limits and revenue targets with
   * actual active schedules (Salary Bank ৳1,00,000, Salary Cash ৳25,000, Sanchaypatra ৳29,531, etc.)
   */
  public static syncWithActiveSchedules(): { updatedCount: number; message: string } {
    const existing = this.getAllCategories();
    const realDefaults = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];

    let updatedCount = 0;
    const synced = realDefaults.map((def) => {
      const match = existing.find(
        (c) => c.id === def.id || c.name.toLowerCase().trim() === def.name.toLowerCase().trim()
      );
      if (match) {
        updatedCount++;
        return {
          ...match,
          name: def.name,
          icon: def.icon,
          color: def.color,
          monthlyBudget: def.monthlyBudget,
          notes: def.notes,
        };
      }
      updatedCount++;
      return def;
    });

    // Also preserve any custom non-system categories created by user
    const customCats = existing.filter(
      (c) => !realDefaults.some((d) => d.id === c.id) && !c.isSystem
    );

    const finalList = [...synced, ...customCats];
    this.saveAllCategories(finalList);
    return {
      updatedCount,
      message: `Successfully synchronized ${updatedCount} categories with actual financial schedules & Sanchaypatra targets!`,
    };
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
