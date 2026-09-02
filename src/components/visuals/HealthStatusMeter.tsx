import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';

interface HealthStatusMeterProps {
  totalCashInHand: number;
  totalLoans: number;
}

export const HealthStatusMeter: React.FC<HealthStatusMeterProps> = ({
  totalCashInHand,
  totalLoans,
}) => {
  const netStatus = totalCashInHand - totalLoans;
  const isSolvent = netStatus >= 0;
  const coverageRatio = totalLoans > 0 ? ((totalCashInHand / totalLoans) * 100).toFixed(0) : '100+';

  return (
    <GlassCard
      style={styles.card}
      padding={16}
      glowColor={isSolvent ? Colors.primary : Colors.danger}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name={isSolvent ? 'shield-checkmark' : 'alert-circle'}
            size={18}
            color={isSolvent ? Colors.primary : Colors.danger}
          />
          <Text style={styles.title}>CURRENT FINANCIAL SOLVENCY STATUS</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isSolvent ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: isSolvent ? Colors.primary : Colors.danger },
            ]}
          >
            {isSolvent ? 'SOLVENT' : 'DEBT EXCEEDS CASH'}
          </Text>
        </View>
      </View>

      <Text style={styles.subFormula}>Net Liquid Status: Cash in Hand − Total Outstanding Loans</Text>

      <View style={styles.mainValueRow}>
        <View>
          <Text
            style={[
              styles.netAmount,
              { color: isSolvent ? Colors.primary : Colors.danger },
            ]}
          >
            {isSolvent ? '+' : '−'}৳ {Math.abs(netStatus).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.netAmountSub}>
            {isSolvent ? 'Net Liquid Capital Surplus' : 'Net Deficit (Debt higher than liquid reserves)'}
          </Text>
        </View>

        <View style={styles.coverageBox}>
          <Text style={styles.coverageLabel}>Debt Coverage</Text>
          <Text style={[styles.coverageValue, { color: isSolvent ? Colors.primary : Colors.accent }]}>
            {coverageRatio}%
          </Text>
        </View>
      </View>

      {/* Stream Comparative Bar */}
      <View style={styles.streamBar}>
        <View
          style={[
            styles.cashPortion,
            { flex: Math.max(1, totalCashInHand) },
          ]}
        >
          <Text style={styles.barInsideText}>Cash ৳{(totalCashInHand / 100000).toFixed(1)}L</Text>
        </View>
        <View
          style={[
            styles.loanPortion,
            { flex: Math.max(1, totalLoans) },
          ]}
        >
          <Text style={styles.barInsideText}>Loan ৳{(totalLoans / 100000).toFixed(1)}L</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.footerLabel}>Total Liquid Cash & Bank:</Text>
          <Text style={styles.footerVal}>৳ {totalCashInHand.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.footerItem}>
          <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.footerLabel}>Total Loan Liability:</Text>
          <Text style={styles.footerVal}>৳ {totalLoans.toLocaleString('en-IN')}</Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subFormula: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    marginBottom: Spacing.sm,
  },
  mainValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  netAmount: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  netAmountSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  coverageBox: {
    alignItems: 'flex-end',
  },
  coverageLabel: {
    ...Typography.caption,
    fontSize: 9,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  coverageValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
  },
  streamBar: {
    height: 18,
    flexDirection: 'row',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    gap: 2,
  },
  cashPortion: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loanPortion: {
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barInsideText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#020617',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footerLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  footerVal: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
