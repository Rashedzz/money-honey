import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { SoundService } from '../../services/soundEffects';
import {
  SanchaypatraEarningsService,
  SanchaypatraCouponScheduleItem,
} from '../../services/sanchaypatraEarningsService';
import {
  getStoredSchedules,
  saveStoredSchedules,
  ScheduledItem,
} from '../screens/ScheduleScreen';
import { TransactionManager, CASH_IN_HAND_ID } from '../../services/transactionManager';

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToSchedules?: () => void;
  onNavigateToSanchaypatra?: () => void;
}

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

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  visible,
  onClose,
  onNavigateToSchedules,
  onNavigateToSanchaypatra,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(SoundService.isAudioEnabled());
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const loadNotifications = () => {
    const items: AppNotificationItem[] = [];
    const today = new Date();
    const currentDay = today.getDate();

    // 1. Sanchaypatra Upcoming or Pending Coupons
    try {
      const coupons = SanchaypatraEarningsService.getAllScheduleItems();
      const pendingCoupons = coupons.filter(
        (c) => c.status === 'PENDING' && c.daysRemaining <= 45
      );

      pendingCoupons.slice(0, 8).forEach((c) => {
        const isPastDue = c.daysRemaining < 0;
        const isToday = c.daysRemaining === 0;

        items.push({
          id: `notif_sp_${c.id}`,
          type: 'sanchaypatra',
          title: `সঞ্চয়পত্র ৩-মাস মুনাফা #${c.certificateNumber}`,
          message: isToday
            ? `আজকে মুনাফা প্রদানের তারিখ! নিট ৳${c.netAmount.toLocaleString('en-IN')} সোনালী ব্যাংকে জমা করার জন্য প্রস্তুত।`
            : isPastDue
            ? `${Math.abs(c.daysRemaining)} দিন পূর্বে মুনাফা তোলার তারিখ অতিক্রম হয়েছে। নিট ৳${c.netAmount.toLocaleString('en-IN')} জমা করুন।`
            : `আর ${c.daysRemaining} দিন বাকি। সোনালী ব্যাংক পিএলসি অ্যাকাউন্টে নিট ৳${c.netAmount.toLocaleString('en-IN')} জমা হবে।`,
          amount: c.netAmount,
          dateStr: c.couponDate,
          daysRemaining: c.daysRemaining,
          urgency: isToday || isPastDue ? 'critical' : c.daysRemaining <= 7 ? 'warning' : 'normal',
          couponId: c.id,
          targetAccount: 'Sonali Bank PLC',
        });
      });
    } catch (e) {}

    // 2. Scheduled Incomes & Salaries (especially highlighting 5th - 10th window)
    try {
      const schedules = getStoredSchedules();
      const incomeSchedules = schedules.filter((s) => s.flowType === 'income');

      incomeSchedules.forEach((s) => {
        let daysToWindow = 0;
        let inWindow = false;

        if (currentDay >= 5 && currentDay <= 10) {
          inWindow = true;
        } else if (currentDay < 5) {
          daysToWindow = 5 - currentDay;
        } else {
          // Next month's 5th
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          daysToWindow = lastDay - currentDay + 5;
        }

        const isSalary = s.title.toLowerCase().includes('salary') || s.category.toLowerCase().includes('salary');

        if (inWindow) {
          items.push({
            id: `notif_sch_${s.id}`,
            type: 'salary',
            title: `💰 ${s.title} (Deposit Window Active)`,
            message: `Current payment window (5th–10th). Deposit ৳${s.amount.toLocaleString('en-IN')} into ${s.linkedAccount || 'designated account'}.`,
            amount: s.amount,
            daysRemaining: 0,
            urgency: 'critical',
            scheduleId: s.id,
            targetAccount: s.linkedAccount || (isSalary ? 'Bank' : 'Cash in Hand'),
          });
        } else if (daysToWindow <= 10) {
          items.push({
            id: `notif_sch_${s.id}`,
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
      });
    } catch (e) {}

    // Sort by urgency: critical first, then warning, normal
    const rank = { critical: 0, warning: 1, normal: 2, info: 3 };
    items.sort((a, b) => rank[a.urgency] - rank[b.urgency]);

    setNotifications(items);
  };

  useEffect(() => {
    if (visible) {
      loadNotifications();
      SoundService.playNotificationChime();
    }
  }, [visible]);

  const handleToggleSound = (val: boolean) => {
    setSoundEnabled(val);
    SoundService.setAudioEnabled(val);
    if (val) {
      SoundService.playNotificationChime();
    }
  };

  const handleTestChime = () => {
    SoundService.playDepositSuccessSound();
  };

  const handleDepositSanchaypatraCoupon = (couponId: string) => {
    const result = SanchaypatraEarningsService.confirmAndDepositToSonaliBank(couponId);
    if (result.success) {
      SoundService.playDepositSuccessSound();
      Alert.alert('✅ Deposit Confirmed', result.message);
      loadNotifications();
    } else {
      Alert.alert('Notice', result.message);
    }
  };

  const handleDepositScheduledIncome = (scheduleId: string) => {
    const schedules = getStoredSchedules();
    const item = schedules.find((s) => s.id === scheduleId);
    if (!item) return;

    // Credit to target account
    const accounts = TransactionManager.getAccountsWithCash();
    let targetAccId = CASH_IN_HAND_ID;

    if (item.linkedAccount) {
      const match = accounts.find(
        (a) =>
          a.id === item.linkedAccount ||
          a.bankName.toLowerCase().includes(item.linkedAccount!.toLowerCase()) ||
          a.accountName.toLowerCase().includes(item.linkedAccount!.toLowerCase())
      );
      if (match) targetAccId = match.id;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    TransactionManager.recordIncome({
      title: item.title,
      amount: item.amount,
      category: item.category || 'Salary',
      accountId: targetAccId,
      date: todayStr,
      notes: `Recurring scheduled deposit credited from Notification Hub (${todayStr}).`,
    });

    const next = schedules.map((s) => (s.id === item.id ? { ...s, lastPaidDate: todayStr } : s));
    saveStoredSchedules(next);

    SoundService.playDepositSuccessSound();
    Alert.alert(
      '✅ Income Deposited',
      `৳${item.amount.toLocaleString('en-IN')} has been successfully deposited to ${
        targetAccId === CASH_IN_HAND_ID ? 'Cash in Hand' : 'Linked Bank'
      }!`
    );
    loadNotifications();
  };

  const visibleNotifications = notifications.filter((n) => !dismissedIds.includes(n.id));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.bellIconBox}>
                <Ionicons name="notifications" size={20} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.title}>Notification & Alert Hub</Text>
                <Text style={styles.subtitle}>
                  {visibleNotifications.length} Active Financial Events & Payouts
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Sound Control Bar */}
          <View style={styles.soundBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons
                name={soundEnabled ? 'volume-high' : 'volume-mute'}
                size={18}
                color={soundEnabled ? '#16A34A' : '#94A3B8'}
              />
              <Text style={styles.soundBarText}>Audio Chimes (Sound Effects)</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                style={styles.testSoundBtn}
                onPress={handleTestChime}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={13} color="#0284C7" />
                <Text style={styles.testSoundBtnText}>Test Sound</Text>
              </TouchableOpacity>

              <Switch
                value={soundEnabled}
                onValueChange={handleToggleSound}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={soundEnabled ? '#16A34A' : '#F1F5F9'}
              />
            </View>
          </View>

          {/* Notifications Scroll Area */}
          <ScrollView style={styles.listArea} contentContainerStyle={{ paddingVertical: 10, gap: 10 }}>
            {visibleNotifications.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="checkmark-circle-outline" size={44} color="#16A34A" />
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySub}>
                  No pending payouts or urgent financial dues right now.
                </Text>
              </View>
            ) : (
              visibleNotifications.map((notif) => {
                const isCritical = notif.urgency === 'critical';
                const isWarning = notif.urgency === 'warning';

                return (
                  <View
                    key={notif.id}
                    style={[
                      styles.notifCard,
                      isCritical && styles.notifCardCritical,
                      isWarning && styles.notifCardWarning,
                    ]}
                  >
                    <View style={styles.notifHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <View
                          style={[
                            styles.notifBadge,
                            isCritical && { backgroundColor: '#FEE2E2' },
                            isWarning && { backgroundColor: '#FEF3C7' },
                          ]}
                        >
                          <Ionicons
                            name={
                              notif.type === 'sanchaypatra'
                                ? 'document-text'
                                : notif.type === 'salary'
                                ? 'wallet'
                                : 'calendar'
                            }
                            size={14}
                            color={isCritical ? '#EF4444' : isWarning ? '#D97706' : '#0284C7'}
                          />
                        </View>
                        <Text style={styles.notifTitle} numberOfLines={1}>
                          {notif.title}
                        </Text>
                      </View>

                      {notif.amount && (
                        <Text style={styles.notifAmount}>
                          ৳ {notif.amount.toLocaleString('en-IN')}
                        </Text>
                      )}
                    </View>

                    <Text style={styles.notifMessage}>{notif.message}</Text>

                    {/* Action Bar */}
                    <View style={styles.notifActionRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="location-outline" size={13} color="#64748B" />
                        <Text style={styles.accountHintText}>
                          Destination: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{notif.targetAccount}</Text>
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {notif.couponId && (
                          <TouchableOpacity
                            style={styles.depositActionBtn}
                            onPress={() => handleDepositSanchaypatraCoupon(notif.couponId!)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                            <Text style={styles.depositActionBtnText}>Confirm Deposited</Text>
                          </TouchableOpacity>
                        )}

                        {notif.scheduleId && (
                          <TouchableOpacity
                            style={styles.depositActionBtn}
                            onPress={() => handleDepositScheduledIncome(notif.scheduleId!)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="cash" size={14} color="#FFFFFF" />
                            <Text style={styles.depositActionBtnText}>Mark Deposited</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.dismissBtn}
                          onPress={() => setDismissedIds((prev) => [...prev, notif.id])}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle-outline" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.footerNavBtn}
              onPress={() => {
                onClose();
                onNavigateToSchedules?.();
              }}
            >
              <Ionicons name="calendar-outline" size={15} color="#0284C7" />
              <Text style={styles.footerNavBtnText}>Open Schedules Hub</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerNavBtn}
              onPress={() => {
                onClose();
                onNavigateToSanchaypatra?.();
              }}
            >
              <Ionicons name="document-text-outline" size={15} color="#16A34A" />
              <Text style={[styles.footerNavBtnText, { color: '#16A34A' }]}>Sanchaypatra Portfolio</Text>
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
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 20px 45px rgba(2, 132, 199, 0.2)' } as any,
      default: { elevation: 8 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  bellIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.sm,
  },
  soundBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#F0F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  soundBarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  testSoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  testSoundBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  listArea: {
    paddingHorizontal: 18,
    maxHeight: 440,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  notifCard: {
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  notifCardCritical: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  notifCardWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  notifAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#16A34A',
  },
  notifMessage: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  notifActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    flexWrap: 'wrap',
    gap: 6,
  },
  accountHintText: {
    fontSize: 12,
    color: '#64748B',
  },
  depositActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  depositActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dismissBtn: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  footerNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  footerNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
});
