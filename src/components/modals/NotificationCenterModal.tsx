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
import {
  AppNotificationService,
  AppNotificationItem,
} from '../../services/appNotificationService';

export { AppNotificationItem };

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToSchedules?: () => void;
  onNavigateToSanchaypatra?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  visible,
  onClose,
  onNavigateToSchedules,
  onNavigateToSanchaypatra,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(SoundService.isAudioEnabled());
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);

  const loadNotifications = () => {
    try {
      const items = AppNotificationService.getActiveNotifications();
      setNotifications(items);
    } catch (e) {
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (visible) {
      loadNotifications();
      SoundService.playNotificationChime();
    }
    if (typeof window !== 'undefined') {
      const handler = () => loadNotifications();
      window.addEventListener('mh_notifications_updated', handler);
      window.addEventListener('mh_sanchaypatra_coupon_updated', handler);
      return () => {
        window.removeEventListener('mh_notifications_updated', handler);
        window.removeEventListener('mh_sanchaypatra_coupon_updated', handler);
      };
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

  const handleDepositSanchaypatraCoupon = (couponId: string, couponIds?: string[]) => {
    const ids = couponIds && couponIds.length > 0 ? couponIds : [couponId];
    let count = 0;
    let lastMsg = '';

    for (const cid of ids) {
      const result = SanchaypatraEarningsService.confirmAndDepositToSonaliBank(cid);
      if (result.success) {
        count++;
        lastMsg = result.message;
      }
    }

    if (count > 0) {
      SoundService.playDepositSuccessSound();
      Alert.alert(
        '✅ Deposit Confirmed',
        ids.length > 1
          ? `${count} Sanchaypatra coupon profits successfully credited to Sonali Bank PLC!`
          : lastMsg
      );
      loadNotifications();
    } else {
      Alert.alert('Notice', 'Coupon already confirmed or could not be deposited.');
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

  const handleClearPastNotifications = () => {
    const cleared = AppNotificationService.clearPastDueAlerts();
    loadNotifications();
    SoundService.playAlertSound();
    Alert.alert(
      '🧹 Past Schedules Cleared',
      cleared > 0
        ? `${cleared} past schedule notifications have been marked as read and cleared from alerts. Only upcoming and advanced schedules will be displayed.`
        : 'All past notifications are already cleared.'
    );
  };

  const handleClearAllNotifications = () => {
    const cleared = AppNotificationService.clearAllAlerts();
    loadNotifications();
    SoundService.playAlertSound();
    Alert.alert(
      '🧹 All Alerts Cleared',
      cleared > 0
        ? `${cleared} notifications marked as cleared. Your Notification Center is now clean.`
        : 'All notifications are already cleared.'
    );
  };

  const handleMarkCouponRead = (couponId: string, couponIds?: string[]) => {
    if (couponIds && couponIds.length > 0) {
      for (const cid of couponIds) {
        AppNotificationService.dismissNotification(`notif_sp_${cid}`, cid);
      }
    } else {
      AppNotificationService.dismissNotification(`notif_sp_${couponId}`, couponId);
    }
    loadNotifications();
  };

  const handleDismissNotification = (notif: AppNotificationItem) => {
    AppNotificationService.dismissNotification(notif.id, notif.couponId, notif.couponIds);
    loadNotifications();
  };

  const visibleNotifications = notifications;
  const pastDueNotificationsCount = visibleNotifications.filter((n) => n.daysRemaining < 0).length;

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

          {/* Sound Control Bar & Past Clear */}
          <View style={styles.soundBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons
                name={soundEnabled ? 'volume-high' : 'volume-mute'}
                size={18}
                color={soundEnabled ? '#16A34A' : '#94A3B8'}
              />
              <Text style={styles.soundBarText}>Audio Chimes</Text>
              <Switch
                value={soundEnabled}
                onValueChange={handleToggleSound}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={soundEnabled ? '#16A34A' : '#F1F5F9'}
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {pastDueNotificationsCount > 0 && (
                <TouchableOpacity
                  style={styles.clearPastBtn}
                  onPress={handleClearPastNotifications}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-done-outline" size={13} color="#0284C7" />
                  <Text style={styles.clearPastBtnText}>Clear Past ({pastDueNotificationsCount})</Text>
                </TouchableOpacity>
              )}

              {visibleNotifications.length > 0 && (
                <TouchableOpacity
                  style={styles.clearAllBtn}
                  onPress={handleClearAllNotifications}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={13} color="#EF4444" />
                  <Text style={styles.clearAllBtnText}>Clear All</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.testSoundBtn}
                onPress={handleTestChime}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={13} color="#0284C7" />
                <Text style={styles.testSoundBtnText}>Test</Text>
              </TouchableOpacity>
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
                            onPress={() => handleDepositSanchaypatraCoupon(notif.couponId!, notif.couponIds)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                            <Text style={styles.depositActionBtnText}>Confirm Deposited</Text>
                          </TouchableOpacity>
                        )}

                        {notif.couponId && (
                          <TouchableOpacity
                            style={styles.markReadOutlineBtn}
                            onPress={() => handleMarkCouponRead(notif.couponId!, notif.couponIds)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark-done" size={13} color="#475569" />
                            <Text style={styles.markReadOutlineBtnText}>Mark Read</Text>
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
                          onPress={() => handleDismissNotification(notif)}
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
  clearPastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  clearPastBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearAllBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  markReadOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  markReadOutlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
});
