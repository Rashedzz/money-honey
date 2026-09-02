import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface DynamicMoneyTreeProps {
  size?: number;
  rounded?: boolean;
}

export const DynamicMoneyTree: React.FC<DynamicMoneyTreeProps> = ({
  size = 48,
  rounded = true,
}) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.4);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Subtle organic heartbeat / breathing animation for the living money tree
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Glowing aura shimmer
    glow.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1400, easing: Easing.ease }),
        withTiming(0.4, { duration: 1400, easing: Easing.ease })
      ),
      -1,
      true
    );

    // Gentle micro-sway
    rotation.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1.8, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` },
    ],
    shadowOpacity: glow.value,
  }));

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.container,
          { width: size, height: size, borderRadius: rounded ? size / 4 : 0 },
          animatedStyle,
        ]}
      >
        <Image
          source={require('../../../assets/icon.png')}
          style={{ width: size, height: size, borderRadius: rounded ? size / 4 : 0 }}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    elevation: 6,
    overflow: 'hidden',
  },
});
