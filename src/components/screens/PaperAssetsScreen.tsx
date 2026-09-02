import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import { getStoredBankAccounts, BankAccountItem, saveStoredBankAccounts } from '../../../app/(tabs)/accounts';

export interface SanchaypatraAsset {
  id: string;
  type: 'Sanchaypatra';
  name: string;                   // Name of Sanchaypatra
  institution: string;            // Financial Institute Name
  address: string;                // Address
  linkedAccountNo: string;        // Linked Bank Account
  bankName: string;               // Bank Name (auto-filled)
  certificateNumber: string;      // Sanchaypatra No
  amount: number;                 // Investment Capital
  activationDate: string;         // Date of Activation
  maturityDate: string;           // Maturity / Closing Date
  profitRateYearly: number;       // Profit Rate: Yearly %
  sourceTaxPercent: number;       // Source Tax Deduction %
  payoutInterval: 'Monthly' | '3 Months' | 'At Maturity';
  monthlyProfit: number;          // Calculated Monthly Net Profit
  grossProfitPerInterval: number;
  netProfitPerInterval: number;
  sourceTaxDeductedPerInterval: number;
  totalTaxDeductedAnnual: number;
  closingDaysRemaining: number;
}

export interface FDRAsset {
  id: string;
  type: 'FDR';
  bankName: string;
  address: string;
  accountNumber: string;
  linkedAccountNo: string;
  fdrNumber: string;
  amount: number;
  openingDate: string;
  tenorMonths: number;
  maturityDate: string;
  profitRateYearly: number;
  sourceTaxPercent: number;
  payoutInterval: 'Monthly' | '3 Months' | 'At Maturity';
  monthlyReturn: number;
  sourceTaxAnnual: number;
  closingDaysRemaining: number;
}

export interface DPSAsset {
  id: string;
  type: 'DPS';
  bankName: string;
  address: string;
  linkedAccountNo: string;
  dpsNumber: string;
  monthlyEmi: number;             // Monthly Deposit (EMI)
  depositDayOfMonth: number;      // e.g. 5th or 10th
  tenorYears: number;
  openingDate: string;
  maturityDate: string;
  profitRateYearly: number;
  projectedMaturityAmount: number;
  totalDepositedSoFar: number;
  closingDaysRemaining: number;
}

export type PaperAssetUnion = SanchaypatraAsset | FDRAsset | DPSAsset;

const STORAGE_KEY = 'mh_user_paper_assets';

export const PaperAssetsScreen: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'SANCHAYPATRA' | 'FDR' | 'DPS'>('ALL');
  const [paperAssets, setPaperAssets] = useState<PaperAssetUnion[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);

  // Modal Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [assetFormType, setAssetFormType] = useState<'Sanchaypatra' | 'FDR' | 'DPS'>('Sanchaypatra');

  // Common Form Fields
  const [pName, setPName] = useState('');
  const [pInstitution, setPInstitution] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [pLinkedAcc, setPLinkedAcc] = useState('');
  const [pBankName, setPBankName] = useState('');
  const [pCertNo, setPCertNo] = useState('');
  const [pAmount, setPAmount] = useState('');
  const [pActivationDate, setPActivationDate] = useState('');
  const [pMaturityDate, setPMaturityDate] = useState('');
  const [pProfitRate, setPProfitRate] = useState('11.04');
  const [pSourceTax, setPSourceTax] = useState('5');
  const [pInterval, setPInterval] = useState<'Monthly' | '3 Months' | 'At Maturity'>('3 Months');

  // DPS Specific Fields
  const [pEmi, setPEmi] = useState('');
  const [pDepositDay, setPDepositDay] = useState('10');
  const [pTenorYears, setPTenorYears] = useState('5');

  // Tax Report View
  const [showTaxReport, setShowTaxReport] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setPaperAssets(JSON.parse(raw));
      }
    } catch (e) {}

    setBankAccounts(getStoredBankAccounts());
  }, []);

  const saveAssets = (updated: PaperAssetUnion[]) => {
    setPaperAssets(updated);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {}
  };

  // Linked account selection handler (Auto-fills Bank Name & Branch Address)
  const handleSelectLinkedAccount = (accNo: string) => {
    setPLinkedAcc(accNo);
    const found = bankAccounts.find((b) => b.accountNumber === accNo || b.id === accNo);
    if (found) {
      setPBankName(found.bankName);
      setPAddress(found.address || found.branch || `${found.bankName} Main Branch`);
      if (!pInstitution) setPInstitution(found.bankName);
    }
  };

  const calculateDaysLeft = (targetDateStr: string) => {
    try {
      const target = new Date(targetDateStr);
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    } catch (e) {
      return 365;
    }
  };

  const handleSaveAsset = () => {
    if (!pCertNo.trim() && !pName.trim()) {
      Alert.alert('Required', 'Please enter Title / Certificate No.');
      return;
    }

    const principal = parseFloat(pAmount.replace(/,/g, '')) || 0;
    const rate = parseFloat(pProfitRate) || 0;
    const taxPct = parseFloat(pSourceTax) || 0;
    const intervalsPerYear = pInterval === 'Monthly' ? 12 : pInterval === '3 Months' ? 4 : 1;

    // Gross profit per interval
    const grossInterval = (principal * (rate / 100)) / intervalsPerYear;
    const taxInterval = grossInterval * (taxPct / 100);
    const netInterval = grossInterval - taxInterval;
    const monthlyNet = (netInterval * intervalsPerYear) / 12;
    const annualTax = taxInterval * intervalsPerYear;

    let newAsset: PaperAssetUnion;

    if (assetFormType === 'Sanchaypatra') {
      newAsset = {
        id: `SC-${Date.now()}`,
        type: 'Sanchaypatra',
        name: pName.trim() || '3-Month Profit Based Sanchaypatra',
        institution: pInstitution.trim() || 'Bangladesh National Savings',
        address: pAddress.trim() || 'Motijheel, Dhaka',
        linkedAccountNo: pLinkedAcc || 'N/A',
        bankName: pBankName.trim() || 'Direct Savings Account',
        certificateNumber: pCertNo.trim() || `SC-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: principal,
        activationDate: pActivationDate || new Date().toISOString().slice(0, 10),
        maturityDate: pMaturityDate || new Date(Date.now() + 5 * 365 * 86400000).toISOString().slice(0, 10),
        profitRateYearly: rate,
        sourceTaxPercent: taxPct,
        payoutInterval: pInterval,
        monthlyProfit: monthlyNet,
        grossProfitPerInterval: grossInterval,
        netProfitPerInterval: netInterval,
        sourceTaxDeductedPerInterval: taxInterval,
        totalTaxDeductedAnnual: annualTax,
        closingDaysRemaining: calculateDaysLeft(pMaturityDate || '2029-08-24'),
      };
    } else if (assetFormType === 'FDR') {
      newAsset = {
        id: `FDR-${Date.now()}`,
        type: 'FDR',
        bankName: pBankName.trim() || pInstitution.trim() || 'Commercial Bank Ltd.',
        address: pAddress.trim() || 'Principal Branch',
        accountNumber: pLinkedAcc || 'N/A',
        linkedAccountNo: pLinkedAcc || 'N/A',
        fdrNumber: pCertNo.trim() || `FDR-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: principal,
        openingDate: pActivationDate || new Date().toISOString().slice(0, 10),
        tenorMonths: 36,
        maturityDate: pMaturityDate || new Date(Date.now() + 3 * 365 * 86400000).toISOString().slice(0, 10),
        profitRateYearly: rate,
        sourceTaxPercent: taxPct,
        payoutInterval: pInterval,
        monthlyReturn: monthlyNet,
        sourceTaxAnnual: annualTax,
        closingDaysRemaining: calculateDaysLeft(pMaturityDate || '2027-08-24'),
      };
    } else {
      const emi = parseFloat(pEmi) || 5000;
      const tenor = parseInt(pTenorYears, 10) || 5;
      const totalDep = emi * tenor * 12;
      const projMaturity = totalDep * (1 + (rate / 100) * 0.55);

      newAsset = {
        id: `DPS-${Date.now()}`,
        type: 'DPS',
        bankName: pBankName.trim() || pInstitution.trim() || 'Commercial Bank Ltd.',
        address: pAddress.trim() || 'Local Branch',
        linkedAccountNo: pLinkedAcc || 'N/A',
        dpsNumber: pCertNo.trim() || `DPS-${Math.floor(100000 + Math.random() * 900000)}`,
        monthlyEmi: emi,
        depositDayOfMonth: parseInt(pDepositDay, 10) || 10,
        tenorYears: tenor,
        openingDate: pActivationDate || new Date().toISOString().slice(0, 10),
        maturityDate: pMaturityDate || new Date(Date.now() + tenor * 365 * 86400000).toISOString().slice(0, 10),
        profitRateYearly: rate,
        projectedMaturityAmount: projMaturity,
        totalDepositedSoFar: emi * 6,
        closingDaysRemaining: calculateDaysLeft(pMaturityDate || '2029-08-24'),
      };
    }

    // Credit profit into linked account balance if active
    if (pLinkedAcc && monthlyNet > 0) {
      const updatedBanks = bankAccounts.map((b) =>
        b.accountNumber === pLinkedAcc ? { ...b, currentBalance: b.currentBalance + monthlyNet } : b
      );
      setBankAccounts(updatedBanks);
      saveStoredBankAccounts(updatedBanks);
    }

    const updated = [newAsset, ...paperAssets];
    saveAssets(updated);
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setPName('');
    setPInstitution('');
    setPAddress('');
    setPLinkedAcc('');
    setPBankName('');
    setPCertNo('');
    setPAmount('');
    setPActivationDate('');
    setPMaturityDate('');
    setPEmi('');
  };

  const handleDeleteAsset = (id: string) => {
    Alert.alert('Confirm Deletion', 'Remove this paper asset record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = paperAssets.filter((a) => a.id !== id);
          saveAssets(updated);
        },
      },
    ]);
  };

  // Filtered Assets
  const filteredAssets = paperAssets.filter((a) => {
    if (filter === 'SANCHAYPATRA') return a.type === 'Sanchaypatra';
    if (filter === 'FDR') return a.type === 'FDR';
    if (filter === 'DPS') return a.type === 'DPS';
    return true;
  });

  // Calculations for Sanchaypatra summary
  const sanchaypatras = paperAssets.filter((a): a is SanchaypatraAsset => a.type === 'Sanchaypatra');
  const totalSanchaypatraCapital = sanchaypatras.reduce((sum, s) => sum + s.amount, 0);
  const totalSanchaypatraMonthlyProfit = sanchaypatras.reduce((sum, s) => sum + s.monthlyProfit, 0);
  const totalSourceTaxWithheld = paperAssets.reduce((sum, a) => {
    if (a.type === 'Sanchaypatra') return sum + a.totalTaxDeductedAnnual;
    if (a.type === 'FDR') return sum + a.sourceTaxAnnual;
    return sum;
  }, 0);

  const totalPaperCapital = paperAssets.reduce((sum, a) => {
    if (a.type === 'DPS') return sum + a.totalDepositedSoFar;
    return sum + a.amount;
  }, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Executive Portfolio Header */}
      <GlassCard style={styles.summaryCard} padding={20} glowColor={Colors.primary}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>SANCHAYPATRA, FDR & DPS PAPER ASSET VAULT</Text>
            <Text style={styles.summaryAmount}>
              ৳ {totalPaperCapital.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.summarySub}>
              Monthly Auto-Yield: ৳ {totalSanchaypatraMonthlyProfit.toLocaleString('en-IN')} • {paperAssets.length} Fixed-Income Certificates
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <TouchableOpacity
              style={styles.taxBtn}
              onPress={() => setShowTaxReport(!showTaxReport)}
              activeOpacity={0.85}
            >
              <Ionicons name="document-text-outline" size={16} color="#0284C7" />
              <Text style={styles.taxBtnText}>📄 NBR Tax Certificate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                resetForm();
                setModalOpen(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>+ Add Paper Asset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NBR Tax Return Summary Box */}
        {showTaxReport && (
          <View style={styles.taxReportBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
                  NBR INCOME TAX RETURN SOURCE TAX DEDUCTION STATEMENT
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert('Tax Report Ready', 'Source Tax Deduction certificate downloaded for your annual tax filing!')}
                style={styles.printBtn}
              >
                <Ionicons name="print-outline" size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Print / Download Tax Report</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              Total Withheld Source Tax (AIT) Deducted by Bangladesh Bank & Commercial Banks:
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A', marginTop: 4 }}>
              ৳ {totalSourceTaxWithheld.toLocaleString('en-IN')} / Year
            </Text>
          </View>
        )}
      </GlassCard>

      {/* Sanchaypatra Specific Closing Table (Requirement 6) */}
      {sanchaypatras.length > 0 && (
        <GlassCard style={styles.closingCard} padding={18} glowColor="#F59E0B">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={styles.closingCardTitle}>
                🏛️ SANCHAYPATRA PORTFOLIO & UPCOMING CLOSING SCHEDULE
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Total Sanchaypatra Capital: ৳ {totalSanchaypatraCapital.toLocaleString('en-IN')} | Monthly Net Profit: ৳ {totalSanchaypatraMonthlyProfit.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { width: 36 }]}>SL</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>SANCHAYPATRA NAME & CERT NO</Text>
              <Text style={[styles.th, { flex: 1 }]}>CAPITAL (৳)</Text>
              <Text style={[styles.th, { flex: 1 }]}>CLOSING DATE</Text>
              <Text style={[styles.th, { flex: 0.8 }]}>DAYS LEFT</Text>
              <Text style={[styles.th, { flex: 1 }]}>MONTHLY PROFIT</Text>
            </View>

            {sanchaypatras.map((item, idx) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.td, { width: 36, fontWeight: '800' }]}>{idx + 1}</Text>
                <View style={{ flex: 1.5 }}>
                  <Text style={[styles.td, { fontWeight: '800' }]}>{item.name}</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>#{item.certificateNumber}</Text>
                </View>
                <Text style={[styles.td, { flex: 1, fontWeight: '800', color: '#0F172A' }]}>
                  ৳ {item.amount.toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.td, { flex: 1 }]}>{item.maturityDate}</Text>
                <View style={{ flex: 0.8 }}>
                  <View style={[styles.daysBadge, item.closingDaysRemaining <= 30 && styles.daysBadgeUrgent]}>
                    <Text style={[styles.daysBadgeText, item.closingDaysRemaining <= 30 && { color: '#EF4444' }]}>
                      {item.closingDaysRemaining}d
                    </Text>
                  </View>
                </View>
                <Text style={[styles.td, { flex: 1, fontWeight: '800', color: '#16A34A' }]}>
                  +৳ {item.monthlyProfit.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { id: 'ALL', label: 'All Paper Assets' },
          { id: 'SANCHAYPATRA', label: '📜 Sanchaypatra (Govt)' },
          { id: 'FDR', label: '🏦 FDR (Fixed Deposits)' },
          { id: 'DPS', label: '💳 DPS Schemes' },
        ].map((btn) => (
          <TouchableOpacity
            key={btn.id}
            style={[styles.filterBtn, filter === btn.id && styles.filterBtnActive]}
            onPress={() => setFilter(btn.id as any)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterBtnText, filter === btn.id && styles.filterBtnTextActive]}>
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Holdings List Cards */}
      {filteredAssets.length === 0 ? (
        <GlassCard style={{ alignItems: 'center', padding: 36 }} padding={36}>
          <Ionicons name="document-text-outline" size={48} color="#0284C7" />
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 12 }}>
            No Paper Asset Certificates Enlisted Yet
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4, maxWidth: 400 }}>
            Click "+ Add Paper Asset" above to record Sanchaypatra, Bank FDRs, or Deposit Pension Schemes.
          </Text>
        </GlassCard>
      ) : (
        <View style={styles.assetList}>
          {filteredAssets.map((asset) => (
            <GlassCard key={asset.id} style={styles.assetCard} padding={18} glowColor={Colors.primary}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{asset.type}</Text>
                  </View>
                  <View>
                    <Text style={styles.assetTitle}>
                      {asset.type === 'Sanchaypatra' ? asset.name : `${asset.bankName} ${asset.type}`}
                    </Text>
                    <Text style={styles.assetSub}>
                      {asset.type === 'Sanchaypatra' ? `#${asset.certificateNumber} • ${asset.institution}` : `#${asset.type === 'FDR' ? asset.fdrNumber : asset.dpsNumber} • ${asset.bankName}`}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => handleDeleteAsset(asset.id)} style={styles.delBtn}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {/* Grid Metrics */}
              <View style={styles.metricGrid}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>INVESTED CAPITAL</Text>
                  <Text style={styles.metricVal}>
                    ৳ {(asset.type === 'DPS' ? asset.totalDepositedSoFar : asset.amount).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>PROFIT RATE</Text>
                  <Text style={[styles.metricVal, { color: '#16A34A' }]}>
                    {asset.profitRateYearly}% Yearly
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>
                    {asset.type === 'DPS' ? 'MONTHLY EMI' : 'MONTHLY NET YIELD'}
                  </Text>
                  <Text style={[styles.metricVal, { color: '#0284C7' }]}>
                    {asset.type === 'DPS'
                      ? `৳ ${asset.monthlyEmi.toLocaleString('en-IN')} (Due: ${asset.depositDayOfMonth}th)`
                      : `+৳ ${(asset.type === 'Sanchaypatra' ? asset.monthlyProfit : asset.monthlyReturn).toLocaleString('en-IN')}`}
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>MATURITY / CLOSING DATE</Text>
                  <Text style={styles.metricVal}>
                    {asset.maturityDate} ({asset.closingDaysRemaining}d left)
                  </Text>
                </View>
              </View>

              {/* Linked Bank Account Pill */}
              <View style={styles.cardFooter}>
                <Ionicons name="link" size={14} color="#0284C7" />
                <Text style={styles.linkedText}>
                  Profit Deposited To: <Text style={{ fontWeight: '800', color: '#0F172A' }}>A/C {asset.linkedAccountNo || 'None'}</Text> ({asset.address || 'Branch'})
                </Text>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Comprehensive Add Paper Asset Modal Form (Requirement 6) */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enlist Paper Asset Investment</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Asset Type Switcher */}
            <View style={styles.modalTabs}>
              {(['Sanchaypatra', 'FDR', 'DPS'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.modalTab, assetFormType === t && styles.modalTabActive]}
                  onPress={() => setAssetFormType(t)}
                >
                  <Text style={[styles.modalTabText, assetFormType === t && styles.modalTabTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* Sanchaypatra Form */}
              {assetFormType === 'Sanchaypatra' && (
                <>
                  <Text style={styles.inputLabel}>NAME OF THE SANCHAYPATRA *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 5-Year Bangladesh Sanchaypatra, 3-Month Profit, Family Savings"
                    placeholderTextColor="#94A3B8"
                    value={pName}
                    onChangeText={setPName}
                  />

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>FINANCIAL INSTITUTE NAME</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Bangladesh Bank, Sonali Bank"
                        placeholderTextColor="#94A3B8"
                        value={pInstitution}
                        onChangeText={setPInstitution}
                      />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>SANCHAYPATRA CERTIFICATE NO *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. SC-992014-BD"
                        placeholderTextColor="#94A3B8"
                        value={pCertNo}
                        onChangeText={setPCertNo}
                      />
                    </View>
                  </View>

                  {/* Linked Bank Account Dropdown */}
                  <Text style={[styles.inputLabel, { color: '#0284C7' }]}>
                    PROFIT SHARING LINKED ACCOUNT NO (DROPDOWN AUTO-FILL) *
                  </Text>
                  <View style={styles.dropdownContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                      {bankAccounts.length === 0 ? (
                        <Text style={{ fontSize: 12, color: '#64748B', padding: 6 }}>
                          No bank accounts found. Please add a bank account first.
                        </Text>
                      ) : (
                        bankAccounts.map((b) => (
                          <TouchableOpacity
                            key={b.id}
                            style={[styles.accountOption, pLinkedAcc === b.accountNumber && styles.accountOptionActive]}
                            onPress={() => handleSelectLinkedAccount(b.accountNumber)}
                          >
                            <Text style={[styles.accountOptionText, pLinkedAcc === b.accountNumber && { color: '#FFFFFF' }]}>
                              {b.bankName} ({b.accountNumber})
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>BANK NAME (AUTO-FILLED)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: '#F1F5F9' }]}
                        value={pBankName}
                        onChangeText={setPBankName}
                        placeholder="Auto-fills from account"
                      />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>BRANCH ADDRESS (AUTO-FILLED)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: '#F1F5F9' }]}
                        value={pAddress}
                        onChangeText={setPAddress}
                        placeholder="Auto-fills from account"
                      />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>INVESTMENT AMOUNT (৳) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 1000000"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={pAmount}
                        onChangeText={setPAmount}
                      />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>PROFIT RATE (% YEARLY)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 11.04"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={pProfitRate}
                        onChangeText={setPProfitRate}
                      />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>SOURCE TAX DEDUCTION %</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 5 (with TIN) or 10"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={pSourceTax}
                        onChangeText={setPSourceTax}
                      />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>PROFIT DEPOSIT INTERVAL</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                        {(['Monthly', '3 Months', 'At Maturity'] as const).map((inter) => (
                          <TouchableOpacity
                            key={inter}
                            style={[styles.intervalBtn, pInterval === inter && styles.intervalBtnActive]}
                            onPress={() => setPInterval(inter)}
                          >
                            <Text style={[styles.intervalBtnText, pInterval === inter && { color: '#FFFFFF' }]}>
                              {inter}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>DATE OF ACTIVATION</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        value={pActivationDate}
                        onChangeText={setPActivationDate}
                      />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>MATURITY / CLOSING DATE</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        value={pMaturityDate}
                        onChangeText={setPMaturityDate}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* FDR Form */}
              {assetFormType === 'FDR' && (
                <>
                  <Text style={[styles.inputLabel, { color: '#0284C7' }]}>
                    LINKED BANK ACCOUNT (DROPDOWN AUTO-FILLS BANK & ADDRESS) *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    {bankAccounts.map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.accountOption, pLinkedAcc === b.accountNumber && styles.accountOptionActive]}
                        onPress={() => handleSelectLinkedAccount(b.accountNumber)}
                      >
                        <Text style={[styles.accountOptionText, pLinkedAcc === b.accountNumber && { color: '#FFFFFF' }]}>
                          {b.bankName} ({b.accountNumber})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>BANK NAME</Text>
                      <TextInput style={styles.input} value={pBankName} onChangeText={setPBankName} placeholder="Bank Name" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>BRANCH ADDRESS</Text>
                      <TextInput style={styles.input} value={pAddress} onChangeText={setPAddress} placeholder="Branch Address" />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>FDR CERTIFICATE / RECEIPT NO *</Text>
                      <TextInput style={styles.input} value={pCertNo} onChangeText={setPCertNo} placeholder="e.g. FDR-882910" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>CAPITAL INVESTED (৳) *</Text>
                      <TextInput style={styles.input} value={pAmount} onChangeText={setPAmount} placeholder="e.g. 1500000" keyboardType="numeric" />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>ANNUAL INTEREST RATE (%)</Text>
                      <TextInput style={styles.input} value={pProfitRate} onChangeText={setPProfitRate} placeholder="e.g. 9.5" keyboardType="numeric" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>SOURCE TAX %</Text>
                      <TextInput style={styles.input} value={pSourceTax} onChangeText={setPSourceTax} placeholder="e.g. 10" keyboardType="numeric" />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>OPENING DATE</Text>
                      <TextInput style={styles.input} value={pActivationDate} onChangeText={setPActivationDate} placeholder="YYYY-MM-DD" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>CLOSING DATE</Text>
                      <TextInput style={styles.input} value={pMaturityDate} onChangeText={setPMaturityDate} placeholder="YYYY-MM-DD" />
                    </View>
                  </View>
                </>
              )}

              {/* DPS Form */}
              {assetFormType === 'DPS' && (
                <>
                  <Text style={[styles.inputLabel, { color: '#0284C7' }]}>
                    LINKED BANK ACCOUNT NO *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    {bankAccounts.map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.accountOption, pLinkedAcc === b.accountNumber && styles.accountOptionActive]}
                        onPress={() => handleSelectLinkedAccount(b.accountNumber)}
                      >
                        <Text style={[styles.accountOptionText, pLinkedAcc === b.accountNumber && { color: '#FFFFFF' }]}>
                          {b.bankName} ({b.accountNumber})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>DPS SCHEME / ACCOUNT NO *</Text>
                      <TextInput style={styles.input} value={pCertNo} onChangeText={setPCertNo} placeholder="e.g. DPS-440192" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>MONTHLY INSTALLMENT (EMI ৳) *</Text>
                      <TextInput style={styles.input} value={pEmi} onChangeText={setPEmi} placeholder="e.g. 10000" keyboardType="numeric" />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>MONTHLY DEPOSIT DATE (DAY)</Text>
                      <TextInput style={styles.input} value={pDepositDay} onChangeText={setPDepositDay} placeholder="e.g. 10 (10th of every month)" keyboardType="numeric" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>TENOR (YEARS)</Text>
                      <TextInput style={styles.input} value={pTenorYears} onChangeText={setPTenorYears} placeholder="e.g. 5" keyboardType="numeric" />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>PROFIT RATE (%)</Text>
                      <TextInput style={styles.input} value={pProfitRate} onChangeText={setPProfitRate} placeholder="e.g. 8.5" keyboardType="numeric" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>MATURITY DATE</Text>
                      <TextInput style={styles.input} value={pMaturityDate} onChangeText={setPMaturityDate} placeholder="YYYY-MM-DD" />
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.submitModalBtn} onPress={handleSaveAsset} activeOpacity={0.85}>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.submitModalBtnText}>Enlist {assetFormType} Asset</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

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
    gap: Spacing.md,
  },
  summaryCard: {
    marginBottom: Spacing.xs,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
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
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  taxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  taxBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  taxReportBox: {
    marginTop: Spacing.md,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: Radius.md,
    padding: 14,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  closingCard: {
    width: '100%',
  },
  closingCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  td: {
    fontSize: 13,
    color: '#0F172A',
  },
  daysBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  daysBadgeUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  filterBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  assetList: {
    gap: Spacing.sm,
  },
  assetCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  assetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  assetSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  delBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: Spacing.sm,
  },
  metricCol: {
    width: '48%',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  linkedText: {
    fontSize: 12,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalTabs: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modalTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  modalTabActive: {
    backgroundColor: '#16A34A',
  },
  modalTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: Spacing.xs,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 6,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  dropdownContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: Radius.md,
    padding: 6,
    marginBottom: 6,
  },
  accountOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  accountOptionActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  accountOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  intervalBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  intervalBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  intervalBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  submitModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 13,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  submitModalBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
