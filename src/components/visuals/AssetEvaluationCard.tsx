import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import { AssetItem, AssetEvaluationSummary } from '../../finance/assetEvaluation';

interface AssetEvaluationCardProps {
  assets: AssetItem[];
  summary: AssetEvaluationSummary;
  onAddAssetPress?: () => void;
}

export const AssetEvaluationCard: React.FC<AssetEvaluationCardProps> = ({
  assets,
  summary,
  onAddAssetPress,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Header Summary Card */}
      <GlassCard style={styles.summaryCard} padding={18} glowColor={Colors.primary}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerLabel}>TOTAL PHYSICAL & TANGIBLE ASSETS</Text>
            <Text style={styles.headerVal}>
              ৳ {(summary.totalAssetValuation / 10000000).toFixed(2)} Crore
            </Text>
            <Text style={styles.headerSub}>
              ৳ {summary.totalAssetValuation.toLocaleString('en-IN')} Market Valuation
            </Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={onAddAssetPress}>
            <Ionicons name="add-circle" size={18} color="#000" />
            <Text style={styles.addBtnText}>Add Asset</Text>
          </TouchableOpacity>
        </View>

        {/* Mini 3-Stat Strip */}
        <View style={styles.statStrip}>
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>MONTHLY YIELD</Text>
            <Text style={[styles.stripVal, { color: Colors.primary }]}>
              +৳ {summary.totalMonthlyAssetIncome.toLocaleString('en-IN')}/mo
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>IDLE CAPITAL LOCK</Text>
            <Text style={[styles.stripVal, { color: Colors.accent }]}>
              ৳ {(summary.totalIdleAssetValuation / 100000).toFixed(1)}L ({summary.idleCapitalPct}%)
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>ANNUAL ROI</Text>
            <Text style={[styles.stripVal, { color: Colors.secondary }]}>
              {summary.overallAnnualYieldPct}% p.a.
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* 2. Advanced Intelligence Rankings: Top Income Generator & Future Growth Star */}
      <View style={styles.insightGrid}>
        {/* Top Cash Flow Asset */}
        {summary.topIncomeGenerator && (
          <GlassCard style={styles.insightCard} padding={14} glowColor={Colors.primary}>
            <View style={styles.insightTop}>
              <View style={[styles.badgeCircle, { backgroundColor: 'rgba(0,229,179,0.15)' }]}>
                <Text style={{ fontSize: 16 }}>🏆</Text>
              </View>
              <View style={styles.insightHeaderRight}>
                <Text style={styles.insightTag}>TOP CASH FLOW GENERATOR</Text>
                <Text style={styles.insightName} numberOfLines={1}>
                  {summary.topIncomeGenerator.asset.name}
                </Text>
              </View>
            </View>
            <View style={styles.insightMetricRow}>
              <Text style={styles.insightMetricVal}>
                +৳ {summary.topIncomeGenerator.monthlyIncome.toLocaleString('en-IN')}/mo
              </Text>
              <View style={styles.yieldPill}>
                <Text style={styles.yieldPillText}>
                  {summary.topIncomeGenerator.annualYieldPct}% Yield
                </Text>
              </View>
            </View>
            <Text style={styles.assetIdTag}>
              ID: {summary.topIncomeGenerator.asset.id} • {summary.topIncomeGenerator.asset.category}
            </Text>
          </GlassCard>
        )}

        {/* Top Future Capital Appreciation Star */}
        {summary.topFutureGrowthAsset && (
          <GlassCard style={styles.insightCard} padding={14} glowColor={Colors.secondary}>
            <View style={styles.insightTop}>
              <View style={[styles.badgeCircle, { backgroundColor: 'rgba(123,110,246,0.15)' }]}>
                <Text style={{ fontSize: 16 }}>🚀</Text>
              </View>
              <View style={styles.insightHeaderRight}>
                <Text style={[styles.insightTag, { color: Colors.secondary }]}>
                  HIGHEST FUTURE VALUATION POTENTIAL
                </Text>
                <Text style={styles.insightName} numberOfLines={1}>
                  {summary.topFutureGrowthAsset.asset.name}
                </Text>
              </View>
            </View>
            <View style={styles.insightMetricRow}>
              <Text style={[styles.insightMetricVal, { color: Colors.secondary }]}>
                ৳ {(summary.topFutureGrowthAsset.projected5YearValuation / 10000000).toFixed(2)} Cr (5Y)
              </Text>
              <View style={[styles.yieldPill, { backgroundColor: 'rgba(123,110,246,0.2)' }]}>
                <Text style={[styles.yieldPillText, { color: Colors.secondary }]}>
                  +{summary.topFutureGrowthAsset.annualGrowthPct}% YoY
                </Text>
              </View>
            </View>
            <Text style={styles.assetIdTag}>
              {summary.topFutureGrowthAsset.growthSummary}
            </Text>
          </GlassCard>
        )}
      </View>

      {/* 3. Detailed Assets Table / Card List */}
      <Text style={styles.sectionHeading}>ASSET INVENTORY & INCOME AUDIT</Text>

      <View style={styles.assetList}>
        {assets.map((asset) => {
          const isIdle = asset.monthlyIncome === 0;

          return (
            <GlassCard key={asset.id} style={styles.assetCard} padding={14}>
              <View style={styles.assetRow}>
                {/* Left ID & Category */}
                <View style={styles.assetLeftCol}>
                  <View style={styles.assetTitleRow}>
                    <Text style={styles.assetName}>{asset.name}</Text>
                    <View
                      style={[
                        styles.statusTag,
                        {
                          backgroundColor: isIdle
                            ? 'rgba(255,181,71,0.15)'
                            : 'rgba(0,229,179,0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTagText,
                          { color: isIdle ? Colors.accent : Colors.primary },
                        ]}
                      >
                        {isIdle ? '⚠️ IDLE ASSET' : '⚡ INCOME ACTIVE'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.assetMeta}>
                    ID: <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>{asset.id}</Text> • {asset.category}
                    {asset.quantity && asset.uom ? ` • ${asset.quantity} ${asset.uom}` : ''}
                    {asset.currentRatePerUoM ? ` @ ৳${asset.currentRatePerUoM.toLocaleString('en-IN')}/${asset.uom}` : ''}
                  </Text>
                </View>

                {/* Right Valuation & Income */}
                <View style={styles.assetRightCol}>
                  <Text style={styles.assetValuation}>
                    ৳ {asset.currentValuation.toLocaleString('en-IN')}
                  </Text>
                  <Text
                    style={[
                      styles.assetIncome,
                      { color: isIdle ? Colors.textMuted : Colors.primary },
                    ]}
                  >
                    {isIdle ? '৳ 0 / mo (Idle)' : `+৳ ${asset.monthlyIncome.toLocaleString('en-IN')}/mo`}
                  </Text>
                </View>
              </View>
            </GlassCard>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.primary,
    marginBottom: 2,
  },
  headerVal: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
  },
  statStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  stripCol: {
    flex: 1,
    alignItems: 'center',
  },
  vLine: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  stripLabel: {
    ...Typography.label,
    fontSize: 8,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  stripVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  insightGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  insightCard: {
    width: '100%',
  },
  insightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightHeaderRight: {
    flex: 1,
  },
  insightTag: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '800',
  },
  insightName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  insightMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  insightMetricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  yieldPill: {
    backgroundColor: 'rgba(0, 229, 179, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  yieldPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  assetIdTag: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  sectionHeading: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  assetList: {
    gap: 8,
  },
  assetCard: {
    width: '100%',
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetLeftCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  assetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  assetName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusTagText: {
    fontSize: 8,
    fontWeight: '800',
  },
  assetMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  assetRightCol: {
    alignItems: 'flex-end',
  },
  assetValuation: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  assetIncome: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
