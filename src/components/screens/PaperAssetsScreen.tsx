import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';

export interface PaperAsset {
  id: string;
  type: 'Sanchaypatra' | 'FDR' | 'DPS';
  title: string;
  certificateOrAccNum: string;
  institution: string;
  principalAmount: number;
  annualInterestRate: number;
  payoutInterval: 'Monthly' | 'Quarterly' | 'At Maturity';
  periodicReturnAmount: number;
  maturityDate: string;
  daysToMaturity: number;
  urgency: 'critical' | 'warning' | 'safe';
}

const initialPaperAssets: PaperAsset[] = [
  {
    id: 'SC-01',
    type: 'Sanchaypatra',
    title: '3-Month Profit Based Sanchaypatra',
    certificateOrAccNum: 'SC-992014-BD',
    institution: 'Bangladesh National Savings',
    principalAmount: 1000000,
    annualInterestRate: 11.04,
    payoutInterval: 'Quarterly',
    periodicReturnAmount: 28500,
    maturityDate: '2029-08-24',
    daysToMaturity: 6, // 6 days to coupon!
    urgency: 'critical',
  },
  {
    id: 'SC-02',
    type: 'Sanchaypatra',
    title: '5-Year Bangladesh Sanchaypatra',
    certificateOrAccNum: 'SC-554109-BD',
    institution: 'National Savings Directorate',
    principalAmount: 1500000,
    annualInterestRate: 11.28,
    payoutInterval: 'At Maturity',
    periodicReturnAmount: 846000,
    maturityDate: '2028-11-15',
    daysToMaturity: 820,
    urgency: 'safe',
  },
  {
    id: 'FDR-01',
    type: 'FDR',
    title: 'Dutch-Bangla Bank 3-Year FDR',
    certificateOrAccNum: 'FDR-8839201',
    institution: 'Dutch-Bangla Bank Ltd.',
    principalAmount: 1500000,
    annualInterestRate: 9.5,
    payoutInterval: 'Monthly',
    periodicReturnAmount: 18500,
    maturityDate: '2026-09-06',
    daysToMaturity: 19,
    urgency: 'warning',
  },
  {
    id: 'DPS-01',
    type: 'DPS',
    title: 'BRAC Bank Millionaire DPS Scheme',
    certificateOrAccNum: 'DPS-334102',
    institution: 'BRAC Bank Ltd.',
    principalAmount: 600000,
    annualInterestRate: 8.5,
    payoutInterval: 'Monthly',
    periodicReturnAmount: 10000,
    maturityDate: '2027-05-10',
    daysToMaturity: 265,
    urgency: 'safe',
  },
];

export const PaperAssetsScreen: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'SANCHAYPATRA' | 'FDR' | 'DPS'>('ALL');
  const [assets] = useState<PaperAsset[]>(initialPaperAssets);

  const totalPrincipal = assets.reduce((sum, a) => sum + a.principalAmount, 0);
  const totalMonthlyIncome = assets.reduce((sum, a) => {
    if (a.payoutInterval === 'Monthly') return sum + a.periodicReturnAmount;
    if (a.payoutInterval === 'Quarterly') return sum + a.periodicReturnAmount / 3;
    return sum;
  }, 0);

  const filtered = assets.filter((a) => {
    if (filter === 'SANCHAYPATRA') return a.type === 'Sanchaypatra';
    if (filter === 'FDR') return a.type === 'FDR';
    if (filter === 'DPS') return a.type === 'DPS';
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary Card */}
      <GlassCard style={styles.summaryCard} padding={20} glowColor={Colors.secondary}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>PAPER ASSET PORTFOLIO (GOVT & BANK CERTIFICATES)</Text>
            <Text style={[styles.summaryAmount, { color: Colors.secondary }]}>
              ৳ {(totalPrincipal / 100000).toFixed(1)} Lakhs
            </Text>
            <Text style={styles.summarySub}>
              National Savings • Fixed Deposits • DPS Schemes
            </Text>
          </View>

          <View style={styles.yieldBox}>
            <Text style={styles.yieldLabel}>MONTHLY CASH RETURN</Text>
            <Text style={[styles.yieldVal, { color: Colors.secondary }]}>
              +৳ {Math.round(totalMonthlyIncome).toLocaleString('en-IN')}/mo
            </Text>
            <Text style={styles.yieldSub}>Avg 10.1% Effective Return</Text>
          </View>
        </View>

        <View style={styles.strip}>
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>SANCHAYPATRA</Text>
            <Text style={styles.stripVal}>৳ 25.0 Lakhs</Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>BANK FDRs</Text>
            <Text style={styles.stripVal}>৳ 15.0 Lakhs</Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>DPS SCHEMES</Text>
            <Text style={styles.stripVal}>৳ 6.0 Lakhs</Text>
          </View>
        </View>
      </GlassCard>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { id: 'ALL', label: 'All Paper Assets' },
          { id: 'SANCHAYPATRA', label: '📜 Sanchaypatra' },
          { id: 'FDR', label: '🏦 Bank FDR' },
          { id: 'DPS', label: '⏳ DPS Schemes' },
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

      {/* Card List */}
      <View style={styles.list}>
        {filtered.map((item) => (
          <GlassCard key={item.id} style={styles.card} padding={16}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{item.type}</Text>
                </View>
                <View>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSub}>{item.institution} • {item.certificateOrAccNum}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.urgencyPill,
                  {
                    backgroundColor:
                      item.urgency === 'critical'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : item.urgency === 'warning'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(0, 245, 160, 0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.urgencyPillText,
                    {
                      color:
                        item.urgency === 'critical'
                          ? Colors.danger
                          : item.urgency === 'warning'
                          ? Colors.accent
                          : Colors.primary,
                    },
                  ]}
                >
                  {item.daysToMaturity <= 21 ? `⚠️ ${item.daysToMaturity}d Due` : 'Active'}
                </Text>
              </View>
            </View>

            <View style={styles.metricGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>PRINCIPAL INVESTED</Text>
                <Text style={styles.gridVal}>৳ {item.principalAmount.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>INTEREST RATE</Text>
                <Text style={[styles.gridVal, { color: Colors.secondary }]}>
                  {item.annualInterestRate}% p.a.
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>PAYOUT INTERVAL</Text>
                <Text style={styles.gridVal}>{item.payoutInterval}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>RETURN PER INTERVAL</Text>
                <Text style={[styles.gridVal, { color: Colors.primary }]}>
                  ৳ {item.periodicReturnAmount.toLocaleString('en-IN')}
                </Text>
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
    backgroundColor: '#0B0F19',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.secondary,
  },
  summaryAmount: {
    ...Typography.displayL,
    marginTop: 2,
  },
  summarySub: {
    ...Typography.caption,
    marginTop: 2,
  },
  yieldBox: {
    alignItems: 'flex-end',
  },
  yieldLabel: {
    ...Typography.label,
    fontSize: 9,
  },
  yieldVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  yieldSub: {
    fontSize: 10,
    color: Colors.textSecondary,
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
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: Colors.secondary,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterBtnTextActive: {
    color: Colors.secondary,
    fontWeight: '800',
  },
  list: {
    gap: Spacing.md,
  },
  card: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondary,
  },
  itemTitle: {
    ...Typography.subheading,
    fontSize: 14,
  },
  itemSub: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  urgencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  urgencyPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
  },
  gridLabel: {
    ...Typography.label,
    fontSize: 8,
    color: Colors.textMuted,
  },
  gridVal: {
    ...Typography.bodyBold,
    fontSize: 13,
    marginTop: 2,
  },
});
