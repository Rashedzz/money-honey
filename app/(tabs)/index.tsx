import React, { useState, useEffect } from 'react';
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
  Image,
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
import { NetWorthMeter } from '../../src/components/dashboard/NetWorthMeter';
import { CountdownCard } from '../../src/components/dashboard/CountdownCard';
import { EMIReminderCard } from '../../src/components/dashboard/EMIReminderCard';
import { UniversalEntryModal, EntryType } from '../../src/components/modals/UniversalEntryModal';
import { DynamicMoneyTree } from '../../src/components/visuals/DynamicMoneyTree';

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
import { ScheduleScreen } from '../../src/components/screens/ScheduleScreen';
import AccountsScreen, { getStoredBankAccounts, BankAccountItem } from './accounts';
import LoansScreen from './loans';
import { useAutoCloudSync } from '../../src/hooks/useAutoCloudSync';

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
  const [birthDate, setBirthDateState] = useState<string>(() =>
    getStoredData('mh_user_birthdate', user?.birthDate || '1985-11-18')
  );

  const setBirthDate = (newDob: string) => {
    setBirthDateState(newDob);
    setStoredData('mh_user_birthdate', newDob);
  };

  const { syncStatus, lastSyncedAt, isSyncing, syncNow } = useAutoCloudSync(user?.id || 'rashed01');
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>(() => getStoredBankAccounts());

  // Master State - Clean slate without dummy data, persisted to local device storage
  const [assets, setAssetsState] = useState<AssetItem[]>(() => getStoredData('mh_user_assets', []));
  const [cashList, setCashListState] = useState<any[]>(() => getStoredData('mh_user_cash', []));
  const [loanList, setLoanListState] = useState<any[]>(() => getStoredData('mh_user_loans', []));
  const [incomes, setIncomesState] = useState<any[]>(() => getStoredData('mh_user_incomes', []));
  const [expenses, setExpensesState] = useState<any[]>(() => getStoredData('mh_user_expenses', []));
  const [policies, setPoliciesState] = useState<LifeInsurancePolicy[]>(() => getStoredData('mh_user_policies', []));
  const [birthdays, setBirthdaysState] = useState<BirthdayEvent[]>(() => getStoredData('mh_user_birthdays', []));
  const [schedules, setSchedulesState] = useState<ScheduleEvent[]>(() => getStoredData('mh_user_schedules', []));

  // Sync bank accounts when tab changes to dashboard
  useEffect(() => {
    if (activeTab === 'dashboard') {
      setBankAccounts(getStoredBankAccounts());
    }
  }, [activeTab]);

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

  // Computed Values - Harmonized with AccountsScreen storage
  const totalBankBalances = bankAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const totalCashListBalances = cashList.reduce((sum, item) => sum + (item.amount || item.currentBalance || 0), 0);
  const totalCashInHand = totalBankBalances > 0 ? totalBankBalances : totalCashListBalances;

  // Active liquid display segments: prefer actual bank accounts if available, otherwise cashList
  const liquidSegments = bankAccounts.length > 0
    ? bankAccounts.map((b) => ({
        id: b.id,
        label: b.bankName,
        amount: b.currentBalance,
        color: b.color || '#0284C7',
      }))
    : cashList;

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

  const paperAssetsTotal = (() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('mh_paper_assets');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed.reduce((sum: number, item: any) => sum + (item.amount || item.investmentAmount || 0), 0);
          }
        }
      }
    } catch (e) {}
    return 0;
  })();

  const consolidatedNetWorth =
    totalCashInHand +
    stockSummary.currentValue +
    paperAssetsTotal +
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
      const newAcc: BankAccountItem = {
        id: `ACC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        bankName: data.title,
        accountName: data.title,
        accountType: data.category || 'Savings Account',
        accountNumber: data.subInfo || `****${Math.floor(1000 + Math.random() * 9000)}`,
        currentBalance: data.amount,
        color: '#0284C7',
      };
      const updatedBanks = [...getStoredBankAccounts(), newAcc];
      setStoredData('mh_user_bank_accounts', updatedBanks);
      setBankAccounts(updatedBanks);
      setCashList((prev: any) => {
        const next = [...prev, { id: newAcc.id, label: newAcc.bankName, amount: newAcc.currentBalance, color: '#0284C7' }];
        FirebaseSyncService.pushCategory(currentUid, 'bank_accounts', updatedBanks);
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
    setBankAccounts(getStoredBankAccounts());
    syncNow();
    setTimeout(() => setRefreshing(false), 500);
  };

  const pageTitles: Record<SidebarTabType, string> = {
    dashboard: 'Executive Wealth Dashboard',
    stocks: 'Stock Market Equities (DSE / CSE & Global)',
    accounts: 'Liquid Bank Accounts & Cash Vault',
    loans: 'Institutional Loans & Debt Service',
    schedules: 'Automated Cash Flow & Schedules',
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
            userProfile={user || { name: 'Rashed Zaman', avatar: '👨‍💼', id: 'rashed01' }}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {!isDesktop && <DynamicMoneyTree size={36} />}
                <View>
                  <Text style={styles.pageTitle}>{pageTitles[activeTab]}</Text>
                  <Text style={styles.pageSubtitle}>
                    {isOnline ? '🌐 Online Available • Local-First Architecture' : '🟢 Offline Mode • Local Storage Active'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.authHeaderBtn}
                onPress={openAuthModal}
                activeOpacity={0.8}
              >
                {user?.photoUri ? (
                  <Image
                    source={{ uri: user.photoUri }}
                    style={{ width: 22, height: 22, borderRadius: 11, marginRight: 6 }}
                  />
                ) : (
                  <Ionicons name="person-circle-outline" size={18} color="#0F172A" />
                )}
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
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: Radius.full,
                  backgroundColor: syncStatus === 'synced' ? '#F0FDF4' : syncStatus === 'syncing' ? '#FEF3C7' : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: syncStatus === 'synced' ? '#BBF7D0' : '#CBD5E1',
                }}
                onPress={syncNow}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isSyncing ? 'sync' : 'cloud-done'}
                  size={14}
                  color={syncStatus === 'synced' ? '#16A34A' : '#D97706'}
                />
                <Text style={{ fontSize: 11, fontWeight: '800', color: syncStatus === 'synced' ? '#16A34A' : '#475569' }}>
                  {isSyncing ? 'Syncing...' : lastSyncedAt ? 'Cloud Synced' : 'Sync Now'}
                </Text>
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
          {activeTab === 'schedules' && <ScheduleScreen />}
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
              {/* 1. Flagship Consolidated Net Worth Hero Card */}
              <NetWorthMeter
                netWorth={consolidatedNetWorth}
                totalAssets={totalCashInHand + stockSummary.currentValue + assetSummary.totalAssetValuation}
                totalLiabilities={totalLoans}
                monthlyIncome={totalCurrentIncome}
                monthlyExpense={totalCurrentExpense}
                allocation={{
                  cash: totalCashInHand,
                  stocks: stockSummary.currentValue,
                  paperAssets: paperAssetsTotal,
                  physicalAssets: assetSummary.totalAssetValuation,
                }}
              />

              {/* 2. Executive Quick Action Ribbon */}
              <View style={styles.actionRibbon}>
                <TouchableOpacity style={styles.actionPill} onPress={() => openModal('bank')} activeOpacity={0.8}>
                  <Ionicons name="wallet-outline" size={15} color="#0284C7" />
                  <Text style={styles.actionPillText}>+ Bank Account</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionPill} onPress={() => openModal('stock')} activeOpacity={0.8}>
                  <Ionicons name="trending-up" size={15} color="#0D9488" />
                  <Text style={styles.actionPillText}>+ Stock Position</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionPill} onPress={() => openModal('loan')} activeOpacity={0.8}>
                  <Ionicons name="card-outline" size={15} color="#DC2626" />
                  <Text style={styles.actionPillText}>+ Loan / Debt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionPill} onPress={() => setActiveTab('paper_assets')} activeOpacity={0.8}>
                  <Ionicons name="document-text-outline" size={15} color="#6366F1" />
                  <Text style={styles.actionPillText}>+ Sanchaypatra / FDR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionPill} onPress={() => openModal('asset')} activeOpacity={0.8}>
                  <Ionicons name="business-outline" size={15} color="#D97706" />
                  <Text style={styles.actionPillText}>+ Physical Asset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionPill} onPress={() => openModal('expense')} activeOpacity={0.8}>
                  <Ionicons name="receipt-outline" size={15} color="#475569" />
                  <Text style={styles.actionPillText}>+ Record Expense</Text>
                </TouchableOpacity>
              </View>

              {/* 3. DSE / CSE Stock Market & Listed Equities Card */}
              <View style={styles.fullWidthBox}>
                <View style={styles.stockCard}>
                  <View style={styles.stockCardContent}>
                    <View style={{ flex: 1, minWidth: 240 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.stockIconBadge}>
                          <Ionicons name="trending-up" size={16} color="#0D9488" />
                        </View>
                        <Text style={styles.stockCardHeaderTitle}>DSE / CSE EQUITIES & PORTFOLIO SURVEILLANCE</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                        <Text style={styles.stockCardAmount}>
                          ৳ {stockSummary.currentValue.toLocaleString('en-IN')}
                        </Text>
                        <View style={{ backgroundColor: '#F0FDFA', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#CCFBF1' }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#0D9488' }}>
                            (৳ {(stockSummary.currentValue / 100000).toFixed(2)} Lakhs)
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.stockCardSub}>
                        Capital Invested: ৳ {stockSummary.totalInvested.toLocaleString('en-IN')} (৳ {(stockSummary.totalInvested / 100000).toFixed(2)} Lakhs) • {stockSummary.totalHoldingsCount} Stock Positions (Dhaka & Chittagong Stock Exchanges)
                      </Text>
                    </View>

                    <View style={styles.stockCardRight}>
                      <View style={[
                        styles.trendPill,
                        { backgroundColor: stockSummary.isProfitable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' }
                      ]}>
                        <Text style={[
                          styles.trendPillText,
                          { color: stockSummary.isProfitable ? '#059669' : '#DC2626' }
                        ]}>
                          {stockSummary.isProfitable ? '▲ +' : '▼ −'}৳ {Math.abs(stockSummary.totalGainLoss).toLocaleString('en-IN')} ({stockSummary.totalGainLossPercent.toFixed(2)}%)
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setActiveTab('stocks')}
                        style={styles.stockTerminalBtn}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.stockTerminalBtnText}>Open Stock Market Terminal</Text>
                        <Ionicons name="arrow-forward" size={14} color="#0284C7" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Quick Holdings Snapshot Table */}
                  {stocks.length > 0 && (
                    <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginBottom: 6 }}>
                        PORTFOLIO POSITIONS & UNREALIZED P/L (DSE/CSE)
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {stocks.map((s) => {
                          const sInv = s.quantity * s.buyPrice;
                          const sVal = s.quantity * s.currentPrice;
                          const sGain = sVal - sInv;
                          const sGainPct = sInv > 0 ? (sGain / sInv) * 100 : 0;
                          const isGain = sGain >= 0;

                          return (
                            <View
                              key={s.id}
                              style={{
                                flex: 1,
                                minWidth: 180,
                                backgroundColor: '#F8FAFC',
                                borderRadius: Radius.md,
                                padding: 10,
                                borderWidth: 1,
                                borderColor: '#E2E8F0',
                              }}
                            >
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>{s.symbol}</Text>
                                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: isGain ? '#DCFCE7' : '#FEE2E2' }}>
                                  <Text style={{ fontSize: 10, fontWeight: '800', color: isGain ? '#15803D' : '#B91C1C' }}>
                                    {isGain ? '+' : ''}{sGainPct.toFixed(1)}%
                                  </Text>
                                </View>
                              </View>
                              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                                {s.quantity} shrs • Buy: ৳{s.buyPrice.toFixed(1)} • CMP: ৳{s.currentPrice.toFixed(1)}
                              </Text>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, borderTopWidth: 1, borderTopColor: '#EEF2F6', paddingTop: 4 }}>
                                <Text style={{ fontSize: 11, color: '#64748B' }}>Val: ৳{Math.round(sVal).toLocaleString('en-IN')}</Text>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: isGain ? '#16A34A' : '#DC2626' }}>
                                  {isGain ? '+' : '−'}৳{Math.round(Math.abs(sGain)).toLocaleString('en-IN')}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* 4. Solvency & Debt Service Coverage Ratio */}
              <HealthStatusMeter totalCashInHand={totalCashInHand} totalLoans={totalLoans} />

              {/* 5. Responsive 2-Column Grid: Liquid Reserves & Debt Liabilities */}
              <View style={[styles.gridRow, isDesktop && styles.gridRowTwoCol]}>
                <View style={[styles.gridCol, isDesktop && styles.colHalf]}>
                  <View style={styles.whiteCard}>
                    <View style={styles.cardHeaderRow}>
                      <Ionicons name="wallet-outline" size={16} color="#0284C7" />
                      <Text style={styles.cardLabel}>LIQUID CAPITAL & ACTIVE BANK ACCOUNTS</Text>
                    </View>
                    {liquidSegments.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                          No bank accounts recorded. Click "+ Bank Account" above.
                        </Text>
                        <TouchableOpacity
                          style={{ marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#0284C7', borderRadius: 6 }}
                          onPress={() => openModal('bank')}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>+ Add Bank Account</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <SegmentedDonut
                          segments={liquidSegments}
                          totalLabel="Total Liquid"
                          totalFormatted={`৳ ${totalCashInHand.toLocaleString('en-IN')}`}
                          size={140}
                        />
                        <View style={{ marginTop: 4, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284C7' }}>
                            (৳ {(totalCashInHand / 100000).toFixed(2)} Lakhs)
                          </Text>
                        </View>
                        {/* List of active bank accounts */}
                        {bankAccounts.length > 0 && (
                          <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 }}>
                            {bankAccounts.slice(0, 4).map((b) => (
                              <View key={b.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: b.color || '#0284C7' }} />
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{b.bankName}</Text>
                                  <Text style={{ fontSize: 11, color: '#64748B' }}>({b.accountNumber ? b.accountNumber.slice(-4) : '****'})</Text>
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>
                                  ৳ {b.currentBalance.toLocaleString('en-IN')}
                                </Text>
                              </View>
                            ))}
                            {bankAccounts.length > 4 && (
                              <TouchableOpacity onPress={() => setActiveTab('accounts')} style={{ marginTop: 4 }}>
                                <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: '700', textAlign: 'right' }}>
                                  View all {bankAccounts.length} accounts →
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>

                <View style={[styles.gridCol, isDesktop && styles.colHalf]}>
                  <View style={styles.whiteCard}>
                    <View style={styles.cardHeaderRow}>
                      <Ionicons name="card-outline" size={16} color="#DC2626" />
                      <Text style={[styles.cardLabel, { color: '#DC2626' }]}>
                        OUTSTANDING LOAN LIABILITIES & DEBT LOAD
                      </Text>
                    </View>
                    {loanList.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic' }}>
                          No debt liabilities recorded. Complete peace of mind.
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
                  </View>
                </View>
              </View>

              {/* 6. Responsive 2-Column Grid: Cash Inflow & Expense Outflow */}
              <View style={[styles.gridRow, isDesktop && styles.gridRowTwoCol]}>
                <View style={[styles.gridCol, isDesktop && styles.colHalf]}>
                  <View style={styles.whiteCard}>
                    <FlowBreakdownBar
                      items={currentIncomeItems}
                      total={totalCurrentIncome}
                      title="MONTHLY CASH INFLOW & ASSET YIELD"
                      totalFormatted={`৳ ${totalCurrentIncome.toLocaleString('en-IN')}`}
                    />
                  </View>
                </View>

                <View style={[styles.gridCol, isDesktop && styles.colHalf]}>
                  <View style={styles.whiteCard}>
                    <FlowBreakdownBar
                      items={currentExpenseItems}
                      total={totalCurrentExpense}
                      title="MONTHLY OUTFLOW & DEBT SERVICE EXPENSES"
                      totalFormatted={`৳ ${totalCurrentExpense.toLocaleString('en-IN')}`}
                    />
                  </View>
                </View>
              </View>

              {/* 7. Human Capital Wealth Velocity & Time-Value */}
              <WealthVelocityCard velocity={wealthVelocity} />

              {/* 8. Principal Wealth Consultant Directives */}
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
        userProfile={user || { name: 'Rashed Zaman', avatar: '👨‍💼', id: 'rashed01' }}
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
    backgroundColor: '#F8FAFC',
  },
  appShell: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F8FAFC',
  },
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    backgroundColor: '#F1F5F9',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
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
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
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
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
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
    backgroundColor: '#F8FAFC',
  },
  dashboardContainer: {
    padding: Spacing.lg,
    paddingBottom: 100,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.md,
  },
  actionRibbon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
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
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    width: '100%',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  stockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    width: '100%',
  },
  stockCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  stockIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  stockCardHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  stockCardAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  stockCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stockCardRight: {
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  trendPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  trendPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stockTerminalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  stockTerminalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
});
