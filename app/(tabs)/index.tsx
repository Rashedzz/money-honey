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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { GlassCard } from '../../src/components/shared/GlassCard';
import { AppSidebar, SidebarTabType } from '../../src/components/navigation/AppSidebar';
import { PwaInstallModal } from '../../src/components/modals/PwaInstallModal';
import { RadialGauge } from '../../src/components/visuals/RadialGauge';
import { SegmentedDonut } from '../../src/components/visuals/SegmentedDonut';
import { FlowBreakdownBar } from '../../src/components/visuals/FlowBreakdownBar';
import { HealthStatusMeter } from '../../src/components/visuals/HealthStatusMeter';
import { ProjectionComparisonCard } from '../../src/components/visuals/ProjectionComparisonCard';
import { ScheduleTimeline, ScheduleEvent } from '../../src/components/visuals/ScheduleTimeline';
import { WealthVelocityCard } from '../../src/components/visuals/WealthVelocityCard';
import { FinancialConsultantToolsCard } from '../../src/components/visuals/FinancialConsultantToolsCard';
import { CountdownCard } from '../../src/components/dashboard/CountdownCard';
import { EMIReminderCard } from '../../src/components/dashboard/EMIReminderCard';
import { UniversalEntryModal, EntryType } from '../../src/components/modals/UniversalEntryModal';

// Dedicated Screen Views
import { PhysicalAssetsScreen } from '../../src/components/screens/PhysicalAssetsScreen';
import { PaperAssetsScreen } from '../../src/components/screens/PaperAssetsScreen';
import { ExpensesScreen } from '../../src/components/screens/ExpensesScreen';
import { SettingsScreen } from '../../src/components/screens/SettingsScreen';
import AccountsScreen from './accounts';
import LoansScreen from './loans';

// Math Engines
import { AssetItem, evaluateAssets } from '../../src/finance/assetEvaluation';
import {
  LifeInsurancePolicy,
  BirthdayEvent,
  calculateInsuranceSummary,
} from '../../src/finance/insuranceBirthday';
import { calculateWealthVelocity } from '../../src/finance/wealthVelocity';
import { calculateFinancialPlanningSuite } from '../../src/finance/financialPlanningTools';

// Master Initial Datasets
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

const initialPolicies: LifeInsurancePolicy[] = [
  {
    id: 'INS-001',
    policyName: 'MetLife Guaranteed Savings Plan',
    insurer: 'MetLife Bangladesh',
    policyNumber: 'POL-992014-BD',
    sumAssured: 10000000,
    premiumAmount: 85000,
    premiumFrequency: 'annual',
    policyTermYears: 15,
    premiumPayingTermYears: 10,
    paidPremiumsTotal: 425000,
    projectedMaturityBonus: 4500000,
    startDate: '2021-04-10',
    nextPremiumDueDate: '2026-09-15',
    nomineeName: 'Sarah Rahman (Spouse)',
    status: 'active',
  },
  {
    id: 'INS-002',
    policyName: 'Delta Life Child Endowment',
    insurer: 'Delta Life Insurance Ltd.',
    policyNumber: 'POL-330192-DL',
    sumAssured: 5000000,
    premiumAmount: 48000,
    premiumFrequency: 'annual',
    policyTermYears: 18,
    premiumPayingTermYears: 12,
    paidPremiumsTotal: 192000,
    projectedMaturityBonus: 2200000,
    startDate: '2022-08-01',
    nextPremiumDueDate: '2026-11-20',
    nomineeName: 'Ayan Rahman (Son)',
    status: 'active',
  },
];

const initialBirthdays: BirthdayEvent[] = [
  {
    id: 'BD-001',
    personName: 'Sarah Rahman',
    relation: 'Spouse',
    birthDate: '1994-08-24',
    giftBudget: 15000,
    notifyDaysBefore: 7,
  },
  {
    id: 'BD-002',
    personName: 'Ayan Rahman',
    relation: 'Child',
    birthDate: '2019-09-08',
    giftBudget: 8000,
    notifyDaysBefore: 5,
  },
];

const initialCash = [
  { id: '1', label: 'City Bank Savings', amount: 650000, color: '#22C55E' },
  { id: '2', label: 'BRAC Bank Salary A/C', amount: 450000, color: '#06B6D4' },
  { id: '3', label: 'Cash in Hand (Physical)', amount: 65000, color: '#F59E0B' },
  { id: '4', label: 'bKash Wallet (MFS)', amount: 35000, color: '#EF4444' },
];

const initialLoans = [
  { id: '1', name: 'Apartment Home Loan', sub: 'City Bank Ltd. (226 mos left)', amount: 4250000, color: '#EF4444' },
  { id: '2', name: 'Vehicle Auto Loan', sub: 'Eastern Bank Ltd. (24 mos left)', amount: 540000, color: '#F59E0B' },
  { id: '3', name: 'Personal Loan (Outside Bank)', sub: 'Private Family Debt', amount: 250000, color: '#8B5CF6' },
];

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

export default function MasterDashboardScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeTab, setActiveTab] = useState<SidebarTabType>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [birthDate, setBirthDate] = useState('1992-05-15');

  // Master State
  const [assets, setAssets] = useState<AssetItem[]>(initialAssets);
  const [cashList, setCashList] = useState(initialCash);
  const [loanList, setLoanList] = useState(initialLoans);
  const [policies, setPolicies] = useState<LifeInsurancePolicy[]>(initialPolicies);
  const [birthdays, setBirthdays] = useState<BirthdayEvent[]>(initialBirthdays);

  // Modals
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<EntryType>('income');
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // Mobile Drawer State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Computed Values
  const totalCashInHand = cashList.reduce((sum, item) => sum + item.amount, 0);
  const totalLoans = loanList.reduce((sum, item) => sum + item.amount, 0);
  const assetSummary = evaluateAssets(assets);
  const insuranceSummary = calculateInsuranceSummary(policies, totalLoans);

  const currentIncomeItems = [
    { id: '1', name: 'Employment Tech Salary', sub: 'Primary Income', amount: 135000, color: '#22C55E' },
    {
      id: '2',
      name: 'Asset Cash Flow (Rent)',
      sub: `${assetSummary.incomeGeneratingCount} Active Assets (AST-101, AST-104)`,
      amount: assetSummary.totalMonthlyAssetIncome,
      color: '#8B5CF6',
    },
    { id: '3', name: '3-Mo Sanchaypatra Coupon', sub: 'National Savings', amount: 21500, color: '#06B6D4' },
    { id: '4', name: 'FDR Monthly Return', sub: 'DBBL Fixed Deposit', amount: 18500, color: '#F59E0B' },
  ];

  const totalCurrentIncome = currentIncomeItems.reduce((sum, item) => sum + item.amount, 0);

  const currentExpenseItems = [
    { id: '1', name: 'City Bank Home Loan EMI', sub: 'Debt Service • Bank Loan', amount: 45000, color: '#EF4444' },
    { id: '2', name: 'Household Living & Food', sub: 'Family Living & Supplies', amount: 28000, color: '#F59E0B' },
    { id: '3', name: 'EBL Vehicle Auto Loan EMI', sub: 'Debt Service • Asset EMI', amount: 22500, color: '#EF4444' },
    { id: '4', name: 'Utilities & Telecom', sub: 'Electricity, Gas, Internet', amount: 7000, color: '#06B6D4' },
  ];

  const totalCurrentExpense = currentExpenseItems.reduce((sum, item) => sum + item.amount, 0);

  const wealthVelocity = calculateWealthVelocity(
    birthDate,
    totalCurrentIncome,
    totalCurrentExpense,
    assetSummary.totalAssetValuation + totalCashInHand - totalLoans
  );

  const planningSuite = calculateFinancialPlanningSuite(
    totalCurrentIncome,
    totalCurrentExpense,
    totalCashInHand,
    totalLoans,
    assetSummary.totalAssetValuation,
    insuranceSummary.totalLifeCoverage,
    wealthVelocity.ageYears
  );

  const handleUniversalSave = (type: EntryType, data: any) => {
    if (type === 'asset') setAssets((prev) => [data, ...prev]);
    else if (type === 'insurance') setPolicies((prev) => [data, ...prev]);
    else if (type === 'birthday') setBirthdays((prev) => [data, ...prev]);
    else if (type === 'bank') setCashList((prev) => [...prev, { id: data.id, label: data.title, amount: data.amount, color: '#22C55E' }]);
    else if (type === 'loan') setLoanList((prev) => [...prev, { id: data.id, name: data.title, sub: data.category, amount: data.amount, color: '#EF4444' }]);
  };

  const openModal = (type: EntryType) => {
    setModalInitialType(type);
    setEntryModalVisible(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const pageTitles: Record<SidebarTabType, string> = {
    dashboard: 'Executive Wealth Dashboard',
    accounts: 'Liquid Bank Accounts & Cash Vault',
    loans: 'Institutional Loans & Debt Service',
    paper_assets: 'Paper Assets (Sanchaypatra / FDR / DPS)',
    physical_assets: 'Physical Assets (Land / Gold / Flats)',
    expenses: 'Expenses & Asset Maintenance Costs',
    settings: 'Settings & Security Vault',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      <View style={styles.appShell}>
        {/* 1. Left Collapsible Sidebar on Desktop / Tablet */}
        {isDesktop && (
          <AppSidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onQuickEntryPress={() => openModal('income')}
            onOpenQrModal={() => setQrModalVisible(true)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            userProfile={{ name: 'Rashed Rahman', avatar: '👨‍💼' }}
          />
        )}

        {/* 2. Main Content Container */}
        <View style={styles.mainContent}>
          {/* Top Utility Header */}
          <View style={styles.topUtilityBar}>
            <View style={styles.headerTitleRow}>
              {!isDesktop && (
                <TouchableOpacity
                  style={styles.mobileMenuBtn}
                  onPress={() => setMobileDrawerOpen(true)}
                >
                  <Ionicons name="menu" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
              )}
              <View>
                <Text style={styles.pageTitle}>{pageTitles[activeTab]}</Text>
                <Text style={styles.pageSubtitle}>AFIL Agro Hub Standard • Real-Time Engine</Text>
              </View>
            </View>

            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.qrHeaderBtn}
                onPress={() => setQrModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="qr-code-outline" size={15} color={Colors.primary} />
                <Text style={styles.qrHeaderBtnText}>📱 Phone QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickEntryHeaderBtn}
                onPress={() => openModal('income')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={16} color="#020617" />
                <Text style={styles.quickEntryHeaderBtnText}>+ Data Entry</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sub-view router */}
          {activeTab === 'accounts' && <AccountsScreen />}
          {activeTab === 'loans' && <LoansScreen />}
          {activeTab === 'paper_assets' && <PaperAssetsScreen />}
          {activeTab === 'physical_assets' && (
            <PhysicalAssetsScreen assets={assets} onAddAsset={(a) => setAssets([a, ...assets])} />
          )}
          {activeTab === 'expenses' && <ExpensesScreen />}
          {activeTab === 'settings' && (
            <SettingsScreen
              birthDate={birthDate}
              onUpdateBirthDate={setBirthDate}
              policies={policies}
              birthdays={birthdays}
              onAddPolicy={() => openModal('insurance')}
              onAddBirthday={() => openModal('birthday')}
            />
          )}

          {/* Master Dashboard Screen (Constrained to max-width 1200) */}
          {activeTab === 'dashboard' && (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.dashboardContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
              {/* 1. Solvency Meter */}
              <HealthStatusMeter totalCashInHand={totalCashInHand} totalLoans={totalLoans} />

              {/* 2. Real-Time Wealth Velocity Clock */}
              <WealthVelocityCard velocity={wealthVelocity} />

              {/* 3. Responsive 2-Column Grid: Cash in Hand & Loan Liabilities */}
              <View style={[styles.gridRow, isDesktop && styles.gridRowTwoCol]}>
                <View style={[styles.gridCol, isDesktop && styles.colHalf]}>
                  <GlassCard style={styles.cardFull} padding={16} glowColor={Colors.primary}>
                    <Text style={styles.cardLabel}>1. CURRENT CASH IN HAND & LIQUID RESERVES</Text>
                    <SegmentedDonut
                      segments={cashList}
                      totalLabel="Total Liquid"
                      totalFormatted={`৳ ${(totalCashInHand / 100000).toFixed(1)}L`}
                      size={140}
                    />
                  </GlassCard>
                </View>

                <View style={[styles.gridCol, isDesktop && styles.colHalf]}>
                  <GlassCard style={styles.cardFull} padding={16} glowColor={Colors.danger}>
                    <Text style={[styles.cardLabel, { color: Colors.danger }]}>
                      2. OUTSTANDING LOAN LIABILITIES
                    </Text>
                    <RadialGauge
                      score={84}
                      title={`৳ ${(totalLoans / 100000).toFixed(1)} Lakhs`}
                      subtitle="84% Institutional • 5% Private"
                      statusLabel="Debt Load"
                      statusColor={Colors.danger}
                      size={140}
                    />
                  </GlassCard>
                </View>
              </View>

              {/* Detailed Loan Bank vs Outside-Bank Split Bar */}
              <View style={styles.fullWidthBox}>
                <GlassCard style={styles.cardFull} padding={16}>
                  <FlowBreakdownBar
                    items={loanList}
                    total={totalLoans}
                    title="LOAN BREAKDOWN (BANK-WISE & OUTSIDE OF BANK)"
                    totalFormatted={`৳ ${totalLoans.toLocaleString('en-IN')}`}
                  />
                </GlassCard>
              </View>

              {/* 4. Responsive 2-Column Grid: Income Sources & Expenses by Sector */}
              <View style={[styles.gridRow, isDesktop && styles.gridRowTwoCol]}>
                <View style={[styles.gridCol, isDesktop && styles.colHalf]}>
                  <GlassCard style={styles.cardFull} padding={16} glowColor={Colors.primary}>
                    <FlowBreakdownBar
                      items={currentIncomeItems}
                      total={totalCurrentIncome}
                      title="4. INCOME SOURCES WITH ASSET RENTAL YIELD"
                      totalFormatted={`৳ ${totalCurrentIncome.toLocaleString('en-IN')}`}
                    />
                  </GlassCard>
                </View>

                <View style={[styles.gridCol, isDesktop && styles.colHalf]}>
                  <GlassCard style={styles.cardFull} padding={16} glowColor={Colors.danger}>
                    <FlowBreakdownBar
                      items={currentExpenseItems}
                      total={totalCurrentExpense}
                      title="5. EXPENSES BY SECTOR & FIXED DEBT EMIs"
                      totalFormatted={`৳ ${totalCurrentExpense.toLocaleString('en-IN')}`}
                    />
                  </GlassCard>
                </View>
              </View>

              {/* 5. Next Month Cash Flow Forecasting Card */}
              <View style={styles.fullWidthBox}>
                <ProjectionComparisonCard
                  currentMonthName="August"
                  nextMonthName="September 2026"
                  currentIncome={totalCurrentIncome}
                  projectedIncomeNextMonth={totalCurrentIncome + 7000}
                  currentExpense={totalCurrentExpense}
                  projectedExpenseNextMonth={104000}
                  projectedIncomeBreakdown={[
                    { name: 'Salary', amount: 135000, color: '#22C55E' },
                    { name: 'Asset Rent (AST-101, 104)', amount: assetSummary.totalMonthlyAssetIncome, color: '#8B5CF6' },
                    { name: 'Sanchaypatra (Q)', amount: 28500, color: '#06B6D4' },
                    { name: 'FDR Returns', amount: 18500, color: '#F59E0B' },
                  ]}
                  projectedExpenseBreakdown={[
                    { name: 'Fixed EMIs (Home + Auto)', amount: 67500, color: '#EF4444' },
                    { name: 'Household Living', amount: 28000, color: '#F59E0B' },
                    { name: 'Scheduled Utilities & Bills', amount: 8500, color: '#06B6D4' },
                  ]}
                />
              </View>

              {/* 6. Financial Planning Suite & Rule of 72 Doubling Time */}
              <FinancialConsultantToolsCard planning={planningSuite} />

              {/* 7. Schedules & Upcoming Disbursements */}
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitleText}>8. SCHEDULES & UPCOMING DISBURSEMENTS</Text>
              </View>
              <View style={styles.fullWidthBox}>
                <ScheduleTimeline events={upcomingSchedules} />
              </View>

              {/* 8. 3-Week Maturity Countdown Alerts */}
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionTitleText, { color: Colors.accent }]}>
                  9. 3-WEEK MATURITY COUNTDOWN ALERTS
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

              {/* 9. Pending EMI Action Reminders */}
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionTitleText, { color: Colors.danger }]}>
                  PENDING EMI ACTIONS
                </Text>
              </View>
              <View style={styles.emiBox}>
                <EMIReminderCard
                  loanTitle="Apartment Home Loan Mortgage"
                  bankName="City Bank Ltd."
                  emiAmount={45000}
                  dueDate={new Date(2026, 7, 25)}
                  paymentNumber={14}
                  totalPayments={240}
                  outstandingPrincipal={4250000}
                />
                <EMIReminderCard
                  loanTitle="Vehicle Auto Loan (Toyota Harrier)"
                  bankName="Eastern Bank Ltd."
                  emiAmount={22500}
                  dueDate={new Date(2026, 8, 5)}
                  paymentNumber={36}
                  totalPayments={60}
                  outstandingPrincipal={540000}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* PWA Phone Install QR Modal */}
      <PwaInstallModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        appUrl="https://rashedzz.github.io/money-honey/"
      />

      {/* Universal Quick Data Entry Modal */}
      <UniversalEntryModal
        visible={entryModalVisible}
        initialType={modalInitialType}
        onClose={() => setEntryModalVisible(false)}
        onSave={handleUniversalSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  appShell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#020617',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#020617',
    display: 'flex',
    flexDirection: 'column',
  },
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileMenuBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pageTitle: {
    ...Typography.heading,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qrHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  qrHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  quickEntryHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  quickEntryHeaderBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#020617',
  },
  scrollArea: {
    flex: 1,
  },
  dashboardContainer: {
    paddingTop: Spacing.md,
    paddingBottom: 100,
    paddingHorizontal: Spacing.md,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  gridRow: {
    flexDirection: 'column',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  gridRowTwoCol: {
    flexDirection: 'row',
  },
  gridCol: {
    width: '100%',
  },
  colHalf: {
    flex: 1,
  },
  cardFull: {
    width: '100%',
  },
  fullWidthBox: {
    marginBottom: Spacing.md,
  },
  cardLabel: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  sectionTitleRow: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitleText: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '800',
  },
  hScroll: {
    paddingBottom: Spacing.xs,
  },
  emiBox: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
