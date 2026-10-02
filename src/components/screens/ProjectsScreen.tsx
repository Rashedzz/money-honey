import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../theme';
import {
  TransactionManager,
  BankAccountItem,
  ExpenseItem,
  IncomeItem,
  CASH_IN_HAND_ID,
  subscribeToBalanceUpdates,
} from '../../services/transactionManager';

export interface ProjectItem {
  id: string;
  name: string;
  code?: string;
  category: string;
  budget: number;
  expectedRevenue?: number;
  startDate: string;
  targetDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  notes?: string;
  createdAt: number;
}

const PROJECTS_STORAGE_KEY = 'mh_user_projects';

const DEFAULT_PROJECT_CATEGORIES = [
  'Construction & Building',
  'Real Estate & Land',
  'Business Venture',
  'Agriculture & Farm',
  'Renovation & Interior',
  'Event & Wedding',
  'IT & Software Freelance',
  'Personal & Family',
  'Other',
];

interface ProjectsScreenProps {
  onBackToDashboard?: () => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ onBackToDashboard }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Projects Master State
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return [];
  });

  // Active Selected Project (null = list view)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'>('ALL');
  
  // Date Range Filter inside Project Details
  const [dateRangePreset, setDateRangePreset] = useState<'ALL_TIME' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM'>('ALL_TIME');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // Form Fields for Project
  const [pName, setPName] = useState('');
  const [pCode, setPCode] = useState('');
  const [pCategory, setPCategory] = useState(DEFAULT_PROJECT_CATEGORIES[0]);
  const [pBudget, setPBudget] = useState('');
  const [pExpectedRevenue, setPExpectedRevenue] = useState('');
  const [pStartDate, setPStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [pTargetDate, setPTargetDate] = useState('');
  const [pStatus, setPStatus] = useState<ProjectItem['status']>('ACTIVE');
  const [pNotes, setPNotes] = useState('');

  // Transaction Entry Modal inside Project
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txAccountId, setTxAccountId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');

  // Accounts
  const accounts: BankAccountItem[] = useMemo(() => {
    const _ = refreshKey;
    return TransactionManager.getAccountsWithCash();
  }, [refreshKey]);

  // Expenses & Incomes
  const expenses = useMemo(() => {
    const _ = refreshKey;
    return TransactionManager.getStoredExpenses();
  }, [refreshKey]);

  const incomes = useMemo(() => {
    const _ = refreshKey;
    return TransactionManager.getStoredIncomes();
  }, [refreshKey]);

  useEffect(() => {
    const unsub = subscribeToBalanceUpdates(() => {
      setRefreshKey((k) => k + 1);
    });
    return () => unsub();
  }, []);

  const saveProjects = (newList: ProjectItem[]) => {
    setProjects(newList);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(newList));
      }
    } catch (e) {}
  };

  const handleOpenNewProject = () => {
    setEditingProject(null);
    setPName('');
    setPCode(`PRJ-${Math.floor(100 + Math.random() * 900)}`);
    setPCategory(DEFAULT_PROJECT_CATEGORIES[0]);
    setPBudget('');
    setPExpectedRevenue('');
    setPStartDate(new Date().toISOString().split('T')[0]);
    setPTargetDate('');
    setPStatus('ACTIVE');
    setPNotes('');
    setProjectModalVisible(true);
  };

  const handleEditProject = (prj: ProjectItem) => {
    setEditingProject(prj);
    setPName(prj.name);
    setPCode(prj.code || '');
    setPCategory(prj.category);
    setPBudget(String(prj.budget || ''));
    setPExpectedRevenue(String(prj.expectedRevenue || ''));
    setPStartDate(prj.startDate);
    setPTargetDate(prj.targetDate || '');
    setPStatus(prj.status);
    setPNotes(prj.notes || '');
    setProjectModalVisible(true);
  };

  const handleSaveProject = () => {
    if (!pName.trim()) {
      Alert.alert('Required', 'Please enter a project title.');
      return;
    }

    const budgetNum = parseFloat(pBudget.replace(/,/g, '')) || 0;
    const revNum = parseFloat(pExpectedRevenue.replace(/,/g, '')) || 0;

    if (editingProject) {
      const updated = projects.map((p) =>
        p.id === editingProject.id
          ? {
              ...p,
              name: pName.trim(),
              code: pCode.trim(),
              category: pCategory,
              budget: budgetNum,
              expectedRevenue: revNum,
              startDate: pStartDate,
              targetDate: pTargetDate || undefined,
              status: pStatus,
              notes: pNotes.trim() || undefined,
            }
          : p
      );
      saveProjects(updated);
    } else {
      const newPrj: ProjectItem = {
        id: `PRJ-${Date.now()}`,
        name: pName.trim(),
        code: pCode.trim() || `PRJ-${Math.floor(100 + Math.random() * 900)}`,
        category: pCategory,
        budget: budgetNum,
        expectedRevenue: revNum,
        startDate: pStartDate,
        targetDate: pTargetDate || undefined,
        status: pStatus,
        notes: pNotes.trim() || undefined,
        createdAt: Date.now(),
      };
      saveProjects([newPrj, ...projects]);
    }

    setProjectModalVisible(false);
  };

  const handleDeleteProject = (id: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to remove this project? Its existing transactions will remain in your bank register.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const next = projects.filter((p) => p.id !== id);
            saveProjects(next);
            if (selectedProjectId === id) setSelectedProjectId(null);
          },
        },
      ]
    );
  };

  // Transaction Entry inside Project
  const handleOpenAddTx = (type: 'INCOME' | 'EXPENSE') => {
    setTxType(type);
    setTxTitle('');
    setTxAmount('');
    setTxCategory(type === 'INCOME' ? 'Project Revenue' : 'Project Cost');
    setTxAccountId(accounts[0]?.id || CASH_IN_HAND_ID);
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxNotes('');
    setTxModalVisible(true);
  };

  const handleSaveTransaction = () => {
    if (!txTitle.trim() || !txAmount.trim()) {
      Alert.alert('Required', 'Please enter a title and amount.');
      return;
    }

    const amt = parseFloat(txAmount.replace(/,/g, '')) || 0;
    if (amt <= 0) {
      Alert.alert('Invalid Amount', 'Amount must be greater than 0.');
      return;
    }

    if (!selectedProjectId) return;

    if (txType === 'INCOME') {
      TransactionManager.recordIncome({
        title: txTitle.trim(),
        amount: amt,
        category: txCategory || 'Project Revenue',
        accountId: txAccountId,
        date: txDate,
        projectId: selectedProjectId,
        notes: txNotes.trim() || undefined,
      });
    } else {
      TransactionManager.recordExpense({
        title: txTitle.trim(),
        amount: amt,
        category: txCategory || 'Project Cost',
        accountId: txAccountId,
        date: txDate,
        projectId: selectedProjectId,
        notes: txNotes.trim() || undefined,
      });
    }

    setTxModalVisible(false);
    setRefreshKey((k) => k + 1);
  };

  // Selected Project Details & Calculations
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Project Transactions filtered by Project ID and Date Range
  const projectTransactions = useMemo(() => {
    if (!selectedProjectId) return { incomes: [], expenses: [], all: [] };

    let pIncomes = incomes.filter((i) => i.projectId === selectedProjectId);
    let pExpenses = expenses.filter((e) => e.projectId === selectedProjectId);

    if (startDate) {
      pIncomes = pIncomes.filter((i) => i.date >= startDate);
      pExpenses = pExpenses.filter((e) => e.date >= startDate);
    }
    if (endDate) {
      pIncomes = pIncomes.filter((i) => i.date <= endDate);
      pExpenses = pExpenses.filter((e) => e.date <= endDate);
    }

    const all = [
      ...pIncomes.map((i) => ({ ...i, txType: 'INCOME' as const })),
      ...pExpenses.map((e) => ({ ...e, txType: 'EXPENSE' as const })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    return { incomes: pIncomes, expenses: pExpenses, all };
  }, [selectedProjectId, incomes, expenses, startDate, endDate]);

  const totalProjectIncome = useMemo(() => {
    return projectTransactions.incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  }, [projectTransactions.incomes]);

  const totalProjectExpense = useMemo(() => {
    return projectTransactions.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [projectTransactions.expenses]);

  const netProjectProfit = totalProjectIncome - totalProjectExpense;
  const projectRoi = totalProjectExpense > 0 ? (netProjectProfit / totalProjectExpense) * 100 : 0;
  const budgetUtilization = (selectedProject?.budget || 0) > 0
    ? (totalProjectExpense / selectedProject!.budget) * 100
    : 0;

  // Print Project Report
  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    } else {
      Alert.alert('Print Report', 'Connect to a printer or use web export.');
    }
  };

  // PDF Export
  const handleExportPdf = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    } else {
      Alert.alert('Export PDF', 'PDF download available in web view.');
    }
  };

  // Share Project Summary
  const handleShare = async () => {
    if (!selectedProject) return;
    const summaryText = `📊 Project Financial Statement: ${selectedProject.name} (${selectedProject.code || ''})\n` +
      `Category: ${selectedProject.category}\n` +
      `Budget: ৳ ${selectedProject.budget.toLocaleString('en-IN')}\n` +
      `Total Income: ৳ ${totalProjectIncome.toLocaleString('en-IN')}\n` +
      `Total Expense: ৳ ${totalProjectExpense.toLocaleString('en-IN')}\n` +
      `Net Profit/Loss: ${netProjectProfit >= 0 ? '+' : '−'}৳ ${Math.abs(netProjectProfit).toLocaleString('en-IN')}\n` +
      `ROI: ${projectRoi.toFixed(1)}%\n` +
      `Status: ${selectedProject.status}\n` +
      `Generated from Money-Honey Personal Finance.`;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(summaryText);
        Alert.alert('Copied!', 'Project financial summary copied to clipboard.');
      } catch (e) {
        Alert.alert('Summary', summaryText);
      }
    } else {
      Alert.alert('Project Summary', summaryText);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Toolbar */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          {selectedProjectId ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedProjectId(null)} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={18} color="#0F172A" />
            </TouchableOpacity>
          ) : (
            onBackToDashboard && (
              <TouchableOpacity style={styles.backBtn} onPress={onBackToDashboard} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={18} color="#0F172A" />
              </TouchableOpacity>
            )
          )}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.title}>
                {selectedProject ? selectedProject.name : 'Projects & Ventures'}
              </Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>
                  {selectedProject ? selectedProject.status : `${projects.length} Active`}
                </Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              {selectedProject
                ? `${selectedProject.category} • Budget: ৳ ${selectedProject.budget.toLocaleString('en-IN')}`
                : 'Track project-specific budgets, expenses, revenues, and net ROI'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {selectedProject ? (
            <>
              <TouchableOpacity style={styles.iconActionBtn} onPress={handlePrint} activeOpacity={0.8}>
                <Ionicons name="print-outline" size={16} color="#475569" />
                <Text style={styles.iconActionText}>Print</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconActionBtn} onPress={handleExportPdf} activeOpacity={0.8}>
                <Ionicons name="document-text-outline" size={16} color="#475569" />
                <Text style={styles.iconActionText}>PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconActionBtn} onPress={handleShare} activeOpacity={0.8}>
                <Ionicons name="share-social-outline" size={16} color="#475569" />
                <Text style={styles.iconActionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconActionBtn, { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }]}
                onPress={() => handleOpenAddTx('INCOME')}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={16} color="#16A34A" />
                <Text style={[styles.iconActionText, { color: '#15803D', fontWeight: '800' }]}>+ Income</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconActionBtn, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}
                onPress={() => handleOpenAddTx('EXPENSE')}
                activeOpacity={0.85}
              >
                <Ionicons name="remove" size={16} color="#DC2626" />
                <Text style={[styles.iconActionText, { color: '#DC2626', fontWeight: '800' }]}>+ Expense</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.primaryActionBtn} onPress={handleOpenNewProject} activeOpacity={0.85}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>New Project</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. MAIN VIEW SWITCHER: LIST VIEW VS DETAIL VIEW */}
      {!selectedProject ? (
        /* ================= LIST VIEW ================= */
        <ScrollView contentContainerStyle={styles.listContent}>
          {/* Filter Bar */}
          <View style={styles.filterRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search projects by name, code, or category..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.statusToggleGroup}>
              {(['ALL', 'ACTIVE', 'COMPLETED', 'ON_HOLD'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusBtn, statusFilter === s && styles.statusBtnActive]}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text style={[styles.statusBtnText, statusFilter === s && styles.statusBtnTextActive]}>
                    {s === 'ALL' ? 'All' : s.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Project Cards Grid */}
          {projects.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="briefcase-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Projects Created Yet</Text>
              <Text style={styles.emptySub}>
                Create a project (e.g. Home Construction, Land Purchase, Business Startup) to track dedicated incomes and expenses.
              </Text>
              <TouchableOpacity style={styles.createFirstBtn} onPress={handleOpenNewProject}>
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.createFirstBtnText}>Create Your First Project</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.projectGrid}>
              {projects
                .filter((p) => {
                  if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    return p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q)) || p.category.toLowerCase().includes(q);
                  }
                  return true;
                })
                .map((prj) => {
                  const prjIncomes = incomes.filter((i) => i.projectId === prj.id).reduce((s, i) => s + (i.amount || 0), 0);
                  const prjExpenses = expenses.filter((e) => e.projectId === prj.id).reduce((s, e) => s + (e.amount || 0), 0);
                  const net = prjIncomes - prjExpenses;
                  const spentPct = prj.budget > 0 ? (prjExpenses / prj.budget) * 100 : 0;

                  return (
                    <TouchableOpacity
                      key={prj.id}
                      style={styles.projectCard}
                      onPress={() => setSelectedProjectId(prj.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.cardTopRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.projectCardCode}>{prj.code || 'PRJ'}</Text>
                            <View style={[styles.statusBadge, prj.status === 'ACTIVE' ? styles.statusActive : prj.status === 'COMPLETED' ? styles.statusCompleted : styles.statusHold]}>
                              <Text style={styles.statusBadgeText}>{prj.status}</Text>
                            </View>
                          </View>
                          <Text style={styles.projectCardTitle}>{prj.name}</Text>
                          <Text style={styles.projectCardCategory}>{prj.category}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.cardMenuBtn}
                          onPress={() => handleEditProject(prj)}
                        >
                          <Ionicons name="create-outline" size={17} color="#64748B" />
                        </TouchableOpacity>
                      </View>

                      {/* Financial KPI Numbers */}
                      <View style={styles.cardFinancials}>
                        <View style={styles.finCol}>
                          <Text style={styles.finLabel}>INCOMES</Text>
                          <Text style={[styles.finVal, { color: '#16A34A' }]}>
                            +৳ {prjIncomes.toLocaleString('en-IN')}
                          </Text>
                        </View>

                        <View style={styles.finCol}>
                          <Text style={styles.finLabel}>EXPENSES</Text>
                          <Text style={[styles.finVal, { color: '#EF4444' }]}>
                            −৳ {prjExpenses.toLocaleString('en-IN')}
                          </Text>
                        </View>

                        <View style={styles.finCol}>
                          <Text style={styles.finLabel}>NET P&L</Text>
                          <Text style={[styles.finVal, { color: net >= 0 ? '#16A34A' : '#EF4444' }]}>
                            {net >= 0 ? '+' : '−'}৳ {Math.abs(net).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>

                      {/* Budget Utilization Bar */}
                      {prj.budget > 0 && (
                        <View style={styles.budgetBarContainer}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={styles.budgetBarLabel}>Budget Spent: {spentPct.toFixed(1)}%</Text>
                            <Text style={styles.budgetBarTarget}>Total: ৳ {prj.budget.toLocaleString('en-IN')}</Text>
                          </View>
                          <View style={styles.progressBarTrack}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${Math.min(100, spentPct)}%`,
                                  backgroundColor: spentPct > 100 ? '#DC2626' : spentPct > 80 ? '#D97706' : '#0F172A',
                                },
                              ]}
                            />
                          </View>
                        </View>
                      )}

                      {/* Footer: Timeline & Open Link */}
                      <View style={styles.cardFooter}>
                        <Text style={styles.timelineText}>
                          Started: {prj.startDate} {prj.targetDate ? `• Target: ${prj.targetDate}` : ''}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.openDetailText}>Open Details</Text>
                          <Ionicons name="arrow-forward" size={13} color="#0F172A" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </View>
          )}
        </ScrollView>
      ) : (
        /* ================= DETAIL / LEDGER VIEW ================= */
        <ScrollView contentContainerStyle={styles.detailContent}>
          {/* Executive KPI Bar */}
          <View style={styles.detailKpiBar}>
            <View style={styles.detailKpiItem}>
              <Text style={styles.detailKpiLabel}>PROJECT BUDGET</Text>
              <Text style={styles.detailKpiVal}>৳ {selectedProject.budget.toLocaleString('en-IN')}</Text>
              <Text style={styles.detailKpiSub}>Spent: {budgetUtilization.toFixed(1)}%</Text>
            </View>

            <View style={styles.kpiDivider} />

            <View style={styles.detailKpiItem}>
              <Text style={[styles.detailKpiLabel, { color: '#16A34A' }]}>TOTAL INCOMES</Text>
              <Text style={[styles.detailKpiVal, { color: '#16A34A' }]}>+৳ {totalProjectIncome.toLocaleString('en-IN')}</Text>
              <Text style={styles.detailKpiSub}>{projectTransactions.incomes.length} Inflow Records</Text>
            </View>

            <View style={styles.kpiDivider} />

            <View style={styles.detailKpiItem}>
              <Text style={[styles.detailKpiLabel, { color: '#EF4444' }]}>TOTAL EXPENSES</Text>
              <Text style={[styles.detailKpiVal, { color: '#EF4444' }]}>−৳ {totalProjectExpense.toLocaleString('en-IN')}</Text>
              <Text style={styles.detailKpiSub}>{projectTransactions.expenses.length} Outflow Records</Text>
            </View>

            <View style={styles.kpiDivider} />

            <View style={styles.detailKpiItem}>
              <Text style={[styles.detailKpiLabel, { color: '#0F172A' }]}>NET PROFIT / ROI</Text>
              <Text style={[styles.detailKpiVal, { color: netProjectProfit >= 0 ? '#16A34A' : '#EF4444' }]}>
                {netProjectProfit >= 0 ? '+' : '−'}৳ {Math.abs(netProjectProfit).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.detailKpiSub}>ROI: {projectRoi.toFixed(1)}%</Text>
            </View>
          </View>

          {/* Date Range Selector Bar */}
          <View style={styles.filterCard}>
            <View style={styles.presetsRow}>
              <Text style={styles.filterLabel}>DATE FILTER:</Text>
              {(['ALL_TIME', 'THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR'] as const).map((p) => {
                const labels: Record<string, string> = {
                  ALL_TIME: 'All Time',
                  THIS_MONTH: 'This Month',
                  LAST_MONTH: 'Last Month',
                  THIS_YEAR: 'This Year',
                };
                const isActive = dateRangePreset === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.presetBtn, isActive && styles.presetBtnActive]}
                    onPress={() => {
                      setDateRangePreset(p);
                      const now = new Date();
                      const y = now.getFullYear();
                      const m = now.getMonth();
                      if (p === 'ALL_TIME') {
                        setStartDate('');
                        setEndDate('');
                      } else if (p === 'THIS_MONTH') {
                        setStartDate(`${y}-${String(m + 1).padStart(2, '0')}-01`);
                        const lastDay = new Date(y, m + 1, 0).getDate();
                        setEndDate(`${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
                      } else if (p === 'LAST_MONTH') {
                        const prev = new Date(y, m - 1, 1);
                        const py = prev.getFullYear();
                        const pm = prev.getMonth();
                        setStartDate(`${py}-${String(pm + 1).padStart(2, '0')}-01`);
                        const lastDay = new Date(py, pm + 1, 0).getDate();
                        setEndDate(`${py}-${String(pm + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
                      } else if (p === 'THIS_YEAR') {
                        setStartDate(`${y}-01-01`);
                        setEndDate(`${y}-12-31`);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetBtnText, isActive && styles.presetBtnTextActive]}>
                      {labels[p]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Transactions Ledger Table */}
          <View style={styles.ledgerCard}>
            <View style={styles.ledgerHeaderRow}>
              <Text style={styles.ledgerHeaderTitle}>
                Project Ledger ({projectTransactions.all.length} Records)
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#16A34A', paddingVertical: 5 }]}
                  onPress={() => handleOpenAddTx('INCOME')}
                >
                  <Text style={[styles.primaryActionText, { fontSize: 11 }]}>+ Add Income</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#EF4444', paddingVertical: 5 }]}
                  onPress={() => handleOpenAddTx('EXPENSE')}
                >
                  <Text style={[styles.primaryActionText, { fontSize: 11 }]}>+ Add Expense</Text>
                </TouchableOpacity>
              </View>
            </View>

            {projectTransactions.all.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic' }}>
                  No transactions recorded yet for this project.
                </Text>
              </View>
            ) : (
              projectTransactions.all.map((tx: any, idx) => {
                const isIncome = tx.txType === 'INCOME';
                return (
                  <View key={tx.id} style={[styles.ledgerRow, idx % 2 === 0 && styles.ledgerRowEven]}>
                    <View style={styles.txDateCol}>
                      <Text style={styles.txDateText}>{tx.date}</Text>
                      <View style={[styles.txTypeBadge, isIncome ? styles.typeBadgeIncome : styles.typeBadgeExpense]}>
                        <Text style={[styles.txTypeBadgeText, isIncome ? { color: '#16A34A' } : { color: '#DC2626' }]}>
                          {isIncome ? 'INCOME' : 'EXPENSE'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                      <Text style={styles.txTitleText}>{tx.title}</Text>
                      <Text style={styles.txCategoryText}>
                        {tx.category} • {isIncome ? `Credited: ${tx.destinationAccount || 'Account'}` : `Paid via: ${tx.paymentMethod || 'Account'}`}
                      </Text>
                      {tx.notes ? <Text style={styles.txNotesText}>Note: {tx.notes}</Text> : null}
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.txAmountText, isIncome ? { color: '#16A34A' } : { color: '#EF4444' }]}>
                        {isIncome ? '+' : '−'}৳ {tx.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* 3. MODAL: CREATE / EDIT PROJECT */}
      <Modal visible={projectModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </Text>
              <TouchableOpacity onPress={() => setProjectModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>PROJECT NAME *</Text>
                <TextInput
                  style={styles.formInput}
                  value={pName}
                  onChangeText={setPName}
                  placeholder="e.g. Uttara Commercial Building"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formRowTwo}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>PROJECT CODE</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pCode}
                    onChangeText={setPCode}
                    placeholder="e.g. PRJ-101"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>STATUS</Text>
                  <View style={styles.formToggleRow}>
                    {(['ACTIVE', 'COMPLETED', 'ON_HOLD'] as const).map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.formMiniToggle, pStatus === st && styles.formMiniToggleActive]}
                        onPress={() => setPStatus(st)}
                      >
                        <Text style={[styles.formMiniToggleText, pStatus === st && styles.formMiniToggleTextActive]}>
                          {st === 'ON_HOLD' ? 'Hold' : st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {DEFAULT_PROJECT_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catPill, pCategory === cat && styles.catPillActive]}
                        onPress={() => setPCategory(cat)}
                      >
                        <Text style={[styles.catPillText, pCategory === cat && styles.catPillTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formRowTwo}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>TOTAL BUDGET (৳)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pBudget}
                    onChangeText={setPBudget}
                    placeholder="e.g. 5,000,000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>EXPECTED REVENUE (৳)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pExpectedRevenue}
                    onChangeText={setPExpectedRevenue}
                    placeholder="e.g. 7,500,000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formRowTwo}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>START DATE</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pStartDate}
                    onChangeText={setPStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>TARGET DATE</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pTargetDate}
                    onChangeText={setPTargetDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>PROJECT NOTES & SCOPE</Text>
                <TextInput
                  style={[styles.formInput, { height: 60 }]}
                  value={pNotes}
                  onChangeText={setPNotes}
                  placeholder="Key deliverables, location, or contractor details..."
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooterRow}>
              {editingProject && (
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#FEE2E2' }]}
                  onPress={() => handleDeleteProject(editingProject.id)}
                >
                  <Text style={[styles.modalActionText, { color: '#DC2626' }]}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#F1F5F9' }]}
                onPress={() => setProjectModalVisible(false)}
              >
                <Text style={[styles.modalActionText, { color: '#475569' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#0F172A', flex: 1 }]}
                onPress={handleSaveProject}
              >
                <Text style={[styles.modalActionText, { color: '#FFFFFF', fontWeight: '800' }]}>Save Project</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. MODAL: ADD PROJECT TRANSACTION (INCOME OR EXPENSE) */}
      <Modal visible={txModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {txType === 'INCOME' ? 'Add Project Income' : 'Add Project Expense'}
              </Text>
              <TouchableOpacity onPress={() => setTxModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>TRANSACTION TITLE *</Text>
                <TextInput
                  style={styles.formInput}
                  value={txTitle}
                  onChangeText={setTxTitle}
                  placeholder={txType === 'INCOME' ? 'e.g. Client Milestone Payout #1' : 'e.g. Cement & Steel Supplier Payment'}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formRowTwo}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>AMOUNT (৳) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={txAmount}
                    onChangeText={setTxAmount}
                    placeholder="e.g. 50,000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>DATE</Text>
                  <TextInput
                    style={styles.formInput}
                    value={txDate}
                    onChangeText={setTxDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {txType === 'INCOME' ? 'CREDIT INTO ACCOUNT' : 'PAY FROM ACCOUNT'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {accounts.map((acc) => {
                      const isSel = txAccountId === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={[styles.accountPill, isSel && styles.accountPillActive]}
                          onPress={() => setTxAccountId(acc.id)}
                        >
                          <Text style={[styles.accountPillText, isSel && styles.accountPillTextActive]}>
                            {acc.bankName} (৳{acc.currentBalance.toLocaleString('en-IN')})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>CATEGORY</Text>
                <TextInput
                  style={styles.formInput}
                  value={txCategory}
                  onChangeText={setTxCategory}
                  placeholder="e.g. Materials, Contractor Fee, Revenue"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>NOTES</Text>
                <TextInput
                  style={styles.formInput}
                  value={txNotes}
                  onChangeText={setTxNotes}
                  placeholder="Invoice number, vendor name, or voucher..."
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#F1F5F9' }]}
                onPress={() => setTxModalVisible(false)}
              >
                <Text style={[styles.modalActionText, { color: '#475569' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: txType === 'INCOME' ? '#16A34A' : '#EF4444', flex: 1 }]}
                onPress={handleSaveTransaction}
              >
                <Text style={[styles.modalActionText, { color: '#FFFFFF', fontWeight: '800' }]}>
                  Record {txType === 'INCOME' ? 'Income' : 'Expense'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: '#F8FAFC',
    maxWidth: 1600,
    alignSelf: 'center',
    width: '100%',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7.5,
    borderRadius: Radius.full,
    backgroundColor: '#0F172A',
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  listContent: {
    gap: Spacing.md,
    paddingBottom: 40,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    minWidth: 260,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  statusToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  statusBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  statusBtnTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 450,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    marginTop: 10,
  },
  createFirstBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  projectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    flex: 1,
    minWidth: 320,
    maxWidth: 500,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  projectCardCode: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  projectCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  projectCardCategory: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  cardMenuBtn: {
    padding: 6,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusCompleted: {
    backgroundColor: '#E0F2FE',
  },
  statusHold: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardFinancials: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  finCol: {
    flex: 1,
  },
  finLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  finVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  budgetBarContainer: {
    marginTop: 2,
  },
  budgetBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  budgetBarTarget: {
    fontSize: 11,
    color: '#64748B',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  timelineText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  openDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailContent: {
    gap: Spacing.md,
    paddingBottom: 40,
  },
  detailKpiBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailKpiItem: {
    flex: 1,
    minWidth: 140,
  },
  detailKpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  detailKpiVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  detailKpiSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
  },
  presetBtnActive: {
    backgroundColor: '#0F172A',
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  presetBtnTextActive: {
    color: '#FFFFFF',
  },
  ledgerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  ledgerHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ledgerRowEven: {
    backgroundColor: '#FAFAFA',
  },
  txDateCol: {
    width: 90,
  },
  txDateText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  txTypeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  typeBadgeIncome: {
    backgroundColor: '#DCFCE7',
  },
  typeBadgeExpense: {
    backgroundColor: '#FEE2E2',
  },
  txTypeBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  txTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  txCategoryText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  txNotesText: {
    fontSize: 10.5,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 1,
  },
  txAmountText: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    maxWidth: 580,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
  },
  formGroup: {
    marginBottom: 12,
  },
  formRowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  formInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontSize: 13,
    color: '#0F172A',
  },
  formToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    padding: 2,
  },
  formMiniToggle: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  formMiniToggleActive: {
    backgroundColor: '#FFFFFF',
  },
  formMiniToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  formMiniToggleTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  accountPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accountPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  accountPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  accountPillTextActive: {
    color: '#FFFFFF',
  },
  modalFooterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  modalActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
