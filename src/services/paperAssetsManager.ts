import { TransactionManager, notifyBalanceChanged } from './transactionManager';

export interface SanchaypatraAsset {
  id: string;
  type: 'Sanchaypatra';
  name: string;
  institution: string;
  address: string;
  linkedAccountNo: string;
  bankName: string;
  certificateNumber: string;
  amount: number;
  activationDate: string;
  maturityDate: string;
  firstCouponDate?: string;
  nextEncashmentDate?: string;
  profitRateYearly: number;
  sourceTaxPercent: number;
  payoutInterval: 'Monthly' | '3 Months' | 'At Maturity';
  monthlyProfit: number;
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
  monthlyEmi: number;
  depositDayOfMonth: number;
  tenorYears: number;
  openingDate: string;
  maturityDate: string;
  profitRateYearly: number;
  projectedMaturityAmount: number;
  totalDepositedSoFar: number;
  closingDaysRemaining: number;
  installmentsPaid?: number;
}

export type PaperAssetUnion = SanchaypatraAsset | FDRAsset | DPSAsset;

export const PAPER_ASSETS_STORAGE_KEY = 'mh_user_paper_assets';

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

const listeners = new Set<() => void>();

export function calculateDaysLeftToDate(targetDateStr: string): number {
  try {
    if (!targetDateStr) return 365;
    const target = new Date(targetDateStr);
    if (isNaN(target.getTime())) return 365;
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  } catch (e) {
    return 365;
  }
}

export function addMonthsToDateStr(startDateStr: string, monthsToAdd: number): string {
  try {
    const base = startDateStr ? new Date(startDateStr) : new Date();
    const validBase = isNaN(base.getTime()) ? new Date() : base;
    const d = new Date(validBase);
    d.setMonth(d.getMonth() + monthsToAdd);
    return d.toISOString().slice(0, 10);
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

export function calculateDpsMaturityEstimate(
  monthlyEmi: number,
  tenorYears: number,
  annualRatePct: number
): { totalDeposited: number; estimatedProfit: number; maturityValue: number } {
  const n = Math.max(1, Math.round(tenorYears * 12));
  const totalDeposited = monthlyEmi * n;
  // Standard monthly recurring compound approximation: P * n + P * n(n+1)/2 * (r / 12)
  const r = Math.max(0, annualRatePct) / 100;
  const estimatedProfit = Math.round(monthlyEmi * ((n * (n + 1)) / 2) * (r / 12));
  return {
    totalDeposited,
    estimatedProfit,
    maturityValue: totalDeposited + estimatedProfit,
  };
}

export class PaperAssetsManager {
  public static notifyUpdated(): void {
    listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {}
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mh_paper_assets_updated'));
    }
    notifyBalanceChanged();
  }

  public static subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (typeof window !== 'undefined') {
      window.addEventListener('mh_paper_assets_updated', listener);
    }
    return () => {
      listeners.delete(listener);
      if (typeof window !== 'undefined') {
        window.removeEventListener('mh_paper_assets_updated', listener);
      }
    };
  }

  public static getStoredPaperAssets(): PaperAssetUnion[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const isFreshSlate = window.localStorage.getItem('mh_fresh_slate_user') === 'true';
        const raw =
          window.localStorage.getItem(PAPER_ASSETS_STORAGE_KEY) ||
          window.localStorage.getItem('mh_paper_assets');
        let currentList: PaperAssetUnion[] = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(currentList)) currentList = [];

        if (!isFreshSlate) {
          // Ensure owner's authentic 9 Sanchaypatra certificates are preserved unless manually deleted
          const deletedIdsRaw = window.localStorage.getItem('mh_deleted_paper_asset_ids');
          const deletedIds: string[] = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];

          INITIAL_SANCHAYPATRA_PORTFOLIO.forEach((initSp) => {
            if (deletedIds.includes(initSp.id)) return;
            const existsIndex = currentList.findIndex(
              (p) =>
                p.type === 'Sanchaypatra' &&
                (p as SanchaypatraAsset).certificateNumber === initSp.certificateNumber
            );
            if (existsIndex === -1) {
              currentList = [initSp, ...currentList];
            }
          });
        }

        currentList = currentList.map((p) => ({
          ...p,
          closingDaysRemaining: p.maturityDate ? calculateDaysLeftToDate(p.maturityDate) : 365,
        }));

        window.localStorage.setItem(PAPER_ASSETS_STORAGE_KEY, JSON.stringify(currentList));
        window.localStorage.setItem('mh_paper_assets', JSON.stringify(currentList));
        return currentList;
      }
    } catch (e) {}
    return [];
  }

  public static saveStoredPaperAssets(list: PaperAssetUnion[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(PAPER_ASSETS_STORAGE_KEY, JSON.stringify(list));
        window.localStorage.setItem('mh_paper_assets', JSON.stringify(list));
      }
    } catch (e) {}
    this.notifyUpdated();
  }

  public static addOrUpdateAsset(
    asset: PaperAssetUnion,
    options?: { deductFromAccountId?: string; deductionAmount?: number }
  ): PaperAssetUnion[] {
    const current = this.getStoredPaperAssets();
    const existingIdx = current.findIndex((a) => a.id === asset.id);
    let updated: PaperAssetUnion[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = asset;
    } else {
      updated = [asset, ...current];
      // Optional funding deduction when opening a brand new FDR/DPS/Sanchaypatra from a bank account today
      if (options?.deductFromAccountId && (options.deductionAmount || 0) > 0) {
        TransactionManager.recordExpense({
          title: `Opened ${asset.type}: ${
            asset.type === 'Sanchaypatra'
              ? asset.name
              : `${asset.bankName} (${asset.type === 'FDR' ? asset.fdrNumber : asset.dpsNumber})`
          }`,
          amount: options.deductionAmount || 0,
          category: 'Investments & Savings',
          accountId: options.deductFromAccountId,
          date:
            asset.type === 'Sanchaypatra'
              ? asset.activationDate
              : asset.openingDate || new Date().toISOString().slice(0, 10),
          notes: `Funded ${asset.type} investment`,
        });
      }
    }
    this.saveStoredPaperAssets(updated);
    return updated;
  }

  public static deleteAsset(id: string): PaperAssetUnion[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const deletedIdsRaw = window.localStorage.getItem('mh_deleted_paper_asset_ids');
        const deletedIds: string[] = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];
        if (!deletedIds.includes(id)) {
          window.localStorage.setItem(
            'mh_deleted_paper_asset_ids',
            JSON.stringify([...deletedIds, id])
          );
        }
      }
    } catch (e) {}
    const current = this.getStoredPaperAssets();
    const updated = current.filter((a) => a.id !== id);
    this.saveStoredPaperAssets(updated);
    return updated;
  }

  public static recordDpsInstallment(
    dpsId: string,
    deductFromAccountId?: string
  ): { success: boolean; updatedAsset?: DPSAsset } {
    const current = this.getStoredPaperAssets();
    const idx = current.findIndex((a) => a.id === dpsId && a.type === 'DPS');
    if (idx === -1) return { success: false };

    const dps = current[idx] as DPSAsset;
    const nextDeposited = (dps.totalDepositedSoFar || 0) + (dps.monthlyEmi || 0);
    const nextCount = (dps.installmentsPaid || Math.round((dps.totalDepositedSoFar || 0) / Math.max(1, dps.monthlyEmi))) + 1;

    const updatedDps: DPSAsset = {
      ...dps,
      totalDepositedSoFar: nextDeposited,
      installmentsPaid: nextCount,
    };

    const updatedList = [...current];
    updatedList[idx] = updatedDps;
    this.saveStoredPaperAssets(updatedList);

    if (deductFromAccountId && dps.monthlyEmi > 0) {
      TransactionManager.recordExpense({
        title: `DPS Installment #${nextCount} (${dps.bankName} ${dps.dpsNumber})`,
        amount: dps.monthlyEmi,
        category: 'Investments & Savings',
        accountId: deductFromAccountId,
        date: new Date().toISOString().slice(0, 10),
        notes: `Monthly DPS deposit credited to ${dps.dpsNumber}`,
      });
    }

    return { success: true, updatedAsset: updatedDps };
  }

  public static encashAssetToBank(
    assetId: string,
    destinationAccountId: string,
    payoutAmount: number
  ): { success: boolean } {
    const current = this.getStoredPaperAssets();
    const target = current.find((a) => a.id === assetId);
    if (!target) return { success: false };

    if (destinationAccountId && payoutAmount > 0) {
      TransactionManager.recordIncome({
        title: `Matured / Encashed ${target.type}: ${
          target.type === 'Sanchaypatra'
            ? target.certificateNumber
            : target.type === 'FDR'
            ? `${target.bankName} #${target.fdrNumber}`
            : `${target.bankName} #${target.dpsNumber}`
        }`,
        amount: payoutAmount,
        category: 'Investment Maturity',
        accountId: destinationAccountId,
        date: new Date().toISOString().slice(0, 10),
        notes: `${target.type} principal & profit encashed to bank account`,
      });
    }

    this.deleteAsset(assetId);
    return { success: true };
  }

  public static getSummary() {
    const list = this.getStoredPaperAssets();
    let sanchaypatraTotal = 0;
    let fdrTotal = 0;
    let dpsTotal = 0;
    let monthlyNetYield = 0;
    let annualTaxWithheld = 0;
    let sanchaypatraCount = 0;
    let fdrCount = 0;
    let dpsCount = 0;

    list.forEach((a) => {
      if (a.type === 'Sanchaypatra') {
        sanchaypatraTotal += a.amount || 0;
        monthlyNetYield += a.monthlyProfit || 0;
        annualTaxWithheld += a.totalTaxDeductedAnnual || 0;
        sanchaypatraCount += 1;
      } else if (a.type === 'FDR') {
        fdrTotal += a.amount || 0;
        monthlyNetYield += a.monthlyReturn || 0;
        annualTaxWithheld += a.sourceTaxAnnual || 0;
        fdrCount += 1;
      } else if (a.type === 'DPS') {
        dpsTotal += a.totalDepositedSoFar || 0;
        dpsCount += 1;
      }
    });

    const totalCapital = sanchaypatraTotal + fdrTotal + dpsTotal;
    return {
      totalCapital,
      sanchaypatraTotal,
      fdrTotal,
      dpsTotal,
      monthlyNetYield: Math.round(monthlyNetYield),
      annualTaxWithheld: Math.round(annualTaxWithheld),
      sanchaypatraCount,
      fdrCount,
      dpsCount,
      totalCount: list.length,
    };
  }
}
