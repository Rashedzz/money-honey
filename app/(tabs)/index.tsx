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
import { MobileDrawer } from '../../src/components/navigation/MobileDrawer';
import { MobileBottomNav } from '../../src/components/navigation/MobileBottomNav';
import { PwaInstallModal } from '../../src/components/modals/PwaInstallModal';
import { FirebaseSyncModal } from '../../src/components/modals/FirebaseSyncModal';
import { FirebaseSyncService } from '../../src/services/firebaseSync';
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

// Auth System & Stock Market Modules
import { useAuth } from '../../src/auth/AuthContext';
import { AuthModal } from '../../src/components/modals/AuthModal';
import { useStocks } from '../../src/hooks/useStocks';
import { StockMarketScreen } from '../../src/components/screens/StockMarketScreen';

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

// Local storage helpers for local device persistence
const getStoredData = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(key);
      if (item) return JSON.parse(item);
    }
  } catch (e) {}
  return fallback;
};

const setStoredData = <T,>(key: string, value: T) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {}
};

export default function MasterDashboardScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { user, isOnline, openAuthModal, closeAuthModal, isAuthModalVisible } = useAuth();
  const { stocks, summary: stockSummary, addStock, updateStockPrice, deleteStock } = useStocks();

  const [activeTab, setActiveTab] = useState<SidebarTabType>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [birthDate, setBirthDate] = useState('1992-05-15');

  // Master State - Clean slate without dummy data, persisted to local device storage
  const [assets, setAssetsState] = useState<AssetItem[]>(() => getStoredData('mh_user_assets', []));
  const [cashList, setCashListState] = useState<any[]>(() => getStoredData('mh_user_cash', []));
  const [loanList, setLoanListState] = useState<any[]>(() => getStoredData('mh_user_loans', []));
  const [incomes, setIncomesState] = useState<any[]>(() => getStoredData('mh_user_incomes', []));
  const [expenses, setExpensesState] = useState<any[]>(() => getStoredData('mh_user_expenses', []));
  const [policies, setPoliciesState] = useState<LifeInsurancePolicy[]>(() => getStoredData('mh_user_policies', []));
  const [birthdays, setBirthdaysState] = useState<BirthdayEvent[]>(() => getStoredData('mh_user_birthdays', []));
  const [schedules, setSchedulesState] = useState<ScheduleEvent[]>(() => getStoredData('mh_user_schedules', []));

  const setAssets = (updater: any) => {
    setAssetsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setStoredData('mh_user_assets', next);
      return next;
    });
  };
  const setCashList = (updater: any) => {
    setCashListState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setStoredData('mh_user_cash', next);
      return next;
    });
  };
  const setLoanList = (updater: any) => {
    setLoanListState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setStoredData('mh_user_loans', next);
      return next;
    });
  };
  const setIncomes = (updater: any) => {
    setIncomesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setStoredData('mh_user_incomes', next);
      return next;
    });
  };
  const setExpenses = (updater: any) => {
    setExpensesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setStoredData('mh_user_expenses', next);
      return next;
    });
  };
  const setPolicies = (updater: any) => {
    setPoliciesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setStoredData('mh_user_policies', next);
      return next;
    });
  };
  const setBirthdays = (updater: any) => {
    setBirthdaysState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setStoredData('mh_user_birthdays', next);
      return next;
    });
  };

  // Modals
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<EntryType>('stock');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [firebaseModalVisible, setFirebaseModalVisible] = useState(false);

  // Computed Values
  const totalCashInHand = cashList.reduce((sum, item) => sum + (item.amount || item.currentBalance || 0), 0);
  const totalLoans = loanList.reduce((sum, item) => sum + (item.outstandingPrincipal !== undefined ? item.outstandingPrincipal : (item.amount || 0)), 0);
  const assetSummary = evaluateAssets(assets);
  const insuranceSummary = calculateInsuranceSummary(policies, totalLoans);

  const currentIncomeItems = [
    ...(assetSummary.totalMonthlyAssetIncome > 0
      ? [
          {
            id: 'asset_rent',
            name: 'Asset Cash Flow (Rent/Yield)',
            sub: `${assetSummary.incomeGeneratingCount} Active Generating Assets`,
            amount: assetSummary.totalMonthlyAssetIncome,
            color: '#16A34A',
          },
        ]
      : []),
    ...incomes.map((inc) => ({
      id: inc.id,
      name: inc.title || inc.name,
      sub: inc.category || 'Income',
      amount: inc.amount,
      color: '#0284C7',
    })),
  ];

  const totalCurrentIncome = currentIncomeItems.reduce((sum, item) => sum + item.amount, 0);

  const currentExpenseItems = [
    ...loanList.map((loan) => ({
      id: `loan_${loan.id}`,
      name: `${loan.name || loan.title || 'Loan'} Debt Service`,
      sub: loan.sub || 'Bank Liability',
      amount: loan.amount > 100000 ? Math.round(loan.amount * 0.012) : loan.amount,
      color: '#EF4444',
    })),
    ...expenses.map((exp) => ({
      id: exp.id,
      name: exp.title || exp.name,
      sub: exp.category || 'Expense',
      amount: exp.amount,
      color: '#F59E0B',
    })),
  ];

  const totalCurrentExpense = currentExpenseItems.reduce((sum, item) => sum + item.amount, 0);

  const consolidatedNetWorth =
    totalCashInHand +
    stockSummary.currentValue +
    assetSummary.totalAssetValuation -
    totalLoans;

  const wealthVelocity = calculateWealthVelocity(
    birthDate,
    totalCurrentIncome,
    totalCurrentExpense,
    consolidatedNetWorth
  );

  const planningSuite = calculateFinancialPlanningSuite(
    totalCurrentIncome,
    totalCurrentExpense,
    totalCashInHand,
    totalLoans,
    assetSummary.totalAssetValuation + stockSummary.currentValue,
    insuranceSummary.totalLifeCoverage,
    wealthVelocity.ageYears
  );

  const handleUniversalSave = (type: EntryType, data: any) => {
    const currentUid = user?.id || 'rashed01';
    if (type === 'asset') {
      setAssets((prev: any) => {
        const next = [data, ...prev];
        FirebaseSyncService.pushCategory(currentUid, 'physical_assets', next);
        return next;
      });
    } else if (type === 'stock') {
      addStock(data);
      FirebaseSyncService.pushCategory(currentUid, 'stocks', [data, ...stocks]);
    } else if (type === 'income') {
      setIncomes((prev: any) => {
        const next = [data, ...prev];
        FirebaseSyncService.pushCategory(currentUid, 'incomes', next);
        return next;
      });
    } else if (type === 'expense') {
      setExpenses((prev: any) => {
        const next = [data, ...prev];
        FirebaseSyncService.pushCategory(currentUid, 'expenses', next);
        return next;
      });
    } else if (type === 'insurance') {
      setPolicies((prev: any) => {
        const next = [data, ...prev];
        FirebaseSyncService.pushCategory(currentUid, 'policies', next);
        return next;
      });
    } else if (type === 'birthday') {
      setBirthdays((prev: any) => {
        const next = [data, ...prev];
        FirebaseSyncService.pushCategory(currentUid, 'birthdays', next);
        return next;
      });
    } else if (type === 'bank') {
      setCashList((prev: any) => {
        const next = [...prev, { id: data.id, label: data.title, amount: data.amount, color: '#22C55E' }];
        FirebaseSyncService.pushCategory(currentUid, 'bank_accounts', next);
        return next;
      });
    } else if (type === 'loan') {
      setLoanList((prev: any) => {
        const next = [...prev, { id: data.id, name: data.title, sub: data.category, amount: data.amount, color: '#EF4444' }];
        FirebaseSyncService.pushCategory(currentUid, 'loans', next);
        return next;
      });
    }
  };

  const openModal = (type: EntryType) => {
    setModalInitialType(type);
    setEntryModalVisible(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const pageTitles: Record<SidebarTabType, string> = {
    dashboard: 'Executive Wealth Dashboard',
    stocks: 'Stock Market Equities (DSE / CSE & Global)',
    accounts: 'Liquid Bank Accounts & Cash Vault',
    loans: 'Institutional Loans & Debt Service',
    paper_assets: 'Paper Assets (Sanchaypatra / FDR / DPS)',
    physical_assets: 'Physical Assets (Land / Gold / Flats)',
    expenses: 'Expenses & Asset Maintenance Costs',
    settings: 'Settings & Security Vault',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.appShell}>
        {/* 1. Left Sidebar: Solid Black, White Text, Green Button, Gold Hover */}
        {isDesktop && (
          <AppSidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onQuickEntryPress={() => openModal('stock')}
            onOpenQrModal={() => setQrModalVisible(true)}
            onOpenAuthModal={openAuthModal}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            userProfile={user || { name: 'Rashed Rahman', avatar: '👨‍💼', id: 'rashed01' }}
            isOnline={isOnline}
          />
        )}

        {/* 2. Main Content Container (Sky Blue Background) */}
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
                <Text style={styles.pageSubtitle}>
                  {isOnline ? '🌐 Online Available • Local-First Architecture' : '🟢 Offline Mode • Local Storage Active'}
                </Text>
              </View>
            </View>

            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.authHeaderBtn}
                onPress={openAuthModal}
                activeOpacity={0.8}
              >
                <Ionicons name="person-circle-outline" size={18} color="#0F172A" />
                <Text style={styles.authHeaderBtnText}>
                  @{user?.id || 'rashed01'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.qrHeaderBtn}
                onPress={() => setQrModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="qr-code-outline" size={15} color={Colors.primary} />
                <Text style={styles.qrHeaderBtnText}>📱 Phone QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.firebaseHeaderBtn}
                onPress={() => setFirebaseModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="flame" size={16} color="#EA580C" />
                <Text style={styles.firebaseHeaderBtnText}>🔥 Firebase</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickEntryHeaderBtn}
                onPress={() => openModal('stock')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.quickEntryHeaderBtnText}>+ Data Entry</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Screen Routing */}
          {activeTab === 'stocks' && (
            <StockMarketScreen
              stocks={stocks}
              onAddStockPress={() => openModal('stock')}
              onDeleteStock={deleteStock}
              onUpdatePrice={updateStockPrice}
            />
          )}
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
              onAddBirthday={(b) => {
                if (b) setBirthdays((prev: any) => [b, ...prev]);
                else openModal('birthday');
              }}
              onDeleteBirthday={(id) => {
                setBirthdays((prev: any) => prev.filter((item: any) => item.id !== id));
              }}
            />
          )}

          {/* Master Dashboard Screen */}
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

              {/* 3. NEW: Stock Market & Equities Portfolio Card */}
              <View style={styles.fullWidthBox}>
                <GlassCard style={styles.cardFull} padding={18} glowColor={stockSummary.isProfitable ? Colors.success : Colors.danger}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 20 }}>📈</Text>
                        <Text style={styles.cardLabel}>STOCK MARKET & EQUITIES PORTFOLIO</Text>
                      </View>
                      <Text style={{ fontSize: 32, fontWeight: '900', color: '#0F172A', marginTop: 4 }}>
                        ৳ {stockSummary.currentValue.toLocaleString('en-IN')}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                        Capital Invested: ৳ {stockSummary.totalInvested.toLocaleString('en-IN')} • {stockSummary.totalHoldingsCount} Stock Holdings (DSE/CSE)
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 8 }}>
                      <View style={{
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: stockSummary.isProfitable ? 'rgba(22, 163, 74, 0.14)' : 'rgba(239, 68, 68, 0.14)'
                      }}>
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '800',
                          color: stockSummary.isProfitable ? Colors.success : Colors.danger
                        }}>
                          {stockSummary.isProfitable ? '▲ +' : '▼ −'}৳ {Math.abs(stockSummary.totalGainLoss).toLocaleString('en-IN')} ({stockSummary.totalGainLossPercent.toFixed(2)}%)
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setActiveTab('stocks')}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#0284C7' }}>Open Stock Market →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </GlassCard>
              </View>

              {/* 4. Responsive 2-Column Grid: Cash in Hand & Loan Liabilities */}
              <View style={[styles.gridRow, isDesktop && styles.gridRowTwoCol]}>
                <View style={[styles.gridCol, isDesktop && styles.colHalf]}>
                  <GlassCard style={styles.cardFull} padding={16} glowColor={Colors.primary}>
                    <Text style={styles.cardLabel}>1. CURRENT CASH IN HAND & LIQUID RESERVES</Text>
                    {cashList.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic' }}>
                          No cash accounts recorded. Click "+ Data Entry" above.
                        </Text>
                      </View>
                    ) : (
                      <SegmentedDonut
                        segments={cashList}
                        totalLabel="Total Liquid"
                        totalFormatted={`৳ ${(totalCashInHand / 100000).toFixed(1)}L`}
                        size={140}
                      />
                    )}
                  </GlassCard>
                </View>

                <View style={[styles.gridCol, isDesktop && styles.colHalf]}>
                  <GlassCard style={styles.cardFull} padding={16} glowColor={Colors.danger}>
                    <Text style={[styles.cardLabel, { color: Colors.danger }]}>
                      2. OUTSTANDING LOAN LIABILITIES
                    </Text>
                    {loanList.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic' }}>
                          No debt liabilities recorded.
                        </Text>
                      </View>
                    ) : (
                      <RadialGauge
                        score={totalLoans > 0 ? 80 : 0}
                        title={`৳ ${(totalLoans / 100000).toFixed(1)} Lakhs`}
                        subtitle="Institutional & Outside Loans"
                        statusLabel="Debt Load"
                        statusColor={Colors.danger}
                        size={140}
                      />
                    )}
                  </GlassCard>
                </View>
              </View>

              {/* 5. Income Sources & Expenses by Sector */}
              <View style={[styles.gridRow, isDesktop && styles.gridRowTwoCol]}>
                <View style={[styles.gridCol, isDesktop && styles.colHalf]}>
                  <GlassCard style={styles.cardFull} padding={16} glowColor={Colors.primary}>
                    <FlowBreakdownBar
                      items={currentIncomeItems}
                      total={totalCurrentIncome}
                      title="3. INCOME SOURCES WITH ASSET RENTAL YIELD"
                      totalFormatted={`৳ ${totalCurrentIncome.toLocaleString('en-IN')}`}
                    />
                  </GlassCard>
                </View>

                <View style={[styles.gridCol, isDesktop && styles.colHalf]}>
                  <GlassCard style={styles.cardFull} padding={16} glowColor={Colors.danger}>
                    <FlowBreakdownBar
                      items={currentExpenseItems}
                      total={totalCurrentExpense}
                      title="4. EXPENSES BY SECTOR & FIXED DEBT EMIs"
                      totalFormatted={`৳ ${totalCurrentExpense.toLocaleString('en-IN')}`}
                    />
                  </GlassCard>
                </View>
              </View>

              {/* 6. Financial Planning Suite */}
              <FinancialConsultantToolsCard planning={planningSuite} />
            </ScrollView>
          )}
        </View>
      </View>

      {/* Mobile Sticky Bottom Navigation Bar */}
      {!isDesktop && (
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenDrawer={() => setMobileDrawerOpen(true)}
          onQuickEntryPress={() => openModal('stock')}
        />
      )}

      {/* Mobile Slide-Out Navigation Drawer */}
      <MobileDrawer
        visible={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onQuickEntryPress={() => openModal('stock')}
        onOpenQrModal={() => setQrModalVisible(true)}
        onOpenAuthModal={openAuthModal}
        userProfile={user || { name: 'Rashed Rahman', avatar: '👨‍💼', id: 'rashed01' }}
        isOnline={isOnline}
      />

      {/* Universal Data Entry Vault Modal */}
      <UniversalEntryModal
        visible={entryModalVisible}
        initialType={modalInitialType}
        onClose={() => setEntryModalVisible(false)}
        onSave={handleUniversalSave}
      />

      {/* PWA Phone Install Modal */}
      <PwaInstallModal visible={qrModalVisible} onClose={() => setQrModalVisible(false)} />

      {/* User ID & Password Auth Modal */}
      <AuthModal visible={isAuthModalVisible} onClose={closeAuthModal} />

      {/* Firebase Cloud Sync Engine Modal */}
      <FirebaseSyncModal
        visible={firebaseModalVisible}
        onClose={() => setFirebaseModalVisible(false)}
        userId={user?.id || 'rashed01'}
        onDataRestored={() => {
          setAssetsState(getStoredData('mh_user_assets', []));
          setCashListState(getStoredData('mh_user_cash', []));
          setLoanListState(getStoredData('mh_user_loans', []));
          setIncomesState(getStoredData('mh_user_incomes', []));
          setExpensesState(getStoredData('mh_user_expenses', []));
          setPoliciesState(getStoredData('mh_user_policies', []));
          setBirthdaysState(getStoredData('mh_user_birthdays', []));
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E0F2FE', // Sky Blue 100
  },
  appShell: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#E0F2FE',
  },
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#BAE6FD',
    zIndex: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mobileMenuBtn: {
    padding: 6,
    borderRadius: Radius.md,
    backgroundColor: '#F0F9FF',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  authHeaderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  qrHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  qrHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  firebaseHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  firebaseHeaderBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  quickEntryHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A', // Green Action Button
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  quickEntryHeaderBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#E0F2FE',
  },
  dashboardContainer: {
    padding: Spacing.lg,
    paddingBottom: 100,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.md,
  },
  gridRow: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  gridRowTwoCol: {
    flexDirection: 'row',
  },
  gridCol: {
    flex: 1,
  },
  colHalf: {
    width: '50%',
  },
  fullWidthBox: {
    width: '100%',
  },
  cardFull: {
    width: '100%',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
});
