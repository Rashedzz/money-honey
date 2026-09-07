/**
 * QuickenSpendingWheel.tsx
 * Quicken's signature Spending Wheel / Category Donut Breakdown Chart.
 * Visualizes the current month's expenses by category with an interactive SVG donut,
 * percentage breakdown pills, and itemized spend ranks.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../theme';
import { CategoryManager } from '../../services/categoryManager';

export interface CategorySpendItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  budget: number;
}

interface QuickenSpendingWheelProps {
  expenses: any[];
  onOpenCategorySetup?: () => void;
  onFilterByCategory?: (categoryName: string) => void;
  size?: number;
}

export const QuickenSpendingWheel: React.FC<QuickenSpendingWheelProps> = ({
  expenses,
  onOpenCategorySetup,
  onFilterByCategory,
  size = 200,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Group expenses by category
  const categories = CategoryManager.getExpenseCategories();
  const categoryMap = new Map<string, { amount: number; count: number }>();

  let totalSpent = 0;
  expenses.forEach((exp) => {
    const catName = exp.category || 'Other / Miscellaneous';
    const current = categoryMap.get(catName) || { amount: 0, count: 0 };
    current.amount += Number(exp.amount) || 0;
    current.count += 1;
    categoryMap.set(catName, current);
    totalSpent += Number(exp.amount) || 0;
  });

  // Build items array with colors and icons from CategoryManager
  const spendItems: CategorySpendItem[] = Array.from(categoryMap.entries())
    .map(([name, data]) => {
      const match = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
      return {
        id: match ? match.id : `cat_${name}`,
        name,
        icon: match ? match.icon : '🏷️',
        color: match ? match.color : '#64748B',
        amount: data.amount,
        budget: match ? match.monthlyBudget : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // SVG Geometry
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeAngle = 0;

  const activeDisplayItem = selectedCategory
    ? spendItems.find((item) => item.name === selectedCategory)
    : null;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.quickenBadge}>
            <Ionicons name="pie-chart-outline" size={16} color="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.cardTitle}>SPENDING BY CATEGORY</Text>
            <Text style={styles.cardSubtitle}>
              {spendItems.length} Active Categories • Current Month Distribution
            </Text>
          </View>
        </View>

        {onOpenCategorySetup && (
          <TouchableOpacity style={styles.setupBtn} onPress={onOpenCategorySetup} activeOpacity={0.8}>
            <Ionicons name="pricetags-outline" size={13} color="#8B5CF6" />
            <Text style={styles.setupBtnText}>Categories</Text>
          </TouchableOpacity>
        )}
      </View>

      {totalSpent === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 36 }}>📊</Text>
          <Text style={styles.emptyTitle}>No Expenses Recorded Yet</Text>
          <Text style={styles.emptySubtitle}>
            Add transactions to see your Quicken category spending wheel in action.
          </Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          {/* Donut Chart with Center Display */}
          <View style={styles.chartWrapper}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                {spendItems.map((item) => {
                  const pct = totalSpent > 0 ? item.amount / totalSpent : 0;
                  const strokeDasharray = `${pct * circumference} ${circumference}`;
                  const strokeDashoffset = -cumulativeAngle * circumference;
                  cumulativeAngle += pct;
                  const isSelected = selectedCategory === item.name;

                  return (
                    <Circle
                      key={item.id}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={item.color}
                      strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      fill="none"
                      strokeLinecap="butt"
                      opacity={selectedCategory && !isSelected ? 0.35 : 1}
                    />
                  );
                })}
              </G>
            </Svg>

            {/* Central KPI */}
            <View style={styles.centerContainer}>
              <Text style={styles.centerLabel}>
                {activeDisplayItem ? activeDisplayItem.icon : 'TOTAL'}
              </Text>
              <Text style={styles.centerAmount} numberOfLines={1}>
                ৳ {(activeDisplayItem ? activeDisplayItem.amount : totalSpent).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.centerSub} numberOfLines={1}>
                {activeDisplayItem ? activeDisplayItem.name : 'Total Outflows'}
              </Text>
            </View>
          </View>

          {/* Itemized Categories List */}
          <View style={styles.listCol}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.colHeadingCategory}>Category</Text>
              <Text style={styles.colHeadingSpent}>Spent</Text>
              <Text style={styles.colHeadingPct}>Share</Text>
            </View>

            <ScrollView
              style={styles.categoryScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {spendItems.map((item) => {
                const pct = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0;
                const isSelected = selectedCategory === item.name;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.categoryRow, isSelected && styles.categoryRowSelected]}
                    onPress={() => {
                      if (selectedCategory === item.name) {
                        setSelectedCategory(null);
                      } else {
                        setSelectedCategory(item.name);
                        onFilterByCategory?.(item.name);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryLeft}>
                      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                      <Text style={styles.categoryIcon}>{item.icon}</Text>
                      <Text style={styles.categoryName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>

                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>
                        ৳ {item.amount.toLocaleString('en-IN')}
                      </Text>
                      <View style={[styles.pctPill, { backgroundColor: `${item.color}22` }]}>
                        <Text style={[styles.pctPillText, { color: item.color }]}>{pct}%</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}
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
    shadowRadius: 10,
    elevation: 2,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickenBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  setupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  setupBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  emptyState: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
    marginTop: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 20,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 'auto',
  },
  centerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  centerAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  centerSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  listCol: {
    flex: 1,
    minWidth: 260,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  colHeadingCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    flex: 1,
  },
  colHeadingSpent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    width: 90,
    textAlign: 'right',
  },
  colHeadingPct: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    width: 50,
    textAlign: 'right',
  },
  categoryScroll: {
    maxHeight: 220,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  categoryRowSelected: {
    backgroundColor: '#F0F9FF',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    width: 85,
    textAlign: 'right',
  },
  pctPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    width: 44,
    alignItems: 'center',
  },
  pctPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
