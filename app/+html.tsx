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
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        {/* Expo Scroll Reset */}
        <ScrollViewStyleReset />

        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('Money-Honey PWA Service Worker active:', reg.scope);
                  }).catch(function(err) {
                    console.warn('Money-Honey PWA Service Worker failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
