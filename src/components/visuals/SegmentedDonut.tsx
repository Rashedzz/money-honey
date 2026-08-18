import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export interface DonutSegment {
  id: string;
  label: string;
  amount: number;
  color: string;
  icon?: string;
}

interface SegmentedDonutProps {
  segments: DonutSegment[];
  totalLabel: string;
  totalFormatted: string;
  size?: number;
}

export const SegmentedDonut: React.FC<SegmentedDonutProps> = ({
  segments,
  totalLabel,
  totalFormatted,
  size = 170,
}) => {
  const total = segments.reduce((sum, s) => sum + s.amount, 0) || 1;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {segments.map((seg) => {
              const pct = seg.amount / total;
              const strokeDasharray = `${pct * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeAngle * circumference;
              cumulativeAngle += pct;

              return (
                <Circle
                  key={seg.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.centerTextContainer}>
          <Text style={styles.centerLabel}>{totalLabel}</Text>
          <Text style={styles.centerAmount} numberOfLines={1}>
            {totalFormatted}
          </Text>
        </View>
      </View>

      {/* Breakdown Legend with % badges */}
      <View style={styles.legendContainer}>
        {segments.map((seg) => {
          const pct = Math.round((seg.amount / total) * 100);
          return (
            <View key={seg.id} style={styles.legendRow}>
              <View style={styles.legendLeft}>
                <View style={[styles.colorDot, { backgroundColor: seg.color }]} />
                <Text style={styles.legendLabel}>{seg.label}</Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={styles.legendAmount}>৳ {seg.amount.toLocaleString('en-IN')}</Text>
                <View style={[styles.pctBadge, { backgroundColor: `${seg.color}22` }]}>
                  <Text style={[styles.pctText, { color: seg.color }]}>{pct}%</Text>
                </View>
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
    paddingVertical: Spacing.xs,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  centerAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  legendContainer: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendAmount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  pctBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    minWidth: 36,
    alignItems: 'center',
  },
  pctText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
