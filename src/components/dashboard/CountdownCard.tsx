import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../shared/GlassCard';
import { Colors, Typography, Radius, Spacing, Shadows } from '../../theme';

interface CountdownCardProps {
  title: string;
  subtitle: string;
  daysRemaining: number;
  targetDate: Date;
  amount: number;
  amountLabel: string;
  type: 'fdr' | 'sanchaypatra' | 'emi';
  urgencyLevel: 'safe' | 'warning' | 'critical';
  percentageElapsed: number;
  onPress?: () => void;
}

export const CountdownCard: React.FC<CountdownCardProps> = ({
  title,
  subtitle,
  daysRemaining,
  amount,
  amountLabel,
  type,
  urgencyLevel,
  percentageElapsed,
  onPress,
}) => {
  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'critical': return Colors.danger;
      case 'warning': return Colors.accent;
      default: return Colors.primary;
    }
  };

  const getEmoji = () => {
    switch (type) {
      case 'fdr': return '🏦';
      case 'sanchaypatra': return '📜';
      case 'emi': return '💳';
    }
  };

  const color = getUrgencyColor();

  return (
    <GlassCard
      onPress={onPress}
      style={[
        styles.card,
        urgencyLevel === 'safe' && Shadows.glow,
        urgencyLevel === 'warning' && { shadowColor: Colors.accent, shadowOpacity: 0.3, shadowRadius: 15 },
        urgencyLevel === 'critical' && { shadowColor: Colors.danger, shadowOpacity: 0.4, shadowRadius: 20 },
      ]}
      padding={0}
    >
      <View style={styles.container}>
        <View style={[styles.accentBar, { backgroundColor: color }]} />
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.emoji}>{getEmoji()}</Text>
            <Text style={styles.typeLabel}>{type.toUpperCase()}</Text>
          </View>
          
          <View style={styles.centerSection}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.daysBlock}>
              <Text style={[styles.daysNumber, { color }]}>
                {daysRemaining}
              </Text>
              <Text style={styles.daysLabel}>days</Text>
            </View>
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabelText}>{amountLabel}</Text>
              <Text style={styles.amount}>৳ {amount.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, percentageElapsed))}%`, backgroundColor: color }]} />
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 240,
    height: 160,
    marginRight: Spacing.md,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
    height: '100%',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emoji: {
    fontSize: 16,
  },
  typeLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  centerSection: {
    marginTop: Spacing.xs,
  },
  title: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
  },
  daysBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  daysNumber: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 44,
  },
  daysLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  amountBlock: {
    alignItems: 'flex-end',
  },
  amountLabelText: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
  },
  amount: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
  },
  progressBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
});
