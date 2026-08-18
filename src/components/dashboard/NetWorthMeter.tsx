import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius, Spacing } from '../../theme';

interface NetWorthMeterProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  allocation: {
    cash: number;
    fixedDeposits: number;
    savings: number;
  };
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const formatBDT = (amount: number) => {
  return amount.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
};

export const NetWorthMeter: React.FC<NetWorthMeterProps> = ({
  netWorth,
  totalAssets,
  totalLiabilities,
  allocation,
}) => {
  const animatedNetWorth = useSharedValue(0);
  const totalAlloc = allocation.cash + allocation.fixedDeposits + allocation.savings || 1;

  const widthCash = useSharedValue(0);
  const widthFDR = useSharedValue(0);
  const widthSavings = useSharedValue(0);

  useEffect(() => {
    animatedNetWorth.value = withSpring(netWorth, { duration: 1200 });
    widthCash.value = withSpring((allocation.cash / totalAlloc) * 100);
    widthFDR.value = withSpring((allocation.fixedDeposits / totalAlloc) * 100);
    widthSavings.value = withSpring((allocation.savings / totalAlloc) * 100);
  }, [netWorth, allocation, totalAlloc]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: `৳ ${formatBDT(animatedNetWorth.value)}`,
    };
  });

  const cashStyle = useAnimatedStyle(() => ({ width: `${widthCash.value}%` }));
  const fdrStyle = useAnimatedStyle(() => ({ width: `${widthFDR.value}%` }));
  const savingsStyle = useAnimatedStyle(() => ({ width: `${widthSavings.value}%` }));

  const cashPct = Math.round((allocation.cash / totalAlloc) * 100);
  const fdrPct = Math.round((allocation.fixedDeposits / totalAlloc) * 100);
  const savingsPct = Math.round((allocation.savings / totalAlloc) * 100);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F1320', '#161C2D']} style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.label}>NET WORTH</Text>
          <AnimatedTextInput
            editable={false}
            value={`৳ ${formatBDT(netWorth)}`}
            animatedProps={animatedProps}
            style={styles.amount}
          />

          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: 'rgba(0,229,179,0.1)' }]}>
              <Text style={[styles.badgeText, { color: Colors.primary }]}>
                ▲ Assets: ৳ {formatBDT(totalAssets)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(255,71,87,0.1)' }]}>
              <Text style={[styles.badgeText, { color: Colors.danger }]}>
                ▼ Liabilities: ৳ {formatBDT(totalLiabilities)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.barContainer}>
            <Animated.View style={[styles.barSegment, { backgroundColor: Colors.primary }, cashStyle]}>
              {cashPct > 15 && <Text style={styles.barText}>{cashPct}%</Text>}
            </Animated.View>
            <Animated.View style={[styles.barSegment, { backgroundColor: Colors.secondary }, fdrStyle]}>
              {fdrPct > 15 && <Text style={styles.barText}>{fdrPct}%</Text>}
            </Animated.View>
            <Animated.View style={[styles.barSegment, { backgroundColor: Colors.accent }, savingsStyle]}>
              {savingsPct > 15 && <Text style={styles.barText}>{savingsPct}%</Text>}
            </Animated.View>
          </View>

          <View style={styles.legend}>
            <LegendItem color={Colors.primary} label="Cash" value={`${cashPct}%`} />
            <LegendItem color={Colors.secondary} label="FDR" value={`${fdrPct}%`} />
            <LegendItem color={Colors.accent} label="Savings" value={`${savingsPct}%`} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const LegendItem = ({ color, label, value }: { color: string; label: string; value: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
    <Text style={styles.legendValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  card: {
    width: '100%',
  },
  content: {
    padding: Spacing.lg,
  },
  label: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  amount: {
    ...Typography.displayXL,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    padding: 0,
    margin: 0,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  barContainer: {
    height: 24,
    flexDirection: 'row',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    gap: 2,
  },
  barSegment: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  legendValue: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});
