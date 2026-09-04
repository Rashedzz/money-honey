import React, { useState, useEffect } from 'react';
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
import { FormDraftManager } from '../../utils/formDrafts';

export type EntryType = 'bank' | 'loan' | 'income' | 'expense' | 'asset' | 'stock' | 'insurance' | 'birthday';

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

  // Sync initialType
  useEffect(() => {
    if (initialType) setSelectedType(initialType);
  }, [initialType]);

  // Restore draft when modal opens or selectedType changes
  useEffect(() => {
    if (visible) {
      const draft = FormDraftManager.loadDraft(`universal_${selectedType}`, {
        title: '',
        amount: '',
        category: '',
        subInfo: '',
        extraField: '',
      });
      setTitle(draft.title || '');
      setAmount(draft.amount || '');
      setCategory(draft.category || '');
      setSubInfo(draft.subInfo || '');
      setExtraField(draft.extraField || '');
    }
  }, [visible, selectedType]);

  // Auto-save draft on any input change so data is never lost if user minimizes app
  useEffect(() => {
    if (visible && (title || amount || category || subInfo || extraField)) {
      FormDraftManager.saveDraft(`universal_${selectedType}`, {
        title,
        amount,
        category,
        subInfo,
        extraField,
      });
    }
  }, [title, amount, category, subInfo, extraField, selectedType, visible]);

  const resetForm = () => {
    FormDraftManager.clearDraft(`universal_${selectedType}`);
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

    if (selectedType === 'stock') {
      const qty = parseFloat(subInfo) || 1;
      const bPrice = parsedAmount || 0;
      const cPrice = parseFloat(extraField) || bPrice;
      const invested = qty * bPrice;
      const val = qty * cPrice;
      const gain = val - invested;
      const gainPct = invested > 0 ? (gain / invested) * 100 : 0;
      payload = {
        id: `STK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        symbol: title.trim().toUpperCase(),
        companyName: category.trim() || title.trim().toUpperCase(),
        exchange: 'DSE',
        quantity: qty,
        buyPrice: bPrice,
        currentPrice: cPrice,
        totalInvested: invested,
        currentValue: val,
        gainLoss: gain,
        gainLossPercent: gainPct,
        sector: category.trim() || 'Equities',
      };
    }

    if (selectedType === 'bank') {
      const newAcc = {
        id: `ACC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        bankName: title.trim(),
        accountType: category.trim() || 'Savings Account',
        accountNumber: subInfo.trim() || `****${Math.floor(1000 + Math.random() * 9000)}`,
        currentBalance: parsedAmount,
        routingNumber: extraField.trim() || undefined,
        color: '#0284C7',
      };
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = window.localStorage.getItem('mh_user_bank_accounts');
          const existing = raw ? JSON.parse(raw) : [];
          window.localStorage.setItem('mh_user_bank_accounts', JSON.stringify([...existing, newAcc]));
        }
      } catch (e) {}
    }

    onSave(selectedType, payload);
    resetForm();
    onClose();
  };

  const tabs: Array<{ id: EntryType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
    { id: 'stock', label: 'Stock / Equity', icon: 'trending-up', color: '#16A34A' },
    { id: 'income', label: 'Income', icon: 'wallet', color: Colors.primary },
    { id: 'expense', label: 'Expense', icon: 'receipt', color: Colors.danger },
    { id: 'asset', label: 'Physical Asset', icon: 'business', color: Colors.secondary },
    { id: 'loan', label: 'Loan / Debt', icon: 'card', color: Colors.danger },
    { id: 'bank', label: 'Bank / Cash', icon: 'wallet-outline', color: Colors.primary },
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
          <ScrollView
            showsVerticalScrollIndicator={true}
            style={styles.formScroll}
            contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
          >
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
                <Text style={styles.label}>BANK / INSTITUTION NAME *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. City Bank, BRAC Bank, Eastern Bank, bKash, Cash"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>ACCOUNT NUMBER</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1029384729"
                      placeholderTextColor={Colors.textMuted}
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>BEFTN ROUTING NUMBER (9 DIGITS)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 095261234"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      maxLength={9}
                      value={extraField}
                      onChangeText={setExtraField}
                    />
                  </View>
                </View>

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
                      placeholder="e.g. Savings, Salary, Current, Wallet"
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

            {selectedType === 'stock' && (
              <>
                <Text style={styles.label}>POPULAR DSE STOCKS (CLICK TO AUTO-FILL)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {['GP', 'BATBC', 'BEXIMCO', 'SQURPHARMA', 'ROBI', 'RENATA', 'BRACBANK', 'LHBL', 'ISLAMIBANK'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => {
                        setTitle(s);
                        if (s === 'GP') setCategory('Grameenphone Ltd. (Telecom)');
                        else if (s === 'BATBC') setCategory('British American Tobacco BD (FMCG)');
                        else if (s === 'SQURPHARMA') setCategory('Square Pharmaceuticals (Pharma)');
                        else if (s === 'ROBI') setCategory('Robi Axiata Ltd. (Telecom)');
                        else if (s === 'BRACBANK') setCategory('BRAC Bank PLC (Banking)');
                        else setCategory(`${s} (DSE Equities)`);
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 6,
                        backgroundColor: title === s ? '#16A34A' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: title === s ? '#15803D' : '#E2E8F0',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: title === s ? '#FFFFFF' : '#334155' }}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>STOCK TICKER / SYMBOL *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. GP, BEXIMCO, BATBC"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="characters"
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>COMPANY NAME / SECTOR</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Grameenphone (Telecom)"
                      placeholderTextColor={Colors.textMuted}
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>TOTAL SHARES / QUANTITY *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 500"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>BUY PRICE PER SHARE (৳) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 286.50"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.label}>CURRENT MARKET PRICE (CMP) (৳) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 312.00 (leave blank to use buy price)"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={extraField}
                      onChangeText={setExtraField}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>EXCHANGE</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: '#F8FAFC' }]}
                      editable={false}
                      value="Dhaka Stock Exchange (DSE)"
                    />
                  </View>
                </View>

                {/* Real-time Live P&L Preview Card */}
                {(() => {
                  const q = parseFloat(subInfo) || 0;
                  const bp = parseFloat(amount.replace(/,/g, '')) || 0;
                  const cp = parseFloat(extraField.replace(/,/g, '')) || bp;
                  const inv = q * bp;
                  const val = q * cp;
                  const pnl = val - inv;
                  const pnlPct = inv > 0 ? (pnl / inv) * 100 : 0;
                  const isGain = pnl >= 0;

                  if (q <= 0 || bp <= 0) return null;

                  return (
                    <View
                      style={{
                        backgroundColor: isGain ? '#F0FDF4' : '#FEF2F2',
                        borderRadius: 10,
                        padding: 12,
                        marginTop: 8,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: isGain ? '#BBF7D0' : '#FECACA',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: isGain ? '#15803D' : '#B91C1C',
                          marginBottom: 6,
                          letterSpacing: 0.5,
                        }}
                      >
                        ⚡ REAL-TIME VALUATION & P/L CALCULATION PREVIEW
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <View>
                          <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700' }}>TOTAL INVESTED</Text>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>
                            ৳ {inv.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View>
                          <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700' }}>MARKET VALUATION</Text>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>
                            ৳ {val.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View>
                          <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700' }}>NET PROFIT / LOSS</Text>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: isGain ? '#16A34A' : '#DC2626' }}>
                            {isGain ? '+' : '−'}৳ {Math.abs(pnl).toLocaleString('en-IN')} ({pnlPct.toFixed(2)}%)
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}
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
    width: '96%',
    maxWidth: 640,
    height: '90%',
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#0369A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  formScroll: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    padding: 8,
    borderRadius: Radius.full,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  typeScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: Spacing.sm,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 15,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
