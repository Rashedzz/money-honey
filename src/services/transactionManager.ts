/**
 * Money-Honey Transaction & Double-Entry Balance Manager
 * Handles:
 * 1. Regular Expenses linked to Bank Account or Cash in Hand (automatic deduction)
 * 2. Cash Withdrawal (ATM / Bank -> Cash in Hand)
 * 3. Bank-to-Bank / MFS Transfers (double-entry debit & credit)
 * 4. Income & Salary crediting to Bank Account or Cash in Hand
 * 5. Physical Cash in Hand as a first-class permanent account
 * 6. Real-time balance event bus for instant UI reactivity across all screens
 */

import { FirebaseSyncService } from './firebaseSync';

export interface BankAccountItem {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  accountType: 'Savings' | 'Current' | 'Salary' | 'MFS Wallet' | 'Physical Cash';
  currentBalance: number;
  branch?: string;
  address?: string;
  bankAppId?: string;
  bankAppPassword?: string;
  color: string;
}

export interface ExpenseItem {
  id: string;
  category: 'Asset Expense' | 'Household & Living' | 'Debt Service EMI' | 'Personal / Discretionary' | string;
  linkedAssetId?: string;
  title: string;
  amount: number;
  date: string;
  paymentMethod: string;
  accountId?: string;
  notes?: string;
}

export interface IncomeItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  accountId?: string;
  destinationAccount?: string;
  notes?: string;
}

export interface TransferRecord {
  id: string;
  type: 'transfer' | 'withdrawal';
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
  fee?: number;
  date: string;
  notes?: string;
}

export const BANK_STORAGE_KEY = 'mh_user_bank_accounts';
export const EXPENSES_STORAGE_KEY = 'mh_user_expenses';
export const INCOMES_STORAGE_KEY = 'mh_user_incomes';
export const TRANSFERS_STORAGE_KEY = 'mh_user_transfers';
export const CASH_IN_HAND_ID = 'ACC-CASH-IN-HAND';

export const defaultCashInHandAccount: BankAccountItem = {
  id: CASH_IN_HAND_ID,
  bankName: 'Cash in Hand',
  accountName: 'Physical Cash Wallet',
  accountNumber: 'CASH-VAULT',
  accountType: 'Physical Cash',
  currentBalance: 0,
  branch: 'Physical Wallet',
  color: '#10B981',
};

// Event bus for real-time reactivity across all screens
const BALANCE_UPDATE_EVENT = 'mh_balance_updated';
const subscribers = new Set<() => void>();

export const notifyBalanceChanged = () => {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(BALANCE_UPDATE_EVENT));
    } catch (e) {}
  }
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {}
  });
};

export const subscribeToBalanceUpdates = (callback: () => void): (() => void) => {
  subscribers.add(callback);
  if (typeof window !== 'undefined') {
    const handler = () => callback();
    window.addEventListener(BALANCE_UPDATE_EVENT, handler);
    return () => {
      subscribers.delete(callback);
      window.removeEventListener(BALANCE_UPDATE_EVENT, handler);
    };
  }
  return () => {
    subscribers.delete(callback);
  };
};

export class TransactionManager {
  /**
   * Reads raw bank accounts from local storage
   */
  public static getRawAccounts(): BankAccountItem[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(BANK_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return [];
  }

  /**
   * Saves accounts list to storage and triggers cloud sync
   */
  public static saveAccounts(accounts: BankAccountItem[], userId: string = 'rashed01'): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(accounts));
      }
      FirebaseSyncService.pushCategory(userId, 'bank_accounts', accounts);
      notifyBalanceChanged();
    } catch (e) {}
  }

  /**
   * Returns accounts, ensuring Cash in Hand exists as a first-class account
   */
  public static getAccountsWithCash(): BankAccountItem[] {
    const list = this.getRawAccounts();
    const hasCash = list.some(
      (a) => a.id === CASH_IN_HAND_ID || a.accountType === 'Physical Cash'
    );
    if (!hasCash) {
      const withCash = [defaultCashInHandAccount, ...list];
      this.saveAccounts(withCash);
      return withCash;
    }
    return list;
  }

  /**
   * Get Cash in Hand account specifically
   */
  public static getCashInHandAccount(): BankAccountItem {
    const accounts = this.getAccountsWithCash();
    return (
      accounts.find((a) => a.id === CASH_IN_HAND_ID || a.accountType === 'Physical Cash') ||
      defaultCashInHandAccount
    );
  }

  /**
   * Reads stored expenses
   */
  public static getStoredExpenses(): ExpenseItem[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(EXPENSES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            // Filter out any legacy hardcoded demo expenses
            const clean = parsed.filter(
              (e: any) =>
                !e.id?.startsWith('EXP-0') &&
                e.title !== 'City Bank Home Loan EMI' &&
                e.title !== 'Monthly Groceries & Kitchen Supplies' &&
                e.title !== 'Eastern Bank Vehicle Auto Loan EMI' &&
                e.title !== 'Gulshan Flat Building Service Charge & Maintenance' &&
                e.title !== 'Electricity, Gas & High-Speed Internet Bills' &&
                e.title !== 'Toyota Harrier Oil Change, Fuel & Octane' &&
                e.title !== 'Purbachal Land Boundary Guarding & Municipality Tax' &&
                e.title !== 'Family Weekend Dining & Outing'
            );
            if (clean.length !== parsed.length) {
              window.localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(clean));
            }
            return clean;
          }
        }
      }
    } catch (e) {}
    return [];
  }

  /**
   * Saves expenses list to storage and cloud
   */
  public static saveExpenses(expenses: ExpenseItem[], userId: string = 'rashed01'): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
      }
      FirebaseSyncService.pushCategory(userId, 'expenses', expenses);
      notifyBalanceChanged();
    } catch (e) {}
  }

  /**
   * Reads stored incomes
   */
  public static getStoredIncomes(): IncomeItem[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(INCOMES_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return [];
  }

  /**
   * Saves incomes list to storage and cloud
   */
  public static saveIncomes(incomes: IncomeItem[], userId: string = 'rashed01'): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(INCOMES_STORAGE_KEY, JSON.stringify(incomes));
      }
      FirebaseSyncService.pushCategory(userId, 'incomes', incomes);
      notifyBalanceChanged();
    } catch (e) {}
  }

  /**
   * Reads stored transfers & withdrawals history
   */
  public static getStoredTransfers(): TransferRecord[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(TRANSFERS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return [];
  }

  public static saveTransfers(transfers: TransferRecord[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(transfers));
      }
    } catch (e) {}
  }

  /**
   * 1. RECORD EXPENSE
   * Automatically deducts from the selected bank account or Cash in Hand balance!
   */
  public static recordExpense(params: {
    title: string;
    amount: number;
    category?: string;
    accountId?: string;
    date?: string;
    linkedAssetId?: string;
    notes?: string;
    userId?: string;
  }): { expense: ExpenseItem; updatedAccounts: BankAccountItem[] } {
    const {
      title,
      amount,
      category = 'Household & Living',
      accountId,
      date = new Date().toISOString().split('T')[0],
      linkedAssetId,
      notes,
      userId = 'rashed01',
    } = params;

    const accounts = this.getAccountsWithCash();
    let paymentMethod = 'Physical Cash';
    let targetAccountId = accountId;

    // Find account to deduct from
    let updatedAccounts = accounts;
    if (targetAccountId) {
      const acc = accounts.find((a) => a.id === targetAccountId);
      if (acc) {
        paymentMethod = acc.bankName;
        updatedAccounts = accounts.map((a) =>
          a.id === targetAccountId
            ? { ...a, currentBalance: Math.max(0, (a.currentBalance || 0) - amount) }
            : a
        );
      }
    } else {
      // Default to Cash in Hand if no account specified
      const cashAcc = this.getCashInHandAccount();
      targetAccountId = cashAcc.id;
      paymentMethod = 'Cash in Hand';
      updatedAccounts = accounts.map((a) =>
        a.id === cashAcc.id
          ? { ...a, currentBalance: Math.max(0, (a.currentBalance || 0) - amount) }
          : a
      );
    }

    const newExpense: ExpenseItem = {
      id: `EXP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      amount,
      category,
      date,
      paymentMethod,
      accountId: targetAccountId,
      linkedAssetId,
      notes,
    };

    const existingExpenses = this.getStoredExpenses();
    const updatedExpenses = [newExpense, ...existingExpenses];

    // Save changes
    this.saveAccounts(updatedAccounts, userId);
    this.saveExpenses(updatedExpenses, userId);

    return { expense: newExpense, updatedAccounts };
  }

  /**
   * 2. RECORD INCOME / SALARY
   * Credits the selected bank account or Cash in Hand balance!
   */
  public static recordIncome(params: {
    title: string;
    amount: number;
    category?: string;
    accountId?: string;
    date?: string;
    notes?: string;
    userId?: string;
  }): { income: IncomeItem; updatedAccounts: BankAccountItem[] } {
    const {
      title,
      amount,
      category = 'Salary',
      accountId,
      date = new Date().toISOString().split('T')[0],
      notes,
      userId = 'rashed01',
    } = params;

    const accounts = this.getAccountsWithCash();
    let destinationAccount = 'Cash in Hand';
    let targetAccountId = accountId;

    let updatedAccounts = accounts;
    if (targetAccountId) {
      const acc = accounts.find((a) => a.id === targetAccountId);
      if (acc) {
        destinationAccount = acc.bankName;
        updatedAccounts = accounts.map((a) =>
          a.id === targetAccountId
            ? { ...a, currentBalance: (a.currentBalance || 0) + amount }
            : a
        );
      }
    } else {
      const cashAcc = this.getCashInHandAccount();
      targetAccountId = cashAcc.id;
      destinationAccount = 'Cash in Hand';
      updatedAccounts = accounts.map((a) =>
        a.id === cashAcc.id
          ? { ...a, currentBalance: (a.currentBalance || 0) + amount }
          : a
      );
    }

    const newIncome: IncomeItem = {
      id: `INC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      amount,
      category,
      date,
      accountId: targetAccountId,
      destinationAccount,
      notes,
    };

    const existingIncomes = this.getStoredIncomes();
    const updatedIncomes = [newIncome, ...existingIncomes];

    this.saveAccounts(updatedAccounts, userId);
    this.saveIncomes(updatedIncomes, userId);

    return { income: newIncome, updatedAccounts };
  }

  /**
   * 3. RECORD CASH WITHDRAWAL (Bank -> Cash in Hand)
   * Deducts from Bank Account and adds to Cash in Hand!
   */
  public static recordCashWithdrawal(params: {
    fromBankId: string;
    amount: number;
    date?: string;
    notes?: string;
    userId?: string;
  }): { success: boolean; message: string; record?: TransferRecord } {
    const {
      fromBankId,
      amount,
      date = new Date().toISOString().split('T')[0],
      notes = 'ATM / Branch Cash Withdrawal',
      userId = 'rashed01',
    } = params;

    if (amount <= 0) {
      return { success: false, message: 'Withdrawal amount must be greater than 0.' };
    }

    const accounts = this.getAccountsWithCash();
    const sourceBank = accounts.find((a) => a.id === fromBankId);
    if (!sourceBank) {
      return { success: false, message: 'Source bank account not found.' };
    }

    const cashAcc = this.getCashInHandAccount();
    if (sourceBank.id === cashAcc.id) {
      return { success: false, message: 'Source account cannot be Cash in Hand.' };
    }

    // Deduct from source bank, add to cash in hand
    const updatedAccounts = accounts.map((a) => {
      if (a.id === sourceBank.id) {
        return { ...a, currentBalance: Math.max(0, (a.currentBalance || 0) - amount) };
      }
      if (a.id === cashAcc.id) {
        return { ...a, currentBalance: (a.currentBalance || 0) + amount };
      }
      return a;
    });

    const transferRecord: TransferRecord = {
      id: `WTH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      type: 'withdrawal',
      fromAccountId: sourceBank.id,
      fromAccountName: sourceBank.bankName,
      toAccountId: cashAcc.id,
      toAccountName: 'Cash in Hand',
      amount,
      date,
      notes,
    };

    const transfers = this.getStoredTransfers();
    this.saveTransfers([transferRecord, ...transfers]);
    this.saveAccounts(updatedAccounts, userId);

    return {
      success: true,
      message: `৳ ${amount.toLocaleString('en-IN')} withdrawn from ${sourceBank.bankName} into Cash in Hand.`,
      record: transferRecord,
    };
  }

  /**
   * 4. RECORD BANK-TO-BANK / MFS TRANSFER
   * Deducts from source bank (plus optional fee) and credits destination bank!
   */
  public static recordTransfer(params: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    fee?: number;
    date?: string;
    notes?: string;
    userId?: string;
  }): { success: boolean; message: string; record?: TransferRecord } {
    const {
      fromAccountId,
      toAccountId,
      amount,
      fee = 0,
      date = new Date().toISOString().split('T')[0],
      notes = 'Inter-Bank / MFS Transfer',
      userId = 'rashed01',
    } = params;

    if (fromAccountId === toAccountId) {
      return { success: false, message: 'Source and destination accounts must be different.' };
    }

    if (amount <= 0) {
      return { success: false, message: 'Transfer amount must be greater than 0.' };
    }

    const accounts = this.getAccountsWithCash();
    const source = accounts.find((a) => a.id === fromAccountId);
    const dest = accounts.find((a) => a.id === toAccountId);

    if (!source || !dest) {
      return { success: false, message: 'Source or destination account not found.' };
    }

    const totalDeduction = amount + fee;

    const updatedAccounts = accounts.map((a) => {
      if (a.id === fromAccountId) {
        return { ...a, currentBalance: Math.max(0, (a.currentBalance || 0) - totalDeduction) };
      }
      if (a.id === toAccountId) {
        return { ...a, currentBalance: (a.currentBalance || 0) + amount };
      }
      return a;
    });

    const transferRecord: TransferRecord = {
      id: `TRF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      type: 'transfer',
      fromAccountId: source.id,
      fromAccountName: source.bankName,
      toAccountId: dest.id,
      toAccountName: dest.bankName,
      amount,
      fee,
      date,
      notes,
    };

    const transfers = this.getStoredTransfers();
    this.saveTransfers([transferRecord, ...transfers]);

    // If fee exists, also record an expense for bank charge
    if (fee > 0) {
      const feeExpense: ExpenseItem = {
        id: `EXP-FEE-${Date.now()}`,
        title: `Transfer Fee (${source.bankName} to ${dest.bankName})`,
        amount: fee,
        category: 'Personal / Discretionary',
        date,
        paymentMethod: source.bankName,
        accountId: source.id,
        notes: `Bank fee for transfer of ৳${amount.toLocaleString('en-IN')}`,
      };
      const existingExpenses = this.getStoredExpenses();
      this.saveExpenses([feeExpense, ...existingExpenses], userId);
    }

    this.saveAccounts(updatedAccounts, userId);

    return {
      success: true,
      message: `৳ ${amount.toLocaleString('en-IN')} transferred from ${source.bankName} to ${dest.bankName}.`,
      record: transferRecord,
    };
  }

  /**
   * DELETE EXPENSE
   * Allows deleting an expense and optionally restoring the balance to the source account
   */
  public static deleteExpense(
    expenseId: string,
    restoreBalance: boolean = true,
    userId: string = 'rashed01'
  ): void {
    const expenses = this.getStoredExpenses();
    const target = expenses.find((e) => e.id === expenseId);
    if (!target) return;

    const updatedExpenses = expenses.filter((e) => e.id !== expenseId);
    this.saveExpenses(updatedExpenses, userId);

    if (restoreBalance && target.accountId) {
      const accounts = this.getAccountsWithCash();
      const updatedAccounts = accounts.map((a) =>
        a.id === target.accountId
          ? { ...a, currentBalance: (a.currentBalance || 0) + target.amount }
          : a
      );
      this.saveAccounts(updatedAccounts, userId);
    }
  }

  /**
   * DELETE INCOME
   * Allows deleting an income and optionally deducting the balance from the account
   */
  public static deleteIncome(
    incomeId: string,
    deductBalance: boolean = true,
    userId: string = 'rashed01'
  ): void {
    const incomes = this.getStoredIncomes();
    const target = incomes.find((i) => i.id === incomeId);
    if (!target) return;

    const updatedIncomes = incomes.filter((i) => i.id !== incomeId);
    this.saveIncomes(updatedIncomes, userId);

    if (deductBalance && target.accountId) {
      const accounts = this.getAccountsWithCash();
      const updatedAccounts = accounts.map((a) =>
        a.id === target.accountId
          ? { ...a, currentBalance: Math.max(0, (a.currentBalance || 0) - target.amount) }
          : a
      );
      this.saveAccounts(updatedAccounts, userId);
    }
  }
}
