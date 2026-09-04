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
  linkedAccount?: string;
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
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
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
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduledItem | null>(null);

  // Form State
  const [flowType, setFlowType] = useState<ScheduleFlowType>('income');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('monthly');
  const [linkedAccount, setLinkedAccount] = useState('');
  const [isAutoDebit, setIsAutoDebit] = useState(false);
  const [notes, setNotes] = useState('');

  // Persist and sync helper
  const updateAndPersist = (newList: ScheduledItem[]) => {
    setSchedules(newList);
    saveStoredSchedules(newList);
    FirebaseSyncService.pushCategory(currentUid, 'schedules', newList);
  };

  // Preset suggestions
  const incomeSuggestions = [
    { title: 'Tech Salary', category: 'Salary', day: '1' },
    { title: 'Apartment Rent', category: 'Rental Yield', day: '5' },
    { title: 'Sanchaypatra Coupon', category: 'Govt Profit', day: '15' },
    { title: 'Consultancy Retainer', category: 'Business', day: '10' },
  ];

  const expenseSuggestions = [
    { title: 'House Rent', category: 'Housing', day: '5' },
    { title: 'Electricity & Gas Bill', category: 'Utilities', day: '12' },
    { title: 'High-speed Fiber Internet', category: 'Utilities', day: '10' },
    { title: 'Car Loan EMI', category: 'Loan', day: '18' },
    { title: 'Credit Card Minimum Due', category: 'Banking', day: '25' },
    { title: 'Children School Tuition', category: 'Education', day: '7' },
  ];

  // Aggregated calculations
  const stats = useMemo(() => {
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    schedules.forEach((item) => {
      const multiplier = item.frequency === 'quarterly' ? 1 / 3 : item.frequency === 'yearly' ? 1 / 12 : 1;
      if (item.flowType === 'income') {
        monthlyIncome += item.amount * multiplier;
      } else {
        monthlyExpense += item.amount * multiplier;
      }
    });

    const netSurplus = monthlyIncome - monthlyExpense;
    return {
      monthlyIncome,
      monthlyExpense,
      netSurplus,
      incomeCount: schedules.filter((s) => s.flowType === 'income').length,
      expenseCount: schedules.filter((s) => s.flowType === 'expense').length,
    };
  }, [schedules]);

  // Days remaining calculation
  const getDaysRemaining = (dayOfMonth: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    if (dayOfMonth === currentDay) return 0;
    if (dayOfMonth > currentDay) return dayOfMonth - currentDay;
    // Next month
    const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return lastDayThisMonth - currentDay + dayOfMonth;
  };

  const handleOpenAdd = (type: ScheduleFlowType) => {
    setEditingItem(null);
    setFlowType(type);
    setTitle('');
    setCategory('');
    setAmount('');
    setDueDay('5');
    setFrequency('monthly');
    setLinkedAccount('');
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
    setLinkedAccount(item.linkedAccount || '');
    setIsAutoDebit(!!item.isAutoDebit);
    setNotes(item.notes || '');
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    const next = schedules.filter((s) => s.id !== id);
    updateAndPersist(next);
  };

  const handleMarkPaid = (item: ScheduledItem) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const next = schedules.map((s) => (s.id === item.id ? { ...s, lastPaidDate: todayStr } : s));
    updateAndPersist(next);
    Alert.alert(
      item.flowType === 'income' ? 'Income Received' : 'Expense Settled',
      `Marked "${item.title}" as completed for this cycle (${todayStr}).`
    );
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
        linkedAccount: linkedAccount.trim() || undefined,
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
        linkedAccount: linkedAccount.trim() || undefined,
        isAutoDebit,
        notes: notes.trim() || undefined,
        status: 'active',
      };
      updateAndPersist([...schedules, newItem]);
    }

    setShowAddModal(false);
  };

  const filteredList = schedules.filter((s) => {
    if (filterType === 'income') return s.flowType === 'income';
    if (filterType === 'expense') return s.flowType === 'expense';
    return true;
  }).sort((a, b) => getDaysRemaining(a.dueDay) - getDaysRemaining(b.dueDay));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Automated Cash Flow & Schedules</Text>
          <Text style={styles.pageSubtitle}>
            Track recurring incomes, rental yield, salaries, utility bills & loan dues
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

      {/* 3 Executive Summary Stat Cards */}
      <View style={styles.statsGrid}>
        {/* Scheduled Income */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="arrow-down-circle" size={18} color="#16A34A" />
            <Text style={styles.statLabel}>MONTHLY SCHEDULED INCOMES</Text>
          </View>
          <Text style={[styles.statValue, { color: '#16A34A' }]}>
            ৳ {Math.round(stats.monthlyIncome).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.statSub}>
            ৳ {(stats.monthlyIncome / 100000).toFixed(2)} Lakhs • {stats.incomeCount} Recurring Streams
          </Text>
        </View>

        {/* Scheduled Expenses */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="arrow-up-circle" size={18} color="#DC2626" />
            <Text style={styles.statLabel}>MONTHLY SCHEDULED EXPENSES</Text>
          </View>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>
            ৳ {Math.round(stats.monthlyExpense).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.statSub}>
            ৳ {(stats.monthlyExpense / 100000).toFixed(2)} Lakhs • {stats.expenseCount} Recurring Obligations
          </Text>
        </View>

        {/* Net Monthly Flow */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="swap-horizontal" size={18} color={stats.netSurplus >= 0 ? '#0284C7' : '#D97706'} />
            <Text style={styles.statLabel}>NET SCHEDULED SURPLUS</Text>
          </View>
          <Text style={[styles.statValue, { color: stats.netSurplus >= 0 ? '#0284C7' : '#DC2626' }]}>
            {stats.netSurplus >= 0 ? '+' : '−'}৳ {Math.round(Math.abs(stats.netSurplus)).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.statSub}>
            {stats.netSurplus >= 0 ? '▲ Free Cash Flow' : '▼ Structural Deficit'} (৳ {(Math.abs(stats.netSurplus) / 100000).toFixed(2)}L)
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, filterType === 'all' && styles.filterPillActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            All Schedules ({schedules.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, filterType === 'income' && styles.filterPillActiveIncome]}
          onPress={() => setFilterType('income')}
        >
          <Text style={[styles.filterText, filterType === 'income' && { color: '#16A34A', fontWeight: '800' }]}>
            Incomes ({stats.incomeCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, filterType === 'expense' && styles.filterPillActiveExpense]}
          onPress={() => setFilterType('expense')}
        >
          <Text style={[styles.filterText, filterType === 'expense' && { color: '#DC2626', fontWeight: '800' }]}>
            Expenses & Dues ({stats.expenseCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Schedule Items List */}
      {filteredList.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No scheduled cash flows found</Text>
          <Text style={styles.emptySub}>
            Add recurring incomes (salary, rent, dividend) or expenses (bills, EMI) to never miss a due date.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: '#16A34A' }]}
              onPress={() => handleOpenAdd('income')}
            >
              <Text style={styles.addBtnText}>+ Add First Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: '#DC2626' }]}
              onPress={() => handleOpenAdd('expense')}
            >
              <Text style={styles.addBtnText}>+ Add First Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {filteredList.map((item) => {
            const daysLeft = getDaysRemaining(item.dueDay);
            const isIncome = item.flowType === 'income';
            const isToday = daysLeft === 0;
            const isDueSoon = daysLeft <= 3 && !isToday;

            return (
              <View key={item.id} style={styles.scheduleCard}>
                {/* Left Colored Stripe */}
                <View
                  style={[
                    styles.accentStripe,
                    { backgroundColor: isIncome ? '#16A34A' : isToday ? '#EF4444' : '#DC2626' },
                  ]}
                />

                <View style={styles.cardMain}>
                  {/* Top Row */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View
                        style={[
                          styles.iconBox,
                          { backgroundColor: isIncome ? '#F0FDF4' : '#FEF2F2' },
                        ]}
                      >
                        <Ionicons
                          name={isIncome ? 'wallet-outline' : 'receipt-outline'}
                          size={18}
                          color={isIncome ? '#16A34A' : '#DC2626'}
                        />
                      </View>
                      <View>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemCategory}>
                          {item.category} • Day {item.dueDay} of month ({item.frequency})
                        </Text>
                      </View>
                    </View>

                    {/* Amount */}
                    <View style={styles.amountCol}>
                      <Text
                        style={[
                          styles.itemAmount,
                          { color: isIncome ? '#16A34A' : '#DC2626' },
                        ]}
                      >
                        {isIncome ? '+' : '−'}৳ {item.amount.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.itemAmountLakhs}>
                        (৳ {(item.amount / 100000).toFixed(2)}L)
                      </Text>
                    </View>
                  </View>

                  {/* Badges & Actions Row */}
                  <View style={styles.cardFooterRow}>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.dueBadge,
                          isToday && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
                          isDueSoon && { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
                        ]}
                      >
                        <Ionicons
                          name={isToday ? 'alert-circle' : 'time-outline'}
                          size={13}
                          color={isToday ? '#DC2626' : isDueSoon ? '#D97706' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.dueBadgeText,
                            isToday && { color: '#DC2626', fontWeight: '800' },
                            isDueSoon && { color: '#B45309', fontWeight: '800' },
                          ]}
                        >
                          {isToday ? 'DUE TODAY' : `In ${daysLeft} days (Day ${item.dueDay})`}
                        </Text>
                      </View>

                      {item.isAutoDebit && (
                        <View style={styles.autoDebitPill}>
                          <Ionicons name="flash" size={11} color="#0284C7" />
                          <Text style={styles.autoDebitText}>Auto-Flow</Text>
                        </View>
                      )}

                      {item.lastPaidDate && (
                        <Text style={styles.lastPaidText}>
                          ✓ Settled on {item.lastPaidDate}
                        </Text>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionBtns}>
                      <TouchableOpacity
                        style={styles.checkBtn}
                        onPress={() => handleMarkPaid(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-done" size={14} color="#16A34A" />
                        <Text style={styles.checkBtnText}>
                          {isIncome ? 'Received' : 'Paid'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleEdit(item)}
                      >
                        <Ionicons name="pencil" size={15} color="#64748B" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleDelete(item.id)}
                      >
                        <Ionicons name="trash-outline" size={15} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Add / Edit Modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
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
                    size={18}
                    color={flowType === 'income' ? '#16A34A' : '#DC2626'}
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingItem ? 'Edit Scheduled Flow' : `Schedule ${flowType === 'income' ? 'Income' : 'Expense'}`}
                  </Text>
                  <Text style={styles.modalSubtitle}>Recurring timetable and automated tracking</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Suggestions */}
            <Text style={styles.inputLabel}>QUICK POPULAR SUGGESTIONS</Text>
            <View style={styles.chipRow}>
              {(flowType === 'income' ? incomeSuggestions : expenseSuggestions).map((s) => (
                <TouchableOpacity
                  key={s.title}
                  style={styles.chip}
                  onPress={() => {
                    setTitle(s.title);
                    setCategory(s.category);
                    setDueDay(s.day);
                  }}
                >
                  <Text style={styles.chipText}>+ {s.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              {/* Title */}
              <Text style={styles.inputLabel}>SCHEDULE TITLE *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Monthly Tech Salary, House Rent, Electric Bill"
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
                    placeholder="e.g. 85000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>
                <View style={{ width: 120 }}>
                  <Text style={styles.inputLabel}>DUE DAY (1-31) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    maxLength={2}
                    value={dueDay}
                    onChangeText={setDueDay}
                  />
                </View>
              </View>

              {/* Category & Frequency */}
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>CATEGORY</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Utilities, Housing, Salary"
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
                          {f === 'monthly' ? 'Monthly' : 'Quarter'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Auto Debit Toggle */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setIsAutoDebit(!isAutoDebit)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isAutoDebit ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isAutoDebit ? '#16A34A' : '#64748B'}
                />
                <Text style={styles.toggleText}>
                  Standing Instruction / Automated Bank Auto-Debit
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveSubmitBtn,
                { backgroundColor: flowType === 'income' ? '#16A34A' : '#DC2626' },
              ]}
              onPress={handleSaveItem}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.saveSubmitText}>Save Scheduled Flow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
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
    paddingVertical: 9,
    borderRadius: Radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterPillActiveIncome: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  filterPillActiveExpense: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 400,
  },
  listContainer: {
    gap: 12,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  accentStripe: {
    width: 6,
  },
  cardMain: {
    flex: 1,
    padding: 14,
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
    gap: 10,
    flex: 1,
    minWidth: 180,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemCategory: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  itemAmountLakhs: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 8,
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
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  autoDebitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: '#E0F2FE',
  },
  autoDebitText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
  },
  lastPaidText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '700',
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  checkBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    width: '96%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  freqPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  freqPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  freqPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  freqPillTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  saveSubmitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
    marginTop: 16,
  },
  saveSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
