import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  onPress?: () => void;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  glowColor,
  onPress,
  padding = 16,
}) => {
  const CardContent = (
    <LinearGradient
      colors={[Colors.gradientCard[0], Colors.gradientCard[1]]}
      style={[
        styles.card,
        { padding },
        glowColor ? {
          borderBottomWidth: 2,
          borderBottomColor: glowColor,
        } : undefined,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return <View>{CardContent}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0369A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    overflow: 'hidden',
  },
});
