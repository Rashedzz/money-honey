import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { GlassCard } from '../../src/components/shared/GlassCard';

export interface BankAccountItem {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: 'Savings' | 'Current' | 'Salary' | 'MFS Wallet' | 'Physical Cash';
  currentBalance: number;
  branch?: string;
  color: string;
}

const initialBankAccounts: BankAccountItem[] = [
  {
    id: 'ACC-01',
    bankName: 'City Bank Ltd.',
    accountName: 'High-Interest Savings A/C',
    accountNumber: '**** 8832',
    accountType: 'Savings',
    currentBalance: 650000,
    branch: 'Gulshan Branch',
    color: '#00F5A0',
  },
  {
    id: 'ACC-02',
    bankName: 'BRAC Bank PLC',
    accountName: 'Corporate Salary Account',
    accountNumber: '**** 4921',
    accountType: 'Salary',
    currentBalance: 450000,
    branch: 'Principal Branch',
    color: '#00D2FF',
  },
  {
    id: 'ACC-03',
    bankName: 'Physical Cash',
    accountName: 'Liquid Home Cash Reserve',
    accountNumber: 'Physical Vault',
    accountType: 'Physical Cash',
    currentBalance: 65000,
    color: '#F59E0B',
  },
  {
    id: 'ACC-04',
    bankName: 'bKash MFS',
    accountName: 'Personal Mobile Wallet',
    accountNumber: '01712-***890',
    accountType: 'MFS Wallet',
    currentBalance: 35000,
    color: '#EF4444',
  },
];

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<BankAccountItem[]>(initialBankAccounts);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<BankAccountItem['accountType']>('Savings');
  const [initialBalance, setInitialBalance] = useState('');

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const handleAddAccount = () => {
    if (!bankName.trim() || !initialBalance.trim()) return;

    const parsedBal = parseFloat(initialBalance.replace(/,/g, '')) || 0;

    const newAcc: BankAccountItem = {
      id: `ACC-0${accounts.length + 1}`,
      bankName: bankName.trim(),
      accountName: accountName.trim() || `${bankName} Account`,
      accountNumber: accountNumber.trim() ? `**** ${accountNumber.trim().slice(-4)}` : '**** 0000',
      accountType,
      currentBalance: parsedBal,
      color: '#00F5A0',
    };

    setAccounts([newAcc, ...accounts]);
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setInitialBalance('');
    setShowAddForm(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Total Liquid Balance Hero Card */}
      <GlassCard style={styles.summaryCard} padding={20} glowColor={Colors.primary}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>TOTAL LIQUID CASH IN HAND & BANKS</Text>
            <Text style={styles.summaryAmount}>
              ৳ {(totalBalance / 100000).toFixed(2)} Lakhs
            </Text>
            <Text style={styles.summarySub}>
              ৳ {totalBalance.toLocaleString('en-IN')} Available Liquid Reserves
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddForm(!showAddForm)}
            activeOpacity={0.85}
          >
            <Ionicons name={showAddForm ? 'close' : 'add'} size={18} color="#0B0F19" />
            <Text style={styles.addBtnText}>{showAddForm ? 'Cancel' : '+ Add Bank'}</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Add Bank Form Modal/Drawer */}
      {showAddForm && (
        <GlassCard style={styles.formCard} padding={18} glowColor={Colors.primary}>
          <Text style={styles.formTitle}>Add Bank Account or Wallet</Text>

          <Text style={styles.inputLabel}>BANK OR INSTITUTION NAME *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Eastern Bank Ltd., Dutch-Bangla, Nagad"
            placeholderTextColor={Colors.textMuted}
            value={bankName}
            onChangeText={setBankName}
          />

          <Text style={styles.inputLabel}>ACCOUNT NAME & NICKNAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Daily Expenses A/C"
            placeholderTextColor={Colors.textMuted}
            value={accountName}
            onChangeText={setAccountName}
          />

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>ACCOUNT NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1029384729"
                placeholderTextColor={Colors.textMuted}
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </View>

            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>INITIAL BALANCE (৳) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 150000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={initialBalance}
                onChangeText={setInitialBalance}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleAddAccount}>
            <Text style={styles.submitBtnText}>Save Account to Vault</Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      {/* Accounts List */}
      <Text style={styles.sectionHeading}>ENLISTED BANK & CASH ACCOUNTS ({accounts.length})</Text>

      <View style={styles.accList}>
        {accounts.map((acc) => (
          <GlassCard key={acc.id} style={styles.accCard} padding={16}>
            <View style={styles.cardRow}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconBg, { backgroundColor: `${acc.color}20` }]}>
                  <Ionicons name="wallet-outline" size={20} color={acc.color} />
                </View>
                <View>
                  <Text style={styles.accNameText}>{acc.bankName}</Text>
                  <Text style={styles.accSubText}>
                    {acc.accountName} • {acc.accountNumber} • <Text style={{ color: Colors.primary }}>{acc.accountType}</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.cardRight}>
                <Text style={styles.accBalText}>৳ {acc.currentBalance.toLocaleString('en-IN')}</Text>
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
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
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
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formCol: {
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  accList: {
    gap: Spacing.sm,
  },
  accCard: {
    width: '100%',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  accSubText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  accBalText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0284C7',
  },
});
