import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius } from '../../theme';

interface GaugeProps {
  score: number; // 0 to 100
  title: string;
  subtitle: string;
  statusLabel: string;
  statusColor?: string;
  size?: number;
}

export const RadialGauge: React.FC<GaugeProps> = ({
  score,
  title,
  subtitle,
  statusLabel,
  statusColor = Colors.primary,
  size = 180,
}) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference * 0.75; // 270 degree arc

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '135deg' }] }}>
          <Defs>
            <SvgLinearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={Colors.primary} />
              <Stop offset="100%" stopColor={statusColor} />
            </SvgLinearGradient>
          </Defs>
          {/* Background Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round"
            fill="none"
          />
          {/* Active Meter Fill */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gaugeGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
        <View style={styles.innerLabel}>
          <Text style={[styles.scoreText, { color: statusColor }]}>{Math.round(clampedScore)}%</Text>
          <Text style={styles.statusBadge}>{statusLabel}</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  innerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  title: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
