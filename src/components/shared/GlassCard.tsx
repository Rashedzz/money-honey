import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors, Radius } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  onPress?: () => void;
  padding?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  glowColor,
  onPress,
  padding = 16,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

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
      <AnimatedTouchable
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {CardContent}
      </AnimatedTouchable>
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
