/**
 * AI Forecast & Recommendation Accuracy Verification View
 * Displays Forecasted vs Actual Realized Price with date range selection (1M, 3M, 6M, 1Y, ALL)
 * Proves whether the AI is performing well or not with empirical DSE data.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Line, Polyline, Polygon, Circle, Text as SvgText, G } from 'react-native-svg';
import { Spacing, Radius } from '../../theme';
import { getForecastAccuracyAnalysis, AccuracyDateRange } from '../../finance/aiForecastAccuracyEngine';

interface ForecastAccuracyViewProps {
  symbol: string;
  currentPrice: number;
}

export const ForecastAccuracyView: React.FC<ForecastAccuracyViewProps> = ({ symbol, currentPrice }) => {
  const [selectedRange, setSelectedRange] = useState<AccuracyDateRange>('1Y');

  const accuracy = getForecastAccuracyAnalysis(symbol, selectedRange);

  // SVG dimensions for Forecast vs Actual trajectory
  const chartWidth = 620;
  const chartHeight = 220;
  const paddingLeft = 12;
  const paddingRight = 60;
  const paddingTop = 20;
  const paddingBottom = 25;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const allPrices = accuracy.timeline.flatMap((t) => [t.actualPrice, t.forecastedPrice, t.upperConfidenceBound, t.lowerConfidenceBound]);
  const minP = Math.floor(Math.min(...allPrices) * 0.98);
  const maxP = Math.ceil(Math.max(...allPrices) * 1.02);
  const priceRange = maxP - minP || 1;

  const getX = (index: number) => {
    return paddingLeft + (index / (accuracy.timeline.length - 1)) * plotWidth;
  };

  const getY = (p: number) => {
    return paddingTop + plotHeight - ((p - minP) / priceRange) * plotHeight;
  };

  // Build confidence polygon string
  const upperPoints = accuracy.timeline.map((t, i) => `${getX(i)},${getY(t.upperConfidenceBound)}`);
  const lowerPoints = accuracy.timeline.slice().reverse().map((t, i) => {
    const revIdx = accuracy.timeline.length - 1 - i;
    return `${getX(revIdx)},${getY(t.lowerConfidenceBound)}`;
  });
  const confidencePolygon = [...upperPoints, ...lowerPoints].join(' ');

  return (
    <View style={styles.container}>
      {/* Header & Date Range Selector */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>🎯 AI RECOMMENDATION & FORECAST ACCURACY AUDIT</Text>
          <Text style={styles.subtitle}>
            Walk-forward empirical verification of AI Forecasted Price vs Actual Realized DSE Market Price
          </Text>
        </View>

        {/* Date Range Selector */}
        <View style={styles.rangeRow}>
          {(['1M', '3M', '6M', '1Y', 'ALL'] as AccuracyDateRange[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeBtn, selectedRange === r && styles.rangeBtnActive]}
              onPress={() => setSelectedRange(r)}
            >
              <Text style={[styles.rangeBtnText, selectedRange === r && styles.rangeBtnTextActive]}>
                {r === 'ALL' ? '2Y (All)' : r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Verification KPI Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiItem}>
          <Text style={styles.kpiLabel}>DIRECTIONAL ACCURACY</Text>
          <Text style={[styles.kpiVal, { color: '#16A34A' }]}>{accuracy.directionalAccuracyPercent}%</Text>
          <Text style={styles.kpiSub}>Correct Up/Down Trend</Text>
        </View>

        <View style={styles.kpiItem}>
          <Text style={styles.kpiLabel}>TARGET PRICE HIT RATE</Text>
          <Text style={[styles.kpiVal, { color: '#16A34A' }]}>{accuracy.targetHitRatePercent}%</Text>
          <Text style={styles.kpiSub}>{accuracy.winningPredictions} of {accuracy.totalPredictions} Targets Met</Text>
        </View>

        <View style={styles.kpiItem}>
          <Text style={styles.kpiLabel}>MEAN FORECAST ERROR (MAPE)</Text>
          <Text style={[styles.kpiVal, { color: '#0284C7' }]}>±{accuracy.meanAbsoluteErrorPercent}%</Text>
          <Text style={styles.kpiSub}>Avg Deviation from Target</Text>
        </View>

        <View style={styles.kpiItem}>
          <Text style={styles.kpiLabel}>PROFIT FACTOR</Text>
          <Text style={[styles.kpiVal, { color: '#16A34A' }]}>{accuracy.profitFactor}x</Text>
          <Text style={styles.kpiSub}>Avg Win +{accuracy.avgWinningTradePercent}% / Loss -{accuracy.avgLosingTradePercent}%</Text>
        </View>

        <View style={styles.kpiItem}>
          <Text style={styles.kpiLabel}>STRATEGY ALPHA OVER DSEX</Text>
          <Text style={[styles.kpiVal, { color: '#16A34A' }]}>+{accuracy.alphaVsDsexPercent}%</Text>
          <Text style={styles.kpiSub}>AI: +{accuracy.aiStrategyReturnPercent}% vs DSEX: +{accuracy.dsexBenchmarkReturnPercent}%</Text>
        </View>
      </View>

      {/* SVG Chart: Forecasted vs Actual Path */}
      <View style={{ marginTop: Spacing.md, overflow: 'hidden', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 14, height: 3, backgroundColor: '#0284C7' }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#0F172A' }}>Actual DSE Market Price</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 14, height: 2, backgroundColor: '#16A34A', borderStyle: 'dashed' }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#16A34A' }}>AI Forecasted Path</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, backgroundColor: 'rgba(22, 163, 74, 0.15)', borderRadius: 2 }} />
            <Text style={{ fontSize: 11, color: '#64748B' }}>80% Confidence Corridor</Text>
          </View>
        </View>

        <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Background Confidence Envelope */}
          <Polygon
            points={confidencePolygon}
            fill="rgba(22, 163, 74, 0.12)"
          />

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = paddingTop + plotHeight * ratio;
            const price = Math.round((maxP - ratio * priceRange) * 10) / 10;
            return (
              <G key={ratio}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <SvgText
                  x={chartWidth - paddingRight + 6}
                  y={y + 4}
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="start"
                >
                  ৳{price}
                </SvgText>
              </G>
            );
          })}

          {/* Forecasted Line (Dashed Green) */}
          <Polyline
            points={accuracy.timeline.map((t, i) => `${getX(i)},${getY(t.forecastedPrice)}`).join(' ')}
            fill="none"
            stroke="#16A34A"
            strokeWidth="2"
            strokeDasharray="4,4"
          />

          {/* Actual Price Line (Solid Blue) */}
          <Polyline
            points={accuracy.timeline.map((t, i) => `${getX(i)},${getY(t.actualPrice)}`).join(' ')}
            fill="none"
            stroke="#0284C7"
            strokeWidth="2.5"
          />

          {/* Current Last Price Dot */}
          <Circle
            cx={getX(accuracy.timeline.length - 1)}
            cy={getY(accuracy.timeline[accuracy.timeline.length - 1].actualPrice)}
            r={4}
            fill="#0284C7"
          />

          {/* Bottom Date Labels */}
          {accuracy.timeline.filter((_, i) => i % 2 === 0).map((t, i) => {
            const idx = accuracy.timeline.indexOf(t);
            return (
              <SvgText
                key={`date-${idx}`}
                x={getX(idx)}
                y={chartHeight - 6}
                fontSize="9"
                fill="#64748B"
                textAnchor="middle"
              >
                {t.date}
              </SvgText>
            );
          })}
        </Svg>
      </View>

      {/* Audited Predictions vs Actual Verification Ledger Table */}
      <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
        📋 AUDITED WALK-FORWARD PREDICTIONS & REPUTATIONAL OUTCOME LOG
      </Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { width: 85 }]}>DATE</Text>
          <Text style={[styles.th, { width: 95 }]}>RECOMMENDATION</Text>
          <Text style={[styles.th, { width: 70 }]}>ENTRY (৳)</Text>
          <Text style={[styles.th, { width: 75 }]}>AI TARGET</Text>
          <Text style={[styles.th, { width: 75 }]}>ACTUAL DSE</Text>
          <Text style={[styles.th, { width: 65 }]}>VARIANCE</Text>
          <Text style={[styles.th, { flex: 1 }]}>VERIFICATION STATUS & OUTCOME</Text>
        </View>
        {accuracy.records.map((r) => {
          const isWin = r.outcome.includes('WIN');
          return (
            <View key={r.id} style={styles.tableRow}>
              <View style={{ width: 85 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#0F172A' }}>{r.predictionDate}</Text>
                <Text style={{ fontSize: 10, color: '#64748B' }}>To {r.targetDate}</Text>
              </View>
              <View style={{ width: 95 }}>
                <View style={[styles.badge, isWin ? styles.badgeBuy : styles.badgeHold]}>
                  <Text style={styles.badgeText}>{r.recommendation}</Text>
                </View>
              </View>
              <Text style={[styles.td, { width: 70, fontWeight: '700' }]}>৳{r.entryPrice}</Text>
              <Text style={[styles.td, { width: 75, fontWeight: '900', color: '#0284C7' }]}>৳{r.forecastedTargetPrice}</Text>
              <Text style={[styles.td, { width: 75, fontWeight: '900', color: isWin ? '#16A34A' : '#EF4444' }]}>
                ৳{r.actualPriceRealized} ({r.actualReturnPercent >= 0 ? '+' : ''}{r.actualReturnPercent}%)
              </Text>
              <Text style={[styles.td, { width: 65, fontSize: 11 }]}>±{r.forecastVariancePercent}%</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: isWin ? '#16A34A' : '#EF4444' }}>{r.outcome}</Text>
                <Text style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>{r.dseFactorVerdict}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    maxWidth: 450,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  rangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: '#F1F5F9',
  },
  rangeBtnActive: {
    backgroundColor: '#16A34A',
  },
  rangeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  rangeBtnTextActive: {
    color: '#FFFFFF',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  kpiItem: {
    flex: 1,
    minWidth: 110,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  kpiSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  td: {
    fontSize: 11,
    color: '#0F172A',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  badgeBuy: {
    backgroundColor: '#DCFCE7',
  },
  badgeHold: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
});
