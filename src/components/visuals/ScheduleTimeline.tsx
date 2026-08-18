import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';

export interface ScheduleEvent {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  daysRemaining: number;
  amount: number;
  type: 'emi' | 'fdr_payout' | 'sanchaypatra_coupon' | 'salary' | 'bill';
  status: 'critical' | 'warning' | 'safe';
  isAutoDebit?: boolean;
}

interface ScheduleTimelineProps {
  events: ScheduleEvent[];
  onAction?: (event: ScheduleEvent) => void;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ events, onAction }) => {
  const getBadgeStyle = (status: 'critical' | 'warning' | 'safe') => {
    switch (status) {
      case 'critical':
        return { bg: 'rgba(255, 71, 87, 0.15)', text: Colors.danger, label: 'DUE SOON' };
      case 'warning':
        return { bg: 'rgba(255, 181, 71, 0.15)', text: Colors.accent, label: 'UPCOMING' };
      default:
        return { bg: 'rgba(0, 229, 179, 0.15)', text: Colors.primary, label: 'SCHEDULED' };
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'emi': return { name: 'card-outline', color: Colors.danger };
      case 'fdr_payout': return { name: 'cash-outline', color: Colors.primary };
      case 'sanchaypatra_coupon': return { name: 'document-text-outline', color: Colors.secondary };
      case 'salary': return { name: 'wallet-outline', color: Colors.primary };
      default: return { name: 'receipt-outline', color: Colors.accent };
    }
  };

  return (
    <View style={styles.container}>
      {events.map((evt, idx) => {
        const badge = getBadgeStyle(evt.status);
        const icon = getIcon(evt.type);
        const isCredit = evt.type === 'fdr_payout' || evt.type === 'sanchaypatra_coupon' || evt.type === 'salary';

        return (
          <GlassCard key={evt.id} style={styles.card} padding={14}>
            <View style={styles.row}>
              {/* Left Date / Icon */}
              <View style={styles.iconCol}>
                <View style={[styles.iconBg, { backgroundColor: `${icon.color}22` }]}>
                  <Ionicons name={icon.name as any} size={20} color={icon.color} />
                </View>
                <Text style={styles.daysText}>
                  {evt.daysRemaining === 0 ? 'Today' : `${evt.daysRemaining}d`}
                </Text>
              </View>

              {/* Center Info */}
              <View style={styles.infoCol}>
                <View style={styles.topInfoRow}>
                  <Text style={styles.eventTitle}>{evt.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.eventSub}>{evt.subtitle}</Text>
                <Text style={styles.eventDate}>📅 {evt.date}</Text>
              </View>

              {/* Right Amount */}
              <View style={styles.amountCol}>
                <Text
                  style={[
                    styles.amountText,
                    { color: isCredit ? Colors.primary : Colors.danger },
                  ]}
                >
                  {isCredit ? '+' : '−'}৳ {evt.amount.toLocaleString('en-IN')}
                </Text>
                {evt.isAutoDebit && (
                  <Text style={styles.autoDebitTag}>⚡ Auto-Debit</Text>
                )}
              </View>
            </View>
          </GlassCard>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconCol: {
    alignItems: 'center',
    width: 44,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  daysText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  infoCol: {
    flex: 1,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  eventSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  eventDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  autoDebitTag: {
    fontSize: 8,
    color: Colors.accent,
    fontWeight: '700',
    marginTop: 2,
  },
});
