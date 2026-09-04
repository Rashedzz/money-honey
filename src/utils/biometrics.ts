/**
 * Biometric & Hardware Authentication Service
 * Supports:
 * 1. WebAuthn / Platform Authenticator (Android Fingerprint, TouchID, FaceID)
 * 2. Native Expo Local Authentication (when available in native builds)
 * 3. Graceful fallback to Master Key / PIN
 */

import { Platform } from 'react-native';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  method: 'biometric' | 'webauthn' | 'pin' | 'bypass';
}

export class BiometricService {
  /**
   * Checks if biometric hardware / platform authenticator is available
   */
  public static async isBiometricAvailable(): Promise<boolean> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.PublicKeyCredential) {
        if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
          return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        }
        return true;
      }

      // Dynamic check for native module if bundled
      try {
        const LocalAuth = require('expo-local-authentication');
        if (LocalAuth && typeof LocalAuth.hasHardwareAsync === 'function') {
          const hasHw = await LocalAuth.hasHardwareAsync();
          const isEnrolled = await LocalAuth.isEnrolledAsync();
          return hasHw && isEnrolled;
        }
      } catch (e) {}

      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Prompts user for biometric verification (Fingerprint, Face, Pattern)
   */
  public static async authenticateWithBiometrics(
    promptMessage: string = 'Scan fingerprint or enter screen lock to unlock credentials'
  ): Promise<BiometricAuthResult> {
    try {
      // 1. Try Native Expo Local Authentication
      try {
        const LocalAuth = require('expo-local-authentication');
        if (LocalAuth && typeof LocalAuth.authenticateAsync === 'function') {
          const res = await LocalAuth.authenticateAsync({
            promptMessage,
            fallbackLabel: 'Use Master Password',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
          });
          if (res.success) {
            return { success: true, method: 'biometric' };
          } else {
            return { success: false, error: res.error || 'Authentication cancelled', method: 'biometric' };
          }
        }
      } catch (e) {}

      // 2. Try Web / PWA Platform Authenticator (WebAuthn)
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const challenge = new Uint8Array(32);
          if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(challenge);
          }

          // Request user verification using platform authenticator (Fingerprint/PIN)
          const credential = await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 60000,
              userVerification: 'preferred',
              rpId: window.location.hostname || 'localhost',
              allowCredentials: [],
            },
          });

          if (credential) {
            return { success: true, method: 'webauthn' };
          }
        } catch (webAuthnErr: any) {
          // If WebAuthn was cancelled or not registered yet, proceed to fallback
          console.log('WebAuthn prompt info:', webAuthnErr?.message);
        }
      }

      return {
        success: false,
        error: 'Biometric verification unavailable on this device browser. Please use your Master Password or PIN.',
        method: 'pin',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Biometric authentication failed',
        method: 'pin',
      };
    }
  }
}
