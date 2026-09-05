import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML shell for Money-Honey on Web.
 * Connects Web App Manifest and Service Worker for true PWA Installability (Chrome/Edge/Android/iOS)
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover"
        />
        <title>Money-Honey — Wealth Architecture & BD Stock Market AI</title>

        {/* PWA & Mobile Meta Tags */}
        <meta name="theme-color" content="#0284C7" />
        <meta name="application-name" content="Money-Honey" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Money-Honey" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Icons & Manifest */}
        <link rel="manifest" id="pwa-manifest" href="./manifest.json" />
        <link rel="icon" type="image/png" href="./favicon.png" />
        <link rel="apple-touch-icon" href="./icon-192.png" />

        {/* Expo Scroll Reset */}
        <ScrollViewStyleReset />

        {/* PWA Service Worker Registration & Install Prompt Capture */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                // Redirect /money-honey to /money-honey/ for correct relative base scope
                if (window.location.pathname === '/money-honey') {
                  window.location.replace('/money-honey/' + window.location.search + window.location.hash);
                }

                var isGhPages = window.location.pathname.indexOf('/money-honey') === 0;
                var basePath = isGhPages ? '/money-honey' : '';

                // Immediately sync manifest & icons to subpath
                var manifestElem = document.getElementById('pwa-manifest');
                if (manifestElem && isGhPages) {
                  manifestElem.setAttribute('href', basePath + '/manifest.json');
                }

                // 1. Capture PWA deferred install prompt for Chrome/Edge/Mobile
                window.deferredPWAInstallPrompt = null;
                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.deferredPWAInstallPrompt = e;
                  window.dispatchEvent(new Event('pwa-installable'));
                  console.log('Money-Honey: PWA Install Prompt captured and ready!');
                });

                window.addEventListener('appinstalled', function() {
                  window.deferredPWAInstallPrompt = null;
                  console.log('Money-Honey: App successfully installed standalone!');
                });

                // 2. Dynamic Service Worker Registration
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    var swUrl = basePath + '/sw.js';
                    navigator.serviceWorker.register(swUrl, { scope: basePath + '/' })
                      .then(function(reg) {
                        console.log('Money-Honey PWA Service Worker active:', reg.scope);
                      })
                      .catch(function(err) {
                        console.warn('Money-Honey PWA Service Worker registration:', err);
                      });
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
