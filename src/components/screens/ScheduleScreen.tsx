import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { FirebaseSyncService } from '../../services/firebaseSync';
import { useAuth } from '../../auth/AuthContext';
import { SoundService } from '../../services/soundEffects';
import {
  SanchaypatraEarningsService,
  SANCHAYPATRA_MASTER_PORTFOLIO,
  SanchaypatraCouponScheduleItem,
} from '../../services/sanchaypatraEarningsService';
import {
  TransactionManager,
  CASH_IN_HAND_ID,
  BankAccountItem,
} from '../../services/transactionManager';

export type ScheduleFrequency = 'monthly' | 'quarterly' | 'yearly';
export type ScheduleFlowType = 'income' | 'expense';

export interface ScheduledItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  flowType: ScheduleFlowType;
  dueDay: number; // 1 to 31
  frequency: ScheduleFrequency;
  linkedAccount?: string; // 'ACC-CASH-IN-HAND' or bank account id/name
  targetType?: 'cash' | 'bank';
  isAutoDebit?: boolean;
  notes?: string;
  lastPaidDate?: string;
  status?: 'active' | 'paused';
}

const SCHEDULE_STORAGE_KEY = 'mh_user_schedules';

export const getStoredSchedules = (): ScheduledItem[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (raw) {
        const list: ScheduledItem[] = JSON.parse(raw);
        const hasBankSalary = list.some(
          (i) => i.id === 'SCH-SALARY-BANK' || (i.flowType === 'income' && i.title.toLowerCase().includes('salary') && i.targetType === 'bank')
        );
        const hasCashSalary = list.some(
          (i) => i.id === 'SCH-SALARY-CASH' || (i.flowType === 'income' && i.title.toLowerCase().includes('salary') && (i.targetType === 'cash' || i.linkedAccount?.toLowerCase().includes('cash')))
        );

        if (!hasBankSalary || !hasCashSalary) {
          const filtered = list.filter((i) => i.id !== 'SCH-SALARY-01' && !i.title.toLowerCase().includes('executive tech salary'));
          const bankSalary: ScheduledItem = {
            id: 'SCH-SALARY-BANK',
            title: 'Primary Tech Salary (Sonali Bank PLC)',
            category: 'Salary',
            amount: 100000,
            flowType: 'income',
            dueDay: 7, // 5th to 10th window
            frequency: 'monthly',
            linkedAccount: 'Sonali Bank PLC',
            targetType: 'bank',
            isAutoDebit: true,
            notes: 'Monthly corporate payroll direct deposit into Sonali Bank PLC (credited 5th–10th)',
            status: 'active',
          };
          const cashSalary: ScheduledItem = {
            id: 'SCH-SALARY-CASH',
            title: 'Executive Salary & Allowance (Cash in Hand)',
            category: 'Salary',
            amount: 25000,
            flowType: 'income',
            dueDay: 7, // 5th to 10th window
            frequency: 'monthly',
            linkedAccount: 'Cash in Hand',
            targetType: 'cash',
            isAutoDebit: false,
            notes: 'Physical cash disbursement for executive allowances & living expenses (received 5th–10th)',
            status: 'active',
          };
          const upgraded = [bankSalary, cashSalary, ...filtered];
          saveStoredSchedules(upgraded);
          return upgraded;
        }
        return list;
      }
    }
  } catch (e) {}

  // Default seed schedules if empty
  return [
    {
      id: 'SCH-SALARY-BANK',
      title: 'Primary Tech Salary (Sonali Bank PLC)',
      category: 'Salary',
      amount: 100000,
      flowType: 'income',
      dueDay: 7, // 5th to 10th window
      frequency: 'monthly',
      linkedAccount: 'Sonali Bank PLC',
      targetType: 'bank',
      isAutoDebit: true,
      notes: 'Monthly corporate payroll direct deposit into Sonali Bank PLC (credited 5th–10th)',
      status: 'active',
    },
    {
      id: 'SCH-SALARY-CASH',
      title: 'Executive Salary & Allowance (Cash in Hand)',
      category: 'Salary',
      amount: 25000,
      flowType: 'income',
      dueDay: 7, // 5th to 10th window
      frequency: 'monthly',
      linkedAccount: 'Cash in Hand',
      targetType: 'cash',
      isAutoDebit: false,
      notes: 'Physical cash disbursement for executive allowances & living expenses (received 5th–10th)',
      status: 'active',
    },
    {
      id: 'SCH-CONSULT-02',
      title: 'IT Consultancy Retainer',
      category: 'Business',
      amount: 45000,
      flowType: 'income',
      dueDay: 10,
      frequency: 'monthly',
      linkedAccount: 'Cash in Hand',
      targetType: 'cash',
      isAutoDebit: false,
      notes: 'Direct client payment in cash',
      status: 'active',
    },
    {
      id: 'SCH-RENT-03',
      title: 'Apartment Rental Income',
      category: 'Rental Yield',
      amount: 32000,
      flowType: 'income',
      dueDay: 5,
      frequency: 'monthly',
      linkedAccount: 'Sonali Bank PLC',
      targetType: 'bank',
      isAutoDebit: true,
      notes: 'Residential flat tenancy yield',
      status: 'active',
    },
    {
      id: 'SCH-EXP-RENT-01',
      title: 'House Living Rent',
      category: 'Housing',
      amount: 35000,
      flowType: 'expense',
      dueDay: 5,
      frequency: 'monthly',
      linkedAccount: 'Sonali Bank PLC',
      targetType: 'bank',
      isAutoDebit: true,
      status: 'active',
    },
    {
      id: 'SCH-EXP-UTIL-02',
      title: 'Electricity & Utility Bills',
      category: 'Utilities',
      amount: 8500,
      flowType: 'expense',
      dueDay: 12,
      frequency: 'monthly',
      linkedAccount: 'Cash in Hand',
      targetType: 'cash',
      status: 'active',
    },
  ];
};

export const saveStoredSchedules = (list: ScheduledItem[]) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {}
};

export const ScheduleScreen: React.FC = () => {
  const { user } = useAuth();
  const currentUid = user?.id || 'rashed01';

  const [schedules, setSchedules] = useState<ScheduledItem[]>(() => getStoredSchedules());
  const [activeTab, setActiveTab] = useState<'overview' | 'sanchaypatra' | 'incomes' | 'expenses'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduledItem | null>(null);

  // Sanchaypatra coupons & portfolio state
  const [sanchayCoupons, setSanchayCoupons] = useState<SanchaypatraCouponScheduleItem[]>(() =>
    SanchaypatraEarningsService.getAllScheduleItems()
  );
  const sanchaySummary = useMemo(() => SanchaypatraEarningsService.getPortfolioSummary(), [sanchayCoupons]);

  // Sanchaypatra View & Expansion states
  const [showOnlyAdvanced, setShowOnlyAdvanced] = useState(true);
  const [expandedCertNumber, setExpandedCertNumber] = useState<string | null>(null);

  // Accounts list for target routing
  const [accounts, setAccounts] = useState<BankAccountItem[]>(() => TransactionManager.getAccountsWithCash());

  const reloadSanchaypatra = () => {
    setSanchayCoupons(SanchaypatraEarningsService.getAllScheduleItems());
    setAccounts(TransactionManager.getAccountsWithCash());
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handler = () => reloadSanchaypatra();
      window.addEventListener('mh_sanchaypatra_coupon_updated', handler);
      window.addEventListener('mh_balance_updated', handler);
      return () => {
        window.removeEventListener('mh_sanchaypatra_coupon_updated', handler);
        window.removeEventListener('mh_balance_updated', handler);
      };
    }
  }, []);

  // Form State
  const [flowType, setFlowType] = useState<ScheduleFlowType>('income');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('monthly');
  const [targetType, setTargetType] = useState<'bank' | 'cash'>('bank');
  const [linkedAccount, setLinkedAccount] = useState('Sonali Bank PLC');
  const [isAutoDebit, setIsAutoDebit] = useState(false);
  const [notes, setNotes] = useState('');

  // Persist and sync helper
  const updateAndPersist = (newList: ScheduledItem[]) => {
    setSchedules(newList);
    saveStoredSchedules(newList);
    FirebaseSyncService.pushCategory(currentUid, 'schedules', newList);
  };

  // Aggregated calculations for tentative monthly cash flows
  const stats = useMemo(() => {
    let monthlyScheduledSalary = 0;
    let monthlyCashInHand = 0;
    let monthlyBankInflow = 0;
    let monthlyExpense = 0;

    schedules.forEach((item) => {
      const multiplier = item.frequency === 'quarterly' ? 1 / 3 : item.frequency === 'yearly' ? 1 / 12 : 1;
      const normalizedAmt = item.amount * multiplier;

      if (item.flowType === 'income') {
        monthlyScheduledSalary += normalizedAmt;
        if (item.targetType === 'cash' || item.linkedAccount?.toLowerCase().includes('cash')) {
          monthlyCashInHand += normalizedAmt;
        } else {
          monthlyBankInflow += normalizedAmt;
        }
      } else {
        monthlyExpense += normalizedAmt;
      }
    });

    // Sanchaypatra 3-month quarterly earnings: total quarterly net / 3 gives monthly average
    const sanchayMonthlyEquivalent = sanchaySummary.quarterlyNetProfit / 3;
    const totalTentativeMonthlyIncome = monthlyScheduledSalary + sanchayMonthlyEquivalent;
    const netProjectedSurplus = totalTentativeMonthlyIncome - monthlyExpense;

    return {
      monthlyScheduledSalary,
      sanchayMonthlyEquivalent,
      sanchayQuarterlyInflow: sanchaySummary.quarterlyNetProfit,
      totalTentativeMonthlyIncome,
      monthlyBankInflow: monthlyBankInflow + sanchayMonthlyEquivalent, // Sanchaypatra goes to Sonali Bank
      monthlyCashInHand,
      monthlyExpense,
      netProjectedSurplus,
      incomeCount: schedules.filter((s) => s.flowType === 'income').length,
      expenseCount: schedules.filter((s) => s.flowType === 'expense').length,
    };
  }, [schedules, sanchaySummary]);

  // Days remaining calculation
  const getDaysRemaining = (dayOfMonth: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    if (dayOfMonth === currentDay) return 0;
    if (dayOfMonth > currentDay) return dayOfMonth - currentDay;
    const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return lastDayThisMonth - currentDay + dayOfMonth;
  };

  // Check 5th to 10th salary countdown status
  const getSalaryWindowStatus = (dayOfMonth: number) => {
    const today = new Date();
    const currentDay = today.getDate();

    if (currentDay >= 5 && currentDay <= 10) {
      return {
        isActive: true,
        label: '🎯 Deposit Window Active (5th-10th)',
        badgeColor: '#16A34A',
        textColor: '#FFFFFF',
      };
    }

    if (currentDay < 5) {
      const days = 5 - currentDay;
      return {
        isActive: false,
        label: `⏱️ ${days} days until 5th–10th window`,
        badgeColor: '#FEF3C7',
        textColor: '#B45309',
      };
    }

    // Past 10th
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const days = lastDay - currentDay + 5;
    return {
      isActive: false,
      label: `Next cycle in ${days} days`,
      badgeColor: '#F1F5F9',
      textColor: '#475569',
    };
  };

  const handleOpenAdd = (type: ScheduleFlowType) => {
    setEditingItem(null);
    setFlowType(type);
    setTitle('');
    setCategory(type === 'income' ? 'Salary' : 'Housing');
    setAmount('');
    setDueDay('7');
    setFrequency('monthly');
    setTargetType('bank');
    setLinkedAccount('Sonali Bank PLC');
    setIsAutoDebit(false);
    setNotes('');
    setShowAddModal(true);
  };

  const handleEdit = (item: ScheduledItem) => {
    setEditingItem(item);
    setFlowType(item.flowType);
    setTitle(item.title);
    setCategory(item.category);
    setAmount(item.amount.toString());
    setDueDay(item.dueDay.toString());
    setFrequency(item.frequency);
    setTargetType(item.targetType || 'bank');
    setLinkedAccount(item.linkedAccount || 'Sonali Bank PLC');
    setIsAutoDebit(!!item.isAutoDebit);
    setNotes(item.notes || '');
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    const next = schedules.filter((s) => s.id !== id);
    updateAndPersist(next);
  };

  // Deposit Scheduled Income into Bank or Cash in Hand
  const handleDepositIncome = (item: ScheduledItem) => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Determine target account ID
    let targetAccId = CASH_IN_HAND_ID;
    if (item.targetType === 'bank' || (item.linkedAccount && !item.linkedAccount.toLowerCase().includes('cash'))) {
      const match = accounts.find(
        (a) =>
          a.id === item.linkedAccount ||
          a.bankName.toLowerCase().includes(item.linkedAccount!.toLowerCase()) ||
          a.accountName.toLowerCase().includes(item.linkedAccount!.toLowerCase())
      );
      targetAccId = match ? match.id : 'ACC-SONALI-01';
    }

    const { income } = TransactionManager.recordIncome({
      title: item.title,
      amount: item.amount,
      category: item.category || 'Salary',
      accountId: targetAccId,
      date: todayStr,
      notes: `Deposited via Automated Schedules Dashboard into ${
        targetAccId === CASH_IN_HAND_ID ? 'Cash in Hand' : item.linkedAccount || 'Bank'
      } (${todayStr}).`,
    });

    const next = schedules.map((s) => (s.id === item.id ? { ...s, lastPaidDate: todayStr } : s));
    updateAndPersist(next);

    SoundService.playDepositSuccessSound();
    Alert.alert(
      '✅ Income Successfully Deposited',
      `৳ ${item.amount.toLocaleString('en-IN')} has been credited into ${
        targetAccId === CASH_IN_HAND_ID ? 'Physical Cash in Hand' : item.linkedAccount || 'Bank Account'
      }!`
    );
  };

  // Deposit Sanchaypatra Coupon into Sonali Bank PLC
  const handleDepositSanchaypatra = (couponId: string) => {
    const res = SanchaypatraEarningsService.confirmAndDepositToSonaliBank(couponId);
    if (res.success) {
      SoundService.playDepositSuccessSound();
      reloadSanchaypatra();
      Alert.alert('✅ Sanchaypatra Profit Credited', res.message);
    } else {
      Alert.alert('Notice', res.message);
    }
  };

  // Mark all past coupons as read/cleared
  const handleClearAllPastCoupons = () => {
    const cleared = SanchaypatraEarningsService.markAllPastCouponsAsRead();
    reloadSanchaypatra();
    SoundService.playAlertSound();
    Alert.alert(
      '🧹 Past Schedules Cleared',
      cleared > 0
        ? `${cleared} elapsed quarterly schedule notifications marked as read and dismissed. Displaying active and advanced schedules.`
        : 'All past notifications are already cleared.'
    );
  };

  // Mark single coupon as read
  const handleMarkCouponRead = (couponId: string) => {
    SanchaypatraEarningsService.markCouponAsRead(couponId);
    reloadSanchaypatra();
    SoundService.playAlertSound();
  };

  // Unmark coupon read (restore to active view)
  const handleUnmarkCouponRead = (couponId: string) => {
    SanchaypatraEarningsService.unmarkCouponAsRead(couponId);
    reloadSanchaypatra();
  };

  const handleSaveItem = () => {
    if (!title.trim() || !amount.trim()) {
      Alert.alert('Required Fields', 'Please enter a title and amount.');
      return;
    }

    const parsedAmt = parseFloat(amount.replace(/,/g, '')) || 0;
    const parsedDay = Math.min(31, Math.max(1, parseInt(dueDay, 10) || 1));

    if (editingItem) {
      const updated: ScheduledItem = {
        ...editingItem,
        flowType,
        title: title.trim(),
        category: category.trim() || (flowType === 'income' ? 'Income' : 'Expense'),
        amount: parsedAmt,
        dueDay: parsedDay,
        frequency,
        targetType,
        linkedAccount: linkedAccount.trim() || (targetType === 'cash' ? 'Cash in Hand' : 'Sonali Bank PLC'),
        isAutoDebit,
        notes: notes.trim() || undefined,
      };
      const next = schedules.map((s) => (s.id === editingItem.id ? updated : s));
      updateAndPersist(next);
    } else {
      const newItem: ScheduledItem = {
        id: `SCH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        flowType,
        title: title.trim(),
        category: category.trim() || (flowType === 'income' ? 'Income' : 'Expense'),
        amount: parsedAmt,
        dueDay: parsedDay,
        frequency,
        targetType,
        linkedAccount: linkedAccount.trim() || (targetType === 'cash' ? 'Cash in Hand' : 'Sonali Bank PLC'),
        isAutoDebit,
        notes: notes.trim() || undefined,
        status: 'active',
      };
      updateAndPersist([...schedules, newItem]);
    }

    setShowAddModal(false);
  };

  const incomeList = schedules.filter((s) => s.flowType === 'income');
  const expenseList = schedules.filter((s) => s.flowType === 'expense');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Header with Title & Quick Add Actions */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Automated Cash Flow & Schedules</Text>
          <Text style={styles.pageSubtitle}>
            Track recurring salaries (5th–10th window), Sanchaypatra 3-month quarterly payouts & utility dues
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: '#16A34A' }]}
            onPress={() => handleOpenAdd('income')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>+ Scheduled Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: '#DC2626' }]}
            onPress={() => handleOpenAdd('expense')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>+ Scheduled Expense</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Top Navigation Tabs */}
      <View style={styles.tabNavRow}>
        {[
          { id: 'overview', label: '📊 Consolidated Overview', icon: 'pie-chart' },
          { id: 'sanchaypatra', label: '📜 Sanchaypatra (3-Mo Hub)', icon: 'document-text', badge: 'Sonali Bank' },
          { id: 'incomes', label: `💼 Incomes (${incomeList.length})`, icon: 'wallet', badge: '5th–10th' },
          { id: 'expenses', label: `💳 Expenses (${expenseList.length})`, icon: 'card' },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}
            onPress={() => setActiveTab(t.id as any)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={t.icon as any}
              size={16}
              color={activeTab === t.id ? '#FFFFFF' : '#475569'}
            />
            <Text style={[styles.tabBtnText, activeTab === t.id && styles.tabBtnTextActive]}>
              {t.label}
            </Text>
            {t.badge && (
              <View
                style={[
                  styles.tabBadge,
                  { backgroundColor: activeTab === t.id ? 'rgba(255,255,255,0.25)' : '#E0F2FE' },
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    { color: activeTab === t.id ? '#FFFFFF' : '#0284C7' },
                  ]}
                >
                  {t.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ================= TAB 1: CONSOLIDATED OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <View style={{ gap: 18 }}>
          {/* Executive Summary Cards */}
          <View style={styles.statsGrid}>
            {/* Total Tentative Monthly Income */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="arrow-down-circle" size={20} color="#16A34A" />
                <Text style={styles.statLabel}>TENTATIVE MONTHLY INFLOW</Text>
              </View>
              <Text style={[styles.statValue, { color: '#16A34A' }]}>
                ৳ {Math.round(stats.totalTentativeMonthlyIncome).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statSub}>
                Salary & Recurring: ৳{Math.round(stats.monthlyScheduledSalary).toLocaleString('en-IN')} • Sanchaypatra share: ৳{Math.round(stats.sanchayMonthlyEquivalent).toLocaleString('en-IN')}/mo
              </Text>
            </View>

            {/* Total Tentative Monthly Expenses */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="arrow-up-circle" size={20} color="#DC2626" />
                <Text style={styles.statLabel}>MONTHLY OBLIGATIONS & DUES</Text>
              </View>
              <Text style={[styles.statValue, { color: '#DC2626' }]}>
                ৳ {Math.round(stats.monthlyExpense).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statSub}>
                ৳ {(stats.monthlyExpense / 100000).toFixed(2)} Lakhs • {stats.expenseCount} Recurring Obligations
              </Text>
            </View>

            {/* Net Monthly Projected Surplus */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="sparkles" size={20} color={stats.netProjectedSurplus >= 0 ? '#0284C7' : '#D97706'} />
                <Text style={styles.statLabel}>PROJECTED MONTHLY SURPLUS</Text>
              </View>
              <Text style={[styles.statValue, { color: stats.netProjectedSurplus >= 0 ? '#0284C7' : '#DC2626' }]}>
                {stats.netProjectedSurplus >= 0 ? '+' : '−'}৳ {Math.round(Math.abs(stats.netProjectedSurplus)).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statSub}>
                {stats.netProjectedSurplus >= 0 ? '▲ Free Cash Flow' : '▼ Structural Deficit'} (৳ {(Math.abs(stats.netProjectedSurplus) / 100000).toFixed(2)}L)
              </Text>
            </View>
          </View>

          {/* Inflow Destination Breakdown Banner */}
          <View style={styles.destBanner}>
            <Text style={styles.destBannerTitle}>📥 TENTATIVE INFLOW DISTRIBUTION BY DESTINATION</Text>
            <View style={styles.destGrid}>
              <View style={styles.destItem}>
                <View style={[styles.destIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="business" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.destLabel}>Bank Accounts Inflow</Text>
                  <Text style={styles.destVal}>৳ {Math.round(stats.monthlyBankInflow).toLocaleString('en-IN')}</Text>
                  <Text style={styles.destHint}>Salary + Sanchaypatra into Sonali Bank</Text>
                </View>
              </View>

              <View style={styles.destItem}>
                <View style={[styles.destIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="cash" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text style={styles.destLabel}>Cash in Hand Inflow</Text>
                  <Text style={styles.destVal}>৳ {Math.round(stats.monthlyCashInHand).toLocaleString('en-IN')}</Text>
                  <Text style={styles.destHint}>Direct cash earnings & retainers</Text>
                </View>
              </View>

              <View style={styles.destItem}>
                <View style={[styles.destIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="document-text" size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.destLabel}>Sanchaypatra Inflow (Quarterly)</Text>
                  <Text style={styles.destVal}>৳ {Math.round(stats.sanchayQuarterlyInflow).toLocaleString('en-IN')}</Text>
                  <Text style={styles.destHint}>3-Month Interval • 9 Certificates</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Action Preview: Next Sanchaypatra Coupon Due */}
          {sanchaySummary.nextDueCoupon && (
            <View style={styles.highlightCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.destIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="time" size={22} color="#16A34A" />
                  </View>
                  <View>
                    <Text style={styles.highlightTitle}>
                      Next Sanchaypatra Profit Due: #{sanchaySummary.nextDueCoupon.certificateNumber}
                    </Text>
                    <Text style={styles.highlightSub}>
                      Scheduled Date: {sanchaySummary.nextDueCoupon.couponDate} • Linked: {sanchaySummary.nextDueCoupon.linkedBankName}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.statValue, { color: '#16A34A', fontSize: 18 }]}>
                      ৳ {sanchaySummary.nextDueCoupon.netAmount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706' }}>
                      {sanchaySummary.nextDueCoupon.daysRemaining <= 0
                        ? '🚨 Due Now / Ready to Deposit'
                        : `⏱️ ${sanchaySummary.nextDueCoupon.daysRemaining} Days Countdown`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.depositActionBtn}
                    onPress={() => handleDepositSanchaypatra(sanchaySummary.nextDueCoupon!.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.depositActionBtnText}>Confirm Deposited</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ================= TAB 2: SANCHAYPATRA 3-MONTH INTERVAL HUB ================= */}
      {activeTab === 'sanchaypatra' && (
        <View style={{ gap: 16 }}>
          {/* Sanchaypatra Rules & Info Header */}
          <View style={styles.rulesBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="information-circle" size={20} color="#0284C7" />
              <Text style={styles.rulesTitle}>
                ৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র (3-Month Interval Rules & Schedule)
              </Text>
            </View>
            <Text style={styles.rulesText}>
              From the date of issue, every 3 months profit is deposited automatically or ready to be encashed.
              Total Principal: <Text style={{ fontWeight: '800' }}>৳ 30,00,000</Text> across 9 registered certificates. All net payouts credit directly to <Text style={{ fontWeight: '800', color: '#0369A1' }}>Sonali Bank PLC (A/C: SONALI-0102030405)</Text>.
            </Text>

            <View style={styles.sanchayKpiRow}>
              <View style={styles.sanchayKpi}>
                <Text style={styles.sanchayKpiLabel}>TOTAL PRINCIPAL</Text>
                <Text style={styles.sanchayKpiVal}>৳ 30,00,000</Text>
              </View>
              <View style={styles.sanchayKpi}>
                <Text style={styles.sanchayKpiLabel}>QUARTERLY NET PROFIT</Text>
                <Text style={[styles.sanchayKpiVal, { color: '#16A34A' }]}>
                  ৳ {sanchaySummary.quarterlyNetProfit.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.sanchayKpi}>
                <Text style={styles.sanchayKpiLabel}>ANNUAL NET PROFIT</Text>
                <Text style={[styles.sanchayKpiVal, { color: '#16A34A' }]}>
                  ৳ {sanchaySummary.annualNetProfit.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.sanchayKpi}>
                <Text style={styles.sanchayKpiLabel}>TOTAL 3-YEAR NET</Text>
                <Text style={[styles.sanchayKpiVal, { color: '#0284C7' }]}>
                  ৳ {sanchaySummary.total3YearNetYield.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Toolbar: Clear Past & Advanced View Mode */}
          <View style={styles.sanchayToolbar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
              <TouchableOpacity
                style={styles.clearPastToolbarBtn}
                onPress={handleClearAllPastCoupons}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done-circle" size={16} color="#0284C7" />
                <Text style={styles.clearPastToolbarBtnText}>🧹 Mark All Past as Read</Text>
              </TouchableOpacity>
              <Text style={styles.toolbarHintText}>
                Dismisses elapsed 2025/past notifications & keeps only active upcoming schedules
              </Text>
            </View>

            <View style={styles.viewModeFilterRow}>
              <TouchableOpacity
                style={[styles.viewModePill, showOnlyAdvanced && styles.viewModePillActive]}
                onPress={() => setShowOnlyAdvanced(true)}
              >
                <Text style={[styles.viewModePillText, showOnlyAdvanced && styles.viewModePillTextActive]}>
                  ⚡ Advanced Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewModePill, !showOnlyAdvanced && styles.viewModePillActive]}
                onPress={() => setShowOnlyAdvanced(false)}
              >
                <Text style={[styles.viewModePillText, !showOnlyAdvanced && styles.viewModePillTextActive]}>
                  📜 All Quarters (108)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sanchaypatra Certificates Payout Timeline */}
          <View style={styles.listContainer}>
            {SANCHAYPATRA_MASTER_PORTFOLIO.map((item) => {
              // Find all coupons for this certificate
              const certCoupons = sanchayCoupons.filter((c) => c.certificateNumber === item.certificateNumber);
              const pendingActive = certCoupons.filter((c) => c.status === 'PENDING' && (!showOnlyAdvanced || !c.isRead));
              const nextCoupon = pendingActive.length > 0 ? pendingActive[0] : (certCoupons.find((c) => c.status === 'PENDING') || null);
              const isDeposited = !nextCoupon;
              const isPastDueUnread = nextCoupon && nextCoupon.isPastDue && !nextCoupon.isRead;
              const isExpanded = expandedCertNumber === item.certificateNumber;

              return (
                <View key={item.certificateNumber} style={styles.scheduleCardWrapper}>
                  <View style={styles.scheduleCard}>
                    <View style={[styles.accentStripe, { backgroundColor: isDeposited ? '#94A3B8' : '#16A34A' }]} />

                    <View style={styles.cardMain}>
                      {/* Header */}
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardHeaderLeft}>
                          <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                            <Ionicons name="document-text" size={20} color="#16A34A" />
                          </View>
                          <View>
                            <Text style={styles.itemTitle}>
                              {item.schemeName} #{item.certificateNumber}
                            </Text>
                            <Text style={styles.itemCategory}>
                              Issue Date: {item.issueDate} • Principal: ৳ {item.principalAmount.toLocaleString('en-IN')} • 3-Month Interval
                            </Text>
                          </View>
                        </View>

                        {/* Amounts */}
                        <View style={styles.amountCol}>
                          <Text style={[styles.itemAmount, { color: '#16A34A' }]}>
                            +৳ {item.quarterlyNet.toLocaleString('en-IN')}
                          </Text>
                          <Text style={styles.itemAmountLakhs}>
                            Gross: ৳{item.quarterlyGross.toLocaleString('en-IN')} (Tax: 10%)
                          </Text>
                        </View>
                      </View>

                      {/* Next Deposit Date & Countdown */}
                      <View style={styles.cardFooterRow}>
                        <View style={styles.badgeRow}>
                          {nextCoupon ? (
                            <View
                              style={[
                                styles.dueBadge,
                                nextCoupon.daysRemaining <= 0 && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
                                nextCoupon.daysRemaining > 0 && nextCoupon.daysRemaining <= 15 && { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
                              ]}
                            >
                              <Ionicons
                                name={nextCoupon.daysRemaining <= 0 ? 'alert-circle' : 'time-outline'}
                                size={14}
                                color={nextCoupon.daysRemaining <= 0 ? '#DC2626' : '#B45309'}
                              />
                              <Text
                                style={[
                                  styles.dueBadgeText,
                                  nextCoupon.daysRemaining <= 0 && { color: '#DC2626', fontWeight: '800' },
                                  nextCoupon.daysRemaining > 0 && { color: '#B45309', fontWeight: '800' },
                                ]}
                              >
                                {nextCoupon.daysRemaining <= 0
                                  ? `Due: ${nextCoupon.couponDate} (${Math.abs(nextCoupon.daysRemaining)}d ago)`
                                  : `Next Payout: ${nextCoupon.couponDate} (${nextCoupon.daysRemaining} days left)`}
                              </Text>
                            </View>
                          ) : (
                            <View style={[styles.dueBadge, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
                              <Ionicons name="checkmark-done" size={14} color="#16A34A" />
                              <Text style={[styles.dueBadgeText, { color: '#16A34A', fontWeight: '800' }]}>
                                All Coupons Settled
                              </Text>
                            </View>
                          )}

                          <View style={styles.autoDebitPill}>
                            <Ionicons name="business" size={12} color="#0284C7" />
                            <Text style={styles.autoDebitText}>{item.linkedBankName}</Text>
                          </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {isPastDueUnread && nextCoupon && (
                            <TouchableOpacity
                              style={styles.markReadOutlineBtn}
                              onPress={() => handleMarkCouponRead(nextCoupon.id)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="checkmark-done" size={14} color="#475569" />
                              <Text style={styles.markReadOutlineBtnText}>Mark Read</Text>
                            </TouchableOpacity>
                          )}

                          {nextCoupon && (
                            <TouchableOpacity
                              style={styles.depositActionBtn}
                              onPress={() => handleDepositSanchaypatra(nextCoupon.id)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
                              <Text style={styles.depositActionBtnText}>Confirm Deposited</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={styles.expandScheduleBtn}
                            onPress={() => setExpandedCertNumber(isExpanded ? null : item.certificateNumber)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#0284C7" />
                            <Text style={styles.expandScheduleBtnText}>
                              {isExpanded ? 'Hide' : '12 Quarters'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Expanded 12-Quarter Amortization Table */}
                  {isExpanded && (
                    <View style={styles.expandedScheduleContainer}>
                      <View style={styles.expandedScheduleHeader}>
                        <Text style={styles.expandedTitle}>
                          Full 12-Quarter Payout Schedule ({item.issueDate} to {item.maturityDate})
                        </Text>
                        <Text style={styles.expandedSub}>
                          Principal: ৳{item.principalAmount.toLocaleString('en-IN')} • Net/Qtr: ৳{item.quarterlyNet.toLocaleString('en-IN')} • Destination: {item.linkedBankName}
                        </Text>
                      </View>

                      <View style={styles.quarterGrid}>
                        {certCoupons.map((c) => {
                          const isConfirmed = c.status === 'CONFIRMED_DEPOSITED';
                          const isReadPast = c.isPastDue && c.isRead && !isConfirmed;
                          const isDueUnread = c.isPastDue && !c.isRead && !isConfirmed;

                          return (
                            <View key={c.id} style={[styles.quarterItemRow, isConfirmed && styles.quarterItemRowConfirmed]}>
                              <View style={styles.quarterMetaCol}>
                                <View style={[styles.quarterNumBadge, isConfirmed && { backgroundColor: '#DCFCE7' }]}>
                                  <Text style={[styles.quarterNumText, isConfirmed && { color: '#16A34A' }]}>
                                    Q{c.quarterNumber}
                                  </Text>
                                </View>
                                <View>
                                  <Text style={styles.quarterDateText}>{c.couponDate}</Text>
                                  <Text style={styles.quarterAmountText}>
                                    Net: ৳{c.netAmount.toLocaleString('en-IN')} (Gross: ৳{c.grossAmount.toLocaleString('en-IN')})
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.quarterActionCol}>
                                {isConfirmed ? (
                                  <View style={styles.confirmedPill}>
                                    <Ionicons name="checkmark-done" size={13} color="#16A34A" />
                                    <Text style={styles.confirmedPillText}>✓ Deposited</Text>
                                  </View>
                                ) : isReadPast ? (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={styles.readPastPill}>
                                      <Ionicons name="checkmark-circle" size={12} color="#64748B" />
                                      <Text style={styles.readPastPillText}>Read / Dismissed</Text>
                                    </View>
                                    <TouchableOpacity
                                      style={styles.unmarkBtn}
                                      onPress={() => handleUnmarkCouponRead(c.id)}
                                      activeOpacity={0.75}
                                    >
                                      <Text style={styles.unmarkBtnText}>Restore</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.depositSmallBtn}
                                      onPress={() => handleDepositSanchaypatra(c.id)}
                                      activeOpacity={0.8}
                                    >
                                      <Text style={styles.depositSmallBtnText}>Deposit</Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : isDueUnread ? (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={styles.duePastPill}>
                                      <Ionicons name="alert-circle" size={12} color="#DC2626" />
                                      <Text style={styles.duePastPillText}>⚠️ Past Due ({Math.abs(c.daysRemaining)}d)</Text>
                                    </View>
                                    <TouchableOpacity
                                      style={styles.markReadSmallBtn}
                                      onPress={() => handleMarkCouponRead(c.id)}
                                      activeOpacity={0.8}
                                    >
                                      <Text style={styles.markReadSmallBtnText}>Mark Read</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.depositSmallBtn}
                                      onPress={() => handleDepositSanchaypatra(c.id)}
                                      activeOpacity={0.8}
                                    >
                                      <Text style={styles.depositSmallBtnText}>Deposit</Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={styles.upcomingPill}>
                                      <Ionicons name="time" size={12} color="#0284C7" />
                                      <Text style={styles.upcomingPillText}>⏱️ In {c.daysRemaining} days</Text>
                                    </View>
                                    <TouchableOpacity
                                      style={styles.depositSmallBtn}
                                      onPress={() => handleDepositSanchaypatra(c.id)}
                                      activeOpacity={0.8}
                                    >
                                      <Text style={styles.depositSmallBtnText}>Deposit</Text>
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ================= TAB 3: SCHEDULED INCOMES (SALARY, CASH, BANK) ================= */}
      {activeTab === 'incomes' && (
        <View style={{ gap: 16 }}>
          {/* Executive Dual-Channel Salary Dashboard Card */}
          <View style={styles.dualSalaryCard}>
            <View style={styles.dualSalaryHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                <View style={[styles.destIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="cash" size={24} color="#16A34A" />
                </View>
                <View>
                  <Text style={styles.dualSalaryTitle}>Executive Dual-Channel Salary Dashboard</Text>
                  <Text style={styles.dualSalarySub}>
                    Total Monthly Salary: <Text style={{ fontWeight: '900', color: '#16A34A' }}>৳ 1,25,000</Text> • Dual Deposit Routing (Bank & Cash)
                  </Text>
                </View>
              </View>

              <View style={[styles.dueBadge, { backgroundColor: getSalaryWindowStatus(7).badgeColor }]}>
                <Ionicons name="time" size={14} color={getSalaryWindowStatus(7).textColor} />
                <Text style={[styles.dueBadgeText, { color: getSalaryWindowStatus(7).textColor, fontWeight: '800' }]}>
                  {getSalaryWindowStatus(7).label}
                </Text>
              </View>
            </View>

            <View style={styles.dualSalaryGrid}>
              {/* Channel 1: Bank (Sonali Bank PLC) */}
              <View style={styles.channelCol}>
                <View style={styles.channelBadgeRow}>
                  <Ionicons name="business" size={16} color="#0284C7" />
                  <Text style={styles.channelColTitle}>Primary Tech Salary (Bank - Sonali Bank PLC)</Text>
                </View>
                <Text style={styles.channelAmount}>৳ 1,00,000</Text>
                <Text style={styles.channelHint}>
                  Electronic payroll credited between 5th & 10th into Sonali Bank PLC
                </Text>
                <TouchableOpacity
                  style={[styles.depositActionBtn, { backgroundColor: '#0284C7', marginTop: 10 }]}
                  onPress={() => {
                    const bankItem = incomeList.find(
                      (i) => i.id === 'SCH-SALARY-BANK' || (i.targetType === 'bank' && i.title.toLowerCase().includes('salary'))
                    );
                    if (bankItem) handleDepositIncome(bankItem);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="business" size={15} color="#FFFFFF" />
                  <Text style={styles.depositActionBtnText}>🏦 Deposit to Sonali Bank</Text>
                </TouchableOpacity>
              </View>

              {/* Channel 2: Cash in Hand */}
              <View style={styles.channelCol}>
                <View style={styles.channelBadgeRow}>
                  <Ionicons name="wallet" size={16} color="#16A34A" />
                  <Text style={styles.channelColTitle}>Executive Salary & Allowance (Cash in Hand)</Text>
                </View>
                <Text style={styles.channelAmount}>৳ 25,000</Text>
                <Text style={styles.channelHint}>
                  Physical cash allowance received between 5th & 10th for pocket liquidity
                </Text>
                <TouchableOpacity
                  style={[styles.depositActionBtn, { backgroundColor: '#16A34A', marginTop: 10 }]}
                  onPress={() => {
                    const cashItem = incomeList.find(
                      (i) => i.id === 'SCH-SALARY-CASH' || (i.targetType === 'cash' && i.title.toLowerCase().includes('salary'))
                    );
                    if (cashItem) handleDepositIncome(cashItem);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cash" size={15} color="#FFFFFF" />
                  <Text style={styles.depositActionBtnText}>💵 Deposit to Cash in Hand</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Income List */}
          <View style={styles.listContainer}>
            {incomeList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="wallet-outline" size={44} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No scheduled incomes added yet</Text>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: '#16A34A', marginTop: 10 }]}
                  onPress={() => handleOpenAdd('income')}
                >
                  <Text style={styles.addBtnText}>+ Add First Scheduled Income</Text>
                </TouchableOpacity>
              </View>
            ) : (
              incomeList.map((item) => {
                const daysLeft = getDaysRemaining(item.dueDay);
                const windowStatus = getSalaryWindowStatus(item.dueDay);
                const isCash = item.targetType === 'cash' || item.linkedAccount?.toLowerCase().includes('cash');

                return (
                  <View key={item.id} style={styles.scheduleCard}>
                    <View style={[styles.accentStripe, { backgroundColor: '#16A34A' }]} />

                    <View style={styles.cardMain}>
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardHeaderLeft}>
                          <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                            <Ionicons name={isCash ? 'cash' : 'business'} size={20} color="#16A34A" />
                          </View>
                          <View>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <Text style={styles.itemCategory}>
                              {item.category} • Target: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{isCash ? '💵 Cash in Hand' : `🏦 ${item.linkedAccount || 'Bank'}`}</Text>
                            </Text>
                          </View>
                        </View>

                        <View style={styles.amountCol}>
                          <Text style={[styles.itemAmount, { color: '#16A34A' }]}>
                            +৳ {item.amount.toLocaleString('en-IN')}
                          </Text>
                          <Text style={styles.itemAmountLakhs}>
                            Day {item.dueDay} ({item.frequency})
                          </Text>
                        </View>
                      </View>

                      {/* Footer Actions & Countdown */}
                      <View style={styles.cardFooterRow}>
                        <View style={styles.badgeRow}>
                          <View style={[styles.dueBadge, { backgroundColor: windowStatus.badgeColor }]}>
                            <Ionicons name="time" size={13} color={windowStatus.textColor} />
                            <Text style={[styles.dueBadgeText, { color: windowStatus.textColor, fontWeight: '800' }]}>
                              {windowStatus.label}
                            </Text>
                          </View>

                          {item.lastPaidDate && (
                            <Text style={styles.lastPaidText}>
                              ✓ Deposited on {item.lastPaidDate}
                            </Text>
                          )}
                        </View>

                        <View style={styles.actionBtns}>
                          <TouchableOpacity
                            style={[styles.depositActionBtn, { backgroundColor: '#16A34A' }]}
                            onPress={() => handleDepositIncome(item)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="cash" size={14} color="#FFFFFF" />
                            <Text style={styles.depositActionBtnText}>Mark as Deposited</Text>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.iconBtn} onPress={() => handleEdit(item)}>
                            <Ionicons name="pencil" size={15} color="#64748B" />
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
                            <Ionicons name="trash-outline" size={15} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* ================= TAB 4: EXPENSES & DUES ================= */}
      {activeTab === 'expenses' && (
        <View style={{ gap: 16 }}>
          <View style={styles.listContainer}>
            {expenseList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="card-outline" size={44} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No scheduled expenses added</Text>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: '#DC2626', marginTop: 10 }]}
                  onPress={() => handleOpenAdd('expense')}
                >
                  <Text style={styles.addBtnText}>+ Add First Scheduled Expense</Text>
                </TouchableOpacity>
              </View>
            ) : (
              expenseList.map((item) => {
                const daysLeft = getDaysRemaining(item.dueDay);
                const isToday = daysLeft === 0;

                return (
                  <View key={item.id} style={styles.scheduleCard}>
                    <View style={[styles.accentStripe, { backgroundColor: isToday ? '#EF4444' : '#DC2626' }]} />

                    <View style={styles.cardMain}>
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardHeaderLeft}>
                          <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                            <Ionicons name="receipt" size={20} color="#DC2626" />
                          </View>
                          <View>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <Text style={styles.itemCategory}>
                              {item.category} • Day {item.dueDay} of month ({item.frequency})
                            </Text>
                          </View>
                        </View>

                        <View style={styles.amountCol}>
                          <Text style={[styles.itemAmount, { color: '#DC2626' }]}>
                            −৳ {item.amount.toLocaleString('en-IN')}
                          </Text>
                          <Text style={styles.itemAmountLakhs}>
                            From: {item.linkedAccount || 'Bank'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardFooterRow}>
                        <View style={styles.badgeRow}>
                          <View
                            style={[
                              styles.dueBadge,
                              isToday && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
                            ]}
                          >
                            <Ionicons
                              name={isToday ? 'alert-circle' : 'time-outline'}
                              size={13}
                              color={isToday ? '#DC2626' : '#64748B'}
                            />
                            <Text
                              style={[
                                styles.dueBadgeText,
                                isToday && { color: '#DC2626', fontWeight: '800' },
                              ]}
                            >
                              {isToday ? 'DUE TODAY' : `In ${daysLeft} days`}
                            </Text>
                          </View>

                          {item.lastPaidDate && (
                            <Text style={styles.lastPaidText}>
                              ✓ Paid on {item.lastPaidDate}
                            </Text>
                          )}
                        </View>

                        <View style={styles.actionBtns}>
                          <TouchableOpacity
                            style={[styles.depositActionBtn, { backgroundColor: '#DC2626' }]}
                            onPress={() => {
                              const todayStr = new Date().toISOString().split('T')[0];
                              const next = schedules.map((s) => (s.id === item.id ? { ...s, lastPaidDate: todayStr } : s));
                              updateAndPersist(next);
                              SoundService.playDepositSuccessSound();
                              Alert.alert('✅ Expense Settled', `Marked "${item.title}" as paid.`);
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            <Text style={styles.depositActionBtnText}>Mark as Paid</Text>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.iconBtn} onPress={() => handleEdit(item)}>
                            <Ionicons name="pencil" size={15} color="#64748B" />
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
                            <Ionicons name="trash-outline" size={15} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* ================= MODAL: ADD / EDIT SCHEDULE ================= */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: flowType === 'income' ? '#F0FDF4' : '#FEF2F2' },
                  ]}
                >
                  <Ionicons
                    name={flowType === 'income' ? 'wallet' : 'card'}
                    size={20}
                    color={flowType === 'income' ? '#16A34A' : '#DC2626'}
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingItem ? 'Edit Scheduled Item' : `Add Scheduled ${flowType === 'income' ? 'Income' : 'Expense'}`}
                  </Text>
                  <Text style={styles.modalSubtitle}>Recurring cash flow timetable and routing</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440, paddingHorizontal: 18 }}>
              {/* Title */}
              <Text style={styles.inputLabel}>TITLE *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Executive Tech Salary, House Rent"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />

              {/* Amount & Due Day */}
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>AMOUNT (৳ BDT) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="85000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>
                <View style={{ width: 130 }}>
                  <Text style={styles.inputLabel}>DUE DAY (1-31) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="7"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    maxLength={2}
                    value={dueDay}
                    onChangeText={setDueDay}
                  />
                </View>
              </View>

              {/* Destination Selector: Bank vs Cash in Hand */}
              {flowType === 'income' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.inputLabel}>DEPOSIT DESTINATION</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[
                        styles.targetChoiceBtn,
                        targetType === 'bank' && styles.targetChoiceBtnActive,
                      ]}
                      onPress={() => {
                        setTargetType('bank');
                        setLinkedAccount('Sonali Bank PLC');
                      }}
                    >
                      <Ionicons
                        name="business"
                        size={16}
                        color={targetType === 'bank' ? '#0284C7' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.targetChoiceText,
                          targetType === 'bank' && styles.targetChoiceTextActive,
                        ]}
                      >
                        Bank Account
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.targetChoiceBtn,
                        targetType === 'cash' && styles.targetChoiceBtnActive,
                      ]}
                      onPress={() => {
                        setTargetType('cash');
                        setLinkedAccount('Cash in Hand');
                      }}
                    >
                      <Ionicons
                        name="cash"
                        size={16}
                        color={targetType === 'cash' ? '#16A34A' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.targetChoiceText,
                          targetType === 'cash' && { color: '#16A34A', fontWeight: '800' },
                        ]}
                      >
                        Cash in Hand
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Linked Account Name */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>LINKED ACCOUNT NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sonali Bank PLC, Dutch-Bangla Bank, Cash in Hand"
                placeholderTextColor="#94A3B8"
                value={linkedAccount}
                onChangeText={setLinkedAccount}
              />

              {/* Category & Frequency */}
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>CATEGORY</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Salary, Rent, Utilities"
                    placeholderTextColor="#94A3B8"
                    value={category}
                    onChangeText={setCategory}
                  />
                </View>
                <View style={{ width: 140 }}>
                  <Text style={styles.inputLabel}>FREQUENCY</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {(['monthly', 'quarterly'] as ScheduleFrequency[]).map((f) => (
                      <TouchableOpacity
                        key={f}
                        style={[styles.freqPill, frequency === f && styles.freqPillActive]}
                        onPress={() => setFrequency(f)}
                      >
                        <Text style={[styles.freqPillText, frequency === f && styles.freqPillTextActive]}>
                          {f === 'monthly' ? 'Monthly' : 'Quarterly'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Notes */}
              <Text style={styles.inputLabel}>NOTES & AUDIT REMARKS</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Additional details..."
                placeholderTextColor="#94A3B8"
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: flowType === 'income' ? '#16A34A' : '#DC2626' },
                ]}
                onPress={handleSaveItem}
              >
                <Text style={styles.saveBtnText}>Save Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2FE',
  },
  content: {
    padding: 16,
    paddingBottom: 60,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabNavRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  tabBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 6,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  statSub: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  destBanner: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 12,
  },
  destBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  destGrid: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  destItem: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  destIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  destVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  destHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  highlightCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: Radius.md,
    padding: 16,
  },
  highlightTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  highlightSub: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  rulesBanner: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0369A1',
  },
  rulesText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  sanchayKpiRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  sanchayKpi: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sanchayKpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  sanchayKpiVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  salaryBanner: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
    gap: 6,
  },
  salaryBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  salaryBannerText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 20,
  },
  listContainer: {
    gap: 12,
  },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    overflow: 'hidden',
  },
  accentStripe: {
    width: 6,
  },
  cardMain: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 220,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemCategory: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  itemAmountLakhs: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  dueBadgeText: {
    fontSize: 12,
    color: '#475569',
  },
  autoDebitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  autoDebitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  lastPaidText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  depositActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  depositActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  iconBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  targetChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.sm,
    backgroundColor: '#F8FAFC',
  },
  targetChoiceBtnActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  targetChoiceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  targetChoiceTextActive: {
    color: '#0284C7',
    fontWeight: '800',
  },
  freqPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  freqPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  freqPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  freqPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sanchayToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
    flexWrap: 'wrap',
  },
  clearPastToolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  clearPastToolbarBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0284C7',
  },
  toolbarHintText: {
    fontSize: 12,
    color: '#64748B',
  },
  viewModeFilterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  viewModePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  viewModePillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  viewModePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  viewModePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scheduleCardWrapper: {
    gap: 4,
  },
  markReadOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  markReadOutlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  expandScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  expandScheduleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  expandedScheduleContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: -4,
    gap: 10,
  },
  expandedScheduleHeader: {
    gap: 2,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  expandedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  expandedSub: {
    fontSize: 11.5,
    color: '#64748B',
  },
  quarterGrid: {
    gap: 6,
  },
  quarterItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 6,
  },
  quarterItemRowConfirmed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  quarterMetaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quarterNumBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  quarterNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  quarterDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  quarterAmountText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  quarterActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confirmedPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  readPastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 4,
  },
  readPastPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  duePastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 4,
  },
  duePastPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  upcomingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 4,
  },
  upcomingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  unmarkBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  unmarkBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  markReadSmallBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  markReadSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  depositSmallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  depositSmallBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dualSalaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    gap: 14,
  },
  dualSalaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  dualSalaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dualSalarySub: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  dualSalaryGrid: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  channelCol: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  channelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelColTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
  },
  channelAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  channelHint: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
});
