import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import { AssetItem, evaluateAssets } from '../../finance/assetEvaluation';

interface PhysicalAssetsScreenProps {
  assets: AssetItem[];
  onAddAsset: (asset: AssetItem) => void;
}

export const PhysicalAssetsScreen: React.FC<PhysicalAssetsScreenProps> = ({
  assets,
  onAddAsset,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'IDLE'>('ALL');
  const summary = evaluateAssets(assets);

  const filteredAssets = assets.filter((a) => {
    if (filter === 'INCOME') return a.monthlyIncome > 0;
    if (filter === 'IDLE') return a.monthlyIncome === 0;
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Summary */}
      <GlassCard style={styles.summaryCard} padding={20} glowColor={Colors.primary}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>PHYSICAL & TANGIBLE ASSET PORTFOLIO</Text>
            <Text style={styles.summaryAmount}>
              ৳ {(summary.totalAssetValuation / 10000000).toFixed(2)} Crore
            </Text>
            <Text style={styles.summarySub}>
              ৳ {summary.totalAssetValuation.toLocaleString('en-IN')} Total Market Valuation
            </Text>
          </View>

          <View style={styles.yieldBox}>
            <Text style={styles.yieldLabel}>MONTHLY ASSET RENT/YIELD</Text>
            <Text style={styles.yieldVal}>+৳ {summary.totalMonthlyAssetIncome.toLocaleString('en-IN')}/mo</Text>
            <Text style={styles.yieldSub}>{summary.overallAnnualYieldPct}% Annual Net Yield</Text>
          </View>
        </View>

        {/* 3-Pillar Stat Strip */}
        <View style={styles.strip}>
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>ACTIVE INCOME ASSETS</Text>
            <Text style={[styles.stripVal, { color: Colors.primary }]}>
              {summary.incomeGeneratingCount} Generating Rent
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>IDLE CAPITAL LOCKED</Text>
            <Text style={[styles.stripVal, { color: Colors.accent }]}>
              ৳ {(summary.totalIdleAssetValuation / 10000000).toFixed(2)} Cr ({summary.idleCapitalPct}%)
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>IDLE ASSET COUNT</Text>
            <Text style={[styles.stripVal, { color: Colors.accent }]}>
              {summary.idleCount} Non-Income Assets
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Filter Tabs & Count */}
      <View style={styles.filterRow}>
        <View style={styles.filterPills}>
          {[
            { id: 'ALL', label: `All Assets (${assets.length})` },
            { id: 'INCOME', label: `⚡ Cash Yielding (${summary.incomeGeneratingCount})` },
            { id: 'IDLE', label: `⚠️ Idle Capital (${summary.idleCount})` },
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
      </View>

      {/* Asset Cards Grid */}
      <View style={styles.assetList}>
        {filteredAssets.map((asset) => {
          const isIdle = asset.monthlyIncome === 0;

          return (
            <GlassCard key={asset.id} style={styles.assetCard} padding={16}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.idBadge}>
                    <Text style={styles.idText}>{asset.id}</Text>
                  </View>
                  <View>
                    <Text style={styles.assetName}>{asset.name}</Text>
                    <Text style={styles.assetCategory}>{asset.category}</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isIdle
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(0, 245, 160, 0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: isIdle ? Colors.accent : Colors.primary },
                    ]}
                  >
                    {isIdle ? '⚠️ IDLE ASSET' : '⚡ CASH ACTIVE'}
                  </Text>
                </View>
              </View>

              {/* Metric Breakdown Table */}
              <View style={styles.metricGrid}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>CURRENT MARKET VALUE</Text>
                  <Text style={styles.gridVal}>৳ {asset.currentValuation.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>MONTHLY CASH FLOW</Text>
                  <Text
                    style={[
                      styles.gridVal,
                      { color: isIdle ? Colors.textMuted : Colors.primary },
                    ]}
                  >
                    {isIdle ? '৳ 0 (Idle)' : `+৳ ${asset.monthlyIncome.toLocaleString('en-IN')}/mo`}
                  </Text>
                </View>

                {asset.quantity && asset.uom && (
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>UoM & UNIT RATE</Text>
                    <Text style={styles.gridVal}>
                      {asset.quantity} {asset.uom} {asset.currentRatePerUoM ? `(@ ৳${asset.currentRatePerUoM.toLocaleString('en-IN')})` : ''}
                    </Text>
                  </View>
                )}

                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>ANNUAL CAPITAL APPRECIATION</Text>
                  <Text
                    style={[
                      styles.gridVal,
                      { color: asset.appreciationRateAnnualPct >= 0 ? Colors.secondary : Colors.danger },
                    ]}
                  >
                    {asset.appreciationRateAnnualPct >= 0 ? `+${asset.appreciationRateAnnualPct}% YoY` : `${asset.appreciationRateAnnualPct}% YoY`}
                  </Text>
                </View>
              </View>
            </GlassCard>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
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
    color: Colors.primary,
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
    color: Colors.primary,
    marginTop: 2,
  },
  yieldSub: {
    fontSize: 10,
    color: Colors.secondary,
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
    marginTop: 2,
  },
  filterRow: {
    marginBottom: Spacing.md,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 8,
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
    backgroundColor: 'rgba(0, 245, 160, 0.15)',
    borderColor: Colors.primary,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterBtnTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  assetList: {
    gap: Spacing.md,
  },
  assetCard: {
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
  idBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  idText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  assetName: {
    ...Typography.subheading,
    fontSize: 15,
  },
  assetCategory: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusPillText: {
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
