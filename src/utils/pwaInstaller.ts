/**
 * PWA Registration & Install Engine
 * Ensures manifest.json and Service Worker are linked, enables Chrome/Edge "Install App" icon
 */

let deferredInstallPrompt: any = null;

export function initPwaSupport() {
  if (typeof window === 'undefined') return;

  // 1. Ensure <link rel="manifest" href="/manifest.json" /> in <head>
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.json';
    document.head.appendChild(link);
  }

  // 2. Ensure apple-touch-icon
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = '/icons/icon-192.png';
    document.head.appendChild(appleIcon);
  }

  // 3. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Money-Honey PWA Service Worker active:', reg.scope);
        })
        .catch((err) => {
          console.warn('Money-Honey PWA Service Worker register failed:', err);
        });
    });
  }

  // 4. Capture native browser install prompt
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log('PWA: Native install prompt ready to trigger');
  });
}

export function canPromptNativeInstall(): boolean {
  return deferredInstallPrompt !== null;
}

export async function promptNativeInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  try {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return outcome === 'accepted';
  } catch (e) {
    console.warn('Native install prompt failed:', e);
    return false;
  }
}
