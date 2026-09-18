/**
 * VoiceInputModal.tsx
 * Intelligent Voice Financial Input System for Money-Honey.
 * Uses Web Speech Recognition API with Bengali & English phonetic financial parsing.
 * Automatically extracts transaction amount, type, category, and target account.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../../theme';
import {
  TransactionManager,
  BankAccountItem,
  CASH_IN_HAND_ID,
} from '../../services/transactionManager';

interface VoiceInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  accounts?: BankAccountItem[];
}

export interface ParsedVoiceCommand {
  type: 'expense' | 'income' | 'withdrawal' | 'transfer';
  amount: number;
  title: string;
  category: string;
  targetAccountId: string;
  targetAccountName: string;
  date: string;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  visible,
  onClose,
  onSaved,
  accounts = [],
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusText, setStatusText] = useState('Tap the microphone and speak your transaction...');
  const [parsedData, setParsedData] = useState<ParsedVoiceCommand | null>(null);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);

  // Animation pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recognitionRef = useRef<any>(null);

  const activeAccounts = accounts.length > 0 ? accounts : TransactionManager.getAccountsWithCash();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setHasSpeechSupport(false);
        setStatusText('Speech recognition is not directly supported in this browser. You can type or select sample voice commands below.');
      }
    }
  }, []);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  // Stop listening when modal closes
  useEffect(() => {
    if (!visible) {
      stopListening();
      setTranscript('');
      setParsedData(null);
    }
  }, [visible]);

  const startListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      Alert.alert(
        'Speech Recognition',
        'Your browser does not have the Web Speech API enabled. You can type your voice command below.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Supports English with multilingual phonetic numbers

      recognition.onstart = () => {
        setIsListening(true);
        setStatusText('🎙️ Listening... Speak naturally (e.g. "Spent 1500 taka on groceries from Sonali Bank")');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        parseVoiceText(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setStatusText('⚠️ Microphone permission denied. Please allow microphone access in your browser.');
        } else {
          setStatusText('Speech paused. Tap mic to speak again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (!transcript) {
          setStatusText('Listening stopped. Tap mic to try again or choose a preset.');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.warn('Speech launch error:', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  /**
   * Intelligently parses spoken sentence into financial transaction components
   */
  const parseVoiceText = (text: string) => {
    if (!text.trim()) return;

    const raw = text.toLowerCase();

    // 1. Determine Transaction Type
    let type: ParsedVoiceCommand['type'] = 'expense';
    if (
      raw.includes('salary') ||
      raw.includes('income') ||
      raw.includes('earned') ||
      raw.includes('received') ||
      raw.includes('deposit') ||
      raw.includes('বেতন') ||
      raw.includes('মুনাফা') ||
      raw.includes('টাকা পেলাম')
    ) {
      type = 'income';
    } else if (
      raw.includes('withdraw') ||
      raw.includes('withdrew') ||
      raw.includes('atm') ||
      raw.includes('cash out') ||
      raw.includes('উত্তোলন')
    ) {
      type = 'withdrawal';
    } else if (
      raw.includes('transfer') ||
      raw.includes('sent') ||
      raw.includes('send') ||
      raw.includes('পাঠালাম')
    ) {
      type = 'transfer';
    }

    // 2. Extract Amount
    let amount = 0;
    // Replace Bengali digits with English digits
    const bengaliMap: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    let normalized = raw;
    for (const [bn, en] of Object.entries(bengaliMap)) {
      normalized = normalized.split(bn).join(en);
    }

    // Handle "50k", "10k"
    const kMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    if (kMatch) {
      amount = parseFloat(kMatch[1]) * 1000;
    }

    // Handle "1 lakh", "2.5 lakh", "লাখ"
    const lakhMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|লাখ)/i);
    if (!amount && lakhMatch) {
      amount = parseFloat(lakhMatch[1]) * 100000;
    }

    // Handle normal digits e.g. "1500", "25,000", "500 taka"
    if (!amount) {
      const numMatch = normalized.match(/\b(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\b/);
      if (numMatch) {
        amount = parseFloat(numMatch[1].replace(/,/g, ''));
      }
    }

    // 3. Extract Target Account
    let targetAccount = activeAccounts.find((a) => a.id === CASH_IN_HAND_ID) || activeAccounts[0];
    if (
      raw.includes('sonali') ||
      raw.includes('সোনালী') ||
      raw.includes('bank')
    ) {
      const sonali = activeAccounts.find((a) => a.bankName.toLowerCase().includes('sonali'));
      if (sonali) targetAccount = sonali;
    } else if (
      raw.includes('cash') ||
      raw.includes('hand') ||
      raw.includes('wallet') ||
      raw.includes('ক্যাশ') ||
      raw.includes('নগদ')
    ) {
      const cash = activeAccounts.find((a) => a.id === CASH_IN_HAND_ID || a.accountType === 'Physical Cash');
      if (cash) targetAccount = cash;
    } else {
      // Check other accounts by name
      for (const acc of activeAccounts) {
        if (raw.includes(acc.bankName.toLowerCase())) {
          targetAccount = acc;
          break;
        }
      }
    }

    // 4. Extract Category & Title
    let category = 'Household & Living';
    let title = 'General Transaction';

    if (type === 'income') {
      category = 'Salary';
      title = 'Monthly Tech Salary Deposit';
      if (raw.includes('rent') || raw.includes('ভাড়া')) {
        category = 'Rental Income';
        title = 'Flat Rental Income Deposit';
      } else if (raw.includes('sanchay') || raw.includes('profit') || raw.includes('মুনাফা')) {
        category = 'Sanchaypatra Profit';
        title = 'Sanchaypatra Quarterly Payout';
      }
    } else if (type === 'withdrawal') {
      category = 'Cash Reserve';
      title = 'ATM Cash Withdrawal into Wallet';
    } else if (type === 'transfer') {
      category = 'Inter-Bank Transfer';
      title = 'Fund Transfer';
    } else {
      // Expense categories
      if (raw.includes('grocery') || raw.includes('groceries') || raw.includes('bazar') || raw.includes('বাজার')) {
        category = 'Household & Living';
        title = 'Groceries & Kitchen Supplies';
      } else if (raw.includes('dinner') || raw.includes('lunch') || raw.includes('food') || raw.includes('restaurant') || raw.includes('খাবার') || raw.includes('নাস্তা')) {
        category = 'Personal / Discretionary';
        title = 'Dining, Meals & Food';
      } else if (raw.includes('electricity') || raw.includes('gas') || raw.includes('water') || raw.includes('internet') || raw.includes('bill') || raw.includes('বিদ্যুৎ')) {
        category = 'Household & Living';
        title = 'Utility & Service Bills';
      } else if (raw.includes('fuel') || raw.includes('octane') || raw.includes('petrol') || raw.includes('cng') || raw.includes('uber') || raw.includes('transport') || raw.includes('গাড়ি')) {
        category = 'Household & Living';
        title = 'Vehicle Fuel & Transportation';
      } else if (raw.includes('rent') || raw.includes('flat') || raw.includes('service charge') || raw.includes('বাসা ভাড়া')) {
        category = 'Household & Living';
        title = 'House Rent & Service Charge';
      } else if (raw.includes('medicine') || raw.includes('doctor') || raw.includes('hospital') || raw.includes('ঔষধ')) {
        category = 'Personal / Discretionary';
        title = 'Healthcare & Medicine';
      } else {
        // Use spoken words as title
        const cleanTitle = text
          .replace(/\b(\d+(?:\.\d+)?)\b/g, '')
          .replace(/(spent|bought|paid|taka|bdt|from|into|cash|bank|sonali)/gi, '')
          .trim();
        title = cleanTitle ? cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1) : 'Daily Expense';
      }
    }

    setParsedData({
      type,
      amount: amount || 0,
      title,
      category,
      targetAccountId: targetAccount ? targetAccount.id : CASH_IN_HAND_ID,
      targetAccountName: targetAccount ? targetAccount.bankName : 'Cash in Hand',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleApplyPreset = (text: string) => {
    setTranscript(text);
    parseVoiceText(text);
    setStatusText('✅ Command parsed! Review the entry card below and tap "Confirm & Record".');
  };

  const handleSaveParsedEntry = () => {
    if (!parsedData || parsedData.amount <= 0) {
      Alert.alert('Incomplete Entry', 'Please ensure an amount greater than 0 has been recognized or entered.');
      return;
    }

    try {
      if (parsedData.type === 'expense') {
        TransactionManager.recordExpense({
          title: parsedData.title,
          amount: parsedData.amount,
          category: parsedData.category,
          accountId: parsedData.targetAccountId,
          date: parsedData.date,
          notes: `Voice Data Input: "${transcript}"`,
        });
      } else if (parsedData.type === 'income') {
        TransactionManager.recordIncome({
          title: parsedData.title,
          amount: parsedData.amount,
          category: parsedData.category,
          accountId: parsedData.targetAccountId,
          date: parsedData.date,
          notes: `Voice Data Input: "${transcript}"`,
        });
      } else if (parsedData.type === 'withdrawal') {
        TransactionManager.recordCashWithdrawal({
          fromBankId: parsedData.targetAccountId,
          amount: parsedData.amount,
          date: parsedData.date,
          notes: `Voice Data Input: "${transcript}"`,
        });
      }

      Alert.alert(
        '🎉 Voice Transaction Saved',
        `৳${parsedData.amount.toLocaleString('en-IN')} recorded as ${parsedData.type.toUpperCase()} under ${parsedData.targetAccountName}.`
      );

      if (onSaved) onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert('Save Error', e?.message || 'Failed to record transaction.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.micBadge}>
                <Ionicons name="mic" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>AI VOICE DATA INPUT</Text>
                <Text style={styles.headerSub}>Speak in English or Bengali to record transactions</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Animated Mic Action Circle */}
            <View style={styles.micSection}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: isListening ? 0.6 : 0,
                  },
                ]}
              />

              <TouchableOpacity
                style={[styles.micBigButton, isListening && styles.micBigButtonActive]}
                onPress={isListening ? stopListening : startListening}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isListening ? 'stop' : 'mic'}
                  size={38}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <Text style={styles.statusLabel}>{statusText}</Text>
            </View>

            {/* Live Spoken Transcript Input / Edit */}
            <View style={styles.transcriptCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.transcriptTitle}>TRANSCRIPT / SPOKEN INPUT:</Text>
                {transcript ? (
                  <TouchableOpacity onPress={() => { setTranscript(''); setParsedData(null); }}>
                    <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: '700' }}>Clear</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <TextInput
                style={styles.transcriptInput}
                placeholder="Or type here: e.g. 'Spent 1500 on groceries from Sonali Bank'..."
                placeholderTextColor="#94A3B8"
                value={transcript}
                onChangeText={(text) => {
                  setTranscript(text);
                  parseVoiceText(text);
                }}
                multiline
              />
            </View>

            {/* Smart Parsed Financial Entry Card */}
            {parsedData && (
              <View style={styles.parsedCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="sparkles" size={16} color="#0284C7" />
                    <Text style={styles.parsedCardTitle}>DETECTED FINANCIAL INTENT</Text>
                  </View>
                  <View
                    style={[
                      styles.typeBadge,
                      parsedData.type === 'expense' && { backgroundColor: '#FEE2E2' },
                      parsedData.type === 'income' && { backgroundColor: '#DCFCE7' },
                      parsedData.type === 'withdrawal' && { backgroundColor: '#E0F2FE' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        parsedData.type === 'expense' && { color: '#DC2626' },
                        parsedData.type === 'income' && { color: '#16A34A' },
                        parsedData.type === 'withdrawal' && { color: '#0284C7' },
                      ]}
                    >
                      {parsedData.type.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Amount & Title */}
                <View style={styles.parsedRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.parsedLabel}>TITLE / DESCRIPTION</Text>
                    <Text style={styles.parsedValTitle}>{parsedData.title}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.parsedLabel}>AMOUNT</Text>
                    <Text style={[styles.parsedValAmount, parsedData.type === 'expense' ? { color: '#DC2626' } : { color: '#16A34A' }]}>
                      {parsedData.type === 'expense' ? '-' : '+'}৳ {parsedData.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Account & Category */}
                <View style={[styles.parsedRow, { marginTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.parsedLabel}>TARGET ACCOUNT</Text>
                    <View style={styles.accountPill}>
                      <Ionicons name="wallet-outline" size={13} color="#0284C7" />
                      <Text style={styles.accountPillText}>{parsedData.targetAccountName}</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.parsedLabel}>CATEGORY</Text>
                    <Text style={styles.categoryText}>{parsedData.category}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.confirmRecordBtn}
                  onPress={handleSaveParsedEntry}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmRecordBtnText}>
                    Confirm & Record ৳{parsedData.amount.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Fast Voice Suggestion Chips */}
            <View style={styles.presetsCard}>
              <Text style={styles.presetsTitle}>TRY THESE VOICE COMMAND SAMPLES:</Text>
              <View style={styles.presetChipsRow}>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset('Spent 1,500 taka on dinner with cash')}
                >
                  <Text style={styles.presetChipText}>🍽️ "Spent 1,500 on dinner with cash"</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset('Tech Salary 85,000 taka deposited to Sonali Bank')}
                >
                  <Text style={styles.presetChipText}>💰 "Salary 85,000 to Sonali Bank"</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset('Withdrew 10,000 taka from Sonali Bank to Cash in Hand')}
                >
                  <Text style={styles.presetChipText}>💸 "Withdrew 10,000 from Sonali Bank to Cash"</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset('Electricity bill 3,200 taka paid cash')}
                >
                  <Text style={styles.presetChipText}>⚡ "Electricity bill 3,200 paid cash"</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset('বাজার করলাম ২০০০ টাকা নগদ ক্যাশ')}
                >
                  <Text style={styles.presetChipText}>🇧🇩 "বাজার করলাম ২০০০ টাকা নগদ ক্যাশ"</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 99999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  micBadge: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 20,
  },
  micSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
  },
  micBigButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  micBigButtonActive: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  statusLabel: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  transcriptCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 14,
  },
  transcriptTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  transcriptInput: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
    minHeight: 44,
    padding: 0,
  },
  parsedCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 14,
  },
  parsedCardTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  typeBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  parsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parsedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  parsedValTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  parsedValAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  accountPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  confirmRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: Radius.sm,
    marginTop: 14,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmRecordBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  presetsCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 10,
  },
  presetsTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  presetChipsRow: {
    gap: 6,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  presetChipText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
  },
});
