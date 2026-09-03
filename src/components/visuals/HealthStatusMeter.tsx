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
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name={isSolvent ? 'shield-checkmark' : 'alert-circle'}
            size={18}
            color={isSolvent ? '#059669' : '#DC2626'}
          />
          <Text style={styles.title}>LIQUID SOLVENCY & DEBT COVERAGE RATIO</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isSolvent ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isSolvent ? '#10B981' : '#EF4444' },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isSolvent ? '#059669' : '#DC2626' },
            ]}
          >
            {isSolvent ? 'LIQUID SURPLUS' : 'LEVERAGED DEFICIT'}
          </Text>
        </View>
      </View>

      <Text style={styles.subFormula}>Liquid Reserve Buffer: Cash & Bank Accounts − Outstanding Borrowings</Text>

      <View style={styles.mainValueRow}>
        <View>
          <Text
            style={[
              styles.netAmount,
              { color: isSolvent ? '#0F172A' : '#DC2626' },
            ]}
          >
            {isSolvent ? '+' : '−'}৳ {Math.abs(netStatus).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.netAmountSub}>
            {isSolvent ? 'Liquid Capital Buffer above all debts' : 'Immediate debt liabilities exceed liquid cash reserves'}
          </Text>
        </View>

        <View style={styles.coverageBox}>
          <Text style={styles.coverageLabel}>Debt Coverage</Text>
          <Text style={[styles.coverageValue, { color: isSolvent ? '#059669' : '#D97706' }]}>
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
          {totalCashInHand > 0 && (
            <Text style={styles.barInsideText}>Cash: ৳{(totalCashInHand / 100000).toFixed(1)}L</Text>
          )}
        </View>
        <View
          style={[
            styles.loanPortion,
            { flex: Math.max(1, totalLoans) },
          ]}
        >
          {totalLoans > 0 && (
            <Text style={styles.barInsideText}>Debt: ৳{(totalLoans / 100000).toFixed(1)}L</Text>
          )}
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <View style={[styles.dot, { backgroundColor: '#0284C7' }]} />
          <Text style={styles.footerLabel}>Liquid Cash & Bank Reserves:</Text>
          <Text style={styles.footerVal}>৳ {totalCashInHand.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.footerItem}>
          <View style={[styles.dot, { backgroundColor: '#DC2626' }]} />
          <Text style={styles.footerLabel}>Total Outstanding Borrowing:</Text>
          <Text style={styles.footerVal}>৳ {totalLoans.toLocaleString('en-IN')}</Text>
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
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: Spacing.md,
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
    gap: 8,
  },
  title: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subFormula: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  mainValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  netAmount: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  netAmountSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  coverageBox: {
    alignItems: 'flex-end',
  },
  coverageLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  coverageValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  streamBar: {
    height: 18,
    flexDirection: 'row',
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: Spacing.md,
    gap: 2,
  },
  cashPortion: {
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loanPortion: {
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barInsideText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footerLabel: {
    fontSize: 13,
    color: '#334155',
  },
  footerVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
});
