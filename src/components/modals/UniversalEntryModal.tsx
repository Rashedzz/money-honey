import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../theme';
import { FormDraftManager } from '../../utils/formDrafts';
import {
  TransactionManager,
  BankAccountItem,
  CASH_IN_HAND_ID,
} from '../../services/transactionManager';
import { CategoryManager, FinancialCategory } from '../../services/categoryManager';
import {
  PaperAssetsManager,
  FDRAsset,
  DPSAsset,
  SanchaypatraAsset,
  addMonthsToDateStr,
  calculateDaysLeftToDate,
  calculateDpsMaturityEstimate,
} from '../../services/paperAssetsManager';
import { showToast } from '../shared/GlobalDialogHost';

export type EntryType =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'withdrawal'
  | 'fdr'
  | 'dps'
  | 'sanchaypatra'
  | 'bank'
  | 'loan'
  | 'stock'
  | 'asset'
  | 'insurance'
  | 'birthday';

interface UniversalEntryModalProps {
  visible: boolean;
  initialType?: EntryType;
  onClose: () => void;
  onSave: (type: EntryType, data: any) => void;
  onOpenCategorySetup?: () => void;
  onOpenVoiceInput?: () => void;
}

const POPULAR_BD_BANKS = [
  'Sonali Bank PLC',
  'BRAC Bank PLC',
  'The City Bank',
  'Eastern Bank (EBL)',
  'Dutch-Bangla Bank',
  'Islami Bank BD',
  'Prime Bank',
  'IDLC Finance',
];

const PLAIN_LANGUAGE_GUIDES: Record<EntryType, { title: string; tip: string }> = {
  expense: {
    title: 'Record Daily Expense / Bill',
    tip: 'Subtracts money from the Bank or Cash wallet you pick below and logs it in your Daily Cash Book.',
  },
  income: {
    title: 'Record Income / Money Received',
    tip: 'Adds money directly into the Bank or Cash account you pick below and logs it in your Daily Cash Book.',
  },
  transfer: {
    title: 'Transfer Between Accounts',
    tip: 'Moves money from one account to another (for example Bank to bKash or Bank to Bank). Total Net Worth stays unchanged.',
  },
  withdrawal: {
    title: 'ATM / Bank Cash Withdrawal',
    tip: 'Deducts money from your Bank Account and adds the exact amount into your Physical Cash in Hand wallet.',
  },
  fdr: {
    title: 'Add Bank Fixed Deposit (FDR)',
    tip: 'Lump-sum deposit locked for 3 months to 5+ years for fixed interest. Tap any duration pill below to auto-fill Maturity Date.',
  },
  dps: {
    title: 'Add Monthly Savings Scheme (DPS)',
    tip: 'Save a fixed amount every month for 1–10 years and receive your total deposit plus bonus profit at maturity.',
  },
  sanchaypatra: {
    title: 'Add Govt. Sanchaypatra Certificate',
    tip: 'Government savings certificate paying regular profit (monthly or every 3 months) into your linked bank account.',
  },
  bank: {
    title: 'Add Bank Account or Mobile Wallet',
    tip: 'Enlist a Savings/Current Bank Account or Mobile Wallet (bKash/Nagad) with its current available balance.',
  },
  loan: {
    title: 'Record Loan or Borrowed Money',
    tip: 'Track bank loans (Home/Car/Personal) or private family borrowings along with monthly installment (EMI).',
  },
  stock: {
    title: 'Add Stock / Share Holding (DSE)',
    tip: 'Track shares bought on Dhaka/Chittagong Stock Exchange with live profit/loss calculation.',
  },
  asset: {
    title: 'Add Land, Flat, Gold or Vehicle',
    tip: 'Record valuable physical property, current market value, and any monthly rental income it generates.',
  },
  insurance: {
    title: 'Add Life / Health Insurance Policy',
    tip: 'Keep track of insurance coverage amount, annual/monthly premium, and family nominee.',
  },
  birthday: {
    title: 'Add Family Birthday / Event Reminder',
    tip: 'Set an annual date reminder and optional gift budget so you never miss an important occasion.',
  },
};

export const UniversalEntryModal: React.FC<UniversalEntryModalProps> = ({
  visible,
  initialType = 'expense',
  onClose,
  onSave,
  onOpenCategorySetup,
  onOpenVoiceInput,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 620;

  const [selectedType, setSelectedType] = useState<EntryType>(initialType);
  const [formError, setFormError] = useState<string>('');

  // Common Fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subInfo, setSubInfo] = useState('');
  const [extraField, setExtraField] = useState('');

  // Account & Transaction Fields
  const [accounts, setAccounts] = useState<BankAccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [depositAccountId, setDepositAccountId] = useState<string>('');
  const [fromBankId, setFromBankId] = useState<string>('');
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Dedicated FDR / DPS / Sanchaypatra Fields (Mobile & Desktop Friendly)
  const [savBankName, setSavBankName] = useState('Sonali Bank PLC');
  const [savBranch, setSavBranch] = useState('');
  const [savCertNo, setSavCertNo] = useState('');
  const [savRate, setSavRate] = useState('9.5');
  const [savTaxPct, setSavTaxPct] = useState('10');
  const [savTenorMonths, setSavTenorMonths] = useState('12');
  const [savMaturityDate, setSavMaturityDate] = useState(() =>
    addMonthsToDateStr(new Date().toISOString().slice(0, 10), 12)
  );
  const [savInterval, setSavInterval] = useState<'Monthly' | '3 Months' | 'At Maturity'>('At Maturity');
  const [savLinkedAccId, setSavLinkedAccId] = useState<string>('');
  const [savDeductNow, setSavDeductNow] = useState<boolean>(false);
  const [dpsDepositDay, setDpsDepositDay] = useState('10');
  const [dpsAlreadyDeposited, setDpsAlreadyDeposited] = useState('');

  // Dynamic Categories
  const [expenseCategories, setExpenseCategories] = useState<FinancialCategory[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<FinancialCategory[]>([]);

  // Sync initialType when modal opens
  useEffect(() => {
    if (visible && initialType) {
      setSelectedType(initialType);
      setFormError('');
    }
  }, [visible, initialType]);

  // Smart defaults when switching between FDR / DPS / Sanchaypatra
  useEffect(() => {
    setFormError('');
    const today = new Date().toISOString().slice(0, 10);
    if (selectedType === 'fdr') {
      setSavRate('9.5');
      setSavTaxPct('10');
      setSavTenorMonths('12');
      setSavInterval('At Maturity');
      setSavMaturityDate(addMonthsToDateStr(today, 12));
    } else if (selectedType === 'dps') {
      setSavRate('9.0');
      setSavTaxPct('5');
      setSavTenorMonths('60');
      setSavMaturityDate(addMonthsToDateStr(today, 60));
    } else if (selectedType === 'sanchaypatra') {
      setSavRate('11.77');
      setSavTaxPct('10');
      setSavTenorMonths('36');
      setSavInterval('3 Months');
      setSavMaturityDate(addMonthsToDateStr(today, 36));
      if (!title) setTitle('3-Month Profit Based Sanchaypatra');
    }
  }, [selectedType]);

  // Load categories
  useEffect(() => {
    const loadCategories = () => {
      setExpenseCategories(CategoryManager.getExpenseCategories());
      setIncomeCategories(CategoryManager.getIncomeCategories());
    };
    if (visible) loadCategories();
    const unsub = CategoryManager.subscribeToCategoryUpdates(loadCategories);
    return () => unsub();
  }, [visible]);

  // Load accounts & smart defaults
  useEffect(() => {
    if (visible) {
      const accs = TransactionManager.getAccountsWithCash();
      setAccounts(accs);
      if (accs.length > 0) {
        if (!selectedAccountId) setSelectedAccountId(accs[0].id);
        if (!depositAccountId) setDepositAccountId(accs[0].id);
        const nonCash = accs.find((a) => a.accountType !== 'Physical Cash' && a.id !== CASH_IN_HAND_ID);
        if (nonCash) {
          setFromBankId(nonCash.id);
          setSavLinkedAccId(nonCash.id);
          setSavBankName(nonCash.bankName);
          setSavBranch(nonCash.branch || nonCash.address || '');
        } else {
          setSavLinkedAccId(accs[0].id);
        }
        if (accs.length >= 2) {
          setFromAccountId(accs[0].id);
          setToAccountId(accs[1].id);
        } else if (accs.length === 1) {
          setFromAccountId(accs[0].id);
        }
      }
    }
  }, [visible]);

  // Restore draft for standard types
  useEffect(() => {
    if (visible && !['fdr', 'dps', 'sanchaypatra'].includes(selectedType)) {
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

  useEffect(() => {
    if (
      visible &&
      !['fdr', 'dps', 'sanchaypatra'].includes(selectedType) &&
      (title || amount || category || subInfo || extraField)
    ) {
      FormDraftManager.saveDraft(`universal_${selectedType}`, {
        title,
        amount,
        category,
        subInfo,
        extraField,
      });
    }
  }, [title, amount, category, subInfo, extraField, selectedType, visible]);

  const handleSelectTenorMonths = (months: number) => {
    setSavTenorMonths(String(months));
    const start = txDate || new Date().toISOString().slice(0, 10);
    setSavMaturityDate(addMonthsToDateStr(start, months));
  };

  const handleSelectLinkedBankForSavings = (acc: BankAccountItem) => {
    setSavLinkedAccId(acc.id);
    if (acc.accountType !== 'Physical Cash' && acc.id !== CASH_IN_HAND_ID) {
      setSavBankName(acc.bankName);
      setSavBranch(acc.branch || acc.address || '');
    }
  };

  const resetForm = () => {
    FormDraftManager.clearDraft(`universal_${selectedType}`);
    setTitle('');
    setAmount('');
    setCategory('');
    setSubInfo('');
    setExtraField('');
    setSavCertNo('');
    setDpsAlreadyDeposited('');
    setSavDeductNow(false);
    setFormError('');
  };

  const handleSave = () => {
    setFormError('');
    const parsedAmount = parseFloat(amount.replace(/,/g, '')) || 0;

    // 1. Handle FDR, DPS & Sanchaypatra (Works identically on Mobile & Laptop!)
    if (selectedType === 'fdr' || selectedType === 'dps' || selectedType === 'sanchaypatra') {
      if (parsedAmount <= 0) {
        setFormError(
          selectedType === 'dps'
            ? 'Please enter the Monthly Installment (৳) amount.'
            : 'Please enter the Investment Amount (৳).'
        );
        return;
      }

      const linkedAcc = accounts.find((a) => a.id === savLinkedAccId);
      const linkedAccNo = linkedAcc?.accountNumber || 'N/A';
      const bankLabel = savBankName.trim() || linkedAcc?.bankName || 'Commercial Bank';
      const branchLabel = savBranch.trim() || linkedAcc?.branch || 'Main Branch';
      const rate = parseFloat(savRate) || 0;
      const taxPct = parseFloat(savTaxPct) || 0;
      const months = Math.max(1, parseInt(savTenorMonths, 10) || 12);
      const startDate = txDate || new Date().toISOString().slice(0, 10);
      const matDate = savMaturityDate || addMonthsToDateStr(startDate, months);

      const intervalsPerYear =
        savInterval === 'Monthly' ? 12 : savInterval === '3 Months' ? 4 : 1;
      const grossInterval = (parsedAmount * (rate / 100)) / intervalsPerYear;
      const taxInterval = grossInterval * (taxPct / 100);
      const netInterval = grossInterval - taxInterval;
      const monthlyNet = Math.round((netInterval * intervalsPerYear) / 12);
      const annualTax = Math.round(taxInterval * intervalsPerYear);

      if (selectedType === 'fdr') {
        const fdrNo = savCertNo.trim() || `FDR-${Math.floor(100000 + Math.random() * 900000)}`;
        const newFdr: FDRAsset = {
          id: `FDR-${Date.now()}`,
          type: 'FDR',
          bankName: bankLabel,
          address: branchLabel,
          accountNumber: linkedAccNo,
          linkedAccountNo: linkedAccNo,
          fdrNumber: fdrNo,
          amount: parsedAmount,
          openingDate: startDate,
          tenorMonths: months,
          maturityDate: matDate,
          profitRateYearly: rate,
          sourceTaxPercent: taxPct,
          payoutInterval: savInterval,
          monthlyReturn: monthlyNet,
          sourceTaxAnnual: annualTax,
          closingDaysRemaining: calculateDaysLeftToDate(matDate),
        };
        PaperAssetsManager.addOrUpdateAsset(newFdr, {
          deductFromAccountId: savDeductNow ? savLinkedAccId : undefined,
          deductionAmount: savDeductNow ? parsedAmount : 0,
        });
        showToast(`FDR saved (${bankLabel} • ৳${parsedAmount.toLocaleString('en-IN')})`);
        onSave('fdr', newFdr);
        resetForm();
        onClose();
        return;
      }

      if (selectedType === 'dps') {
        const dpsNo = savCertNo.trim() || `DPS-${Math.floor(100000 + Math.random() * 900000)}`;
        const tenorYears = Math.max(1, Math.round((months / 12) * 10) / 10);
        const est = calculateDpsMaturityEstimate(parsedAmount, tenorYears, rate);
        const initialDeposited =
          dpsAlreadyDeposited.trim() !== ''
            ? parseFloat(dpsAlreadyDeposited.replace(/,/g, '')) || 0
            : parsedAmount;

        const newDps: DPSAsset = {
          id: `DPS-${Date.now()}`,
          type: 'DPS',
          bankName: bankLabel,
          address: branchLabel,
          linkedAccountNo: linkedAccNo,
          dpsNumber: dpsNo,
          monthlyEmi: parsedAmount,
          depositDayOfMonth: parseInt(dpsDepositDay, 10) || 10,
          tenorYears,
          openingDate: startDate,
          maturityDate: matDate,
          profitRateYearly: rate,
          projectedMaturityAmount: est.maturityValue,
          totalDepositedSoFar: initialDeposited,
          closingDaysRemaining: calculateDaysLeftToDate(matDate),
          installmentsPaid: Math.max(1, Math.round(initialDeposited / parsedAmount)),
        };
        PaperAssetsManager.addOrUpdateAsset(newDps, {
          deductFromAccountId: savDeductNow ? savLinkedAccId : undefined,
          deductionAmount: savDeductNow ? parsedAmount : 0,
        });
        showToast(`DPS saved (${bankLabel} • ৳${parsedAmount.toLocaleString('en-IN')}/mo)`);
        onSave('dps', newDps);
        resetForm();
        onClose();
        return;
      }

      if (selectedType === 'sanchaypatra') {
        const certNo = savCertNo.trim() || `SP-${Math.floor(100000 + Math.random() * 900000)}`;
        const spName = title.trim() || '3-Month Profit Based Sanchaypatra';
        const newSp: SanchaypatraAsset = {
          id: `SC-${Date.now()}`,
          type: 'Sanchaypatra',
          name: spName,
          institution: bankLabel,
          address: branchLabel,
          linkedAccountNo: linkedAccNo,
          bankName: bankLabel,
          certificateNumber: certNo,
          amount: parsedAmount,
          activationDate: startDate,
          maturityDate: matDate,
          profitRateYearly: rate,
          sourceTaxPercent: taxPct,
          payoutInterval: savInterval,
          monthlyProfit: monthlyNet,
          grossProfitPerInterval: Math.round(grossInterval),
          netProfitPerInterval: Math.round(netInterval),
          sourceTaxDeductedPerInterval: Math.round(taxInterval),
          totalTaxDeductedAnnual: annualTax,
          closingDaysRemaining: calculateDaysLeftToDate(matDate),
        };
        PaperAssetsManager.addOrUpdateAsset(newSp, {
          deductFromAccountId: savDeductNow ? savLinkedAccId : undefined,
          deductionAmount: savDeductNow ? parsedAmount : 0,
        });
        showToast(`Sanchaypatra saved (৳${parsedAmount.toLocaleString('en-IN')})`);
        onSave('sanchaypatra', newSp);
        resetForm();
        onClose();
        return;
      }
    }

    // 2. Standard Transaction & Entity Validations
    const isNoTitleNeeded = selectedType === 'withdrawal' || selectedType === 'transfer';
    if (!title.trim() && !isNoTitleNeeded) {
      setFormError('Please enter a name or description first.');
      return;
    }
    if (
      ['expense', 'income', 'withdrawal', 'transfer', 'loan', 'asset'].includes(selectedType) &&
      parsedAmount <= 0
    ) {
      setFormError('Please enter an amount greater than 0.');
      return;
    }

    let payload: any = {
      id: `${selectedType.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      amount: parsedAmount,
      category: category.trim() || 'General',
      subInfo: subInfo.trim(),
      extra: extraField.trim(),
      createdAt: new Date().toISOString(),
    };

    if (selectedType === 'expense') {
      const res = TransactionManager.recordExpense({
        title: title.trim(),
        amount: parsedAmount,
        category: category.trim() || 'Household & Living',
        accountId: selectedAccountId || accounts[0]?.id,
        date: txDate || new Date().toISOString().split('T')[0],
        linkedAssetId: extraField.trim() || undefined,
        notes: subInfo.trim() || undefined,
      });
      payload = res.expense;
      showToast(`Expense recorded: ৳${parsedAmount.toLocaleString('en-IN')}`);
    } else if (selectedType === 'income') {
      const res = TransactionManager.recordIncome({
        title: title.trim(),
        amount: parsedAmount,
        category: category.trim() || 'Salary',
        accountId: depositAccountId || accounts[0]?.id,
        date: txDate || new Date().toISOString().split('T')[0],
        notes: subInfo.trim() || undefined,
      });
      payload = res.income;
      showToast(`Income added: +৳${parsedAmount.toLocaleString('en-IN')}`);
    } else if (selectedType === 'withdrawal') {
      const effectiveBankId =
        fromBankId || accounts.find((a) => a.accountType !== 'Physical Cash')?.id || '';
      const res = TransactionManager.recordCashWithdrawal({
        fromBankId: effectiveBankId,
        amount: parsedAmount,
        date: txDate || new Date().toISOString().split('T')[0],
        notes: subInfo.trim() || 'ATM Cash Withdrawal',
      });
      if (!res.success) {
        setFormError(res.message);
        return;
      }
      payload = res.record;
      showToast(`Withdrew ৳${parsedAmount.toLocaleString('en-IN')} to Cash in Hand`);
    } else if (selectedType === 'transfer') {
      const effectiveFrom = fromAccountId || accounts[0]?.id || '';
      const effectiveTo = toAccountId || accounts[1]?.id || '';
      if (effectiveFrom === effectiveTo) {
        setFormError('Please select two different accounts for transfer.');
        return;
      }
      const res = TransactionManager.recordTransfer({
        fromAccountId: effectiveFrom,
        toAccountId: effectiveTo,
        amount: parsedAmount,
        fee: parseFloat(extraField) || 0,
        date: txDate || new Date().toISOString().split('T')[0],
        notes: subInfo.trim() || 'Account Transfer',
      });
      if (!res.success) {
        setFormError(res.message);
        return;
      }
      payload = res.record;
      showToast(`Transferred ৳${parsedAmount.toLocaleString('en-IN')}`);
    } else if (selectedType === 'asset') {
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
      showToast(`Physical asset saved: ${title.trim()}`);
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
      showToast(`Insurance policy saved`);
    } else if (selectedType === 'birthday') {
      payload = {
        id: `BD-${Math.floor(100 + Math.random() * 900)}`,
        personName: title.trim(),
        relation: category.trim() || 'Family',
        birthDate: subInfo.trim() || '1995-01-01',
        giftBudget: parsedAmount || 5000,
        notifyDaysBefore: 7,
      };
      showToast(`Reminder saved for ${title.trim()}`);
    } else if (selectedType === 'stock') {
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
      showToast(`Stock added: ${title.trim().toUpperCase()}`);
    } else if (selectedType === 'bank') {
      const newAcc: BankAccountItem = {
        id: `ACC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        bankName: title.trim(),
        accountName: title.trim(),
        accountType: (category.trim() as any) || 'Savings',
        accountNumber: subInfo.trim() || `****${Math.floor(1000 + Math.random() * 9000)}`,
        currentBalance: parsedAmount,
        routingNumber: extraField.trim() || undefined,
        color: '#0F172A',
      };
      const existingAccs = TransactionManager.getAccountsWithCash();
      TransactionManager.saveAccounts([...existingAccs, newAcc]);
      payload = newAcc;
      showToast(`Bank account added: ${title.trim()}`);
    } else if (selectedType === 'loan') {
      showToast(`Loan recorded: ${title.trim()}`);
    }

    onSave(selectedType, payload);
    resetForm();
    onClose();
  };

  const tabGroups: Array<{
    heading: string;
    items: Array<{ id: EntryType; label: string; icon: keyof typeof Ionicons.glyphMap }>;
  }> = [
    {
      heading: 'DAILY MONEY',
      items: [
        { id: 'expense', label: 'Expense', icon: 'remove-circle-outline' },
        { id: 'income', label: 'Income', icon: 'add-circle-outline' },
        { id: 'transfer', label: 'Bank Transfer', icon: 'swap-horizontal-outline' },
        { id: 'withdrawal', label: 'ATM / Cash', icon: 'cash-outline' },
      ],
    },
    {
      heading: 'SAVINGS, FDR & DPS',
      items: [
        { id: 'fdr', label: 'FDR (Fixed Deposit)', icon: 'lock-closed-outline' },
        { id: 'dps', label: 'DPS (Monthly)', icon: 'calendar-outline' },
        { id: 'sanchaypatra', label: 'Sanchaypatra', icon: 'document-text-outline' },
        { id: 'bank', label: 'Bank Account', icon: 'wallet-outline' },
        { id: 'stock', label: 'DSE Stock', icon: 'trending-up-outline' },
      ],
    },
    {
      heading: 'PROPERTY & LOANS',
      items: [
        { id: 'asset', label: 'Land / Gold / Flat', icon: 'business-outline' },
        { id: 'loan', label: 'Loan / EMI', icon: 'card-outline' },
        { id: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline' },
        { id: 'birthday', label: 'Reminder', icon: 'gift-outline' },
      ],
    },
  ];

  const guide = PLAIN_LANGUAGE_GUIDES[selectedType];
  const rowStyle = isMobile ? styles.oneCol : styles.twoCol;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, isMobile && { padding: 8 }]}>
        <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
          {/* Top Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="add-circle-outline" size={20} color="#0F172A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  Quick Financial Entry
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Add daily cash flow, FDR, DPS, Sanchaypatra, banks or loans
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {onOpenVoiceInput && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onOpenVoiceInput();
                  }}
                  style={styles.headerVoiceBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mic-outline" size={15} color="#0F172A" />
                  {!isMobile && <Text style={styles.headerVoiceBtnText}>Voice</Text>}
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={19} color="#334155" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Body (Tabs + Plain-Language Guide + Inputs) */}
          <ScrollView
            showsVerticalScrollIndicator={true}
            style={styles.formScroll}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Structured Entry Type Selector */}
            <View style={styles.tabCategorySection}>
              {tabGroups.map((group) => (
                <View key={group.heading} style={styles.tabRow}>
                  <Text style={styles.tabGroupHeading}>{group.heading}</Text>
                  <ScrollView
                    horizontal={isMobile}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={isMobile ? { gap: 6, paddingRight: 8 } : undefined}
                  >
                    <View style={isMobile ? styles.tabPillRowMobile : styles.tabPillGroup}>
                      {group.items.map((tab) => {
                        const isSelected = selectedType === tab.id;
                        return (
                          <TouchableOpacity
                            key={tab.id}
                            style={[
                              styles.modernTabPill,
                              isSelected && styles.modernTabPillActive,
                            ]}
                            onPress={() => setSelectedType(tab.id)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name={tab.icon}
                              size={14}
                              color={isSelected ? '#FFFFFF' : '#475569'}
                            />
                            <Text
                              style={[
                                styles.modernTabPillText,
                                isSelected && styles.modernTabPillTextActive,
                              ]}
                            >
                              {tab.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              ))}
            </View>

            {/* Plain-Language Explanation Box */}
            <View style={styles.guideBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="information-circle-outline" size={16} color="#0F172A" />
                <Text style={styles.guideTitle}>{guide.title}</Text>
              </View>
              <Text style={styles.guideText}>{guide.tip}</Text>
            </View>

            {/* Validation Error Banner */}
            {!!formError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            )}

            {/* ==================== FDR / DPS / SANCHAYPATRA ==================== */}
            {(selectedType === 'fdr' ||
              selectedType === 'dps' ||
              selectedType === 'sanchaypatra') && (
              <>
                {selectedType === 'sanchaypatra' && (
                  <>
                    <Text style={styles.label}>SANCHAYPATRA SCHEME NAME</Text>
                    <View style={styles.sectorChips}>
                      {[
                        '3-Month Profit Based Sanchaypatra',
                        '5-Year Bangladesh Sanchaypatra',
                        'Poribar (Family) Sanchaypatra',
                        'Pensioner Sanchaypatra',
                      ].map((preset) => (
                        <TouchableOpacity
                          key={preset}
                          style={[
                            styles.sectorChip,
                            title === preset && styles.sectorChipSelectedNavy,
                          ]}
                          onPress={() => setTitle(preset)}
                        >
                          <Text
                            style={[
                              styles.sectorChipText,
                              title === preset && styles.sectorChipTextSelected,
                            ]}
                          >
                            {preset}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 3-Month Profit Based Sanchaypatra"
                      placeholderTextColor={Colors.textMuted}
                      value={title}
                      onChangeText={setTitle}
                    />
                  </>
                )}

                <Text style={styles.label}>
                  LINKED BANK ACCOUNT (PROFIT / INSTALLMENT ACCOUNT)
                </Text>
                <View style={styles.accountPillsContainer}>
                  {accounts.map((acc) => {
                    const isSelected = savLinkedAccId === acc.id;
                    const isCash =
                      acc.accountType === 'Physical Cash' || acc.id === CASH_IN_HAND_ID;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[styles.accountPill, isSelected && styles.accountPillSelected]}
                        onPress={() => handleSelectLinkedBankForSavings(acc)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isCash ? 'cash-outline' : 'business-outline'}
                          size={15}
                          color={isSelected ? '#FFFFFF' : '#334155'}
                        />
                        <View>
                          <Text
                            style={[
                              styles.accountPillName,
                              isSelected && styles.accountPillNameSelected,
                            ]}
                          >
                            {acc.bankName}
                          </Text>
                          <Text
                            style={[
                              styles.accountPillBal,
                              isSelected && styles.accountPillBalSelected,
                            ]}
                          >
                            ৳ {acc.currentBalance.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>BANK / INSTITUTION NAME (TAP OR TYPE)</Text>
                <View style={styles.sectorChips}>
                  {POPULAR_BD_BANKS.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[
                        styles.sectorChip,
                        savBankName === b && styles.sectorChipSelectedNavy,
                      ]}
                      onPress={() => setSavBankName(b)}
                    >
                      <Text
                        style={[
                          styles.sectorChipText,
                          savBankName === b && styles.sectorChipTextSelected,
                        ]}
                      >
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>INSTITUTION / BANK NAME *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. BRAC Bank PLC"
                      placeholderTextColor={Colors.textMuted}
                      value={savBankName}
                      onChangeText={setSavBankName}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>
                      {selectedType === 'fdr'
                        ? 'FDR RECEIPT NO (OPTIONAL)'
                        : selectedType === 'dps'
                        ? 'DPS ACCOUNT NO (OPTIONAL)'
                        : 'CERTIFICATE NO (OPTIONAL)'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Leave blank to auto-generate ID"
                      placeholderTextColor={Colors.textMuted}
                      value={savCertNo}
                      onChangeText={setSavCertNo}
                    />
                  </View>
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>
                      {selectedType === 'dps'
                        ? 'MONTHLY INSTALLMENT AMOUNT (৳) *'
                        : 'DEPOSIT / PRINCIPAL AMOUNT (৳) *'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder={selectedType === 'dps' ? 'e.g. 5000 or 10000' : 'e.g. 500000'}
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>YEARLY PROFIT / INTEREST RATE (%)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 9.5"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={savRate}
                      onChangeText={setSavRate}
                    />
                  </View>
                </View>

                {selectedType === 'dps' && (
                  <View style={rowStyle}>
                    <View style={styles.col}>
                      <Text style={styles.label}>ALREADY DEPOSITED SO FAR (৳)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Leave blank if 1st installment"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                        value={dpsAlreadyDeposited}
                        onChangeText={setDpsAlreadyDeposited}
                      />
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.label}>MONTHLY DUE DAY (1–28)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 10"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                        value={dpsDepositDay}
                        onChangeText={setDpsDepositDay}
                      />
                    </View>
                  </View>
                )}

                {selectedType !== 'dps' && (
                  <View style={rowStyle}>
                    <View style={styles.col}>
                      <Text style={styles.label}>GOVT SOURCE TAX (AIT %)</Text>
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        {['0', '5', '10', '15'].map((tPct) => (
                          <TouchableOpacity
                            key={tPct}
                            style={[
                              styles.sectorChip,
                              savTaxPct === tPct && styles.sectorChipSelectedNavy,
                            ]}
                            onPress={() => setSavTaxPct(tPct)}
                          >
                            <Text
                              style={[
                                styles.sectorChipText,
                                savTaxPct === tPct && styles.sectorChipTextSelected,
                              ]}
                            >
                              {tPct}%{tPct === '10' ? ' (TIN)' : ''}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.label}>PROFIT PAYOUT SCHEDULE</Text>
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        {(['Monthly', '3 Months', 'At Maturity'] as const).map((inter) => (
                          <TouchableOpacity
                            key={inter}
                            style={[
                              styles.sectorChip,
                              savInterval === inter && styles.sectorChipSelectedNavy,
                            ]}
                            onPress={() => setSavInterval(inter)}
                          >
                            <Text
                              style={[
                                styles.sectorChipText,
                                savInterval === inter && styles.sectorChipTextSelected,
                              ]}
                            >
                              {inter}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}

                {/* Quick Tenor Selector that Auto-Fills Maturity Date */}
                <Text style={styles.label}>
                  DURATION / TENOR (TAP TO AUTO-CALCULATE MATURITY DATE)
                </Text>
                <View style={styles.sectorChips}>
                  {[
                    { label: '3 Months', m: 3 },
                    { label: '6 Months', m: 6 },
                    { label: '1 Year', m: 12 },
                    { label: '2 Years', m: 24 },
                    { label: '3 Years', m: 36 },
                    { label: '5 Years', m: 60 },
                    { label: '10 Years', m: 120 },
                  ].map((opt) => {
                    const active = parseInt(savTenorMonths, 10) === opt.m;
                    return (
                      <TouchableOpacity
                        key={opt.m}
                        style={[styles.sectorChip, active && styles.sectorChipSelectedNavy]}
                        onPress={() => handleSelectTenorMonths(opt.m)}
                      >
                        <Text
                          style={[
                            styles.sectorChipText,
                            active && styles.sectorChipTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>OPENING / START DATE</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted}
                      value={txDate}
                      onChangeText={(val) => {
                        setTxDate(val);
                        if (val.length === 10) {
                          setSavMaturityDate(
                            addMonthsToDateStr(val, parseInt(savTenorMonths, 10) || 12)
                          );
                        }
                      }}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>MATURITY / CLOSING DATE (AUTO-FILLED)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted}
                      value={savMaturityDate}
                      onChangeText={setSavMaturityDate}
                    />
                  </View>
                </View>

                {/* Balance Deduction Toggle */}
                <TouchableOpacity
                  style={[
                    styles.toggleCard,
                    savDeductNow && styles.toggleCardActive,
                  ]}
                  onPress={() => setSavDeductNow(!savDeductNow)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={savDeductNow ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={savDeductNow ? '#0F172A' : '#64748B'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleCardTitle}>
                      Opened today using money from my selected Bank Account
                    </Text>
                    <Text style={styles.toggleCardSub}>
                      {savDeductNow
                        ? 'Will deduct this opening amount from your selected Bank Account balance.'
                        : 'Unchecked: Records an existing holding without changing your current Bank balance.'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Live Plain-English Calculation Preview */}
                {(() => {
                  const p = parseFloat(amount.replace(/,/g, '')) || 0;
                  if (p <= 0) return null;
                  const r = parseFloat(savRate) || 0;
                  const tax = parseFloat(savTaxPct) || 0;
                  const m = Math.max(1, parseInt(savTenorMonths, 10) || 12);

                  if (selectedType === 'dps') {
                    const years = Math.max(0.5, m / 12);
                    const est = calculateDpsMaturityEstimate(p, years, r);
                    return (
                      <View style={styles.previewCard}>
                        <Text style={styles.previewHeading}>
                          INSTANT DPS MATURITY PREVIEW ({m} MONTHS)
                        </Text>
                        <Text style={styles.previewPlainSentence}>
                          Depositing <Text style={{ fontWeight: '800' }}>৳{p.toLocaleString('en-IN')}/month</Text> for{' '}
                          <Text style={{ fontWeight: '800' }}>{m} months</Text> builds{' '}
                          <Text style={{ fontWeight: '800' }}>৳{est.totalDeposited.toLocaleString('en-IN')}</Text> in principal + ~
                          <Text style={{ fontWeight: '800', color: '#16A34A' }}>
                            ৳{est.estimatedProfit.toLocaleString('en-IN')}
                          </Text>{' '}
                          profit.
                        </Text>
                        <View style={styles.previewMetricsRow}>
                          <View>
                            <Text style={styles.previewMetricLabel}>TOTAL YOU DEPOSIT</Text>
                            <Text style={styles.previewMetricVal}>
                              ৳ {est.totalDeposited.toLocaleString('en-IN')}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.previewMetricLabel}>EST. MATURITY PAYOUT</Text>
                            <Text style={[styles.previewMetricVal, { color: '#16A34A' }]}>
                              ৳ {est.maturityValue.toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }

                  const grossYearly = p * (r / 100);
                  const netYearly = grossYearly * (1 - tax / 100);
                  const netMonthly = Math.round(netYearly / 12);
                  const totalNetOverTerm = Math.round((netYearly * m) / 12);

                  return (
                    <View style={styles.previewCard}>
                      <Text style={styles.previewHeading}>
                        INSTANT PROFIT & TAX PREVIEW (AFTER {tax}% SOURCE TAX)
                      </Text>
                      <Text style={styles.previewPlainSentence}>
                        Your <Text style={{ fontWeight: '800' }}>৳{p.toLocaleString('en-IN')}</Text> earns{' '}
                        <Text style={{ fontWeight: '800', color: '#16A34A' }}>
                          +৳{netMonthly.toLocaleString('en-IN')}/month
                        </Text>{' '}
                        net after tax (~৳{Math.round(netYearly).toLocaleString('en-IN')}/year).
                      </Text>
                      <View style={styles.previewMetricsRow}>
                        <View>
                          <Text style={styles.previewMetricLabel}>MONTHLY NET PROFIT</Text>
                          <Text style={[styles.previewMetricVal, { color: '#16A34A' }]}>
                            +৳ {netMonthly.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.previewMetricLabel}>PRINCIPAL + {m}M PROFIT</Text>
                          <Text style={styles.previewMetricVal}>
                            ৳ {(p + totalNetOverTerm).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}
              </>
            )}

            {/* ==================== INCOME ==================== */}
            {selectedType === 'income' && (
              <>
                <Text style={styles.label}>INCOME SOURCE / DESCRIPTION *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Monthly Salary, House Rent, Business Profit"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>AMOUNT RECEIVED (৳ BDT) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 85000"
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
                      placeholder="e.g. Salary, Rent, Bonus"
                      placeholderTextColor={Colors.textMuted}
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>
                </View>

                <View style={styles.sectorChips}>
                  {incomeCategories.map((cat) => {
                    const isSelected = category === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.sectorChip, isSelected && styles.sectorChipSelectedNavy]}
                        onPress={() => setCategory(cat.name)}
                      >
                        <Text
                          style={[
                            styles.sectorChipText,
                            isSelected && styles.sectorChipTextSelected,
                          ]}
                        >
                          {cat.icon} {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {onOpenCategorySetup && (
                    <TouchableOpacity
                      style={[styles.sectorChip, { borderStyle: 'dashed' }]}
                      onPress={() => {
                        onClose();
                        onOpenCategorySetup();
                      }}
                    >
                      <Text style={styles.sectorChipText}>+ Edit Categories</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.label}>WHERE WAS THIS MONEY DEPOSITED? *</Text>
                <View style={styles.accountPillsContainer}>
                  {accounts.map((acc) => {
                    const isSelected = depositAccountId === acc.id;
                    const isCash =
                      acc.accountType === 'Physical Cash' || acc.id === CASH_IN_HAND_ID;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[styles.accountPill, isSelected && styles.accountPillSelected]}
                        onPress={() => setDepositAccountId(acc.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isCash ? 'cash-outline' : 'card-outline'}
                          size={16}
                          color={isSelected ? '#FFFFFF' : '#334155'}
                        />
                        <View>
                          <Text
                            style={[
                              styles.accountPillName,
                              isSelected && styles.accountPillNameSelected,
                            ]}
                          >
                            {acc.bankName}
                          </Text>
                          <Text
                            style={[
                              styles.accountPillBal,
                              isSelected && styles.accountPillBalSelected,
                            ]}
                          >
                            ৳ {acc.currentBalance.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>DATE</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted}
                      value={txDate}
                      onChangeText={setTxDate}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>NOTES (OPTIONAL)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Optional memo"
                      placeholderTextColor={Colors.textMuted}
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ==================== EXPENSE ==================== */}
            {selectedType === 'expense' && (
              <>
                <Text style={styles.label}>WHAT DID YOU SPEND ON? *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bazar / Groceries, Electricity Bill, School Fees"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>AMOUNT SPENT (৳ BDT) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 2500"
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
                      placeholder="e.g. Household & Living"
                      placeholderTextColor={Colors.textMuted}
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>
                </View>

                <View style={styles.sectorChips}>
                  {expenseCategories.map((cat) => {
                    const isSelected = category === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.sectorChip, isSelected && styles.sectorChipSelectedNavy]}
                        onPress={() => setCategory(cat.name)}
                      >
                        <Text
                          style={[
                            styles.sectorChipText,
                            isSelected && styles.sectorChipTextSelected,
                          ]}
                        >
                          {cat.icon} {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {onOpenCategorySetup && (
                    <TouchableOpacity
                      style={[styles.sectorChip, { borderStyle: 'dashed' }]}
                      onPress={() => {
                        onClose();
                        onOpenCategorySetup();
                      }}
                    >
                      <Text style={styles.sectorChipText}>+ Manage Budgets</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.label}>PAID FROM WHICH ACCOUNT / WALLET? *</Text>
                <View style={styles.accountPillsContainer}>
                  {accounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    const isCash =
                      acc.accountType === 'Physical Cash' || acc.id === CASH_IN_HAND_ID;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[styles.accountPill, isSelected && styles.accountPillSelected]}
                        onPress={() => setSelectedAccountId(acc.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isCash ? 'cash-outline' : 'card-outline'}
                          size={16}
                          color={isSelected ? '#FFFFFF' : '#334155'}
                        />
                        <View>
                          <Text
                            style={[
                              styles.accountPillName,
                              isSelected && styles.accountPillNameSelected,
                            ]}
                          >
                            {acc.bankName}
                          </Text>
                          <Text
                            style={[
                              styles.accountPillBal,
                              isSelected && styles.accountPillBalSelected,
                            ]}
                          >
                            ৳ {acc.currentBalance.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>DATE</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted}
                      value={txDate}
                      onChangeText={setTxDate}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>NOTES (OPTIONAL)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Optional note or bill ref"
                      placeholderTextColor={Colors.textMuted}
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ==================== WITHDRAWAL ==================== */}
            {selectedType === 'withdrawal' && (
              <>
                <Text style={styles.label}>WITHDRAW FROM BANK ACCOUNT *</Text>
                <View style={styles.accountPillsContainer}>
                  {accounts
                    .filter((a) => a.accountType !== 'Physical Cash' && a.id !== CASH_IN_HAND_ID)
                    .map((acc) => {
                      const isSelected = fromBankId === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={[styles.accountPill, isSelected && styles.accountPillSelected]}
                          onPress={() => setFromBankId(acc.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="card-outline"
                            size={16}
                            color={isSelected ? '#FFFFFF' : '#334155'}
                          />
                          <View>
                            <Text
                              style={[
                                styles.accountPillName,
                                isSelected && styles.accountPillNameSelected,
                              ]}
                            >
                              {acc.bankName}
                            </Text>
                            <Text
                              style={[
                                styles.accountPillBal,
                                isSelected && styles.accountPillBalSelected,
                              ]}
                            >
                              ৳ {acc.currentBalance.toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </View>

                <Text style={styles.label}>WITHDRAWAL AMOUNT (৳ BDT) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 15000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />

                <View style={styles.previewCard}>
                  <Text style={styles.previewHeading}>DESTINATION: CASH IN HAND WALLET</Text>
                  <Text style={styles.previewPlainSentence}>
                    Current Cash in Hand:{' '}
                    <Text style={{ fontWeight: '800' }}>
                      ৳{' '}
                      {(
                        accounts.find(
                          (a) => a.accountType === 'Physical Cash' || a.id === CASH_IN_HAND_ID
                        )?.currentBalance || 0
                      ).toLocaleString('en-IN')}
                    </Text>
                    . Withdrawn cash is added directly to your Cash wallet.
                  </Text>
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>DATE</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted}
                      value={txDate}
                      onChangeText={setTxDate}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>NOTE (OPTIONAL)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. ATM Booth withdrawal"
                      placeholderTextColor={Colors.textMuted}
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ==================== TRANSFER ==================== */}
            {selectedType === 'transfer' && (
              <>
                <Text style={styles.label}>SEND MONEY FROM *</Text>
                <View style={styles.accountPillsContainer}>
                  {accounts.map((acc) => {
                    const isSelected = fromAccountId === acc.id;
                    const isCash =
                      acc.accountType === 'Physical Cash' || acc.id === CASH_IN_HAND_ID;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[styles.accountPill, isSelected && styles.accountPillSelected]}
                        onPress={() => setFromAccountId(acc.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isCash ? 'cash-outline' : 'card-outline'}
                          size={16}
                          color={isSelected ? '#FFFFFF' : '#334155'}
                        />
                        <View>
                          <Text
                            style={[
                              styles.accountPillName,
                              isSelected && styles.accountPillNameSelected,
                            ]}
                          >
                            {acc.bankName}
                          </Text>
                          <Text
                            style={[
                              styles.accountPillBal,
                              isSelected && styles.accountPillBalSelected,
                            ]}
                          >
                            ৳ {acc.currentBalance.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>RECEIVE MONEY INTO *</Text>
                <View style={styles.accountPillsContainer}>
                  {accounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((acc) => {
                      const isSelected = toAccountId === acc.id;
                      const isCash =
                        acc.accountType === 'Physical Cash' || acc.id === CASH_IN_HAND_ID;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={[styles.accountPill, isSelected && styles.accountPillSelected]}
                          onPress={() => setToAccountId(acc.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={isCash ? 'cash-outline' : 'swap-horizontal-outline'}
                            size={16}
                            color={isSelected ? '#FFFFFF' : '#334155'}
                          />
                          <View>
                            <Text
                              style={[
                                styles.accountPillName,
                                isSelected && styles.accountPillNameSelected,
                              ]}
                            >
                              {acc.bankName}
                            </Text>
                            <Text
                              style={[
                                styles.accountPillBal,
                                isSelected && styles.accountPillBalSelected,
                              ]}
                            >
                              ৳ {acc.currentBalance.toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>TRANSFER AMOUNT (৳ BDT) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 25000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>TRANSFER FEE / CHARGE (৳)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0 if free"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={extraField}
                      onChangeText={setExtraField}
                    />
                  </View>
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>DATE</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted}
                      value={txDate}
                      onChangeText={setTxDate}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>REFERENCE / NOTE</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. NPSB / BEFTN / bKash Add Money"
                      placeholderTextColor={Colors.textMuted}
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ==================== PHYSICAL ASSET ==================== */}
            {selectedType === 'asset' && (
              <>
                <Text style={styles.label}>PROPERTY / GOLD / ASSET NAME *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Purbachal 5-Katha Plot, 10 Bhori 22K Gold, Uttara Flat"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>CURRENT MARKET VALUE (৳) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 8500000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>MONTHLY RENT / INCOME (৳)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0 if none"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>ASSET TYPE</Text>
                    <View style={styles.sectorChips}>
                      {['Real Estate', 'Land', 'Gold / Jewelry', 'Vehicle'].map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.sectorChip,
                            category === t && styles.sectorChipSelectedNavy,
                          ]}
                          onPress={() => setCategory(t)}
                        >
                          <Text
                            style={[
                              styles.sectorChipText,
                              category === t && styles.sectorChipTextSelected,
                            ]}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>YEARLY VALUE GROWTH (%)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 8"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={extraField}
                      onChangeText={setExtraField}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ==================== LOAN ==================== */}
            {selectedType === 'loan' && (
              <>
                <Text style={styles.label}>LOAN PURPOSE / TITLE *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Home Loan, Car Loan, Family Borrowing"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>REMAINING LOAN BALANCE (৳) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1500000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>MONTHLY INSTALLMENT / EMI (৳)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 32000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                </View>

                <Text style={styles.label}>BANK OR LENDER NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. City Bank PLC or Relative Name"
                  placeholderTextColor={Colors.textMuted}
                  value={category}
                  onChangeText={setCategory}
                />
              </>
            )}

            {/* ==================== BANK ACCOUNT ==================== */}
            {selectedType === 'bank' && (
              <>
                <Text style={styles.label}>BANK OR MOBILE WALLET NAME *</Text>
                <View style={styles.sectorChips}>
                  {[...POPULAR_BD_BANKS.slice(0, 5), 'bKash', 'Nagad'].map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.sectorChip, title === b && styles.sectorChipSelectedNavy]}
                      onPress={() => setTitle(b)}
                    >
                      <Text
                        style={[
                          styles.sectorChipText,
                          title === b && styles.sectorChipTextSelected,
                        ]}
                      >
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. BRAC Bank PLC, City Bank, bKash"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>CURRENT AVAILABLE BALANCE (৳) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 250000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>ACCOUNT NUMBER (OPTIONAL)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1501204455"
                      placeholderTextColor={Colors.textMuted}
                      value={subInfo}
                      onChangeText={setSubInfo}
                    />
                  </View>
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>ACCOUNT TYPE</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Savings / Current / MFS Wallet"
                      placeholderTextColor={Colors.textMuted}
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>ROUTING NUMBER (OPTIONAL)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="9-digit BEFTN routing"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      maxLength={9}
                      value={extraField}
                      onChangeText={setExtraField}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ==================== INSURANCE ==================== */}
            {selectedType === 'insurance' && (
              <>
                <Text style={styles.label}>POLICY NAME *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. MetLife DPS / Life Protection Plan"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>TOTAL COVERAGE AMOUNT (৳) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 5000000"
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
                      placeholder="e.g. 60000"
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
                  placeholder="e.g. Spouse / Child"
                  placeholderTextColor={Colors.textMuted}
                  value={extraField}
                  onChangeText={setExtraField}
                />
              </>
            )}

            {/* ==================== BIRTHDAY ==================== */}
            {selectedType === 'birthday' && (
              <>
                <Text style={styles.label}>PERSON OR EVENT NAME *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mother's Birthday, Wedding Anniversary"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>DATE (YYYY-MM-DD) *</Text>
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
                      placeholder="e.g. 10000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ==================== STOCK ==================== */}
            {selectedType === 'stock' && (
              <>
                <Text style={styles.label}>POPULAR DSE STOCKS (TAP TO AUTO-FILL)</Text>
                <View style={styles.sectorChips}>
                  {[
                    'GP',
                    'BATBC',
                    'SQURPHARMA',
                    'BRACBANK',
                    'RENATA',
                    'ROBI',
                    'LHBL',
                    'ISLAMIBANK',
                  ].map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => {
                        setTitle(s);
                        if (s === 'GP') setCategory('Grameenphone Ltd.');
                        else if (s === 'BATBC') setCategory('British American Tobacco BD');
                        else if (s === 'SQURPHARMA') setCategory('Square Pharmaceuticals');
                        else if (s === 'BRACBANK') setCategory('BRAC Bank PLC');
                        else setCategory(`${s} (DSE)`);
                      }}
                      style={[styles.sectorChip, title === s && styles.sectorChipSelectedNavy]}
                    >
                      <Text
                        style={[
                          styles.sectorChipText,
                          title === s && styles.sectorChipTextSelected,
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>STOCK SYMBOL *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. GP, SQURPHARMA"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="characters"
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>COMPANY / SECTOR</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Pharma / Telecom"
                      placeholderTextColor={Colors.textMuted}
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>
                </View>

                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.label}>NUMBER OF SHARES *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 200"
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
                      placeholder="e.g. 285"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                </View>

                <Text style={styles.label}>TODAY'S MARKET PRICE PER SHARE (৳)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Leave blank to use buy price"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={extraField}
                  onChangeText={setExtraField}
                />
              </>
            )}
          </ScrollView>

          {/* Pinned Footer Action Bar (Always reachable on Mobile & Desktop) */}
          <View style={styles.footerBar}>
            <TouchableOpacity style={styles.cancelFooterBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelFooterBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                Save {selectedType === 'fdr' ? 'FDR' : selectedType === 'dps' ? 'DPS' : selectedType === 'sanchaypatra' ? 'Sanchaypatra' : 'Entry'}
              </Text>
            </TouchableOpacity>
          </View>
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
    padding: Spacing.md,
  },
  modalCard: {
    width: '96%',
    maxWidth: 680,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  modalCardMobile: {
    width: '100%',
    maxHeight: '95%',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: Radius.lg,
  },
  formScroll: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  headerVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  headerVoiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 7,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
  },
  tabCategorySection: {
    marginBottom: 10,
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabRow: {
    gap: 5,
  },
  tabGroupHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  tabPillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tabPillRowMobile: {
    flexDirection: 'row',
    gap: 6,
  },
  modernTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modernTabPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  modernTabPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  modernTabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  guideBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 3,
    borderLeftColor: '#0F172A',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 8,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  guideText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 8,
  },
  errorBannerText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    marginBottom: 5,
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '600',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  oneCol: {
    flexDirection: 'column',
    gap: 2,
  },
  col: {
    flex: 1,
  },
  accountPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  accountPillSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  accountPillName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  accountPillNameSelected: {
    color: '#FFFFFF',
  },
  accountPillBal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  accountPillBalSelected: {
    color: '#CBD5E1',
  },
  sectorChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  sectorChip: {
    paddingHorizontal: 11,
    paddingVertical: 6.5,
    borderRadius: Radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  sectorChipSelectedNavy: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  sectorChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  sectorChipTextSelected: {
    color: '#FFFFFF',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 12,
  },
  toggleCardActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#0F172A',
  },
  toggleCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleCardSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  previewCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 12,
  },
  previewHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewPlainSentence: {
    fontSize: 12.5,
    color: '#14532D',
    lineHeight: 18,
  },
  previewMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  previewMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  previewMetricVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelFooterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelFooterBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
  },
  submitBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
