import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '../../theme';

export interface NetWorthAllocation {
  cash: number;
  stocks: number;
  paperAssets: number;
  physicalAssets: number;
}

export interface NetWorthMeterProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
  allocation: NetWorthAllocation;
}

const formatBDT = (amount: number) => {
  return Math.round(amount || 0).toLocaleString('en-IN');
};

export const NetWorthMeter: React.FC<NetWorthMeterProps> = ({
  netWorth,
  totalAssets,
  totalLiabilities,
  monthlyIncome = 0,
  monthlyExpense = 0,
  allocation,
}) => {
  const isPositive = netWorth >= 0;
  const netMonthlyCashFlow = monthlyIncome - monthlyExpense;
  const solvencyRatio = totalAssets > 0 ? Math.min(100, Math.round(((totalAssets - totalLiabilities) / totalAssets) * 100)) : 100;
  const emergencyRunwayMonths = monthlyExpense > 0 ? (allocation.cash / monthlyExpense).toFixed(1) : '∞';

  const totalAlloc =
    (allocation.cash || 0) +
    (allocation.stocks || 0) +
    (allocation.paperAssets || 0) +
    (allocation.physicalAssets || 0) || 1;

  const cashPct = Math.round(((allocation.cash || 0) / totalAlloc) * 100);
  const stockPct = Math.round(((allocation.stocks || 0) / totalAlloc) * 100);
  const paperPct = Math.round(((allocation.paperAssets || 0) / totalAlloc) * 100);
  const physicalPct = Math.max(0, 100 - (cashPct + stockPct + paperPct));

  return (
    <View style={styles.card}>
      {/* 1. Header with Institutional Solvency Badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleBadge}>
          <Ionicons name="shield-checkmark" size={15} color="#0284C7" />
          <Text style={styles.titleBadgeText}>EXECUTIVE BALANCE SHEET • CONSOLIDATED WEALTH</Text>
        </View>

        <View
          style={[
            styles.solvencyPill,
            { backgroundColor: solvencyRatio >= 70 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: solvencyRatio >= 70 ? '#10B981' : '#F59E0B' },
            ]}
          />
          <Text
            style={[
              styles.solvencyPillText,
              { color: solvencyRatio >= 70 ? '#059669' : '#D97706' },
            ]}
          >
            {solvencyRatio >= 70 ? `${solvencyRatio}% Equity • Strong Solvency` : `${solvencyRatio}% Equity • Moderate Leverage`}
          </Text>
        </View>
      </View>

      {/* 2. Flagship Net Worth Figure */}
      <View style={styles.heroFigureBox}>
        <Text style={styles.heroSubLabel}>TOTAL CONSOLIDATED NET WORTH</Text>
        <Text style={[styles.heroAmount, { color: isPositive ? '#0F172A' : '#EF4444' }]}>
          {isPositive ? '' : '−'}৳ {formatBDT(Math.abs(netWorth))}
        </Text>
        <Text style={styles.heroCaption}>
          Net wealth aggregated across liquid bank reserves, DSE/CSE equities, sovereign paper instruments & real assets.
        </Text>
      </View>

      {/* 3. Four Core Institutional Financial Pillars */}
      <View style={styles.pillarsGrid}>
        {/* Pillar 1: Gross Assets */}
        <View style={styles.pillarCard}>
          <View style={styles.pillarHeader}>
            <Ionicons name="layers-outline" size={16} color="#0284C7" />
            <Text style={styles.pillarLabel}>GROSS ASSETS</Text>
          </View>
          <Text style={styles.pillarValue}>৳ {formatBDT(totalAssets)}</Text>
          <Text style={[styles.pillarSub, { color: '#059669' }]}>▲ Capital Base</Text>
        </View>

        {/* Pillar 2: Liabilities */}
        <View style={styles.pillarCard}>
          <View style={styles.pillarHeader}>
            <Ionicons name="card-outline" size={16} color="#DC2626" />
            <Text style={styles.pillarLabel}>LIABILITIES & DEBTS</Text>
          </View>
          <Text style={[styles.pillarValue, { color: totalLiabilities > 0 ? '#DC2626' : '#0F172A' }]}>
            ৳ {formatBDT(totalLiabilities)}
          </Text>
          <Text style={[styles.pillarSub, { color: totalLiabilities > 0 ? '#DC2626' : '#64748B' }]}>
            {totalLiabilities > 0 ? '▼ Bank Principal' : 'Debt Free'}
          </Text>
        </View>

        {/* Pillar 3: Net Cash Flow */}
        <View style={styles.pillarCard}>
          <View style={styles.pillarHeader}>
            <Ionicons name="swap-vertical-outline" size={16} color="#059669" />
            <Text style={styles.pillarLabel}>MONTHLY CASH FLOW</Text>
          </View>
          <Text style={[styles.pillarValue, { color: netMonthlyCashFlow >= 0 ? '#059669' : '#DC2626' }]}>
            {netMonthlyCashFlow >= 0 ? '+' : '−'}৳ {formatBDT(Math.abs(netMonthlyCashFlow))}
          </Text>
          <Text style={[styles.pillarSub, { color: netMonthlyCashFlow >= 0 ? '#059669' : '#DC2626' }]}>
            {netMonthlyCashFlow >= 0 ? '▲ Net Surplus' : '▼ Deficit'}
          </Text>
        </View>

        {/* Pillar 4: Emergency Runway */}
        <View style={styles.pillarCard}>
          <View style={styles.pillarHeader}>
            <Ionicons name="timer-outline" size={16} color="#7C3AED" />
            <Text style={styles.pillarLabel}>LIQUID RUNWAY</Text>
          </View>
          <Text style={styles.pillarValue}>{emergencyRunwayMonths} Mo</Text>
          <Text style={[styles.pillarSub, { color: '#6366F1' }]}>Burn Capacity</Text>
        </View>
      </View>

      {/* 4. Asset Allocation Distribution Track */}
      <View style={styles.allocationSection}>
        <View style={styles.allocHeader}>
          <Text style={styles.allocTitle}>ASSET ALLOCATION SPECTRUM</Text>
          <Text style={styles.allocTotalLabel}>Portfolio: ৳ {formatBDT(totalAlloc)}</Text>
        </View>

        <View style={styles.trackContainer}>
          <View style={[styles.trackSegment, { flex: Math.max(1, allocation.cash || 0), backgroundColor: '#0284C7' }]}>
            {cashPct >= 10 && <Text style={styles.trackText}>{cashPct}%</Text>}
          </View>
          <View style={[styles.trackSegment, { flex: Math.max(1, allocation.stocks || 0), backgroundColor: '#0D9488' }]}>
            {stockPct >= 10 && <Text style={styles.trackText}>{stockPct}%</Text>}
          </View>
          <View style={[styles.trackSegment, { flex: Math.max(1, allocation.paperAssets || 0), backgroundColor: '#6366F1' }]}>
            {paperPct >= 10 && <Text style={styles.trackText}>{paperPct}%</Text>}
          </View>
          <View style={[styles.trackSegment, { flex: Math.max(1, allocation.physicalAssets || 0), backgroundColor: '#D97706' }]}>
            {physicalPct >= 10 && <Text style={styles.trackText}>{physicalPct}%</Text>}
          </View>
        </View>

        {/* Allocation Legend */}
        <View style={styles.legendGrid}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0284C7' }]} />
            <Text style={styles.legendLabel}>Liquid Bank ({cashPct}%)</Text>
            <Text style={styles.legendValue}>৳ {formatBDT(allocation.cash || 0)}</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0D9488' }]} />
            <Text style={styles.legendLabel}>Equities & Stocks ({stockPct}%)</Text>
            <Text style={styles.legendValue}>৳ {formatBDT(allocation.stocks || 0)}</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
            <Text style={styles.legendLabel}>Paper & Sanchaypatra ({paperPct}%)</Text>
            <Text style={styles.legendValue}>৳ {formatBDT(allocation.paperAssets || 0)}</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
            <Text style={styles.legendLabel}>Physical & Real Estate ({physicalPct}%)</Text>
            <Text style={styles.legendValue}>৳ {formatBDT(allocation.physicalAssets || 0)}</Text>
          </View>
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
    shadowRadius: 12,
    elevation: 3,
    marginBottom: Spacing.md,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.8,
  },
  solvencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  solvencyPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  heroFigureBox: {
    marginVertical: Spacing.sm,
  },
  heroSubLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroCaption: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 19,
  },
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  pillarCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pillarLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  pillarValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  pillarSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  allocationSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.md,
  },
  allocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  allocTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  allocTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  trackContainer: {
    height: 18,
    borderRadius: Radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    gap: 2,
    marginBottom: 12,
  },
  trackSegment: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 160,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
});

