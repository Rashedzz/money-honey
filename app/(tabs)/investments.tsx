import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { GlassCard } from '../../src/components/shared/GlassCard';
import { CountdownCard } from '../../src/components/dashboard/CountdownCard';

const mockFDRs = [
  {
    id: '1',
    title: 'Dutch-Bangla Bank FDR',
    subtitle: 'FDR #8839201 • 3 Years @ 9.5%',
    days: 19,
    date: new Date(2026, 8, 6),
    amount: 1500000,
    type: 'fdr' as const,
    urgency: 'warning' as const,
    pct: 92,
  },
  {
    id: '2',
    title: 'Standard Chartered FDR',
    subtitle: 'FDR #4410293 • 1 Year @ 8.75%',
    days: 110,
    date: new Date(2026, 11, 15),
    amount: 1000000,
    type: 'fdr' as const,
    urgency: 'safe' as const,
    pct: 65,
  },
];

const mockSanchaypatras = [
  {
    id: '3',
    title: '3-Month Profit Based Sanchaypatra',
    subtitle: 'Cert #SC-99201 • 5 Years @ 11.04%',
    days: 6,
    date: new Date(2026, 7, 24),
    amount: 3000000,
    type: 'sanchaypatra' as const,
    urgency: 'critical' as const,
    pct: 98,
  },
  {
    id: '4',
    title: 'Family Savings Certificate (Poribar)',
    subtitle: 'Cert #SC-11029 • 5 Years @ 11.52%',
    days: 42,
    date: new Date(2026, 9, 29),
    amount: 4500000,
    type: 'sanchaypatra' as const,
    urgency: 'safe' as const,
    pct: 75,
  },
];

export default function InvestmentsScreen() {
  const totalFDR = mockFDRs.reduce((acc, f) => acc + f.amount, 0);
  const totalSC = mockSanchaypatras.reduce((acc, s) => acc + s.amount, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Investments</Text>
          <TouchableOpacity style={styles.addBtn}>
            <LinearGradient colors={Colors.gradientPurple} style={styles.addBtnGrad}>
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addBtnText}>Add Deposit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.summaryCard} padding={20} glowColor={Colors.secondary}>
          <Text style={styles.summaryLabel}>TOTAL PORTFOLIO VALUE</Text>
          <Text style={styles.summaryAmount}>৳ {(totalFDR + totalSC).toLocaleString('en-IN')}</Text>
          <View style={styles.splitRow}>
            <Text style={styles.splitText}>FDRs: ৳ {totalFDR.toLocaleString('en-IN')}</Text>
            <Text style={styles.splitText}> • </Text>
            <Text style={styles.splitText}>Sanchaypatra: ৳ {totalSC.toLocaleString('en-IN')}</Text>
          </View>
        </GlassCard>

        <Text style={styles.sectionHeader}>3-WEEK MATURITY ALERTS & FDRs</Text>
        {mockFDRs.map((fdr) => (
          <View key={fdr.id} style={styles.cardItem}>
            <CountdownCard
              title={fdr.title}
              subtitle={fdr.subtitle}
              daysRemaining={fdr.days}
              targetDate={fdr.date}
              amount={fdr.amount}
              amountLabel="Maturity Value"
              type={fdr.type}
              urgencyLevel={fdr.urgency}
              percentageElapsed={fdr.pct}
            />
          </View>
        ))}

        <Text style={[styles.sectionHeader, { marginTop: Spacing.md }]}>SANCHAYPATRA (NATIONAL SAVINGS)</Text>
        {mockSanchaypatras.map((sc) => (
          <View key={sc.id} style={styles.cardItem}>
            <CountdownCard
              title={sc.title}
              subtitle={sc.subtitle}
              daysRemaining={sc.days}
              targetDate={sc.date}
              amount={sc.amount}
              amountLabel="Maturity Value"
              type={sc.type}
              urgencyLevel={sc.urgency}
              percentageElapsed={sc.pct}
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
    color: Colors.secondary,
    marginBottom: 4,
  },
  summaryAmount: {
    ...Typography.displayL,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  splitRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  splitText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  cardItem: {
    marginBottom: Spacing.md,
  },
});
