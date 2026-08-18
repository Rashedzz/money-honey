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

import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { GlassCard } from '../../src/components/shared/GlassCard';
import { RadialGauge } from '../../src/components/visuals/RadialGauge';
import { SegmentedDonut } from '../../src/components/visuals/SegmentedDonut';
import { FlowBreakdownBar } from '../../src/components/visuals/FlowBreakdownBar';
import { HealthStatusMeter } from '../../src/components/visuals/HealthStatusMeter';
import { ProjectionComparisonCard } from '../../src/components/visuals/ProjectionComparisonCard';
import { ScheduleTimeline, ScheduleEvent } from '../../src/components/visuals/ScheduleTimeline';
import { AssetEvaluationCard } from '../../src/components/visuals/AssetEvaluationCard';
import { AddAssetModal } from '../../src/components/modals/AddAssetModal';
import { CountdownCard } from '../../src/components/dashboard/CountdownCard';
import { EMIReminderCard } from '../../src/components/dashboard/EMIReminderCard';
import { AssetItem, evaluateAssets } from '../../src/finance/assetEvaluation';

// ----------------------------------------------------
// Master Financial Dataset
// ----------------------------------------------------
const initialAssets: AssetItem[] = [
  {
    id: 'AST-101',
    name: 'Gulshan 2BR Luxury Rental Flat',
    category: 'Real Estate',
    purchasePrice: 15000000,
    currentValuation: 18000000,
    quantity: 1450,
    uom: 'Sq. Ft',
    currentRatePerUoM: 12413,
    monthlyIncome: 65000,
    appreciationRateAnnualPct: 8.5,
    isIdle: false,
    acquiredDate: '2022-03-15',
  },
  {
    id: 'AST-102',
    name: 'Purbachal Sector 14 Land Plot',
    category: 'Real Estate',
    purchasePrice: 11000000,
    currentValuation: 17500000,
    quantity: 5,
    uom: 'Katha',
    currentRatePerUoM: 3500000,
    monthlyIncome: 0, // IDLE ASSET
    appreciationRateAnnualPct: 15.5,
    isIdle: true,
    acquiredDate: '2020-11-10',
  },
  {
    id: 'AST-103',
    name: '22K Physical Gold Bullion',
    category: 'Precious Metals',
    purchasePrice: 1200000,
    currentValuation: 1875000,
    quantity: 15,
    uom: 'Bhori',
    currentRatePerUoM: 125000,
    monthlyIncome: 0, // IDLE ASSET
    appreciationRateAnnualPct: 12.0,
    isIdle: true,
    acquiredDate: '2021-06-01',
  },
  {
    id: 'AST-104',
    name: 'Dhanmondi Commercial Shop Space',
    category: 'Commercial',
    purchasePrice: 8000000,
    currentValuation: 9500000,
    quantity: 450,
    uom: 'Sq. Ft',
    currentRatePerUoM: 21111,
    monthlyIncome: 38000,
    appreciationRateAnnualPct: 9.0,
    isIdle: false,
    acquiredDate: '2023-01-20',
  },
  {
    id: 'AST-105',
    name: 'Toyota Harrier Premium SUV',
    category: 'Vehicles',
    purchasePrice: 6800000,
    currentValuation: 6200000,
    monthlyIncome: 0, // IDLE ASSET
    appreciationRateAnnualPct: -6.0,
    isIdle: true,
    acquiredDate: '2022-08-10',
  },
];

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
    title: 'Gulshan 2BR Monthly Rent Collection',
    subtitle: 'Credit from Tenant (AST-101)',
    date: '01 Sep 2026',
    daysRemaining: 14,
    amount: 65000,
    type: 'salary',
    status: 'safe',
  },
  {
    id: '3',
    title: '3-Month Sanchaypatra Profit Coupon',
    subtitle: 'Direct Credit to City Bank A/C #8832',
    date: '24 Aug 2026',
    daysRemaining: 6,
    amount: 28500,
    type: 'sanchaypatra_coupon',
    status: 'critical',
  },
  {
    id: '4',
    title: 'DBBL FDR Monthly Interest Payout',
    subtitle: 'Auto-disbursement #14 of 36',
    date: '06 Sep 2026',
    daysRemaining: 19,
    amount: 18500,
    type: 'fdr_payout',
    status: 'warning',
  },
];

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'cash_debt' | 'income_expense' | 'schedules'>('overview');
  const [assets, setAssets] = useState<AssetItem[]>(initialAssets);
  const [modalVisible, setModalVisible] = useState(false);

  const assetSummary = evaluateAssets(assets);

  const handleAddAsset = (newAsset: AssetItem) => {
    setAssets((prev) => [newAsset, ...prev]);
  };

  // Dynamic Current Month Income (Including Asset Rental / Dividend Yields)
  const currentIncomeItems = [
    { id: '1', name: 'Monthly Employment Salary', sub: 'Primary Tech Work', amount: 135000, color: '#00E5B3' },
    {
      id: '2',
      name: 'Asset Cash Flow (Rent/Yield)',
      sub: `${assetSummary.incomeGeneratingCount} Active Assets (AST-101, AST-104)`,
      amount: assetSummary.totalMonthlyAssetIncome,
      color: '#7B6EF6',
    },
    { id: '3', name: '3-Mo Sanchaypatra Coupon', sub: 'National Savings', amount: 21500, color: '#00B4D8' },
    { id: '4', name: 'FDR Monthly Return', sub: 'DBBL Fixed Deposit', amount: 18500, color: '#FFB547' },
  ];

  const totalCurrentIncome = currentIncomeItems.reduce((sum, item) => sum + item.amount, 0);

  const currentExpenseItems = [
    { id: '1', name: 'City Bank Home Loan EMI', sub: 'Debt Service • Bank Loan', amount: 45000, color: '#FF4757' },
    { id: '2', name: 'Household & Groceries', sub: 'Family Living & Supplies', amount: 28000, color: '#FFB547' },
    { id: '3', name: 'EBL Vehicle Auto Loan EMI', sub: 'Debt Service • Asset EMI', amount: 22500, color: '#FF6B35' },
    { id: '4', name: 'Utilities & Subscriptions', sub: 'Electricity, Gas, Internet', amount: 7000, color: '#00B4D8' },
  ];

  const totalCurrentExpense = currentExpenseItems.reduce((sum, item) => sum + item.amount, 0);

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
          <TouchableOpacity style={styles.quickAddBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.quickAddText}>+ Add Asset</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navBar}>
          {[
            { id: 'overview', label: '👑 Master Overview' },
            { id: 'assets', label: '🏰 Asset Intelligence & Valuation' },
            { id: 'cash_debt', label: '💵 Cash & Loans' },
            { id: 'income_expense', label: '📊 Income & Expenses' },
            { id: 'schedules', label: '📅 Schedules & Reminders' },
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
        </ScrollView>

        {/* ================================================================= */}
        {/* REQUIREMENT #3: Current Financial Status (Cash in Hand - Loan)   */}
        {/* ================================================================= */}
        <HealthStatusMeter
          totalCashInHand={totalCashInHand}
          totalLoans={totalLoans}
        />

        {/* ================================================================= */}
        {/* SECTION: ASSET PORTFOLIO, IDLE ASSET AUDIT & ADVANCED EVALUATION  */}
        {/* ================================================================= */}
        {(activeTab === 'overview' || activeTab === 'assets') && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                ASSET VALUATION, INCOME AUDIT & IDLE ASSET INTELLIGENCE
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={styles.seeAll}>+ Add New →</Text>
              </TouchableOpacity>
            </View>

            <AssetEvaluationCard
              assets={assets}
              summary={assetSummary}
              onAddAssetPress={() => setModalVisible(true)}
            />
          </>
        )}

        {/* ================================================================= */}
        {/* SECTION: CASH IN HAND & LOAN BREAKDOWN (BANK & OUTSIDE BANK)     */}
        {/* ================================================================= */}
        {(activeTab === 'overview' || activeTab === 'cash_debt') && (
          <>
            <View style={styles.twoColRow}>
              {/* Cash in Hand Radial Donut */}
              <GlassCard style={styles.halfCard} padding={16} glowColor={Colors.primary}>
                <Text style={styles.cardHeaderTitle}>1. CASH IN HAND</Text>
                <SegmentedDonut
                  segments={cashBreakdown}
                  totalLabel="Total Liquid"
                  totalFormatted={`৳ ${(totalCashInHand / 100000).toFixed(1)}L`}
                  size={140}
                />
              </GlassCard>

              {/* Debt Distribution Radial Gauge */}
              <GlassCard style={styles.halfCard} padding={16} glowColor={Colors.danger}>
                <Text style={[styles.cardHeaderTitle, { color: Colors.danger }]}>2. LOAN LIABILITIES</Text>
                <RadialGauge
                  score={84}
                  title={`৳ ${(totalLoans / 100000).toFixed(1)} Lakhs`}
                  subtitle="84% Bank • 5% Private"
                  statusLabel="Debt Load"
                  statusColor={Colors.danger}
                  size={140}
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
        {/* SECTION: INCOME & EXPENSES CURRENT MONTH (SOURCES & SECTOR %)    */}
        {/* ================================================================= */}
        {(activeTab === 'overview' || activeTab === 'income_expense') && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>4. CURRENT MONTH INCOME (SOURCES & %)</Text>
            </View>

            <GlassCard style={styles.fullCard} padding={16} glowColor={Colors.primary}>
              <FlowBreakdownBar
                items={currentIncomeItems}
                total={totalCurrentIncome}
                title="INCOME SOURCES WITH ASSET YIELD & ALLOCATION %"
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
              projectedIncomeNextMonth={totalCurrentIncome + 7000}
              currentExpense={totalCurrentExpense}
              projectedExpenseNextMonth={104000}
              projectedIncomeBreakdown={[
                { name: 'Salary', amount: 135000, color: '#00E5B3' },
                { name: 'Asset Rent (AST-101, 104)', amount: assetSummary.totalMonthlyAssetIncome, color: '#7B6EF6' },
                { name: 'Sanchaypatra (Q)', amount: 28500, color: '#00B4D8' },
                { name: 'FDR Returns', amount: 18500, color: '#FFB547' },
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

      {/* Add Asset Modal */}
      <AddAssetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddAsset}
      />
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
    paddingBottom: 120,
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
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  navBar: {
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
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '800',
    flex: 1,
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
