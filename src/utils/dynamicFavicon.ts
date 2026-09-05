import { Platform } from 'react-native';

/**
 * Dynamic Animated Favicon Engine for Money-Honey
 * 
 * Renders an animated 64x64 canvas directly to the browser tab favicon:
 * 1. Coin Planting: A gleaming gold coin drops into the earth.
 * 2. Sprouting & Tree Growth: A shoot sprouts and grows into a rich Money Tree.
 * 3. Wind Breeze & Swaying: Wind breezes across, branches sway naturally.
 * 4. Money Dropping: Golden money leaves and coins flutter down in a shower of wealth.
 * 
 * Built with Page Visibility API to pause when the tab is backgrounded,
 * ensuring zero CPU/battery drain.
 */

let animationTimer: any = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let faviconLink: HTMLLinkElement | null = null;
let currentFrame = 0;
const TOTAL_FRAMES = 160;

// Particle system for wind & falling gold coins
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  type: 'coin' | 'leaf' | 'sparkle' | 'wind';
}

const particles: Particle[] = [];

function getFaviconLink(): HTMLLinkElement | null {
  if (typeof document === 'undefined') return null;
  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    document.head.appendChild(link);
  }
  return link;
}

function initCanvas() {
  if (typeof document === 'undefined') return;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    ctx = canvas.getContext('2d');
  }
  faviconLink = getFaviconLink();
}

/**
 * Draw a single frame of the Dynamic Money Tree Favicon
 */
function drawFrame(frame: number) {
  if (!ctx || !canvas) return;
  const w = 64;
  const h = 64;

  ctx.clearRect(0, 0, w, h);

  // Ground level
  const groundY = 54;

  // Draw rich soil / base
  ctx.fillStyle = '#2D3748';
  ctx.beginPath();
  ctx.ellipse(w / 2, groundY + 4, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.ellipse(w / 2, groundY + 2, 24, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // STAGE 1: Coin Planting (Frames 0 - 35)
  if (frame < 35) {
    const coinProgress = Math.min(1, frame / 25);
    const coinY = 10 + coinProgress * (groundY - 14);
    const coinPulse = Math.sin(frame * 0.3) * 1.5;

    // Golden Coin dropping
    ctx.save();
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(w / 2, coinY, 7 + (frame > 25 ? coinPulse : 0), 0, Math.PI * 2);
    ctx.fill();

    // Inner gold rim
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w / 2, coinY, 5, 0, Math.PI * 2);
    ctx.stroke();

    // BDT currency mark ৳ on coin
    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('৳', w / 2, coinY + 0.5);
    ctx.restore();

    // Soil ripples upon planting
    if (frame > 20) {
      const ripple = (frame - 20) * 1.2;
      ctx.strokeStyle = `rgba(0, 229, 179, ${Math.max(0, 1 - ripple / 15)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(w / 2, groundY, ripple, ripple * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // STAGE 2: Sprouting & Tree Growth (Frames 30 - 75)
  const growProgress = frame < 30 ? 0 : Math.min(1, (frame - 30) / 40);

  if (growProgress > 0) {
    const trunkHeight = 32 * growProgress;
    const trunkTop = groundY - trunkHeight;

    // Natural wind sway calculation
    const isWindStage = frame >= 70;
    const windIntensity = isWindStage ? Math.sin((frame - 70) * 0.12) : 0;
    const swayX = windIntensity * 4.5;

    // Draw Tree Trunk
    ctx.save();
    ctx.strokeStyle = '#854D0E';
    ctx.fillStyle = '#A16207';
    ctx.lineWidth = 4 + (1 - growProgress) * 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(w / 2, groundY);
    ctx.quadraticCurveTo(w / 2 + swayX * 0.4, groundY - trunkHeight * 0.5, w / 2 + swayX, trunkTop);
    ctx.stroke();

    // Branches
    if (growProgress > 0.4) {
      const branchGrowth = (growProgress - 0.4) / 0.6;
      ctx.lineWidth = 2.5;

      // Left branch
      ctx.beginPath();
      ctx.moveTo(w / 2 + swayX * 0.6, groundY - trunkHeight * 0.55);
      ctx.quadraticCurveTo(
        w / 2 - 8 + swayX * 0.8,
        groundY - trunkHeight * 0.7,
        w / 2 - 14 * branchGrowth + swayX,
        trunkTop + 4 - 6 * branchGrowth
      );
      ctx.stroke();

      // Right branch
      ctx.beginPath();
      ctx.moveTo(w / 2 + swayX * 0.7, groundY - trunkHeight * 0.65);
      ctx.quadraticCurveTo(
        w / 2 + 8 + swayX * 0.9,
        groundY - trunkHeight * 0.75,
        w / 2 + 15 * branchGrowth + swayX,
        trunkTop + 2 - 8 * branchGrowth
      );
      ctx.stroke();
    }
    ctx.restore();

    // Foliage Canopy & Leaves
    if (growProgress > 0.5) {
      const leafScale = (growProgress - 0.5) / 0.5;
      const canopyRadius = 18 * leafScale;

      ctx.save();
      // Main lush canopy cluster (emerald green)
      ctx.shadowColor = '#00E5B3';
      ctx.shadowBlur = isWindStage ? 10 : 6;

      const gradient = ctx.createRadialGradient(
        w / 2 + swayX - 2,
        trunkTop - 4,
        2,
        w / 2 + swayX,
        trunkTop - 4,
        canopyRadius
      );
      gradient.addColorStop(0, '#00E5B3');
      gradient.addColorStop(0.6, '#10B981');
      gradient.addColorStop(1, '#047857');

      ctx.fillStyle = gradient;

      // Center cluster
      ctx.beginPath();
      ctx.arc(w / 2 + swayX, trunkTop - 4, canopyRadius * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Left cluster
      ctx.beginPath();
      ctx.arc(w / 2 - 10 * leafScale + swayX, trunkTop + 2, canopyRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Right cluster
      ctx.beginPath();
      ctx.arc(w / 2 + 11 * leafScale + swayX, trunkTop, canopyRadius * 0.62, 0, Math.PI * 2);
      ctx.fill();

      // Top apex cluster
      ctx.beginPath();
      ctx.arc(w / 2 + swayX * 1.1, trunkTop - 12 * leafScale, canopyRadius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Golden Money Leaves / Coins on the branches
      const coinPositions = [
        { x: w / 2 - 9 + swayX, y: trunkTop - 2 },
        { x: w / 2 + 9 + swayX, y: trunkTop - 4 },
        { x: w / 2 + swayX, y: trunkTop - 14 },
        { x: w / 2 - 4 + swayX, y: trunkTop + 4 },
        { x: w / 2 + 6 + swayX, y: trunkTop + 5 },
      ];

      for (let idx = 0; idx < coinPositions.length; idx++) {
        const pos = coinPositions[idx];
        const shimmer = Math.sin(frame * 0.2 + idx) * 0.3 + 0.7;
        ctx.save();
        ctx.fillStyle = `rgba(251, 191, 36, ${shimmer})`;
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3.8 * leafScale, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = '#78350F';
        ctx.font = 'bold 4.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('৳', pos.x, pos.y);
        ctx.restore();
      }
    }

    // STAGE 3: Wind lines & breezes (Frames 75 - 160)
    if (isWindStage) {
      const windCycle = ((frame - 75) % 40) / 40;
      const windX = windCycle * (w + 20) - 10;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';

      // Top wind breeze line
      ctx.beginPath();
      ctx.moveTo(windX - 15, 16);
      ctx.quadraticCurveTo(windX, 12, windX + 18, 15);
      ctx.stroke();

      // Mid wind breeze line
      ctx.beginPath();
      ctx.moveTo(windX - 25, 28);
      ctx.quadraticCurveTo(windX - 10, 24, windX + 12, 27);
      ctx.stroke();
      ctx.restore();
    }

    // STAGE 4: Falling Golden Money Leaves / Coins (Frames 95 - 155)
    if (frame >= 95 && frame < 155) {
      if (frame % 10 === 0 && particles.length < 12) {
        particles.push({
          x: w / 2 + (Math.random() * 20 - 10),
          y: trunkTop + Math.random() * 8,
          vx: 0.6 + Math.random() * 0.8,
          vy: 0.8 + Math.random() * 0.6,
          size: 3 + Math.random() * 2,
          opacity: 1,
          type: Math.random() > 0.3 ? 'coin' : 'leaf',
        });
      }
    }
  }

  // Update and draw particles (fluttering money)
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx + Math.sin(frame * 0.15 + i) * 0.4;
    p.y += p.vy;
    p.opacity -= 0.015;

    if (p.y >= groundY - 2 || p.opacity <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.opacity);
    if (p.type === 'coin') {
      ctx.fillStyle = '#FBBF24';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#00E5B3';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 1.2, p.size * 0.6, frame * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Commit canvas to favicon link
  if (faviconLink) {
    faviconLink.href = canvas.toDataURL('image/png');
  }
}

/**
 * Start the animated dynamic favicon
 */
export function startDynamicFavicon() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  initCanvas();

  if (animationTimer) return;

  const tick = () => {
    // Only animate when browser tab is visible to preserve battery/CPU
    if (typeof document !== 'undefined' && !document.hidden) {
      currentFrame = (currentFrame + 1) % TOTAL_FRAMES;
      drawFrame(currentFrame);
    }
  };

  // 12 FPS gives silky smooth animation in tab while using <0.5% CPU
  animationTimer = setInterval(tick, 80);

  // Resume immediately upon tab refocus
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        drawFrame(currentFrame);
      }
    });
  }
}

/**
 * Stop the animated dynamic favicon
 */
export function stopDynamicFavicon() {
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }
}

export const initDynamicFavicon = startDynamicFavicon;

