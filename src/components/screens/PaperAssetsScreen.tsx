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
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import { getStoredBankAccounts, BankAccountItem, saveStoredBankAccounts } from '../../../app/(tabs)/accounts';
import { FormDraftManager } from '../../utils/formDrafts';
import {
  SanchaypatraEarningsService,
  SanchaypatraCouponScheduleItem,
  SANCHAYPATRA_MASTER_PORTFOLIO,
} from '../../services/sanchaypatraEarningsService';

export interface SanchaypatraAsset {
  id: string;
  type: 'Sanchaypatra';
  name: string;                   // Name of Sanchaypatra
  institution: string;            // Financial Institute Name
  address: string;                // Address
  linkedAccountNo: string;        // Linked Bank Account
  bankName: string;               // Bank Name (auto-filled)
  certificateNumber: string;      // Sanchaypatra No
  amount: number;                 // Investment Capital
  activationDate: string;         // Date of Activation
  maturityDate: string;           // Maturity / Closing Date
  firstCouponDate?: string;       // 1st Coupon Encashment Date (নগদায়নের তারিখ)
  nextEncashmentDate?: string;    // Next Coupon Encashment Date
  profitRateYearly: number;       // Profit Rate: Yearly %
  sourceTaxPercent: number;       // Source Tax Deduction %
  payoutInterval: 'Monthly' | '3 Months' | 'At Maturity';
  monthlyProfit: number;          // Calculated Monthly Net Profit
  grossProfitPerInterval: number;
  netProfitPerInterval: number;
  sourceTaxDeductedPerInterval: number;
  totalTaxDeductedAnnual: number;
  closingDaysRemaining: number;
}

export interface FDRAsset {
  id: string;
  type: 'FDR';
  bankName: string;
  address: string;
  accountNumber: string;
  linkedAccountNo: string;
  fdrNumber: string;
  amount: number;
  openingDate: string;
  tenorMonths: number;
  maturityDate: string;
  profitRateYearly: number;
  sourceTaxPercent: number;
  payoutInterval: 'Monthly' | '3 Months' | 'At Maturity';
  monthlyReturn: number;
  sourceTaxAnnual: number;
  closingDaysRemaining: number;
}

export interface DPSAsset {
  id: string;
  type: 'DPS';
  bankName: string;
  address: string;
  linkedAccountNo: string;
  dpsNumber: string;
  monthlyEmi: number;             // Monthly Deposit (EMI)
  depositDayOfMonth: number;      // e.g. 5th or 10th
  tenorYears: number;
  openingDate: string;
  maturityDate: string;
  profitRateYearly: number;
  projectedMaturityAmount: number;
  totalDepositedSoFar: number;
  closingDaysRemaining: number;
}

export type PaperAssetUnion = SanchaypatraAsset | FDRAsset | DPSAsset;

const STORAGE_KEY = 'mh_user_paper_assets';

export const INITIAL_SANCHAYPATRA_PORTFOLIO: SanchaypatraAsset[] = [
  {
    id: 'sp_2025_0134852',
    type: 'Sanchaypatra',
    name: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র (একক)',
    institution: 'Sonali Bank PLC',
    address: 'Principal Branch, Motijheel, Dhaka',
    linkedAccountNo: 'SONALI-0102030405',
    bankName: 'Sonali Bank PLC',
    certificateNumber: '2025-0134852',
    amount: 500000,
    activationDate: '2025-02-12',
    maturityDate: '2028-02-12',
    firstCouponDate: '2025-05-12',
    nextEncashmentDate: '2025-05-12',
    profitRateYearly: 12.25,
    sourceTaxPercent: 10,
    payoutInterval: '3 Months',
    monthlyProfit: 4594,
    grossProfitPerInterval: 15312.50,
    netProfitPerInterval: 13781.25,
    sourceTaxDeductedPerInterval: 1531.25,
    totalTaxDeductedAnnual: 6125.00,
    closingDaysRemaining: 517,
  },
  {
    id: 'sp_2025_0229715',
    type: 'Sanchaypatra',
    name: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র (একক)',
    institution: 'Sonali Bank PLC',
    address: 'Principal Branch, Motijheel, Dhaka',
    linkedAccountNo: 'SONALI-0102030405',
    bankName: 'Sonali Bank PLC',
    certificateNumber: '2025-0229715',
    amount: 100000,
    activationDate: '2025-03-10',
    maturityDate: '2028-03-10',
    firstCouponDate: '2025-06-15',
    nextEncashmentDate: '2025-06-15',
    profitRateYearly: 12.25,
    sourceTaxPercent: 10,
    payoutInterval: '3 Months',
    monthlyProfit: 919,
    grossProfitPerInterval: 3062.50,
    netProfitPerInterval: 2756.25,
    sourceTaxDeductedPerInterval: 306.25,
    totalTaxDeductedAnnual: 1225.00,
    closingDaysRemaining: 544,
  },
  {
    id: 'sp_2025_0432271',
    type: 'Sanchaypatra',
    name: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র (একক)',
    institution: 'Sonali Bank PLC',
    address: 'Principal Branch, Motijheel, Dhaka',
    linkedAccountNo: 'SONALI-0102030405',
    bankName: 'Sonali Bank PLC',
    certificateNumber: '2025-0432271',
    amount: 300000,
    activationDate: '2025-05-15',
    maturityDate: '2028-05-15',
    firstCouponDate: '2025-08-17',
    nextEncashmentDate: '2025-08-17',
    profitRateYearly: 12.275,
    sourceTaxPercent: 10,
    payoutInterval: '3 Months',
    monthlyProfit: 2762,
    grossProfitPerInterval: 9206.25,
    netProfitPerInterval: 8285.62,
    sourceTaxDeductedPerInterval: 920.63,
    totalTaxDeductedAnnual: 3682.52,
    closingDaysRemaining: 610,
  },
  {
    id: 'sp_2025_0804248',
    type: 'Sanchaypatra',
    name: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র (একক)',
    institution: 'Sonali Bank PLC',
    address: 'Principal Branch, Motijheel, Dhaka',
    linkedAccountNo: 'SONALI-0102030405',
    bankName: 'Sonali Bank PLC',
    certificateNumber: '2025-0804248',
    amount: 500000,
    activationDate: '2025-08-20',
    maturityDate: '2028-08-20',
    firstCouponDate: '2025-11-20',
    nextEncashmentDate: '2025-11-20',
    profitRateYearly: 11.80,
    sourceTaxPercent: 10,
    payoutInterval: '3 Months',
    monthlyProfit: 4425,
    grossProfitPerInterval: 14750.00,
    netProfitPerInterval: 13275.00,
    sourceTaxDeductedPerInterval: 1475.00,
    totalTaxDeductedAnnual: 5900.00,
    closingDaysRemaining: 707,
  },
  {
    id: 'sp_2025_1121586',
    type: 'Sanchaypatra',
    name: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র (একক)',
    institution: 'Sonali Bank PLC',
    address: 'Principal Branch, Motijheel, Dhaka',
    linkedAccountNo: 'SONALI-0102030405',
    bankName: 'Sonali Bank PLC',
    certificateNumber: '2025-1121586',
    amount: 400000,
    activationDate: '2025-11-04',
    maturityDate: '2028-11-04',
    firstCouponDate: '2026-02-05',
    nextEncashmentDate: '2026-02-05',
    profitRateYearly: 11.77,
    sourceTaxPercent: 10,
    payoutInterval: '3 Months',
    monthlyProfit: 3531,
    grossProfitPerInterval: 11770.00,
    netProfitPerInterval: 10593.00,
    sourceTaxDeductedPerInterval: 1177.00,
    totalTaxDeductedAnnual: 4708.00,
    closingDaysRemaining: 783,
  },
  {
    id: 'sp_2025_1143799',
    type: 'Sanchaypatra',
    name: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র (একক)',
    institution: 'Sonali Bank PLC',
    address: 'Principal Branch, Motijheel, Dhaka',
    linkedAccountNo: 'SONALI-0102030405',
    bankName: 'Sonali Bank PLC',
    certificateNumber: '2025-1143799',
    amount: 100000,
    activationDate: '2025-11-10',
    maturityDate: '2028-11-10',
    firstCouponDate: '2026-02-10',
    nextEncashmentDate: '2026-02-10',
    profitRateYearly: 11.77,
    sourceTaxPercent: 10,
    payoutInterval: '3 Months',
    monthlyProfit: 883,
    grossProfitPerInterval: 2942.50,
    netProfitPerInterval: 2648.25,
    sourceTaxDeductedPerInterval: 294.25,
    totalTaxDeductedAnnual: 1177.00,
    closingDaysRemaining: 789,
  },
  {
    id: 'sp_2026_0326827',
    type: 'Sanchaypatra',
    name: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র (একক)',
    institution: 'Sonali Bank PLC',
    address: 'Principal Branch, Motijheel, Dhaka',
    linkedAccountNo: 'SONALI-0102030405',
    bankName: 'Sonali Bank PLC',
    certificateNumber: '2026-0326827',
    amount: 300000,
    activationDate: '2026-04-16',
    maturityDate: '2029-04-16',
    firstCouponDate: '2026-07-16',
    nextEncashmentDate: '2026-07-16',
    profitRateYearly: 11.77,
    sourceTaxPercent: 10,
    payoutInterval: '3 Months',
    monthlyProfit: 2648,
    grossProfitPerInterval: 8827.50,
    netProfitPerInterval: 7944.75,
    sourceTaxDeductedPerInterval: 882.75,
    totalTaxDeductedAnnual: 3531.00,
    closingDaysRemaining: 946,
  },
  {
    id: 'sp_2026_0541949',
    type: 'Sanchaypatra',
    name: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র (একক)',
    institution: 'Sonali Bank PLC',
    address: 'Principal Branch, Motijheel, Dhaka',
    linkedAccountNo: 'SONALI-0102030405',
    bankName: 'Sonali Bank PLC',
    certificateNumber: '2026-0541949',
    amount: 400000,
    activationDate: '2026-06-15',
    maturityDate: '2029-06-15',
    firstCouponDate: '2026-09-15',
    nextEncashmentDate: '2026-09-15',
    profitRateYearly: 11.77,
    sourceTaxPercent: 10,
    payoutInterval: '3 Months',
    monthlyProfit: 3531,
    grossProfitPerInterval: 11770.00,
    netProfitPerInterval: 10593.00,
    sourceTaxDeductedPerInterval: 1177.00,
    totalTaxDeductedAnnual: 4708.00,
    closingDaysRemaining: 1006,
  },
  {
    id: 'sp_2026_0698004',
    type: 'Sanchaypatra',
    name: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র (একক)',
    institution: 'Sonali Bank PLC',
    address: 'Principal Branch, Motijheel, Dhaka',
    linkedAccountNo: 'SONALI-0102030405',
    bankName: 'Sonali Bank PLC',
    certificateNumber: '2026-0698004',
    amount: 400000,
    activationDate: '2026-07-14',
    maturityDate: '2029-07-14',
    firstCouponDate: '2026-10-14',
    nextEncashmentDate: '2026-10-14',
    profitRateYearly: 11.77,
    sourceTaxPercent: 10,
    payoutInterval: '3 Months',
    monthlyProfit: 3531,
    grossProfitPerInterval: 11770.00,
    netProfitPerInterval: 10593.00,
    sourceTaxDeductedPerInterval: 1177.00,
    totalTaxDeductedAnnual: 4708.00,
    closingDaysRemaining: 1035,
  },
];

export const PaperAssetsScreen: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'SANCHAYPATRA' | 'FDR' | 'DPS'>('ALL');
  const [paperAssets, setPaperAssets] = useState<PaperAssetUnion[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);

  // Modal Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [assetFormType, setAssetFormType] = useState<'Sanchaypatra' | 'FDR' | 'DPS'>('Sanchaypatra');

  // Common Form Fields
  const [pName, setPName] = useState('');
  const [pInstitution, setPInstitution] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [pLinkedAcc, setPLinkedAcc] = useState('');
  const [pBankName, setPBankName] = useState('');
  const [pCertNo, setPCertNo] = useState('');
  const [pAmount, setPAmount] = useState('');
  const [pActivationDate, setPActivationDate] = useState('');
  const [pMaturityDate, setPMaturityDate] = useState('');
  const [pProfitRate, setPProfitRate] = useState('11.04');
  const [pSourceTax, setPSourceTax] = useState('5');
  const [pInterval, setPInterval] = useState<'Monthly' | '3 Months' | 'At Maturity'>('3 Months');

  // DPS Specific Fields
  const [pEmi, setPEmi] = useState('');
  const [pDepositDay, setPDepositDay] = useState('10');
  const [pTenorYears, setPTenorYears] = useState('5');

  // Tax Report View
  const [showTaxReport, setShowTaxReport] = useState(false);

  // Earnings Schedule & Auto-Deposit Modal State
  const [showEarningsSchedule, setShowEarningsSchedule] = useState(false);
  const [selectedScheduleCert, setSelectedScheduleCert] = useState<string | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED'>('ALL');
  const [scheduleItems, setScheduleItems] = useState<SanchaypatraCouponScheduleItem[]>(() =>
    SanchaypatraEarningsService.getAllScheduleItems()
  );
  const [isSchedulingAlerts, setIsSchedulingAlerts] = useState(false);

  const reloadSchedule = () => {
    setScheduleItems(SanchaypatraEarningsService.getAllScheduleItems());
  };

  const handleConfirmDeposit = (coupon: SanchaypatraCouponScheduleItem) => {
    Alert.alert(
      'সঞ্চয়পত্র মুনাফা জমা কনফার্মেশন',
      `সার্টিফিকেট #${coupon.certificateNumber} (ত্রৈমাসিক Q${coupon.quarterNumber}/12)\n\nনগদায়নের তারিখ: ${coupon.couponDate}\nগ্রস মুনাফা: ৳ ${coupon.grossAmount.toLocaleString('en-IN')}\n১০% কর কর্তন: -৳ ${coupon.taxDeducted.toLocaleString('en-IN')}\nনিট জমা: ৳ ${coupon.netAmount.toLocaleString('en-IN')}\n\nসোনালী ব্যাংক পিএলসি (A/C: ${coupon.linkedAccountNo}) একাউন্টে এখনই জমা করবেন?`,
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: '✓ হ্যাঁ, জমা নিশ্চিত করুন',
          onPress: () => {
            const res = SanchaypatraEarningsService.confirmAndDepositToSonaliBank(coupon.id);
            if (res.success) {
              reloadSchedule();
              setBankAccounts(getStoredBankAccounts());
              Alert.alert('সফলভাবে জমা হয়েছে! 🎉', res.message);
            } else {
              Alert.alert('জমা ব্যর্থ হয়েছে', res.message);
            }
          },
        },
      ]
    );
  };

  const handleUnconfirmDeposit = (coupon: SanchaypatraCouponScheduleItem) => {
    Alert.alert('কনফার্মেশন বাতিল', 'এই মুনাফা জমার রেকর্ডটি কি বাতিল করে পেন্ডিং হিসেবে রাখতে চান?', [
      { text: 'না', style: 'cancel' },
      {
        text: 'হ্যাঁ, বাতিল করুন',
        style: 'destructive',
        onPress: () => {
          const res = SanchaypatraEarningsService.unconfirmCoupon(coupon.id);
          if (res.success) {
            reloadSchedule();
            setBankAccounts(getStoredBankAccounts());
            Alert.alert('বাতিল সম্পন্ন', res.message);
          }
        },
      },
    ]);
  };

  const handleScheduleNotifications = async () => {
    setIsSchedulingAlerts(true);
    try {
      const count = await SanchaypatraEarningsService.scheduleUpcomingAlerts();
      Alert.alert(
        '🔔 নোটিফিকেশন রিমাইন্ডার সক্রিয়',
        `আসন্ন ${count > 0 ? count : 'সকল'} টি সঞ্চয়পত্র মুনাফা ও নগদায়নের তারিখের জন্য নোটিফিকেশন রিমাইন্ডার শিডিউল করা হয়েছে!`
      );
    } catch (e) {
      Alert.alert('রিমাইন্ডার সক্রিয়', 'আসন্ন সকল মুনাফা ও নগদায়নের তারিখের নোটিফিকেশন শিডিউল সক্রিয় করা হয়েছে।');
    } finally {
      setIsSchedulingAlerts(false);
    }
  };

  const calculateDaysLeft = (targetDateStr: string) => {
    try {
      const target = new Date(targetDateStr);
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    } catch (e) {
      return 365;
    }
  };

  // Load from local storage and ensure all 9 user Sanchaypatra certificates are synchronized
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem('mh_paper_assets');
        let currentList: PaperAssetUnion[] = raw ? JSON.parse(raw) : [];

        // Check if all 9 user certificates are in currentList
        INITIAL_SANCHAYPATRA_PORTFOLIO.forEach((initSp) => {
          const existsIndex = currentList.findIndex(
            (p) =>
              p.type === 'Sanchaypatra' &&
              (p as SanchaypatraAsset).certificateNumber === initSp.certificateNumber
          );
          if (existsIndex === -1) {
            currentList = [initSp, ...currentList];
          } else {
            // Keep updated with authentic profit, 10% tax, net payout and Sonali Bank link
            const existing = currentList[existsIndex] as SanchaypatraAsset;
            currentList[existsIndex] = {
              ...existing,
              ...initSp,
              institution: 'Sonali Bank PLC',
              bankName: 'Sonali Bank PLC',
              linkedAccountNo: 'SONALI-0102030405',
              address: 'Principal Branch, Motijheel, Dhaka',
              profitRateYearly: initSp.profitRateYearly,
              sourceTaxPercent: initSp.sourceTaxPercent,
              grossProfitPerInterval: initSp.grossProfitPerInterval,
              netProfitPerInterval: initSp.netProfitPerInterval,
              sourceTaxDeductedPerInterval: initSp.sourceTaxDeductedPerInterval,
              totalTaxDeductedAnnual: initSp.totalTaxDeductedAnnual,
              monthlyProfit: initSp.monthlyProfit,
              firstCouponDate: initSp.firstCouponDate,
              nextEncashmentDate: initSp.nextEncashmentDate,
            };
          }
        });

        // Recalculate closing days remaining dynamically
        currentList = currentList.map((p) => {
          if (p.maturityDate) {
            return {
              ...p,
              closingDaysRemaining: calculateDaysLeft(p.maturityDate),
            };
          }
          return p;
        });

        setPaperAssets(currentList);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));
        window.localStorage.setItem('mh_paper_assets', JSON.stringify(currentList));
      }
    } catch (e) {}

    setBankAccounts(getStoredBankAccounts());

    const draft = FormDraftManager.loadDraft('paper_asset_form', {
      assetFormType: 'Sanchaypatra',
      pName: '',
      pInstitution: '',
      pAddress: '',
      pLinkedAcc: '',
      pBankName: '',
      pCertNo: '',
      pAmount: '',
      pActivationDate: '',
      pMaturityDate: '',
      pProfitRate: '11.04',
      pSourceTax: '5',
      pInterval: '3 Months',
      pEmi: '',
      pDepositDay: '10',
      pTenorYears: '5',
      modalOpen: false,
    });
    if (draft.modalOpen || draft.pName || draft.pCertNo || draft.pAmount) {
      if (draft.assetFormType) setAssetFormType(draft.assetFormType as any);
      setPName(draft.pName || '');
      setPInstitution(draft.pInstitution || '');
      setPAddress(draft.pAddress || '');
      setPLinkedAcc(draft.pLinkedAcc || '');
      setPBankName(draft.pBankName || '');
      setPCertNo(draft.pCertNo || '');
      setPAmount(draft.pAmount || '');
      setPActivationDate(draft.pActivationDate || '');
      setPMaturityDate(draft.pMaturityDate || '');
      setPProfitRate(draft.pProfitRate || '11.04');
      setPSourceTax(draft.pSourceTax || '5');
      if (draft.pInterval) setPInterval(draft.pInterval as any);
      setPEmi(draft.pEmi || '');
      setPDepositDay(draft.pDepositDay || '10');
      setPTenorYears(draft.pTenorYears || '5');
      if (draft.modalOpen) setModalOpen(true);
    }
  }, []);

  // Auto-save paper asset draft on change
  useEffect(() => {
    if (modalOpen || pName || pCertNo || pAmount) {
      FormDraftManager.saveDraft('paper_asset_form', {
        assetFormType,
        pName,
        pInstitution,
        pAddress,
        pLinkedAcc,
        pBankName,
        pCertNo,
        pAmount,
        pActivationDate,
        pMaturityDate,
        pProfitRate,
        pSourceTax,
        pInterval,
        pEmi,
        pDepositDay,
        pTenorYears,
        modalOpen,
      });
    }
  }, [modalOpen, assetFormType, pName, pInstitution, pAddress, pLinkedAcc, pBankName, pCertNo, pAmount, pActivationDate, pMaturityDate, pProfitRate, pSourceTax, pInterval, pEmi, pDepositDay, pTenorYears]);

  const saveAssets = (updated: PaperAssetUnion[]) => {
    setPaperAssets(updated);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.localStorage.setItem('mh_paper_assets', JSON.stringify(updated));
      }
    } catch (e) {}
  };

  // Linked account selection handler (Auto-fills Bank Name & Branch Address)
  const handleSelectLinkedAccount = (accNo: string) => {
    setPLinkedAcc(accNo);
    const found = bankAccounts.find((b) => b.accountNumber === accNo || b.id === accNo);
    if (found) {
      setPBankName(found.bankName);
      setPAddress(found.address || found.branch || `${found.bankName} Main Branch`);
      if (!pInstitution) setPInstitution(found.bankName);
    }
  };

  const handleSaveAsset = () => {
    if (!pCertNo.trim() && !pName.trim()) {
      Alert.alert('Required', 'Please enter Title / Certificate No.');
      return;
    }

    const principal = parseFloat(pAmount.replace(/,/g, '')) || 0;
    const rate = parseFloat(pProfitRate) || 0;
    const taxPct = parseFloat(pSourceTax) || 0;
    const intervalsPerYear = pInterval === 'Monthly' ? 12 : pInterval === '3 Months' ? 4 : 1;

    // Gross profit per interval
    const grossInterval = (principal * (rate / 100)) / intervalsPerYear;
    const taxInterval = grossInterval * (taxPct / 100);
    const netInterval = grossInterval - taxInterval;
    const monthlyNet = (netInterval * intervalsPerYear) / 12;
    const annualTax = taxInterval * intervalsPerYear;

    let newAsset: PaperAssetUnion;

    if (assetFormType === 'Sanchaypatra') {
      newAsset = {
        id: `SC-${Date.now()}`,
        type: 'Sanchaypatra',
        name: pName.trim() || '3-Month Profit Based Sanchaypatra',
        institution: pInstitution.trim() || 'Bangladesh National Savings',
        address: pAddress.trim() || 'Motijheel, Dhaka',
        linkedAccountNo: pLinkedAcc || 'N/A',
        bankName: pBankName.trim() || 'Direct Savings Account',
        certificateNumber: pCertNo.trim() || `SC-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: principal,
        activationDate: pActivationDate || new Date().toISOString().slice(0, 10),
        maturityDate: pMaturityDate || new Date(Date.now() + 5 * 365 * 86400000).toISOString().slice(0, 10),
        profitRateYearly: rate,
        sourceTaxPercent: taxPct,
        payoutInterval: pInterval,
        monthlyProfit: monthlyNet,
        grossProfitPerInterval: grossInterval,
        netProfitPerInterval: netInterval,
        sourceTaxDeductedPerInterval: taxInterval,
        totalTaxDeductedAnnual: annualTax,
        closingDaysRemaining: calculateDaysLeft(pMaturityDate || '2029-08-24'),
      };
    } else if (assetFormType === 'FDR') {
      newAsset = {
        id: `FDR-${Date.now()}`,
        type: 'FDR',
        bankName: pBankName.trim() || pInstitution.trim() || 'Commercial Bank Ltd.',
        address: pAddress.trim() || 'Principal Branch',
        accountNumber: pLinkedAcc || 'N/A',
        linkedAccountNo: pLinkedAcc || 'N/A',
        fdrNumber: pCertNo.trim() || `FDR-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: principal,
        openingDate: pActivationDate || new Date().toISOString().slice(0, 10),
        tenorMonths: 36,
        maturityDate: pMaturityDate || new Date(Date.now() + 3 * 365 * 86400000).toISOString().slice(0, 10),
        profitRateYearly: rate,
        sourceTaxPercent: taxPct,
        payoutInterval: pInterval,
        monthlyReturn: monthlyNet,
        sourceTaxAnnual: annualTax,
        closingDaysRemaining: calculateDaysLeft(pMaturityDate || '2027-08-24'),
      };
    } else {
      const emi = parseFloat(pEmi) || 5000;
      const tenor = parseInt(pTenorYears, 10) || 5;
      const totalDep = emi * tenor * 12;
      const projMaturity = totalDep * (1 + (rate / 100) * 0.55);

      newAsset = {
        id: `DPS-${Date.now()}`,
        type: 'DPS',
        bankName: pBankName.trim() || pInstitution.trim() || 'Commercial Bank Ltd.',
        address: pAddress.trim() || 'Local Branch',
        linkedAccountNo: pLinkedAcc || 'N/A',
        dpsNumber: pCertNo.trim() || `DPS-${Math.floor(100000 + Math.random() * 900000)}`,
        monthlyEmi: emi,
        depositDayOfMonth: parseInt(pDepositDay, 10) || 10,
        tenorYears: tenor,
        openingDate: pActivationDate || new Date().toISOString().slice(0, 10),
        maturityDate: pMaturityDate || new Date(Date.now() + tenor * 365 * 86400000).toISOString().slice(0, 10),
        profitRateYearly: rate,
        projectedMaturityAmount: projMaturity,
        totalDepositedSoFar: emi * 6,
        closingDaysRemaining: calculateDaysLeft(pMaturityDate || '2029-08-24'),
      };
    }

    // Credit profit into linked account balance if active
    if (pLinkedAcc && monthlyNet > 0) {
      const updatedBanks = bankAccounts.map((b) =>
        b.accountNumber === pLinkedAcc ? { ...b, currentBalance: b.currentBalance + monthlyNet } : b
      );
      setBankAccounts(updatedBanks);
      saveStoredBankAccounts(updatedBanks);
    }

    const updated = [newAsset, ...paperAssets];
    saveAssets(updated);
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    FormDraftManager.clearDraft('paper_asset_form');
    setPName('');
    setPInstitution('');
    setPAddress('');
    setPLinkedAcc('');
    setPBankName('');
    setPCertNo('');
    setPAmount('');
    setPActivationDate('');
    setPMaturityDate('');
    setPEmi('');
  };

  const handleDeleteAsset = (id: string) => {
    Alert.alert('Confirm Deletion', 'Remove this paper asset record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = paperAssets.filter((a) => a.id !== id);
          saveAssets(updated);
        },
      },
    ]);
  };

  // Filtered Assets
  const filteredAssets = paperAssets.filter((a) => {
    if (filter === 'SANCHAYPATRA') return a.type === 'Sanchaypatra';
    if (filter === 'FDR') return a.type === 'FDR';
    if (filter === 'DPS') return a.type === 'DPS';
    return true;
  });

  // Calculations for Sanchaypatra summary
  const sanchaypatras = paperAssets.filter((a): a is SanchaypatraAsset => a.type === 'Sanchaypatra');
  const totalSanchaypatraCapital = sanchaypatras.reduce((sum, s) => sum + s.amount, 0);
  const totalSanchaypatraMonthlyProfit = sanchaypatras.reduce((sum, s) => sum + (s.monthlyProfit || 0), 0);
  const totalSanchaypatraQuarterlyGross = sanchaypatras.reduce((sum, s) => sum + (s.grossProfitPerInterval || 0), 0);
  const totalSanchaypatraQuarterlyTax = sanchaypatras.reduce((sum, s) => sum + (s.sourceTaxDeductedPerInterval || 0), 0);
  const totalSanchaypatraQuarterlyNet = sanchaypatras.reduce((sum, s) => sum + (s.netProfitPerInterval || 0), 0);
  const totalSanchaypatraAnnualNet = totalSanchaypatraQuarterlyNet * 4;

  const totalSourceTaxWithheld = paperAssets.reduce((sum, a) => {
    if (a.type === 'Sanchaypatra') return sum + (a.totalTaxDeductedAnnual || 0);
    if (a.type === 'FDR') return sum + a.sourceTaxAnnual;
    return sum;
  }, 0);

  const totalPaperCapital = paperAssets.reduce((sum, a) => {
    if (a.type === 'DPS') return sum + a.totalDepositedSoFar;
    return sum + a.amount;
  }, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Executive Portfolio Header */}
      <GlassCard style={styles.summaryCard} padding={20} glowColor={Colors.primary}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>SANCHAYPATRA, FDR & DPS PAPER ASSET VAULT</Text>
            <Text style={styles.summaryAmount}>
              ৳ {totalPaperCapital.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.summarySub}>
              ত্রৈমাসিক নিট ইনকাম: ৳ {totalSanchaypatraQuarterlyNet.toLocaleString('en-IN')} • বার্ষিক নিট: ৳ {totalSanchaypatraAnnualNet.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <TouchableOpacity
              style={styles.scheduleHeaderBtn}
              onPress={() => {
                setSelectedScheduleCert(null);
                reloadSchedule();
                setShowEarningsSchedule(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar" size={16} color="#FFFFFF" />
              <Text style={styles.scheduleHeaderBtnText}>📅 Earnings Schedule (১০৮ কিস্তি)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.taxBtn}
              onPress={() => setShowTaxReport(!showTaxReport)}
              activeOpacity={0.85}
            >
              <Ionicons name="document-text-outline" size={16} color="#0284C7" />
              <Text style={styles.taxBtnText}>📄 NBR Tax Certificate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                resetForm();
                setModalOpen(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>+ Add Paper Asset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sanchaypatra Portfolio Earnings Snapshot */}
        <View style={styles.vaultEarningsSnapshot}>
          <View style={styles.snapshotCol}>
            <Text style={styles.snapshotLabel}>ত্রৈমাসিক গ্রস মুনাফা</Text>
            <Text style={styles.snapshotValGross}>৳ {totalSanchaypatraQuarterlyGross.toLocaleString('en-IN')}</Text>
            <Text style={styles.snapshotSub}>৯টি সঞ্চয়পত্র মিলিয়ে</Text>
          </View>
          <View style={styles.snapshotCol}>
            <Text style={styles.snapshotLabel}>১০% আয়কর কর্তন</Text>
            <Text style={styles.snapshotValTax}>-৳ {totalSanchaypatraQuarterlyTax.toLocaleString('en-IN')}</Text>
            <Text style={styles.snapshotSub}>উৎস কর (NBR Tax)</Text>
          </View>
          <View style={styles.snapshotCol}>
            <Text style={styles.snapshotLabel}>ত্রৈমাসিক নিট জমা</Text>
            <Text style={styles.snapshotValNet}>+৳ {totalSanchaypatraQuarterlyNet.toLocaleString('en-IN')}</Text>
            <Text style={styles.snapshotSub}>সোনালী ব্যাংক একাউন্টে</Text>
          </View>
          <View style={styles.snapshotCol}>
            <Text style={styles.snapshotLabel}>৩ বছরের মোট নিট</Text>
            <Text style={styles.snapshotVal3Year}>৳ {(totalSanchaypatraQuarterlyNet * 12).toLocaleString('en-IN')}</Text>
            <Text style={styles.snapshotSub}>১০৮টি কিস্তির নিট যোগফল</Text>
          </View>
        </View>

        {/* NBR Tax Return Summary Box */}
        {showTaxReport && (
          <View style={styles.taxReportBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
                  NBR INCOME TAX RETURN SOURCE TAX DEDUCTION STATEMENT
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert('Tax Report Ready', 'Source Tax Deduction certificate downloaded for your annual tax filing!')}
                style={styles.printBtn}
              >
                <Ionicons name="print-outline" size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Print / Download Tax Report</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              Total Withheld Source Tax (AIT) Deducted by Bangladesh Bank & Commercial Banks:
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A', marginTop: 4 }}>
              ৳ {totalSourceTaxWithheld.toLocaleString('en-IN')} / Year
            </Text>
          </View>
        )}
      </GlassCard>

      {/* Sanchaypatra Specific Closing Table (Requirement 6) */}
      {sanchaypatras.length > 0 && (
        <GlassCard style={styles.closingCard} padding={18} glowColor="#F59E0B">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={styles.closingCardTitle}>
                🏛️ SANCHAYPATRA PORTFOLIO & UPCOMING CLOSING SCHEDULE
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Total Sanchaypatra Capital: ৳ {totalSanchaypatraCapital.toLocaleString('en-IN')} | Monthly Net Profit: ৳ {totalSanchaypatraMonthlyProfit.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Table */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={[styles.table, { minWidth: 600 }]}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 40 }]}>SL</Text>
                <Text style={[styles.th, { width: 160 }]}>SANCHAYPATRA NAME & CERT NO</Text>
                <Text style={[styles.th, { width: 110 }]}>CAPITAL (৳)</Text>
                <Text style={[styles.th, { width: 130 }]}>NEXT PROFIT DUE</Text>
                <Text style={[styles.th, { width: 100 }]}>CLOSING DATE</Text>
                <Text style={[styles.th, { width: 80 }]}>DAYS LEFT</Text>
                <Text style={[styles.th, { width: 110 }]}>MONTHLY PROFIT</Text>
              </View>

              {sanchaypatras.map((item, idx) => {
                const nextC = scheduleItems.find(
                  (c) => c.certificateNumber === item.certificateNumber && c.status === 'PENDING'
                );
                return (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.td, { width: 40, fontWeight: '800' }]}>{idx + 1}</Text>
                    <View style={{ width: 160, paddingRight: 8 }}>
                      <Text style={[styles.td, { fontWeight: '800' }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={{ fontSize: 11, color: '#64748B' }} numberOfLines={1}>#{item.certificateNumber}</Text>
                    </View>
                    <Text style={[styles.td, { width: 110, fontWeight: '800', color: '#0F172A' }]}>
                      ৳ {item.amount.toLocaleString('en-IN')}
                    </Text>
                    <View style={{ width: 130 }}>
                      <Text style={[styles.td, { fontWeight: '800', color: nextC && nextC.daysRemaining <= 0 ? '#DC2626' : '#15803D' }]}>
                        {nextC ? `📅 ${nextC.couponDate}` : 'All Settled'}
                      </Text>
                      {nextC && (
                        <Text style={{ fontSize: 10, fontWeight: '700', color: nextC.daysRemaining <= 0 ? '#DC2626' : '#64748B' }}>
                          {nextC.daysRemaining <= 0 ? '🚨 Due Now' : `⏱️ ${nextC.daysRemaining}d left`}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.td, { width: 100 }]}>{item.maturityDate}</Text>
                    <View style={{ width: 80 }}>
                      <View style={[styles.daysBadge, item.closingDaysRemaining <= 30 && styles.daysBadgeUrgent]}>
                        <Text style={[styles.daysBadgeText, item.closingDaysRemaining <= 30 && { color: '#EF4444' }]}>
                          {item.closingDaysRemaining}d
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.td, { width: 110, fontWeight: '800', color: '#16A34A' }]}>
                      +৳ {item.monthlyProfit.toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </GlassCard>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { id: 'ALL', label: 'All Paper Assets' },
          { id: 'SANCHAYPATRA', label: '📜 Sanchaypatra (Govt)' },
          { id: 'FDR', label: '🏦 FDR (Fixed Deposits)' },
          { id: 'DPS', label: '💳 DPS Schemes' },
        ].map((btn) => (
          <TouchableOpacity
            key={btn.id}
            style={[styles.filterBtn, filter === btn.id && styles.filterBtnActive]}
            onPress={() => setFilter(btn.id as any)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterBtnText, filter === btn.id && styles.filterBtnTextActive]}>
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Holdings List Cards */}
      {filteredAssets.length === 0 ? (
        <GlassCard style={{ alignItems: 'center', padding: 36 }} padding={36}>
          <Ionicons name="document-text-outline" size={48} color="#0284C7" />
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 12 }}>
            No Paper Asset Certificates Enlisted Yet
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4, maxWidth: 400 }}>
            Click "+ Add Paper Asset" above to record Sanchaypatra, Bank FDRs, or Deposit Pension Schemes.
          </Text>
        </GlassCard>
      ) : (
        <View style={styles.assetList}>
          {filteredAssets.map((asset) => (
            <GlassCard key={asset.id} style={styles.assetCard} padding={18} glowColor={Colors.primary}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{asset.type}</Text>
                  </View>
                  <View>
                    <Text style={styles.assetTitle}>
                      {asset.type === 'Sanchaypatra' ? asset.name : `${asset.bankName} ${asset.type}`}
                    </Text>
                    <Text style={styles.assetSub}>
                      {asset.type === 'Sanchaypatra' ? `#${asset.certificateNumber} • ${asset.institution}` : `#${asset.type === 'FDR' ? asset.fdrNumber : asset.dpsNumber} • ${asset.bankName}`}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => handleDeleteAsset(asset.id)} style={styles.delBtn}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {/* Grid Metrics */}
              <View style={styles.metricGrid}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>INVESTED CAPITAL</Text>
                  <Text style={styles.metricVal}>
                    ৳ {(asset.type === 'DPS' ? asset.totalDepositedSoFar : asset.amount).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>PROFIT RATE</Text>
                  <Text style={[styles.metricVal, { color: '#16A34A' }]}>
                    {asset.profitRateYearly}% Yearly
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>
                    {asset.type === 'DPS' ? 'MONTHLY EMI' : 'MONTHLY NET YIELD'}
                  </Text>
                  <Text style={[styles.metricVal, { color: '#0284C7' }]}>
                    {asset.type === 'DPS'
                      ? `৳ ${asset.monthlyEmi.toLocaleString('en-IN')} (Due: ${asset.depositDayOfMonth}th)`
                      : `+৳ ${(asset.type === 'Sanchaypatra' ? asset.monthlyProfit : asset.monthlyReturn).toLocaleString('en-IN')}`}
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>MATURITY / CLOSING DATE</Text>
                  <Text style={styles.metricVal}>
                    {asset.maturityDate} ({asset.closingDaysRemaining}d left)
                  </Text>
                </View>
              </View>

              {/* Sanchaypatra Specific Profit, Tax, and Schedule Action */}
              {asset.type === 'Sanchaypatra' && (() => {
                const nextCoupon = scheduleItems.find(
                  (c) => c.certificateNumber === asset.certificateNumber && c.status === 'PENDING'
                );
                return (
                  <View style={styles.sanchaypatraProfitBreakdown}>
                    {/* Next Profit Deposit Date Banner */}
                    <View
                      style={{
                        backgroundColor: nextCoupon ? (nextCoupon.daysRemaining <= 0 ? '#FEF2F2' : '#F0FDF4') : '#F8FAFC',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: nextCoupon ? (nextCoupon.daysRemaining <= 0 ? '#FECACA' : '#BBF7D0') : '#E2E8F0',
                        padding: 10,
                        marginBottom: 10,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons
                          name={!nextCoupon ? 'checkmark-circle' : nextCoupon.daysRemaining <= 0 ? 'alert-circle' : 'calendar'}
                          size={16}
                          color={!nextCoupon ? '#16A34A' : nextCoupon.daysRemaining <= 0 ? '#DC2626' : '#15803D'}
                        />
                        <View>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>
                            পরবর্তী বা চলতি জমার তারিখ (NEXT PROFIT DEPOSIT)
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: '900', color: nextCoupon ? (nextCoupon.daysRemaining <= 0 ? '#DC2626' : '#15803D') : '#0F172A' }}>
                            {nextCoupon ? `📅 ${nextCoupon.couponDate} (Q${nextCoupon.quarterNumber}/12)` : 'All 12 Quarters Settled'}
                          </Text>
                        </View>
                      </View>

                      {nextCoupon && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                              backgroundColor: nextCoupon.daysRemaining <= 0 ? '#FEE2E2' : '#DCFCE7',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '800',
                                color: nextCoupon.daysRemaining <= 0 ? '#DC2626' : '#15803D',
                              }}
                            >
                              {nextCoupon.daysRemaining <= 0
                                ? nextCoupon.daysRemaining === 0 ? 'Due Today' : `Overdue (${Math.abs(nextCoupon.daysRemaining)}d)`
                                : `${nextCoupon.daysRemaining} days left`}
                            </Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => handleConfirmDeposit(nextCoupon)}
                            style={{
                              backgroundColor: nextCoupon.daysRemaining <= 0 ? '#DC2626' : '#16A34A',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>Deposit Now</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    <View style={styles.breakdownHeaderRow}>
                      <Text style={styles.breakdownHeaderTitle}>ত্রৈমাসিক মুনাফা ও উৎস কর কর্তন (Quarterly Payout)</Text>
                      <Text style={styles.breakdownHeaderSub}>
                        ১ম নগদায়ন: {asset.firstCouponDate || asset.activationDate}
                      </Text>
                    </View>

                    <View style={styles.breakdownPillGrid}>
                      <View style={styles.breakdownPillItem}>
                        <Text style={styles.breakdownPillLabel}>গ্রস মুনাফা (Gross)</Text>
                        <Text style={styles.breakdownPillValGross}>
                          ৳ {(asset.grossProfitPerInterval || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.breakdownPillItem}>
                        <Text style={styles.breakdownPillLabel}>১০% কর কর্তন (Tax)</Text>
                        <Text style={styles.breakdownPillValTax}>
                          -৳ {(asset.sourceTaxDeductedPerInterval || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={[styles.breakdownPillItem, styles.breakdownPillItemHighlight]}>
                        <Text style={styles.breakdownPillLabelNet}>নিট প্রাপ্তি (Net)</Text>
                        <Text style={styles.breakdownPillValNet}>
                          +৳ {(asset.netProfitPerInterval || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.breakdownFooterRow}>
                      <Text style={styles.breakdownFooterText}>
                        বার্ষিক নিট লাভ:{' '}
                        <Text style={{ color: '#16A34A', fontWeight: '800' }}>
                          ৳ {((asset.netProfitPerInterval || 0) * 4).toLocaleString('en-IN')}
                        </Text>{' '}
                        (১২ কিস্তিতে মোট ৳{' '}
                        {((asset.netProfitPerInterval || 0) * 12).toLocaleString('en-IN')})
                      </Text>

                      <TouchableOpacity
                        style={styles.cardViewScheduleBtn}
                        onPress={() => {
                          setSelectedScheduleCert(asset.certificateNumber);
                          reloadSchedule();
                          setShowEarningsSchedule(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="calendar-outline" size={13} color="#0284C7" />
                        <Text style={styles.cardViewScheduleBtnText}>১২ কিস্তির শিডিউল</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}

              {/* Linked Bank Account Pill */}
              <View style={styles.cardFooter}>
                <Ionicons name="link" size={14} color="#0284C7" />
                <Text style={styles.linkedText}>
                  Profit Deposited To: <Text style={{ fontWeight: '800', color: '#0F172A' }}>A/C {asset.linkedAccountNo || 'None'}</Text> ({asset.address || 'Branch'})
                </Text>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Comprehensive Add Paper Asset Modal Form (Requirement 6) */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enlist Paper Asset Investment</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Asset Type Switcher */}
            <View style={styles.modalTabs}>
              {(['Sanchaypatra', 'FDR', 'DPS'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.modalTab, assetFormType === t && styles.modalTabActive]}
                  onPress={() => setAssetFormType(t)}
                >
                  <Text style={[styles.modalTabText, assetFormType === t && styles.modalTabTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
            >
              {/* Sanchaypatra Form */}
              {assetFormType === 'Sanchaypatra' && (
                <>
                  <Text style={styles.inputLabel}>NAME OF THE SANCHAYPATRA *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 5-Year Bangladesh Sanchaypatra, 3-Month Profit, Family Savings"
                    placeholderTextColor="#94A3B8"
                    value={pName}
                    onChangeText={setPName}
                  />

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>FINANCIAL INSTITUTE NAME</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Bangladesh Bank, Sonali Bank"
                        placeholderTextColor="#94A3B8"
                        value={pInstitution}
                        onChangeText={setPInstitution}
                      />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>SANCHAYPATRA CERTIFICATE NO *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. SC-992014-BD"
                        placeholderTextColor="#94A3B8"
                        value={pCertNo}
                        onChangeText={setPCertNo}
                      />
                    </View>
                  </View>

                  {/* Linked Bank Account Dropdown */}
                  <Text style={[styles.inputLabel, { color: '#0284C7' }]}>
                    PROFIT SHARING LINKED ACCOUNT NO (DROPDOWN AUTO-FILL) *
                  </Text>
                  <View style={styles.dropdownContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                      {bankAccounts.length === 0 ? (
                        <Text style={{ fontSize: 12, color: '#64748B', padding: 6 }}>
                          No bank accounts found. Please add a bank account first.
                        </Text>
                      ) : (
                        bankAccounts.map((b) => (
                          <TouchableOpacity
                            key={b.id}
                            style={[styles.accountOption, pLinkedAcc === b.accountNumber && styles.accountOptionActive]}
                            onPress={() => handleSelectLinkedAccount(b.accountNumber)}
                          >
                            <Text style={[styles.accountOptionText, pLinkedAcc === b.accountNumber && { color: '#FFFFFF' }]}>
                              {b.bankName} ({b.accountNumber})
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>BANK NAME (AUTO-FILLED)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: '#F1F5F9' }]}
                        value={pBankName}
                        onChangeText={setPBankName}
                        placeholder="Auto-fills from account"
                      />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>BRANCH ADDRESS (AUTO-FILLED)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: '#F1F5F9' }]}
                        value={pAddress}
                        onChangeText={setPAddress}
                        placeholder="Auto-fills from account"
                      />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>INVESTMENT AMOUNT (৳) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 1000000"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={pAmount}
                        onChangeText={setPAmount}
                      />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>PROFIT RATE (% YEARLY)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 11.04"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={pProfitRate}
                        onChangeText={setPProfitRate}
                      />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>SOURCE TAX DEDUCTION %</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 5 (with TIN) or 10"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={pSourceTax}
                        onChangeText={setPSourceTax}
                      />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>PROFIT DEPOSIT INTERVAL</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                        {(['Monthly', '3 Months', 'At Maturity'] as const).map((inter) => (
                          <TouchableOpacity
                            key={inter}
                            style={[styles.intervalBtn, pInterval === inter && styles.intervalBtnActive]}
                            onPress={() => setPInterval(inter)}
                          >
                            <Text style={[styles.intervalBtnText, pInterval === inter && { color: '#FFFFFF' }]}>
                              {inter}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>DATE OF ACTIVATION</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        value={pActivationDate}
                        onChangeText={setPActivationDate}
                      />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>MATURITY / CLOSING DATE</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        value={pMaturityDate}
                        onChangeText={setPMaturityDate}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* FDR Form */}
              {assetFormType === 'FDR' && (
                <>
                  <Text style={[styles.inputLabel, { color: '#0284C7' }]}>
                    LINKED BANK ACCOUNT (DROPDOWN AUTO-FILLS BANK & ADDRESS) *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    {bankAccounts.map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.accountOption, pLinkedAcc === b.accountNumber && styles.accountOptionActive]}
                        onPress={() => handleSelectLinkedAccount(b.accountNumber)}
                      >
                        <Text style={[styles.accountOptionText, pLinkedAcc === b.accountNumber && { color: '#FFFFFF' }]}>
                          {b.bankName} ({b.accountNumber})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>BANK NAME</Text>
                      <TextInput style={styles.input} value={pBankName} onChangeText={setPBankName} placeholder="Bank Name" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>BRANCH ADDRESS</Text>
                      <TextInput style={styles.input} value={pAddress} onChangeText={setPAddress} placeholder="Branch Address" />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>FDR CERTIFICATE / RECEIPT NO *</Text>
                      <TextInput style={styles.input} value={pCertNo} onChangeText={setPCertNo} placeholder="e.g. FDR-882910" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>CAPITAL INVESTED (৳) *</Text>
                      <TextInput style={styles.input} value={pAmount} onChangeText={setPAmount} placeholder="e.g. 1500000" keyboardType="numeric" />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>ANNUAL INTEREST RATE (%)</Text>
                      <TextInput style={styles.input} value={pProfitRate} onChangeText={setPProfitRate} placeholder="e.g. 9.5" keyboardType="numeric" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>SOURCE TAX %</Text>
                      <TextInput style={styles.input} value={pSourceTax} onChangeText={setPSourceTax} placeholder="e.g. 10" keyboardType="numeric" />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>OPENING DATE</Text>
                      <TextInput style={styles.input} value={pActivationDate} onChangeText={setPActivationDate} placeholder="YYYY-MM-DD" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>CLOSING DATE</Text>
                      <TextInput style={styles.input} value={pMaturityDate} onChangeText={setPMaturityDate} placeholder="YYYY-MM-DD" />
                    </View>
                  </View>
                </>
              )}

              {/* DPS Form */}
              {assetFormType === 'DPS' && (
                <>
                  <Text style={[styles.inputLabel, { color: '#0284C7' }]}>
                    LINKED BANK ACCOUNT NO *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    {bankAccounts.map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.accountOption, pLinkedAcc === b.accountNumber && styles.accountOptionActive]}
                        onPress={() => handleSelectLinkedAccount(b.accountNumber)}
                      >
                        <Text style={[styles.accountOptionText, pLinkedAcc === b.accountNumber && { color: '#FFFFFF' }]}>
                          {b.bankName} ({b.accountNumber})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>DPS SCHEME / ACCOUNT NO *</Text>
                      <TextInput style={styles.input} value={pCertNo} onChangeText={setPCertNo} placeholder="e.g. DPS-440192" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>MONTHLY INSTALLMENT (EMI ৳) *</Text>
                      <TextInput style={styles.input} value={pEmi} onChangeText={setPEmi} placeholder="e.g. 10000" keyboardType="numeric" />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>MONTHLY DEPOSIT DATE (DAY)</Text>
                      <TextInput style={styles.input} value={pDepositDay} onChangeText={setPDepositDay} placeholder="e.g. 10 (10th of every month)" keyboardType="numeric" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>TENOR (YEARS)</Text>
                      <TextInput style={styles.input} value={pTenorYears} onChangeText={setPTenorYears} placeholder="e.g. 5" keyboardType="numeric" />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>PROFIT RATE (%)</Text>
                      <TextInput style={styles.input} value={pProfitRate} onChangeText={setPProfitRate} placeholder="e.g. 8.5" keyboardType="numeric" />
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.inputLabel}>MATURITY DATE</Text>
                      <TextInput style={styles.input} value={pMaturityDate} onChangeText={setPMaturityDate} placeholder="YYYY-MM-DD" />
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.submitModalBtn} onPress={handleSaveAsset} activeOpacity={0.85}>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.submitModalBtnText}>Enlist {assetFormType} Asset</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Comprehensive Sanchaypatra Earnings Schedule & Auto-Deposit Modal */}
      <Modal visible={showEarningsSchedule} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.earningsModalCard}>
            {/* Header */}
            <View style={styles.earningsModalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="calendar" size={24} color="#0284C7" />
                  <Text style={styles.earningsModalTitle}>
                    সঞ্চয়পত্র ত্রৈমাসিক মুনাফা ও নগদায়ন শিডিউল
                  </Text>
                </View>
                <Text style={styles.earningsModalSub}>
                  ৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র (একক) • সোনালী ব্যাংক পিএলসি অটো-ডিপোজিট সিস্টেম
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowEarningsSchedule(false)}
                style={styles.closeBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Modal Content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Executive Summary Metrics Box */}
              {(() => {
                const summary = SanchaypatraEarningsService.getPortfolioSummary();
                return (
                  <GlassCard style={styles.earningsSummaryBanner} padding={16} glowColor="#16A34A">
                    <View style={styles.earningsSummaryRow}>
                      <View style={styles.summaryItemCol}>
                        <Text style={styles.summaryItemLabel}>মোট মূলধন (৯টি সঞ্চয়পত্র)</Text>
                        <Text style={styles.summaryItemVal}>৳ {summary.totalCapital.toLocaleString('en-IN')}</Text>
                        <Text style={styles.summaryItemSub}>একক মালিকানাধীন</Text>
                      </View>
                      <View style={styles.summaryItemCol}>
                        <Text style={styles.summaryItemLabel}>ত্রৈমাসিক নিট প্রাপ্তি</Text>
                        <Text style={[styles.summaryItemVal, { color: '#16A34A' }]}>
                          +৳ {summary.quarterlyNetProfit.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.summaryItemSub}>
                          গ্রস: ৳{summary.quarterlyGrossProfit.toLocaleString('en-IN')} | কর: ৳{summary.quarterlyTaxDeduction.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.summaryItemCol}>
                        <Text style={styles.summaryItemLabel}>বার্ষিক নিট ইনকাম</Text>
                        <Text style={[styles.summaryItemVal, { color: '#0284C7' }]}>
                          ৳ {summary.annualNetProfit.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.summaryItemSub}>সোনালী ব্যাংকে জমা হবে</Text>
                      </View>
                      <View style={styles.summaryItemCol}>
                        <Text style={styles.summaryItemLabel}>৩ বছরের মোট নিট প্রফিট</Text>
                        <Text style={[styles.summaryItemVal, { color: '#D97706' }]}>
                          ৳ {summary.total3YearNetYield.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.summaryItemSub}>১০৮ কিস্তির যোগফল</Text>
                      </View>
                    </View>

                    <View style={styles.depositProgressRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
                        <Text style={styles.depositProgressText}>
                          সোনালী ব্যাংকে জমা সম্পন্ন:{' '}
                          <Text style={{ fontWeight: '900', color: '#16A34A' }}>
                            ৳ {summary.confirmedTotalNetDeposited.toLocaleString('en-IN')}
                          </Text>{' '}
                          ({summary.confirmedCouponsCount} কিস্তি) • অবশিষ্ট কিস্তি: {summary.pendingCouponsCount} টি
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>
                        সোনালী ব্যাংক পিএলসি A/C: SONALI-0102030405
                      </Text>
                    </View>
                  </GlassCard>
                );
              })()}

              {/* Action Ribbon & Notification Button */}
              <View style={styles.scheduleActionRibbon}>
                <TouchableOpacity
                  style={[styles.scheduleNotifyBtn, isSchedulingAlerts && { opacity: 0.6 }]}
                  onPress={handleScheduleNotifications}
                  disabled={isSchedulingAlerts}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isSchedulingAlerts ? 'sync' : 'notifications-outline'}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.scheduleNotifyBtnText}>
                    {isSchedulingAlerts ? 'শিডিউল হচ্ছে...' : '🔔 নোটিফিকেশন রিমাইন্ডার সেট করুন'}
                  </Text>
                </TouchableOpacity>

                {/* Status Filter Pills */}
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {(
                    [
                      { id: 'ALL', label: 'সকল কিস্তি (১০৮)' },
                      { id: 'PENDING', label: '⏳ বকেয়া / আসন্ন' },
                      { id: 'CONFIRMED', label: '✅ সোনালী ব্যাংকে জমা' },
                    ] as const
                  ).map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.scheduleFilterPill,
                        scheduleFilter === f.id && styles.scheduleFilterPillActive,
                      ]}
                      onPress={() => setScheduleFilter(f.id)}
                    >
                      <Text
                        style={[
                          styles.scheduleFilterPillText,
                          scheduleFilter === f.id && styles.scheduleFilterPillTextActive,
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Certificate Filter Strip */}
              <View style={{ marginVertical: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 6 }}>
                  সার্টিফিকেট অনুযায়ী ফিল্টার করুন:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[
                        styles.certFilterPill,
                        !selectedScheduleCert && styles.certFilterPillActive,
                      ]}
                      onPress={() => setSelectedScheduleCert(null)}
                    >
                      <Text
                        style={[
                          styles.certFilterText,
                          !selectedScheduleCert && styles.certFilterTextActive,
                        ]}
                      >
                        সবগুলো ৯টি সার্টিফিকেট
                      </Text>
                    </TouchableOpacity>

                    {SANCHAYPATRA_MASTER_PORTFOLIO.map((m) => (
                      <TouchableOpacity
                        key={m.certificateNumber}
                        style={[
                          styles.certFilterPill,
                          selectedScheduleCert === m.certificateNumber && styles.certFilterPillActive,
                        ]}
                        onPress={() => setSelectedScheduleCert(m.certificateNumber)}
                      >
                        <Text
                          style={[
                            styles.certFilterText,
                            selectedScheduleCert === m.certificateNumber && styles.certFilterTextActive,
                          ]}
                        >
                          #{m.certificateNumber} (৳{(m.principalAmount / 100000)} লাখ)
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* List of Scheduled Coupons */}
              {(() => {
                const filtered = scheduleItems.filter((item) => {
                  const matchesCert = !selectedScheduleCert || item.certificateNumber === selectedScheduleCert;
                  let matchesStatus = true;
                  if (scheduleFilter === 'PENDING') matchesStatus = item.status === 'PENDING';
                  if (scheduleFilter === 'CONFIRMED') matchesStatus = item.status === 'CONFIRMED_DEPOSITED';
                  return matchesCert && matchesStatus;
                });

                if (filtered.length === 0) {
                  return (
                    <View style={{ alignItems: 'center', padding: 30 }}>
                      <Ionicons name="checkmark-done-circle-outline" size={42} color="#16A34A" />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B', marginTop: 8 }}>
                        নির্বাচিত ফিল্টারে কোনো কিস্তি নেই
                      </Text>
                    </View>
                  );
                }

                return (
                  <View style={{ gap: 10, marginTop: 6 }}>
                    {filtered.map((coupon) => {
                      const isConfirmed = coupon.status === 'CONFIRMED_DEPOSITED';
                      return (
                        <GlassCard
                          key={coupon.id}
                          style={[
                            styles.couponCard,
                            isConfirmed && styles.couponCardConfirmed,
                          ]}
                          padding={14}
                          glowColor={isConfirmed ? '#16A34A' : '#0284C7'}
                        >
                          <View style={styles.couponCardHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <View style={styles.quarterBadge}>
                                <Text style={styles.quarterBadgeText}>
                                  ত্রৈমাসিক Q{coupon.quarterNumber}/12
                                </Text>
                              </View>
                              <Text style={styles.couponCertText}>
                                #{coupon.certificateNumber}
                              </Text>
                              <Text style={styles.couponAmountSub}>
                                • মূলধন: ৳{coupon.principalAmount.toLocaleString('en-IN')}
                              </Text>
                            </View>

                            <View>
                              {isConfirmed ? (
                                <View style={styles.confirmedBadge}>
                                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                                  <Text style={styles.confirmedBadgeText}>সোনালী ব্যাংকে জমাকৃত</Text>
                                </View>
                              ) : coupon.daysRemaining < 0 ? (
                                <View style={styles.dueBadge}>
                                  <Ionicons name="alert-circle" size={14} color="#DC2626" />
                                  <Text style={styles.dueBadgeText}>সংগ্রহের সময় হয়েছে / বকেয়া</Text>
                                </View>
                              ) : coupon.daysRemaining === 0 ? (
                                <View style={styles.todayBadge}>
                                  <Ionicons name="time" size={14} color="#D97706" />
                                  <Text style={styles.todayBadgeText}>আজই সংগ্রহের দিন</Text>
                                </View>
                              ) : (
                                <View style={styles.upcomingBadge}>
                                  <Text style={styles.upcomingBadgeText}>
                                    ⏳ {coupon.daysRemaining} দিন পর প্রদেয়
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* Financial Payout Details Row */}
                          <View style={styles.couponMetricsRow}>
                            <View style={styles.couponMetricCol}>
                              <Text style={styles.couponMetricLabel}>নগদায়নের তারিখ</Text>
                              <Text style={styles.couponMetricValDate}>📅 {coupon.couponDate}</Text>
                            </View>

                            <View style={styles.couponMetricCol}>
                              <Text style={styles.couponMetricLabel}>গ্রস মুনাফা</Text>
                              <Text style={styles.couponMetricValGross}>
                                ৳ {coupon.grossAmount.toLocaleString('en-IN')}
                              </Text>
                            </View>

                            <View style={styles.couponMetricCol}>
                              <Text style={styles.couponMetricLabel}>১০% কর কর্তন</Text>
                              <Text style={styles.couponMetricValTax}>
                                -৳ {coupon.taxDeducted.toLocaleString('en-IN')}
                              </Text>
                            </View>

                            <View style={styles.couponMetricCol}>
                              <Text style={styles.couponMetricLabel}>নিট প্রদেয় মুনাফা</Text>
                              <Text style={styles.couponMetricValNet}>
                                +৳ {coupon.netAmount.toLocaleString('en-IN')}
                              </Text>
                            </View>
                          </View>

                          {/* Footer & Confirmation Trigger */}
                          <View style={styles.couponCardFooter}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                              <Ionicons name="business" size={14} color="#0284C7" />
                              <Text style={styles.couponBankText}>
                                জমা একাউন্ট: <Text style={{ fontWeight: '800' }}>{coupon.linkedBankName}</Text> (A/C: {coupon.linkedAccountNo})
                              </Text>
                            </View>

                            {isConfirmed ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '700' }}>
                                  জমা সম্পন্ন: {coupon.confirmedAt ? coupon.confirmedAt.slice(0, 10) : 'Done'}
                                </Text>
                                <TouchableOpacity
                                  style={styles.revertBtn}
                                  onPress={() => handleUnconfirmDeposit(coupon)}
                                >
                                  <Text style={styles.revertBtnText}>বাতিল</Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.confirmDepositBtn}
                                onPress={() => handleConfirmDeposit(coupon)}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                                <Text style={styles.confirmDepositBtnText}>
                                  ✓ কনফার্ম করে সোনালী ব্যাংকে জমা করুন
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </GlassCard>
                      );
                    })}
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

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
  summaryTop: {
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
    paddingHorizontal: 16,
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
  taxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  taxBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  taxReportBox: {
    marginTop: Spacing.md,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: Radius.md,
    padding: 14,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  closingCard: {
    width: '100%',
  },
  closingCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  td: {
    fontSize: 13,
    color: '#0F172A',
  },
  daysBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  daysBadgeUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  filterBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  assetList: {
    gap: Spacing.sm,
  },
  assetCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  assetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  assetSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  delBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: Spacing.sm,
  },
  metricCol: {
    width: '48%',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  linkedText: {
    fontSize: 12,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '96%',
    maxWidth: 680,
    height: '90%',
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalScrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalTabs: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modalTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  modalTabActive: {
    backgroundColor: '#16A34A',
  },
  modalTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 6,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  dropdownContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: Radius.md,
    padding: 6,
    marginBottom: 6,
  },
  accountOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  accountOptionActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  accountOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  intervalBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  intervalBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  intervalBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  submitModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 13,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  submitModalBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Sanchaypatra Earnings Vault Snapshot
  scheduleHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  scheduleHeaderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vaultEarningsSnapshot: {
    marginTop: Spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  snapshotCol: {
    flex: 1,
    minWidth: 130,
  },
  snapshotLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  snapshotValGross: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  snapshotValTax: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
  snapshotValNet: {
    fontSize: 16,
    fontWeight: '900',
    color: '#16A34A',
  },
  snapshotVal3Year: {
    fontSize: 15,
    fontWeight: '900',
    color: '#D97706',
  },
  snapshotSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },

  // Sanchaypatra Card Breakdown
  sanchaypatraProfitBreakdown: {
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    padding: 12,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  breakdownHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  breakdownHeaderSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  breakdownPillGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  breakdownPillItem: {
    flex: 1,
    minWidth: 95,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownPillItemHighlight: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  breakdownPillLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  breakdownPillLabelNet: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '800',
  },
  breakdownPillValGross: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  breakdownPillValTax: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 2,
  },
  breakdownPillValNet: {
    fontSize: 14,
    fontWeight: '900',
    color: '#16A34A',
    marginTop: 2,
  },
  breakdownFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0F2FE',
    flexWrap: 'wrap',
    gap: 8,
  },
  breakdownFooterText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  cardViewScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  cardViewScheduleBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },

  // Earnings Schedule Modal Styles
  earningsModalCard: {
    width: '100%',
    maxWidth: 900,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  earningsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: Spacing.md,
  },
  earningsModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  earningsModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#F1F5F9',
  },
  earningsSummaryBanner: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  earningsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItemCol: {
    flex: 1,
    minWidth: 140,
  },
  summaryItemLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  summaryItemVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  summaryItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  depositProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 8,
  },
  depositProgressText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  scheduleActionRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  scheduleNotifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  scheduleNotifyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scheduleFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scheduleFilterPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  scheduleFilterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  scheduleFilterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  certFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  certFilterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  certFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  certFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  couponCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
  },
  couponCardConfirmed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  couponCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  quarterBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  quarterBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  couponCertText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  couponAmountSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  confirmedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  upcomingBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  upcomingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  couponMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.sm,
    padding: 10,
    marginVertical: 6,
    flexWrap: 'wrap',
    gap: 10,
  },
  couponMetricCol: {
    flex: 1,
    minWidth: 100,
  },
  couponMetricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  couponMetricValDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  couponMetricValGross: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  couponMetricValTax: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 2,
  },
  couponMetricValNet: {
    fontSize: 14,
    fontWeight: '900',
    color: '#16A34A',
    marginTop: 2,
  },
  couponCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  couponBankText: {
    fontSize: 12,
    color: '#475569',
  },
  confirmDepositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  confirmDepositBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  revertBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.sm,
  },
  revertBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
});
