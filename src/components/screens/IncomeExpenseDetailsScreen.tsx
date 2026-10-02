import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../theme';
import {
  TransactionManager,
  BankAccountItem,
  ExpenseItem,
  IncomeItem,
  TransferRecord,
  CASH_IN_HAND_ID,
  subscribeToBalanceUpdates,
} from '../../services/transactionManager';

type PresetRange = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'CUSTOM';

interface DailyAccountMovements {
  date: string; // YYYY-MM-DD
  dayLabel: string;
  incomes: Record<string, number>; // accountId -> amount
  totalIncome: number;
  expenses: Record<string, number>; // accountId -> amount
  totalExpense: number;
  incomeItems: IncomeItem[];
  expenseItems: ExpenseItem[];
}

interface IncomeExpenseDetailsScreenProps {
  onBackToDashboard?: () => void;
  onOpenNewTransaction?: () => void;
}

export const IncomeExpenseDetailsScreen: React.FC<IncomeExpenseDetailsScreenProps> = ({
  onBackToDashboard,
  onOpenNewTransaction,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Date Range State (Default: 1 Month — Current Month)
  const [rangePreset, setRangePreset] = useState<PresetRange>('THIS_MONTH');
  
  const today = useMemo(() => new Date(), []);
  const defaultStartDate = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }, [today]);

  const defaultEndDate = useMemo(() => {
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }, [today]);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [viewFilter, setViewFilter] = useState<'ALL' | 'INCOMES_ONLY' | 'EXPENSES_ONLY'>('ALL');
  const [showEmptyDays, setShowEmptyDays] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<DailyAccountMovements | null>(null);

  // Subscribe to real-time balance changes
  useEffect(() => {
    const unsub = subscribeToBalanceUpdates(() => {
      setRefreshKey((k) => k + 1);
    });
    return () => unsub();
  }, []);

  // Preset Handler
  const applyPreset = (preset: PresetRange) => {
    setRangePreset(preset);
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-indexed

    if (preset === 'THIS_MONTH') {
      const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'LAST_MONTH') {
      const prevDate = new Date(y, m - 1, 1);
      const py = prevDate.getFullYear();
      const pm = prevDate.getMonth();
      const start = `${py}-${String(pm + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(py, pm + 1, 0).getDate();
      const end = `${py}-${String(pm + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'LAST_3_MONTHS') {
      const threeMonthsAgo = new Date(y, m - 2, 1);
      const ty = threeMonthsAgo.getFullYear();
      const tm = threeMonthsAgo.getMonth();
      const start = `${ty}-${String(tm + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'THIS_YEAR') {
      setStartDate(`${y}-01-01`);
      setEndDate(`${y}-12-31`);
    }
  };

  // 1. Enlisted Accounts (Cash in Hand + All dynamically added banks)
  const accounts: BankAccountItem[] = useMemo(() => {
    const _ = refreshKey;
    const raw = TransactionManager.getAccountsWithCash();
    // Put Cash in Hand first, followed by all banks
    const cash = raw.find((a) => a.id === CASH_IN_HAND_ID || a.accountType === 'Physical Cash');
    const banks = raw.filter((a) => a.id !== CASH_IN_HAND_ID && a.accountType !== 'Physical Cash');
    return cash ? [cash, ...banks] : raw;
  }, [refreshKey]);

  // 2. Raw Transactions
  const rawExpenses = useMemo(() => {
    const _ = refreshKey;
    return TransactionManager.getStoredExpenses();
  }, [refreshKey]);

  const rawIncomes = useMemo(() => {
    const _ = refreshKey;
    return TransactionManager.getStoredIncomes();
  }, [refreshKey]);

  // 3. Mathematical Opening Balances as of startDate
  // OpeningBalance = CurrentBalance - (Sum of Incomes on or after startDate) + (Sum of Expenses on or after startDate)
  const openingBalances = useMemo(() => {
    const balances: Record<string, number> = {};

    accounts.forEach((acc) => {
      let bal = acc.currentBalance || 0;

      // Deduct incomes that occurred on or after startDate
      rawIncomes.forEach((inc) => {
        const incAccId = inc.accountId || CASH_IN_HAND_ID;
        if (incAccId === acc.id && inc.date >= startDate) {
          bal -= (inc.amount || 0);
        }
      });

      // Add back expenses that occurred on or after startDate
      rawExpenses.forEach((exp) => {
        const expAccId = exp.accountId || CASH_IN_HAND_ID;
        if (expAccId === acc.id && exp.date >= startDate) {
          bal += (exp.amount || 0);
        }
      });

      balances[acc.id] = bal;
    });

    return balances;
  }, [accounts, rawIncomes, rawExpenses, startDate]);

  const totalOpeningBalance = useMemo(() => {
    return Object.values(openingBalances).reduce((sum, b) => sum + b, 0);
  }, [openingBalances]);

  // 4. Daily Movements Aggregator across date range
  const dailyMovements = useMemo(() => {
    const map = new Map<string, DailyAccountMovements>();

    // If showEmptyDays is true, pre-seed all dates in range
    if (showEmptyDays && startDate <= endDate) {
      const cur = new Date(startDate);
      const end = new Date(endDate);
      while (cur <= end) {
        const dStr = cur.toISOString().split('T')[0];
        const dayLabel = cur.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
        map.set(dStr, {
          date: dStr,
          dayLabel,
          incomes: {},
          totalIncome: 0,
          expenses: {},
          totalExpense: 0,
          incomeItems: [],
          expenseItems: [],
        });
        cur.setDate(cur.getDate() + 1);
      }
    }

    // Populate Incomes
    rawIncomes.forEach((inc) => {
      const d = inc.date;
      if (d >= startDate && d <= endDate) {
        if (!map.has(d)) {
          const dt = new Date(d);
          const dayLabel = isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
          map.set(d, {
            date: d,
            dayLabel,
            incomes: {},
            totalIncome: 0,
            expenses: {},
            totalExpense: 0,
            incomeItems: [],
            expenseItems: [],
          });
        }
        const row = map.get(d)!;
        const accId = inc.accountId || CASH_IN_HAND_ID;
        row.incomes[accId] = (row.incomes[accId] || 0) + (inc.amount || 0);
        row.totalIncome += (inc.amount || 0);
        row.incomeItems.push(inc);
      }
    });

    // Populate Expenses
    rawExpenses.forEach((exp) => {
      const d = exp.date;
      if (d >= startDate && d <= endDate) {
        if (!map.has(d)) {
          const dt = new Date(d);
          const dayLabel = isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
          map.set(d, {
            date: d,
            dayLabel,
            incomes: {},
            totalIncome: 0,
            expenses: {},
            totalExpense: 0,
            incomeItems: [],
            expenseItems: [],
          });
        }
        const row = map.get(d)!;
        const accId = exp.accountId || CASH_IN_HAND_ID;
        row.expenses[accId] = (row.expenses[accId] || 0) + (exp.amount || 0);
        row.totalExpense += (exp.amount || 0);
        row.expenseItems.push(exp);
      }
    });

    // Sort ascending by date
    const sorted = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    return sorted;
  }, [rawIncomes, rawExpenses, startDate, endDate, showEmptyDays]);

  // 5. Total Period Movements per Account
  const totalPeriodIncomes = useMemo(() => {
    const sums: Record<string, number> = {};
    accounts.forEach((a) => {
      sums[a.id] = dailyMovements.reduce((acc, m) => acc + (m.incomes[a.id] || 0), 0);
    });
    return sums;
  }, [accounts, dailyMovements]);

  const grandTotalIncomes = useMemo(() => {
    return Object.values(totalPeriodIncomes).reduce((sum, v) => sum + v, 0);
  }, [totalPeriodIncomes]);

  const totalPeriodExpenses = useMemo(() => {
    const sums: Record<string, number> = {};
    accounts.forEach((a) => {
      sums[a.id] = dailyMovements.reduce((acc, m) => acc + (m.expenses[a.id] || 0), 0);
    });
    return sums;
  }, [accounts, dailyMovements]);

  const grandTotalExpenses = useMemo(() => {
    return Object.values(totalPeriodExpenses).reduce((sum, v) => sum + v, 0);
  }, [totalPeriodExpenses]);

  // 6. Mathematical Closing Balances
  // ClosingBalance = OpeningBalance + TotalPeriodIncomes - TotalPeriodExpenses
  const closingBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach((a) => {
      balances[a.id] = (openingBalances[a.id] || 0) + (totalPeriodIncomes[a.id] || 0) - (totalPeriodExpenses[a.id] || 0);
    });
    return balances;
  }, [accounts, openingBalances, totalPeriodIncomes, totalPeriodExpenses]);

  const totalClosingBalance = useMemo(() => {
    return Object.values(closingBalances).reduce((sum, b) => sum + b, 0);
  }, [closingBalances]);

  // CSV Export
  const handleExportCsv = () => {
    try {
      const headers = [
        'Date',
        ...accounts.map((a) => `Income (${a.bankName})`),
        'Total Incomes',
        ...accounts.map((a) => `Expense (${a.bankName})`),
        'Total Expenses',
      ];

      const rows: string[] = [];
      // Row 1: Opening
      rows.push([
        'OPENING BALANCE',
        ...accounts.map((a) => (openingBalances[a.id] || 0).toFixed(2)),
        totalOpeningBalance.toFixed(2),
        ...accounts.map(() => '0.00'),
        '0.00',
      ].join(','));

      // Daily rows
      dailyMovements.forEach((m) => {
        const row = [
          m.date,
          ...accounts.map((a) => (m.incomes[a.id] || 0).toFixed(2)),
          m.totalIncome.toFixed(2),
          ...accounts.map((a) => (m.expenses[a.id] || 0).toFixed(2)),
          m.totalExpense.toFixed(2),
        ];
        rows.push(row.join(','));
      });

      // Sum row
      rows.push([
        'SUM OF MOVEMENTS',
        ...accounts.map((a) => (totalPeriodIncomes[a.id] || 0).toFixed(2)),
        grandTotalIncomes.toFixed(2),
        ...accounts.map((a) => (totalPeriodExpenses[a.id] || 0).toFixed(2)),
        grandTotalExpenses.toFixed(2),
      ].join(','));

      // Closing row
      rows.push([
        'CLOSING BALANCE',
        ...accounts.map((a) => (closingBalances[a.id] || 0).toFixed(2)),
        totalClosingBalance.toFixed(2),
        ...accounts.map(() => '0.00'),
        '0.00',
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Income_Expense_Details_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        Alert.alert('CSV Generated', 'CSV file is ready for download.');
      }
    } catch (e) {
      console.warn('CSV export error:', e);
    }
  };

  // Browser Print
  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    } else {
      Alert.alert('Print Report', 'Connect to a printer or use web export.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Toolbar */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          {onBackToDashboard && (
            <TouchableOpacity style={styles.backBtn} onPress={onBackToDashboard} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={18} color="#0F172A" />
            </TouchableOpacity>
          )}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.title}>Incomes - Expenses Details</Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>Dual Cash Book</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Audited daily ledger with dynamic bank columns, opening and closing balances
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.iconActionBtn} onPress={handleExportCsv} activeOpacity={0.8}>
            <Ionicons name="download-outline" size={16} color="#0284C7" />
            <Text style={styles.iconActionText}>CSV Export</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconActionBtn} onPress={handlePrint} activeOpacity={0.8}>
            <Ionicons name="print-outline" size={16} color="#475569" />
            <Text style={styles.iconActionText}>Print</Text>
          </TouchableOpacity>

          {onOpenNewTransaction && (
            <TouchableOpacity style={styles.primaryActionBtn} onPress={onOpenNewTransaction} activeOpacity={0.85}>
              <Ionicons name="add-circle" size={17} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>+ Transaction</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Date Range & Filters Bar */}
      <View style={styles.filterCard}>
        <View style={styles.presetsRow}>
          <Text style={styles.filterLabel}>DATE RANGE:</Text>
          {(['THIS_MONTH', 'LAST_MONTH', 'LAST_3_MONTHS', 'THIS_YEAR'] as PresetRange[]).map((p) => {
            const labels: Record<PresetRange, string> = {
              THIS_MONTH: 'This Month',
              LAST_MONTH: 'Last Month',
              LAST_3_MONTHS: 'Last 3 Months',
              THIS_YEAR: 'This Year',
              CUSTOM: 'Custom',
            };
            const isActive = rangePreset === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.presetBtn, isActive && styles.presetBtnActive]}
                onPress={() => applyPreset(p)}
                activeOpacity={0.8}
              >
                <Text style={[styles.presetBtnText, isActive && styles.presetBtnTextActive]}>
                  {labels[p]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom Date Pickers & View Toggles */}
        <View style={styles.dateInputsRow}>
          <View style={styles.dateInputGroup}>
            <Text style={styles.inputMiniLabel}>FROM</Text>
            <TextInput
              style={styles.dateInput}
              value={startDate}
              onChangeText={(t) => {
                setStartDate(t);
                setRangePreset('CUSTOM');
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.dateInputGroup}>
            <Text style={styles.inputMiniLabel}>TO</Text>
            <TextInput
              style={styles.dateInput}
              value={endDate}
              onChangeText={(t) => {
                setEndDate(t);
                setRangePreset('CUSTOM');
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Toggle View Mode */}
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewFilter === 'ALL' && styles.toggleBtnActive]}
              onPress={() => setViewFilter('ALL')}
            >
              <Text style={[styles.toggleText, viewFilter === 'ALL' && styles.toggleTextActive]}>Both</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewFilter === 'INCOMES_ONLY' && styles.toggleBtnActive]}
              onPress={() => setViewFilter('INCOMES_ONLY')}
            >
              <Text style={[styles.toggleText, viewFilter === 'INCOMES_ONLY' && styles.toggleTextActive]}>Incomes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewFilter === 'EXPENSES_ONLY' && styles.toggleBtnActive]}
              onPress={() => setViewFilter('EXPENSES_ONLY')}
            >
              <Text style={[styles.toggleText, viewFilter === 'EXPENSES_ONLY' && styles.toggleTextActive]}>Expenses</Text>
            </TouchableOpacity>
          </View>

          {/* Show All 31 Days Toggle */}
          <TouchableOpacity
            style={[styles.emptyDaysBtn, showEmptyDays && styles.emptyDaysBtnActive]}
            onPress={() => setShowEmptyDays(!showEmptyDays)}
            activeOpacity={0.8}
          >
            <Ionicons name={showEmptyDays ? 'checkbox' : 'square-outline'} size={15} color={showEmptyDays ? '#0284C7' : '#64748B'} />
            <Text style={[styles.emptyDaysText, showEmptyDays && { color: '#0284C7' }]}>Show All Days</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Executive Summary Bar (Opening vs Net vs Closing) */}
      <View style={styles.executiveBar}>
        <View style={styles.execStat}>
          <Text style={styles.execLabel}>TOTAL OPENING BALANCE</Text>
          <Text style={styles.execVal}>৳ {totalOpeningBalance.toLocaleString('en-IN')}</Text>
          <Text style={styles.execSub}>As of {startDate}</Text>
        </View>

        <View style={styles.execDivider} />

        <View style={styles.execStat}>
          <Text style={[styles.execLabel, { color: '#16A34A' }]}>TOTAL INCOMES (+)</Text>
          <Text style={[styles.execVal, { color: '#16A34A' }]}>+৳ {grandTotalIncomes.toLocaleString('en-IN')}</Text>
          <Text style={styles.execSub}>{accounts.length} Accounts Credited</Text>
        </View>

        <View style={styles.execDivider} />

        <View style={styles.execStat}>
          <Text style={[styles.execLabel, { color: '#EF4444' }]}>TOTAL EXPENSES (−)</Text>
          <Text style={[styles.execVal, { color: '#EF4444' }]}>−৳ {grandTotalExpenses.toLocaleString('en-IN')}</Text>
          <Text style={styles.execSub}>{dailyMovements.reduce((c, m) => c + m.expenseItems.length, 0)} Transactions</Text>
        </View>

        <View style={styles.execDivider} />

        <View style={styles.execStat}>
          <Text style={[styles.execLabel, { color: '#0284C7' }]}>TOTAL CLOSING BALANCE</Text>
          <Text style={[styles.execVal, { color: '#0284C7' }]}>৳ {totalClosingBalance.toLocaleString('en-IN')}</Text>
          <Text style={styles.execSub}>Net: {grandTotalIncomes >= grandTotalExpenses ? '+' : '−'}৳ {Math.abs(grandTotalIncomes - grandTotalExpenses).toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* 4. Full Dual-Column Two-Part Table */}
      <View style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Super Header: Left Incomes vs Right Expenses */}
            <View style={styles.superHeaderRow}>
              <View style={[styles.superHeaderCell, styles.dateCol]}>
                <Text style={styles.superHeaderText}>TIMELINE</Text>
              </View>

              {viewFilter !== 'EXPENSES_ONLY' && (
                <View style={[styles.superHeaderCell, styles.incomesSuperCol]}>
                  <Ionicons name="arrow-down-circle" size={15} color="#16A34A" />
                  <Text style={[styles.superHeaderText, { color: '#16A34A' }]}>
                    INCOMES & CREDITS (LEFT SIDE)
                  </Text>
                </View>
              )}

              {viewFilter !== 'INCOMES_ONLY' && (
                <View style={[styles.superHeaderCell, styles.expensesSuperCol]}>
                  <Ionicons name="arrow-up-circle" size={15} color="#EF4444" />
                  <Text style={[styles.superHeaderText, { color: '#EF4444' }]}>
                    EXPENSES & DEBITS (RIGHT SIDE)
                  </Text>
                </View>
              )}
            </View>

            {/* Sub-Header Row: Date | Cash in Hand | Bank 1 | Bank 2 ... | Total */}
            <View style={styles.headerRow}>
              <View style={[styles.thCell, styles.dateCol]}>
                <Text style={styles.thText}>Date</Text>
              </View>

              {/* Incomes Sub-columns */}
              {viewFilter !== 'EXPENSES_ONLY' && (
                <>
                  {accounts.map((acc) => (
                    <View key={`inc_h_${acc.id}`} style={styles.dataCol}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: acc.color || '#16A34A' }} />
                        <Text style={styles.thText} numberOfLines={1}>{acc.bankName}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={[styles.dataCol, styles.totalCol, { backgroundColor: '#F0FDF4' }]}>
                    <Text style={[styles.thText, { color: '#16A34A', fontWeight: '900' }]}>Total Incomes</Text>
                  </View>
                </>
              )}

              {/* Expenses Sub-columns */}
              {viewFilter !== 'INCOMES_ONLY' && (
                <>
                  {accounts.map((acc) => (
                    <View key={`exp_h_${acc.id}`} style={styles.dataCol}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: acc.color || '#EF4444' }} />
                        <Text style={styles.thText} numberOfLines={1}>{acc.bankName}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={[styles.dataCol, styles.totalCol, { backgroundColor: '#FEF2F2' }]}>
                    <Text style={[styles.thText, { color: '#DC2626', fontWeight: '900' }]}>Total Expenses</Text>
                  </View>
                </>
              )}
            </View>

            <ScrollView style={{ maxHeight: 520 }}>
              {/* ROW 1: OPENING BALANCE */}
              <View style={[styles.tr, styles.openingRow]}>
                <View style={[styles.tdCell, styles.dateCol]}>
                  <Text style={[styles.openingLabelText]}>OPENING BALANCE</Text>
                </View>

                {/* Opening Incomes Side */}
                {viewFilter !== 'EXPENSES_ONLY' && (
                  <>
                    {accounts.map((acc) => (
                      <View key={`open_inc_${acc.id}`} style={styles.dataCol}>
                        <Text style={styles.openingBalVal}>
                          ৳ {(openingBalances[acc.id] || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ))}
                    <View style={[styles.dataCol, styles.totalCol, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.openingBalVal, { color: '#15803D', fontWeight: '900' }]}>
                        ৳ {totalOpeningBalance.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </>
                )}

                {/* Opening Expenses Side (Shows same baseline balance) */}
                {viewFilter !== 'INCOMES_ONLY' && (
                  <>
                    {accounts.map((acc) => (
                      <View key={`open_exp_${acc.id}`} style={styles.dataCol}>
                        <Text style={[styles.openingBalVal, { color: '#94A3B8' }]}>—</Text>
                      </View>
                    ))}
                    <View style={[styles.dataCol, styles.totalCol, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.openingBalVal, { color: '#94A3B8' }]}>—</Text>
                    </View>
                  </>
                )}
              </View>

              {/* DAILY TRANSACTION ROWS */}
              {dailyMovements.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic' }}>
                    No recorded movements within {startDate} to {endDate}.
                  </Text>
                </View>
              ) : (
                dailyMovements.map((day, idx) => {
                  const isEven = idx % 2 === 0;
                  const hasMovement = day.totalIncome > 0 || day.totalExpense > 0;

                  return (
                    <TouchableOpacity
                      key={day.date}
                      style={[
                        styles.tr,
                        isEven && styles.trEven,
                        !hasMovement && { opacity: 0.5 },
                      ]}
                      onPress={() => setSelectedDayDetail(day)}
                      activeOpacity={0.7}
                    >
                      {/* Date Column */}
                      <View style={[styles.tdCell, styles.dateCol]}>
                        <Text style={styles.dateCellText}>{day.dayLabel}</Text>
                        <Text style={styles.dateCellSub}>{day.date}</Text>
                      </View>

                      {/* Incomes Under Respective Accounts */}
                      {viewFilter !== 'EXPENSES_ONLY' && (
                        <>
                          {accounts.map((acc) => {
                            const val = day.incomes[acc.id] || 0;
                            return (
                              <View key={`day_inc_${acc.id}_${day.date}`} style={styles.dataCol}>
                                <Text style={[styles.amountCellText, val > 0 && { color: '#16A34A', fontWeight: '800' }]}>
                                  {val > 0 ? `৳ ${val.toLocaleString('en-IN')}` : '—'}
                                </Text>
                              </View>
                            );
                          })}
                          <View style={[styles.dataCol, styles.totalCol, { backgroundColor: '#F0FDF4' }]}>
                            <Text style={[styles.amountCellText, day.totalIncome > 0 && { color: '#15803D', fontWeight: '900' }]}>
                              {day.totalIncome > 0 ? `৳ ${day.totalIncome.toLocaleString('en-IN')}` : '—'}
                            </Text>
                          </View>
                        </>
                      )}

                      {/* Expenses Under Respective Accounts */}
                      {viewFilter !== 'INCOMES_ONLY' && (
                        <>
                          {accounts.map((acc) => {
                            const val = day.expenses[acc.id] || 0;
                            return (
                              <View key={`day_exp_${acc.id}_${day.date}`} style={styles.dataCol}>
                                <Text style={[styles.amountCellText, val > 0 && { color: '#EF4444', fontWeight: '800' }]}>
                                  {val > 0 ? `৳ ${val.toLocaleString('en-IN')}` : '—'}
                                </Text>
                              </View>
                            );
                          })}
                          <View style={[styles.dataCol, styles.totalCol, { backgroundColor: '#FEF2F2' }]}>
                            <Text style={[styles.amountCellText, day.totalExpense > 0 && { color: '#DC2626', fontWeight: '900' }]}>
                              {day.totalExpense > 0 ? `৳ ${day.totalExpense.toLocaleString('en-IN')}` : '—'}
                            </Text>
                          </View>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}

              {/* BOTTOM ROW 1: SUM OF ALL FIGURES */}
              <View style={[styles.tr, styles.sumRow]}>
                <View style={[styles.tdCell, styles.dateCol]}>
                  <Text style={styles.summaryLabelText}>SUM OF FIGURES</Text>
                  <Text style={styles.summarySubLabel}>Period Total</Text>
                </View>

                {/* Income Sums */}
                {viewFilter !== 'EXPENSES_ONLY' && (
                  <>
                    {accounts.map((acc) => (
                      <View key={`sum_inc_${acc.id}`} style={styles.dataCol}>
                        <Text style={[styles.sumValText, { color: '#16A34A' }]}>
                          ৳ {(totalPeriodIncomes[acc.id] || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ))}
                    <View style={[styles.dataCol, styles.totalCol, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.sumValText, { color: '#15803D', fontWeight: '900' }]}>
                        +৳ {grandTotalIncomes.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </>
                )}

                {/* Expense Sums */}
                {viewFilter !== 'INCOMES_ONLY' && (
                  <>
                    {accounts.map((acc) => (
                      <View key={`sum_exp_${acc.id}`} style={styles.dataCol}>
                        <Text style={[styles.sumValText, { color: '#EF4444' }]}>
                          ৳ {(totalPeriodExpenses[acc.id] || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ))}
                    <View style={[styles.dataCol, styles.totalCol, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.sumValText, { color: '#DC2626', fontWeight: '900' }]}>
                        −৳ {grandTotalExpenses.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* BOTTOM ROW 2: CLOSING BALANCES */}
              <View style={[styles.tr, styles.closingRow]}>
                <View style={[styles.tdCell, styles.dateCol]}>
                  <Text style={styles.closingLabelText}>CLOSING BALANCE</Text>
                  <Text style={styles.closingSubLabel}>Open + In − Out</Text>
                </View>

                {/* Closing Balance under Accounts */}
                {viewFilter !== 'EXPENSES_ONLY' && (
                  <>
                    {accounts.map((acc) => (
                      <View key={`close_inc_${acc.id}`} style={styles.dataCol}>
                        <Text style={[styles.closingValText, { color: '#0284C7' }]}>
                          ৳ {(closingBalances[acc.id] || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ))}
                    <View style={[styles.dataCol, styles.totalCol, { backgroundColor: '#E0F2FE' }]}>
                      <Text style={[styles.closingValText, { color: '#0369A1', fontWeight: '900' }]}>
                        ৳ {totalClosingBalance.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </>
                )}

                {/* Closing on Right */}
                {viewFilter !== 'INCOMES_ONLY' && (
                  <>
                    {accounts.map((acc) => (
                      <View key={`close_exp_${acc.id}`} style={styles.dataCol}>
                        <Text style={[styles.closingValText, { color: '#64748B' }]}>
                          ৳ {(closingBalances[acc.id] || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ))}
                    <View style={[styles.dataCol, styles.totalCol, { backgroundColor: '#E0F2FE' }]}>
                      <Text style={[styles.closingValText, { color: '#0369A1', fontWeight: '900' }]}>
                        ৳ {totalClosingBalance.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* 5. Day Transaction Drilldown Modal / Popover */}
      {selectedDayDetail && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Daily Breakdown: {selectedDayDetail.dayLabel}</Text>
                <Text style={styles.modalSub}>{selectedDayDetail.date}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDayDetail(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350, marginTop: 10 }}>
              {/* Incomes */}
              <Text style={[styles.drilldownSectionTitle, { color: '#16A34A' }]}>
                Incomes ({selectedDayDetail.incomeItems.length}) • Total: +৳ {selectedDayDetail.totalIncome.toLocaleString('en-IN')}
              </Text>
              {selectedDayDetail.incomeItems.length === 0 ? (
                <Text style={styles.emptyDrillText}>No incomes recorded on this date.</Text>
              ) : (
                selectedDayDetail.incomeItems.map((inc) => (
                  <View key={inc.id} style={styles.drillItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drillItemTitle}>{inc.title}</Text>
                      <Text style={styles.drillItemSub}>
                        {inc.category} • Credited to: {inc.destinationAccount || 'Account'}
                      </Text>
                      {inc.notes ? <Text style={styles.drillItemNotes}>Notes: {inc.notes}</Text> : null}
                    </View>
                    <Text style={[styles.drillItemAmount, { color: '#16A34A' }]}>
                      +৳ {inc.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))
              )}

              {/* Expenses */}
              <Text style={[styles.drilldownSectionTitle, { color: '#EF4444', marginTop: 16 }]}>
                Expenses ({selectedDayDetail.expenseItems.length}) • Total: −৳ {selectedDayDetail.totalExpense.toLocaleString('en-IN')}
              </Text>
              {selectedDayDetail.expenseItems.length === 0 ? (
                <Text style={styles.emptyDrillText}>No expenses recorded on this date.</Text>
              ) : (
                selectedDayDetail.expenseItems.map((exp) => (
                  <View key={exp.id} style={styles.drillItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drillItemTitle}>{exp.title}</Text>
                      <Text style={styles.drillItemSub}>
                        {exp.category} • Paid via: {exp.paymentMethod || 'Account'}
                      </Text>
                      {exp.notes ? <Text style={styles.drillItemNotes}>Notes: {exp.notes}</Text> : null}
                    </View>
                    <Text style={[styles.drillItemAmount, { color: '#EF4444' }]}>
                      −৳ {exp.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: '#F8FAFC',
    maxWidth: 1600,
    alignSelf: 'center',
    width: '100%',
  },
  topHeader: {
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  iconActionBtn: {
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
  iconActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#0284C7',
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  presetBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  presetBtnTextActive: {
    color: '#FFFFFF',
  },
  dateInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  dateInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputMiniLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  dateInput: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    width: 110,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  emptyDaysBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyDaysBtnActive: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  emptyDaysText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  executiveBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  execStat: {
    flex: 1,
    minWidth: 150,
  },
  execLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  execVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  execSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  execDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  superHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  superHeaderCell: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  superHeaderText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  incomesSuperCol: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 1,
    borderLeftColor: '#BBF7D0',
    flex: 1,
  },
  expensesSuperCol: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 1,
    borderLeftColor: '#FECACA',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
  },
  dateCol: {
    width: 130,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  dataCol: {
    width: 140,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  totalCol: {
    width: 150,
    borderLeftWidth: 1.5,
    borderLeftColor: '#CBD5E1',
  },
  thCell: {
    paddingVertical: 8,
    justifyContent: 'center',
  },
  thText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    minHeight: 40,
    alignItems: 'center',
  },
  trEven: {
    backgroundColor: '#FAFAFA',
  },
  tdCell: {
    justifyContent: 'center',
  },
  dateCellText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateCellSub: {
    fontSize: 10,
    color: '#64748B',
  },
  amountCellText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  openingRow: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 2,
    borderBottomColor: '#CBD5E1',
  },
  openingLabelText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  openingBalVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  sumRow: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 2,
    borderTopColor: '#CBD5E1',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  summaryLabelText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
  },
  summarySubLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  sumValText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  closingRow: {
    backgroundColor: '#F0F9FF',
    borderBottomWidth: 0,
  },
  closingLabelText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  closingSubLabel: {
    fontSize: 10,
    color: '#0284C7',
  },
  closingValText: {
    fontSize: 13,
    fontWeight: '900',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    maxWidth: 600,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
  },
  drilldownSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  emptyDrillText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  drillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  drillItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  drillItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  drillItemNotes: {
    fontSize: 10.5,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 2,
  },
  drillItemAmount: {
    fontSize: 13,
    fontWeight: '900',
  },
});
