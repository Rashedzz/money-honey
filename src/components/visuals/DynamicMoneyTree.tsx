import React, { useEffect, useRef } from 'react';
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
  style?: any;
}

export const DynamicMoneyTree: React.FC<DynamicMoneyTreeProps> = ({
  size = 48,
  rounded = true,
  style,
}) => {
  const canvasRef = useRef<any>(null);

  // Native Reanimated fallback values for mobile app runtime
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.5);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glow.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1400, easing: Easing.ease }),
          withTiming(0.5, { duration: 1400, easing: Easing.ease })
        ),
        -1,
        true
      );
      rotation.value = withRepeat(
        withSequence(
          withTiming(1.8, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1.8, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
      return;
    }

    // Web: High-definition Living Canvas Animation (Same as Favicon)
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    const TOTAL_FRAMES = 160;

    // High DPI Retina scaling
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      type: 'coin' | 'leaf';
    }
    const particles: Particle[] = [];

    const draw = () => {
      // Pause animation when tab is hidden to conserve CPU/battery
      if (typeof document !== 'undefined' && document.hidden) {
        animId = requestAnimationFrame(draw);
        return;
      }

      frame = (frame + 1) % TOTAL_FRAMES;
      const w = size;
      const h = size;

      ctx.clearRect(0, 0, w, h);

      // Coordinate scaling relative to base 64x64 design
      const scaleFactor = size / 64;
      const groundY = 54 * scaleFactor;

      // Draw rich soil / base
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.ellipse(w / 2, groundY + 4 * scaleFactor, 26 * scaleFactor, 6 * scaleFactor, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.ellipse(w / 2, groundY + 2 * scaleFactor, 24 * scaleFactor, 4 * scaleFactor, 0, 0, Math.PI * 2);
      ctx.fill();

      // STAGE 1: Coin Planting (Frames 0 - 35)
      if (frame < 35) {
        const coinProgress = Math.min(1, frame / 25);
        const coinY = (10 + coinProgress * (54 - 24)) * scaleFactor;
        const coinPulse = Math.sin(frame * 0.3) * 1.5 * scaleFactor;

        // Golden Coin dropping
        ctx.save();
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 8 * scaleFactor;
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(w / 2, coinY, (7 + (frame > 25 ? coinPulse : 0)) * scaleFactor, 0, Math.PI * 2);
        ctx.fill();

        // Inner gold rim
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.5 * scaleFactor;
        ctx.beginPath();
        ctx.arc(w / 2, coinY, 5 * scaleFactor, 0, Math.PI * 2);
        ctx.stroke();

        // Currency symbol ৳ on coin
        ctx.fillStyle = '#78350F';
        ctx.font = `bold ${Math.max(6, Math.floor(7 * scaleFactor))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('৳', w / 2, coinY + 0.5 * scaleFactor);
        ctx.restore();

        // Soil ripples upon impact
        if (frame > 20) {
          const ripple = (frame - 20) * 1.2 * scaleFactor;
          ctx.strokeStyle = `rgba(0, 229, 179, ${Math.max(0, 1 - ripple / (15 * scaleFactor))})`;
          ctx.lineWidth = 1.5 * scaleFactor;
          ctx.beginPath();
          ctx.ellipse(w / 2, groundY, ripple, ripple * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // STAGE 2: Sprouting & Tree Growth (Frames 30 - 75)
      const growProgress = frame < 30 ? 0 : Math.min(1, (frame - 30) / 40);

      if (growProgress > 0) {
        const trunkHeight = 32 * scaleFactor * growProgress;
        const trunkTop = groundY - trunkHeight;

        // Wind sway
        const isWindStage = frame >= 70;
        const windIntensity = isWindStage ? Math.sin((frame - 70) * 0.12) : 0;
        const swayX = windIntensity * 4.5 * scaleFactor;

        // Tree Trunk
        ctx.save();
        ctx.strokeStyle = '#854D0E';
        ctx.fillStyle = '#A16207';
        ctx.lineWidth = (4 + (1 - growProgress) * 2) * scaleFactor;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(w / 2, groundY);
        ctx.quadraticCurveTo(w / 2 + swayX * 0.4, groundY - trunkHeight * 0.5, w / 2 + swayX, trunkTop);
        ctx.stroke();

        // Branches
        if (growProgress > 0.4) {
          const branchGrowth = (growProgress - 0.4) / 0.6;
          ctx.lineWidth = 2.5 * scaleFactor;

          // Left branch
          ctx.beginPath();
          ctx.moveTo(w / 2 + swayX * 0.6, groundY - trunkHeight * 0.55);
          ctx.quadraticCurveTo(
            w / 2 - 8 * scaleFactor + swayX * 0.8,
            groundY - trunkHeight * 0.7,
            w / 2 - 14 * branchGrowth * scaleFactor + swayX,
            trunkTop + (4 - 6 * branchGrowth) * scaleFactor
          );
          ctx.stroke();

          // Right branch
          ctx.beginPath();
          ctx.moveTo(w / 2 + swayX * 0.7, groundY - trunkHeight * 0.65);
          ctx.quadraticCurveTo(
            w / 2 + 8 * scaleFactor + swayX * 0.9,
            groundY - trunkHeight * 0.75,
            w / 2 + 15 * branchGrowth * scaleFactor + swayX,
            trunkTop + (2 - 8 * branchGrowth) * scaleFactor
          );
          ctx.stroke();
        }
        ctx.restore();

        // Foliage Canopy & Golden Fruit
        if (growProgress > 0.5) {
          const leafScale = (growProgress - 0.5) / 0.5;
          const canopyRadius = 18 * scaleFactor * leafScale;

          ctx.save();
          ctx.shadowColor = '#00E5B3';
          ctx.shadowBlur = (isWindStage ? 10 : 6) * scaleFactor;

          const gradient = ctx.createRadialGradient(
            w / 2 + swayX - 2 * scaleFactor,
            trunkTop - 4 * scaleFactor,
            2 * scaleFactor,
            w / 2 + swayX,
            trunkTop - 4 * scaleFactor,
            canopyRadius
          );
          gradient.addColorStop(0, '#00E5B3');
          gradient.addColorStop(0.6, '#10B981');
          gradient.addColorStop(1, '#047857');
          ctx.fillStyle = gradient;

          // Center cluster
          ctx.beginPath();
          ctx.arc(w / 2 + swayX, trunkTop - 4 * scaleFactor, canopyRadius * 0.75, 0, Math.PI * 2);
          ctx.fill();

          // Left cluster
          ctx.beginPath();
          ctx.arc(w / 2 - 10 * leafScale * scaleFactor + swayX, trunkTop + 2 * scaleFactor, canopyRadius * 0.6, 0, Math.PI * 2);
          ctx.fill();

          // Right cluster
          ctx.beginPath();
          ctx.arc(w / 2 + 11 * leafScale * scaleFactor + swayX, trunkTop, canopyRadius * 0.62, 0, Math.PI * 2);
          ctx.fill();

          // Top apex cluster
          ctx.beginPath();
          ctx.arc(w / 2 + swayX * 1.1, trunkTop - 12 * leafScale * scaleFactor, canopyRadius * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Golden Money Leaves / Coins on the branches
          const coinPositions = [
            { x: w / 2 - 9 * scaleFactor + swayX, y: trunkTop - 2 * scaleFactor },
            { x: w / 2 + 9 * scaleFactor + swayX, y: trunkTop - 4 * scaleFactor },
            { x: w / 2 + swayX, y: trunkTop - 14 * scaleFactor },
            { x: w / 2 - 4 * scaleFactor + swayX, y: trunkTop + 4 * scaleFactor },
            { x: w / 2 + 6 * scaleFactor + swayX, y: trunkTop + 5 * scaleFactor },
          ];

          for (let idx = 0; idx < coinPositions.length; idx++) {
            const pos = coinPositions[idx];
            const shimmer = Math.sin(frame * 0.2 + idx) * 0.3 + 0.7;
            ctx.save();
            ctx.fillStyle = `rgba(251, 191, 36, ${shimmer})`;
            ctx.shadowColor = '#F59E0B';
            ctx.shadowBlur = 6 * scaleFactor;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 3.8 * leafScale * scaleFactor, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#78350F';
            ctx.lineWidth = 0.8 * scaleFactor;
            ctx.stroke();

            ctx.fillStyle = '#78350F';
            ctx.font = `bold ${Math.max(4, Math.floor(4.5 * scaleFactor))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('৳', pos.x, pos.y);
            ctx.restore();
          }
        }

        // STAGE 3: Wind breeze lines (Frames 75 - 160)
        if (isWindStage) {
          const windCycle = ((frame - 75) % 40) / 40;
          const windX = (windCycle * (64 + 20) - 10) * scaleFactor;

          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1.2 * scaleFactor;
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.moveTo(windX - 15 * scaleFactor, 16 * scaleFactor);
          ctx.quadraticCurveTo(windX, 12 * scaleFactor, windX + 18 * scaleFactor, 15 * scaleFactor);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(windX - 25 * scaleFactor, 28 * scaleFactor);
          ctx.quadraticCurveTo(windX - 10 * scaleFactor, 24 * scaleFactor, windX + 12 * scaleFactor, 27 * scaleFactor);
          ctx.stroke();
          ctx.restore();
        }

        // STAGE 4: Falling Golden Money Leaves / Coins (Frames 95 - 155)
        if (frame >= 95 && frame < 155) {
          if (frame % 8 === 0 && particles.length < 14) {
            particles.push({
              x: w / 2 + (Math.random() * 20 - 10) * scaleFactor,
              y: trunkTop + Math.random() * 8 * scaleFactor,
              vx: (0.6 + Math.random() * 0.8) * scaleFactor,
              vy: (0.8 + Math.random() * 0.6) * scaleFactor,
              size: (3 + Math.random() * 2) * scaleFactor,
              opacity: 1,
              type: Math.random() > 0.3 ? 'coin' : 'leaf',
            });
          }
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx + Math.sin(frame * 0.15 + i) * 0.4 * scaleFactor;
        p.y += p.vy;
        p.opacity -= 0.015;

        if (p.y >= groundY - 2 * scaleFactor || p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        if (p.type === 'coin') {
          ctx.fillStyle = '#FBBF24';
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 4 * scaleFactor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 0.8 * scaleFactor;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#00E5B3';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 1.2, p.size * 0.6, frame * 0.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [size]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` },
    ],
    shadowOpacity: glow.value,
  }));

  const borderRadius = rounded ? size / 4 : 0;

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.wrapper,
          { width: size, height: size, borderRadius },
          style,
        ]}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: size,
            height: size,
            borderRadius,
            display: 'block',
          }}
        />
      </View>
    );
  }

  // Native Mobile Fallback
  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      <Animated.View
        style={[
          styles.container,
          { width: size, height: size, borderRadius },
          animatedStyle,
        ]}
      >
        <Image
          source={require('../../../assets/icon.png')}
          style={{ width: size, height: size, borderRadius }}
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
    overflow: 'hidden',
  },
  container: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    elevation: 6,
    overflow: 'hidden',
  },
});
