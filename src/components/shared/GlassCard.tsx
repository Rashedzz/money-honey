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
        glowColor && {
          borderBottomWidth: 2,
          borderBottomColor: glowColor,
        },
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
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
});
