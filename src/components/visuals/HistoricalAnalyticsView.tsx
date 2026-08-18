import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';

export type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';
export type MetricParameter = 'net_worth' | 'cash_debt' | 'income_expense' | 'asset_growth';

interface MonthlyHistoryPoint {
  month: string; // e.g. "Mar 26", "Apr 26"
  netStatus: number;
  cash: number;
  loans: number;
  income: number;
  expense: number;
  assets: number;
}

const HISTORICAL_DATA: MonthlyHistoryPoint[] = [
  { month: 'Mar 26', netStatus: -4800000, cash: 900000, loans: 5700000, income: 155000, expense: 110000, assets: 48000000 },
  { month: 'Apr 26', netStatus: -4650000, cash: 950000, loans: 5600000, income: 160000, expense: 105000, assets: 49000000 },
  { month: 'May 26', netStatus: -4400000, cash: 1050000, loans: 5450000, income: 172000, expense: 98000, assets: 50500000 },
  { month: 'Jun 26', netStatus: -4200000, cash: 1120000, loans: 5320000, income: 180000, expense: 102000, assets: 51200000 },
  { month: 'Jul 26', netStatus: -4000000, cash: 1180000, loans: 5180000, income: 188000, expense: 99000, assets: 52000000 },
  { month: 'Aug 26', netStatus: -3840000, cash: 1200000, loans: 5040000, income: 238500, expense: 102500, assets: 53075000 },
];

export const HistoricalAnalyticsView: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('6M');
  const [selectedParam, setSelectedParam] = useState<MetricParameter>('net_worth');

  const getFilteredData = () => {
    switch (selectedRange) {
      case '1M': return HISTORICAL_DATA.slice(-1);
      case '3M': return HISTORICAL_DATA.slice(-3);
      case '6M': return HISTORICAL_DATA.slice(-6);
      case '1Y':
      case 'ALL': return HISTORICAL_DATA;
    }
  };

  const filtered = getFilteredData();
  const latest = filtered[filtered.length - 1];
  const earliest = filtered[0];

  const getParamTitle = () => {
    switch (selectedParam) {
      case 'net_worth': return 'NET FINANCIAL STATUS (CASH − LOANS)';
      case 'cash_debt': return 'CASH RESERVES VS DEBT REDUCTION';
      case 'income_expense': return 'MONTHLY CASH FLOW: INCOME VS EXPENSES';
      case 'asset_growth': return 'TOTAL ASSET VALUATION TRAJECTORY';
    }
  };

  const netStatusDelta = latest.netStatus - earliest.netStatus;
  const isNetImproving = netStatusDelta >= 0;

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card} padding={18} glowColor={Colors.primary}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="analytics-outline" size={20} color={Colors.primary} />
            <Text style={styles.title}>HISTORICAL FINANCIAL INTELLIGENCE</Text>
          </View>
        </View>

        {/* Time Range Selector Bar */}
        <View style={styles.filterRow}>
          {[
            { id: '1M', label: '1 Month' },
            { id: '3M', label: '3 Months' },
            { id: '6M', label: '6 Months' },
            { id: '1Y', label: '1 Year' },
            { id: 'ALL', label: 'All Time' },
          ].map((r) => (
            <TouchableOpacity
              key={r.id}
              onPress={() => setSelectedRange(r.id as any)}
              style={[
                styles.rangeBtn,
                selectedRange === r.id && styles.rangeBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.rangeBtnText,
                  selectedRange === r.id && styles.rangeBtnTextActive,
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Parameter Mode Toggle Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paramScroll}>
          {[
            { id: 'net_worth', label: '⚡ Net Health' },
            { id: 'cash_debt', label: '💵 Cash vs Debt' },
            { id: 'income_expense', label: '📈 Income vs Expense' },
            { id: 'asset_growth', label: '🏰 Asset Valuation' },
          ].map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setSelectedParam(p.id as any)}
              style={[
                styles.paramBtn,
                selectedParam === p.id && styles.paramBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.paramBtnText,
                  selectedParam === p.id && styles.paramBtnTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.chartTitle}>{getParamTitle()}</Text>

        {/* Multi-Month Historical Visual Bars */}
        <View style={styles.historyChart}>
          {filtered.map((item, idx) => {
            const isLast = idx === filtered.length - 1;

            return (
              <View key={item.month} style={styles.historyCol}>
                <View style={styles.barStack}>
                  {selectedParam === 'net_worth' && (
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.min(100, Math.abs(item.netStatus) / 50000)}%`,
                          backgroundColor: item.netStatus >= 0 ? Colors.primary : Colors.danger,
                        },
                      ]}
                    />
                  )}
                  {selectedParam === 'cash_debt' && (
                    <>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${(item.cash / 2000000) * 100}%`,
                            backgroundColor: Colors.primary,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${(item.loans / 6000000) * 100}%`,
                            backgroundColor: Colors.danger,
                            marginTop: 2,
                          },
                        ]}
                      />
                    </>
                  )}
                  {selectedParam === 'income_expense' && (
                    <>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${(item.income / 250000) * 100}%`,
                            backgroundColor: Colors.primary,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${(item.expense / 250000) * 100}%`,
                            backgroundColor: Colors.danger,
                            marginTop: 2,
                          },
                        ]}
                      />
                    </>
                  )}
                  {selectedParam === 'asset_growth' && (
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${(item.assets / 60000000) * 100}%`,
                          backgroundColor: Colors.secondary,
                        },
                      ]}
                    />
                  )}
                </View>
                <Text style={[styles.monthLabel, isLast && { color: Colors.primary, fontWeight: '800' }]}>
                  {item.month}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Historical Summary Banner */}
        <View style={styles.historyFooter}>
          <View>
            <Text style={styles.footerLabel}>PERIOD PERFORMANCE TREND</Text>
            <Text style={styles.footerVal}>
              Debt reduced by ৳ {(earliest.loans - latest.loans).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.trendBadge, { backgroundColor: isNetImproving ? 'rgba(0,229,179,0.15)' : 'rgba(255,71,87,0.15)' }]}>
            <Ionicons
              name={isNetImproving ? 'trending-up' : 'trending-down'}
              size={14}
              color={isNetImproving ? Colors.primary : Colors.danger}
            />
            <Text style={[styles.trendText, { color: isNetImproving ? Colors.primary : Colors.danger }]}>
              +{Math.abs(netStatusDelta / 100000).toFixed(1)}L Recovery
            </Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  card: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  rangeBtnActive: {
    backgroundColor: 'rgba(0, 229, 179, 0.2)',
  },
  rangeBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  rangeBtnTextActive: {
    color: Colors.primary,
  },
  paramScroll: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  paramBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginRight: 6,
  },
  paramBtnActive: {
    backgroundColor: 'rgba(0, 229, 179, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  paramBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  paramBtnTextActive: {
    color: Colors.primary,
  },
  chartTitle: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  historyChart: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: Spacing.md,
  },
  historyCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barStack: {
    width: 14,
    height: 90,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 6,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    ...Typography.label,
    fontSize: 8,
    color: Colors.textMuted,
  },
  footerVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
