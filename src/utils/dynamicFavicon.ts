import { Platform } from 'react-native';

/**
 * Dynamic Animated Favicon Controller
 * Animates a living aura and shimmering money leaf gleam on the browser favicon
 */
export const initDynamicFavicon = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    const img = new (window as any).Image();
    img.src = '/assets/favicon.png';
    img.crossOrigin = 'anonymous';

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;

    img.onload = () => {
      const render = () => {
        ctx.clearRect(0, 0, 64, 64);

        // Draw base money tree
        ctx.drawImage(img, 0, 0, 64, 64);

        // Shimmer sparkle phase
        const pulse = (Math.sin(frame * 0.08) + 1) / 2; // 0 to 1
        const xPos = 14 + pulse * 36;
        const yPos = 12 + Math.cos(frame * 0.06) * 10;

        // Draw dynamic golden gleam / star sparkle on the money leaves
        ctx.save();
        ctx.fillStyle = `rgba(255, 235, 100, ${0.4 + pulse * 0.6})`;
        ctx.beginPath();
        ctx.arc(xPos, yPos, 3 + pulse * 2, 0, Math.PI * 2);
        ctx.fill();

        // Second subtle coin glint
        const xPos2 = 46 - pulse * 20;
        const yPos2 = 18 + pulse * 8;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (1 - pulse) * 0.7})`;
        ctx.beginPath();
        ctx.arc(xPos2, yPos2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        link!.href = canvas.toDataURL('image/png');
        frame++;
        requestAnimationFrame(render);
      };

      requestAnimationFrame(render);
    };
  } catch (err) {
    // Graceful fallback if canvas is restricted
  }
};
