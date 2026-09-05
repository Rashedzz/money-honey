/**
 * PWA Registration & Install Engine
 * Ensures manifest.json and Service Worker are linked, enables Chrome/Edge "Install App" icon
 */

let deferredInstallPrompt: any = null;

export function initPwaSupport() {
  if (typeof window === 'undefined') return;

  const isGhPages = window.location.pathname.indexOf('/money-honey') === 0;
  const basePath = isGhPages ? '/money-honey' : '';

  // 1. Ensure <link rel="manifest" href=".../manifest.json" /> in <head>
  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }
  manifestLink.href = basePath + '/manifest.json';

  // 2. Ensure apple-touch-icon
  let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
  if (!appleIcon) {
    appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleIcon);
  }
  appleIcon.href = basePath + '/icon-192.png';

  // 3. Register Service Worker with exact scope
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(basePath + '/sw.js', { scope: basePath + '/' })
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
    (window as any).deferredPWAInstallPrompt = e;
    window.dispatchEvent(new Event('pwa-installable'));
    console.log('PWA: Native install prompt ready to trigger');
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    (window as any).deferredPWAInstallPrompt = null;
    console.log('PWA: App successfully installed standalone');
  });

  (window as any).promptPWAInstall = promptNativeInstall;
}

export function canPromptNativeInstall(): boolean {
  return deferredInstallPrompt !== null || (typeof window !== 'undefined' && !!(window as any).deferredPWAInstallPrompt);
}

export async function promptNativeInstall(): Promise<boolean> {
  const prompt = deferredInstallPrompt || (typeof window !== 'undefined' ? (window as any).deferredPWAInstallPrompt : null);
  if (!prompt) return false;
  try {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredInstallPrompt = null;
    if (typeof window !== 'undefined') (window as any).deferredPWAInstallPrompt = null;
    return outcome === 'accepted';
  } catch (e) {
    console.warn('Native install prompt failed:', e);
    return false;
  }
}
