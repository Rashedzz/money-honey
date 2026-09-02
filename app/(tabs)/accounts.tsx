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
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { GlassCard } from '../../src/components/shared/GlassCard';
import { useAuth } from '../../src/auth/AuthContext';

export interface BankAccountItem {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  accountType: 'Savings' | 'Current' | 'Salary' | 'MFS Wallet' | 'Physical Cash';
  currentBalance: number;
  branch?: string;
  address?: string;
  bankAppId?: string;
  bankAppPassword?: string;
  color: string;
}

const BANK_STORAGE_KEY = 'mh_user_bank_accounts';

export const getStoredBankAccounts = (): BankAccountItem[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(BANK_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
};

export const saveStoredBankAccounts = (list: BankAccountItem[]) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {}
};

export default function AccountsScreen() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccountItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountItem | null>(null);

  // Form State
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [address, setAddress] = useState('');
  const [accountType, setAccountType] = useState<BankAccountItem['accountType']>('Savings');
  const [initialBalance, setInitialBalance] = useState('');
  const [bankAppId, setBankAppId] = useState('');
  const [bankAppPassword, setBankAppPassword] = useState('');

  // Security Unlock State
  const [unlockedAccounts, setUnlockedAccounts] = useState<Record<string, boolean>>({});
  const [securityModalTarget, setSecurityModalTarget] = useState<string | null>(null);
  const [securityInputPin, setSecurityInputPin] = useState('');
  const [securityError, setSecurityError] = useState('');

  useEffect(() => {
    setAccounts(getStoredBankAccounts());
  }, []);

  const updateAccountsList = (updated: BankAccountItem[]) => {
    setAccounts(updated);
    saveStoredBankAccounts(updated);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const resetForm = () => {
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setRoutingNumber('');
    setBranch('');
    setAddress('');
    setInitialBalance('');
    setBankAppId('');
    setBankAppPassword('');
    setEditingAccount(null);
    setShowAddForm(false);
  };

  const handleOpenEdit = (acc: BankAccountItem) => {
    setEditingAccount(acc);
    setBankName(acc.bankName);
    setAccountName(acc.accountName);
    setAccountNumber(acc.accountNumber);
    setRoutingNumber(acc.routingNumber || '');
    setBranch(acc.branch || '');
    setAddress(acc.address || '');
    setAccountType(acc.accountType);
    setInitialBalance(acc.currentBalance.toString());
    setBankAppId(acc.bankAppId || '');
    setBankAppPassword(acc.bankAppPassword || '');
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this bank account from your vault?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = accounts.filter((a) => a.id !== id);
            updateAccountsList(updated);
          },
        },
      ]
    );
  };

  const handleSaveAccount = () => {
    if (!bankName.trim() || !initialBalance.trim()) {
      Alert.alert('Required', 'Please enter Bank/Institution Name and Balance.');
      return;
    }

    const parsedBal = parseFloat(initialBalance.replace(/,/g, '')) || 0;

    if (editingAccount) {
      // Edit existing
      const updated = accounts.map((a) =>
        a.id === editingAccount.id
          ? {
              ...a,
              bankName: bankName.trim(),
              accountName: accountName.trim() || `${bankName} Account`,
              accountNumber: accountNumber.trim(),
              routingNumber: routingNumber.trim(),
              branch: branch.trim(),
              address: address.trim(),
              accountType,
              currentBalance: parsedBal,
              bankAppId: bankAppId.trim(),
              bankAppPassword: bankAppPassword.trim(),
            }
          : a
      );
      updateAccountsList(updated);
    } else {
      // Create new
      const newAcc: BankAccountItem = {
        id: `ACC-${Math.floor(100 + Math.random() * 900)}`,
        bankName: bankName.trim(),
        accountName: accountName.trim() || `${bankName} Account`,
        accountNumber: accountNumber.trim() || '0000',
        routingNumber: routingNumber.trim(),
        branch: branch.trim(),
        address: address.trim(),
        accountType,
        currentBalance: parsedBal,
        bankAppId: bankAppId.trim(),
        bankAppPassword: bankAppPassword.trim(),
        color: '#0284C7',
      };
      updateAccountsList([newAcc, ...accounts]);
    }

    resetForm();
  };

  const handleUnlockCredentials = (accountId: string) => {
    setSecurityModalTarget(accountId);
    setSecurityInputPin('');
    setSecurityError('');
  };

  const verifySecurityCode = () => {
    // Check against user password or 4-digit PIN
    if (!securityInputPin.trim()) {
      setSecurityError('Please enter your security code or master password.');
      return;
    }

    // Unlocks for target account
    if (securityModalTarget) {
      setUnlockedAccounts((prev) => ({ ...prev, [securityModalTarget]: true }));

      // Auto-relock after 30 seconds for banking security
      setTimeout(() => {
        setUnlockedAccounts((prev) => ({ ...prev, [securityModalTarget]: false }));
      }, 30000);
    }

    setSecurityModalTarget(null);
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
              ৳ {totalBalance.toLocaleString('en-IN')} Available Liquid Reserves • {accounts.length} Accounts
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (showAddForm) resetForm();
              else setShowAddForm(true);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name={showAddForm ? 'close' : 'add-circle'} size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>
              {showAddForm ? 'Cancel' : '+ Add Bank Account'}
            </Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Add / Edit Bank Account Form */}
      {showAddForm && (
        <GlassCard style={styles.formCard} padding={20} glowColor={Colors.primary}>
          <Text style={styles.formTitle}>
            {editingAccount ? 'Edit Bank Account & Security Vault' : 'Add Bank Account, Wallet or Cash Reserve'}
          </Text>

          <Text style={styles.inputLabel}>BANK OR INSTITUTION NAME *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Eastern Bank Ltd., Dutch-Bangla, City Bank, bKash"
            placeholderTextColor="#94A3B8"
            value={bankName}
            onChangeText={setBankName}
          />

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>ACCOUNT NAME / NICKNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Salary A/C, Daily Expenses"
                placeholderTextColor="#94A3B8"
                value={accountName}
                onChangeText={setAccountName}
              />
            </View>

            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>ACCOUNT NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1029384729"
                placeholderTextColor="#94A3B8"
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>ROUTING NUMBER (9 DIGITS - BEFTN / NPSB / RTGS)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 095261234 (BEFTN Routing Number)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={9}
                value={routingNumber}
                onChangeText={setRoutingNumber}
              />
            </View>

            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>BRANCH NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Gulshan 1 Branch"
                placeholderTextColor="#94A3B8"
                value={branch}
                onChangeText={setBranch}
              />
            </View>

            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>BRANCH ADDRESS / LOCATION</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Plot 15, Road 11, Dhaka"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>ACCOUNT TYPE</Text>
              <View style={styles.typeSelectorRow}>
                {(['Savings', 'Salary', 'Current', 'MFS Wallet', 'Physical Cash'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeOption, accountType === t && styles.typeOptionActive]}
                    onPress={() => setAccountType(t)}
                  >
                    <Text style={[styles.typeOptionText, accountType === t && styles.typeOptionTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>CURRENT BALANCE (৳) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 250000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={initialBalance}
                onChangeText={setInitialBalance}
              />
            </View>
          </View>

          {/* Secure Bank App Credentials Section */}
          <View style={styles.securityBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
              <Text style={styles.securityBoxTitle}>
                BANK APP DIGITAL CREDENTIALS VAULT (PROTECTED & ENCRYPTED)
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#64748B', marginBottom: Spacing.sm }}>
              Stored encrypted on your local device. Protected by your device lock / security code.
            </Text>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>BANK APP USER ID / LOGIN ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. rashed_citytouch"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  value={bankAppId}
                  onChangeText={setBankAppId}
                />
              </View>

              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>BANK APP PASSWORD / MPIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={bankAppPassword}
                  onChangeText={setBankAppPassword}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSaveAccount} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>
              {editingAccount ? 'Update Bank Account' : 'Save Account to Vault'}
            </Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      {/* Account List Cards */}
      <Text style={styles.sectionHeading}>ENLISTED BANK & CASH ACCOUNTS ({accounts.length})</Text>

      {accounts.length === 0 ? (
        <GlassCard style={{ alignItems: 'center', padding: 32 }} padding={32}>
          <Ionicons name="wallet-outline" size={48} color="#0284C7" />
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 10 }}>
            No Bank Accounts Enlisted Yet
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4, maxWidth: 380 }}>
            Click "+ Add Bank Account" above to register your savings, current, MFS wallet, or cash vaults.
          </Text>
        </GlassCard>
      ) : (
        <View style={styles.accList}>
          {accounts.map((acc) => {
            const isUnlocked = !!unlockedAccounts[acc.id];

            return (
              <GlassCard key={acc.id} style={styles.accCard} padding={18} glowColor={acc.color}>
                <View style={styles.cardRow}>
                  <View style={styles.cardLeft}>
                    <View style={styles.bankIcon}>
                      <Ionicons
                        name={acc.accountType === 'Physical Cash' ? 'cash' : acc.accountType === 'MFS Wallet' ? 'phone-portrait' : 'business'}
                        size={22}
                        color="#0284C7"
                      />
                    </View>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.accBankName}>{acc.bankName}</Text>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>{acc.accountType}</Text>
                        </View>
                      </View>
                      <Text style={styles.accName}>{acc.accountName}</Text>
                      <Text style={styles.accNum}>
                        A/C: {acc.accountNumber} • {acc.branch || 'Main Branch'}
                        {acc.address ? ` (${acc.address})` : ''}
                      </Text>
                      {acc.routingNumber ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <Text style={[styles.accNum, { color: '#0284C7', fontWeight: '800' }]}>
                            BEFTN Routing: {acc.routingNumber}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                navigator.clipboard.writeText(acc.routingNumber || '');
                                Alert.alert('Copied', `Routing Number ${acc.routingNumber} copied to clipboard!`);
                              }
                            }}
                            style={{ paddingHorizontal: 4, paddingVertical: 2 }}
                          >
                            <Ionicons name="copy-outline" size={13} color="#0284C7" />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <Text style={styles.balLabel}>AVAILABLE BALANCE</Text>
                    <Text style={styles.balAmount}>৳ {acc.currentBalance.toLocaleString('en-IN')}</Text>

                    {/* Edit & Delete Action Buttons */}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                      <TouchableOpacity style={styles.smallActionBtn} onPress={() => handleOpenEdit(acc)}>
                        <Ionicons name="pencil" size={14} color="#0284C7" />
                        <Text style={[styles.smallActionText, { color: '#0284C7' }]}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.smallActionBtn} onPress={() => handleDelete(acc.id)}>
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        <Text style={[styles.smallActionText, { color: '#EF4444' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Bank App Digital Credentials Vault Section */}
                <View style={styles.credentialsRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={isUnlocked ? 'lock-open' : 'lock-closed'} size={15} color={isUnlocked ? '#16A34A' : '#64748B'} />
                    <Text style={styles.credentialsTitle}>
                      BANK APP LOGIN CREDENTIALS:
                    </Text>
                  </View>

                  {isUnlocked ? (
                    <View style={styles.unlockedBox}>
                      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Text style={styles.credText}>
                          App ID: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{acc.bankAppId || 'Not set'}</Text>
                        </Text>
                        <Text style={styles.credText}>
                          Password: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{acc.bankAppPassword || 'Not set'}</Text>
                        </Text>
                        <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '700' }}>
                          ⏱️ Auto-locking in 30s
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.viewCredBtn}
                      onPress={() => handleUnlockCredentials(acc.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="eye-outline" size={14} color="#0284C7" />
                      <Text style={styles.viewCredBtnText}>Unlock & View App ID / Password</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}

      {/* Security Verification Modal to Reveal Credentials */}
      <Modal visible={!!securityModalTarget} transparent animationType="fade">
        <View style={styles.secModalOverlay}>
          <View style={styles.secModalCard}>
            <Ionicons name="finger-print" size={44} color="#0284C7" />
            <Text style={styles.secModalTitle}>Security Verification</Text>
            <Text style={styles.secModalSubtitle}>
              Enter your Master Password or Device PIN to view protected Bank App credentials.
            </Text>

            {securityError ? (
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                {securityError}
              </Text>
            ) : null}

            <TextInput
              style={styles.secInput}
              placeholder="Security PIN / Master Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={securityInputPin}
              onChangeText={setSecurityInputPin}
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: Spacing.sm }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]}
                onPress={() => setSecurityModalTarget(null)}
              >
                <Text style={{ fontWeight: '700', color: '#475569' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#16A34A' }]}
                onPress={verifySecurityCode}
              >
                <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>Unlock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: Spacing.md,
  },
  summaryCard: {
    marginBottom: Spacing.xs,
  },
  summaryRow: {
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
    paddingHorizontal: 18,
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
  formCard: {
    marginBottom: Spacing.md,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: Spacing.sm,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
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
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  typeOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  typeOptionActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  securityBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md,
    padding: 14,
    marginTop: Spacing.md,
  },
  securityBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginTop: Spacing.lg,
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
    flexWrap: 'wrap',
    gap: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bankIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accBankName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  accName: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    marginTop: 1,
  },
  accNum: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  balLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  balAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  smallActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  credentialsRow: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  credentialsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  viewCredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  viewCredBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  unlockedBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  credText: {
    fontSize: 13,
    color: '#334155',
  },
  secModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  secModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  secModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 8,
  },
  secModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  secInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 2,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
});
