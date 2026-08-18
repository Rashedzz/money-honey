import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import { LifeTimeWealthVelocity } from '../../finance/wealthVelocity';

interface WealthVelocityCardProps {
  velocity: LifeTimeWealthVelocity;
  onEditBirthdayPress?: () => void;
}

type VelocityUnit = 'minute' | 'hour' | 'day' | 'month' | 'year' | 'lifetime';

export const WealthVelocityCard: React.FC<WealthVelocityCardProps> = ({
  velocity,
  onEditBirthdayPress,
}) => {
  const [unit, setUnit] = useState<VelocityUnit>('minute');

  const getUnitRates = () => {
    switch (unit) {
      case 'minute':
        return {
          income: `৳ ${velocity.income.perMinute.toFixed(2)}`,
          expense: `৳ ${velocity.expense.perMinute.toFixed(2)}`,
          savings: `+৳ ${velocity.savings.perMinute.toFixed(2)}`,
          unitLabel: 'per minute (24/7)',
          workingNote: `(৳ ${((velocity.income.perHourWorking) / 60).toFixed(2)} / working min)`,
        };
      case 'hour':
        return {
          income: `৳ ${velocity.income.perHour.toFixed(2)}`,
          expense: `৳ ${velocity.expense.perHour.toFixed(2)}`,
          savings: `+৳ ${velocity.savings.perHour.toFixed(2)}`,
          unitLabel: 'per hour (24/7)',
          workingNote: `(৳ ${velocity.income.perHourWorking.toLocaleString('en-IN')} / 8-hr workday hr)`,
        };
      case 'day':
        return {
          income: `৳ ${velocity.income.perDay.toLocaleString('en-IN')}`,
          expense: `৳ ${velocity.expense.perDay.toLocaleString('en-IN')}`,
          savings: `+৳ ${velocity.savings.perDay.toLocaleString('en-IN')}`,
          unitLabel: 'per calendar day',
          workingNote: 'Every single day',
        };
      case 'month':
        return {
          income: `৳ ${velocity.income.perMonth.toLocaleString('en-IN')}`,
          expense: `৳ ${velocity.expense.perMonth.toLocaleString('en-IN')}`,
          savings: `+৳ ${velocity.savings.perMonth.toLocaleString('en-IN')}`,
          unitLabel: 'per month',
          workingNote: `${velocity.savings.savingsRatePct}% Savings Rate`,
        };
      case 'year':
        return {
          income: `৳ ${(velocity.income.perYear / 100000).toFixed(2)} Lakhs`,
          expense: `৳ ${(velocity.expense.perYear / 100000).toFixed(2)} Lakhs`,
          savings: `+৳ ${(velocity.savings.perYear / 100000).toFixed(2)} Lakhs`,
          unitLabel: 'per year',
          workingNote: 'Annualized Velocity',
        };
      case 'lifetime':
        return {
          income: `৳ ${(velocity.lifetime.estimatedLifetimeEarnings / 10000000).toFixed(2)} Crore`,
          expense: `৳ ${(velocity.lifetime.estimatedLifetimeSpending / 10000000).toFixed(2)} Crore`,
          savings: `৳ ${(velocity.lifetime.lifetimeNetWealthAccumulated / 10000000).toFixed(2)} Crore`,
          unitLabel: 'Total Lifetime Cumulative',
          workingNote: `৳ ${velocity.lifetime.wealthGeneratedPerHourLived} wealth created / hr lived`,
        };
    }
  };

  const currentRates = getUnitRates();

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card} padding={18} glowColor={Colors.primary}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={{ fontSize: 18 }}>⏱️</Text>
            <View>
              <Text style={styles.title}>LIFETIME WEALTH VELOCITY & TIME VALUE</Text>
              <Text style={styles.subText}>
                Based on Birth Date: {velocity.birthDate} ({velocity.ageYears} Years • {velocity.totalMinutesLived.toLocaleString()} Mins Lived)
              </Text>
            </View>
          </View>
        </View>

        {/* Time Unit Selector Pill Tabs */}
        <View style={styles.unitPillsRow}>
          {[
            { id: 'minute', label: 'Minute ⏱️' },
            { id: 'hour', label: 'Hour ⏳' },
            { id: 'day', label: 'Day ☀️' },
            { id: 'month', label: 'Month 📅' },
            { id: 'year', label: 'Year 🚀' },
            { id: 'lifetime', label: 'Lifetime 🧬' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setUnit(tab.id as any)}
              style={[
                styles.unitBtn,
                unit === tab.id && styles.unitBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  unit === tab.id && styles.unitBtnTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.rateHeader}>
          RATES: <Text style={{ color: Colors.primary, textTransform: 'uppercase' }}>{currentRates.unitLabel}</Text>
        </Text>

        {/* 3-Column Velocity Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Income Velocity */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>INCOME GENERATION</Text>
            <Text style={[styles.metricValue, { color: Colors.primary }]}>
              {currentRates.income}
            </Text>
            <Text style={styles.metricSub}>{currentRates.workingNote}</Text>
          </View>

          {/* Expense Burn Rate */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>EXPENSE BURN RATE</Text>
            <Text style={[styles.metricValue, { color: Colors.danger }]}>
              {currentRates.expense}
            </Text>
            <Text style={styles.metricSub}>Living & Debt Burn</Text>
          </View>

          {/* Net Wealth Surplus Creation */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>EQUITY CREATION</Text>
            <Text style={[styles.metricValue, { color: Colors.secondary }]}>
              {currentRates.savings}
            </Text>
            <Text style={styles.metricSub}>{velocity.savings.savingsRatePct}% Net Surplus</Text>
          </View>
        </View>

        {/* Lifetime Human Capital Summary */}
        <View style={styles.lifetimeFooter}>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>LIFETIME CAREER EARNED</Text>
            <Text style={styles.footerVal}>
              ৳ {(velocity.lifetime.estimatedLifetimeEarnings / 10000000).toFixed(2)} Cr
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>LIFETIME SPENT</Text>
            <Text style={[styles.footerVal, { color: Colors.accent }]}>
              ৳ {(velocity.lifetime.estimatedLifetimeSpending / 10000000).toFixed(2)} Cr
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>WEALTH CREATED / HR LIVED</Text>
            <Text style={[styles.footerVal, { color: Colors.primary }]}>
              ৳ {velocity.lifetime.wealthGeneratedPerHourLived}/hr
            </Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  card: {
    width: '100%',
  },
  header: {
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '800',
  },
  subText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  unitPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 4,
    borderRadius: Radius.md,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  unitBtnActive: {
    backgroundColor: 'rgba(0, 229, 179, 0.2)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  unitBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  unitBtnTextActive: {
    color: Colors.primary,
  },
  rateHeader: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricLabel: {
    ...Typography.label,
    fontSize: 7,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricSub: {
    fontSize: 8,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  lifetimeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  footerCol: {
    flex: 1,
    alignItems: 'center',
  },
  vLine: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerLabel: {
    ...Typography.label,
    fontSize: 7,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  footerVal: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
});
