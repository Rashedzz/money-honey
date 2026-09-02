import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius, Spacing } from '../../theme';

interface NetWorthMeterProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  allocation: {
    cash: number;
    fixedDeposits: number;
    savings: number;
  };
}

const formatBDT = (amount: number) => {
  return (amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
};

export const NetWorthMeter: React.FC<NetWorthMeterProps> = ({
  netWorth,
  totalAssets,
  totalLiabilities,
  allocation,
}) => {
  const totalAlloc = allocation.cash + allocation.fixedDeposits + allocation.savings || 1;
  const cashPct = Math.round((allocation.cash / totalAlloc) * 100);
  const fdrPct = Math.round((allocation.fixedDeposits / totalAlloc) * 100);
  const savingsPct = Math.round((allocation.savings / totalAlloc) * 100);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFFFFF', '#F0F9FF']} style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.label}>TOTAL CONSOLIDATED NET WORTH</Text>
          <Text style={styles.amount}>৳ {formatBDT(netWorth)}</Text>

          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: 'rgba(2, 132, 199, 0.12)', borderColor: '#BAE6FD' }]}>
              <Text style={[styles.badgeText, { color: '#0284C7' }]}>
                ▲ Assets: ৳ {formatBDT(totalAssets)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
              <Text style={[styles.badgeText, { color: Colors.danger }]}>
                ▼ Liabilities: ৳ {formatBDT(totalLiabilities)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.barContainer}>
            <View style={[styles.barSegment, { flex: Math.max(1, allocation.cash), backgroundColor: '#0284C7' }]}>
              {cashPct > 12 && <Text style={styles.barText}>{cashPct}%</Text>}
            </View>
            <View style={[styles.barSegment, { flex: Math.max(1, allocation.fixedDeposits), backgroundColor: '#6366F1' }]}>
              {fdrPct > 12 && <Text style={styles.barText}>{fdrPct}%</Text>}
            </View>
            <View style={[styles.barSegment, { flex: Math.max(1, allocation.savings), backgroundColor: '#F59E0B' }]}>
              {savingsPct > 12 && <Text style={styles.barText}>{savingsPct}%</Text>}
            </View>
          </View>

          <View style={styles.legend}>
            <LegendItem color="#0284C7" label="Liquid Cash" value={`${cashPct}%`} />
            <LegendItem color="#6366F1" label="Paper/FDR" value={`${fdrPct}%`} />
            <LegendItem color="#F59E0B" label="Govt Savings" value={`${savingsPct}%`} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const LegendItem = ({ color, label, value }: { color: string; label: string; value: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
    <Text style={styles.legendValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    marginBottom: Spacing.md,
    width: '100%',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    overflow: 'hidden',
    shadowColor: '#0369A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  content: {
    padding: Spacing.xl,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  amount: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: Spacing.md,
  },
  badges: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#E2E8F0',
    marginBottom: Spacing.md,
  },
  barContainer: {
    height: 24,
    borderRadius: Radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: Spacing.md,
    gap: 2,
  },
  barSegment: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
});
