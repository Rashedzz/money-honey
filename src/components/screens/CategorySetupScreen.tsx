/**
 * CategorySetupScreen.tsx
 * World-Class Intuit QuickBooks / Quicken-Grade Category & Budget Management Workstation.
 * Full customization of Income and Expense Categories, monthly budget limits, revenue targets,
 * tax deductibility flags, icons, colors, and live spend meters.
 */

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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import {
  CategoryManager,
  FinancialCategory,
  CategoryBudgetVariance,
} from '../../services/categoryManager';
import { subscribeToBalanceUpdates } from '../../services/transactionManager';

const PRESET_ICONS = [
  '🏠', '🛒', '⚡', '🚗', '💳', '🏥', '🎓', '🏢',
  '🍽️', '🛍️', '🛡️', '💻', '🎁', '🧾', '📦', '💼',
  '📈', '📜', '🏦', '🏆', '💰', '🌐', '✈️', '🔧',
];

const PRESET_COLORS = [
  '#0284C7', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1',
  '#14B8A6', '#D97706', '#3B82F6', '#64748B',
];

interface CategorySetupScreenProps {
  onBackToExpenses?: () => void;
}

export const CategorySetupScreen: React.FC<CategorySetupScreenProps> = ({ onBackToExpenses }) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [searchQuery, setSearchQuery] = useState('');
  const [taxFilterOnly, setTaxFilterOnly] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal Form State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [formBudget, setFormBudget] = useState('');
  const [formIcon, setFormIcon] = useState('🏠');
  const [formColor, setFormColor] = useState('#0284C7');
  const [formTaxDeductible, setFormTaxDeductible] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  // Re-fetch on updates
  useEffect(() => {
    const unsub1 = CategoryManager.subscribeToCategoryUpdates(() => setRefreshKey((k) => k + 1));
    const unsub2 = subscribeToBalanceUpdates(() => setRefreshKey((k) => k + 1));
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Compute live variance & totals
  const variances: CategoryBudgetVariance[] = useMemo(() => {
    const _ = refreshKey;
    return CategoryManager.getCategoryBudgetVsActual(activeTab);
  }, [activeTab, refreshKey]);

  const allCategories = useMemo(() => {
    const _ = refreshKey;
    return CategoryManager.getAllCategories();
  }, [refreshKey]);

  // Overall totals
  const totalExpenseBudget = useMemo(() => {
    return allCategories
      .filter((c) => c.type === 'expense')
      .reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);
  }, [allCategories]);

  const totalIncomeTarget = useMemo(() => {
    return allCategories
      .filter((c) => c.type === 'income')
      .reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);
  }, [allCategories]);

  const budgetedSavingsRate = useMemo(() => {
    if (totalIncomeTarget <= 0) return 0;
    const surplus = totalIncomeTarget - totalExpenseBudget;
    return Math.max(0, Math.round((surplus / totalIncomeTarget) * 100));
  }, [totalIncomeTarget, totalExpenseBudget]);

  // Filtered categories
  const filteredVariances = useMemo(() => {
    return variances.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchTax = !taxFilterOnly || !!item.category.isTaxDeductible;
      return matchSearch && matchTax;
    });
  }, [variances, searchQuery, taxFilterOnly]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormType(activeTab);
    setFormBudget('');
    setFormIcon(activeTab === 'expense' ? '🛒' : '💼');
    setFormColor(activeTab === 'expense' ? '#0284C7' : '#10B981');
    setFormTaxDeductible(false);
    setFormNotes('');
    setIsModalVisible(true);
  };

  const handleOpenEdit = (cat: FinancialCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormType(cat.type);
    setFormBudget(cat.monthlyBudget ? cat.monthlyBudget.toString() : '');
    setFormIcon(cat.icon || '🏠');
    setFormColor(cat.color || '#0284C7');
    setFormTaxDeductible(!!cat.isTaxDeductible);
    setFormNotes(cat.notes || '');
    setIsModalVisible(true);
  };

  const handleSaveCategory = () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Please enter a category name.');
      return;
    }

    const budgetVal = parseFloat(formBudget.replace(/,/g, '')) || 0;

    if (editingCategory) {
      CategoryManager.updateCategory({
        ...editingCategory,
        name: formName.trim(),
        type: formType,
        monthlyBudget: budgetVal,
        icon: formIcon,
        color: formColor,
        isTaxDeductible: formTaxDeductible,
        notes: formNotes.trim(),
      });
    } else {
      CategoryManager.addCategory({
        name: formName.trim(),
        type: formType,
        monthlyBudget: budgetVal,
        icon: formIcon,
        color: formColor,
        isTaxDeductible: formTaxDeductible,
        notes: formNotes.trim(),
      });
    }

    setIsModalVisible(false);
  };

  const handleDeleteCategory = (cat: FinancialCategory) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete category "${cat.name}"? Existing recorded transactions will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => CategoryManager.deleteCategory(cat.id),
        },
      ]
    );
  };

  const handleAutoSync = () => {
    const res = CategoryManager.syncWithActiveSchedules();
    setRefreshKey((k) => k + 1);
    Alert.alert('✅ Real Data Synchronized', res.message);
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset Categories to Defaults',
      'This will restore all authentic Expense and Income categories synchronized with your actual schedules. Custom categories will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Defaults',
          style: 'destructive',
          onPress: () => {
            CategoryManager.resetToDefaults();
            setRefreshKey((k) => k + 1);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Executive Workstation Header */}
      <GlassCard style={styles.headerCard} padding={20} glowColor={Colors.primary}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, minWidth: 260 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.badgeIntuit}>
                <Text style={styles.badgeIntuitText}>INTUIT / QUICKBOOKS ENGINE</Text>
              </View>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{allCategories.length} CATEGORIES CONFIGURED</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>Category & Budget Management</Text>
            <Text style={styles.headerSub}>
              Configure custom Expense & Income heads, monthly spending ceilings, revenue targets, and tax deductibility.
            </Text>
          </View>

          <View style={styles.headerActions}>
            {onBackToExpenses && (
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={onBackToExpenses}
                activeOpacity={0.75}
              >
                <Ionicons name="arrow-back-outline" size={14} color="#334155" />
                <Text style={styles.resetBtnText}>Expenses</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.syncBtn}
              onPress={handleAutoSync}
              activeOpacity={0.85}
            >
              <Ionicons name="sync-outline" size={16} color="#0F172A" />
              <Text style={styles.syncBtnText}>Sync Bills</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleOpenAdd}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>+ New Category</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetDefaults}
              activeOpacity={0.75}
            >
              <Ionicons name="refresh-outline" size={14} color="#64748B" />
              <Text style={styles.resetBtnText}>Defaults</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Executive KPI Strip */}
        <View style={styles.kpiStrip}>
          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>MONTHLY EXPENSE BUDGET LIMIT</Text>
            <Text style={[styles.kpiVal, { color: '#DC2626' }]}>
              ৳ {totalExpenseBudget.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>Total limit across {allCategories.filter((c) => c.type === 'expense').length} categories</Text>
          </View>

          <View style={styles.kpiDivider} />

          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>MONTHLY INCOME TARGET</Text>
            <Text style={[styles.kpiVal, { color: '#16A34A' }]}>
              ৳ {totalIncomeTarget.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>Target across {allCategories.filter((c) => c.type === 'income').length} income sources</Text>
          </View>

          <View style={styles.kpiDivider} />

          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>PLANNED SAVINGS MARGIN</Text>
            <Text style={[styles.kpiVal, { color: '#0F172A' }]}>
              {budgetedSavingsRate}%
            </Text>
            <Text style={styles.kpiSub}>
              ৳ {(totalIncomeTarget - totalExpenseBudget).toLocaleString('en-IN')} / mo planned savings
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* 2. Primary Tabs: Expense Categories vs Income Categories */}
      <View style={styles.tabSwitcherRow}>
        <TouchableOpacity
          style={[styles.tabSwitchBtn, activeTab === 'expense' && styles.tabSwitchBtnActive]}
          onPress={() => setActiveTab('expense')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color={activeTab === 'expense' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabSwitchText, activeTab === 'expense' && styles.tabSwitchTextActive]}>
            Expense Categories ({allCategories.filter((c) => c.type === 'expense').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabSwitchBtn, activeTab === 'income' && styles.tabSwitchBtnActive]}
          onPress={() => setActiveTab('income')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="wallet-outline"
            size={16}
            color={activeTab === 'income' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabSwitchText, activeTab === 'income' && styles.tabSwitchTextActive]}>
            Income Categories ({allCategories.filter((c) => c.type === 'income').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Search & Filter Bar */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab} categories...`}
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

        <TouchableOpacity
          style={[styles.filterChip, taxFilterOnly && styles.filterChipActive]}
          onPress={() => setTaxFilterOnly((v) => !v)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={14}
            color={taxFilterOnly ? '#FFFFFF' : '#475569'}
          />
          <Text style={[styles.filterChipText, taxFilterOnly && styles.filterChipTextActive]}>
            Tax Rebate Eligible Only
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Category Cards List */}
      <View style={styles.categoriesList}>
        {filteredVariances.length === 0 ? (
          <GlassCard style={{ alignItems: 'center', padding: 32 }} padding={32}>
            <Ionicons name="folder-open-outline" size={42} color="#64748B" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 10 }}>
              No {activeTab} categories found
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              Tap "+ New Category" above to create custom category heads.
            </Text>
          </GlassCard>
        ) : (
          filteredVariances.map((item) => {
            const cat = item.category;
            const isExpense = cat.type === 'expense';
            const progressColor =
              item.percentUsed > 100
                ? '#DC2626'
                : item.percentUsed >= 80
                ? '#D97706'
                : isExpense
                ? '#16A34A'
                : '#0F172A';

            return (
              <GlassCard key={cat.id} style={styles.catCard} padding={16} glowColor={cat.color}>
                <View style={styles.catCardTop}>
                  <View style={styles.catIdentityRow}>
                    <View style={[styles.catIconCircle, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
                      <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.catNameText}>{cat.name}</Text>
                        {cat.isTaxDeductible && (
                          <View style={styles.taxBadge}>
                            <Text style={styles.taxBadgeText}>TAX REBATE ELIGIBLE</Text>
                          </View>
                        )}
                      </View>
                      {cat.notes ? <Text style={styles.catNotesText}>{cat.notes}</Text> : null}
                    </View>
                  </View>

                  <View style={styles.cardActionBtns}>
                    <TouchableOpacity
                      style={styles.editIconBtn}
                      onPress={() => handleOpenEdit(cat)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="pencil" size={14} color="#334155" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.editIconBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                      onPress={() => handleDeleteCategory(cat)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="trash-outline" size={14} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Spend / Target Meter */}
                <View style={styles.meterContainer}>
                  <View style={styles.meterRow}>
                    <Text style={styles.meterLabel}>
                      {isExpense ? 'Spent This Month:' : 'Received This Month:'}{' '}
                      <Text style={{ fontWeight: '800', color: progressColor }}>
                        ৳ {item.actual.toLocaleString('en-IN')}
                      </Text>{' '}
                      ({item.transactionCount} entries)
                    </Text>

                    <Text style={styles.meterTarget}>
                      {isExpense ? 'Limit:' : 'Target:'} ৳ {cat.monthlyBudget.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, item.percentUsed)}%`,
                          backgroundColor: progressColor,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.statusFooterRow}>
                    <Text style={[styles.percentUsedText, { color: progressColor }]}>
                      {item.percentUsed}% {isExpense ? 'of monthly budget used' : 'of monthly target reached'}
                    </Text>

                    <Text style={styles.remainingText}>
                      {isExpense
                        ? item.variance >= 0
                          ? `৳ ${item.variance.toLocaleString('en-IN')} left`
                          : `৳ ${Math.abs(item.variance).toLocaleString('en-IN')} OVER BUDGET`
                        : item.variance <= 0
                        ? `Target exceeded by ৳ ${Math.abs(item.variance).toLocaleString('en-IN')}`
                        : `৳ ${item.variance.toLocaleString('en-IN')} to target`}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            );
          })
        )}
      </View>

      {/* 5. Add / Edit Category Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category & Monthly Limit' : 'Add New Category'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
              {/* Type Switcher */}
              <Text style={styles.fieldLabel}>CATEGORY TYPE *</Text>
              <View style={styles.modalTypeRow}>
                <TouchableOpacity
                  style={[styles.modalTypeBtn, formType === 'expense' && styles.modalTypeBtnActive]}
                  onPress={() => setFormType('expense')}
                >
                  <Text style={[styles.modalTypeText, formType === 'expense' && styles.modalTypeTextActive]}>
                    Expense (Spending Limit)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalTypeBtn, formType === 'income' && styles.modalTypeBtnActive]}
                  onPress={() => setFormType('income')}
                >
                  <Text style={[styles.modalTypeText, formType === 'income' && styles.modalTypeTextActive]}>
                    Income (Monthly Target)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Name */}
              <Text style={styles.fieldLabel}>CATEGORY NAME *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Groceries, Child School Fee, Fuel"
                placeholderTextColor="#94A3B8"
                value={formName}
                onChangeText={setFormName}
              />

              {/* Monthly Budget Limit */}
              <Text style={styles.fieldLabel}>
                {formType === 'expense' ? 'MONTHLY SPENDING LIMIT (৳ BDT) *' : 'MONTHLY INCOME TARGET (৳ BDT) *'}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 25000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={formBudget}
                onChangeText={setFormBudget}
              />

              {/* Icon Picker */}
              <Text style={styles.fieldLabel}>CATEGORY ICON</Text>
              <View style={styles.pickerGrid}>
                {PRESET_ICONS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    style={[styles.iconPickCell, formIcon === ic && styles.iconPickCellActive]}
                    onPress={() => setFormIcon(ic)}
                  >
                    <Text style={{ fontSize: 18 }}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color Palette Picker */}
              <Text style={styles.fieldLabel}>ACCENT COLOR</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((col) => (
                  <TouchableOpacity
                    key={col}
                    style={[styles.colorPickCell, { backgroundColor: col }, formColor === col && styles.colorPickCellActive]}
                    onPress={() => setFormColor(col)}
                  >
                    {formColor === col && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tax Deductibility Toggle */}
              <TouchableOpacity
                style={styles.taxToggleRow}
                onPress={() => setFormTaxDeductible((v) => !v)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={formTaxDeductible ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={formTaxDeductible ? '#0F172A' : '#64748B'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.taxToggleTitle}>Tax Rebate / Deductible Eligible</Text>
                  <Text style={styles.taxToggleSub}>
                    Mark if spending in this category qualifies for NBR income tax rebate or deduction.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Notes */}
              <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="e.g. Monthly supermarket groceries"
                placeholderTextColor="#94A3B8"
                multiline
                value={formNotes}
                onChangeText={setFormNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={{ color: '#64748B', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveCategory}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </Text>
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerCard: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  badgeIntuit: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeIntuitText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.8,
  },
  badgeCount: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  badgeCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4,
    maxWidth: 550,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  syncBtnText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 12.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 9.5,
    borderRadius: Radius.md,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  resetBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
  },
  kpiStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  kpiCol: {
    flex: 1,
    minWidth: 180,
  },
  kpiDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 2,
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748B',
  },
  tabSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 4,
    gap: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  tabSwitchBtnActive: {
    backgroundColor: '#0F172A',
  },
  tabSwitchText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabSwitchTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  searchFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  categoriesList: {
    gap: 12,
  },
  catCard: {
    backgroundColor: '#FFFFFF',
  },
  catCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  catIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  catIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  catNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  taxBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  taxBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  catNotesText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  cardActionBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  editIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  meterContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  meterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 12,
    color: '#334155',
  },
  meterTarget: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  percentUsedText: {
    fontSize: 11,
    fontWeight: '800',
  },
  remainingText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.4,
    marginTop: 12,
    marginBottom: 6,
  },
  modalTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  modalTypeBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalTypeBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  modalTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalTypeTextActive: {
    color: '#FFFFFF',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconPickCell: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPickCellActive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorPickCell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPickCellActive: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  taxToggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: Radius.sm,
    marginTop: 14,
  },
  taxToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  taxToggleSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  modalSaveBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
});
