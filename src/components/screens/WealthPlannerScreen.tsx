import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import {
  PaperAssetsManager,
  addMonthsToDateStr,
  calculateDaysLeftToDate,
  calculateDpsMaturityEstimate,
} from '../../services/paperAssetsManager';
import { TransactionManager, subscribeToBalanceUpdates } from '../../services/transactionManager';
import { calculateEMI } from '../../finance/amortization';
import { showAppAlert, showToast } from '../shared/GlobalDialogHost';

export interface SavingsGoalItem {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  createdAt: string;
}

const GOALS_STORAGE_KEY = 'mh_user_goals';

function loadGoals(): SavingsGoalItem[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(GOALS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (e) {}
  return [];
}

function saveGoals(list: SavingsGoalItem[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {}
}

type PlannerTab = 'calculators' | 'goals' | 'zakat' | 'guide';

interface WealthPlannerScreenProps {
  stocksValue?: number;
  physicalAssetsValue?: number;
  loansTotal?: number;
  onNavigateToSavings?: () => void;
}

export const WealthPlannerScreen: React.FC<WealthPlannerScreenProps> = ({
  stocksValue = 0,
  physicalAssetsValue = 0,
  loansTotal = 0,
  onNavigateToSavings,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 680;

  const [activeTab, setActiveTab] = useState<PlannerTab>('calculators');
  const [refreshTick, setRefreshTick] = useState(0);

  // ==================== GOALS STATE ====================
  const [goals, setGoals] = useState<SavingsGoalItem[]>(() => loadGoals());
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [gTitle, setGTitle] = useState('');
  const [gCategory, setGCategory] = useState('Emergency Fund');
  const [gTarget, setGTarget] = useState('');
  const [gSaved, setGSaved] = useState('');
  const [gMonths, setGMonths] = useState('12');
  const [gDate, setGDate] = useState(() =>
    addMonthsToDateStr(new Date().toISOString().slice(0, 10), 12)
  );
  const [depositInputs, setDepositInputs] = useState<Record<string, string>>({});

  // ==================== CALCULATOR STATE ====================
  const [calcMode, setCalcMode] = useState<'fdr' | 'dps' | 'loan'>('fdr');
  const [fdrPrincipal, setFdrPrincipal] = useState('500000');
  const [fdrRate, setFdrRate] = useState('9.5');
  const [fdrMonths, setFdrMonths] = useState('12');
  const [fdrTax, setFdrTax] = useState('10');
  const [fdrBankName, setFdrBankName] = useState('Sonali Bank PLC');

  const [dpsMonthly, setDpsMonthly] = useState('5000');
  const [dpsRate, setDpsRate] = useState('9.0');
  const [dpsYears, setDpsYears] = useState('5');
  const [dpsBankName, setDpsBankName] = useState('BRAC Bank PLC');

  const [loanPrincipal, setLoanPrincipal] = useState('2000000');
  const [loanRate, setLoanRate] = useState('11.0');
  const [loanYears, setLoanYears] = useState('5');

  // ==================== ZAKAT STATE ====================
  const [nisabType, setNisabType] = useState<'silver' | 'gold' | 'custom'>('silver');
  const [customNisab, setCustomNisab] = useState('165000');
  const [extraGoldCash, setExtraGoldCash] = useState('0');
  const [deductibleDebts, setDeductibleDebts] = useState(String(loansTotal || 0));

  useEffect(() => {
    const unsub1 = subscribeToBalanceUpdates(() => setRefreshTick((t) => t + 1));
    const unsub2 = PaperAssetsManager.subscribe(() => setRefreshTick((t) => t + 1));
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Live portfolio snapshot for Zakat & Health Checkup
  const portfolioSnapshot = useMemo(() => {
    const _ = refreshTick;
    const banks = TransactionManager.getAccountsWithCash();
    const cashAndBanks = banks.reduce((s, a) => s + (a.currentBalance || 0), 0);
    const paperSummary = PaperAssetsManager.getSummary();
    const incomes = TransactionManager.getStoredIncomes();
    const expenses = TransactionManager.getStoredExpenses();

    const nowMonth = new Date().toISOString().slice(0, 7);
    const monthInc = incomes
      .filter((i) => (i.date || '').startsWith(nowMonth))
      .reduce((s, i) => s + (i.amount || 0), 0);
    const monthExp = expenses
      .filter((e) => (e.date || '').startsWith(nowMonth))
      .reduce((s, e) => s + (e.amount || 0), 0);

    return {
      cashAndBanks,
      paperCapital: paperSummary.totalCapital,
      monthlyPassiveYield: paperSummary.monthlyNetYield,
      annualTaxWithheld: paperSummary.annualTaxWithheld,
      monthInc,
      monthExp,
    };
  }, [refreshTick]);

  // ==================== HANDLERS ====================
  const handleAddGoal = () => {
    const target = parseFloat(gTarget.replace(/,/g, '')) || 0;
    const saved = parseFloat(gSaved.replace(/,/g, '')) || 0;
    if (!gTitle.trim() || target <= 0) {
      showAppAlert('Missing Details', 'Please enter a Goal Name and Target Amount (৳).');
      return;
    }
    const newGoal: SavingsGoalItem = {
      id: `GOAL-${Date.now()}`,
      title: gTitle.trim(),
      category: gCategory,
      targetAmount: target,
      savedAmount: saved,
      targetDate: gDate || addMonthsToDateStr(new Date().toISOString().slice(0, 10), 12),
      createdAt: new Date().toISOString(),
    };
    const next = [newGoal, ...goals];
    setGoals(next);
    saveGoals(next);
    setGTitle('');
    setGTarget('');
    setGSaved('');
    setShowGoalForm(false);
    showToast(`Goal created: ${newGoal.title}`);
  };

  const handleDepositToGoal = (goalId: string) => {
    const raw = depositInputs[goalId] || '';
    const addAmt = parseFloat(raw.replace(/,/g, '')) || 0;
    if (addAmt <= 0) {
      showAppAlert('Enter Amount', 'Type an amount (৳) to add toward this goal.');
      return;
    }
    const next = goals.map((g) =>
      g.id === goalId ? { ...g, savedAmount: g.savedAmount + addAmt } : g
    );
    setGoals(next);
    saveGoals(next);
    setDepositInputs((prev) => ({ ...prev, [goalId]: '' }));
    showToast(`Added +৳${addAmt.toLocaleString('en-IN')} to goal!`);
  };

  const handleDeleteGoal = (goalId: string) => {
    showAppAlert('Delete Goal?', 'Remove this savings goal from your planner?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const next = goals.filter((g) => g.id !== goalId);
          setGoals(next);
          saveGoals(next);
          showToast('Goal deleted');
        },
      },
    ]);
  };

  const handleSaveSimulatedFdr = () => {
    const p = parseFloat(fdrPrincipal.replace(/,/g, '')) || 0;
    const r = parseFloat(fdrRate) || 0;
    const m = Math.max(1, parseInt(fdrMonths, 10) || 12);
    const tax = parseFloat(fdrTax) || 0;
    if (p <= 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const matDate = addMonthsToDateStr(today, m);
    const grossYr = p * (r / 100);
    const taxYr = grossYr * (tax / 100);
    const monthlyNet = Math.round((grossYr - taxYr) / 12);

    PaperAssetsManager.addOrUpdateAsset({
      id: `FDR-${Date.now()}`,
      type: 'FDR',
      bankName: fdrBankName.trim() || 'Commercial Bank',
      address: 'Main Branch',
      accountNumber: 'N/A',
      linkedAccountNo: 'N/A',
      fdrNumber: `FDR-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: p,
      openingDate: today,
      tenorMonths: m,
      maturityDate: matDate,
      profitRateYearly: r,
      sourceTaxPercent: tax,
      payoutInterval: 'At Maturity',
      monthlyReturn: monthlyNet,
      sourceTaxAnnual: Math.round(taxYr),
      closingDaysRemaining: calculateDaysLeftToDate(matDate),
    });

    showToast(`FDR saved to Savings Vault (৳${p.toLocaleString('en-IN')})`);
    if (onNavigateToSavings) onNavigateToSavings();
  };

  const handleSaveSimulatedDps = () => {
    const emi = parseFloat(dpsMonthly.replace(/,/g, '')) || 0;
    const r = parseFloat(dpsRate) || 0;
    const yrs = Math.max(1, parseFloat(dpsYears) || 5);
    if (emi <= 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const matDate = addMonthsToDateStr(today, Math.round(yrs * 12));
    const est = calculateDpsMaturityEstimate(emi, yrs, r);

    PaperAssetsManager.addOrUpdateAsset({
      id: `DPS-${Date.now()}`,
      type: 'DPS',
      bankName: dpsBankName.trim() || 'Commercial Bank',
      address: 'Main Branch',
      linkedAccountNo: 'N/A',
      dpsNumber: `DPS-${Math.floor(100000 + Math.random() * 900000)}`,
      monthlyEmi: emi,
      depositDayOfMonth: 10,
      tenorYears: yrs,
      openingDate: today,
      maturityDate: matDate,
      profitRateYearly: r,
      projectedMaturityAmount: est.maturityValue,
      totalDepositedSoFar: emi,
      closingDaysRemaining: calculateDaysLeftToDate(matDate),
      installmentsPaid: 1,
    });

    showToast(`DPS saved to Savings Vault (৳${emi.toLocaleString('en-IN')}/mo)`);
    if (onNavigateToSavings) onNavigateToSavings();
  };

  const rowStyle = isMobile ? styles.oneCol : styles.twoCol;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isMobile && { padding: 12, paddingBottom: 110 }]}
    >
      {/* Top Header & Navigation Pills */}
      <GlassCard padding={isMobile ? 16 : 20}>
        <Text style={styles.kicker}>SMART WEALTH TOOLS • MOBILE & DESKTOP</Text>
        <Text style={styles.mainTitle}>Calculators, Savings Goals, Zakat & Money Guide</Text>
        <Text style={styles.subtitle}>
          Plan FDRs, DPS, and Loan EMIs in seconds, track life goals, calculate annual Zakat & tax, and understand every financial number in plain English.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(
              [
                { id: 'calculators', label: 'FDR / DPS / Loan Calculator', icon: 'calculator-outline' },
                { id: 'goals', label: `Savings Goals (${goals.length})`, icon: 'flag-outline' },
                { id: 'zakat', label: 'Zakat & Tax Estimator', icon: 'moon-outline' },
                { id: 'guide', label: 'Health Check & Plain Guide', icon: 'bulb-outline' },
              ] as const
            ).map((t) => {
              const active = activeTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.navPill, active && styles.navPillActive]}
                  onPress={() => setActiveTab(t.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={t.icon}
                    size={15}
                    color={active ? '#FFFFFF' : '#334155'}
                  />
                  <Text style={[styles.navPillText, active && styles.navPillTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </GlassCard>

      {/* ==================== TAB 1: INTERACTIVE CALCULATORS ==================== */}
      {activeTab === 'calculators' && (
        <GlassCard padding={isMobile ? 16 : 20}>
          <View style={styles.calcSwitchRow}>
            {(
              [
                { id: 'fdr', label: 'Bank FDR Simulator' },
                { id: 'dps', label: 'Monthly DPS Simulator' },
                { id: 'loan', label: 'Loan EMI Simulator' },
              ] as const
            ).map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.calcSwitchBtn, calcMode === m.id && styles.calcSwitchBtnActive]}
                onPress={() => setCalcMode(m.id)}
              >
                <Text
                  style={[
                    styles.calcSwitchText,
                    calcMode === m.id && styles.calcSwitchTextActive,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* FDR Simulator */}
          {calcMode === 'fdr' && (() => {
            const p = parseFloat(fdrPrincipal.replace(/,/g, '')) || 0;
            const r = parseFloat(fdrRate) || 0;
            const m = Math.max(1, parseInt(fdrMonths, 10) || 12);
            const tax = parseFloat(fdrTax) || 0;

            const grossProfit = Math.round((p * (r / 100) * m) / 12);
            const taxAmount = Math.round(grossProfit * (tax / 100));
            const netProfit = grossProfit - taxAmount;
            const monthlyNet = Math.round(netProfit / m);
            const maturityTotal = p + netProfit;

            return (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.helperNote}>
                  See exactly how much net profit you receive after Government Source Tax (AIT) on any Bank Fixed Deposit (FDR).
                </Text>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>DEPOSIT AMOUNT (৳)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={fdrPrincipal}
                      onChangeText={setFdrPrincipal}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>YEARLY INTEREST RATE (%)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={fdrRate}
                      onChangeText={setFdrRate}
                    />
                  </View>
                </View>

                <Text style={styles.label}>DURATION (MONTHS)</Text>
                <View style={styles.chipRow}>
                  {[3, 6, 12, 24, 36, 60].map((mo) => (
                    <TouchableOpacity
                      key={mo}
                      style={[styles.chip, parseInt(fdrMonths, 10) === mo && styles.chipActive]}
                      onPress={() => setFdrMonths(String(mo))}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          parseInt(fdrMonths, 10) === mo && styles.chipTextActive,
                        ]}
                      >
                        {mo < 12 ? `${mo} Months` : `${mo / 12} ${mo === 12 ? 'Year' : 'Years'}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>SOURCE TAX (AIT %)</Text>
                    <View style={styles.chipRow}>
                      {['0', '5', '10', '15'].map((tx) => (
                        <TouchableOpacity
                          key={tx}
                          style={[styles.chip, fdrTax === tx && styles.chipActive]}
                          onPress={() => setFdrTax(tx)}
                        >
                          <Text style={[styles.chipText, fdrTax === tx && styles.chipTextActive]}>
                            {tx}%{tx === '10' ? ' (With TIN)' : tx === '15' ? ' (No TIN)' : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>BANK NAME (IF SAVING TO VAULT)</Text>
                    <TextInput
                      style={styles.input}
                      value={fdrBankName}
                      onChangeText={setFdrBankName}
                    />
                  </View>
                </View>

                <View style={styles.resultBox}>
                  <View style={styles.resultGrid}>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>GROSS INTEREST ({m}M)</Text>
                      <Text style={styles.resultVal}>৳ {grossProfit.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>GOVT TAX ({tax}%)</Text>
                      <Text style={[styles.resultVal, { color: '#DC2626' }]}>
                        -৳ {taxAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>NET PROFIT IN HAND</Text>
                      <Text style={[styles.resultVal, { color: '#16A34A' }]}>
                        +৳ {netProfit.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>MATURITY TOTAL</Text>
                      <Text style={styles.resultVal}>৳ {maturityTotal.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                  <Text style={styles.plainSummaryLine}>
                    Equivalent to earning <Text style={{ fontWeight: '800', color: '#16A34A' }}>+৳{monthlyNet.toLocaleString('en-IN')} every month</Text> after tax.
                  </Text>

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveSimulatedFdr}>
                    <Ionicons name="add-circle-outline" size={17} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Save This Directly to My FDR Vault</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}

          {/* DPS Simulator */}
          {calcMode === 'dps' && (() => {
            const emi = parseFloat(dpsMonthly.replace(/,/g, '')) || 0;
            const r = parseFloat(dpsRate) || 0;
            const yrs = Math.max(1, parseFloat(dpsYears) || 5);
            const est = calculateDpsMaturityEstimate(emi, yrs, r);

            return (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.helperNote}>
                  See how small monthly deposits grow into a large lump sum over 1 to 10 years.
                </Text>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>MONTHLY DEPOSIT AMOUNT (৳)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={dpsMonthly}
                      onChangeText={setDpsMonthly}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>YEARLY PROFIT RATE (%)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={dpsRate}
                      onChangeText={setDpsRate}
                    />
                  </View>
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>DURATION (YEARS)</Text>
                    <View style={styles.chipRow}>
                      {['1', '2', '3', '5', '7', '10'].map((yr) => (
                        <TouchableOpacity
                          key={yr}
                          style={[styles.chip, dpsYears === yr && styles.chipActive]}
                          onPress={() => setDpsYears(yr)}
                        >
                          <Text style={[styles.chipText, dpsYears === yr && styles.chipTextActive]}>
                            {yr} {yr === '1' ? 'Year' : 'Years'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>BANK NAME (IF SAVING TO VAULT)</Text>
                    <TextInput
                      style={styles.input}
                      value={dpsBankName}
                      onChangeText={setDpsBankName}
                    />
                  </View>
                </View>

                <View style={styles.resultBox}>
                  <View style={styles.resultGrid}>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>YOU DEPOSIT ({Math.round(yrs * 12)} MO)</Text>
                      <Text style={styles.resultVal}>
                        ৳ {est.totalDeposited.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>EST. BANK PROFIT</Text>
                      <Text style={[styles.resultVal, { color: '#16A34A' }]}>
                        +৳ {est.estimatedProfit.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>PROJECTED MATURITY</Text>
                      <Text style={[styles.resultVal, { color: '#0F172A' }]}>
                        ৳ {est.maturityValue.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveSimulatedDps}>
                    <Ionicons name="add-circle-outline" size={17} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Save This Directly to My DPS Vault</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}

          {/* Loan EMI Simulator */}
          {calcMode === 'loan' && (() => {
            const p = parseFloat(loanPrincipal.replace(/,/g, '')) || 0;
            const r = parseFloat(loanRate) || 0;
            const yrs = Math.max(1, parseFloat(loanYears) || 5);
            const months = Math.round(yrs * 12);
            const emi = Math.round(calculateEMI(p, r, months));
            const totalPaid = emi * months;
            const totalInterest = Math.max(0, totalPaid - p);

            return (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.helperNote}>
                  Check your exact monthly installment (EMI) and total bank interest cost before taking a Home, Car, or Personal Loan.
                </Text>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>LOAN AMOUNT (৳)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={loanPrincipal}
                      onChangeText={setLoanPrincipal}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>YEARLY INTEREST RATE (%)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={loanRate}
                      onChangeText={setLoanRate}
                    />
                  </View>
                </View>

                <Text style={styles.label}>REPAYMENT DURATION (YEARS)</Text>
                <View style={styles.chipRow}>
                  {['1', '2', '3', '5', '10', '15', '20'].map((yr) => (
                    <TouchableOpacity
                      key={yr}
                      style={[styles.chip, loanYears === yr && styles.chipActive]}
                      onPress={() => setLoanYears(yr)}
                    >
                      <Text style={[styles.chipText, loanYears === yr && styles.chipTextActive]}>
                        {yr} {yr === '1' ? 'Year' : 'Years'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.resultBox}>
                  <View style={styles.resultGrid}>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>MONTHLY INSTALLMENT (EMI)</Text>
                      <Text style={styles.resultVal}>৳ {emi.toLocaleString('en-IN')} / mo</Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>TOTAL INTEREST PAID</Text>
                      <Text style={[styles.resultVal, { color: '#DC2626' }]}>
                        ৳ {totalInterest.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>TOTAL REPAYMENT ({months}M)</Text>
                      <Text style={styles.resultVal}>৳ {totalPaid.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })()}
        </GlassCard>
      )}

      {/* ==================== TAB 2: SAVINGS GOALS TRACKER ==================== */}
      {activeTab === 'goals' && (
        <>
          <GlassCard padding={isMobile ? 16 : 20}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <View>
                <Text style={styles.sectionTitle}>Life & Savings Goal Planner</Text>
                <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                  Set a target amount & date — see the exact monthly amount needed to reach it.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.primaryBtnSmall}
                onPress={() => setShowGoalForm(!showGoalForm)}
              >
                <Ionicons name={showGoalForm ? 'close' : 'add'} size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>
                  {showGoalForm ? 'Close' : '+ New Savings Goal'}
                </Text>
              </TouchableOpacity>
            </View>

            {showGoalForm && (
              <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                <Text style={styles.label}>POPULAR GOAL TEMPLATES</Text>
                <View style={styles.chipRow}>
                  {[
                    'Emergency Safety Fund',
                    'Buy Car / Vehicle',
                    'Flat / Land Downpayment',
                    'Hajj / Umrah Fund',
                    'Child Education',
                    'Family Vacation',
                  ].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={[styles.chip, gTitle === preset && styles.chipActive]}
                      onPress={() => {
                        setGTitle(preset);
                        setGCategory(preset);
                      }}
                    >
                      <Text style={[styles.chipText, gTitle === preset && styles.chipTextActive]}>
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>GOAL NAME *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 6-Month Emergency Fund or Hajj 2028"
                  placeholderTextColor="#94A3B8"
                  value={gTitle}
                  onChangeText={setGTitle}
                />

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>TARGET AMOUNT (৳) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 500000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={gTarget}
                      onChangeText={setGTarget}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>ALREADY SAVED (৳)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={gSaved}
                      onChangeText={setGSaved}
                    />
                  </View>
                </View>

                <Text style={styles.label}>TARGET TIMEFRAME</Text>
                <View style={styles.chipRow}>
                  {[6, 12, 24, 36, 60].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.chip, parseInt(gMonths, 10) === m && styles.chipActive]}
                      onPress={() => {
                        setGMonths(String(m));
                        setGDate(addMonthsToDateStr(new Date().toISOString().slice(0, 10), m));
                      }}
                    >
                      <Text style={[styles.chipText, parseInt(gMonths, 10) === m && styles.chipTextActive]}>
                        {m < 12 ? `${m} Months` : `${m / 12} ${m === 12 ? 'Year' : 'Years'}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleAddGoal}>
                  <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Create Savings Goal</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>

          {goals.length === 0 ? (
            <GlassCard style={{ alignItems: 'center' }} padding={32}>
              <Ionicons name="flag-outline" size={38} color="#64748B" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 8 }}>
                No Savings Goals Created Yet
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4, maxWidth: 400 }}>
                Tap "+ New Savings Goal" above to track your progress toward an Emergency Fund, Car, Flat, Hajj, or Education fund.
              </Text>
            </GlassCard>
          ) : (
            goals.map((g) => {
              const pct = Math.min(100, Math.round((g.savedAmount / Math.max(1, g.targetAmount)) * 100));
              const remaining = Math.max(0, g.targetAmount - g.savedAmount);
              const daysLeft = calculateDaysLeftToDate(g.targetDate);
              const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
              const requiredMonthly = Math.ceil(remaining / monthsLeft);

              return (
                <GlassCard key={g.id} padding={18}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>{g.title}</Text>
                      <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        Target Date: {g.targetDate} ({daysLeft} days left)
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteGoal(g.id)}>
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>
                      Saved: ৳{g.savedAmount.toLocaleString('en-IN')} of ৳{g.targetAmount.toLocaleString('en-IN')} ({pct}%)
                    </Text>
                    <Text style={{ fontSize: 12.5, fontWeight: '800', color: remaining === 0 ? '#16A34A' : '#0F172A' }}>
                      {remaining === 0
                        ? 'Goal Reached!'
                        : `Save ~৳${requiredMonthly.toLocaleString('en-IN')}/mo`}
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>

                  {remaining > 0 && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' }}>
                      <TextInput
                        style={[styles.input, { flex: 1, paddingVertical: 8 }]}
                        placeholder="Add saved amount (৳)"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={depositInputs[g.id] || ''}
                        onChangeText={(txt) =>
                          setDepositInputs((prev) => ({ ...prev, [g.id]: txt }))
                        }
                      />
                      <TouchableOpacity
                        style={styles.primaryBtnSmall}
                        onPress={() => handleDepositToGoal(g.id)}
                      >
                        <Text style={styles.primaryBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </GlassCard>
              );
            })
          )}
        </>
      )}

      {/* ==================== TAB 3: ZAKAT & NBR TAX ESTIMATOR ==================== */}
      {activeTab === 'zakat' && (() => {
        const nisabVal =
          nisabType === 'silver'
            ? 165000
            : nisabType === 'gold'
            ? 1150000
            : parseFloat(customNisab.replace(/,/g, '')) || 165000;

        const extraVal = parseFloat(extraGoldCash.replace(/,/g, '')) || 0;
        const debtsVal = parseFloat(deductibleDebts.replace(/,/g, '')) || 0;

        const grossZakatable =
          portfolioSnapshot.cashAndBanks +
          stocksValue +
          portfolioSnapshot.paperCapital +
          extraVal;

        const netZakatable = Math.max(0, grossZakatable - debtsVal);
        const isEligible = netZakatable >= nisabVal;
        const zakatDue = isEligible ? Math.round(netZakatable * 0.025) : 0;

        return (
          <GlassCard padding={isMobile ? 16 : 20}>
            <Text style={styles.sectionTitle}>1-Click Annual Zakat & Source Tax Summary</Text>
            <Text style={styles.helperNote}>
              Automatically totals your Cash, Bank Balances, DSE Shares, FDRs, DPS & Sanchaypatra minus eligible debts to calculate 2.5% Zakat. (Personal residence/used car are excluded automatically.)
            </Text>

            <View style={styles.resultBox}>
              <View style={styles.resultGrid}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>CASH & BANK BALANCES</Text>
                  <Text style={styles.resultVal}>
                    ৳ {portfolioSnapshot.cashAndBanks.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>FDR, DPS & SANCHAYPATRA</Text>
                  <Text style={styles.resultVal}>
                    ৳ {portfolioSnapshot.paperCapital.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>STOCKS / EQUITIES</Text>
                  <Text style={styles.resultVal}>৳ {stocksValue.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>NBR TAX ALREADY DEDUCTED</Text>
                  <Text style={[styles.resultVal, { color: '#16A34A' }]}>
                    ৳ {portfolioSnapshot.annualTaxWithheld.toLocaleString('en-IN')}/yr
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.label}>NISAB THRESHOLD STANDARD</Text>
            <View style={styles.chipRow}>
              {[
                { id: 'silver', label: 'Silver Nisab (~৳1,65,000)' },
                { id: 'gold', label: 'Gold Nisab (~৳11,50,000)' },
                { id: 'custom', label: 'Custom Nisab' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.chip, nisabType === opt.id && styles.chipActive]}
                  onPress={() => setNisabType(opt.id as any)}
                >
                  <Text style={[styles.chipText, nisabType === opt.id && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {nisabType === 'custom' && (
              <>
                <Text style={styles.label}>CUSTOM NISAB AMOUNT (৳)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={customNisab}
                  onChangeText={setCustomNisab}
                />
              </>
            )}

            <View style={rowStyle}>
              <View style={styles.col}>
                <Text style={styles.label}>EXTRA GOLD / JEWELRY / MONEY LENT OUT (৳)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={extraGoldCash}
                  onChangeText={setExtraGoldCash}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>SHORT-TERM DEBTS / LOANS TO DEDUCT (৳)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={deductibleDebts}
                  onChangeText={setDeductibleDebts}
                />
              </View>
            </View>

            <View style={[styles.resultBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', marginTop: 14 }]}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#166534' }}>
                NET ZAKATABLE WEALTH: ৳ {netZakatable.toLocaleString('en-IN')}
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#0F172A', marginTop: 4 }}>
                {isEligible
                  ? `2.5% Zakat Payable: ৳ ${zakatDue.toLocaleString('en-IN')}`
                  : 'Below Nisab Threshold (৳ 0 Zakat Due)'}
              </Text>
              <Text style={{ fontSize: 12.5, color: '#14532D', marginTop: 4 }}>
                {isEligible
                  ? `Monthly Zakat equivalent if paid across 12 months: ~৳ ${Math.ceil(zakatDue / 12).toLocaleString('en-IN')}/month.`
                  : 'Your net zakatable wealth is currently below the selected Nisab threshold.'}
              </Text>
            </View>
          </GlassCard>
        );
      })()}

      {/* ==================== TAB 4: PLAIN-ENGLISH HEALTH CHECK & GLOSSARY ==================== */}
      {activeTab === 'guide' && (() => {
        const monthlyBenchmark = Math.max(25000, portfolioSnapshot.monthExp || 35000);
        const emergencyMonths = (portfolioSnapshot.cashAndBanks / monthlyBenchmark).toFixed(1);
        const totalAssetsAll =
          portfolioSnapshot.cashAndBanks +
          portfolioSnapshot.paperCapital +
          stocksValue +
          physicalAssetsValue;
        const debtRatio =
          totalAssetsAll > 0 ? Math.round((loansTotal / totalAssetsAll) * 100) : 0;

        const dictionary = [
          {
            term: 'FDR (Fixed Deposit Receipt)',
            meaning:
              'You deposit a lump sum in a bank for a fixed period (3 months to 5 years) to earn guaranteed interest.',
          },
          {
            term: 'DPS (Deposit Pension Scheme)',
            meaning:
              'You deposit a fixed amount every month (e.g. ৳5,000/month) and get all your deposits plus bonus profit at maturity.',
          },
          {
            term: 'Sanchaypatra (Govt. Savings Certificate)',
            meaning:
              'Government-backed savings paying profit every 1 or 3 months directly into your bank account.',
          },
          {
            term: 'Source Tax / AIT (Advance Income Tax)',
            meaning:
              '5% to 15% tax automatically deducted by banks on FDR or Sanchaypatra profits before crediting your account.',
          },
          {
            term: 'Net Worth',
            meaning:
              'Everything you own (Cash + Banks + FDR/DPS + Stocks + Land/Gold) minus any Loans you owe.',
          },
          {
            term: 'Daily Cash Book (Incomes − Expenses)',
            meaning:
              'Two-sided ledger showing Opening Balance + Money In on the left and Money Spent + Closing Balance on the right.',
          },
          {
            term: 'EMI (Equated Monthly Installment)',
            meaning:
              'The fixed monthly amount paid back to a bank to gradually clear both loan principal and interest.',
          },
        ];

        return (
          <View style={{ gap: 12 }}>
            <GlassCard padding={isMobile ? 16 : 20}>
              <Text style={styles.sectionTitle}>Plain-English Financial Health Checkup</Text>
              <View style={[styles.resultGrid, { marginTop: 12 }]}>
                <View style={styles.healthBox}>
                  <Text style={styles.resultLabel}>1. EMERGENCY SAFETY CUSHION</Text>
                  <Text style={styles.resultVal}>{emergencyMonths} Months</Text>
                  <Text style={styles.healthTip}>
                    Your Cash & Bank money can cover ~{emergencyMonths} months of living costs (6+ months is ideal).
                  </Text>
                </View>

                <View style={styles.healthBox}>
                  <Text style={styles.resultLabel}>2. PASSIVE MONTHLY PROFIT</Text>
                  <Text style={[styles.resultVal, { color: '#16A34A' }]}>
                    +৳ {portfolioSnapshot.monthlyPassiveYield.toLocaleString('en-IN')}/mo
                  </Text>
                  <Text style={styles.healthTip}>
                    Automatic monthly income earned from your Sanchaypatra & Bank FDR investments.
                  </Text>
                </View>

                <View style={styles.healthBox}>
                  <Text style={styles.resultLabel}>3. LOAN BURDEN VS ASSETS</Text>
                  <Text style={[styles.resultVal, { color: debtRatio > 40 ? '#DC2626' : '#16A34A' }]}>
                    {debtRatio}% Debt Ratio
                  </Text>
                  <Text style={styles.healthTip}>
                    {loansTotal === 0
                      ? 'You are 100% debt-free!'
                      : `Loans equal ${debtRatio}% of your total assets (under 30% is considered very safe).`}
                  </Text>
                </View>
              </View>
            </GlassCard>

            <GlassCard padding={isMobile ? 16 : 20}>
              <Text style={styles.sectionTitle}>Simple Money Dictionary (Zero Jargon)</Text>
              <View style={{ marginTop: 10, gap: 10 }}>
                {dictionary.map((d) => (
                  <View key={d.term} style={styles.dictRow}>
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A' }}>
                      {d.term}
                    </Text>
                    <Text style={{ fontSize: 12.5, color: '#475569', marginTop: 2, lineHeight: 18 }}>
                      {d.meaning}
                    </Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </View>
        );
      })()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.7,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    lineHeight: 19,
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  navPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  navPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  navPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calcSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: Radius.md,
    flexWrap: 'wrap',
    gap: 4,
  },
  calcSwitchBtn: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  calcSwitchBtnActive: {
    backgroundColor: '#0F172A',
  },
  calcSwitchText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  calcSwitchTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  helperNote: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 13,
    paddingVertical: 10.5,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  oneCol: {
    flexDirection: 'column',
    gap: 2,
  },
  col: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  resultBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 16,
    marginTop: 14,
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  resultItem: {
    flex: 1,
    minWidth: 135,
  },
  resultLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  resultVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 3,
  },
  plainSummaryLine: {
    fontSize: 13,
    color: '#334155',
    marginTop: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    marginTop: 14,
  },
  primaryBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#0F172A',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  primaryBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  healthBox: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 14,
  },
  healthTip: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 17,
  },
  dictRow: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 12,
  },
});
