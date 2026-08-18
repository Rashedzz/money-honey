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
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bankName: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    ...Typography.label,
    fontSize: 9,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  amountLabel: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  emiAmount: {
    ...Typography.displayL,
    color: Colors.textPrimary,
  },
  detailsRow: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: 4,
  },
  dateText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  outstandingText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  actions: {
    gap: Spacing.sm,
  },
  buttonContainer: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  primaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...Typography.body,
    fontWeight: '700',
    color: '#000',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderActive,
    borderRadius: Radius.md,
  },
  secondaryButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
});
