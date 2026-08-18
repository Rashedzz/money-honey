import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { GlassCard } from '../../src/components/shared/GlassCard';
import { EMIReminderCard } from '../../src/components/dashboard/EMIReminderCard';

const mockLoans = [
  {
    id: '1',
    title: 'Apartment Home Loan',
    bank: 'City Bank Ltd.',
    emi: 45000,
    dueDate: new Date(2026, 7, 25),
    paymentNumber: 14,
    totalPayments: 240,
    outstanding: 4250000,
  },
  {
    id: '2',
    title: 'Vehicle Auto Loan',
    bank: 'Eastern Bank Ltd. (EBL)',
    emi: 22500,
    dueDate: new Date(2026, 8, 5),
    paymentNumber: 36,
    totalPayments: 60,
    outstanding: 540000,
  },
];

export default function LoansScreen() {
  const totalOutstanding = mockLoans.reduce((acc, l) => acc + l.outstanding, 0);
  const totalMonthlyEMI = mockLoans.reduce((acc, l) => acc + l.emi, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Loans & EMIs</Text>
          <TouchableOpacity style={styles.addBtn}>
            <LinearGradient colors={Colors.gradientDanger} style={styles.addBtnGrad}>
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addBtnText}>Add Loan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.summaryCard} padding={20} glowColor={Colors.danger}>
          <Text style={styles.summaryLabel}>TOTAL OUTSTANDING PRINCIPAL</Text>
          <Text style={styles.summaryAmount}>৳ {totalOutstanding.toLocaleString('en-IN')}</Text>
          <View style={styles.subRow}>
            <Text style={styles.subText}>Monthly Debt Service: </Text>
            <Text style={[styles.subText, { color: Colors.danger, fontWeight: '700' }]}>
              ৳ {totalMonthlyEMI.toLocaleString('en-IN')}/mo
            </Text>
          </View>
        </GlassCard>

        <Text style={styles.sectionHeader}>ACTIVE LOANS & AMORTIZATION</Text>

        {mockLoans.map((loan) => (
          <View key={loan.id} style={styles.loanItem}>
            <EMIReminderCard
              loanTitle={loan.title}
              bankName={loan.bank}
              emiAmount={loan.emi}
              dueDate={loan.dueDate}
              paymentNumber={loan.paymentNumber}
              totalPayments={loan.totalPayments}
              outstandingPrincipal={loan.outstanding}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.displayM,
    color: Colors.textPrimary,
  },
  addBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  addBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    ...Typography.label,
    color: Colors.danger,
    marginBottom: 4,
  },
  summaryAmount: {
    ...Typography.displayL,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  subText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  loanItem: {
    marginBottom: Spacing.md,
  },
});
