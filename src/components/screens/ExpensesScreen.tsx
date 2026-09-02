import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';

export interface ExpenseItem {
  id: string;
  category: 'Asset Expense' | 'Household & Living' | 'Debt Service EMI' | 'Personal / Discretionary';
  linkedAssetId?: string; // e.g. "AST-101"
  title: string;
  amount: number;
  date: string;
  paymentMethod: string;
  notes?: string;
}

const initialExpenses: ExpenseItem[] = [
  {
    id: 'EXP-01',
    category: 'Debt Service EMI',
    title: 'City Bank Home Loan EMI',
    amount: 45000,
    date: '2026-08-25',
    paymentMethod: 'BRAC Salary Auto-Debit',
    notes: 'Loan #HL-9920',
  },
  {
    id: 'EXP-02',
    category: 'Household & Living',
    title: 'Monthly Groceries & Kitchen Supplies',
    amount: 28000,
    date: '2026-08-10',
    paymentMethod: 'City Bank Card',
  },
  {
    id: 'EXP-03',
    category: 'Debt Service EMI',
    title: 'Eastern Bank Vehicle Auto Loan EMI',
    amount: 22500,
    date: '2026-08-05',
    paymentMethod: 'bKash MFS',
  },
  {
    id: 'EXP-04',
    category: 'Asset Expense',
    linkedAssetId: 'AST-101',
    title: 'Gulshan Flat Building Service Charge & Maintenance',
    amount: 8500,
    date: '2026-08-01',
    paymentMethod: 'City Bank Transfer',
    notes: 'Lift, security, generator maintenance for rental apartment',
  },
  {
    id: 'EXP-05',
    category: 'Household & Living',
    title: 'Electricity, Gas & High-Speed Internet Bills',
    amount: 7000,
    date: '2026-08-12',
    paymentMethod: 'bKash Wallet',
  },
  {
    id: 'EXP-06',
    category: 'Asset Expense',
    linkedAssetId: 'AST-105',
    title: 'Toyota Harrier Oil Change, Fuel & Octane',
    amount: 6500,
    date: '2026-08-14',
    paymentMethod: 'Physical Cash',
    notes: 'Periodic engine servicing & fuel run',
  },
  {
    id: 'EXP-07',
    category: 'Asset Expense',
    linkedAssetId: 'AST-102',
    title: 'Purbachal Land Boundary Guarding & Municipality Tax',
    amount: 3000,
    date: '2026-08-02',
    paymentMethod: 'Cash in Hand',
    notes: 'Land protection fee',
  },
  {
    id: 'EXP-08',
    category: 'Personal / Discretionary',
    title: 'Family Weekend Dining & Outing',
    amount: 4500,
    date: '2026-08-16',
    paymentMethod: 'Credit Card',
  },
];

export const ExpensesScreen: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'ASSET' | 'HOUSEHOLD' | 'EMI' | 'PERSONAL'>('ALL');
  const [expenses] = useState<ExpenseItem[]>(initialExpenses);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const assetExpensesTotal = expenses
    .filter((e) => e.category === 'Asset Expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const householdTotal = expenses
    .filter((e) => e.category === 'Household & Living')
    .reduce((sum, e) => sum + e.amount, 0);

  const emiTotal = expenses
    .filter((e) => e.category === 'Debt Service EMI')
    .reduce((sum, e) => sum + e.amount, 0);

  const filtered = expenses.filter((e) => {
    if (filter === 'ASSET') return e.category === 'Asset Expense';
    if (filter === 'HOUSEHOLD') return e.category === 'Household & Living';
    if (filter === 'EMI') return e.category === 'Debt Service EMI';
    if (filter === 'PERSONAL') return e.category === 'Personal / Discretionary';
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Executive Summary Card */}
      <GlassCard style={styles.summaryCard} padding={20} glowColor={Colors.danger}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>TOTAL MONTHLY CASH OUTFLOW</Text>
            <Text style={[styles.summaryAmount, { color: Colors.danger }]}>
              ৳ {totalExpense.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.summarySub}>
              Asset Costs • Household Living • Fixed Debt EMIs
            </Text>
          </View>
        </View>

        {/* 3-Sector Outflow Strip */}
        <View style={styles.strip}>
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>🏢 ASSET-LINKED COSTS</Text>
            <Text style={[styles.stripVal, { color: Colors.secondary }]}>
              ৳ {assetExpensesTotal.toLocaleString('en-IN')} ({Math.round((assetExpensesTotal / totalExpense) * 100)}%)
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>🏠 HOUSEHOLD LIVING</Text>
            <Text style={[styles.stripVal, { color: Colors.accent }]}>
              ৳ {householdTotal.toLocaleString('en-IN')} ({Math.round((householdTotal / totalExpense) * 100)}%)
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>💳 DEBT EMIs</Text>
            <Text style={[styles.stripVal, { color: Colors.danger }]}>
              ৳ {emiTotal.toLocaleString('en-IN')} ({Math.round((emiTotal / totalExpense) * 100)}%)
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { id: 'ALL', label: 'All Expenses' },
          { id: 'ASSET', label: '🏢 Against Asset ID' },
          { id: 'HOUSEHOLD', label: '🏠 Household' },
          { id: 'EMI', label: '💳 Debt EMIs' },
          { id: 'PERSONAL', label: '🛍️ Personal' },
        ].map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
            onPress={() => setFilter(f.id as any)}
          >
            <Text style={[styles.filterBtnText, filter === f.id && styles.filterBtnTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <View style={styles.list}>
        {filtered.map((item) => (
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
                <Text style={styles.itemMeta}>
                  {item.category} • {item.date} • {item.paymentMethod}
                </Text>
                {item.notes && <Text style={styles.notesText}>Note: {item.notes}</Text>}
              </View>

              <View style={styles.rightCol}>
                <Text style={styles.amountText}>-৳ {item.amount.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </GlassCard>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryTop: {
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.danger,
  },
  summaryAmount: {
    ...Typography.displayL,
    marginTop: 2,
  },
  summarySub: {
    ...Typography.caption,
    marginTop: 2,
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  stripCol: {
    flex: 1,
    alignItems: 'center',
  },
  vLine: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  stripLabel: {
    ...Typography.label,
    fontSize: 8,
    color: Colors.textMuted,
  },
  stripVal: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: Colors.danger,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterBtnTextActive: {
    color: Colors.danger,
    fontWeight: '800',
  },
  list: {
    gap: Spacing.sm,
  },
  card: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  itemTitle: {
    ...Typography.bodyBold,
    fontSize: 13,
  },
  assetBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  assetBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondary,
  },
  itemMeta: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  notesText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.danger,
  },
});
