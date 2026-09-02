import { Platform } from 'react-native';
import { BirthdayEvent } from '../finance/insuranceBirthday';

/**
 * Request notification permissions across Web and Native
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return true;
  } catch (e) {
    console.warn('Notification permission error:', e);
    return false;
  }
};

/**
 * Dispatch real browser / system notification
 */
export const sendSystemNotification = (title: string, body: string, icon = '/assets/icon.png') => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon,
          badge: icon,
        });
        return;
      }
    }
    // Fallback in-app banner or console
    console.log(`[Notification] ${title}: ${body}`);
  } catch (e) {
    console.warn('Notification dispatch error:', e);
  }
};

/**
 * Check birthday list and dispatch alerts for birthdays due or upcoming
 */
export const checkAndNotifyBirthdays = (birthdays: BirthdayEvent[]) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  birthdays.forEach((b) => {
    try {
      const parts = b.birthDate.split('-');
      if (parts.length < 3) return;

      const birthMonth = parseInt(parts[1], 10) - 1;
      const birthDay = parseInt(parts[2], 10);

      // Create target date this year
      let targetThisYear = new Date(today.getFullYear(), birthMonth, birthDay);
      if (targetThisYear < today && (birthMonth !== currentMonth || birthDay !== currentDay)) {
        targetThisYear = new Date(today.getFullYear() + 1, birthMonth, birthDay);
      }

      const diffTime = targetThisYear.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (birthMonth === currentMonth && birthDay === currentDay) {
        sendSystemNotification(
          `🎂 Happy Birthday to ${b.personName}!`,
          `Today is ${b.personName}'s (${b.relation}) birthday! Gift Budget: ৳${(b.giftBudget || 0).toLocaleString('en-IN')}.`
        );
      } else if (daysUntil <= (b.notifyDaysBefore || 3) && daysUntil > 0) {
        sendSystemNotification(
          `🎉 Upcoming Birthday: ${b.personName}`,
          `${b.personName}'s (${b.relation}) birthday is in ${daysUntil} day(s) on ${parts[2]}/${parts[1]}!`
        );
      }
    } catch (e) {
      console.warn('Birthday check error:', e);
    }
  });
};

/**
 * Trigger immediate test notification to verify device compatibility
 */
export const triggerTestNotification = async (): Promise<boolean> => {
  const granted = await requestNotificationPermission();
  if (granted) {
    sendSystemNotification(
      '🎂 Money-Honey Birthday Alert Active!',
      'Notifications are successfully verified and working on your device.'
    );
    return true;
  }
  return false;
};
