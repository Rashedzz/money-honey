import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '../../src/theme';
import { GlassCard } from '../../src/components/shared/GlassCard';
import { RadialGauge } from '../../src/components/visuals/RadialGauge';
import { SegmentedDonut } from '../../src/components/visuals/SegmentedDonut';
import { FlowBreakdownBar } from '../../src/components/visuals/FlowBreakdownBar';
import { HealthStatusMeter } from '../../src/components/visuals/HealthStatusMeter';
import { ProjectionComparisonCard } from '../../src/components/visuals/ProjectionComparisonCard';
import { ScheduleTimeline, ScheduleEvent } from '../../src/components/visuals/ScheduleTimeline';
import { CountdownCard } from '../../src/components/dashboard/CountdownCard';
import { EMIReminderCard } from '../../src/components/dashboard/EMIReminderCard';

// ----------------------------------------------------
// Master Financial Dataset
// ----------------------------------------------------
const cashBreakdown = [
  { id: '1', label: 'City Bank Savings', amount: 650000, color: '#00E5B3' },
  { id: '2', label: 'BRAC Bank Salary A/C', amount: 450000, color: '#00B4D8' },
  { id: '3', label: 'Cash in Hand (Physical)', amount: 65000, color: '#FFB547' },
  { id: '4', label: 'bKash Wallet (MFS)', amount: 35000, color: '#FF4757' },
];

const totalCashInHand = cashBreakdown.reduce((sum, item) => sum + item.amount, 0);

const loanBreakdown = [
  { id: '1', name: 'Apartment Home Loan', sub: 'City Bank Ltd. (226 mos left)', amount: 4250000, color: '#FF4757' },
  { id: '2', name: 'Vehicle Auto Loan', sub: 'Eastern Bank Ltd. (24 mos left)', amount: 540000, color: '#FF6B35' },
  { id: '3', name: 'Personal Loan (Outside Bank)', sub: 'Private Family / Direct Loan', amount: 250000, color: '#FFB547' },
];

const totalLoans = loanBreakdown.reduce((sum, item) => sum + item.amount, 0);

const currentIncomeItems = [
  { id: '1', name: 'Monthly Salary', sub: 'Primary Tech Employment', amount: 135000, color: '#00E5B3' },
  { id: '2', name: 'Sanchaypatra Coupon', sub: 'National Savings 3-Mo Profit', amount: 21500, color: '#7B6EF6' },
  { id: '3', name: 'FDR Monthly Return', sub: 'DBBL Fixed Deposit Credit', amount: 18500, color: '#00B4D8' },
  { id: '4', name: 'Freelance & Advisory', sub: 'Side Consulting Income', amount: 10000, color: '#FFB547' },
];

const totalCurrentIncome = currentIncomeItems.reduce((sum, item) => sum + item.amount, 0);

const currentExpenseItems = [
  { id: '1', name: 'City Bank Home Loan EMI', sub: 'Debt Service • Bank Loan', amount: 45000, color: '#FF4757' },
  { id: '2', name: 'Household & Groceries', sub: 'Family Living & Supplies', amount: 28000, color: '#FFB547' },
  { id: '3', name: 'EBL Vehicle Auto Loan EMI', sub: 'Debt Service • Asset EMI', amount: 22500, color: '#FF6B35' },
  { id: '4', name: 'Utilities & Subscriptions', sub: 'Electricity, Gas, Internet', amount: 7000, color: '#00B4D8' },
];

const totalCurrentExpense = currentExpenseItems.reduce((sum, item) => sum + item.amount, 0);

const upcomingSchedules: ScheduleEvent[] = [
  {
    id: '1',
    title: 'City Bank Home Loan EMI',
    subtitle: 'Auto-Debit from BRAC Salary A/C #4921',
    date: '25 Aug 2026',
    daysRemaining: 7,
    amount: 45000,
    type: 'emi',
    status: 'warning',
    isAutoDebit: true,
  },
  {
    id: '2',
    title: '3-Month Sanchaypatra Profit Coupon',
    subtitle: 'Direct Credit to City Bank A/C #8832',
    date: '24 Aug 2026',
    daysRemaining: 6,
    amount: 28500,
    type: 'sanchaypatra_coupon',
    status: 'critical',
  },
  {
    id: '3',
    title: 'DBBL FDR Monthly Interest Payout',
    subtitle: 'Auto-disbursement #14 of 36',
    date: '06 Sep 2026',
    daysRemaining: 19,
    amount: 18500,
    type: 'fdr_payout',
    status: 'warning',
  },
  {
    id: '4',
    title: 'EBL Vehicle Auto Loan EMI',
    subtitle: 'Scheduled Auto-Debit #37 of 60',
    date: '05 Sep 2026',
    daysRemaining: 18,
    amount: 22500,
    type: 'emi',
    status: 'safe',
    isAutoDebit: true,
  },
];

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdowns' | 'forecast' | 'schedules'>('overview');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#080B14" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.date}>{format(new Date(), 'EEEE, d MMMM yyyy')}</Text>
          </View>
          <View style={styles.headerIcons}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications-outline" size={20} color="#FFF" />
              <View style={styles.notifDot} />
            </View>
          </View>
        </View>

        {/* Section Navigation Filter Pill Bar */}
        <View style={styles.navBar}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'breakdowns', label: 'Cash & Debt' },
            { id: 'forecast', label: 'Income & Budget' },
            { id: 'schedules', label: 'Schedules' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              style={[
                styles.navBtn,
                activeTab === tab.id && styles.navBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.navBtnText,
                  activeTab === tab.id && styles.navBtnTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ================================================================= */}
        {/* REQUIREMENT #3: Current Financial Status (Cash in Hand - Loan)   */}
        {/* ================================================================= */}
        <HealthStatusMeter
          totalCashInHand={totalCashInHand}
          totalLoans={totalLoans}
        />

        {/* ================================================================= */}
        {/* TAB 1: OVERVIEW — High-Level Meters & Quick Visuals               */}
        {/* ================================================================= */}
        {(activeTab === 'overview' || activeTab === 'breakdowns') && (
          <>
            {/* Quick 2-Column Gauge Row */}
            <View style={styles.twoColRow}>
              {/* Cash in Hand Radial Donut */}
              <GlassCard style={styles.halfCard} padding={16} glowColor={Colors.primary}>
                <Text style={styles.cardHeaderTitle}>1. CASH IN HAND</Text>
                <SegmentedDonut
                  segments={cashBreakdown}
                  totalLabel="Total Liquid"
                  totalFormatted={`৳ ${(totalCashInHand / 100000).toFixed(1)}L`}
                  size={150}
                />
              </GlassCard>

              {/* Debt Distribution Radial Gauge */}
              <GlassCard style={styles.halfCard} padding={16} glowColor={Colors.danger}>
                <Text style={[styles.cardHeaderTitle, { color: Colors.danger }]}>2. OUTSTANDING LOANS</Text>
                <RadialGauge
                  score={84} // 84% bank loans
                  title={`৳ ${(totalLoans / 100000).toFixed(1)} Lakhs`}
                  subtitle="84% Bank • 5% Private"
                  statusLabel="High Debt"
                  statusColor={Colors.danger}
                  size={150}
                />
              </GlassCard>
            </View>

            {/* Detailed Loan Bank-Wise & Outside-Bank Breakdown */}
            <GlassCard style={styles.fullCard} padding={16}>
              <FlowBreakdownBar
                items={loanBreakdown}
                total={totalLoans}
                title="LOAN BREAKDOWN (BANK-WISE & OUTSIDE OF BANK)"
                totalFormatted={`৳ ${totalLoans.toLocaleString('en-IN')}`}
              />
            </GlassCard>
          </>
        )}

        {/* ================================================================= */}
        {/* TAB 2: INCOME & EXPENSES CURRENT MONTH WITH PERCENTAGES (%)      */}
        {/* ================================================================= */}
        {(activeTab === 'overview' || activeTab === 'forecast') && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>4. CURRENT MONTH INCOME (SOURCES & %)</Text>
            </View>

            <GlassCard style={styles.fullCard} padding={16} glowColor={Colors.primary}>
              <FlowBreakdownBar
                items={currentIncomeItems}
                total={totalCurrentIncome}
                title="INCOME SOURCES WITH ALLOCATION %"
                totalFormatted={`৳ ${totalCurrentIncome.toLocaleString('en-IN')}`}
              />
            </GlassCard>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: Colors.danger }]}>
                5. CURRENT MONTH EXPENSES (SECTOR-WISE BREAKDOWN & %)
              </Text>
            </View>

            <GlassCard style={styles.fullCard} padding={16} glowColor={Colors.danger}>
              <FlowBreakdownBar
                items={currentExpenseItems}
                total={totalCurrentExpense}
                title="SECTOR-WISE EXPENSE DISTRIBUTION"
                totalFormatted={`৳ ${totalCurrentExpense.toLocaleString('en-IN')}`}
              />
            </GlassCard>

            {/* ============================================================= */}
            {/* REQUIREMENTS #6 & #7: Projected Income & Expenses Next Month  */}
            {/* ============================================================= */}
            <ProjectionComparisonCard
              currentMonthName="August"
              nextMonthName="September 2026"
              currentIncome={totalCurrentIncome}
              projectedIncomeNextMonth={192000}
              currentExpense={totalCurrentExpense}
              projectedExpenseNextMonth={104000}
              projectedIncomeBreakdown={[
                { name: 'Salary', amount: 135000, color: '#00E5B3' },
                { name: 'Sanchaypatra (Q)', amount: 28500, color: '#7B6EF6' },
                { name: 'FDR Returns', amount: 18500, color: '#00B4D8' },
                { name: 'Other Receivables', amount: 10000, color: '#FFB547' },
              ]}
              projectedExpenseBreakdown={[
                { name: 'Fixed EMIs (Home + Auto)', amount: 67500, color: '#FF4757' },
                { name: 'House Rent & Living', amount: 28000, color: '#FFB547' },
                { name: 'Scheduled Utilities & Bills', amount: 8500, color: '#00B4D8' },
              ]}
            />
          </>
        )}

        {/* ================================================================= */}
        {/* REQUIREMENTS #8 & #9: Schedules, Reminders & 3-Week Alerts       */}
        {/* ================================================================= */}
        {(activeTab === 'overview' || activeTab === 'schedules') && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>8. SCHEDULES & UPCOMING CASH MOVEMENTS</Text>
              <Text style={styles.seeAll}>Full Calendar →</Text>
            </View>

            <ScheduleTimeline events={upcomingSchedules} />

            <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
              <Text style={[styles.sectionTitle, { color: Colors.accent }]}>
                9. 3-WEEK MATURITY COUNTDOWN REMINDERS
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              <CountdownCard
                title="3-Month Sanchaypatra Coupon"
                subtitle="Certificate #SC-99201 • 11.04%"
                daysRemaining={6}
                targetDate={new Date(2026, 7, 24)}
                amount={28500}
                amountLabel="Net Coupon Payout"
                type="sanchaypatra"
                urgencyLevel="critical"
                percentageElapsed={98}
              />
              <CountdownCard
                title="Dutch-Bangla Bank FDR Maturity"
                subtitle="FDR #8839201 • 3 Years @ 9.5%"
                daysRemaining={19}
                targetDate={new Date(2026, 8, 6)}
                amount={1500000}
                amountLabel="Maturity Value"
                type="fdr"
                urgencyLevel="warning"
                percentageElapsed={92}
              />
              <CountdownCard
                title="City Bank Home Loan EMI"
                subtitle="EMI #14 of 240 • Next Due"
                daysRemaining={7}
                targetDate={new Date(2026, 7, 25)}
                amount={45000}
                amountLabel="Exact EMI Due"
                type="emi"
                urgencyLevel="warning"
                percentageElapsed={80}
              />
            </ScrollView>

            <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
              <Text style={[styles.sectionTitle, { color: Colors.danger }]}>
                PENDING EMI ACTION REMINDERS
              </Text>
            </View>

            <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.sm }}>
              <EMIReminderCard
                loanTitle="Apartment Home Loan"
                bankName="City Bank Ltd."
                emiAmount={45000}
                dueDate={new Date(2026, 7, 25)}
                paymentNumber={14}
                totalPayments={240}
                outstandingPrincipal={4250000}
              />
              <EMIReminderCard
                loanTitle="Vehicle Auto Loan"
                bankName="Eastern Bank Ltd."
                emiAmount={22500}
                dueDate={new Date(2026, 8, 5)}
                paymentNumber={36}
                totalPayments={60}
                outstandingPrincipal={540000}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080B14',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  greeting: {
    ...Typography.displayM,
    color: Colors.textPrimary,
  },
  date: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  navBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
    marginBottom: Spacing.xs,
  },
  navBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  navBtnActive: {
    backgroundColor: 'rgba(0, 229, 179, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 179, 0.4)',
  },
  navBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  navBtnTextActive: {
    color: Colors.primary,
  },
  twoColRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  halfCard: {
    flex: 1,
  },
  fullCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeaderTitle: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.label,
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '800',
  },
  seeAll: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  hScroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
});
