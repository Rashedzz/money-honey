import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import { getStoredBankAccounts, BankAccountItem } from '../../../app/(tabs)/accounts';
import {
  SanchaypatraEarningsService,
  SanchaypatraCouponScheduleItem,
  SANCHAYPATRA_MASTER_PORTFOLIO,
} from '../../services/sanchaypatraEarningsService';
import {
  PaperAssetsManager,
  SanchaypatraAsset,
  FDRAsset,
  DPSAsset,
  PaperAssetUnion,
  INITIAL_SANCHAYPATRA_PORTFOLIO,
  addMonthsToDateStr,
  calculateDaysLeftToDate,
  calculateDpsMaturityEstimate,
} from '../../services/paperAssetsManager';
import { showAppAlert, showToast } from '../shared/GlobalDialogHost';
import { CASH_IN_HAND_ID } from '../../services/transactionManager';

export type { SanchaypatraAsset, FDRAsset, DPSAsset, PaperAssetUnion };
export { INITIAL_SANCHAYPATRA_PORTFOLIO };

const POPULAR_BANKS = [
  'Sonali Bank PLC',
  'BRAC Bank PLC',
  'The City Bank',
  'Eastern Bank (EBL)',
  'Dutch-Bangla Bank',
  'Islami Bank BD',
  'Prime Bank',
  'IDLC Finance',
];

export const PaperAssetsScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;

  const [filter, setFilter] = useState<'ALL' | 'FDR' | 'DPS' | 'SANCHAYPATRA'>('ALL');
  const [paperAssets, setPaperAssets] = useState<PaperAssetUnion[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [assetFormType, setAssetFormType] = useState<'FDR' | 'DPS' | 'Sanchaypatra'>('FDR');
  const [formError, setFormError] = useState('');

  // Form Fields
  const [pName, setPName] = useState('');
  const [pBankName, setPBankName] = useState('Sonali Bank PLC');
  const [pAddress, setPAddress] = useState('');
  const [pLinkedAccId, setPLinkedAccId] = useState('');
  const [pLinkedAccNo, setPLinkedAccNo] = useState('');
  const [pCertNo, setPCertNo] = useState('');
  const [pAmount, setPAmount] = useState('');
  const [pActivationDate, setPActivationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pTenorMonths, setPTenorMonths] = useState('12');
  const [pMaturityDate, setPMaturityDate] = useState(() =>
    addMonthsToDateStr(new Date().toISOString().slice(0, 10), 12)
  );
  const [pProfitRate, setPProfitRate] = useState('9.5');
  const [pSourceTax, setPSourceTax] = useState('10');
  const [pInterval, setPInterval] = useState<'Monthly' | '3 Months' | 'At Maturity'>('At Maturity');
  const [pDeductNow, setPDeductNow] = useState(false);

  // DPS Specific Fields
  const [pEmi, setPEmi] = useState('');
  const [pDepositDay, setPDepositDay] = useState('10');
  const [pAlreadyDeposited, setPAlreadyDeposited] = useState('');

  // Tax & Schedule Modals
  const [showTaxReport, setShowTaxReport] = useState(false);
  const [showEarningsSchedule, setShowEarningsSchedule] = useState(false);
  const [selectedScheduleCert, setSelectedScheduleCert] = useState<string | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED'>('ALL');
  const [scheduleItems, setScheduleItems] = useState<SanchaypatraCouponScheduleItem[]>(() =>
    SanchaypatraEarningsService.getAllScheduleItems()
  );
  const [isSchedulingAlerts, setIsSchedulingAlerts] = useState(false);

  const reloadAll = () => {
    setPaperAssets(PaperAssetsManager.getStoredPaperAssets());
    const banks = getStoredBankAccounts();
    setBankAccounts(banks);
    setScheduleItems(SanchaypatraEarningsService.getAllScheduleItems());
  };

  useEffect(() => {
    reloadAll();
    const unsub = PaperAssetsManager.subscribe(() => {
      setPaperAssets(PaperAssetsManager.getStoredPaperAssets());
      setBankAccounts(getStoredBankAccounts());
    });
    return () => unsub();
  }, []);

  const openAddModal = (type: 'FDR' | 'DPS' | 'Sanchaypatra') => {
    setEditingAssetId(null);
    setAssetFormType(type);
    setFormError('');
    setPCertNo('');
    setPAmount('');
    setPEmi('');
    setPAlreadyDeposited('');
    setPDeductNow(false);

    const today = new Date().toISOString().slice(0, 10);
    setPActivationDate(today);

    const banks = getStoredBankAccounts();
    setBankAccounts(banks);
    const defaultBank =
      banks.find((b) => b.accountType !== 'Physical Cash' && b.id !== CASH_IN_HAND_ID) || banks[0];
    if (defaultBank) {
      setPLinkedAccId(defaultBank.id);
      setPLinkedAccNo(defaultBank.accountNumber || '');
      if (defaultBank.accountType !== 'Physical Cash') {
        setPBankName(defaultBank.bankName);
        setPAddress(defaultBank.branch || defaultBank.address || '');
      }
    }

    if (type === 'FDR') {
      setPProfitRate('9.5');
      setPSourceTax('10');
      setPTenorMonths('12');
      setPInterval('At Maturity');
      setPMaturityDate(addMonthsToDateStr(today, 12));
    } else if (type === 'DPS') {
      setPProfitRate('9.0');
      setPSourceTax('5');
      setPTenorMonths('60');
      setPMaturityDate(addMonthsToDateStr(today, 60));
    } else {
      setPName('3-Month Profit Based Sanchaypatra');
      setPProfitRate('11.77');
      setPSourceTax('10');
      setPTenorMonths('36');
      setPInterval('3 Months');
      setPMaturityDate(addMonthsToDateStr(today, 36));
    }

    setModalOpen(true);
  };

  const openEditModal = (asset: PaperAssetUnion) => {
    setEditingAssetId(asset.id);
    setAssetFormType(asset.type);
    setFormError('');
    setPDeductNow(false);

    const matchedBank = bankAccounts.find(
      (b) => b.accountNumber === asset.linkedAccountNo || b.bankName === asset.bankName
    );
    setPLinkedAccId(matchedBank?.id || '');
    setPLinkedAccNo(asset.linkedAccountNo || '');
    setPBankName(asset.bankName || '');
    setPAddress(asset.address || '');
    setPProfitRate(String(asset.profitRateYearly || 0));
    setPMaturityDate(asset.maturityDate || '');

    if (asset.type === 'Sanchaypatra') {
      setPName(asset.name);
      setPCertNo(asset.certificateNumber);
      setPAmount(String(asset.amount));
      setPActivationDate(asset.activationDate);
      setPSourceTax(String(asset.sourceTaxPercent));
      setPInterval(asset.payoutInterval);
      setPTenorMonths('36');
    } else if (asset.type === 'FDR') {
      setPCertNo(asset.fdrNumber);
      setPAmount(String(asset.amount));
      setPActivationDate(asset.openingDate);
      setPTenorMonths(String(asset.tenorMonths || 12));
      setPSourceTax(String(asset.sourceTaxPercent));
      setPInterval(asset.payoutInterval);
    } else {
      setPCertNo(asset.dpsNumber);
      setPEmi(String(asset.monthlyEmi));
      setPDepositDay(String(asset.depositDayOfMonth || 10));
      setPAlreadyDeposited(String(asset.totalDepositedSoFar || 0));
      setPActivationDate(asset.openingDate);
      setPTenorMonths(String(Math.round((asset.tenorYears || 5) * 12)));
    }

    setModalOpen(true);
  };

  const handleSelectLinkedBank = (b: BankAccountItem) => {
    setPLinkedAccId(b.id);
    setPLinkedAccNo(b.accountNumber || b.id);
    if (b.accountType !== 'Physical Cash' && b.id !== CASH_IN_HAND_ID) {
      setPBankName(b.bankName);
      setPAddress(b.branch || b.address || '');
    }
  };

  const handleSelectTenor = (months: number) => {
    setPTenorMonths(String(months));
    const start = pActivationDate || new Date().toISOString().slice(0, 10);
    setPMaturityDate(addMonthsToDateStr(start, months));
  };

  const handleSaveAsset = () => {
    setFormError('');
    const isDps = assetFormType === 'DPS';
    const rawNum = isDps ? pEmi : pAmount;
    const numericVal = parseFloat(rawNum.replace(/,/g, '')) || 0;

    if (numericVal <= 0) {
      setFormError(
        isDps
          ? 'Please enter the Monthly Installment (৳) amount.'
          : 'Please enter the Investment / Deposit Amount (৳).'
      );
      return;
    }

    const rate = parseFloat(pProfitRate) || 0;
    const taxPct = parseFloat(pSourceTax) || 0;
    const months = Math.max(1, parseInt(pTenorMonths, 10) || 12);
    const startDate = pActivationDate || new Date().toISOString().slice(0, 10);
    const matDate = pMaturityDate || addMonthsToDateStr(startDate, months);
    const bankLabel = pBankName.trim() || 'Commercial Bank';
    const branchLabel = pAddress.trim() || 'Main Branch';
    const linkedNo = pLinkedAccNo || 'N/A';

    const intervalsPerYear =
      pInterval === 'Monthly' ? 12 : pInterval === '3 Months' ? 4 : 1;
    const grossInterval = (numericVal * (rate / 100)) / intervalsPerYear;
    const taxInterval = grossInterval * (taxPct / 100);
    const netInterval = grossInterval - taxInterval;
    const monthlyNet = Math.round((netInterval * intervalsPerYear) / 12);
    const annualTax = Math.round(taxInterval * intervalsPerYear);

    let savedObj: PaperAssetUnion;

    if (assetFormType === 'FDR') {
      savedObj = {
        id: editingAssetId || `FDR-${Date.now()}`,
        type: 'FDR',
        bankName: bankLabel,
        address: branchLabel,
        accountNumber: linkedNo,
        linkedAccountNo: linkedNo,
        fdrNumber: pCertNo.trim() || `FDR-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: numericVal,
        openingDate: startDate,
        tenorMonths: months,
        maturityDate: matDate,
        profitRateYearly: rate,
        sourceTaxPercent: taxPct,
        payoutInterval: pInterval,
        monthlyReturn: monthlyNet,
        sourceTaxAnnual: annualTax,
        closingDaysRemaining: calculateDaysLeftToDate(matDate),
      };
    } else if (assetFormType === 'DPS') {
      const tenorYears = Math.max(1, Math.round((months / 12) * 10) / 10);
      const est = calculateDpsMaturityEstimate(numericVal, tenorYears, rate);
      const deposited =
        pAlreadyDeposited.trim() !== ''
          ? parseFloat(pAlreadyDeposited.replace(/,/g, '')) || 0
          : numericVal;

      savedObj = {
        id: editingAssetId || `DPS-${Date.now()}`,
        type: 'DPS',
        bankName: bankLabel,
        address: branchLabel,
        linkedAccountNo: linkedNo,
        dpsNumber: pCertNo.trim() || `DPS-${Math.floor(100000 + Math.random() * 900000)}`,
        monthlyEmi: numericVal,
        depositDayOfMonth: parseInt(pDepositDay, 10) || 10,
        tenorYears,
        openingDate: startDate,
        maturityDate: matDate,
        profitRateYearly: rate,
        projectedMaturityAmount: est.maturityValue,
        totalDepositedSoFar: deposited,
        closingDaysRemaining: calculateDaysLeftToDate(matDate),
        installmentsPaid: Math.max(1, Math.round(deposited / numericVal)),
      };
    } else {
      savedObj = {
        id: editingAssetId || `SC-${Date.now()}`,
        type: 'Sanchaypatra',
        name: pName.trim() || '3-Month Profit Based Sanchaypatra',
        institution: bankLabel,
        address: branchLabel,
        linkedAccountNo: linkedNo,
        bankName: bankLabel,
        certificateNumber: pCertNo.trim() || `SP-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: numericVal,
        activationDate: startDate,
        maturityDate: matDate,
        profitRateYearly: rate,
        sourceTaxPercent: taxPct,
        payoutInterval: pInterval,
        monthlyProfit: monthlyNet,
        grossProfitPerInterval: Math.round(grossInterval),
        netProfitPerInterval: Math.round(netInterval),
        sourceTaxDeductedPerInterval: Math.round(taxInterval),
        totalTaxDeductedAnnual: annualTax,
        closingDaysRemaining: calculateDaysLeftToDate(matDate),
      };
    }

    PaperAssetsManager.addOrUpdateAsset(savedObj, {
      deductFromAccountId: !editingAssetId && pDeductNow ? pLinkedAccId : undefined,
      deductionAmount: !editingAssetId && pDeductNow ? numericVal : 0,
    });

    showToast(
      editingAssetId
        ? `${assetFormType} updated successfully`
        : `${assetFormType} added to your Savings Vault`
    );
    setModalOpen(false);
    reloadAll();
  };

  const handleDeleteAsset = (asset: PaperAssetUnion) => {
    const label =
      asset.type === 'Sanchaypatra'
        ? `${asset.name} (#${asset.certificateNumber})`
        : `${asset.bankName} ${asset.type} (#${asset.type === 'FDR' ? asset.fdrNumber : asset.dpsNumber})`;

    showAppAlert('Remove Savings Record?', `Are you sure you want to remove "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          PaperAssetsManager.deleteAsset(asset.id);
          showToast('Savings record removed');
          reloadAll();
        },
      },
    ]);
  };

  const handlePayDpsInstallment = (dps: DPSAsset) => {
    const matchedBank = bankAccounts.find(
      (b) => b.accountNumber === dps.linkedAccountNo || b.bankName === dps.bankName
    );
    showAppAlert(
      'Pay Monthly DPS Installment',
      `Add ৳${dps.monthlyEmi.toLocaleString('en-IN')} installment to ${dps.bankName} (${dps.dpsNumber})?\n\n${
        matchedBank
          ? `Linked Account: ${matchedBank.bankName} (Balance: ৳${matchedBank.currentBalance.toLocaleString('en-IN')})`
          : 'Will update your DPS total deposited balance.'
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update DPS Only',
          onPress: () => {
            PaperAssetsManager.recordDpsInstallment(dps.id);
            showToast(`Added +৳${dps.monthlyEmi.toLocaleString('en-IN')} to DPS`);
            reloadAll();
          },
        },
        ...(matchedBank
          ? [
              {
                text: `Deduct from ${matchedBank.bankName}`,
                onPress: () => {
                  PaperAssetsManager.recordDpsInstallment(dps.id, matchedBank.id);
                  showToast(
                    `DPS paid & deducted from ${matchedBank.bankName}`
                  );
                  reloadAll();
                },
              },
            ]
          : []),
      ]
    );
  };

  const handleEncashAsset = (asset: FDRAsset | DPSAsset) => {
    const payout =
      asset.type === 'FDR'
        ? Math.round(asset.amount + (asset.monthlyReturn || 0) * (asset.tenorMonths || 12))
        : Math.round(asset.projectedMaturityAmount || asset.totalDepositedSoFar);

    const targetBank =
      bankAccounts.find(
        (b) => b.accountNumber === asset.linkedAccountNo || b.bankName === asset.bankName
      ) || bankAccounts[0];

    if (!targetBank) {
      showAppAlert('Add a Bank Account First', 'Please add a Bank Account before encashing.');
      return;
    }

    showAppAlert(
      `Encash / Mature ${asset.type}`,
      `Deposit maturity value of ৳${payout.toLocaleString('en-IN')} into ${targetBank.bankName} and close this ${asset.type} record?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Credit ৳${payout.toLocaleString('en-IN')} to Bank`,
          onPress: () => {
            PaperAssetsManager.encashAssetToBank(asset.id, targetBank.id, payout);
            showToast(`Credited ৳${payout.toLocaleString('en-IN')} to ${targetBank.bankName}`);
            reloadAll();
          },
        },
      ]
    );
  };

  const handleConfirmDeposit = (coupon: SanchaypatraCouponScheduleItem) => {
    showAppAlert(
      'Confirm Sanchaypatra Profit Deposit',
      `Certificate #${coupon.certificateNumber} (Q${coupon.quarterNumber}/12)\nDue Date: ${coupon.couponDate}\nGross Profit: ৳${coupon.grossAmount.toLocaleString('en-IN')}\n10% Source Tax: -৳${coupon.taxDeducted.toLocaleString('en-IN')}\nNet Credit: ৳${coupon.netAmount.toLocaleString('en-IN')}\n\nDeposit net profit to ${coupon.linkedBankName} (${coupon.linkedAccountNo}) now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Deposit',
          onPress: () => {
            const res = SanchaypatraEarningsService.confirmAndDepositToSonaliBank(coupon.id);
            if (res.success) {
              reloadAll();
              showToast(`Deposited ৳${coupon.netAmount.toLocaleString('en-IN')} to Sonali Bank`);
            } else {
              showAppAlert('Deposit Notice', res.message);
            }
          },
        },
      ]
    );
  };

  const handleUnconfirmDeposit = (coupon: SanchaypatraCouponScheduleItem) => {
    showAppAlert('Revert Deposit?', 'Mark this profit installment as Pending again?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Revert',
        style: 'destructive',
        onPress: () => {
          const res = SanchaypatraEarningsService.unconfirmCoupon(coupon.id);
          if (res.success) {
            reloadAll();
            showToast('Installment reverted to Pending');
          }
        },
      },
    ]);
  };

  const handleScheduleNotifications = async () => {
    setIsSchedulingAlerts(true);
    try {
      const count = await SanchaypatraEarningsService.scheduleUpcomingAlerts();
      showToast(`Scheduled reminders for ${count > 0 ? count : 'all'} profit dates`);
    } catch (e) {
      showToast('Profit reminders active');
    } finally {
      setIsSchedulingAlerts(false);
    }
  };

  // Filtered Assets
  const filteredAssets = paperAssets.filter((a) => {
    if (filter === 'SANCHAYPATRA') return a.type === 'Sanchaypatra';
    if (filter === 'FDR') return a.type === 'FDR';
    if (filter === 'DPS') return a.type === 'DPS';
    return true;
  });

  // Summaries
  const sanchaypatras = paperAssets.filter((a): a is SanchaypatraAsset => a.type === 'Sanchaypatra');
  const fdrs = paperAssets.filter((a): a is FDRAsset => a.type === 'FDR');
  const dpsList = paperAssets.filter((a): a is DPSAsset => a.type === 'DPS');

  const totalSpCapital = sanchaypatras.reduce((s, a) => s + (a.amount || 0), 0);
  const totalFdrCapital = fdrs.reduce((s, a) => s + (a.amount || 0), 0);
  const totalDpsDeposited = dpsList.reduce((s, a) => s + (a.totalDepositedSoFar || 0), 0);
  const totalPaperCapital = totalSpCapital + totalFdrCapital + totalDpsDeposited;

  const totalMonthlyNetYield =
    sanchaypatras.reduce((s, a) => s + (a.monthlyProfit || 0), 0) +
    fdrs.reduce((s, a) => s + (a.monthlyReturn || 0), 0);

  const totalSourceTaxWithheld =
    sanchaypatras.reduce((s, a) => s + (a.totalTaxDeductedAnnual || 0), 0) +
    fdrs.reduce((s, a) => s + (a.sourceTaxAnnual || 0), 0);

  const rowStyle = isMobile ? styles.oneCol : styles.twoCol;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 12, paddingBottom: 110 }]}>
      {/* 1. Executive Savings Header + 1-Tap Quick Add Buttons */}
      <GlassCard style={styles.summaryCard} padding={isMobile ? 16 : 20}>
        <View style={styles.summaryTop}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text style={styles.summaryLabel}>SAVINGS VAULT • FDR, DPS & SANCHAYPATRA</Text>
            <Text style={styles.summaryAmount}>
              ৳ {totalPaperCapital.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.summarySub}>
              Passive Net Profit: +৳ {Math.round(totalMonthlyNetYield).toLocaleString('en-IN')}/month • Annual Tax Deducted: ৳ {Math.round(totalSourceTaxWithheld).toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Direct 1-Tap Mobile & Desktop Add Buttons */}
          <View style={styles.quickAddRow}>
            <TouchableOpacity
              style={styles.primaryAddBtn}
              onPress={() => openAddModal('FDR')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={16} color="#FFFFFF" />
              <Text style={styles.primaryAddBtnText}>+ Add FDR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryAddBtn}
              onPress={() => openAddModal('DPS')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={16} color="#FFFFFF" />
              <Text style={styles.primaryAddBtnText}>+ Add DPS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => openAddModal('Sanchaypatra')}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color="#0F172A" />
              <Text style={styles.secondaryActionBtnText}>+ Sanchaypatra</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4-Pillar Plain-English Breakdown */}
        <View style={styles.vaultEarningsSnapshot}>
          <View style={styles.snapshotCol}>
            <Text style={styles.snapshotLabel}>BANK FDR DEPOSITS ({fdrs.length})</Text>
            <Text style={styles.snapshotVal}>৳ {totalFdrCapital.toLocaleString('en-IN')}</Text>
            <Text style={styles.snapshotSub}>Fixed lump-sum deposits</Text>
          </View>
          <View style={styles.snapshotCol}>
            <Text style={styles.snapshotLabel}>MONTHLY DPS SAVED ({dpsList.length})</Text>
            <Text style={styles.snapshotVal}>৳ {totalDpsDeposited.toLocaleString('en-IN')}</Text>
            <Text style={styles.snapshotSub}>Recurring monthly savings</Text>
          </View>
          <View style={styles.snapshotCol}>
            <Text style={styles.snapshotLabel}>SANCHAYPATRA ({sanchaypatras.length})</Text>
            <Text style={styles.snapshotVal}>৳ {totalSpCapital.toLocaleString('en-IN')}</Text>
            <Text style={styles.snapshotSub}>Govt savings certificates</Text>
          </View>
          <View style={styles.snapshotCol}>
            <Text style={styles.snapshotLabel}>NET PROFIT / YEAR</Text>
            <Text style={[styles.snapshotVal, { color: '#16A34A' }]}>
              +৳ {Math.round(totalMonthlyNetYield * 12).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.snapshotSub}>After source tax (AIT)</Text>
          </View>
        </View>

        {/* Utility Buttons Row */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {sanchaypatras.length > 0 && (
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => {
                setSelectedScheduleCert(null);
                reloadAll();
                setShowEarningsSchedule(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar-outline" size={15} color="#0F172A" />
              <Text style={styles.secondaryActionBtnText}>
                Sanchaypatra Profit Schedule (108 Installments)
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => setShowTaxReport(!showTaxReport)}
            activeOpacity={0.85}
          >
            <Ionicons name="document-text-outline" size={15} color="#0F172A" />
            <Text style={styles.secondaryActionBtnText}>
              {showTaxReport ? 'Hide Tax Certificate Summary' : 'NBR Source Tax Summary'}
            </Text>
          </TouchableOpacity>
        </View>

        {showTaxReport && (
          <View style={styles.taxReportBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#16A34A" />
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A' }}>
                  ANNUAL SOURCE TAX (AIT) DEDUCTED AT SOURCE
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (typeof window !== 'undefined' && window.print) window.print();
                  else showToast('Tax summary ready');
                }}
                style={styles.printBtn}
              >
                <Ionicons name="print-outline" size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Print Summary</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
              Total Advance Income Tax (AIT) withheld on your Sanchaypatra & Bank FDR profits (claimable in annual NBR tax return):
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A', marginTop: 4 }}>
              ৳ {Math.round(totalSourceTaxWithheld).toLocaleString('en-IN')} / Year
            </Text>
          </View>
        )}
      </GlassCard>

      {/* 2. Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterRow}>
          {[
            { id: 'ALL', label: `All Savings (${paperAssets.length})` },
            { id: 'FDR', label: `Bank FDR (${fdrs.length})` },
            { id: 'DPS', label: `Monthly DPS (${dpsList.length})` },
            { id: 'SANCHAYPATRA', label: `Sanchaypatra (${sanchaypatras.length})` },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.id}
              style={[styles.filterBtn, filter === btn.id && styles.filterBtnActive]}
              onPress={() => setFilter(btn.id as any)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterBtnText, filter === btn.id && styles.filterBtnTextActive]}>
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 3. Holdings Cards */}
      {filteredAssets.length === 0 ? (
        <GlassCard style={{ alignItems: 'center' }} padding={32}>
          <Ionicons name="wallet-outline" size={42} color="#64748B" />
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', marginTop: 10 }}>
            No {filter === 'ALL' ? 'Savings' : filter} Records Yet
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4, maxWidth: 420 }}>
            Tap one of the buttons below to record a Bank Fixed Deposit (FDR), Monthly Savings Scheme (DPS), or Sanchaypatra from your phone or laptop.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16 }}>
            <TouchableOpacity style={styles.primaryAddBtn} onPress={() => openAddModal('FDR')}>
              <Text style={styles.primaryAddBtnText}>+ Add Bank FDR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryAddBtn} onPress={() => openAddModal('DPS')}>
              <Text style={styles.primaryAddBtnText}>+ Add Monthly DPS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => openAddModal('Sanchaypatra')}>
              <Text style={styles.secondaryActionBtnText}>+ Add Sanchaypatra</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      ) : (
        <View style={styles.assetList}>
          {filteredAssets.map((asset) => {
            const isDps = asset.type === 'DPS';
            const isFdr = asset.type === 'FDR';
            const dpsTargetTotal = isDps
              ? Math.max(1, asset.monthlyEmi * (asset.tenorYears || 5) * 12)
              : 1;
            const dpsProgressPct = isDps
              ? Math.min(100, Math.round(((asset.totalDepositedSoFar || 0) / dpsTargetTotal) * 100))
              : 0;

            return (
              <GlassCard key={asset.id} style={styles.assetCard} padding={isMobile ? 15 : 18}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{asset.type}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assetTitle}>
                        {asset.type === 'Sanchaypatra'
                          ? asset.name
                          : `${asset.bankName} — ${asset.type === 'FDR' ? 'Fixed Deposit (FDR)' : 'Monthly DPS'}`}
                      </Text>
                      <Text style={styles.assetSub}>
                        {asset.type === 'Sanchaypatra'
                          ? `Cert #${asset.certificateNumber} • ${asset.institution}`
                          : `A/C #${asset.type === 'FDR' ? asset.fdrNumber : asset.dpsNumber} • ${asset.bankName}`}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => openEditModal(asset)}
                      style={styles.iconBtn}
                    >
                      <Ionicons name="create-outline" size={16} color="#334155" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteAsset(asset)}
                      style={[styles.iconBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Metrics Row */}
                <View style={styles.metricGrid}>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricLabel}>
                      {isDps ? 'DEPOSITED SO FAR' : 'PRINCIPAL INVESTED'}
                    </Text>
                    <Text style={styles.metricVal}>
                      ৳ {(isDps ? asset.totalDepositedSoFar : asset.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.metricCol}>
                    <Text style={styles.metricLabel}>INTEREST / PROFIT RATE</Text>
                    <Text style={[styles.metricVal, { color: '#16A34A' }]}>
                      {asset.profitRateYearly}% / Year
                    </Text>
                  </View>

                  <View style={styles.metricCol}>
                    <Text style={styles.metricLabel}>
                      {isDps ? 'MONTHLY INSTALLMENT' : 'NET MONTHLY PROFIT'}
                    </Text>
                    <Text style={styles.metricVal}>
                      {isDps
                        ? `৳ ${asset.monthlyEmi.toLocaleString('en-IN')} (Day ${asset.depositDayOfMonth})`
                        : `+৳ ${Math.round(
                            asset.type === 'Sanchaypatra' ? asset.monthlyProfit : asset.monthlyReturn
                          ).toLocaleString('en-IN')}`}
                    </Text>
                  </View>

                  <View style={styles.metricCol}>
                    <Text style={styles.metricLabel}>MATURITY DATE</Text>
                    <Text style={styles.metricVal}>
                      {asset.maturityDate} ({asset.closingDaysRemaining}d left)
                    </Text>
                  </View>
                </View>

                {/* DPS Interactive Progress & 1-Tap Monthly Installment */}
                {isDps && (
                  <View style={styles.dpsActionBox}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>
                        Completion: {dpsProgressPct}% (Target Principal: ৳{dpsTargetTotal.toLocaleString('en-IN')})
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#16A34A' }}>
                        Est. Maturity: ৳{Math.round(asset.projectedMaturityAmount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${dpsProgressPct}%` }]} />
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      <TouchableOpacity
                        style={styles.smallPrimaryBtn}
                        onPress={() => handlePayDpsInstallment(asset)}
                      >
                        <Ionicons name="add-circle-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.smallPrimaryBtnText}>
                          Pay Monthly Installment (৳{asset.monthlyEmi.toLocaleString('en-IN')})
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.smallOutlineBtn}
                        onPress={() => handleEncashAsset(asset)}
                      >
                        <Ionicons name="cash-outline" size={14} color="#334155" />
                        <Text style={styles.smallOutlineBtnText}>Mature / Encash to Bank</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* FDR Action Bar */}
                {isFdr && (
                  <View style={styles.dpsActionBox}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>
                        Payout: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{asset.payoutInterval}</Text> • Tax Withheld: {asset.sourceTaxPercent}% (৳{Math.round(asset.sourceTaxAnnual).toLocaleString('en-IN')}/yr)
                      </Text>
                      <TouchableOpacity
                        style={styles.smallOutlineBtn}
                        onPress={() => handleEncashAsset(asset)}
                      >
                        <Ionicons name="cash-outline" size={14} color="#0F172A" />
                        <Text style={styles.smallOutlineBtnText}>Encash / Mature to Bank</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Sanchaypatra Quarterly Profit & Schedule */}
                {asset.type === 'Sanchaypatra' && (() => {
                  const nextCoupon = scheduleItems.find(
                    (c) => c.certificateNumber === asset.certificateNumber && c.status === 'PENDING'
                  );
                  return (
                    <View style={styles.sanchaypatraProfitBreakdown}>
                      {nextCoupon && (
                        <View style={styles.nextCouponBanner}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons
                              name={nextCoupon.daysRemaining <= 0 ? 'alert-circle' : 'calendar-outline'}
                              size={16}
                              color={nextCoupon.daysRemaining <= 0 ? '#DC2626' : '#16A34A'}
                            />
                            <View>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                                NEXT QUARTERLY PROFIT PAYOUT
                              </Text>
                              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                                {nextCoupon.couponDate} (Q{nextCoupon.quarterNumber}/12) • +৳{nextCoupon.netAmount.toLocaleString('en-IN')}
                              </Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            onPress={() => handleConfirmDeposit(nextCoupon)}
                            style={styles.smallPrimaryBtn}
                          >
                            <Ionicons name="checkmark-circle-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.smallPrimaryBtnText}>Deposit to Bank</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      <View style={styles.breakdownPillGrid}>
                        <View style={styles.breakdownPillItem}>
                          <Text style={styles.breakdownPillLabel}>3-Mo Gross</Text>
                          <Text style={styles.breakdownPillValGross}>
                            ৳ {(asset.grossProfitPerInterval || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.breakdownPillItem}>
                          <Text style={styles.breakdownPillLabel}>{asset.sourceTaxPercent}% Source Tax</Text>
                          <Text style={styles.breakdownPillValTax}>
                            -৳ {(asset.sourceTaxDeductedPerInterval || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={[styles.breakdownPillItem, styles.breakdownPillItemHighlight]}>
                          <Text style={styles.breakdownPillLabelNet}>3-Mo Net Received</Text>
                          <Text style={styles.breakdownPillValNet}>
                            +৳ {(asset.netProfitPerInterval || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.breakdownFooterRow}>
                        <Text style={styles.breakdownFooterText}>
                          Annual Net Profit: ৳{Math.round((asset.netProfitPerInterval || 0) * 4).toLocaleString('en-IN')}
                        </Text>
                        <TouchableOpacity
                          style={styles.smallOutlineBtn}
                          onPress={() => {
                            setSelectedScheduleCert(asset.certificateNumber);
                            reloadAll();
                            setShowEarningsSchedule(true);
                          }}
                        >
                          <Ionicons name="calendar-outline" size={13} color="#0F172A" />
                          <Text style={styles.smallOutlineBtnText}>12-Quarter Schedule</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}

                <View style={styles.cardFooter}>
                  <Ionicons name="link-outline" size={14} color="#64748B" />
                  <Text style={styles.linkedText}>
                    Linked Bank Account:{' '}
                    <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                      {asset.linkedAccountNo || 'Not Linked'}
                    </Text>{' '}
                    ({asset.address || 'Main Branch'})
                  </Text>
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}

      {/* 4. Mobile & Desktop Friendly Add/Edit FDR, DPS & Sanchaypatra Modal */}
      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={[styles.modalOverlay, isMobile && { padding: 8 }]}>
          <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingAssetId ? `Edit ${assetFormType}` : `Add ${assetFormType} Savings`}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                  Simple setup for mobile & laptop — maturity & net profit calculate automatically
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={19} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Type Switcher */}
            {!editingAssetId && (
              <View style={styles.modalTabs}>
                {(
                  [
                    { id: 'FDR', label: 'Bank FDR' },
                    { id: 'DPS', label: 'Monthly DPS' },
                    { id: 'Sanchaypatra', label: 'Sanchaypatra' },
                  ] as const
                ).map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.modalTab, assetFormType === t.id && styles.modalTabActive]}
                    onPress={() => openAddModal(t.id)}
                  >
                    <Text
                      style={[
                        styles.modalTabText,
                        assetFormType === t.id && styles.modalTabTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {!!formError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorBannerText}>{formError}</Text>
                </View>
              )}

              {assetFormType === 'Sanchaypatra' && (
                <>
                  <Text style={styles.inputLabel}>SANCHAYPATRA SCHEME NAME</Text>
                  <View style={styles.chipRow}>
                    {[
                      '3-Month Profit Based Sanchaypatra',
                      '5-Year Bangladesh Sanchaypatra',
                      'Poribar (Family) Sanchaypatra',
                      'Pensioner Sanchaypatra',
                    ].map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        style={[styles.chip, pName === preset && styles.chipActive]}
                        onPress={() => setPName(preset)}
                      >
                        <Text style={[styles.chipText, pName === preset && styles.chipTextActive]}>
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 3-Month Profit Based Sanchaypatra"
                    placeholderTextColor="#94A3B8"
                    value={pName}
                    onChangeText={setPName}
                  />
                </>
              )}

              {/* Linked Bank Account Pills */}
              <Text style={styles.inputLabel}>LINKED BANK ACCOUNT (SELECT TO AUTO-FILL)</Text>
              <View style={styles.chipRow}>
                {bankAccounts.map((b) => {
                  const selected = pLinkedAccId === b.id || pLinkedAccNo === b.accountNumber;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.chip, selected && styles.chipActive]}
                      onPress={() => handleSelectLinkedBank(b)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                        {b.bankName} (৳{b.currentBalance.toLocaleString('en-IN')})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>POPULAR BANKS (TAP OR TYPE BELOW)</Text>
              <View style={styles.chipRow}>
                {POPULAR_BANKS.map((bank) => (
                  <TouchableOpacity
                    key={bank}
                    style={[styles.chip, pBankName === bank && styles.chipActive]}
                    onPress={() => setPBankName(bank)}
                  >
                    <Text style={[styles.chipText, pBankName === bank && styles.chipTextActive]}>
                      {bank}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={rowStyle}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>BANK / INSTITUTION NAME *</Text>
                  <TextInput
                    style={styles.input}
                    value={pBankName}
                    onChangeText={setPBankName}
                    placeholder="e.g. BRAC Bank PLC"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>
                    {assetFormType === 'FDR'
                      ? 'FDR RECEIPT NO (OPTIONAL)'
                      : assetFormType === 'DPS'
                      ? 'DPS ACCOUNT NO (OPTIONAL)'
                      : 'CERTIFICATE NO (OPTIONAL)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={pCertNo}
                    onChangeText={setPCertNo}
                    placeholder="Auto-generated if left blank"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={rowStyle}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>
                    {assetFormType === 'DPS'
                      ? 'MONTHLY INSTALLMENT (৳) *'
                      : 'DEPOSIT / PRINCIPAL AMOUNT (৳) *'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={assetFormType === 'DPS' ? pEmi : pAmount}
                    onChangeText={assetFormType === 'DPS' ? setPEmi : setPAmount}
                    placeholder={assetFormType === 'DPS' ? 'e.g. 5000' : 'e.g. 500000'}
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>YEARLY INTEREST / PROFIT RATE (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={pProfitRate}
                    onChangeText={setPProfitRate}
                    placeholder="e.g. 9.5"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {assetFormType === 'DPS' ? (
                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>ALREADY DEPOSITED SO FAR (৳)</Text>
                    <TextInput
                      style={styles.input}
                      value={pAlreadyDeposited}
                      onChangeText={setPAlreadyDeposited}
                      placeholder="Leave blank if 1st installment"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>MONTHLY DEPOSIT DAY (1–28)</Text>
                    <TextInput
                      style={styles.input}
                      value={pDepositDay}
                      onChangeText={setPDepositDay}
                      placeholder="e.g. 10"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ) : (
                <View style={rowStyle}>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>SOURCE TAX (AIT %)</Text>
                    <View style={styles.chipRow}>
                      {['0', '5', '10', '15'].map((tx) => (
                        <TouchableOpacity
                          key={tx}
                          style={[styles.chip, pSourceTax === tx && styles.chipActive]}
                          onPress={() => setPSourceTax(tx)}
                        >
                          <Text style={[styles.chipText, pSourceTax === tx && styles.chipTextActive]}>
                            {tx}%
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>PROFIT PAYOUT INTERVAL</Text>
                    <View style={styles.chipRow}>
                      {(['Monthly', '3 Months', 'At Maturity'] as const).map((inter) => (
                        <TouchableOpacity
                          key={inter}
                          style={[styles.chip, pInterval === inter && styles.chipActive]}
                          onPress={() => setPInterval(inter)}
                        >
                          <Text
                            style={[styles.chipText, pInterval === inter && styles.chipTextActive]}
                          >
                            {inter}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* Quick Duration Pills */}
              <Text style={styles.inputLabel}>
                DURATION / TENOR (TAP TO AUTO-FILL MATURITY DATE)
              </Text>
              <View style={styles.chipRow}>
                {[
                  { label: '3 Months', m: 3 },
                  { label: '6 Months', m: 6 },
                  { label: '1 Year', m: 12 },
                  { label: '2 Years', m: 24 },
                  { label: '3 Years', m: 36 },
                  { label: '5 Years', m: 60 },
                  { label: '10 Years', m: 120 },
                ].map((opt) => {
                  const active = parseInt(pTenorMonths, 10) === opt.m;
                  return (
                    <TouchableOpacity
                      key={opt.m}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => handleSelectTenor(opt.m)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={rowStyle}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>OPENING / START DATE</Text>
                  <TextInput
                    style={styles.input}
                    value={pActivationDate}
                    onChangeText={(v) => {
                      setPActivationDate(v);
                      if (v.length === 10) {
                        setPMaturityDate(addMonthsToDateStr(v, parseInt(pTenorMonths, 10) || 12));
                      }
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>MATURITY DATE (AUTO-CALCULATED)</Text>
                  <TextInput
                    style={styles.input}
                    value={pMaturityDate}
                    onChangeText={setPMaturityDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {!editingAssetId && (
                <TouchableOpacity
                  style={[styles.deductToggle, pDeductNow && styles.deductToggleActive]}
                  onPress={() => setPDeductNow(!pDeductNow)}
                >
                  <Ionicons
                    name={pDeductNow ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={pDeductNow ? '#0F172A' : '#64748B'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                      Deduct opening deposit from my selected Bank Account today
                    </Text>
                    <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                      {pDeductNow
                        ? 'Will subtract this amount from your selected Bank Account balance.'
                        : 'Unchecked: Records an existing FDR/DPS without changing your Bank balance.'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Live Calculation Preview */}
              {(() => {
                const val = parseFloat((assetFormType === 'DPS' ? pEmi : pAmount).replace(/,/g, '')) || 0;
                if (val <= 0) return null;
                const r = parseFloat(pProfitRate) || 0;
                const tax = parseFloat(pSourceTax) || 0;
                const m = Math.max(1, parseInt(pTenorMonths, 10) || 12);

                if (assetFormType === 'DPS') {
                  const est = calculateDpsMaturityEstimate(val, m / 12, r);
                  return (
                    <View style={styles.previewBox}>
                      <Text style={styles.previewBoxTitle}>LIVE DPS MATURITY ESTIMATE</Text>
                      <Text style={styles.previewBoxText}>
                        Total Deposited ({m} months): ৳{est.totalDeposited.toLocaleString('en-IN')} • Estimated Profit: +৳{est.estimatedProfit.toLocaleString('en-IN')} • Projected Maturity Value:{' '}
                        <Text style={{ fontWeight: '900', color: '#16A34A' }}>
                          ৳{est.maturityValue.toLocaleString('en-IN')}
                        </Text>
                      </Text>
                    </View>
                  );
                }

                const grossYr = val * (r / 100);
                const netYr = grossYr * (1 - tax / 100);
                const netMo = Math.round(netYr / 12);
                const totalNetTerm = Math.round((netYr * m) / 12);
                return (
                  <View style={styles.previewBox}>
                    <Text style={styles.previewBoxTitle}>LIVE NET PROFIT ESTIMATE</Text>
                    <Text style={styles.previewBoxText}>
                      Net Monthly Profit: <Text style={{ fontWeight: '900', color: '#16A34A' }}>+৳{netMo.toLocaleString('en-IN')}/mo</Text> (after {tax}% tax) • Principal + {m}M Profit:{' '}
                      <Text style={{ fontWeight: '900' }}>৳{(val + totalNetTerm).toLocaleString('en-IN')}</Text>
                    </Text>
                  </View>
                );
              })()}
            </ScrollView>

            {/* Pinned Bottom Save Bar */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleSaveAsset}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.submitModalBtnText}>
                  {editingAssetId ? `Update ${assetFormType}` : `Save ${assetFormType}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. Sanchaypatra 108-Installment Earnings Schedule Modal */}
      <Modal visible={showEarningsSchedule} transparent animationType="slide" onRequestClose={() => setShowEarningsSchedule(false)}>
        <View style={[styles.modalOverlay, isMobile && { padding: 8 }]}>
          <View style={[styles.earningsModalCard, isMobile && styles.modalCardMobile]}>
            <View style={styles.earningsModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.earningsModalTitle}>
                  Sanchaypatra Quarterly Profit & Deposit Schedule
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  3-Month Profit Based Sanchaypatra • Sonali Bank PLC Auto-Deposit Tracker
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEarningsSchedule(false)}
                style={styles.closeModalBtn}
              >
                <Ionicons name="close" size={20} color="#334155" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <TouchableOpacity
                  style={styles.smallPrimaryBtn}
                  onPress={handleScheduleNotifications}
                  disabled={isSchedulingAlerts}
                >
                  <Ionicons name="notifications-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.smallPrimaryBtnText}>
                    {isSchedulingAlerts ? 'Scheduling...' : 'Enable Profit Reminders'}
                  </Text>
                </TouchableOpacity>

                {(
                  [
                    { id: 'ALL', label: 'All (108)' },
                    { id: 'PENDING', label: 'Pending / Upcoming' },
                    { id: 'CONFIRMED', label: 'Deposited' },
                  ] as const
                ).map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.chip, scheduleFilter === f.id && styles.chipActive]}
                    onPress={() => setScheduleFilter(f.id)}
                  >
                    <Text style={[styles.chipText, scheduleFilter === f.id && styles.chipTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={[styles.chip, !selectedScheduleCert && styles.chipActive]}
                    onPress={() => setSelectedScheduleCert(null)}
                  >
                    <Text style={[styles.chipText, !selectedScheduleCert && styles.chipTextActive]}>
                      All 9 Certificates
                    </Text>
                  </TouchableOpacity>
                  {SANCHAYPATRA_MASTER_PORTFOLIO.map((m) => (
                    <TouchableOpacity
                      key={m.certificateNumber}
                      style={[
                        styles.chip,
                        selectedScheduleCert === m.certificateNumber && styles.chipActive,
                      ]}
                      onPress={() => setSelectedScheduleCert(m.certificateNumber)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedScheduleCert === m.certificateNumber && styles.chipTextActive,
                        ]}
                      >
                        #{m.certificateNumber}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {scheduleItems
                .filter((item) => {
                  const matchesCert =
                    !selectedScheduleCert || item.certificateNumber === selectedScheduleCert;
                  if (scheduleFilter === 'PENDING') return matchesCert && item.status === 'PENDING';
                  if (scheduleFilter === 'CONFIRMED')
                    return matchesCert && item.status === 'CONFIRMED_DEPOSITED';
                  return matchesCert;
                })
                .map((coupon) => {
                  const isConfirmed = coupon.status === 'CONFIRMED_DEPOSITED';
                  return (
                    <GlassCard key={coupon.id} style={{ marginBottom: 10 }} padding={14}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                        <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A' }}>
                          Q{coupon.quarterNumber}/12 • Cert #{coupon.certificateNumber} • {coupon.couponDate}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '800',
                            color: isConfirmed ? '#16A34A' : coupon.daysRemaining <= 0 ? '#DC2626' : '#475569',
                          }}
                        >
                          {isConfirmed
                            ? 'Deposited'
                            : coupon.daysRemaining <= 0
                            ? 'Due Now'
                            : `In ${coupon.daysRemaining} days`}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                        <Text style={{ fontSize: 12.5, color: '#475569' }}>
                          Gross: ৳{coupon.grossAmount.toLocaleString('en-IN')} • Tax: -৳{coupon.taxDeducted.toLocaleString('en-IN')} •{' '}
                          <Text style={{ fontWeight: '800', color: '#16A34A' }}>
                            Net: +৳{coupon.netAmount.toLocaleString('en-IN')}
                          </Text>
                        </Text>

                        {isConfirmed ? (
                          <TouchableOpacity
                            style={styles.smallOutlineBtn}
                            onPress={() => handleUnconfirmDeposit(coupon)}
                          >
                            <Text style={styles.smallOutlineBtnText}>Undo</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={styles.smallPrimaryBtn}
                            onPress={() => handleConfirmDeposit(coupon)}
                          >
                            <Text style={styles.smallPrimaryBtnText}>Confirm Deposit</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </GlassCard>
                  );
                })}
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.md,
  },
  summaryCard: {
    marginBottom: 2,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  summaryAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  summarySub: {
    fontSize: 13,
    color: '#475569',
    marginTop: 3,
  },
  quickAddRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  primaryAddBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 13,
    paddingVertical: 9.5,
    borderRadius: Radius.md,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  vaultEarningsSnapshot: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  snapshotCol: {
    flex: 1,
    minWidth: 135,
  },
  snapshotLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  snapshotVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  snapshotSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  taxReportBox: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 14,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterBtn: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  assetList: {
    gap: 12,
  },
  assetCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  assetTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  assetSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 8,
  },
  metricCol: {
    minWidth: 130,
    flex: 1,
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  metricVal: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  dpsActionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 6,
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  smallPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  smallPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  smallOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  smallOutlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  sanchaypatraProfitBreakdown: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nextCouponBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  breakdownPillGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  breakdownPillItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownPillItemHighlight: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  breakdownPillLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  breakdownPillLabelNet: {
    fontSize: 11,
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
    borderTopColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 8,
  },
  breakdownFooterText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 8,
  },
  linkedText: {
    fontSize: 12,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '96%',
    maxWidth: 660,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalCardMobile: {
    width: '100%',
    maxHeight: '95%',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: Radius.lg,
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeModalBtn: {
    padding: 7,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
  },
  modalTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: 10,
  },
  modalTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  modalTabActive: {
    backgroundColor: '#0F172A',
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
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6.5,
    borderRadius: Radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  deductToggle: {
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
  deductToggleActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#0F172A',
  },
  previewBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 12,
  },
  previewBoxTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 3,
  },
  previewBoxText: {
    fontSize: 12.5,
    color: '#14532D',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  submitModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  submitModalBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  earningsModalCard: {
    width: '96%',
    maxWidth: 860,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  earningsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
  },
  earningsModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
});
