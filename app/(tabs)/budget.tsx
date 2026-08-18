import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { GlassCard } from '../../src/components/shared/GlassCard';

const mockCategories = [
  { id: '1', name: 'Housing & Rent', spent: 35000, limit: 35000, color: '#8A2BE2' },
  { id: '2', name: 'Groceries & Food', spent: 22000, limit: 30000, color: '#FF6347' },
  { id: '3', name: 'Utilities & Bills', spent: 9500, limit: 12000, color: '#FFD700' },
  { id: '4', name: 'Transport & Fuel', spent: 8500, limit: 10000, color: '#4682B4' },
  { id: '5', name: 'Healthcare', spent: 4200, limit: 8000, color: '#32CD32' },
  { id: '6', name: 'Entertainment & Dining', spent: 12500, limit: 10000, color: '#FF69B4' },
];

export default function BudgetScreen() {
  const totalSpent = mockCategories.reduce((acc, c) => acc + c.spent, 0);
  const totalLimit = mockCategories.reduce((acc, c) => acc + c.limit, 0);
  const pct = Math.round((totalSpent / totalLimit) * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Monthly Budget</Text>
          <TouchableOpacity style={styles.addBtn}>
            <LinearGradient colors={Colors.gradientAmber} style={styles.addBtnGrad}>
              <Ionicons name="add" size={20} color="#000" />
              <Text style={styles.addBtnText}>New Budget</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.summaryCard} padding={20} glowColor={Colors.accent}>
          <Text style={styles.summaryLabel}>SPENT THIS MONTH</Text>
          <Text style={styles.summaryAmount}>৳ {totalSpent.toLocaleString('en-IN')}</Text>
          <Text style={styles.summarySub}>
            of ৳ {totalLimit.toLocaleString('en-IN')} limit ({pct}% utilized)
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 100 ? Colors.danger : Colors.accent },
              ]}
            />
          </View>
        </GlassCard>

        <Text style={styles.sectionHeader}>CATEGORY BREAKDOWN</Text>

        {mockCategories.map((cat) => {
          const catPct = Math.round((cat.spent / cat.limit) * 100);
          const isOver = cat.spent > cat.limit;

          return (
            <GlassCard key={cat.id} style={styles.catCard} padding={16}>
              <View style={styles.catHeader}>
                <View style={styles.catTitleRow}>
                  <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.catName}>{cat.name}</Text>
                </View>
                <Text style={[styles.catAmt, isOver && { color: Colors.danger }]}>
                  ৳ {cat.spent.toLocaleString('en-IN')} / ৳ {cat.limit.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.catProgressBg}>
                <View
                  style={[
                    styles.catProgressFill,
                    {
                      width: `${Math.min(catPct, 100)}%`,
                      backgroundColor: isOver ? Colors.danger : cat.color,
                    },
                  ]}
                />
              </View>
              <View style={styles.catFooter}>
                <Text style={styles.catPct}>{catPct}% used</Text>
                <Text style={[styles.catRemain, isOver && { color: Colors.danger }]}>
                  {isOver ? `Over by ৳ ${(cat.spent - cat.limit).toLocaleString('en-IN')}` : `৳ ${(cat.limit - cat.spent).toLocaleString('en-IN')} left`}
                </Text>
              </View>
            </GlassCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.displayM,
    color: Colors.textPrimary,
  },
  addBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  addBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    ...Typography.label,
    color: Colors.accent,
    marginBottom: 4,
  },
  summaryAmount: {
    ...Typography.displayL,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  summarySub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeader: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  catCard: {
    marginBottom: Spacing.sm,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  catTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  catAmt: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  catProgressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  catProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  catFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catPct: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  catRemain: {
    ...Typography.caption,
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
});
