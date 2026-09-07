import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import {
  TransactionManager,
  ExpenseItem,
  subscribeToBalanceUpdates,
  CASH_IN_HAND_ID,
} from '../../services/transactionManager';
import { UniversalEntryModal, EntryType } from '../modals/UniversalEntryModal';
import { CategoryManager, FinancialCategory } from '../../services/categoryManager';

interface ExpensesScreenProps {
  onOpenCategorySetup?: () => void;
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({ onOpenCategorySetup }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expenseCategories, setExpenseCategories] = useState<FinancialCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() =>
    TransactionManager.getStoredExpenses()
  );

  // Modal State for Quick Entry
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<EntryType>('expense');

  // Load and subscribe to real-time updates
  useEffect(() => {
    const refresh = () => {
      setExpenses(TransactionManager.getStoredExpenses());
      setExpenseCategories(CategoryManager.getExpenseCategories());
    };

    refresh();
    const unsubscribe1 = subscribeToBalanceUpdates(refresh);
    const unsubscribe2 = CategoryManager.subscribeToCategoryUpdates(refresh);
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const assetExpensesTotal = expenses
    .filter((e) => e.category === 'Asset Expense')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const householdTotal = expenses
    .filter((e) => e.category === 'Household & Living' || e.category === 'Household')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const emiTotal = expenses
    .filter((e) => e.category === 'Debt Service EMI' || e.category === 'EMI')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const personalTotal = expenses
    .filter((e) => e.category === 'Personal / Discretionary' || e.category === 'Personal')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const openEntry = (type: EntryType) => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleDeleteExpense = (expense: ExpenseItem) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.title}" (-৳ ${expense.amount.toLocaleString('en-IN')})?\n\nWould you like to restore this amount back to ${expense.paymentMethod || 'your account'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Only',
          style: 'default',
          onPress: () => {
            TransactionManager.deleteExpense(expense.id, false);
            setExpenses(TransactionManager.getStoredExpenses());
          },
        },
        {
          text: 'Restore & Delete',
          style: 'destructive',
          onPress: () => {
            TransactionManager.deleteExpense(expense.id, true);
            setExpenses(TransactionManager.getStoredExpenses());
          },
        },
      ]
    );
  };

  const handleClearAllExpenses = () => {
    Alert.alert(
      'Reset / Clear Expenses',
      'Are you sure you want to clear all recorded expenses? This will leave your expense log completely clean.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            TransactionManager.saveExpenses([]);
            setExpenses([]);
          },
        },
      ]
    );
  };

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      !searchQuery.trim() ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.linkedAssetId && e.linkedAssetId.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'ALL') return true;

    const cLower = (e.category || '').toLowerCase();
    const selLower = selectedCategory.toLowerCase();

    return (
      cLower === selLower ||
      cLower.includes(selLower) ||
      selLower.includes(cLower)
    );
  });

  const selectedCategoryObj = expenseCategories.find(
    (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
  );
  const selectedCatBudget = selectedCategoryObj?.monthlyBudget || 0;
  const selectedCatSpent = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const selectedCatVariance = selectedCatBudget - selectedCatSpent;
  const selectedCatPercent = selectedCatBudget > 0 ? Math.round((selectedCatSpent / selectedCatBudget) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Quick Action Header Ribbon */}
      <View style={styles.actionRibbon}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
          onPress={() => openEntry('expense')}
          activeOpacity={0.85}
        >
          <Ionicons name="receipt" size={16} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>+ Record Expense</Text>
        </TouchableOpacity>

        {onOpenCategorySetup && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#38BDF8' }]}
            onPress={onOpenCategorySetup}
            activeOpacity={0.85}
          >
            <Ionicons name="pricetags-outline" size={16} color="#38BDF8" />
            <Text style={[styles.actionBtnText, { color: '#38BDF8' }]}>🏷️ Category & Budgets</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#0284C7' }]}
          onPress={() => openEntry('withdrawal')}
          activeOpacity={0.85}
        >
          <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>💸 Cash Withdrawal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
          onPress={() => openEntry('transfer')}
          activeOpacity={0.85}
        >
          <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>🔁 Bank Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#16A34A' }]}
          onPress={() => openEntry('income')}
          activeOpacity={0.85}
        >
          <Ionicons name="wallet-outline" size={16} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>💰 Add Salary / Income</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Executive Outflow Summary Card */}
      <GlassCard style={styles.summaryCard} padding={20} glowColor={Colors.danger}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>TOTAL RECORDED CASH OUTFLOW</Text>
            <Text style={[styles.summaryAmount, { color: Colors.danger }]}>
              ৳ {totalExpense.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.summarySub}>
              {expenses.length} Total Expenditures • Automatically Deducted from Bank & Cash Balances
            </Text>
          </View>
        </View>

        {/* 4-Sector Outflow Strip */}
        <View style={styles.strip}>
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>🏢 ASSET COSTS</Text>
            <Text style={[styles.stripVal, { color: Colors.secondary }]}>
              ৳ {assetExpensesTotal.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.stripPct}>
              {totalExpense > 0 ? Math.round((assetExpensesTotal / totalExpense) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>🏠 HOUSEHOLD</Text>
            <Text style={[styles.stripVal, { color: Colors.accent }]}>
              ৳ {householdTotal.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.stripPct}>
              {totalExpense > 0 ? Math.round((householdTotal / totalExpense) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>💳 DEBT EMIs</Text>
            <Text style={[styles.stripVal, { color: Colors.danger }]}>
              ৳ {emiTotal.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.stripPct}>
              {totalExpense > 0 ? Math.round((emiTotal / totalExpense) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>🛍️ PERSONAL</Text>
            <Text style={[styles.stripVal, { color: '#0284C7' }]}>
              ৳ {personalTotal.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.stripPct}>
              {totalExpense > 0 ? Math.round((personalTotal / totalExpense) * 100) : 0}%
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* 3. Search & Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses by title, note, bank or asset..."
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, selectedCategory === 'ALL' && styles.filterBtnActive]}
            onPress={() => setSelectedCategory('ALL')}
          >
            <Text style={[styles.filterBtnText, selectedCategory === 'ALL' && styles.filterBtnTextActive]}>
              All ({expenses.length})
            </Text>
          </TouchableOpacity>

          {expenseCategories.map((cat) => {
            const count = expenses.filter((e) => {
              const cName = (e.category || '').toLowerCase();
              const catName = cat.name.toLowerCase();
              return cName === catName || cName.includes(catName) || catName.includes(cName);
            }).length;
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();

            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterBtn, isSelected && styles.filterBtnActive]}
                onPress={() => setSelectedCategory(isSelected ? 'ALL' : cat.name)}
              >
                <Text style={[styles.filterBtnText, isSelected && styles.filterBtnTextActive]}>
                  {cat.icon} {cat.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}

          {expenses.length > 0 && (
            <TouchableOpacity
              style={styles.clearAllBtn}
              onPress={handleClearAllExpenses}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={13} color="#EF4444" />
              <Text style={styles.clearAllBtnText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Selected Category Monthly Budget Variance Strip */}
        {selectedCategory !== 'ALL' && selectedCategoryObj && (
          <View style={styles.categoryBudgetCard}>
            <View style={styles.categoryBudgetTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 18 }}>{selectedCategoryObj.icon}</Text>
                <View>
                  <Text style={styles.categoryBudgetName}>{selectedCategoryObj.name} Budget</Text>
                  <Text style={styles.categoryBudgetSub}>
                    Ceiling: ৳ {selectedCatBudget.toLocaleString('en-IN')} • Spent: ৳ {selectedCatSpent.toLocaleString('en-IN')} ({selectedCatPercent}%)
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.categoryBudgetRemaining,
                    { color: selectedCatVariance >= 0 ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {selectedCatVariance >= 0 ? '+' : ''}৳ {selectedCatVariance.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.categoryBudgetStatus}>
                  {selectedCatVariance >= 0 ? 'Remaining Budget' : 'Over Budget!'}
                </Text>
              </View>
            </View>
            <View style={styles.categoryBudgetProgressTrack}>
              <View
                style={[
                  styles.categoryBudgetProgressFill,
                  {
                    width: `${Math.min(100, selectedCatPercent)}%`,
                    backgroundColor:
                      selectedCatPercent > 100
                        ? '#EF4444'
                        : selectedCatPercent >= 80
                        ? '#F59E0B'
                        : '#10B981',
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* 4. Expenses List or Clean Slate Empty State */}
      {filtered.length === 0 ? (
        <GlassCard style={styles.emptyCard} padding={32}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={44} color="#0284C7" />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No Matching Expenses Found' : 'No Expenses Recorded Yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try modifying your search or clearing the category filter.'
              : 'Keep track of regular living costs, flat maintenance, or bills. Every expense logged automatically deducts from your bank account or cash in hand.'}
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => openEntry('expense')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.emptyAddBtnText}>+ Record Your First Expense</Text>
          </TouchableOpacity>
        </GlassCard>
      ) : (
        <View style={styles.list}>
          {filtered.map((item) => {
            const isCash =
              item.paymentMethod === 'Cash in Hand' ||
              item.paymentMethod === 'Physical Cash' ||
              item.accountId === CASH_IN_HAND_ID;

            return (
              <GlassCard key={item.id} style={styles.card} padding={14}>
                <View style={styles.row}>
                  <View style={styles.leftCol}>
                    <View style={styles.titleRow}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {item.linkedAssetId && (
                        <View style={styles.assetBadge}>
                          <Text style={styles.assetBadgeText}>🔗 Asset: {item.linkedAssetId}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.badgeRow}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{item.category}</Text>
                      </View>

                      <View
                        style={[
                          styles.sourceBadge,
                          isCash && { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
                        ]}
                      >
                        <Ionicons
                          name={isCash ? 'cash' : 'card'}
                          size={12}
                          color={isCash ? '#059669' : '#0284C7'}
                        />
                        <Text
                          style={[
                            styles.sourceBadgeText,
                            isCash && { color: '#059669' },
                          ]}
                        >
                          {item.paymentMethod || 'Paid Account'}
                        </Text>
                      </View>

                      <Text style={styles.dateText}>📅 {item.date}</Text>
                    </View>

                    {item.notes && <Text style={styles.notesText}>Note: {item.notes}</Text>}
                  </View>

                  <View style={styles.rightCol}>
                    <Text style={styles.amountText}>
                      -৳ {item.amount.toLocaleString('en-IN')}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteExpense(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}

      {/* Universal Modal */}
      <UniversalEntryModal
        visible={modalVisible}
        initialType={modalType}
        onClose={() => setModalVisible(false)}
        onSave={() => {
          setExpenses(TransactionManager.getStoredExpenses());
        }}
        onOpenCategorySetup={onOpenCategorySetup}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2FE',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  actionRibbon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryTop: {
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  summarySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  stripCol: {
    flex: 1,
    alignItems: 'center',
  },
  vLine: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  stripLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  stripVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  stripPct: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
  },
  searchFilterContainer: {
    marginBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  filterBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    marginLeft: 'auto',
  },
  clearAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  categoryBudgetCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  categoryBudgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBudgetName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  categoryBudgetSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  categoryBudgetRemaining: {
    fontSize: 15,
    fontWeight: '900',
  },
  categoryBudgetStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  categoryBudgetProgressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBudgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  list: {
    gap: 10,
  },
  card: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  assetBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  assetBadgeText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  sourceBadgeText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontStyle: 'italic',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  amountText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#DC2626',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#F8FAFC',
    marginTop: 6,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    textAlign: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.md,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
