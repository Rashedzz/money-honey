import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export type EntryType = 'bank' | 'loan' | 'income' | 'expense' | 'asset' | 'insurance' | 'birthday';

interface UniversalEntryModalProps {
  visible: boolean;
  initialType?: EntryType;
  onClose: () => void;
  onSave: (type: EntryType, data: any) => void;
}

export const UniversalEntryModal: React.FC<UniversalEntryModalProps> = ({
  visible,
  initialType = 'income',
  onClose,
  onSave,
}) => {
  const [selectedType, setSelectedType] = useState<EntryType>(initialType);

  // Common Fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subInfo, setSubInfo] = useState('');
  const [extraField, setExtraField] = useState('');

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCategory('');
    setSubInfo('');
    setExtraField('');
  };

  const handleSave = () => {
    if (!title.trim() && selectedType !== 'birthday') return;

    const parsedAmount = parseFloat(amount.replace(/,/g, '')) || 0;

    let payload: any = {
      id: `${selectedType.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      amount: parsedAmount,
      category: category.trim() || 'General',
      subInfo: subInfo.trim(),
      extra: extraField.trim(),
      createdAt: new Date().toISOString(),
    };

    if (selectedType === 'asset') {
      payload = {
        id: `AST-${Math.floor(100 + Math.random() * 900)}`,
        name: title.trim(),
        category: category.trim() || 'Real Estate',
        purchasePrice: parsedAmount,
        currentValuation: parsedAmount,
        monthlyIncome: parseFloat(subInfo) || 0,
        isIdle: (parseFloat(subInfo) || 0) === 0,
        appreciationRateAnnualPct: parseFloat(extraField) || 5.0,
      };
    } else if (selectedType === 'insurance') {
      payload = {
        id: `INS-${Math.floor(100 + Math.random() * 900)}`,
        policyName: title.trim(),
        insurer: category.trim() || 'Insurance Provider',
        sumAssured: parsedAmount,
        premiumAmount: parseFloat(subInfo) || 0,
        premiumFrequency: 'annual',
        nomineeName: extraField.trim() || 'Family Nominee',
        status: 'active',
      };
    } else if (selectedType === 'birthday') {
      payload = {
        id: `BD-${Math.floor(100 + Math.random() * 900)}`,
        personName: title.trim(),
        relation: category.trim() || 'Family',
        birthDate: subInfo.trim() || '1995-01-01',
        giftBudget: parsedAmount || 5000,
        notifyDaysBefore: 7,
      };
    }

    onSave(selectedType, payload);
    resetForm();
    onClose();
  };

  const tabs: Array<{ id: EntryType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
    { id: 'income', label: 'Income', icon: 'trending-up', color: Colors.primary },
    { id: 'expense', label: 'Expense', icon: 'trending-down', color: Colors.danger },
    { id: 'asset', label: 'Asset', icon: 'business', color: Colors.secondary },
    { id: 'loan', label: 'Loan / Debt', icon: 'card', color: Colors.danger },
    { id: 'bank', label: 'Bank / Cash', icon: 'wallet', color: Colors.primary },
    { id: 'insurance', label: 'Insurance', icon: 'shield-checkmark', color: Colors.secondary },
    { id: 'birthday', label: 'Birthday', icon: 'gift', color: Colors.accent },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Universal Data Entry Vault</Text>
                <Text style={styles.subtitle}>Enlist transactions, assets & financial entities</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Type Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScroll}>
            {tabs.map((tab) => {
              const isSelected = selectedType === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.typeTab,
                    isSelected && { backgroundColor: `${tab.color}20`, borderColor: tab.color },
                  ]}
                  onPress={() => setSelectedType(tab.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tab.icon}
                    size={13}
                    color={isSelected ? tab.color : Colors.textMuted}
                  />
                  <Text style={[styles.typeTabText, isSelected && { color: tab.color }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Dynamic Form Content */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
            {selectedType === 'income' && (
              <>
                <Text style={styles.label}>INCOME TITLE / SOURCE *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Monthly Tech Salary, Flat Rent, Sanchaypatra Coupon"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>AMOUNT (৳ BDT) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 135000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>CATEGORY</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Salary, Rental Yield, Investment"
                      placeholderTextColor={Colors.textMuted}
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>
                </View>
              </>
            )}

            {selectedType === 'expense' && (
              <>
                <Text style={styles.label}>EXPENSE DESCRIPTION *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Groceries, Flat Maintenance, Electricity"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>AMOUNT (৳ BDT) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 28000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>EXPENSE SECTOR</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Household, Asset Cost, EMI"
                      placeholderTextColor={Colors.textMuted}
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>
                </View>

                <Text style={styles.label}>LINKED ASSET ID (IF APPLICABLE)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. AST-101 (Flat Maintenance), AST-105 (Car Servicing)"
                  placeholderTextColor={Colors.textMuted}
                  value={extraField}
                  onChangeText={setExtraField}
                />
              </>
            )}

            {selectedType === 'asset' && (
              <>
                <Text style={styles.label}>ASSET NAME & LOCATION *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Purbachal 5-Katha Land, 22K Gold, Gulshan Flat"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>MARKET VALUE (৳) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 17500000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>MONTHLY RENT/YIELD (৳)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 65000 (0 if idle)"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>CATEGORY</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Real Estate, Gold, Vehicle"
                      placeholderTextColor={Colors.textMuted}
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>ANNUAL APPRECIATION (%)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 12.5"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={extraField}
                      onChangeText={setExtraField}
                    />
                  </View>
                </View>
              </>
            )}

            {selectedType === 'loan' && (
              <>
                <Text style={styles.label}>LOAN TITLE / PURPOSE *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Apartment Home Loan, Auto Loan, Private Debt"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>OUTSTANDING PRINCIPAL (৳) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 4250000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>MONTHLY EMI (৳) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 45000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                </View>

                <Text style={styles.label}>LENDER / INSTITUTION</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. City Bank Ltd. or Outside Bank Private Lender"
                  placeholderTextColor={Colors.textMuted}
                  value={category}
                  onChangeText={setCategory}
                />
              </>
            )}

            {selectedType === 'bank' && (
              <>
                <Text style={styles.label}>BANK / ACCOUNT NAME *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. City Bank Savings, BRAC Salary, bKash, Cash"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>CURRENT BALANCE (৳) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 650000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>ACCOUNT TYPE</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Savings, Current, Wallet, Cash"
                      placeholderTextColor={Colors.textMuted}
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>
                </View>
              </>
            )}

            {selectedType === 'insurance' && (
              <>
                <Text style={styles.label}>POLICY NAME *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. MetLife Guaranteed Savings Plan"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>SUM ASSURED / COVER (৳) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 10000000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>ANNUAL PREMIUM (৳)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 85000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                </View>

                <Text style={styles.label}>NOMINEE NAME & RELATION</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sarah Rahman (Spouse)"
                  placeholderTextColor={Colors.textMuted}
                  value={extraField}
                  onChangeText={setExtraField}
                />
              </>
            )}

            {selectedType === 'birthday' && (
              <>
                <Text style={styles.label}>PERSON NAME *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sarah Rahman, Ayan Rahman"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>DATE OF BIRTH (YYYY-MM-DD) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1994-08-24"
                      placeholderTextColor={Colors.textMuted}
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>GIFT BUDGET (৳)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 15000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={18} color="#020617" />
              <Text style={styles.submitBtnText}>Save Entry to Portfolio</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: '#0F172A',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: Spacing.lg,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.heading,
    fontSize: 15,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 10,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  typeScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  typeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  formScroll: {
    marginTop: Spacing.xs,
  },
  label: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#020617',
  },
});
