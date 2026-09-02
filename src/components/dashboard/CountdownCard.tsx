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
    width: 270,
    height: 175,
    marginRight: Spacing.md,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  accentBar: {
    width: 5,
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
    fontSize: 18,
  },
  typeLabel: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '800',
    letterSpacing: 1,
  },
  centerSection: {
    marginTop: Spacing.xs,
  },
  title: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '800',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
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
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 46,
  },
  daysLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  amountBlock: {
    alignItems: 'flex-end',
  },
  amountLabelText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  amount: {
    fontSize: 16,
    color: '#0284C7',
    fontWeight: '900',
    marginTop: 2,
  },
  progressBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
});
