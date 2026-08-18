import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
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

    if (selectedType === 'birthday') {
      payload = {
        id: `BD-${Math.floor(100 + Math.random() * 900)}`,
        personName: title.trim(),
        relation: category || 'Family',
        birthDate: subInfo.trim() || '1995-01-01',
        giftBudget: parsedAmount,
        customGreetingMessage: extraField.trim() || undefined,
      };
    } else if (selectedType === 'insurance') {
      payload = {
        id: `INS-${Math.floor(100 + Math.random() * 900)}`,
        policyName: title.trim(),
        insurer: category.trim() || 'Life Insurance Corp',
        policyNumber: subInfo.trim() || `POL-${Math.floor(100000 + Math.random() * 900000)}`,
        sumAssured: parsedAmount,
        premiumAmount: parseFloat(extraField.replace(/,/g, '')) || Math.round(parsedAmount * 0.05),
        premiumFrequency: 'annual',
        policyTermYears: 15,
        premiumPayingTermYears: 10,
        paidPremiumsTotal: Math.round(parsedAmount * 0.15),
        projectedMaturityBonus: Math.round(parsedAmount * 0.4),
        startDate: '2023-01-01',
        nextPremiumDueDate: '2026-11-15',
        nomineeName: 'Family Beneficiary',
        status: 'active',
      };
    }

    onSave(selectedType, payload);
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Universal Data Entry Vault</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Type Selector Horizontal Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {[
              { id: 'income', label: '💰 Income', color: Colors.primary },
              { id: 'expense', label: '💸 Expense', color: Colors.danger },
              { id: 'asset', label: '🏰 Asset', color: Colors.secondary },
              { id: 'loan', label: '💳 Loan / Debt', color: Colors.danger },
              { id: 'bank', label: '💵 Bank / Cash', color: Colors.primary },
              { id: 'insurance', label: '🛡️ Life Insurance', color: Colors.secondary },
              { id: 'birthday', label: '🎂 Birthday', color: Colors.accent },
            ].map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setSelectedType(t.id as any)}
                style={[
                  styles.typeTab,
                  selectedType === t.id && {
                    backgroundColor: `${t.color}25`,
                    borderColor: t.color,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeTabText,
                    selectedType === t.id && { color: t.color, fontWeight: '800' },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Dynamic Labels based on Type */}
            <Text style={styles.label}>
              {selectedType === 'birthday'
                ? 'PERSON NAME (e.g. Sarah / Mom / Son) *'
                : selectedType === 'insurance'
                ? 'POLICY NAME (e.g. MetLife Wealth Assurance) *'
                : selectedType === 'asset'
                ? 'ASSET DESCRIPTION (e.g. Purbachal 5-Katha Plot) *'
                : selectedType === 'loan'
                ? 'LOAN TITLE (e.g. City Bank Home Loan) *'
                : 'TITLE / SOURCE NAME *'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Type entry title..."
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Amount / Valuation */}
            <Text style={styles.label}>
              {selectedType === 'birthday'
                ? 'GIFT / CELEBRATION BUDGET (৳)'
                : selectedType === 'insurance'
                ? 'SUM ASSURED / DEATH BENEFIT (৳) *'
                : selectedType === 'asset'
                ? 'CURRENT MARKET VALUATION (৳) *'
                : selectedType === 'loan'
                ? 'OUTSTANDING PRINCIPAL AMOUNT (৳) *'
                : 'AMOUNT (৳) *'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 50000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Category / Institution */}
            <Text style={styles.label}>
              {selectedType === 'birthday'
                ? 'RELATIONSHIP (Spouse / Child / Parent / Friend)'
                : selectedType === 'insurance'
                ? 'INSURER (e.g. MetLife / Delta Life / Pragati)'
                : selectedType === 'asset'
                ? 'ASSET CATEGORY (Real Estate / Gold / Vehicle / Commercial)'
                : selectedType === 'loan'
                ? 'LENDER (Bank Name or Outside-Bank / Private)'
                : selectedType === 'expense'
                ? 'SECTOR (Household / Bank Loan EMI / Asset EMI / Bills)'
                : 'CATEGORY / SOURCE TYPE'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Real Estate, Household, Salary..."
              placeholderTextColor={Colors.textMuted}
              value={category}
              onChangeText={setCategory}
            />

            {/* Sub-Info */}
            <Text style={styles.label}>
              {selectedType === 'birthday'
                ? 'BIRTH DATE (YYYY-MM-DD e.g. 1994-08-22)'
                : selectedType === 'insurance'
                ? 'POLICY NUMBER (e.g. POL-99201)'
                : selectedType === 'asset'
                ? 'UoM / QUANTITY (e.g. 5 Katha, 15 Bhori, 1450 Sqft)'
                : selectedType === 'loan'
                ? 'MONTHLY EMI AMOUNT (৳ / month)'
                : 'ADDITIONAL REFERENCE / ACCOUNT NUMBER'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Additional details..."
              placeholderTextColor={Colors.textMuted}
              value={subInfo}
              onChangeText={setSubInfo}
            />

            {/* Extra Field */}
            {selectedType === 'insurance' && (
              <>
                <Text style={styles.label}>ANNUAL PREMIUM AMOUNT (৳ / year)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 65000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={extraField}
                  onChangeText={setExtraField}
                />
              </>
            )}

            {selectedType === 'birthday' && (
              <>
                <Text style={styles.label}>CUSTOM GREETING CARD MESSAGE (OPTIONAL)</Text>
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  placeholder="Custom wish message..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  value={extraField}
                  onChangeText={setExtraField}
                />
              </>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Text style={styles.submitBtnText}>Save Entry to Dashboard</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F1320',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.displayM,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  typeScroll: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  typeTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 6,
  },
  typeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  formScroll: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
});
