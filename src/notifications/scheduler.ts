/**
 * Expo Notifications Scheduler module.
 */
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const BACKGROUND_SYNC_TASK = 'MONEY_HONEY_BACKGROUND_SYNC';

/**
 * Requests notification permissions from the user.
 * 
 * @returns A promise that resolves to true if granted, false otherwise.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

// Background Task Registration
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Logic to fetch new data and reschedule notifications if necessary
    // In a full implementation, you would fetch from DB/API and call schedule... functions
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Cancels all pending notifications related to a specific entity.
 * 
 * @param entityId - The unique ID of the loan, FDR, or Sanchaypatra.
 */
export async function cancelNotificationsForEntity(entityId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduled) {
    const data = notification.content.data;
    if (data && data.entityId === entityId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

/**
 * Schedules EMI reminder notifications.
 * 
 * @param loanId - Loan identifier.
 * @param loanTitle - Title of the loan.
 * @param emiAmount - EMI amount due.
 * @param dueDate - Due date of the EMI.
 */
export async function scheduleEMIReminders(loanId: string, loanTitle: string, emiAmount: number, dueDate: Date): Promise<void> {
  await cancelNotificationsForEntity(loanId);
  
  const schedules = [
    { daysBefore: 7, body: `Upcoming EMI: BDT ${emiAmount} for ${loanTitle} is due in 7 days.` },
    { daysBefore: 3, body: `Reminder: BDT ${emiAmount} for ${loanTitle} is due in 3 days.` },
    { daysBefore: 0, body: `Due Today: BDT ${emiAmount} for ${loanTitle}. Please ensure sufficient balance.` }
  ];
  
  for (const sched of schedules) {
    const notifyDate = new Date(dueDate);
    notifyDate.setDate(notifyDate.getDate() - sched.daysBefore);
    // Set typical reminder time (e.g., 9:00 AM)
    notifyDate.setHours(9, 0, 0, 0);
    
    if (notifyDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'EMI Reminder',
          body: sched.body,
          data: { entityId: loanId, type: 'emi' },
        },
        trigger: notifyDate,
      });
    }
  }
}

/**
 * Schedules FDR maturity notifications.
 * 
 * @param fdrId - FDR identifier.
 * @param fdrNumber - FDR account or reference number.
 * @param maturityValue - Projected maturity value.
 * @param maturityDate - Maturity date.
 */
export async function scheduleFDRMaturityAlert(fdrId: string, fdrNumber: string, maturityValue: number, maturityDate: Date): Promise<void> {
  await cancelNotificationsForEntity(fdrId);
  
  const schedules = [
    { daysBefore: 21, body: `Action Required: FDR ${fdrNumber} matures in 21 days. Maturity Value: BDT ${maturityValue}.` },
    { daysBefore: 7, body: `FDR ${fdrNumber} matures in 1 week. Maturity Value: BDT ${maturityValue}.` },
    { daysBefore: 0, body: `FDR ${fdrNumber} matures TODAY. Maturity Value: BDT ${maturityValue}.` }
  ];
  
  for (const sched of schedules) {
    const notifyDate = new Date(maturityDate);
    notifyDate.setDate(notifyDate.getDate() - sched.daysBefore);
    notifyDate.setHours(10, 0, 0, 0);
    
    if (notifyDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'FDR Maturity Alert',
          body: sched.body,
          data: { entityId: fdrId, type: 'fdr_maturity' },
        },
        trigger: notifyDate,
      });
    }
  }
}

/**
 * Schedules Sanchaypatra coupon collection alerts.
 * 
 * @param couponId - Unique ID for the coupon schedule entry.
 * @param name - Name of the Sanchaypatra.
 * @param netAmount - Net coupon payout amount.
 * @param couponDate - Date the coupon is payable.
 */
export async function scheduleSanchaypatraCouponAlert(couponId: string, name: string, netAmount: number, couponDate: Date): Promise<void> {
  await cancelNotificationsForEntity(couponId);
  
  const schedules = [
    { daysBefore: 2, body: `Upcoming Sanchaypatra Payout: BDT ${netAmount} from ${name} will be available in 2 days.` },
    { daysBefore: 0, body: `Sanchaypatra Payout Available: BDT ${netAmount} from ${name} is ready for collection today.` }
  ];
  
  for (const sched of schedules) {
    const notifyDate = new Date(couponDate);
    notifyDate.setDate(notifyDate.getDate() - sched.daysBefore);
    notifyDate.setHours(9, 30, 0, 0);
    
    if (notifyDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Sanchaypatra Payout',
          body: sched.body,
          data: { entityId: couponId, type: 'sanchaypatra_coupon' },
        },
        trigger: notifyDate,
      });
    }
  }
}

/**
 * Orchestrates registration of all system notifications for active portfolios.
 * 
 * @param loans - Array of loan objects containing scheduling details.
 * @param fdrs - Array of FDR objects containing scheduling details.
 * @param sanchaypatras - Array of Sanchaypatra schedules containing details.
 */
export async function registerAllNotifications(loans: any[], fdrs: any[], sanchaypatras: any[]): Promise<void> {
  // Clear existing schedules to ensure fresh state
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  // Register EMI reminders
  for (const loan of loans) {
    if (loan.nextDueDate) {
      await scheduleEMIReminders(loan.id, loan.title, loan.emiAmount, new Date(loan.nextDueDate));
    }
  }
  
  // Register FDR alerts
  for (const fdr of fdrs) {
    if (fdr.maturityDate) {
      await scheduleFDRMaturityAlert(fdr.id, fdr.fdrNumber || fdr.id, fdr.maturityValue || 0, new Date(fdr.maturityDate));
    }
  }
  
  // Register Sanchaypatra coupons
  for (const sp of sanchaypatras) {
    if (sp.couponDate && !sp.isCollected) {
      await scheduleSanchaypatraCouponAlert(sp.id, sp.name, sp.netAmount, new Date(sp.couponDate));
    }
  }
}
