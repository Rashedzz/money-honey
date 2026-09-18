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
  couponIds?: string[];
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
  public static dismissNotification(notificationId: string, couponId?: string, couponIds?: string[]): void {
    const existing = new Set(this.getDismissedIds());
    existing.add(notificationId);
    this.saveDismissedIds(Array.from(existing));

    // If it's a sanchaypatra coupon notification, also mark coupons as read in Sanchaypatra service
    if (couponIds && couponIds.length > 0) {
      for (const cid of couponIds) {
        SanchaypatraEarningsService.markCouponAsRead(cid);
      }
    } else {
      const targetCouponId = couponId || (notificationId.startsWith('notif_sp_') ? notificationId.replace('notif_sp_', '') : null);
      if (targetCouponId) {
        SanchaypatraEarningsService.markCouponAsRead(targetCouponId);
      }
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
      if (item.couponIds && item.couponIds.length > 0) {
        for (const cid of item.couponIds) {
          SanchaypatraEarningsService.markCouponAsRead(cid);
        }
      } else if (item.couponId) {
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
   * Prevents ballooning by:
   * 1. Limiting Sanchaypatra to only the next relevant pending coupon per certificate.
   * 2. Only alerting within a high-signal window (-30 days overdue to +14 days upcoming).
   * 3. Grouping multiple certificates sharing the same payout date into 1 consolidated alert.
   * 4. Enforcing strict active windows for recurring salaries and bills.
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
      const allCoupons = SanchaypatraEarningsService.getAllScheduleItems();

      // Step A: Find the single earliest unread pending coupon for each certificate
      const earliestPendingByCert = new Map<string, typeof allCoupons[0]>();
      for (const c of allCoupons) {
        if (c.status !== 'PENDING' || c.isRead || dismissedSet.has(`notif_sp_${c.id}`)) {
          continue;
        }
        if (!earliestPendingByCert.has(c.certificateNumber)) {
          earliestPendingByCert.set(c.certificateNumber, c);
        }
      }

      // Step B: Filter to relevant actionable notification window:
      // - Overdue within recent 30 days or due today: daysRemaining <= 0 && daysRemaining >= -30
      // - Upcoming within 14 days: daysRemaining > 0 && daysRemaining <= 14
      const activePendingCoupons: typeof allCoupons = [];
      for (const c of earliestPendingByCert.values()) {
        if (c.daysRemaining >= -30 && c.daysRemaining <= 14) {
          activePendingCoupons.push(c);
        }
      }

      // Step C: Group coupons that share the same couponDate to avoid clutter
      const groupedByDate = new Map<string, typeof allCoupons>();
      for (const c of activePendingCoupons) {
        const list = groupedByDate.get(c.couponDate) || [];
        list.push(c);
        groupedByDate.set(c.couponDate, list);
      }

      for (const [dateStr, group] of groupedByDate.entries()) {
        const first = group[0];
        const isPastDue = first.daysRemaining < 0;
        const isToday = first.daysRemaining === 0;
        const totalNet = group.reduce((sum, item) => sum + item.netAmount, 0);
        const couponIds = group.map((item) => item.id);

        if (group.length === 1) {
          items.push({
            id: `notif_sp_${first.id}`,
            type: 'sanchaypatra',
            title: `সঞ্চয়পত্র ৩-মাস মুনাফা #${first.certificateNumber}`,
            message: isToday
              ? `আজকে মুনাফা প্রদানের তারিখ! নিট ৳${first.netAmount.toLocaleString('en-IN')} সোনালী ব্যাংকে জমা করার জন্য প্রস্তুত।`
              : isPastDue
              ? `${Math.abs(first.daysRemaining)} দিন পূর্বে মুনাফা তোলার তারিখ অতিক্রম হয়েছে (${first.couponDate})। নিট ৳${first.netAmount.toLocaleString('en-IN')} সোনালী ব্যাংকে জমা করুন।`
              : `আর ${first.daysRemaining} দিন বাকি (${first.couponDate})। সোনালী ব্যাংক পিএলসি অ্যাকাউন্টে নিট ৳${first.netAmount.toLocaleString('en-IN')} জমা হবে।`,
            amount: first.netAmount,
            dateStr: first.couponDate,
            daysRemaining: first.daysRemaining,
            urgency: isToday || isPastDue ? 'critical' : first.daysRemaining <= 5 ? 'warning' : 'normal',
            couponId: first.id,
            couponIds,
            targetAccount: first.linkedBankName || 'Sonali Bank PLC',
          });
        } else {
          // Grouped notification for multiple certificates due on the same date
          const groupNotifId = `notif_sp_grp_${dateStr}`;
          if (dismissedSet.has(groupNotifId)) continue;

          items.push({
            id: groupNotifId,
            type: 'sanchaypatra',
            title: `সঞ্চয়পত্র মুনাফা (${group.length}টি সার্টিফিকেট)`,
            message: isToday
              ? `আজকে মুনাফা প্রদানের তারিখ! মোট নিট ৳${totalNet.toLocaleString('en-IN')} (${group.length}টি সার্টিফিকেট) সোনালী ব্যাংকে জমা করার জন্য প্রস্তুত।`
              : isPastDue
              ? `${Math.abs(first.daysRemaining)} দিন পূর্বে (${dateStr}) ${group.length}টি সার্টিফিকেটের মুনাফা তোলার তারিখ হয়েছে। মোট নিট ৳${totalNet.toLocaleString('en-IN')} সোনালী ব্যাংকে জমা করুন।`
              : `আর ${first.daysRemaining} দিন বাকি (${dateStr})। ${group.length}টি সার্টিফিকেটের মোট নিট ৳${totalNet.toLocaleString('en-IN')} সোনালী ব্যাংকে জমা হবে।`,
            amount: totalNet,
            dateStr,
            daysRemaining: first.daysRemaining,
            urgency: isToday || isPastDue ? 'critical' : first.daysRemaining <= 5 ? 'warning' : 'normal',
            couponId: first.id,
            couponIds,
            targetAccount: first.linkedBankName || 'Sonali Bank PLC',
          });
        }
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
          const startWindow = s.dueDay ? Math.max(1, s.dueDay - 2) : 5;
          const endWindow = s.dueDay ? s.dueDay + 3 : 10;

          if (currentDay >= startWindow && currentDay <= endWindow) {
            items.push({
              id: notifId,
              type: 'salary',
              title: `💰 ${s.title} (Deposit Window Active)`,
              message: `Monthly deposit window active. Credit ৳${s.amount.toLocaleString('en-IN')} into ${s.linkedAccount || 'designated account'}.`,
              amount: s.amount,
              daysRemaining: 0,
              urgency: 'critical',
              scheduleId: s.id,
              targetAccount: s.linkedAccount || (isSalary ? 'Bank' : 'Cash in Hand'),
            });
          } else if (currentDay < startWindow) {
            const daysToWindow = startWindow - currentDay;
            if (daysToWindow <= 3) {
              items.push({
                id: notifId,
                type: 'salary',
                title: `🗓️ ${s.title} Countdown`,
                message: `${daysToWindow} days until deposit cycle begins. Planned: ৳${s.amount.toLocaleString('en-IN')}.`,
                amount: s.amount,
                daysRemaining: daysToWindow,
                urgency: 'normal',
                scheduleId: s.id,
                targetAccount: s.linkedAccount || 'Bank / Cash in Hand',
              });
            }
          } else {
            // Past end window and not yet deposited - only alert for up to 7 days
            const daysOverdue = currentDay - endWindow;
            if (daysOverdue <= 7) {
              items.push({
                id: notifId,
                type: 'salary',
                title: `⚠️ ${s.title} (Pending Deposit)`,
                message: `Monthly cycle elapsed ${daysOverdue} days ago. Confirm deposit of ৳${s.amount.toLocaleString('en-IN')}.`,
                amount: s.amount,
                daysRemaining: -daysOverdue,
                urgency: 'warning',
                scheduleId: s.id,
                targetAccount: s.linkedAccount || (isSalary ? 'Bank' : 'Cash in Hand'),
              });
            }
          }
        } else if (s.flowType === 'expense') {
          // Bills & Recurring Outflows
          const notifId = `notif_sch_exp_${s.id}_${currentMonthKey}`;
          if (dismissedSet.has(notifId) || dismissedSet.has(`notif_sch_${s.id}`)) {
            continue;
          }

          const dueDay = s.dueDay || 1;
          const diff = dueDay - currentDay;

          if (diff < 0 && diff >= -7) {
            // Overdue within 7 days
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
          } else if (diff > 0 && diff <= 3) {
            // Approaching within 3 days
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
