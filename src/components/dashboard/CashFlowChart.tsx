import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryBar, VictoryGroup, VictoryAxis, VictoryChart, VictoryTheme } from 'victory-native';
import { GlassCard } from '../shared/GlassCard';
import { Colors, Typography, Spacing, Radius } from '../../theme';

interface CashFlowData {
  month: string;
  income: number;
  expense: number;
  emi: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
  currentMonth: string;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ data, currentMonth }) => {
  const hasData = data && data.length > 0;

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `৳${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `৳${(val / 1000).toFixed(0)}k`;
    return `৳${val}`;
  };

  return (
    <GlassCard style={styles.card} padding={Spacing.md}>
      <View style={styles.header}>
        <Text style={styles.title}>CASH FLOW</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{currentMonth}</Text>
        </View>
      </View>

      {!hasData ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Add transactions to see your cash flow</Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <VictoryChart
            height={220}
            padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
          >
            <VictoryAxis
              style={{
                axis: { stroke: Colors.border },
                tickLabels: { fill: Colors.textMuted, fontSize: 10, padding: 5 },
              }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={formatCurrency}
              style={{
                axis: { stroke: 'transparent' },
                grid: { stroke: 'rgba(255,255,255,0.05)' },
                tickLabels: { fill: Colors.textMuted, fontSize: 10, padding: 5 },
              }}
            />
            <VictoryGroup offset={10}>
              <VictoryBar
                data={data.map((d) => ({ x: d.month, y: d.income }))}
                style={{ data: { fill: Colors.primary } }}
                cornerRadius={4}
                barWidth={8}
              />
              <VictoryBar
                data={data.map((d) => ({ x: d.month, y: d.expense }))}
                style={{ data: { fill: Colors.danger } }}
                cornerRadius={4}
                barWidth={8}
              />
              <VictoryBar
                data={data.map((d) => ({ x: d.month, y: d.emi }))}
                style={{ data: { fill: Colors.accent } }}
                cornerRadius={4}
                barWidth={8}
              />
            </VictoryGroup>
          </VictoryChart>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
              <Text style={styles.legendText}>Expense</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
              <Text style={styles.legendText}>EMI</Text>
            </View>
          </View>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.label,
    color: Colors.primary,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  emptyState: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  chartContainer: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: -10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
});
