import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { GlassCard } from '../../src/components/shared/GlassCard';

const mockAccounts = [
  { id: '1', name: 'BRAC Bank Salary A/C', num: '**** 4921', balance: 450000, type: 'Salary' },
  { id: '2', name: 'City Bank Savings', num: '**** 8832', balance: 650000, type: 'Savings' },
  { id: '3', name: 'bKash Wallet', num: '01712-***890', balance: 35000, type: 'MFS' },
  { id: '4', name: 'Cash in Hand', num: 'Physical', balance: 65000, type: 'Cash' },
];

export default function AccountsScreen() {
  const total = mockAccounts.reduce((acc, a) => acc + a.balance, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Accounts & Wallets</Text>
          <TouchableOpacity style={styles.addBtn}>
            <LinearGradient colors={Colors.gradientGreen} style={styles.addBtnGrad}>
              <Ionicons name="add" size={20} color="#000" />
              <Text style={styles.addBtnText}>Add Account</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.totalCard} padding={20} glowColor={Colors.primary}>
          <Text style={styles.totalLabel}>TOTAL LIQUID BALANCE</Text>
          <Text style={styles.totalAmount}>৳ {total.toLocaleString('en-IN')}</Text>
          <Text style={styles.totalSub}>Across {mockAccounts.length} accounts & wallets</Text>
        </GlassCard>

        <Text style={styles.sectionHeader}>YOUR ACCOUNTS</Text>

        {mockAccounts.map((acc) => (
          <GlassCard key={acc.id} style={styles.accCard} padding={16}>
            <View style={styles.accRow}>
              <View style={styles.accIconBg}>
                <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.accInfo}>
                <Text style={styles.accName}>{acc.name}</Text>
                <Text style={styles.accNum}>{acc.num} • {acc.type}</Text>
              </View>
              <View style={styles.accBalCol}>
                <Text style={styles.accBal}>৳ {acc.balance.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </GlassCard>
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
    color: '#000',
  },
  totalCard: {
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: 4,
  },
  totalAmount: {
    ...Typography.displayL,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  totalSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  accCard: {
    marginBottom: Spacing.sm,
  },
  accRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,229,179,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  accInfo: {
    flex: 1,
  },
  accName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  accNum: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  accBalCol: {
    alignItems: 'flex-end',
  },
  accBal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
});
