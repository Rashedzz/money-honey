/**
 * QuickenRegisterScreen.tsx
 * Quicken's signature Checkbook & Transaction Register Workstation.
 * Features:
 * - Full multi-account or single-account checkbook ledger view
 * - Columns: Date, Account, Clr (Cleared/Reconciled status), Payee, Category, Memo, Payment (-), Deposit (+), Running Balance
 * - Dynamic category color badges and account pills
 * - Instant search by Payee, Notes, Amount, or Category
 * - Type filters: All, Payments/Debits, Deposits/Credits, Uncleared
 * - 1-tap Account Reconciliation toggle
 * - Vector Print & CSV Export
 * - KPI summary bar (Cleared Balance, Uncleared Balance, Ending Register Balance)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../theme';
import {
  TransactionManager,
  BankAccountItem,
  subscribeToBalanceUpdates,
  CASH_IN_HAND_ID,
} from '../../services/transactionManager';
import { CategoryManager } from '../../services/categoryManager';

export interface QuickenTransactionRow {
  id: string;
  date: string; // YYYY-MM-DD
  accountId: string;
  accountName: string;
  accountColor: string;
  payee: string;
  category: string;
  memo?: string;
  type: 'debit' | 'credit';
  amount: number;
  isCleared: boolean;
  runningBalance?: number;
}

interface QuickenRegisterScreenProps {
  initialAccountId?: string;
  onOpenNewTransaction?: () => void;
  onOpenCategorySetup?: () => void;
}

export const QuickenRegisterScreen: React.FC<QuickenRegisterScreenProps> = ({
  initialAccountId = 'all',
  onOpenNewTransaction,
  onOpenCategorySetup,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit' | 'uncleared'>('all');
  const [clearedMap, setClearedMap] = useState<Record<string, boolean>>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('mh_quicken_cleared_txs');
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return {};
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync state if initialAccountId prop changes
  useEffect(() => {
    if (initialAccountId) {
      setSelectedAccountId(initialAccountId);
    }
  }, [initialAccountId]);

  // Subscribe to real-time balance updates
  useEffect(() => {
    const unsub = subscribeToBalanceUpdates(() => {
      setRefreshKey((k) => k + 1);
    });
    return () => unsub();
  }, []);

  const accounts = useMemo(() => {
    const _ = refreshKey;
    return TransactionManager.getAccountsWithCash();
  }, [refreshKey]);

  // Consolidate all transactions from expenses, incomes, and transfers
  const allRows: QuickenTransactionRow[] = useMemo(() => {
    const _ = refreshKey;
    const list: QuickenTransactionRow[] = [];

    const expenses = TransactionManager.getStoredExpenses();
    const incomes = TransactionManager.getStoredIncomes();
    const transfers = TransactionManager.getStoredTransfers();

    // Map account id to account details
    const accMap = new Map<string, BankAccountItem>();
    accounts.forEach((a) => accMap.set(a.id, a));

    // 1. Expenses (Debits / Payments)
    expenses.forEach((exp) => {
      const acc = accMap.get(exp.accountId || '') || {
        bankName: exp.paymentMethod || 'Bank Account',
        color: '#EF4444',
      };
      list.push({
        id: `exp_${exp.id}`,
        date: exp.date || new Date().toISOString().split('T')[0],
        accountId: exp.accountId || 'general',
        accountName: acc.bankName,
        accountColor: acc.color || '#EF4444',
        payee: exp.title || 'Expense Outflow',
        category: exp.category || 'General Expense',
        memo: exp.notes || (exp.paymentMethod ? `Via ${exp.paymentMethod}` : ''),
        type: 'debit',
        amount: Number(exp.amount) || 0,
        isCleared: clearedMap[`exp_${exp.id}`] ?? true,
      });
    });

    // 2. Incomes (Credits / Deposits)
    incomes.forEach((inc) => {
      const acc = accMap.get(inc.accountId || inc.destinationAccount || '') || {
        bankName: 'Liquid Account',
        color: '#10B981',
      };
      list.push({
        id: `inc_${inc.id}`,
        date: inc.date || new Date().toISOString().split('T')[0],
        accountId: inc.accountId || inc.destinationAccount || 'general',
        accountName: acc.bankName,
        accountColor: acc.color || '#10B981',
        payee: inc.title || 'Income Credit',
        category: inc.category || 'Salary / Revenue',
        memo: inc.notes || '',
        type: 'credit',
        amount: Number(inc.amount) || 0,
        isCleared: clearedMap[`inc_${inc.id}`] ?? true,
      });
    });

    // 3. Transfers
    transfers.forEach((tr) => {
      // From account (Debit)
      list.push({
        id: `tr_from_${tr.id}`,
        date: tr.date || new Date().toISOString().split('T')[0],
        accountId: tr.fromAccountId,
        accountName: tr.fromAccountName || 'Source Account',
        accountColor: '#8B5CF6',
        payee: `Transfer to ${tr.toAccountName}`,
        category: 'Internal Transfer',
        memo: tr.notes || (tr.fee ? `Fee: ৳${tr.fee}` : ''),
        type: 'debit',
        amount: Number(tr.amount) || 0,
        isCleared: clearedMap[`tr_from_${tr.id}`] ?? true,
      });

      // To account (Credit)
      list.push({
        id: `tr_to_${tr.id}`,
        date: tr.date || new Date().toISOString().split('T')[0],
        accountId: tr.toAccountId,
        accountName: tr.toAccountName || 'Dest Account',
        accountColor: '#8B5CF6',
        payee: `Transfer from ${tr.fromAccountName}`,
        category: 'Internal Transfer',
        memo: tr.notes || '',
        type: 'credit',
        amount: Number(tr.amount) || 0,
        isCleared: clearedMap[`tr_to_${tr.id}`] ?? true,
      });
    });

    // Sort chronologically ascending to calculate running balance
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute cumulative balance
    let running = 0;
    list.forEach((row) => {
      if (row.type === 'credit') running += row.amount;
      else running -= row.amount;
      row.runningBalance = running;
    });

    // Reverse for register display (most recent at top)
    return list.reverse();
  }, [accounts, clearedMap, refreshKey]);

  // Filter rows by account, search, and type
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      // Account filter
      if (selectedAccountId !== 'all' && row.accountId !== selectedAccountId) {
        return false;
      }
      // Type filter
      if (typeFilter === 'debit' && row.type !== 'debit') return false;
      if (typeFilter === 'credit' && row.type !== 'credit') return false;
      if (typeFilter === 'uncleared' && row.isCleared) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPayee = row.payee.toLowerCase().includes(q);
        const matchesCat = row.category.toLowerCase().includes(q);
        const matchesMemo = (row.memo || '').toLowerCase().includes(q);
        const matchesAmount = String(row.amount).includes(q);
        const matchesAcc = row.accountName.toLowerCase().includes(q);
        if (!matchesPayee && !matchesCat && !matchesMemo && !matchesAmount && !matchesAcc) {
          return false;
        }
      }
      return true;
    });
  }, [allRows, selectedAccountId, typeFilter, searchQuery]);

  // Toggle Reconciled / Cleared status
  const handleToggleCleared = (id: string) => {
    setClearedMap((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('mh_quicken_cleared_txs', JSON.stringify(next));
        }
      } catch (e) {}
      return next;
    });
  };

  // Reconcile all visible transactions
  const handleReconcileAll = () => {
    setClearedMap((prev) => {
      const next = { ...prev };
      filteredRows.forEach((row) => {
        next[row.id] = true;
      });
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('mh_quicken_cleared_txs', JSON.stringify(next));
        }
      } catch (e) {}
      return next;
    });
  };

  // KPI Calculations for bottom register summary
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const totalClearedBalance = filteredRows
    .filter((r) => r.isCleared)
    .reduce((sum, r) => sum + (r.type === 'credit' ? r.amount : -r.amount), 0);

  const unclearedCount = filteredRows.filter((r) => !r.isCleared).length;
  const unclearedSum = filteredRows
    .filter((r) => !r.isCleared)
    .reduce((sum, r) => sum + (r.type === 'credit' ? r.amount : -r.amount), 0);

  // CSV Export
  const handleExportCsv = () => {
    if (typeof window === 'undefined') return;
    const headers = ['Date', 'Account', 'Cleared', 'Payee / Description', 'Category', 'Memo', 'Payment (Debit)', 'Deposit (Credit)', 'Balance'];
    const rows = filteredRows.map((r) => [
      r.date,
      `"${r.accountName}"`,
      r.isCleared ? 'Y' : 'N',
      `"${r.payee.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      `"${(r.memo || '').replace(/"/g, '""')}"`,
      r.type === 'debit' ? r.amount : '',
      r.type === 'credit' ? r.amount : '',
      r.runningBalance ?? '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quicken_Register_${selectedAccountId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Register
  const handlePrint = () => {
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Quicken Register Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <View style={styles.quickenLogoBadge}>
            <Ionicons name="receipt-outline" size={18} color="#0284C7" />
          </View>
          <View>
            <Text style={styles.registerTitle}>QUICKEN CHECKBOOK REGISTER</Text>
            <Text style={styles.registerSubtitle}>
              {selectedAccountId === 'all'
                ? `All Accounts Combined (${filteredRows.length} transactions)`
                : `${selectedAccount?.bankName || 'Account'} Register (${filteredRows.length} records)`}
            </Text>
          </View>
        </View>

        <View style={styles.toolbarActions}>
          <TouchableOpacity
            style={[styles.toolBtn, styles.primaryBtn]}
            onPress={onOpenNewTransaction}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={16} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>+ Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={handleReconcileAll} activeOpacity={0.8}>
            <Ionicons name="checkmark-done" size={15} color="#16A34A" />
            <Text style={styles.toolBtnText}>Reconcile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={handleExportCsv} activeOpacity={0.8}>
            <Ionicons name="download-outline" size={15} color="#0284C7" />
            <Text style={styles.toolBtnText}>CSV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={handlePrint} activeOpacity={0.8}>
            <Ionicons name="print-outline" size={15} color="#475569" />
            <Text style={styles.toolBtnText}>Print</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Selector Horizontal Strip */}
      <View style={styles.accountStripContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountStrip}>
          <TouchableOpacity
            style={[styles.accountTab, selectedAccountId === 'all' && styles.accountTabActive]}
            onPress={() => setSelectedAccountId('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.accountTabText, selectedAccountId === 'all' && styles.accountTabTextActive]}>
              All Accounts
            </Text>
            <View style={styles.accountBadgeCount}>
              <Text style={styles.accountBadgeCountText}>{allRows.length}</Text>
            </View>
          </TouchableOpacity>

          {accounts.map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            return (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.accountTab,
                  isSelected && styles.accountTabActive,
                  { borderLeftColor: acc.color || '#0284C7', borderLeftWidth: 3 },
                ]}
                onPress={() => setSelectedAccountId(acc.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.accountTabText, isSelected && styles.accountTabTextActive]}>
                  {acc.bankName}
                </Text>
                <Text style={[styles.accountTabBal, isSelected && { color: '#0284C7' }]}>
                  ৳ {acc.currentBalance.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Filter and Search Ribbon */}
      <View style={styles.filterRibbon}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search payee, category, memo, or amount..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.typeFilterGroup}>
          <TouchableOpacity
            style={[styles.typePill, typeFilter === 'all' && styles.typePillActive]}
            onPress={() => setTypeFilter('all')}
          >
            <Text style={[styles.typePillText, typeFilter === 'all' && styles.typePillTextActive]}>
              All ({allRows.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typePill, typeFilter === 'debit' && styles.typePillActive]}
            onPress={() => setTypeFilter('debit')}
          >
            <Text style={[styles.typePillText, typeFilter === 'debit' && styles.typePillTextActive]}>
              Payments (−)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typePill, typeFilter === 'credit' && styles.typePillActive]}
            onPress={() => setTypeFilter('credit')}
          >
            <Text style={[styles.typePillText, typeFilter === 'credit' && styles.typePillTextActive]}>
              Deposits (+)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typePill, typeFilter === 'uncleared' && styles.typePillActive]}
            onPress={() => setTypeFilter('uncleared')}
          >
            <Text style={[styles.typePillText, typeFilter === 'uncleared' && styles.typePillTextActive]}>
              Uncleared ({allRows.filter((r) => !r.isCleared).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quicken Checkbook Register Table */}
      <View style={styles.registerTableCard}>
        {/* Table Column Headers */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.th, { width: 95 }]}>Date</Text>
          <Text style={[styles.th, { width: 36, textAlign: 'center' }]}>Clr</Text>
          {selectedAccountId === 'all' && (
            <Text style={[styles.th, { width: 120 }]}>Account</Text>
          )}
          <Text style={[styles.th, { flex: 2, minWidth: 160 }]}>Payee / Description</Text>
          <Text style={[styles.th, { width: 140 }]}>Category</Text>
          <Text style={[styles.th, { flex: 1, minWidth: 100 }]}>Memo / Ref</Text>
          <Text style={[styles.th, { width: 110, textAlign: 'right' }]}>Payment (−)</Text>
          <Text style={[styles.th, { width: 110, textAlign: 'right' }]}>Deposit (+)</Text>
          <Text style={[styles.th, { width: 120, textAlign: 'right' }]}>Balance</Text>
        </View>

        {/* Rows Scroll */}
        <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={true}>
          {filteredRows.length === 0 ? (
            <View style={styles.emptyTable}>
              <Text style={{ fontSize: 32 }}>📖</Text>
              <Text style={styles.emptyTableTitle}>No Register Records Found</Text>
              <Text style={styles.emptyTableSub}>
                Try changing your search keywords or tap "+ Transaction" to record an entry.
              </Text>
            </View>
          ) : (
            filteredRows.map((row, idx) => {
              const isDebit = row.type === 'debit';
              const isEven = idx % 2 === 0;

              return (
                <View
                  key={row.id}
                  style={[
                    styles.tableRow,
                    isEven ? styles.tableRowEven : styles.tableRowOdd,
                    !row.isCleared && styles.tableRowUncleared,
                  ]}
                >
                  {/* Date */}
                  <Text style={[styles.td, { width: 95, fontWeight: '700', color: '#0F172A' }]}>
                    {row.date}
                  </Text>

                  {/* Clr Status (Reconciliation Toggle) */}
                  <TouchableOpacity
                    style={[styles.clrBox, row.isCleared && styles.clrBoxChecked]}
                    onPress={() => handleToggleCleared(row.id)}
                    activeOpacity={0.7}
                  >
                    {row.isCleared ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.clrText}>U</Text>
                    )}
                  </TouchableOpacity>

                  {/* Account Badge (if viewing all) */}
                  {selectedAccountId === 'all' && (
                    <View style={[styles.accountPill, { borderColor: `${row.accountColor}44` }]}>
                      <View style={[styles.accountDot, { backgroundColor: row.accountColor }]} />
                      <Text style={styles.accountPillText} numberOfLines={1}>
                        {row.accountName}
                      </Text>
                    </View>
                  )}

                  {/* Payee / Description */}
                  <View style={{ flex: 2, minWidth: 160 }}>
                    <Text style={styles.payeeText} numberOfLines={1}>
                      {row.payee}
                    </Text>
                  </View>

                  {/* Category Pill */}
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText} numberOfLines={1}>
                      {row.category}
                    </Text>
                  </View>

                  {/* Memo */}
                  <View style={{ flex: 1, minWidth: 100 }}>
                    <Text style={styles.memoText} numberOfLines={1}>
                      {row.memo || '—'}
                    </Text>
                  </View>

                  {/* Payment (Debit) */}
                  <Text
                    style={[
                      styles.td,
                      styles.paymentText,
                      { width: 110, textAlign: 'right' },
                    ]}
                  >
                    {isDebit ? `৳ ${row.amount.toLocaleString('en-IN')}` : '—'}
                  </Text>

                  {/* Deposit (Credit) */}
                  <Text
                    style={[
                      styles.td,
                      styles.depositText,
                      { width: 110, textAlign: 'right' },
                    ]}
                  >
                    {!isDebit ? `৳ ${row.amount.toLocaleString('en-IN')}` : '—'}
                  </Text>

                  {/* Running Balance */}
                  <Text
                    style={[
                      styles.td,
                      styles.balanceText,
                      { width: 120, textAlign: 'right' },
                    ]}
                  >
                    {row.runningBalance !== undefined
                      ? `৳ ${row.runningBalance.toLocaleString('en-IN')}`
                      : '—'}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Quicken Register Bottom KPI Footer */}
      <View style={styles.footerKpis}>
        <View style={styles.footerKpiBox}>
          <Text style={styles.footerKpiLabel}>Cleared Balance</Text>
          <Text style={[styles.footerKpiVal, { color: totalClearedBalance >= 0 ? '#10B981' : '#DC2626' }]}>
            ৳ {totalClearedBalance.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.footerDivider} />

        <View style={styles.footerKpiBox}>
          <Text style={styles.footerKpiLabel}>Uncleared Transactions</Text>
          <Text style={[styles.footerKpiVal, { color: unclearedCount > 0 ? '#F59E0B' : '#64748B' }]}>
            {unclearedCount} items (৳ {Math.abs(unclearedSum).toLocaleString('en-IN')})
          </Text>
        </View>

        <View style={styles.footerDivider} />

        <View style={styles.footerKpiBox}>
          <Text style={styles.footerKpiLabel}>Ending Register Balance</Text>
          <Text style={[styles.footerKpiVal, { color: '#0F172A', fontWeight: '900' }]}>
            ৳ {((selectedAccount?.currentBalance ?? totalClearedBalance)).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    maxWidth: 1380,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.md,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickenLogoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  registerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  registerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  primaryBtn: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  accountStripContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
  },
  accountStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  accountTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accountTabActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  accountTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  accountTabTextActive: {
    color: '#0284C7',
    fontWeight: '800',
  },
  accountTabBal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  accountBadgeCount: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  accountBadgeCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  filterRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    flex: 1,
    minWidth: 260,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 2,
  },
  typeFilterGroup: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typePillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  registerTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableBody: {
    maxHeight: 520,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  tableRowEven: {
    backgroundColor: '#FFFFFF',
  },
  tableRowOdd: {
    backgroundColor: '#F8FAFC',
  },
  tableRowUncleared: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  td: {
    fontSize: 12,
    color: '#334155',
  },
  clrBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clrBoxChecked: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  clrText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  accountPill: {
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  accountDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  accountPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  payeeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryPill: {
    width: 140,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  memoText: {
    fontSize: 11,
    color: '#64748B',
  },
  paymentText: {
    fontWeight: '800',
    color: '#DC2626',
  },
  depositText: {
    fontWeight: '800',
    color: '#16A34A',
  },
  balanceText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyTable: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptyTableSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  footerKpis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerKpiBox: {
    alignItems: 'center',
    flex: 1,
    minWidth: 150,
  },
  footerKpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  footerKpiVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  footerDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
});
