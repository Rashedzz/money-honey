/**
 * QuickenBudgetPacingMeter.tsx
 * Quicken's signature "What's Left to Spend" visual pacing meter.
 * Calculates:
 * - Current month progress (e.g., Day 7 of 30 • 23% of month elapsed)
 * - Total Monthly Budget Ceiling vs Actual Spent to date
 * - Actual daily burn rate vs Target daily budget allowance
 * - "What's Left to Spend" with color-coded pacing status (On Track, Caution, Over Budget)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';

interface QuickenBudgetPacingMeterProps {
  totalBudget: number;
  totalSpent: number;
  onOpenBudgetSetup?: () => void;
}

export const QuickenBudgetPacingMeter: React.FC<QuickenBudgetPacingMeterProps> = ({
  totalBudget,
  totalSpent,
  onOpenBudgetSetup,
}) => {
  const now = new Date();
  const currentDay = now.getDate();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = totalDaysInMonth - currentDay;
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const monthProgressPct = Math.min(100, Math.round((currentDay / totalDaysInMonth) * 100));
  const budgetSpentPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  const remainingBudget = Math.max(0, totalBudget - totalSpent);

  const dailyBudgetAllowance = totalBudget > 0 ? Math.round(totalBudget / totalDaysInMonth) : 0;
  const actualDailySpend = currentDay > 0 ? Math.round(totalSpent / currentDay) : 0;
  const remainingDailyAllowance = daysRemaining > 0 ? Math.round(remainingBudget / daysRemaining) : remainingBudget;

  // Pacing status calculation
  let status: 'on_track' | 'caution' | 'over_budget' = 'on_track';
  let statusLabel = '🟢 On Track';
  let statusColor = '#10B981';
  let statusBg = 'rgba(16, 185, 129, 0.12)';
  let statusBorder = 'rgba(16, 185, 129, 0.3)';

  if (totalSpent > totalBudget && totalBudget > 0) {
    status = 'over_budget';
    statusLabel = '🔴 Over Budget';
    statusColor = '#EF4444';
    statusBg = 'rgba(239, 68, 68, 0.12)';
    statusBorder = 'rgba(239, 68, 68, 0.3)';
  } else if (budgetSpentPct > monthProgressPct + 10) {
    status = 'caution';
    statusLabel = '🟡 Pacing Fast';
    statusColor = '#F59E0B';
    statusBg = 'rgba(245, 158, 11, 0.12)';
    statusBorder = 'rgba(245, 158, 11, 0.3)';
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.quickenBadge}>
            <Ionicons name="speedometer-outline" size={16} color="#0284C7" />
          </View>
          <View>
            <Text style={styles.cardTitle}>WHAT'S LEFT TO SPEND</Text>
            <Text style={styles.cardSubtitle}>
              {monthName} • Day {currentDay} of {totalDaysInMonth} ({daysRemaining} days left)
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusBorder }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          {onOpenBudgetSetup && (
            <TouchableOpacity style={styles.setupBtn} onPress={onOpenBudgetSetup} activeOpacity={0.8}>
              <Ionicons name="settings-outline" size={14} color="#0284C7" />
              <Text style={styles.setupBtnText}>Budgets</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Metric Hero */}
      <View style={styles.heroRow}>
        <View style={styles.heroLeft}>
          <Text style={styles.remainingLabel}>Available Discretionary Spend</Text>
          <Text style={[styles.remainingAmount, { color: totalSpent > totalBudget && totalBudget > 0 ? '#EF4444' : '#0F172A' }]}>
            ৳ {remainingBudget.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.dailyBurnSub}>
            {daysRemaining > 0
              ? `You can spend ~৳ ${remainingDailyAllowance.toLocaleString('en-IN')}/day for the rest of ${now.toLocaleString('default', { month: 'short' })}`
              : 'End of month cycle reached'}
          </Text>
        </View>

        <View style={styles.heroRight}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatLabel}>Monthly Budget</Text>
            <Text style={styles.miniStatVal}>৳ {totalBudget.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatLabel}>Actual Spent</Text>
            <Text style={[styles.miniStatVal, { color: '#DC2626' }]}>
              ৳ {totalSpent.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Dual Progress Meter (Budget Consumed vs Month Elapsed) */}
      <View style={styles.meterSection}>
        <View style={styles.meterHeader}>
          <Text style={styles.meterLabel}>Budget Consumed: {budgetSpentPct}%</Text>
          <Text style={styles.meterPaceLabel}>Month Elapsed: {monthProgressPct}%</Text>
        </View>

        {/* Primary Spending Track */}
        <View style={styles.trackBackground}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${Math.min(100, budgetSpentPct)}%`,
                backgroundColor:
                  status === 'over_budget' ? '#EF4444' : status === 'caution' ? '#F59E0B' : '#10B981',
              },
            ]}
          />
          {/* Month progress marker pin */}
          <View style={[styles.monthPin, { left: `${monthProgressPct}%` }]} />
        </View>
      </View>

      {/* Burn Rate Comparison Grid */}
      <View style={styles.burnRateRow}>
        <View style={styles.burnItem}>
          <Text style={styles.burnLabel}>Budget Daily Target</Text>
          <Text style={styles.burnValue}>৳ {dailyBudgetAllowance.toLocaleString('en-IN')}/day</Text>
        </View>
        <View style={styles.burnDivider} />
        <View style={styles.burnItem}>
          <Text style={styles.burnLabel}>Actual Daily Burn</Text>
          <Text
            style={[
              styles.burnValue,
              { color: actualDailySpend > dailyBudgetAllowance && dailyBudgetAllowance > 0 ? '#DC2626' : '#16A34A' },
            ]}
          >
            ৳ {actualDailySpend.toLocaleString('en-IN')}/day
          </Text>
        </View>
        <View style={styles.burnDivider} />
        <View style={styles.burnItem}>
          <Text style={styles.burnLabel}>Burn Variance</Text>
          <Text
            style={[
              styles.burnValue,
              { color: actualDailySpend <= dailyBudgetAllowance ? '#16A34A' : '#DC2626' },
            ]}
          >
            {actualDailySpend <= dailyBudgetAllowance ? '−' : '+'}৳{' '}
            {Math.abs(actualDailySpend - dailyBudgetAllowance).toLocaleString('en-IN')}/day
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickenBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  setupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  setupBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  heroLeft: {
    flex: 1,
    minWidth: 220,
  },
  remainingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  remainingAmount: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  dailyBurnSub: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  heroRight: {
    flexDirection: 'row',
    gap: 14,
  },
  miniStat: {
    alignItems: 'flex-end',
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  miniStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  meterSection: {
    marginVertical: Spacing.md,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  meterPaceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  trackBackground: {
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'visible',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackFill: {
    height: '100%',
    borderRadius: 5,
  },
  monthPin: {
    position: 'absolute',
    top: -4,
    width: 3,
    height: 18,
    backgroundColor: '#0284C7',
    borderRadius: 1.5,
    zIndex: 2,
  },
  burnRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  burnItem: {
    alignItems: 'center',
    flex: 1,
  },
  burnLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  burnValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  burnDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
});
