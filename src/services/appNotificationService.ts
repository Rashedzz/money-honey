/**
 * Money-Honey Unified Notification & Alert Service
 * Single authoritative source of truth for all financial alerts, upcoming payouts,
 * and scheduled income/bills. Ensures that alert badge counts decrement immediately
 * when marked as read, cleared, deposited, or dismissed.
 */

import { SanchaypatraEarningsService } from './sanchaypatraEarningsService';
import { getStoredSchedules, ScheduledItem } from '../components/screens/ScheduleScreen';

export const NOTIF_DISMISSED_KEY = 'mh_dismissed_notification_ids';
export const NOTIF_UPDATED_EVENT = 'mh_notifications_updated';

export interface AppNotificationItem {
  id: string;
  type: 'sanchaypatra' | 'salary' | 'bill' | 'market';
  title: string;
  message: string;
  amount?: number;
  dateStr?: string;
  daysRemaining: number;
  urgency: 'critical' | 'warning' | 'normal' | 'info';
  couponId?: string;
  scheduleId?: string;
  targetAccount?: string;
}

export class AppNotificationService {
  /**
   * Reads persistent list of dismissed notification IDs from localStorage
   */
  public static getDismissedIds(): string[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(NOTIF_DISMISSED_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return [];
  }

  /**
   * Saves persistent list of dismissed notification IDs and broadcasts update
   */
  public static saveDismissedIds(ids: string[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(NOTIF_DISMISSED_KEY, JSON.stringify(ids));
        this.broadcastUpdate();
      }
    } catch (e) {}
  }

  /**
   * Broadcasts events to all listeners on window
   */
  public static broadcastUpdate(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(NOTIF_UPDATED_EVENT));
      window.dispatchEvent(new Event('mh_sanchaypatra_coupon_updated'));
    }
  }

  /**
   * Dismisses a single notification and persists dismissal
   */
  public static dismissNotification(notificationId: string, couponId?: string): void {
    const existing = new Set(this.getDismissedIds());
    existing.add(notificationId);
    this.saveDismissedIds(Array.from(existing));

    // If it's a sanchaypatra coupon notification, also mark coupon as read in Sanchaypatra service
    const targetCouponId = couponId || (notificationId.startsWith('notif_sp_') ? notificationId.replace('notif_sp_', '') : null);
    if (targetCouponId) {
      SanchaypatraEarningsService.markCouponAsRead(targetCouponId);
    }

    this.broadcastUpdate();
  }

  /**
   * Marks all past-due coupons as read and updates notifications
   */
  public static clearPastDueAlerts(): number {
    const cleared = SanchaypatraEarningsService.markAllPastCouponsAsRead();
    this.broadcastUpdate();
    return cleared;
  }

  /**
   * Clears ALL active alerts currently visible (past + upcoming)
   */
  public static clearAllAlerts(): number {
    const active = this.getActiveNotifications();
    const existingDismissed = new Set(this.getDismissedIds());

    for (const item of active) {
      existingDismissed.add(item.id);
      if (item.couponId) {
        SanchaypatraEarningsService.markCouponAsRead(item.couponId);
      }
    }

    this.saveDismissedIds(Array.from(existingDismissed));
    SanchaypatraEarningsService.markAllPastCouponsAsRead();
    this.broadcastUpdate();
    return active.length;
  }

  /**
   * Retrieves all active, unread, and non-dismissed financial alerts.
   * Single source of truth for both NotificationCenterModal and header badge counts.
   */
  public static getActiveNotifications(): AppNotificationItem[] {
    const items: AppNotificationItem[] = [];
    const dismissedSet = new Set(this.getDismissedIds());

    const today = new Date();
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentMonthKey = `${currentYear}-${currentMonth}`;

    // 1. Sanchaypatra Coupons
    try {
      const coupons = SanchaypatraEarningsService.getAllScheduleItems();
      // Strictly filter: must be PENDING, NOT isRead, NOT dismissed, and within 60 days
      const pendingCoupons = coupons.filter(
        (c) =>
          c.status === 'PENDING' &&
          !c.isRead &&
          !dismissedSet.has(`notif_sp_${c.id}`) &&
          c.daysRemaining <= 60
      );

      for (const c of pendingCoupons) {
        const isPastDue = c.daysRemaining < 0;
        const isToday = c.daysRemaining === 0;

        items.push({
          id: `notif_sp_${c.id}`,
          type: 'sanchaypatra',
          title: `সঞ্চয়পত্র ৩-মাস মুনাফা #${c.certificateNumber}`,
          message: isToday
            ? `আজকে মুনাফা প্রদানের তারিখ! নিট ৳${c.netAmount.toLocaleString('en-IN')} সোনালী ব্যাংকে জমা করার জন্য প্রস্তুত।`
            : isPastDue
            ? `${Math.abs(c.daysRemaining)} দিন পূর্বে মুনাফা তোলার তারিখ অতিক্রম হয়েছে। নিট ৳${c.netAmount.toLocaleString('en-IN')} সোনালী ব্যাংকে জমা করুন বা Mark as Read করুন।`
            : `আর ${c.daysRemaining} দিন বাকি। সোনালী ব্যাংক পিএলসি অ্যাকাউন্টে নিট ৳${c.netAmount.toLocaleString('en-IN')} জমা হবে।`,
          amount: c.netAmount,
          dateStr: c.couponDate,
          daysRemaining: c.daysRemaining,
          urgency: isToday || isPastDue ? 'critical' : c.daysRemaining <= 7 ? 'warning' : 'normal',
          couponId: c.id,
          targetAccount: c.linkedBankName || 'Sonali Bank PLC',
        });
      }
    } catch (e) {}

    // 2. Scheduled Incomes & Salaries
    try {
      const schedules = getStoredSchedules();

      for (const s of schedules) {
        if (s.status === 'paused') continue;

        // Check if already paid for the current month
        const isPaidThisMonth = s.lastPaidDate && s.lastPaidDate.startsWith(currentMonthKey);
        if (isPaidThisMonth) {
          // Already deposited/paid this month; do not alert
          continue;
        }

        if (s.flowType === 'income') {
          const notifId = `notif_sch_${s.id}_${currentMonthKey}`;
          if (dismissedSet.has(notifId) || dismissedSet.has(`notif_sch_${s.id}`)) {
            continue;
          }

          const isSalary =
            s.title.toLowerCase().includes('salary') ||
            (s.category && s.category.toLowerCase().includes('salary'));

          // Incomes typically follow 5th to 10th window or s.dueDay
          const startWindow = 5;
          const endWindow = 10;

          if (currentDay >= startWindow && currentDay <= endWindow) {
            items.push({
              id: notifId,
              type: 'salary',
              title: `💰 ${s.title} (Deposit Window Active)`,
              message: `Monthly deposit window active (5th–10th). Credit ৳${s.amount.toLocaleString('en-IN')} into ${s.linkedAccount || 'designated account'}.`,
              amount: s.amount,
              daysRemaining: 0,
              urgency: 'critical',
              scheduleId: s.id,
              targetAccount: s.linkedAccount || (isSalary ? 'Bank' : 'Cash in Hand'),
            });
          } else if (currentDay < startWindow) {
            const daysToWindow = startWindow - currentDay;
            if (daysToWindow <= 10) {
              items.push({
                id: notifId,
                type: 'salary',
                title: `🗓️ ${s.title} Countdown`,
                message: `${daysToWindow} days until the 5th–10th monthly deposit cycle begins. Planned: ৳${s.amount.toLocaleString('en-IN')}.`,
                amount: s.amount,
                daysRemaining: daysToWindow,
                urgency: 'normal',
                scheduleId: s.id,
                targetAccount: s.linkedAccount || 'Bank / Cash in Hand',
              });
            }
          } else {
            // Past 10th of the month and not yet deposited
            const daysOverdue = currentDay - endWindow;
            items.push({
              id: notifId,
              type: 'salary',
              title: `⚠️ ${s.title} (Pending Deposit)`,
              message: `Monthly cycle (5th–10th) elapsed ${daysOverdue} days ago. Confirm deposit of ৳${s.amount.toLocaleString('en-IN')}.`,
              amount: s.amount,
              daysRemaining: -daysOverdue,
              urgency: 'warning',
              scheduleId: s.id,
              targetAccount: s.linkedAccount || (isSalary ? 'Bank' : 'Cash in Hand'),
            });
          }
        } else if (s.flowType === 'expense') {
          // Bills & Recurring Outflows
          const notifId = `notif_sch_exp_${s.id}_${currentMonthKey}`;
          if (dismissedSet.has(notifId) || dismissedSet.has(`notif_sch_${s.id}`)) {
            continue;
          }

          const dueDay = s.dueDay || 1;
          const diff = dueDay - currentDay;

          if (diff < 0) {
            // Overdue
            items.push({
              id: notifId,
              type: 'bill',
              title: `⚠️ ${s.title} (Overdue Bill)`,
              message: `Bill was due on day ${dueDay} (${Math.abs(diff)} days ago). Payable: ৳${s.amount.toLocaleString('en-IN')}.`,
              amount: s.amount,
              daysRemaining: diff,
              urgency: 'warning',
              scheduleId: s.id,
              targetAccount: s.linkedAccount || 'Linked Account',
            });
          } else if (diff === 0) {
            // Due today
            items.push({
              id: notifId,
              type: 'bill',
              title: `⚡ ${s.title} (Due Today)`,
              message: `Bill is due today! Amount payable: ৳${s.amount.toLocaleString('en-IN')}.`,
              amount: s.amount,
              daysRemaining: 0,
              urgency: 'critical',
              scheduleId: s.id,
              targetAccount: s.linkedAccount || 'Linked Account',
            });
          } else if (diff <= 5) {
            // Approaching within 5 days
            items.push({
              id: notifId,
              type: 'bill',
              title: `🗓️ ${s.title} Due Soon`,
              message: `Due in ${diff} days (on day ${dueDay}). Planned: ৳${s.amount.toLocaleString('en-IN')}.`,
              amount: s.amount,
              daysRemaining: diff,
              urgency: 'normal',
              scheduleId: s.id,
              targetAccount: s.linkedAccount || 'Linked Account',
            });
          }
        }
      }
    } catch (e) {}

    // Sort: critical first, then warning, normal, info; then by daysRemaining
    const rank: Record<string, number> = { critical: 0, warning: 1, normal: 2, info: 3 };
    items.sort((a, b) => {
      const rA = rank[a.urgency] ?? 4;
      const rB = rank[b.urgency] ?? 4;
      if (rA !== rB) return rA - rB;
      return a.daysRemaining - b.daysRemaining;
    });

    return items;
  }

  /**
   * Quick method to get exact alert count matching active items
   */
  public static getActiveNotificationCount(): number {
    return this.getActiveNotifications().length;
  }
}
