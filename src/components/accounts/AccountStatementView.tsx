/**
 * AccountStatementView.tsx
 * Dedicated Analytics, Cash Flow Graph & Ledger Statement Component for Bank Accounts & Cash in Hand.
 * Supports:
 * - Monthly view with month-by-month navigation (< Sep 2026 >)
 * - Yearly view with year-by-year navigation (< 2026 >)
 * - All-time total activity view
 * - Total Credits (Inflow) vs Total Debits (Outflow) KPI badges
 * - Interactive SVG Cash Flow Graph
 * - Itemized chronological transaction ledger with credit/debit badges
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  TransactionManager,
  AccountPeriodicStats,
  subscribeToBalanceUpdates,
} from '../../services/transactionManager';
import { AccountCashFlowGraph } from './AccountCashFlowGraph';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export interface AccountStatementViewProps {
  accountId: string;
  accountName: string;
  accountType?: string;
  currentBalance: number;
  color?: string;
  onClose?: () => void;
}

export type PeriodMode = 'monthly' | 'yearly' | 'all';

export const AccountStatementView: React.FC<AccountStatementViewProps> = ({
  accountId,
  accountName,
  accountType,
  currentBalance,
  color = '#0284C7',
  onClose,
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  const [periodMode, setPeriodMode] = useState<PeriodMode>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [statementFilter, setStatementFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to transaction changes for immediate real-time updates
  useEffect(() => {
    const unsub = subscribeToBalanceUpdates(() => {
      setRefreshKey((k) => k + 1);
    });
    return () => unsub();
  }, []);

  // Compute periodic stats based on mode
  const stats: AccountPeriodicStats = useMemo(() => {
    // Touch refreshKey to trigger recompute on balance change
    const _ = refreshKey;
    if (periodMode === 'monthly') {
      return TransactionManager.getAccountMonthlyStats(accountId, selectedYear, selectedMonth);
    } else if (periodMode === 'yearly') {
      return TransactionManager.getAccountYearlyStats(accountId, selectedYear);
    } else {
      return TransactionManager.getAccountAllTimeStats(accountId);
    }
  }, [accountId, periodMode, selectedYear, selectedMonth, refreshKey]);

  // Navigate back/forward
  const handlePrevPeriod = () => {
    if (periodMode === 'monthly') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear((y) => y - 1);
      } else {
        setSelectedMonth((m) => m - 1);
      }
    } else if (periodMode === 'yearly') {
      setSelectedYear((y) => y - 1);
    }
  };

  const handleNextPeriod = () => {
    if (periodMode === 'monthly') {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear((y) => y + 1);
      } else {
        setSelectedMonth((m) => m + 1);
      }
    } else if (periodMode === 'yearly') {
      setSelectedYear((y) => y + 1);
    }
  };

  const handleJumpToCurrent = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
  };

  const isCurrentPeriod =
    periodMode === 'monthly'
      ? selectedYear === currentYear && selectedMonth === currentMonth
      : selectedYear === currentYear;

  // Filter transactions for statement
  const filteredTransactions = useMemo(() => {
    if (statementFilter === 'all') return stats.transactions;
    return stats.transactions.filter((tx) => tx.type === statementFilter);
  }, [stats.transactions, statementFilter]);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.headerDot, { backgroundColor: color }]} />
          <View>
            <Text style={styles.headerTitle}>{accountName} Analytics</Text>
            <Text style={styles.headerSubtitle}>
              Cash Flow Graph, Debits, Credits & Statement Ledger
            </Text>
          </View>
        </View>

        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.75}>
            <Ionicons name="close" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Period Selection Controls */}
      <View style={styles.controlsRow}>
        {/* Mode Selector Tabs: Monthly, Yearly, All-Time */}
        <View style={styles.periodTabs}>
          <TouchableOpacity
            style={[styles.periodTab, periodMode === 'monthly' && styles.periodTabActive]}
            onPress={() => setPeriodMode('monthly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.periodTabText, periodMode === 'monthly' && styles.periodTabTextActive]}>
              📅 Monthly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.periodTab, periodMode === 'yearly' && styles.periodTabActive]}
            onPress={() => setPeriodMode('yearly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.periodTabText, periodMode === 'yearly' && styles.periodTabTextActive]}>
              🗓️ Yearly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.periodTab, periodMode === 'all' && styles.periodTabActive]}
            onPress={() => setPeriodMode('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.periodTabText, periodMode === 'all' && styles.periodTabTextActive]}>
              🌐 All-Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Navigator (< Month / Year >) */}
        {periodMode !== 'all' && (
          <View style={styles.navigatorRow}>
            <TouchableOpacity
              style={styles.navArrowBtn}
              onPress={handlePrevPeriod}
              activeOpacity={0.75}
            >
              <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.periodLabelBox}>
              <Text style={styles.periodLabelText}>{stats.periodLabel}</Text>
            </View>

            <TouchableOpacity
              style={styles.navArrowBtn}
              onPress={handleNextPeriod}
              activeOpacity={0.75}
            >
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            {!isCurrentPeriod && (
              <TouchableOpacity
                style={styles.todayBtn}
                onPress={handleJumpToCurrent}
                activeOpacity={0.8}
              >
                <Text style={styles.todayBtnText}>Current</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* KPI Cards: Total Credits (Inflow), Total Debits (Outflow), Net Flow */}
      <View style={styles.kpiGrid}>
        {/* 1. Inflow / Credit Card */}
        <View style={[styles.kpiCard, styles.kpiCardCredit]}>
          <View style={styles.kpiTop}>
            <Ionicons name="arrow-down-circle" size={18} color="#10B981" />
            <Text style={styles.kpiLabel}>TOTAL INFLOW (CREDIT)</Text>
          </View>
          <Text style={[styles.kpiAmount, { color: '#10B981' }]} numberOfLines={1}>
            +৳ {stats.totalCredits.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.kpiSub}>{stats.creditCount} Deposit / Income Records</Text>
        </View>

        {/* 2. Outflow / Debit Card */}
        <View style={[styles.kpiCard, styles.kpiCardDebit]}>
          <View style={styles.kpiTop}>
            <Ionicons name="arrow-up-circle" size={18} color="#EF4444" />
            <Text style={styles.kpiLabel}>TOTAL OUTFLOW (DEBIT)</Text>
          </View>
          <Text style={[styles.kpiAmount, { color: '#EF4444' }]} numberOfLines={1}>
            -৳ {stats.totalDebits.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.kpiSub}>{stats.debitCount} Expense / Withdrawal Records</Text>
        </View>

        {/* 3. Net Flow Card */}
        <View style={[styles.kpiCard, styles.kpiCardNet]}>
          <View style={styles.kpiTop}>
            <Ionicons
              name={stats.netFlow >= 0 ? 'trending-up' : 'trending-down'}
              size={18}
              color={stats.netFlow >= 0 ? '#10B981' : '#EF4444'}
            />
            <Text style={styles.kpiLabel}>NET CASH FLOW</Text>
          </View>
          <Text
            style={[
              styles.kpiAmount,
              { color: stats.netFlow >= 0 ? '#10B981' : '#EF4444' },
            ]}
            numberOfLines={1}
          >
            {stats.netFlow >= 0 ? '+' : ''}৳ {stats.netFlow.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.kpiSub}>
            {stats.netFlow >= 0 ? 'Surplus Inflow' : 'Deficit Outflow'} for {stats.periodLabel}
          </Text>
        </View>
      </View>

      {/* Cash Flow Visual Graph */}
      <View style={styles.graphContainer}>
        <View style={styles.graphHeader}>
          <Ionicons name="bar-chart-outline" size={16} color="#38BDF8" />
          <Text style={styles.graphTitle}>
            CASH FLOW TRAJECTORY ({stats.periodLabel.toUpperCase()})
          </Text>
        </View>
        <AccountCashFlowGraph
          data={stats.chartData}
          periodLabel={stats.periodLabel}
          totalCredits={stats.totalCredits}
          totalDebits={stats.totalDebits}
          netFlow={stats.netFlow}
          height={190}
        />
      </View>

      {/* Itemized Mini Statement Ledger */}
      <View style={styles.statementSection}>
        <View style={styles.statementHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="receipt-outline" size={16} color="#0284C7" />
            <Text style={styles.statementTitle}>
              TRANSACTION STATEMENT ({filteredTransactions.length})
            </Text>
          </View>

          {/* Statement Filters: All, Credits, Debits */}
          <View style={styles.filterPillGroup}>
            <TouchableOpacity
              style={[styles.filterPill, statementFilter === 'all' && styles.filterPillActive]}
              onPress={() => setStatementFilter('all')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  statementFilter === 'all' && styles.filterPillTextActive,
                ]}
              >
                All ({stats.transactions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                statementFilter === 'credit' && styles.filterPillActiveCredit,
              ]}
              onPress={() => setStatementFilter('credit')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  statementFilter === 'credit' && styles.filterPillTextActiveCredit,
                ]}
              >
                Credits ({stats.creditCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                statementFilter === 'debit' && styles.filterPillActiveDebit,
              ]}
              onPress={() => setStatementFilter('debit')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  statementFilter === 'debit' && styles.filterPillTextActiveDebit,
                ]}
              >
                Debits ({stats.debitCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction Items */}
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <Ionicons name="document-text-outline" size={32} color="#64748B" />
            <Text style={styles.emptyTransactionsTitle}>No Transactions in this Period</Text>
            <Text style={styles.emptyTransactionsSub}>
              No {statementFilter === 'all' ? 'debit or credit' : statementFilter} activities recorded for {stats.periodLabel}.
            </Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {filteredTransactions.map((tx) => {
              const isCredit = tx.type === 'credit';
              return (
                <View key={tx.id} style={styles.txItem}>
                  <View style={styles.txLeft}>
                    <View
                      style={[
                        styles.txIconBox,
                        { backgroundColor: isCredit ? '#10B98118' : '#EF444418' },
                      ]}
                    >
                      <Ionicons
                        name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
                        size={16}
                        color={isCredit ? '#10B981' : '#EF4444'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.txTitle}>{tx.title}</Text>
                        <View
                          style={[
                            styles.badgeType,
                            { backgroundColor: isCredit ? '#10B98120' : '#EF444420' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeTypeText,
                              { color: isCredit ? '#10B981' : '#EF4444' },
                            ]}
                          >
                            {isCredit ? 'CREDIT' : 'DEBIT'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.txSub}>
                        {tx.category} • {tx.date}
                        {tx.sourceOrDest ? ` • ${tx.sourceOrDest}` : ''}
                      </Text>
                      {tx.notes ? <Text style={styles.txNotes}>{tx.notes}</Text> : null}
                    </View>
                  </View>

                  <View style={styles.txRight}>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: isCredit ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {isCredit ? '+৳ ' : '-৳ '}
                      {tx.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B1120',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  periodTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodTabActive: {
    backgroundColor: '#0284C7',
  },
  periodTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  periodTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodLabelBox: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  periodLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  todayBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  todayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#131D33',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  kpiCardCredit: {
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  kpiCardDebit: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  kpiCardNet: {
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  kpiAmount: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: '#64748B',
  },
  graphContainer: {
    backgroundColor: '#131D33',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  graphHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  graphTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  statementSection: {
    backgroundColor: '#131D33',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statementHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  statementTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  filterPillGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  filterPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  filterPillActive: {
    backgroundColor: '#0284C7',
  },
  filterPillActiveCredit: {
    backgroundColor: '#10B981',
  },
  filterPillActiveDebit: {
    backgroundColor: '#EF4444',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillTextActiveCredit: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillTextActiveDebit: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTransactionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 6,
  },
  emptyTransactionsSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  txList: {
    gap: 8,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A243B',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  txIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  badgeType: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeTypeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  txSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  txNotes: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 1,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
});
