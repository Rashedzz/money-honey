import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { GlassCard } from '../../src/components/shared/GlassCard';
import {
  calculateEMI,
  generateAmortizationSchedule,
  AmortizationRow,
} from '../../src/finance/amortization';
import { FirebaseSyncService } from '../../src/services/firebaseSync';
import { FormDraftManager } from '../../src/utils/formDrafts';

export interface LoanItem {
  id: string;
  title: string;
  lenderName: string;
  loanAccountNumber: string;
  category: 'Home Loan' | 'Auto Loan' | 'Personal Loan' | 'SME Business' | 'Credit Card' | 'Private Debt';
  isOutsideBank: boolean;
  disbursedAmount: number;
  outstandingPrincipal: number;
  annualInterestRate: number;
  monthlyEMI: number;
  tenorMonthsTotal: number;
  tenorMonthsRemaining: number;
  startDate: string;
  nextDueDate: string;
  linkedAccountName?: string;
  collateralDetails?: string;
  notes?: string;
}

const LOANS_STORAGE_KEY = 'mh_user_loans';

export const getStoredLoans = (): LoanItem[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(LOANS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
};

export const saveStoredLoans = (list: LoanItem[]) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {}
};

interface BankOffer {
  id: string;
  bankName: string;
  ratePercent: number;
  processingFeePercent: number;
  isPopular?: boolean;
}

const DEFAULT_BANK_OFFERS: BankOffer[] = [
  { id: 'ebl', bankName: 'Eastern Bank PLC (EBL)', ratePercent: 10.75, processingFeePercent: 0.5, isPopular: true },
  { id: 'brac', bankName: 'BRAC Bank PLC', ratePercent: 11.25, processingFeePercent: 0.5, isPopular: true },
  { id: 'city', bankName: 'The City Bank Ltd.', ratePercent: 11.50, processingFeePercent: 0.5 },
  { id: 'dbbl', bankName: 'Dutch-Bangla Bank (DBBL)', ratePercent: 10.50, processingFeePercent: 0.5, isPopular: true },
  { id: 'scb', bankName: 'Standard Chartered BD', ratePercent: 12.00, processingFeePercent: 0.75 },
  { id: 'idlc', bankName: 'IDLC Finance Ltd.', ratePercent: 11.75, processingFeePercent: 0.5 },
];

export default function LoansScreen() {
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [activeScreenTab, setActiveScreenTab] = useState<'my_loans' | 'compare_loans'>('my_loans');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanItem | null>(null);

  // Form State for Actual Loan Entry
  const [title, setTitle] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [loanAccountNumber, setLoanAccountNumber] = useState('');
  const [category, setCategory] = useState<LoanItem['category']>('Home Loan');
  const [isOutsideBank, setIsOutsideBank] = useState(false);
  const [disbursedAmount, setDisbursedAmount] = useState('');
  const [outstandingPrincipal, setOutstandingPrincipal] = useState('');
  const [annualInterestRate, setAnnualInterestRate] = useState('11.0');
  const [tenorMonthsTotal, setTenorMonthsTotal] = useState('60');
  const [tenorMonthsRemaining, setTenorMonthsRemaining] = useState('60');
  const [monthlyEMI, setMonthlyEMI] = useState('');
  const [manualEmiOverride, setManualEmiOverride] = useState(false);
  const [startDate, setStartDate] = useState('2024-01-15');
  const [nextDueDate, setNextDueDate] = useState('2026-09-10');
  const [linkedAccountName, setLinkedAccountName] = useState('');
  const [collateralDetails, setCollateralDetails] = useState('');

  // Loan Comparison State
  const [cmpPrincipal, setCmpPrincipal] = useState('2500000');
  const [cmpTenorYears, setCmpTenorYears] = useState('5');
  const [cmpFacility, setCmpFacility] = useState<'Home Loan' | 'Auto Loan' | 'Personal' | 'SME'>('Home Loan');
  const [selectedOfferForSchedule, setSelectedOfferForSchedule] = useState<string>('ebl');
  const [customBankName, setCustomBankName] = useState('');
  const [customBankRate, setCustomBankRate] = useState('11.0');
  const [customOffers, setCustomOffers] = useState<BankOffer[]>([]);

  useEffect(() => {
    setLoans(getStoredLoans());
    // Restore loan draft if user minimized app
    const draft = FormDraftManager.loadDraft('loan_form', {
      title: '',
      lenderName: '',
      loanAccountNumber: '',
      category: 'Home Loan',
      isOutsideBank: false,
      disbursedAmount: '',
      outstandingPrincipal: '',
      annualInterestRate: '11.0',
      tenorMonthsTotal: '60',
      tenorMonthsRemaining: '60',
      monthlyEMI: '',
      manualEmiOverride: false,
      startDate: '2024-01-15',
      nextDueDate: '2026-09-10',
      linkedAccountName: '',
      collateralDetails: '',
      isOpen: false,
    });
    if (draft.isOpen || draft.title || draft.disbursedAmount || draft.outstandingPrincipal) {
      setTitle(draft.title || '');
      setLenderName(draft.lenderName || '');
      setLoanAccountNumber(draft.loanAccountNumber || '');
      if (draft.category) setCategory(draft.category as any);
      setIsOutsideBank(!!draft.isOutsideBank);
      setDisbursedAmount(draft.disbursedAmount || '');
      setOutstandingPrincipal(draft.outstandingPrincipal || '');
      setAnnualInterestRate(draft.annualInterestRate || '11.0');
      setTenorMonthsTotal(draft.tenorMonthsTotal || '60');
      setTenorMonthsRemaining(draft.tenorMonthsRemaining || '60');
      setMonthlyEMI(draft.monthlyEMI || '');
      setManualEmiOverride(!!draft.manualEmiOverride);
      setStartDate(draft.startDate || '2024-01-15');
      setNextDueDate(draft.nextDueDate || '2026-09-10');
      setLinkedAccountName(draft.linkedAccountName || '');
      setCollateralDetails(draft.collateralDetails || '');
      if (draft.isOpen) setShowAddForm(true);
    }
  }, []);

  // Auto-save draft on any input change
  useEffect(() => {
    if (!editingLoan && (showAddForm || title || disbursedAmount || outstandingPrincipal)) {
      FormDraftManager.saveDraft('loan_form', {
        title,
        lenderName,
        loanAccountNumber,
        category,
        isOutsideBank,
        disbursedAmount,
        outstandingPrincipal,
        annualInterestRate,
        tenorMonthsTotal,
        tenorMonthsRemaining,
        monthlyEMI,
        manualEmiOverride,
        startDate,
        nextDueDate,
        linkedAccountName,
        collateralDetails,
        isOpen: showAddForm,
      });
    }
  }, [showAddForm, title, lenderName, loanAccountNumber, category, isOutsideBank, disbursedAmount, outstandingPrincipal, annualInterestRate, tenorMonthsTotal, tenorMonthsRemaining, monthlyEMI, manualEmiOverride, startDate, nextDueDate, linkedAccountName, collateralDetails, editingLoan]);

  const updateLoansList = (updated: LoanItem[]) => {
    setLoans(updated);
    saveStoredLoans(updated);
    FirebaseSyncService.pushCategory('rashed01', 'loans', updated);
  };

  // Live Auto-calculate EMI when principal, rate, or tenor changes
  useEffect(() => {
    if (manualEmiOverride) return;
    const p = parseFloat(outstandingPrincipal.replace(/,/g, '')) || parseFloat(disbursedAmount.replace(/,/g, '')) || 0;
    const r = isOutsideBank ? 0 : parseFloat(annualInterestRate) || 0;
    const t = parseInt(tenorMonthsTotal, 10) || 60;
    if (p > 0 && t > 0) {
      const calculated = calculateEMI(p, r, t);
      setMonthlyEMI(Math.round(calculated).toString());
    }
  }, [outstandingPrincipal, disbursedAmount, annualInterestRate, tenorMonthsTotal, isOutsideBank, manualEmiOverride]);

  const resetForm = () => {
    FormDraftManager.clearDraft('loan_form');
    setTitle('');
    setLenderName('');
    setLoanAccountNumber('');
    setCategory('Home Loan');
    setIsOutsideBank(false);
    setDisbursedAmount('');
    setOutstandingPrincipal('');
    setAnnualInterestRate('11.0');
    setTenorMonthsTotal('60');
    setTenorMonthsRemaining('60');
    setMonthlyEMI('');
    setManualEmiOverride(false);
    setStartDate('2024-01-15');
    setNextDueDate('2026-09-10');
    setLinkedAccountName('');
    setCollateralDetails('');
    setEditingLoan(null);
    setShowAddForm(false);
  };

  const handleOpenEdit = (loan: LoanItem) => {
    setEditingLoan(loan);
    setTitle(loan.title);
    setLenderName(loan.lenderName);
    setLoanAccountNumber(loan.loanAccountNumber || '');
    setCategory(loan.category);
    setIsOutsideBank(loan.isOutsideBank);
    setDisbursedAmount(loan.disbursedAmount.toString());
    setOutstandingPrincipal(loan.outstandingPrincipal.toString());
    setAnnualInterestRate(loan.annualInterestRate.toString());
    setTenorMonthsTotal(loan.tenorMonthsTotal.toString());
    setTenorMonthsRemaining(loan.tenorMonthsRemaining.toString());
    setMonthlyEMI(loan.monthlyEMI.toString());
    setManualEmiOverride(true);
    setStartDate(loan.startDate);
    setNextDueDate(loan.nextDueDate);
    setLinkedAccountName(loan.linkedAccountName || '');
    setCollateralDetails(loan.collateralDetails || '');
    setShowAddForm(true);
  };

  const handleDeleteLoan = (id: string) => {
    Alert.alert(
      'Delete Loan Record',
      'Are you sure you want to permanently delete this loan liability from your portfolio?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = loans.filter((l) => l.id !== id);
            updateLoansList(updated);
          },
        },
      ]
    );
  };

  const handleSaveLoan = () => {
    if (!title.trim() || !outstandingPrincipal.trim()) {
      Alert.alert('Required Fields', 'Please enter Loan Facility Title and Remaining Principal.');
      return;
    }

    const principal = parseFloat(outstandingPrincipal.replace(/,/g, '')) || 0;
    const disbursed = disbursedAmount ? parseFloat(disbursedAmount.replace(/,/g, '')) : principal;
    const rate = isOutsideBank ? 0 : parseFloat(annualInterestRate) || 0;
    const totalTenor = parseInt(tenorMonthsTotal, 10) || 60;
    const remTenor = parseInt(tenorMonthsRemaining, 10) || totalTenor;
    const emi = parseFloat(monthlyEMI.replace(/,/g, '')) || calculateEMI(principal, rate, totalTenor);

    if (editingLoan) {
      const updated = loans.map((l) =>
        l.id === editingLoan.id
          ? {
              ...l,
              title: title.trim(),
              lenderName: lenderName.trim() || (isOutsideBank ? 'Private Lender' : 'Bank Lender'),
              loanAccountNumber: loanAccountNumber.trim(),
              category,
              isOutsideBank,
              disbursedAmount: disbursed,
              outstandingPrincipal: principal,
              annualInterestRate: rate,
              monthlyEMI: emi,
              tenorMonthsTotal: totalTenor,
              tenorMonthsRemaining: remTenor,
              startDate,
              nextDueDate,
              linkedAccountName: linkedAccountName.trim(),
              collateralDetails: collateralDetails.trim(),
            }
          : l
      );
      updateLoansList(updated);
    } else {
      const newLoan: LoanItem = {
        id: `LN-${Math.floor(100 + Math.random() * 900)}`,
        title: title.trim(),
        lenderName: lenderName.trim() || (isOutsideBank ? 'Private Lender' : 'Bank Lender'),
        loanAccountNumber: loanAccountNumber.trim(),
        category,
        isOutsideBank,
        disbursedAmount: disbursed,
        outstandingPrincipal: principal,
        annualInterestRate: rate,
        monthlyEMI: emi,
        tenorMonthsTotal: totalTenor,
        tenorMonthsRemaining: remTenor,
        startDate,
        nextDueDate,
        linkedAccountName: linkedAccountName.trim(),
        collateralDetails: collateralDetails.trim(),
      };
      updateLoansList([newLoan, ...loans]);
    }

    resetForm();
  };

  const handleAddCustomOffer = () => {
    if (!customBankName.trim()) {
      Alert.alert('Required', 'Please enter Bank Name.');
      return;
    }
    const r = parseFloat(customBankRate) || 11.0;
    const newOffer: BankOffer = {
      id: `custom-${Date.now()}`,
      bankName: customBankName.trim(),
      ratePercent: r,
      processingFeePercent: 0.5,
    };
    setCustomOffers([...customOffers, newOffer]);
    setCustomBankName('');
  };

  // Metrics
  const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
  const totalMonthlyEMI = loans.reduce((sum, l) => sum + l.monthlyEMI, 0);
  const bankLoansTotal = loans
    .filter((l) => !l.isOutsideBank)
    .reduce((sum, l) => sum + l.outstandingPrincipal, 0);
  const outsideBankTotal = loans
    .filter((l) => l.isOutsideBank)
    .reduce((sum, l) => sum + l.outstandingPrincipal, 0);

  // Comparison Calculations
  const allOffers = [...DEFAULT_BANK_OFFERS, ...customOffers];
  const cmpP = parseFloat(cmpPrincipal.replace(/,/g, '')) || 2500000;
  const cmpTenorMonths = (parseInt(cmpTenorYears, 10) || 5) * 12;

  const comparisonResults = allOffers.map((offer) => {
    const emi = calculateEMI(cmpP, offer.ratePercent, cmpTenorMonths);
    const totalPayable = emi * cmpTenorMonths;
    const totalInterest = totalPayable - cmpP;
    return {
      ...offer,
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayable: Math.round(totalPayable),
    };
  });

  const sortedResults = [...comparisonResults].sort((a, b) => a.totalInterest - b.totalInterest);
  const lowestOffer = sortedResults[0];
  const highestOffer = sortedResults[sortedResults.length - 1];
  const maxSavings = highestOffer.totalInterest - lowestOffer.totalInterest;

  // Selected schedule
  const activeOfferData = allOffers.find((o) => o.id === selectedOfferForSchedule) || allOffers[0];
  const schedulePreview: AmortizationRow[] = generateAmortizationSchedule(
    cmpP,
    activeOfferData.ratePercent,
    cmpTenorMonths,
    new Date()
  ).slice(0, 12); // First 12 months preview

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Top Mode Switcher */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeScreenTab === 'my_loans' && styles.topTabBtnActive]}
          onPress={() => setActiveScreenTab('my_loans')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="card-outline"
            size={18}
            color={activeScreenTab === 'my_loans' ? '#FFFFFF' : '#0284C7'}
          />
          <Text style={[styles.topTabText, activeScreenTab === 'my_loans' && styles.topTabTextActive]}>
            📋 My Active Loans & Debts ({loans.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeScreenTab === 'compare_loans' && styles.topTabBtnActive]}
          onPress={() => setActiveScreenTab('compare_loans')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="git-compare-outline"
            size={18}
            color={activeScreenTab === 'compare_loans' ? '#FFFFFF' : '#0284C7'}
          />
          <Text style={[styles.topTabText, activeScreenTab === 'compare_loans' && styles.topTabTextActive]}>
            ⚖️ Bank Loan Comparisons & EMI Simulator
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================================= */}
      {/* VIEW A: MY ACTIVE LOANS & ACTUAL DATA MANAGEMENT */}
      {/* ========================================================================= */}
      {activeScreenTab === 'my_loans' && (
        <>
          {/* Summary Hero Card */}
          <GlassCard style={styles.summaryCard} padding={20} glowColor={Colors.danger}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>TOTAL OUTSTANDING DEBT & LIABILITIES</Text>
                <Text style={[styles.summaryAmount, { color: Colors.danger }]}>
                  ৳ {totalOutstanding.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.summarySub}>
                  ৳ {totalMonthlyEMI.toLocaleString('en-IN')}/month Monthly EMI Commitment
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: Colors.danger }]}
                onPress={() => {
                  if (showAddForm) resetForm();
                  else setShowAddForm(true);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name={showAddForm ? 'close' : 'add'} size={18} color="#FFF" />
                <Text style={styles.addBtnText}>{showAddForm ? 'Cancel' : '+ Add Actual Loan'}</Text>
              </TouchableOpacity>
            </View>

            {/* 2-Pillar Split: Bank Loans vs Direct Debt */}
            <View style={styles.strip}>
              <View style={styles.stripCol}>
                <Text style={styles.stripLabel}>
                  🏦 BANK LOANS ({totalOutstanding > 0 ? Math.round((bankLoansTotal / totalOutstanding) * 100) : 0}%)
                </Text>
                <Text style={styles.stripVal}>৳ {bankLoansTotal.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.vLine} />
              <View style={styles.stripCol}>
                <Text style={styles.stripLabel}>
                  🤝 OUTSIDE BANK / PRIVATE ({totalOutstanding > 0 ? Math.round((outsideBankTotal / totalOutstanding) * 100) : 0}%)
                </Text>
                <Text style={[styles.stripVal, { color: Colors.accent }]}>
                  ৳ {outsideBankTotal.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Actual Loan Input Form */}
          {showAddForm && (
            <GlassCard style={styles.formCard} padding={20} glowColor={Colors.danger}>
              <Text style={styles.formTitle}>
                {editingLoan ? '✏️ Edit Loan Facility & Repayment Terms' : '➕ Record Actual Bank Loan or Debt'}
              </Text>

              {/* Outside Bank Toggle */}
              <TouchableOpacity
                style={[styles.toggleRow, isOutsideBank && styles.toggleRowActive]}
                onPress={() => setIsOutsideBank(!isOutsideBank)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isOutsideBank ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isOutsideBank ? '#EA580C' : '#64748B'}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={[styles.toggleText, isOutsideBank && { color: '#C2410C', fontWeight: '800' }]}>
                    This is a Loan Outside of Bank (Direct / Private Family Debt)
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>
                    {isOutsideBank ? 'Flags debt as private/non-bank (defaults interest rate to 0% or custom).' : 'Regular commercial bank or NBFI loan facility.'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Row 1: Lender Name & Loan Title */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>LENDER / BANK NAME *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Eastern Bank PLC, BRAC Bank, City Bank"
                    placeholderTextColor="#94A3B8"
                    value={lenderName}
                    onChangeText={setLenderName}
                  />
                  {/* Quick Lender Pills */}
                  <View style={styles.pillRow}>
                    {['EBL', 'BRAC Bank', 'City Bank', 'DBBL', 'Standard Chartered', 'Private'].map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={styles.quickPill}
                        onPress={() => setLenderName(b === 'Private' ? 'Private Family Lender' : `${b} PLC`)}
                      >
                        <Text style={styles.quickPillText}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>LOAN FACILITY TITLE *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Apartment Home Mortgage, Auto Lease, Business Term"
                    placeholderTextColor="#94A3B8"
                    value={title}
                    onChangeText={setTitle}
                  />
                  {/* Category Pills */}
                  <View style={styles.pillRow}>
                    {(['Home Loan', 'Auto Loan', 'Personal Loan', 'SME Business', 'Private Debt'] as const).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.quickPill, category === cat && styles.quickPillActive]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text style={[styles.quickPillText, category === cat && styles.quickPillTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Row 2: Loan Account Number & Sanctioned Amount */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>LOAN ACCOUNT NUMBER</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 104-501-89201"
                    placeholderTextColor="#94A3B8"
                    value={loanAccountNumber}
                    onChangeText={setLoanAccountNumber}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>SANCTIONED / DISBURSED AMOUNT (৳)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 4500000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={disbursedAmount}
                    onChangeText={setDisbursedAmount}
                  />
                </View>
              </View>

              {/* Row 3: Current Outstanding Principal & Annual Rate */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>CURRENT OUTSTANDING PRINCIPAL (৳) *</Text>
                  <TextInput
                    style={[styles.input, { borderColor: '#EF4444' }]}
                    placeholder="e.g. 3850000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={outstandingPrincipal}
                    onChangeText={setOutstandingPrincipal}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>ANNUAL INTEREST RATE (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={isOutsideBank ? '0.0' : '11.0'}
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={annualInterestRate}
                    onChangeText={setAnnualInterestRate}
                  />
                  <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                    Bangladesh SMART rate reference: SMART (7.5%) + 3.75% = ~11.25% p.a.
                  </Text>
                </View>
              </View>

              {/* Row 4: Tenors & Monthly EMI */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>TOTAL TENOR (MONTHS)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 60 (5 Years)"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={tenorMonthsTotal}
                    onChangeText={setTenorMonthsTotal}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>REMAINING TENOR (MONTHS)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 36"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={tenorMonthsRemaining}
                    onChangeText={setTenorMonthsRemaining}
                  />
                </View>

                <View style={styles.formCol}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.inputLabel}>MONTHLY EMI (৳) *</Text>
                    <TouchableOpacity onPress={() => setManualEmiOverride(!manualEmiOverride)}>
                      <Text style={{ fontSize: 10, color: '#0284C7', fontWeight: '700' }}>
                        {manualEmiOverride ? 'Auto-Calc' : 'Manual'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.input, { backgroundColor: manualEmiOverride ? '#FFFFFF' : '#F8FAFC' }]}
                    placeholder="e.g. 42500"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={monthlyEMI}
                    onChangeText={(v) => {
                      setMonthlyEMI(v);
                      setManualEmiOverride(true);
                    }}
                  />
                </View>
              </View>

              {/* Row 5: Dates & Linked Account */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>DISBURSEMENT / START DATE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>NEXT EMI DUE DATE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={nextDueDate}
                    onChangeText={setNextDueDate}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>AUTO-DEBIT LINKED ACCOUNT</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. EBL Salary Account"
                    placeholderTextColor="#94A3B8"
                    value={linkedAccountName}
                    onChangeText={setLinkedAccountName}
                  />
                </View>
              </View>

              {/* Row 6: Collateral & Notes */}
              <View style={{ marginTop: 8 }}>
                <Text style={styles.inputLabel}>COLLATERAL / SECURITY NOTES</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mortgaged Apartment Deed #402, or Personal Guarantee"
                  placeholderTextColor="#94A3B8"
                  value={collateralDetails}
                  onChangeText={setCollateralDetails}
                />
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.formActionBtn, { backgroundColor: '#F1F5F9' }]}
                  onPress={resetForm}
                >
                  <Text style={{ fontWeight: '700', color: '#475569' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formActionBtn, { backgroundColor: '#DC2626', flex: 2 }]}
                  onPress={handleSaveLoan}
                >
                  <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>
                    {editingLoan ? '💾 Update Loan Details' : '✓ Save Actual Loan to Portfolio'}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}

          {/* Active Loans List */}
          <Text style={styles.sectionHeading}>
            ACTIVE LOAN PORTFOLIO & REPAYMENT SCHEDULE ({loans.length} LIABILITIES)
          </Text>

          {loans.length === 0 ? (
            <GlassCard style={{ alignItems: 'center', padding: 36 }} padding={36}>
              <Ionicons name="shield-checkmark-outline" size={54} color="#16A34A" />
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', marginTop: 12 }}>
                No Loan Liabilities Recorded
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4, maxWidth: 420, lineHeight: 18 }}>
                You have not registered any bank loans or private debts yet. Click "+ Add Actual Loan" above to record your mortgages, auto leases, or term debts.
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: '#DC2626' }]}
                  onPress={() => setShowAddForm(true)}
                >
                  <Ionicons name="add-circle" size={18} color="#FFF" />
                  <Text style={styles.addBtnText}>+ Add Actual Loan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: '#0284C7' }]}
                  onPress={() => setActiveScreenTab('compare_loans')}
                >
                  <Ionicons name="git-compare-outline" size={18} color="#FFF" />
                  <Text style={styles.addBtnText}>Compare Bank Loans</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ) : (
            <View style={styles.loanList}>
              {loans.map((loan) => (
                <GlassCard key={loan.id} style={styles.loanCard} padding={18} glowColor={loan.isOutsideBank ? '#F59E0B' : '#EF4444'}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.loanTitleText}>{loan.title}</Text>
                        <View style={[styles.badge, loan.isOutsideBank ? styles.badgePrivate : styles.badgeBank]}>
                          <Text style={[styles.badgeText, loan.isOutsideBank ? { color: '#C2410C' } : { color: '#DC2626' }]}>
                            {loan.isOutsideBank ? '🤝 Outside Bank' : `🏦 ${loan.category}`}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.lenderText}>
                        {loan.lenderName}
                        {loan.loanAccountNumber ? ` • A/C: ${loan.loanAccountNumber}` : ''}
                        {loan.linkedAccountName ? ` • Auto-debit: ${loan.linkedAccountName}` : ''}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <View style={styles.rateBadge}>
                        <Text style={styles.rateBadgeText}>
                          {loan.isOutsideBank ? '0% Interest' : `${loan.annualInterestRate}% p.a.`}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => handleOpenEdit(loan)}>
                          <Ionicons name="pencil" size={15} color="#0284C7" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteLoan(loan.id)}>
                          <Ionicons name="trash-outline" size={15} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.metricGrid}>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>OUTSTANDING PRINCIPAL</Text>
                      <Text style={[styles.gridVal, { color: Colors.danger }]}>
                        ৳ {loan.outstandingPrincipal.toLocaleString('en-IN')}
                      </Text>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>
                        Disbursed: ৳ {loan.disbursedAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>MONTHLY EMI</Text>
                      <Text style={styles.gridVal}>৳ {loan.monthlyEMI.toLocaleString('en-IN')}/mo</Text>
                      <Text style={{ fontSize: 10, color: '#16A34A' }}>Active Monthly Repayment</Text>
                    </View>

                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>REMAINING TENOR</Text>
                      <Text style={styles.gridVal}>
                        {loan.tenorMonthsRemaining} of {loan.tenorMonthsTotal} Months
                      </Text>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>
                        {Math.round((loan.tenorMonthsRemaining / 12) * 10) / 10} Years Left
                      </Text>
                    </View>

                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>NEXT DUE DATE</Text>
                      <Text style={[styles.gridVal, { color: Colors.accent }]}>{loan.nextDueDate}</Text>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>Started: {loan.startDate}</Text>
                    </View>
                  </View>

                  {loan.collateralDetails ? (
                    <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                      <Text style={{ fontSize: 11, color: '#64748B' }}>
                        🛡️ <Text style={{ fontWeight: '700' }}>Collateral / Security:</Text> {loan.collateralDetails}
                      </Text>
                    </View>
                  ) : null}
                </GlassCard>
              ))}
            </View>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: BANK LOAN COMPARISONS & EMI SIMULATOR */}
      {/* ========================================================================= */}
      {activeScreenTab === 'compare_loans' && (
        <View style={{ gap: Spacing.md }}>
          {/* Comparison Control Panel */}
          <GlassCard style={{ width: '100%' }} padding={20} glowColor="#0284C7">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                  ⚖️ BANGLADESH BANK LOAN COMPARISON ENGINE
                </Text>
                <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  Compare monthly EMIs, total interest, and effective costs across leading Bangladesh banks
                </Text>
              </View>

              <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#16A34A' }}>
                  Potential Savings: Up to ৳ {maxSavings.toLocaleString('en-IN')}!
                </Text>
              </View>
            </View>

            {/* Inputs: Amount & Tenor */}
            <View style={[styles.formRow, { marginTop: 16 }]}>
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>LOAN PRINCIPAL AMOUNT (৳)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2500000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={cmpPrincipal}
                  onChangeText={setCmpPrincipal}
                />
                <View style={styles.pillRow}>
                  {['1000000', '2500000', '5000000', '10000000'].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.quickPill, cmpPrincipal === amt && styles.quickPillActive]}
                      onPress={() => setCmpPrincipal(amt)}
                    >
                      <Text style={[styles.quickPillText, cmpPrincipal === amt && styles.quickPillTextActive]}>
                        ৳ {(parseInt(amt, 10) / 100000).toFixed(0)} Lakh
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>LOAN TENOR (YEARS)</Text>
                <View style={styles.pillRow}>
                  {['1', '3', '5', '10', '15', '20'].map((yr) => (
                    <TouchableOpacity
                      key={yr}
                      style={[styles.quickPill, cmpTenorYears === yr && styles.quickPillActive]}
                      onPress={() => setCmpTenorYears(yr)}
                    >
                      <Text style={[styles.quickPillText, cmpTenorYears === yr && styles.quickPillTextActive]}>
                        {yr} {yr === '1' ? 'Year' : 'Years'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>FACILITY TYPE</Text>
                <View style={styles.pillRow}>
                  {(['Home Loan', 'Auto Loan', 'Personal', 'SME'] as const).map((fac) => (
                    <TouchableOpacity
                      key={fac}
                      style={[styles.quickPill, cmpFacility === fac && styles.quickPillActive]}
                      onPress={() => setCmpFacility(fac)}
                    >
                      <Text style={[styles.quickPillText, cmpFacility === fac && styles.quickPillTextActive]}>
                        {fac}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </GlassCard>

          {/* Side-by-Side Comparison Cards Grid */}
          <Text style={styles.sectionHeading}>
            BANK OFFERS COMPARED (SORTED BY LOWEST INTEREST EXPENSE)
          </Text>

          <View style={styles.compareGrid}>
            {sortedResults.map((res, index) => {
              const isWinner = index === 0;
              const isSelected = selectedOfferForSchedule === res.id;
              const diffFromLowest = res.totalInterest - lowestOffer.totalInterest;

              return (
                <TouchableOpacity
                  key={res.id}
                  style={[
                    styles.compareCard,
                    isWinner && styles.compareCardWinner,
                    isSelected && styles.compareCardSelected,
                  ]}
                  onPress={() => setSelectedOfferForSchedule(res.id)}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.compareBankTitle}>{res.bankName}</Text>
                    {isWinner && (
                      <View style={styles.winnerBadge}>
                        <Text style={styles.winnerBadgeText}>🏆 LOWEST EMI</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.compareRateRow}>
                    <Text style={styles.compareRateText}>{res.ratePercent}% p.a.</Text>
                    <Text style={styles.compareProcessingText}>Proc. Fee: {res.processingFeePercent}%</Text>
                  </View>

                  <View style={styles.compareMetricBox}>
                    <View>
                      <Text style={styles.compareMetricLabel}>MONTHLY EMI</Text>
                      <Text style={styles.compareEmiVal}>৳ {res.emi.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.compareMetricLabel}>TOTAL INTEREST</Text>
                      <Text style={[styles.compareInterestVal, { color: isWinner ? '#16A34A' : '#EF4444' }]}>
                        ৳ {res.totalInterest.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.compareFooterRow}>
                    <Text style={styles.compareTotalText}>
                      Total Repay: ৳ {res.totalPayable.toLocaleString('en-IN')}
                    </Text>
                    {diffFromLowest > 0 ? (
                      <Text style={styles.compareCostDiff}>+৳ {diffFromLowest.toLocaleString('en-IN')} more</Text>
                    ) : (
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#16A34A' }}>✓ Best Value</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add Custom Bank Offer Box */}
          <GlassCard style={{ width: '100%' }} padding={16} glowColor="#F59E0B">
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#0F172A', marginBottom: 8 }}>
              ➕ COMPARE YOUR SPECIFIC BANK QUOTE OR SANCTION OFFER
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextInput
                style={[styles.input, { flex: 2, minWidth: 180 }]}
                placeholder="Bank / Lender Name (e.g. Pubali Bank, HSBC)"
                placeholderTextColor="#94A3B8"
                value={customBankName}
                onChangeText={setCustomBankName}
              />
              <TextInput
                style={[styles.input, { flex: 1, minWidth: 100 }]}
                placeholder="Rate % (e.g. 10.25)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={customBankRate}
                onChangeText={setCustomBankRate}
              />
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: '#16A34A', paddingHorizontal: 16 }]}
                onPress={handleAddCustomOffer}
              >
                <Text style={styles.addBtnText}>+ Add to Comparison</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* 12-Month Amortization Schedule Preview */}
          <GlassCard style={{ width: '100%' }} padding={18}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>
                📅 12-MONTH AMORTIZATION PREVIEW FOR {activeOfferData.bankName.toUpperCase()}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284C7' }}>
                Rate: {activeOfferData.ratePercent}% • Principal: ৳ {cmpP.toLocaleString('en-IN')}
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={[styles.scheduleTable, { minWidth: 640 }]}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { width: 60 }]}>MONTH</Text>
                  <Text style={[styles.th, { width: 130 }]}>OPENING PRINCIPAL</Text>
                  <Text style={[styles.th, { width: 110 }]}>EMI AMOUNT</Text>
                  <Text style={[styles.th, { width: 130, color: '#16A34A' }]}>PRINCIPAL (PAYDOWN)</Text>
                  <Text style={[styles.th, { width: 120, color: '#EF4444' }]}>INTEREST (BANK)</Text>
                  <Text style={[styles.th, { width: 130 }]}>CLOSING BALANCE</Text>
                </View>

                {schedulePreview.map((row) => (
                  <View key={row.paymentNumber} style={styles.tableRow}>
                    <Text style={[styles.td, { width: 60, fontWeight: '800' }]}>#{row.paymentNumber}</Text>
                    <Text style={[styles.td, { width: 130 }]}>৳ {Math.round(row.openingPrincipal).toLocaleString('en-IN')}</Text>
                    <Text style={[styles.td, { width: 110, fontWeight: '800' }]}>৳ {Math.round(row.emiAmount).toLocaleString('en-IN')}</Text>
                    <Text style={[styles.td, { width: 130, fontWeight: '700', color: '#16A34A' }]}>
                      ৳ {Math.round(row.principalComponent).toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.td, { width: 120, fontWeight: '700', color: '#EF4444' }]}>
                      ৳ {Math.round(row.interestComponent).toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.td, { width: 130, fontWeight: '800' }]}>৳ {Math.round(row.closingPrincipal).toLocaleString('en-IN')}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </GlassCard>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2FE',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  topTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  topTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  topTabBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  topTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  topTabTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  summarySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  strip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 4,
  },
  stripCol: {
    flex: 1,
  },
  stripLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  stripVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  vLine: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  formCard: {
    marginBottom: Spacing.md,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 14,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  formCol: {
    flex: 1,
    minWidth: 200,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  quickPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  quickPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  quickPillTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  toggleRowActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  formActionBtn: {
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  loanList: {
    gap: 12,
  },
  loanCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  lenderText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeBank: {
    backgroundColor: '#FEE2E2',
  },
  badgePrivate: {
    backgroundColor: '#FFEDD5',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  rateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
  },
  rateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  gridItem: {
    flex: 1,
    minWidth: 130,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  gridVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  compareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  compareCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  compareCardWinner: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  compareCardSelected: {
    borderWidth: 2.5,
    borderColor: '#0284C7',
  },
  compareBankTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  winnerBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  winnerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  compareRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  compareRateText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0284C7',
  },
  compareProcessingText: {
    fontSize: 11,
    color: '#64748B',
  },
  compareMetricBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 10,
  },
  compareMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  compareEmiVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  compareInterestVal: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  compareFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  compareTotalText: {
    fontSize: 11,
    color: '#64748B',
  },
  compareCostDiff: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  scheduleTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  td: {
    fontSize: 11,
    color: '#0F172A',
  },
});
