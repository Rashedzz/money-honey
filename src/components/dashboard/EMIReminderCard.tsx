import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { GlassCard } from '../shared/GlassCard';
import { Colors, Typography, Radius, Spacing } from '../../theme';

interface EMIReminderCardProps {
  loanTitle: string;
  bankName: string;
  emiAmount: number;
  dueDate: Date;
  paymentNumber: number;
  totalPayments: number;
  outstandingPrincipal: number;
  onMarkPaid?: () => void;
  onViewSchedule?: () => void;
}

export const EMIReminderCard: React.FC<EMIReminderCardProps> = ({
  loanTitle,
  bankName,
  emiAmount,
  dueDate,
  paymentNumber,
  totalPayments,
  outstandingPrincipal,
  onMarkPaid,
  onViewSchedule,
}) => {
  const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;

  let glowColor = Colors.border;
  let badgeText = 'UPCOMING';
  let badgeColor = Colors.textMuted;

  if (isOverdue) {
    glowColor = Colors.danger;
    badgeText = 'OVERDUE';
    badgeColor = Colors.danger;
  } else if (isDueSoon) {
    glowColor = Colors.accent;
    badgeText = 'DUE SOON';
    badgeColor = Colors.accent;
  }

  return (
    <GlassCard style={styles.card} padding={Spacing.lg} glowColor={glowColor}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.loanTitle}>{loanTitle}</Text>
          <Text style={styles.bankName}>{bankName}</Text>
        </View>
        <View style={[styles.badge, { borderColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(paymentNumber / totalPayments) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{paymentNumber}/{totalPayments}</Text>
      </View>

      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Monthly EMI</Text>
        <Text style={styles.emiAmount}>৳ {emiAmount.toLocaleString('en-IN')}</Text>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.dateText}>📅 Due {format(dueDate, 'EEE, d MMM yyyy')}</Text>
        <Text style={styles.outstandingText}>
          Outstanding Principal: ৳ {outstandingPrincipal.toLocaleString('en-IN')}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.buttonContainer} onPress={onMarkPaid}>
          <LinearGradient colors={Colors.gradientGreen} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>✓ Mark as Paid</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onViewSchedule}>
          <Text style={styles.secondaryButtonText}>View Schedule →</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  loanTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bankName: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0284C7',
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emiAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  detailsRow: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  outstandingText: {
    fontSize: 13,
    color: '#64748B',
  },
  actions: {
    gap: Spacing.sm,
  },
  buttonContainer: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  primaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#0284C7',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
  },
});
