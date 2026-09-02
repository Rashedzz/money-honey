/**
 * Multi-Stock Relative Performance Comparison Graph & Peer Matrix Tool
 * Normalized to 0% at start date, allowing direct alpha & beta comparison against DSEX benchmark.
 * Built with react-native-svg for cross-platform high-performance vector rendering.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Line, Polyline, Text as SvgText, G, Rect } from 'react-native-svg';
import { Spacing, Radius } from '../../theme';
import { getSectorPeerComparison, PeerComparisonItem } from '../../finance/advancedStockFeatures';

export type ComparisonHorizon = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y';

interface StockPerformanceLine {
  id: string;
  name: string;
  color: string;
  totalReturnPercent: number;
  alphaVsDsex: number;
  dataPoints: number[]; // Normalized % return at each interval
}

export const StockComparisonGraph: React.FC = () => {
  const [horizon, setHorizon] = useState<ComparisonHorizon>('1Y');
  const [activeSector, setActiveSector] = useState<string>('Pharmaceuticals');
  const [enabledStocks, setEnabledStocks] = useState<Record<string, boolean>>({
    SQURPHARMA: true,
    BRACBANK: true,
    BATBC: true,
    LHBL: false,
    DSEX: true,
  });

  const toggleStock = (id: string) => {
    setEnabledStocks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Generate normalized return trajectories based on horizon
  const comparisonSeries: StockPerformanceLine[] = useMemo(() => {
    const intervals = horizon === '1M' ? 15 : horizon === '3M' ? 20 : horizon === '6M' ? 25 : 30;

    // Helper to generate cumulative return curve
    const generateCurve = (finalReturn: number, curveDivergence: number) => {
      const curve: number[] = [0];
      for (let i = 1; i < intervals; i++) {
        const progress = i / (intervals - 1);
        const noise = Math.sin(i * 0.8) * curveDivergence;
        const val = Math.round((progress * finalReturn + noise) * 10) / 10;
        curve.push(val);
      }
      curve[curve.length - 1] = finalReturn;
      return curve;
    };

    const dsexReturn = horizon === '1M' ? 1.4 : horizon === '3M' ? 4.2 : horizon === '6M' ? 8.5 : horizon === '1Y' ? 12.8 : 31.4;
    const squrReturn = horizon === '1M' ? 3.8 : horizon === '3M' ? 9.5 : horizon === '6M' ? 18.2 : horizon === '1Y' ? 28.4 : 64.2;
    const bracReturn = horizon === '1M' ? 4.5 : horizon === '3M' ? 11.2 : horizon === '6M' ? 22.4 : horizon === '1Y' ? 34.2 : 78.5;
    const batbcReturn = horizon === '1M' ? -0.8 : horizon === '3M' ? -2.4 : horizon === '6M' ? -1.5 : horizon === '1Y' ? -4.1 : 14.8;
    const lhblReturn = horizon === '1M' ? 2.1 : horizon === '3M' ? 6.8 : horizon === '6M' ? 14.0 : horizon === '1Y' ? 20.2 : 48.0;

    return [
      {
        id: 'SQURPHARMA',
        name: 'SQURPHARMA',
        color: '#0284C7',
        totalReturnPercent: squrReturn,
        alphaVsDsex: Math.round((squrReturn - dsexReturn) * 10) / 10,
        dataPoints: generateCurve(squrReturn, 3.2),
      },
      {
        id: 'BRACBANK',
        name: 'BRACBANK',
        color: '#16A34A',
        totalReturnPercent: bracReturn,
        alphaVsDsex: Math.round((bracReturn - dsexReturn) * 10) / 10,
        dataPoints: generateCurve(bracReturn, 4.0),
      },
      {
        id: 'BATBC',
        name: 'BATBC',
        color: '#9333EA',
        totalReturnPercent: batbcReturn,
        alphaVsDsex: Math.round((batbcReturn - dsexReturn) * 10) / 10,
        dataPoints: generateCurve(batbcReturn, 2.5),
      },
      {
        id: 'LHBL',
        name: 'LHBL',
        color: '#EA580C',
        totalReturnPercent: lhblReturn,
        alphaVsDsex: Math.round((lhblReturn - dsexReturn) * 10) / 10,
        dataPoints: generateCurve(lhblReturn, 3.5),
      },
      {
        id: 'DSEX',
        name: 'DSEX Benchmark',
        color: '#0F172A',
        totalReturnPercent: dsexReturn,
        alphaVsDsex: 0.0,
        dataPoints: generateCurve(dsexReturn, 1.8),
      },
    ];
  }, [horizon]);

  // Chart dimensions
  const chartWidth = 620;
  const chartHeight = 220;
  const paddingLeft = 12;
  const paddingRight = 60;
  const paddingTop = 20;
  const paddingBottom = 25;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Min and max returns across active stocks
  const activeSeries = comparisonSeries.filter((s) => enabledStocks[s.id]);
  const allValues = activeSeries.flatMap((s) => s.dataPoints);
  const minVal = Math.min(-10, ...allValues);
  const maxVal = Math.max(25, ...allValues);
  const valRange = maxVal - minVal || 1;

  const getX = (index: number, total: number) => {
    return paddingLeft + (index / (total - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return paddingTop + plotHeight - ((val - minVal) / valRange) * plotHeight;
  };

  const peers = getSectorPeerComparison(activeSector);

  return (
    <View style={styles.cardContainer}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>📊 MULTI-STOCK RELATIVE PERFORMANCE COMPARISON</Text>
          <Text style={styles.subtitle}>
            Normalized to 0% at start of horizon. Directly reveals alpha generated over DSEX Benchmark Index.
          </Text>
        </View>

        {/* Horizon Pills */}
        <View style={styles.horizonRow}>
          {(['1M', '3M', '6M', '1Y', '3Y', '5Y'] as ComparisonHorizon[]).map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.hPill, horizon === h && styles.hPillActive]}
              onPress={() => setHorizon(h)}
            >
              <Text style={[styles.hPillText, horizon === h && styles.hPillTextActive]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Interactive Legend & Alpha Pills */}
      <View style={styles.legendRow}>
        {comparisonSeries.map((s) => {
          const isEnabled = enabledStocks[s.id];
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.legendPill, isEnabled && { borderColor: s.color, backgroundColor: '#F8FAFC' }]}
              onPress={() => toggleStock(s.id)}
            >
              <View style={[styles.legendDot, { backgroundColor: isEnabled ? s.color : '#CBD5E1' }]} />
              <Text style={[styles.legendText, { color: isEnabled ? '#0F172A' : '#94A3B8', fontWeight: isEnabled ? '800' : '500' }]}>
                {s.name}
              </Text>
              <Text style={[styles.returnBadge, { color: s.totalReturnPercent >= 0 ? '#16A34A' : '#EF4444' }]}>
                {s.totalReturnPercent >= 0 ? '+' : ''}{s.totalReturnPercent}%
              </Text>
              {s.id !== 'DSEX' && isEnabled && (
                <Text style={{ fontSize: 10, color: s.alphaVsDsex >= 0 ? '#16A34A' : '#EF4444', fontWeight: '700' }}>
                  (α {s.alphaVsDsex >= 0 ? '+' : ''}{s.alphaVsDsex}%)
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* SVG Canvas */}
      <View style={{ overflow: 'hidden', alignItems: 'center' }}>
        <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Baseline 0% return reference line */}
          <Line
            x1={paddingLeft}
            y1={getY(0)}
            x2={chartWidth - paddingRight}
            y2={getY(0)}
            stroke="#94A3B8"
            strokeWidth="1.2"
            strokeDasharray="4,4"
          />
          <SvgText
            x={chartWidth - paddingRight + 6}
            y={getY(0) + 4}
            fontSize="10"
            fontWeight="bold"
            fill="#64748B"
            textAnchor="start"
          >
            0.0% Baseline
          </SvgText>

          {/* Upper/Lower Grid Lines */}
          {[0.25, 0.5, 0.75].map((ratio) => {
            const val = Math.round(minVal + ratio * valRange);
            if (Math.abs(val) < 2) return null;
            return (
              <G key={ratio}>
                <Line
                  x1={paddingLeft}
                  y1={getY(val)}
                  x2={chartWidth - paddingRight}
                  y2={getY(val)}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <SvgText
                  x={chartWidth - paddingRight + 6}
                  y={getY(val) + 4}
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="start"
                >
                  {val >= 0 ? '+' : ''}{val}%
                </SvgText>
              </G>
            );
          })}

          {/* Render Active Trajectory Lines */}
          {activeSeries.map((s) => {
            const points = s.dataPoints.map((val, idx) => `${getX(idx, s.dataPoints.length)},${getY(val)}`).join(' ');
            return (
              <Polyline
                key={s.id}
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth={s.id === 'DSEX' ? 2 : 2.5}
                strokeDasharray={s.id === 'DSEX' ? '4,4' : undefined}
              />
            );
          })}
        </Svg>
      </View>

      {/* Peer Comparison Matrix Table (Sector Deep Dive) */}
      <View style={{ marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '900', color: '#0F172A' }}>
            🏢 SECTOR PEER COMPARISON MATRIX ({activeSector.toUpperCase()})
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {['Pharmaceuticals', 'Banking'].map((sec) => (
              <TouchableOpacity
                key={sec}
                style={[styles.secPill, activeSector === sec && styles.secPillActive]}
                onPress={() => setActiveSector(sec)}
              >
                <Text style={[styles.secPillText, activeSector === sec && styles.secPillTextActive]}>{sec}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.2 }]}>PEER COMPANY</Text>
            <Text style={[styles.th, { width: 65 }]}>LTP</Text>
            <Text style={[styles.th, { width: 55 }]}>P/E</Text>
            <Text style={[styles.th, { width: 55 }]}>P/B</Text>
            <Text style={[styles.th, { width: 65 }]}>ROE</Text>
            <Text style={[styles.th, { width: 65 }]}>DIV YLD</Text>
            <Text style={[styles.th, { width: 75 }]}>AI SCORE</Text>
          </View>
          {peers.map((peer) => (
            <View key={peer.symbol} style={styles.tableRow}>
              <View style={{ flex: 1.2 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A' }}>{peer.symbol}</Text>
                <Text style={{ fontSize: 10, color: '#64748B' }}>{peer.companyName}</Text>
              </View>
              <Text style={[styles.td, { width: 65, fontWeight: '700' }]}>৳{peer.ltp}</Text>
              <Text style={[styles.td, { width: 55 }]}>{peer.peRatio}x</Text>
              <Text style={[styles.td, { width: 55 }]}>{peer.pbRatio}x</Text>
              <Text style={[styles.td, { width: 65, fontWeight: '800', color: '#16A34A' }]}>{peer.roePercent}%</Text>
              <Text style={[styles.td, { width: 65, fontWeight: '800', color: '#F59E0B' }]}>{peer.dividendYieldPercent}%</Text>
              <Text style={[styles.td, { width: 75, fontWeight: '900', color: '#16A34A' }]}>
                {peer.aiScore}/100
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
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
    maxWidth: 380,
  },
  horizonRow: {
    flexDirection: 'row',
    gap: 4,
  },
  hPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: '#F1F5F9',
  },
  hPillActive: {
    backgroundColor: '#0284C7',
  },
  hPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  hPillTextActive: {
    color: '#FFFFFF',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
  returnBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  secPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    backgroundColor: '#F1F5F9',
  },
  secPillActive: {
    backgroundColor: '#0F172A',
  },
  secPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  secPillTextActive: {
    color: '#FFFFFF',
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
    paddingVertical: 6,
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  td: {
    fontSize: 11,
    color: '#0F172A',
  },
});
