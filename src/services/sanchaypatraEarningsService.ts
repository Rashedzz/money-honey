/**
 * Money-Honey Sanchaypatra Earnings & Quarterly Coupon Schedule Service
 * Manages the authentic 9 Sanchaypatra certificates:
 * - Exact Gross Profit, 10% Source Tax, and Net Payment
 * - 12 Quarters / 3-Year Payout Timeline across all certificates
 * - 1-Tap Confirmation & Automated Crediting to Sonali Bank PLC
 * - Notification Reminders for Upcoming Payouts
 */

import { TransactionManager, BANK_STORAGE_KEY } from './transactionManager';
import { scheduleSanchaypatraCouponAlert } from '../notifications/scheduler';

export interface SanchaypatraMasterRecord {
  certificateNumber: string;
  schemeName: string;
  ownership: string;
  issueDate: string;          // YYYY-MM-DD
  maturityDate: string;       // YYYY-MM-DD
  principalAmount: number;    // ৳
  firstCouponDate: string;    // YYYY-MM-DD
  quarterlyGross: number;     // ৳ Gross Profit
  quarterlyTax: number;       // ৳ 10% Source Tax
  quarterlyNet: number;       // ৳ Net Payment
  linkedBankName: string;
  linkedAccountNo: string;
}

export interface SanchaypatraCouponScheduleItem {
  id: string;
  certificateNumber: string;
  schemeName: string;
  principalAmount: number;
  quarterNumber: number;      // 1 to 12
  couponDate: string;         // YYYY-MM-DD
  grossAmount: number;
  taxDeducted: number;
  netAmount: number;
  linkedBankName: string;
  linkedAccountNo: string;
  status: 'PENDING' | 'CONFIRMED_DEPOSITED';
  confirmedAt?: string;
  transactionId?: string;
  daysRemaining: number;
  isPastDue: boolean;
  isRead?: boolean;
}

export const SANCHAYPATRA_MASTER_PORTFOLIO: SanchaypatraMasterRecord[] = [
  {
    certificateNumber: '2025-0134852',
    schemeName: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র',
    ownership: 'একক',
    issueDate: '2025-02-12',
    maturityDate: '2028-02-12',
    principalAmount: 500000,
    firstCouponDate: '2025-05-12',
    quarterlyGross: 15312.50,
    quarterlyTax: 1531.25,
    quarterlyNet: 13781.25,
    linkedBankName: 'Sonali Bank PLC',
    linkedAccountNo: 'SONALI-0102030405',
  },
  {
    certificateNumber: '2025-0229715',
    schemeName: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র',
    ownership: 'একক',
    issueDate: '2025-03-10',
    maturityDate: '2028-03-10',
    principalAmount: 100000,
    firstCouponDate: '2025-06-15',
    quarterlyGross: 3062.50,
    quarterlyTax: 306.25,
    quarterlyNet: 2756.25,
    linkedBankName: 'Sonali Bank PLC',
    linkedAccountNo: 'SONALI-0102030405',
  },
  {
    certificateNumber: '2025-0432271',
    schemeName: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র',
    ownership: 'একক',
    issueDate: '2025-05-15',
    maturityDate: '2028-05-15',
    principalAmount: 300000,
    firstCouponDate: '2025-08-17',
    quarterlyGross: 9206.25,
    quarterlyTax: 920.63,
    quarterlyNet: 8285.62,
    linkedBankName: 'Sonali Bank PLC',
    linkedAccountNo: 'SONALI-0102030405',
  },
  {
    certificateNumber: '2025-0804248',
    schemeName: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র',
    ownership: 'একক',
    issueDate: '2025-08-20',
    maturityDate: '2028-08-20',
    principalAmount: 500000,
    firstCouponDate: '2025-11-20',
    quarterlyGross: 14750.00,
    quarterlyTax: 1475.00,
    quarterlyNet: 13275.00,
    linkedBankName: 'Sonali Bank PLC',
    linkedAccountNo: 'SONALI-0102030405',
  },
  {
    certificateNumber: '2025-1121586',
    schemeName: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র',
    ownership: 'একক',
    issueDate: '2025-11-04',
    maturityDate: '2028-11-04',
    principalAmount: 400000,
    firstCouponDate: '2026-02-05',
    quarterlyGross: 11770.00,
    quarterlyTax: 1177.00,
    quarterlyNet: 10593.00,
    linkedBankName: 'Sonali Bank PLC',
    linkedAccountNo: 'SONALI-0102030405',
  },
  {
    certificateNumber: '2025-1143799',
    schemeName: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র',
    ownership: 'একক',
    issueDate: '2025-11-10',
    maturityDate: '2028-11-10',
    principalAmount: 100000,
    firstCouponDate: '2026-02-10',
    quarterlyGross: 2942.50,
    quarterlyTax: 294.25,
    quarterlyNet: 2648.25,
    linkedBankName: 'Sonali Bank PLC',
    linkedAccountNo: 'SONALI-0102030405',
  },
  {
    certificateNumber: '2026-0326827',
    schemeName: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র',
    ownership: 'একক',
    issueDate: '2026-04-16',
    maturityDate: '2029-04-16',
    principalAmount: 300000,
    firstCouponDate: '2026-07-16',
    quarterlyGross: 8827.50,
    quarterlyTax: 882.75,
    quarterlyNet: 7944.75,
    linkedBankName: 'Sonali Bank PLC',
    linkedAccountNo: 'SONALI-0102030405',
  },
  {
    certificateNumber: '2026-0541949',
    schemeName: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র',
    ownership: 'একক',
    issueDate: '2026-06-15',
    maturityDate: '2029-06-15',
    principalAmount: 400000,
    firstCouponDate: '2026-09-15',
    quarterlyGross: 11770.00,
    quarterlyTax: 1177.00,
    quarterlyNet: 10593.00,
    linkedBankName: 'Sonali Bank PLC',
    linkedAccountNo: 'SONALI-0102030405',
  },
  {
    certificateNumber: '2026-0698004',
    schemeName: '৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্র',
    ownership: 'একক',
    issueDate: '2026-07-14',
    maturityDate: '2029-07-14',
    principalAmount: 400000,
    firstCouponDate: '2026-10-14',
    quarterlyGross: 11770.00,
    quarterlyTax: 1177.00,
    quarterlyNet: 10593.00,
    linkedBankName: 'Sonali Bank PLC',
    linkedAccountNo: 'SONALI-0102030405',
  },
];

const COUPON_STATUS_KEY = 'mh_sanchaypatra_coupons_status';
const COUPON_READ_PAST_KEY = 'mh_sanchaypatra_read_past';
const COUPON_EVENT = 'mh_sanchaypatra_coupon_updated';

function addMonthsToDate(dateStr: string, monthsToAdd: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1 + monthsToAdd, d);
  const resY = target.getFullYear();
  const resM = String(target.getMonth() + 1).padStart(2, '0');
  const resD = String(target.getDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

export class SanchaypatraEarningsService {
  /**
   * Reads persistent list of past coupon IDs marked as read/dismissed
   */
  public static getReadPastIds(): string[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(COUPON_READ_PAST_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return [];
  }

  /**
   * Saves persistent list of read past coupon IDs
   */
  public static saveReadPastIds(ids: string[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(COUPON_READ_PAST_KEY, JSON.stringify(ids));
        window.dispatchEvent(new Event(COUPON_EVENT));
      }
    } catch (e) {}
  }

  /**
   * Marks a specific coupon as read/cleared
   */
  public static markCouponAsRead(couponId: string): void {
    const existing = new Set(this.getReadPastIds());
    existing.add(couponId);
    this.saveReadPastIds(Array.from(existing));
  }

  /**
   * Unmarks a coupon from read status
   */
  public static unmarkCouponAsRead(couponId: string): void {
    const existing = new Set(this.getReadPastIds());
    existing.delete(couponId);
    this.saveReadPastIds(Array.from(existing));
  }

  /**
   * Marks ALL past-due coupons (whose date has already passed) as read/cleared.
   * This immediately clears old notifications and keeps only advanced/upcoming schedules.
   */
  public static markAllPastCouponsAsRead(): number {
    const all = this.getAllScheduleItems();
    const pastUnread = all.filter((c) => c.isPastDue && !c.isRead && c.status === 'PENDING');
    const existing = new Set(this.getReadPastIds());
    pastUnread.forEach((c) => existing.add(c.id));
    this.saveReadPastIds(Array.from(existing));
    return pastUnread.length;
  }

  /**
   * Generates all 12 quarterly coupon entries for a certificate across its 3-year life
   */
  public static generateCouponsForCertificate(
    record: SanchaypatraMasterRecord,
    statusMap: Record<string, { status: 'CONFIRMED_DEPOSITED'; confirmedAt: string; transactionId: string }>,
    readPastIds?: Set<string>
  ): SanchaypatraCouponScheduleItem[] {
    const coupons: SanchaypatraCouponScheduleItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const readSet = readPastIds || new Set(this.getReadPastIds());

    for (let q = 1; q <= 12; q++) {
      const couponId = `coupon_${record.certificateNumber}_q${q}`;
      const couponDate = q === 1 ? record.firstCouponDate : addMonthsToDate(record.firstCouponDate, (q - 1) * 3);
      
      const cDate = new Date(couponDate);
      cDate.setHours(0, 0, 0, 0);
      const diffMs = cDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isPastDue = daysRemaining < 0;

      const confirmedMeta = statusMap[couponId];

      coupons.push({
        id: couponId,
        certificateNumber: record.certificateNumber,
        schemeName: record.schemeName,
        principalAmount: record.principalAmount,
        quarterNumber: q,
        couponDate,
        grossAmount: record.quarterlyGross,
        taxDeducted: record.quarterlyTax,
        netAmount: record.quarterlyNet,
        linkedBankName: record.linkedBankName,
        linkedAccountNo: record.linkedAccountNo,
        status: confirmedMeta ? 'CONFIRMED_DEPOSITED' : 'PENDING',
        confirmedAt: confirmedMeta?.confirmedAt,
        transactionId: confirmedMeta?.transactionId,
        daysRemaining,
        isPastDue,
        isRead: readSet.has(couponId),
      });
    }

    return coupons;
  }

  /**
   * Reads persistent confirmation status map from localStorage
   */
  public static getStatusMap(): Record<string, { status: 'CONFIRMED_DEPOSITED'; confirmedAt: string; transactionId: string }> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(COUPON_STATUS_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return {};
  }

  /**
   * Saves persistent confirmation status map
   */
  public static saveStatusMap(
    map: Record<string, { status: 'CONFIRMED_DEPOSITED'; confirmedAt: string; transactionId: string }>
  ): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(COUPON_STATUS_KEY, JSON.stringify(map));
        window.dispatchEvent(new Event(COUPON_EVENT));
      }
    } catch (e) {}
  }

  /**
   * Retrieves full chronological schedule of all 108 coupons across the 9 certificates
   */
  public static getAllScheduleItems(): SanchaypatraCouponScheduleItem[] {
    const statusMap = this.getStatusMap();
    const readPastIds = new Set(this.getReadPastIds());
    const all: SanchaypatraCouponScheduleItem[] = [];

    for (const master of SANCHAYPATRA_MASTER_PORTFOLIO) {
      all.push(...this.generateCouponsForCertificate(master, statusMap, readPastIds));
    }

    // Sort chronologically
    return all.sort((a, b) => a.couponDate.localeCompare(b.couponDate));
  }

  /**
   * Retrieves only active upcoming and non-dismissed schedules (advanced view)
   */
  public static getAdvancedScheduleItems(): SanchaypatraCouponScheduleItem[] {
    const all = this.getAllScheduleItems();
    return all.filter((c) => !c.isRead);
  }

  /**
   * Confirms coupon encashment and automatically credits Net Profit into Sonali Bank PLC
   */
  public static confirmAndDepositToSonaliBank(
    couponId: string
  ): { success: boolean; message: string; incomeItem?: any } {
    const all = this.getAllScheduleItems();
    const coupon = all.find((c) => c.id === couponId);

    if (!coupon) {
      return { success: false, message: 'Coupon record not found.' };
    }

    if (coupon.status === 'CONFIRMED_DEPOSITED') {
      return { success: false, message: 'This coupon has already been confirmed and deposited.' };
    }

    // Locate Sonali Bank Account
    const accounts = TransactionManager.getAccountsWithCash();
    const sonaliAccount =
      accounts.find(
        (a) =>
          a.accountNumber === coupon.linkedAccountNo ||
          a.bankName.toLowerCase().includes('sonali') ||
          a.id === 'ACC-SONALI-01'
      ) || accounts[0];

    const targetAccountId = sonaliAccount?.id || 'ACC-SONALI-01';

    // Record Income in TransactionManager
    const { income } = TransactionManager.recordIncome({
      title: `সঞ্চয়পত্র মুনাফা: #${coupon.certificateNumber} (Q${coupon.quarterNumber})`,
      amount: coupon.netAmount,
      category: 'Investment Income',
      accountId: targetAccountId,
      date: coupon.couponDate,
      notes: `Gross: ৳${coupon.grossAmount.toLocaleString('en-IN')} | ১০% উৎস কর কর্তন: ৳${coupon.taxDeducted.toLocaleString('en-IN')} | নিট প্রাপ্তি: ৳${coupon.netAmount.toLocaleString('en-IN')}`,
    });

    // Update status map
    const map = this.getStatusMap();
    map[couponId] = {
      status: 'CONFIRMED_DEPOSITED',
      confirmedAt: new Date().toISOString(),
      transactionId: income.id,
    };
    this.saveStatusMap(map);

    return {
      success: true,
      message: `৳ ${coupon.netAmount.toLocaleString('en-IN')} successfully credited into Sonali Bank PLC (A/C: ${coupon.linkedAccountNo})!`,
      incomeItem: income,
    };
  }

  /**
   * Reverts a coupon confirmation and removes credited balance if made in error
   */
  public static unconfirmCoupon(couponId: string): { success: boolean; message: string } {
    const map = this.getStatusMap();
    const meta = map[couponId];
    if (!meta) {
      return { success: false, message: 'Coupon is not marked as confirmed.' };
    }

    delete map[couponId];
    this.saveStatusMap(map);
    return { success: true, message: 'Coupon deposit confirmation removed.' };
  }

  /**
   * Schedules push notification alerts for upcoming Sanchaypatra payouts
   */
  public static async scheduleUpcomingAlerts(): Promise<number> {
    const coupons = this.getAllScheduleItems().filter(
      (c) => c.status === 'PENDING' && c.daysRemaining >= 0 && c.daysRemaining <= 30
    );

    let scheduledCount = 0;
    for (const c of coupons) {
      try {
        await scheduleSanchaypatraCouponAlert(
          c.id,
          `${c.schemeName} #${c.certificateNumber}`,
          c.netAmount,
          new Date(c.couponDate)
        );
        scheduledCount++;
      } catch (e) {}
    }
    return scheduledCount;
  }

  /**
   * Calculates executive aggregate statistics for the entire 9-certificate portfolio
   */
  public static getPortfolioSummary(): {
    totalCapital: number;
    quarterlyGrossProfit: number;
    quarterlyTaxDeduction: number;
    quarterlyNetProfit: number;
    annualGrossProfit: number;
    annualTaxDeduction: number;
    annualNetProfit: number;
    total3YearGrossYield: number;
    total3YearNetYield: number;
    totalCouponsCount: number;
    confirmedCouponsCount: number;
    confirmedTotalNetDeposited: number;
    pendingCouponsCount: number;
    nextDueCoupon: SanchaypatraCouponScheduleItem | null;
  } {
    const all = this.getAllScheduleItems();
    
    let totalCapital = 0;
    let quarterlyGrossProfit = 0;
    let quarterlyTaxDeduction = 0;
    let quarterlyNetProfit = 0;

    for (const m of SANCHAYPATRA_MASTER_PORTFOLIO) {
      totalCapital += m.principalAmount;
      quarterlyGrossProfit += m.quarterlyGross;
      quarterlyTaxDeduction += m.quarterlyTax;
      quarterlyNetProfit += m.quarterlyNet;
    }

    const annualGrossProfit = quarterlyGrossProfit * 4;
    const annualTaxDeduction = quarterlyTaxDeduction * 4;
    const annualNetProfit = quarterlyNetProfit * 4;
    const total3YearGrossYield = quarterlyGrossProfit * 12;
    const total3YearNetYield = quarterlyNetProfit * 12;

    const confirmed = all.filter((c) => c.status === 'CONFIRMED_DEPOSITED');
    const confirmedTotalNetDeposited = confirmed.reduce((sum, c) => sum + c.netAmount, 0);

    const allPending = all.filter((c) => c.status === 'PENDING');
    const activePending = allPending.filter((c) => !c.isRead);
    // Find next nearest due coupon from active unread coupons
    const upcoming = activePending.filter((c) => c.daysRemaining >= 0);
    const nextDueCoupon = upcoming.length > 0 ? upcoming[0] : (activePending[0] || (allPending.length > 0 ? allPending[0] : null));

    return {
      totalCapital,
      quarterlyGrossProfit,
      quarterlyTaxDeduction,
      quarterlyNetProfit,
      annualGrossProfit,
      annualTaxDeduction,
      annualNetProfit,
      total3YearGrossYield,
      total3YearNetYield,
      totalCouponsCount: all.length,
      confirmedCouponsCount: confirmed.length,
      confirmedTotalNetDeposited,
      pendingCouponsCount: activePending.length,
      nextDueCoupon,
    };
  }
}
