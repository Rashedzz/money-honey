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
import { AssetItem } from '../../finance/assetEvaluation';

interface AddAssetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (asset: AssetItem) => void;
}

const DEFAULT_CATEGORIES = [
  'Real Estate',
  'Precious Metals',
  'Vehicles',
  'Commercial',
  'Agriculture',
  'Equities',
  'Other',
];

const DEFAULT_UOMS = ['Katha', 'Bhori', 'Grams', 'Decimal', 'Sq. Ft', 'Units'];

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Real Estate');
  const [customCategory, setCustomCategory] = useState('');
  const [currentValuation, setCurrentValuation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [uom, setUom] = useState('Katha');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [appreciationRate, setAppreciationRate] = useState('12');

  const handleSave = () => {
    if (!name.trim() || !currentValuation.trim()) return;

    const val = parseFloat(currentValuation.replace(/,/g, '')) || 0;
    const inc = parseFloat(monthlyIncome.replace(/,/g, '')) || 0;
    const qty = quantity ? parseFloat(quantity) : undefined;
    const appRate = parseFloat(appreciationRate) || 8;
    const finalCategory = customCategory.trim() || category;
    const ratePerUom = qty && qty > 0 ? Math.round(val / qty) : undefined;

    const newAsset: AssetItem = {
      id: `AST-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      category: finalCategory,
      purchasePrice: val,
      currentValuation: val,
      quantity: qty,
      uom: qty ? uom : undefined,
      currentRatePerUoM: ratePerUom,
      monthlyIncome: inc,
      appreciationRateAnnualPct: appRate,
      isIdle: inc === 0,
      acquiredDate: new Date().toISOString().split('T')[0],
    };

    onSave(newAsset);
    // Reset form
    setName('');
    setCurrentValuation('');
    setMonthlyIncome('');
    setQuantity('');
    setCustomCategory('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Physical / Tangible Asset</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={[styles.formScroll, { flex: 1, overflowY: 'auto' as any }]}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
          >
            {/* Asset Name */}
            <Text style={styles.label}>ASSET NAME & DESCRIPTION *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Purbachal 5-Katha Land Plot"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Category Selector */}
            <Text style={styles.label}>ASSET CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {DEFAULT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => {
                    setCategory(cat);
                    setCustomCategory('');
                  }}
                  style={[
                    styles.chip,
                    category === cat && !customCategory && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat && !customCategory && styles.chipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Custom Category Input */}
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Or type custom category (e.g. Luxury Watches)"
              placeholderTextColor={Colors.textMuted}
              value={customCategory}
              onChangeText={setCustomCategory}
            />

            {/* Current Valuation & Monthly Income Row */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>CURRENT VALUATION (৳) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 17500000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={currentValuation}
                  onChangeText={setCurrentValuation}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>MONTHLY INCOME (৳)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0 if Idle Asset"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={monthlyIncome}
                  onChangeText={setMonthlyIncome}
                />
              </View>
            </View>

            {/* UoM & Quantity (Optional for Land/Gold) */}
            <Text style={styles.label}>QUANTITY & UNIT OF MEASURE (UoM - OPTIONAL)</Text>
            <View style={styles.row}>
              <View style={[styles.col, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Qty (e.g. 5)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>
              <View style={[styles.col, { flex: 1.5 }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.uomRow}>
                  {DEFAULT_UOMS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      onPress={() => setUom(u)}
                      style={[styles.uomBtn, uom === u && styles.uomBtnActive]}
                    >
                      <Text style={[styles.uomBtnText, uom === u && styles.uomBtnTextActive]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Expected Appreciation Rate % */}
            <Text style={styles.label}>PROJECTED ANNUAL APPRECIATION (% YoY)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 14.5"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={appreciationRate}
              onChangeText={setAppreciationRate}
            />

            <View style={styles.hintBox}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
              <Text style={styles.hintText}>
                If monthly income is ৳0, this asset will automatically be audited and tracked as an
                <Text style={{ color: Colors.accent, fontWeight: '700' }}> Idle Asset </Text>
                with capital lock analysis.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Text style={styles.submitBtnText}>Save Asset to Portfolio</Text>
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
    height: '88vh',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  formScroll: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: 'rgba(0, 229, 179, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  uomRow: {
    flexDirection: 'row',
  },
  uomBtn: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginRight: 4,
  },
  uomBtnActive: {
    backgroundColor: 'rgba(0, 229, 179, 0.2)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  uomBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  uomBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 229, 179, 0.06)',
    padding: 10,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 179, 0.15)',
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
});
