import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';

interface ProjectionComparisonCardProps {
  currentMonthName: string;
  nextMonthName: string;
  currentIncome: number;
  projectedIncomeNextMonth: number;
  currentExpense: number;
  projectedExpenseNextMonth: number;
  projectedIncomeBreakdown: Array<{ name: string; amount: number; color: string }>;
  projectedExpenseBreakdown: Array<{ name: string; amount: number; color: string }>;
}

export const ProjectionComparisonCard: React.FC<ProjectionComparisonCardProps> = ({
  currentMonthName,
  nextMonthName,
  currentIncome,
  projectedIncomeNextMonth,
  currentExpense,
  projectedExpenseNextMonth,
  projectedIncomeBreakdown,
  projectedExpenseBreakdown,
}) => {
  const currentNet = currentIncome - currentExpense;
  const projectedNet = projectedIncomeNextMonth - projectedExpenseNextMonth;
  const netDelta = projectedNet - currentNet;
  const isNetGrowing = netDelta >= 0;

  return (
    <GlassCard style={styles.card} padding={18} glowColor={Colors.secondary}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="telescope-outline" size={20} color={Colors.secondary} />
          <Text style={styles.title}>NEXT MONTH CASH FLOW FORECAST</Text>
        </View>
        <View style={styles.monthBadge}>
          <Text style={styles.monthBadgeText}>{nextMonthName}</Text>
        </View>
      </View>

      {/* Comparison Grid */}
      <View style={styles.grid}>
        {/* Income Block */}
        <View style={styles.col}>
          <Text style={styles.colLabel}>PROJECTED INCOME</Text>
          <Text style={[styles.colAmount, { color: Colors.primary }]}>
            ৳ {projectedIncomeNextMonth.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.colDiff}>
            vs ৳ {currentIncome.toLocaleString('en-IN')} ({currentMonthName})
          </Text>
          <View style={styles.breakdownList}>
            {projectedIncomeBreakdown.map((item, idx) => (
              <View key={idx} style={styles.miniRow}>
                <View style={[styles.miniDot, { backgroundColor: item.color }]} />
                <Text style={styles.miniName}>{item.name}</Text>
                <Text style={styles.miniVal}>৳ {(item.amount / 1000).toFixed(0)}k</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.vDivider} />

        {/* Expense Block */}
        <View style={styles.col}>
          <Text style={styles.colLabel}>PROJECTED EXPENSES</Text>
          <Text style={[styles.colAmount, { color: Colors.danger }]}>
            ৳ {projectedExpenseNextMonth.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.colDiff}>
            vs ৳ {currentExpense.toLocaleString('en-IN')} ({currentMonthName})
          </Text>
          <View style={styles.breakdownList}>
            {projectedExpenseBreakdown.map((item, idx) => (
              <View key={idx} style={styles.miniRow}>
                <View style={[styles.miniDot, { backgroundColor: item.color }]} />
                <Text style={styles.miniName}>{item.name}</Text>
                <Text style={styles.miniVal}>৳ {(item.amount / 1000).toFixed(0)}k</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Net Forecast Banner */}
      <View style={styles.netBanner}>
        <View>
          <Text style={styles.netLabel}>ESTIMATED NET SAVINGS SURPLUS</Text>
          <Text style={[styles.netValue, { color: projectedNet >= 0 ? Colors.primary : Colors.danger }]}>
            ৳ {projectedNet.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.trendBadge, { backgroundColor: isNetGrowing ? 'rgba(0,229,179,0.15)' : 'rgba(255,71,87,0.15)' }]}>
          <Ionicons
            name={isNetGrowing ? 'trending-up' : 'trending-down'}
            size={14}
            color={isNetGrowing ? Colors.primary : Colors.danger}
          />
          <Text style={[styles.trendText, { color: isNetGrowing ? Colors.primary : Colors.danger }]}>
            {isNetGrowing ? '+' : ''}৳ {Math.abs(netDelta).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...Typography.label,
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '800',
  },
  monthBadge: {
    backgroundColor: 'rgba(123, 110, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  monthBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondary,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  col: {
    flex: 1,
  },
  vDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  colLabel: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  colAmount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  colDiff: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  breakdownList: {
    gap: 4,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  miniName: {
    flex: 1,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  miniVal: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  netBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  netLabel: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
  },
  netValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
