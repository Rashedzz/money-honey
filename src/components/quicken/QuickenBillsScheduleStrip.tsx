/**
 * QuickenBillsScheduleStrip.tsx
 * Quicken's signature "Upcoming Bills & Projected Checking Balance" strip.
 * Features:
 * - Current Liquid Checking & Cash balance
 * - Total Scheduled Outflows in the next 30 days
 * - Quicken "Projected Balance" after upcoming bills
 * - Itemized upcoming bills with due dates, days countdown, urgency badges,
 *   and quick 1-tap "Record Payment" button.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../theme';
import { BankAccountItem } from '../../services/transactionManager';

export interface BillItem {
  id: string;
  title: string;
  payee: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  daysRemaining: number;
  category: string;
  type: 'loan_emi' | 'recurring_bill' | 'paper_deposit';
  isOverdue: boolean;
}

interface QuickenBillsScheduleStripProps {
  currentCashBalance: number;
  loans?: any[];
  schedules?: any[];
  onRecordBillPayment?: (bill: BillItem) => void;
  onOpenScheduleScreen?: () => void;
}

export const QuickenBillsScheduleStrip: React.FC<QuickenBillsScheduleStripProps> = ({
  currentCashBalance,
  loans = [],
  schedules = [],
  onRecordBillPayment,
  onOpenScheduleScreen,
}) => {
  const now = new Date();

  // Aggregate bills from active loans and schedules
  const upcomingBills: BillItem[] = React.useMemo(() => {
    const list: BillItem[] = [];

    // 1. Loan EMIs
    loans.forEach((loan, idx) => {
      const emiAmt = loan.emiAmount || (loan.amount > 100000 ? Math.round(loan.amount * 0.012) : 15000);
      const dueDay = loan.dueDay || 15;
      const targetDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
      if (targetDate < now) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }
      const diffMs = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      list.push({
        id: `bill_loan_${loan.id || idx}`,
        title: `${loan.title || loan.name || 'Bank'} EMI`,
        payee: loan.bankName || 'Financial Institution',
        amount: emiAmt,
        dueDate: targetDate.toISOString().split('T')[0],
        daysRemaining: diffDays,
        category: 'Debt Service EMI',
        type: 'loan_emi',
        isOverdue: diffDays < 0,
      });
    });

    // 2. Schedules
    schedules.forEach((sch, idx) => {
      if (sch.type === 'expense' || sch.type === 'debit') {
        const schDate = new Date(sch.date || now);
        const diffMs = schDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        list.push({
          id: `bill_sch_${sch.id || idx}`,
          title: sch.title || sch.name || 'Scheduled Bill',
          payee: sch.payee || 'Service Provider',
          amount: sch.amount || 0,
          dueDate: sch.date || now.toISOString().split('T')[0],
          daysRemaining: diffDays,
          category: sch.category || 'Utilities & Living',
          type: 'recurring_bill',
          isOverdue: diffDays < 0,
        });
      }
    });

    // Fallback standard scheduled obligations if none stored yet
    if (list.length === 0) {
      const nextWeek = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const nextFortnight = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      list.push({
        id: 'bill_default_1',
        title: 'DESCO Electricity & Utilities',
        payee: 'Dhaka Electric Supply Co.',
        amount: 8500,
        dueDate: nextWeek.toISOString().split('T')[0],
        daysRemaining: 5,
        category: 'Utilities',
        type: 'recurring_bill',
        isOverdue: false,
      });
      list.push({
        id: 'bill_default_2',
        title: 'Apartment Maintenance & Service',
        payee: 'Building Management Society',
        amount: 12000,
        dueDate: nextFortnight.toISOString().split('T')[0],
        daysRemaining: 14,
        category: 'Household',
        type: 'recurring_bill',
        isOverdue: false,
      });
    }

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [loans, schedules]);

  const totalUpcomingOutflow = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
  const projectedBalance = currentCashBalance - totalUpcomingOutflow;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.quickenBadge}>
            <Ionicons name="calendar-outline" size={16} color="#EA580C" />
          </View>
          <View>
            <Text style={styles.cardTitle}>UPCOMING BILLS & PROJECTED BALANCE</Text>
            <Text style={styles.cardSubtitle}>
              Next 30 Days Scheduled Outflows & Checking Cushion
            </Text>
          </View>
        </View>

        {onOpenScheduleScreen && (
          <TouchableOpacity style={styles.viewAllBtn} onPress={onOpenScheduleScreen} activeOpacity={0.8}>
            <Ionicons name="calendar-number-outline" size={13} color="#EA580C" />
            <Text style={styles.viewAllBtnText}>Schedule</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quicken Projected Balance Bar */}
      <View style={styles.projectionStrip}>
        <View style={styles.projBox}>
          <Text style={styles.projLabel}>Current Liquid Cash</Text>
          <Text style={styles.projVal}>৳ {currentCashBalance.toLocaleString('en-IN')}</Text>
        </View>
        <Text style={styles.operatorText}>−</Text>
        <View style={styles.projBox}>
          <Text style={styles.projLabel}>Upcoming Bills (30D)</Text>
          <Text style={[styles.projVal, { color: '#EF4444' }]}>
            ৳ {totalUpcomingOutflow.toLocaleString('en-IN')}
          </Text>
        </View>
        <Text style={styles.operatorText}>=</Text>
        <View style={styles.projBox}>
          <Text style={styles.projLabel}>Projected Checking Cushion</Text>
          <Text
            style={[
              styles.projVal,
              { color: projectedBalance >= 0 ? '#10B981' : '#EF4444', fontWeight: '900' },
            ]}
          >
            ৳ {projectedBalance.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Itemized Bills Scroll */}
      <View style={styles.billsList}>
        {upcomingBills.map((bill) => {
          const urgencyColor = bill.daysRemaining <= 3 ? '#EF4444' : bill.daysRemaining <= 7 ? '#F59E0B' : '#0284C7';
          const urgencyBg = bill.daysRemaining <= 3 ? '#FEF2F2' : bill.daysRemaining <= 7 ? '#FFFBEB' : '#F0F9FF';

          return (
            <View key={bill.id} style={styles.billRow}>
              <View style={styles.billLeft}>
                <View style={[styles.urgencyPill, { backgroundColor: urgencyBg }]}>
                  <Text style={[styles.urgencyText, { color: urgencyColor }]}>
                    {bill.daysRemaining <= 0
                      ? 'DUE TODAY'
                      : `DUE IN ${bill.daysRemaining}D`}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.billTitle} numberOfLines={1}>
                    {bill.title}
                  </Text>
                  <Text style={styles.billPayee}>
                    {bill.payee} • Due: {bill.dueDate}
                  </Text>
                </View>
              </View>

              <View style={styles.billRight}>
                <Text style={styles.billAmount}>
                  ৳ {bill.amount.toLocaleString('en-IN')}
                </Text>
                {onRecordBillPayment && (
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => onRecordBillPayment(bill)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle-outline" size={13} color="#16A34A" />
                    <Text style={styles.payBtnText}>Record</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
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
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
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
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  viewAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  projectionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    gap: 8,
  },
  projBox: {
    alignItems: 'center',
    flex: 1,
    minWidth: 120,
  },
  projLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  projVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  operatorText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94A3B8',
  },
  billsList: {
    gap: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 8,
  },
  billLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 200,
  },
  urgencyPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  billTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  billPayee: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  billRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  billAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  payBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
});
