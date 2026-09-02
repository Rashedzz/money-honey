import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { GlassCard } from '../../src/components/shared/GlassCard';

export interface LoanItem {
  id: string;
  title: string;
  lenderName: string;
  isOutsideBank: boolean; // Bank Loan vs Private Debt
  disbursedAmount: number;
  outstandingPrincipal: number;
  annualInterestRate: number;
  monthlyEMI: number;
  tenorMonthsTotal: number;
  tenorMonthsRemaining: number;
  nextDueDate: string;
}

const initialLoans: LoanItem[] = [
  {
    id: 'LN-01',
    title: 'Apartment Home Loan Mortgage',
    lenderName: 'City Bank Ltd.',
    isOutsideBank: false,
    disbursedAmount: 4500000,
    outstandingPrincipal: 4250000,
    annualInterestRate: 9.75,
    monthlyEMI: 45000,
    tenorMonthsTotal: 240,
    tenorMonthsRemaining: 226,
    nextDueDate: '2026-08-25',
  },
  {
    id: 'LN-02',
    title: 'Vehicle Auto Loan (Toyota Harrier)',
    lenderName: 'Eastern Bank Ltd.',
    isOutsideBank: false,
    disbursedAmount: 1800000,
    outstandingPrincipal: 540000,
    annualInterestRate: 11.5,
    monthlyEMI: 22500,
    tenorMonthsTotal: 60,
    tenorMonthsRemaining: 24,
    nextDueDate: '2026-09-05',
  },
  {
    id: 'LN-03',
    title: 'Private Family Capital Debt',
    lenderName: 'Outside of Bank (Private Family)',
    isOutsideBank: true,
    disbursedAmount: 500000,
    outstandingPrincipal: 250000,
    annualInterestRate: 0.0,
    monthlyEMI: 15000,
    tenorMonthsTotal: 36,
    tenorMonthsRemaining: 16,
    nextDueDate: '2026-08-30',
  },
];

export default function LoansScreen() {
  const [loans, setLoans] = useState<LoanItem[]>(initialLoans);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [isOutsideBank, setIsOutsideBank] = useState(false);
  const [disbursedAmount, setDisbursedAmount] = useState('');
  const [outstandingPrincipal, setOutstandingPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('9.5');
  const [monthlyEMI, setMonthlyEMI] = useState('');
  const [tenorMonths, setTenorMonths] = useState('60');

  const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
  const totalMonthlyEMI = loans.reduce((sum, l) => sum + l.monthlyEMI, 0);
  const bankLoansTotal = loans
    .filter((l) => !l.isOutsideBank)
    .reduce((sum, l) => sum + l.outstandingPrincipal, 0);
  const outsideBankTotal = loans
    .filter((l) => l.isOutsideBank)
    .reduce((sum, l) => sum + l.outstandingPrincipal, 0);

  const handleAddLoan = () => {
    if (!title.trim() || !outstandingPrincipal.trim() || !monthlyEMI.trim()) return;

    const principal = parseFloat(outstandingPrincipal.replace(/,/g, '')) || 0;
    const emi = parseFloat(monthlyEMI.replace(/,/g, '')) || 0;
    const disbursed = disbursedAmount ? parseFloat(disbursedAmount.replace(/,/g, '')) : principal;
    const rate = parseFloat(interestRate) || 0;
    const tenor = parseInt(tenorMonths, 10) || 60;

    const newLoan: LoanItem = {
      id: `LN-0${loans.length + 1}`,
      title: title.trim(),
      lenderName: lenderName.trim() || (isOutsideBank ? 'Private Lender' : 'Bank Lender'),
      isOutsideBank,
      disbursedAmount: disbursed,
      outstandingPrincipal: principal,
      annualInterestRate: rate,
      monthlyEMI: emi,
      tenorMonthsTotal: tenor,
      tenorMonthsRemaining: tenor,
      nextDueDate: '2026-09-01',
    };

    setLoans([newLoan, ...loans]);
    setTitle('');
    setLenderName('');
    setDisbursedAmount('');
    setOutstandingPrincipal('');
    setMonthlyEMI('');
    setShowAddForm(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Total Outstanding Liabilities Hero Card */}
      <GlassCard style={styles.summaryCard} padding={20} glowColor={Colors.danger}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>TOTAL OUTSTANDING DEBT & LIABILITIES</Text>
            <Text style={[styles.summaryAmount, { color: Colors.danger }]}>
              ৳ {(totalOutstanding / 100000).toFixed(2)} Lakhs
            </Text>
            <Text style={styles.summarySub}>
              ৳ {totalMonthlyEMI.toLocaleString('en-IN')}/mo Monthly EMI Commitment
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: Colors.danger }]}
            onPress={() => setShowAddForm(!showAddForm)}
            activeOpacity={0.85}
          >
            <Ionicons name={showAddForm ? 'close' : 'add'} size={18} color="#FFF" />
            <Text style={styles.addBtnText}>{showAddForm ? 'Cancel' : '+ Add Loan'}</Text>
          </TouchableOpacity>
        </View>

        {/* 2-Pillar Split: Bank vs Outside Bank */}
        <View style={styles.strip}>
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>🏦 BANK LOANS ({Math.round((bankLoansTotal / totalOutstanding) * 100)}%)</Text>
            <Text style={styles.stripVal}>৳ {(bankLoansTotal / 100000).toFixed(2)} Lakhs</Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>🤝 OUTSIDE OF BANK ({Math.round((outsideBankTotal / totalOutstanding) * 100)}%)</Text>
            <Text style={[styles.stripVal, { color: Colors.accent }]}>
              ৳ {(outsideBankTotal / 100000).toFixed(2)} Lakhs
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Add Loan Form */}
      {showAddForm && (
        <GlassCard style={styles.formCard} padding={18} glowColor={Colors.danger}>
          <Text style={styles.formTitle}>Add Loan or Private Debt</Text>

          <Text style={styles.inputLabel}>LOAN PURPOSE / TITLE *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Home Loan, Auto Loan, Business Expansion"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.inputLabel}>LENDER / BANK NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. City Bank, BRAC Bank, Private Family"
            placeholderTextColor={Colors.textMuted}
            value={lenderName}
            onChangeText={setLenderName}
          />

          {/* Outside Bank Toggle */}
          <TouchableOpacity
            style={[styles.toggleRow, isOutsideBank && styles.toggleRowActive]}
            onPress={() => setIsOutsideBank(!isOutsideBank)}
          >
            <Ionicons
              name={isOutsideBank ? 'checkbox' : 'square-outline'}
              size={18}
              color={isOutsideBank ? Colors.accent : Colors.textMuted}
            />
            <Text style={styles.toggleText}>This is a Loan Outside of Bank (Direct / Private Debt)</Text>
          </TouchableOpacity>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>REMAINING PRINCIPAL (৳) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 4250000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={outstandingPrincipal}
                onChangeText={setOutstandingPrincipal}
              />
            </View>

            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>MONTHLY EMI (৳) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 45000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={monthlyEMI}
                onChangeText={setMonthlyEMI}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>ANNUAL INTEREST RATE (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9.75"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={interestRate}
                onChangeText={setInterestRate}
              />
            </View>

            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>TENOR (MONTHS)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 240"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={tenorMonths}
                onChangeText={setTenorMonths}
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: Colors.danger }]} onPress={handleAddLoan}>
            <Text style={[styles.submitBtnText, { color: '#FFF' }]}>Save Loan to Debt Portfolio</Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      {/* Loans List */}
      <Text style={styles.sectionHeading}>ACTIVE LOAN PORTFOLIO & REPAYMENT SCHEDULE</Text>

      <View style={styles.loanList}>
        {loans.map((loan) => (
          <GlassCard key={loan.id} style={styles.loanCard} padding={16}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.loanTitleText}>{loan.title}</Text>
                <Text style={styles.lenderText}>
                  {loan.lenderName} • {loan.isOutsideBank ? '🤝 Outside Bank' : '🏦 Institutional Bank'}
                </Text>
              </View>

              <View style={styles.rateBadge}>
                <Text style={styles.rateBadgeText}>{loan.annualInterestRate}% p.a.</Text>
              </View>
            </View>

            <View style={styles.metricGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>OUTSTANDING PRINCIPAL</Text>
                <Text style={[styles.gridVal, { color: Colors.danger }]}>
                  ৳ {loan.outstandingPrincipal.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>MONTHLY EMI</Text>
                <Text style={styles.gridVal}>৳ {loan.monthlyEMI.toLocaleString('en-IN')}/mo</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>REMAINING TENOR</Text>
                <Text style={styles.gridVal}>
                  {loan.tenorMonthsRemaining} of {loan.tenorMonthsTotal} Months
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>NEXT DUE DATE</Text>
                <Text style={[styles.gridVal, { color: Colors.accent }]}>{loan.nextDueDate}</Text>
              </View>
            </View>
          </GlassCard>
        ))}
      </View>
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
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 28,
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
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  stripCol: {
    flex: 1,
    alignItems: 'center',
  },
  vLine: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  stripLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  stripVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#0F172A',
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  toggleRowActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: Colors.accent,
  },
  toggleText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formCol: {
    flex: 1,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  loanList: {
    gap: Spacing.sm,
  },
  loanCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  loanTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  lenderText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  rateBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  rateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  gridItem: {
    width: '47%',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  gridVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
});
