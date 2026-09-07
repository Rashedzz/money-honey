/**
 * AccountCashFlowGraph.tsx
 * High-performance interactive SVG Cash Flow graph for Bank Accounts & Cash in Hand.
 * Renders dual bars: Credits (Inflow - Mint Green) vs Debits (Outflow - Red).
 * Supports both Monthly (grouped day intervals) and Yearly (12 months) views.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { CashFlowDataPoint } from '../../services/transactionManager';

export interface AccountCashFlowGraphProps {
  data: CashFlowDataPoint[];
  periodLabel: string;
  totalCredits: number;
  totalDebits: number;
  netFlow: number;
  height?: number;
}

export const AccountCashFlowGraph: React.FC<AccountCashFlowGraphProps> = ({
  data,
  periodLabel,
  totalCredits,
  totalDebits,
  netFlow,
  height = 200,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // SVG coordinate dimensions
  const svgWidth = 460;
  const svgHeight = height;
  const padLeft = 46;
  const padRight = 16;
  const padBottom = 28;
  const padTop = 18;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Compute maximum value for scaling
  const maxVal = Math.max(
    1000,
    ...data.map((d) => Math.max(d.credit, d.debit))
  );

  const selectedPoint = selectedIndex !== null ? data[selectedIndex] : null;

  // Format currency compact for axes
  const formatCompact = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val > 0 ? `${val}` : '0';
  };

  const hasActivity = totalCredits > 0 || totalDebits > 0;

  return (
    <View style={styles.container}>
      {/* Interactive Tooltip Inspector */}
      {selectedPoint && (
        <View style={styles.tooltipCard}>
          <View style={styles.tooltipHeader}>
            <Text style={styles.tooltipPeriod}>Period: {selectedPoint.label}</Text>
            <TouchableOpacity onPress={() => setSelectedIndex(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700' }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tooltipValuesRow}>
            <View style={styles.tooltipPill}>
              <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.tooltipLabel}>Inflow (Credit):</Text>
              <Text style={[styles.tooltipVal, { color: '#10B981' }]}>
                +৳ {selectedPoint.credit.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.tooltipPill}>
              <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.tooltipLabel}>Outflow (Debit):</Text>
              <Text style={[styles.tooltipVal, { color: '#EF4444' }]}>
                -৳ {selectedPoint.debit.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.tooltipPill}>
              <Text style={styles.tooltipLabel}>Net:</Text>
              <Text
                style={[
                  styles.tooltipVal,
                  { color: selectedPoint.net >= 0 ? '#10B981' : '#EF4444', fontWeight: '800' },
                ]}
              >
                {selectedPoint.net >= 0 ? '+' : ''}৳ {selectedPoint.net.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* SVG Canvas */}
      <Svg
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={styles.svg}
      >
        <Defs>
          {/* Credit Gradient (Green) */}
          <SvgLinearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#34D399" stopOpacity="1" />
            <Stop offset="100%" stopColor="#059669" stopOpacity="0.85" />
          </SvgLinearGradient>

          {/* Debit Gradient (Red) */}
          <SvgLinearGradient id="debitGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#F87171" stopOpacity="1" />
            <Stop offset="100%" stopColor="#DC2626" stopOpacity="0.85" />
          </SvgLinearGradient>

          {/* Active Highlight Gradient */}
          <SvgLinearGradient id="highlightGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#38BDF8" stopOpacity="0.03" />
          </SvgLinearGradient>
        </Defs>

        {/* Horizontal Background Gridlines & Labels */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = padTop + chartH * (1 - ratio);
          const gridVal = maxVal * ratio;
          return (
            <G key={`grid-${i}`}>
              <Line
                x1={padLeft}
                y1={y}
                x2={svgWidth - padRight}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray={ratio > 0 ? '4,4' : undefined}
                strokeWidth={1}
              />
              <SvgText
                x={padLeft - 6}
                y={y + 4}
                fill="#94A3B8"
                fontSize={9}
                fontWeight="500"
                textAnchor="end"
              >
                {formatCompact(gridVal)}
              </SvgText>
            </G>
          );
        })}

        {/* Dual Bars for Each Data Point */}
        {data.map((item, idx) => {
          const count = data.length;
          const colWidth = chartW / count;
          const colX = padLeft + idx * colWidth;

          // Bar widths and padding
          const barPad = Math.max(2, Math.min(6, colWidth * 0.12));
          const barW = Math.max(3, (colWidth - barPad * 3) / 2);

          const creditH = (item.credit / maxVal) * chartH;
          const debitH = (item.debit / maxVal) * chartH;

          const creditY = padTop + chartH - creditH;
          const debitY = padTop + chartH - debitH;

          const creditX = colX + barPad;
          const debitX = colX + barPad * 2 + barW;

          const isSelected = selectedIndex === idx;

          return (
            <G
              key={`col-${idx}`}
              onPress={() => setSelectedIndex(isSelected ? null : idx)}
            >
              {/* Column Selection Highlight Background */}
              {isSelected && (
                <Rect
                  x={colX}
                  y={padTop}
                  width={colWidth}
                  height={chartH}
                  fill="url(#highlightGrad)"
                  rx={4}
                />
              )}

              {/* Credit Bar (Inflow - Green) */}
              {item.credit > 0 && (
                <Rect
                  x={creditX}
                  y={creditY}
                  width={barW}
                  height={creditH}
                  fill="url(#creditGrad)"
                  rx={2}
                />
              )}

              {/* Debit Bar (Outflow - Red) */}
              {item.debit > 0 && (
                <Rect
                  x={debitX}
                  y={debitY}
                  width={barW}
                  height={debitH}
                  fill="url(#debitGrad)"
                  rx={2}
                />
              )}

              {/* Column touch target (full height for easy tapping on mobile) */}
              <Rect
                x={colX}
                y={padTop}
                width={colWidth}
                height={chartH + padBottom}
                fill="transparent"
              />

              {/* X-Axis Label */}
              <SvgText
                x={colX + colWidth / 2}
                y={svgHeight - 8}
                fill={isSelected ? '#38BDF8' : '#94A3B8'}
                fontSize={9}
                fontWeight={isSelected ? '700' : '400'}
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Graph Legend & Status */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Inflow (Credit)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Outflow (Debit)</Text>
        </View>
        <Text style={styles.hintText}>Tap any bar for details</Text>
      </View>

      {!hasActivity && (
        <View style={styles.emptyNotice}>
          <Text style={styles.emptyNoticeText}>
            No debit or credit transactions recorded for {periodLabel}.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  svg: {
    overflow: 'visible',
  },
  tooltipCard: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tooltipPeriod: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  tooltipValuesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tooltipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  tooltipVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  hintText: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
  emptyNotice: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  emptyNoticeText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
