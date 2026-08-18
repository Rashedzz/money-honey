import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      padding={18}
      glowColor={isSolvent ? Colors.primary : Colors.danger}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name={isSolvent ? 'shield-checkmark' : 'alert-circle'}
            size={22}
            color={isSolvent ? Colors.primary : Colors.danger}
          />
          <Text style={styles.title}>CURRENT FINANCIAL STATUS</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isSolvent ? 'rgba(0,229,179,0.15)' : 'rgba(255,71,87,0.15)' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: isSolvent ? Colors.primary : Colors.danger },
            ]}
          >
            {isSolvent ? 'NET POSITIVE / SOLVENT' : 'DEBT EXCEEDS CASH'}
          </Text>
        </View>
      </View>

      <Text style={styles.subFormula}>Cash in Hand (Total) − Total Outstanding Loans</Text>

      <View style={styles.mainValueRow}>
        <Text
          style={[
            styles.netAmount,
            { color: isSolvent ? Colors.primary : Colors.danger },
          ]}
        >
          {isSolvent ? '+' : '−'}৳ {Math.abs(netStatus).toLocaleString('en-IN')}
        </Text>
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
          <Text style={styles.barInsideText}>Cash: ৳{(totalCashInHand / 100000).toFixed(1)}L</Text>
        </View>
        <View
          style={[
            styles.loanPortion,
            { flex: Math.max(1, totalLoans) },
          ]}
        >
          <Text style={styles.barInsideText}>Loan: ৳{(totalLoans / 100000).toFixed(1)}L</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.footerLabel}>Total Cash & Bank:</Text>
          <Text style={styles.footerVal}>৳ {totalCashInHand.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.footerItem}>
          <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.footerLabel}>Total Debt Liability:</Text>
          <Text style={styles.footerVal}>৳ {totalLoans.toLocaleString('en-IN')}</Text>
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
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...Typography.label,
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    fontSize: 11,
    marginBottom: Spacing.md,
  },
  mainValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  netAmount: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  coverageBox: {
    alignItems: 'flex-end',
  },
  coverageLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  coverageValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  streamBar: {
    height: 24,
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
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
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
    fontSize: 11,
    color: Colors.textSecondary,
  },
  footerVal: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
