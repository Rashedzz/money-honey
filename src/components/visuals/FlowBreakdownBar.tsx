import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export interface FlowItem {
  id: string;
  name: string;
  sub: string;
  amount: number;
  color: string;
  icon?: string;
}

interface FlowBreakdownBarProps {
  items: FlowItem[];
  total: number;
  title: string;
  totalFormatted: string;
}

export const FlowBreakdownBar: React.FC<FlowBreakdownBarProps> = ({
  items,
  total,
  title,
  totalFormatted,
}) => {
  const safeTotal = total || 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.total}>{totalFormatted}</Text>
      </View>

      {/* Segmented Flow Bar */}
      <View style={styles.flowBar}>
        {items.map((item) => {
          const pct = (item.amount / safeTotal) * 100;
          if (pct <= 0) return null;
          return (
            <View
              key={item.id}
              style={[
                styles.segment,
                { width: `${pct}%`, backgroundColor: item.color },
              ]}
            />
          );
        })}
      </View>

      {/* Grid of detailed items */}
      {items.length === 0 ? (
        <Text style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic', paddingVertical: 12 }}>
          No records recorded yet. Click "+ New Data Entry" to add.
        </Text>
      ) : (
        <View style={styles.itemsGrid}>
          {items.map((item) => {
            const pct = Math.round((item.amount / safeTotal) * 100);
            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <View style={[styles.itemDot, { backgroundColor: item.color }]} />
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSub}>{item.sub}</Text>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemAmount}>৳ {item.amount.toLocaleString('en-IN')}</Text>
                  <View style={[styles.pctBadge, { backgroundColor: `${item.color}20` }]}>
                    <Text style={[styles.pctText, { color: item.color }]}>{pct}%</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: 10,
  },
  total: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  flowBar: {
    height: 12,
    flexDirection: 'row',
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: Spacing.md,
    gap: 2,
  },
  segment: {
    height: '100%',
    borderRadius: Radius.full,
  },
  itemsGrid: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pctBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    minWidth: 34,
    alignItems: 'center',
  },
  pctText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
