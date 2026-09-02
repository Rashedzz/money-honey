/**
 * Firebase Firestore Direct REST Client & Synchronization Engine
 * Lightweight, zero-dependency cloud sync using Google Firestore v1 REST API.
 * Project: money-honey-99f4d
 */

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCv_1bO4D-dcCLT1j9Ml-_iNsd26rVi7Ag',
  authDomain: 'money-honey-99f4d.firebaseapp.com',
  projectId: 'money-honey-99f4d',
  storageBucket: 'money-honey-99f4d.firebasestorage.app',
  messagingSenderId: '154073288283',
  appId: '1:154073288283:web:0c72f2fd2e02044c03797e',
  measurementId: 'G-P5WYHRQQ6C',
};

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

export type FirebaseDataType =
  | 'bank_accounts'
  | 'loans'
  | 'paper_assets'
  | 'physical_assets'
  | 'stocks'
  | 'incomes'
  | 'expenses'
  | 'policies'
  | 'birthdays';

const STORAGE_MAP: Record<FirebaseDataType, string> = {
  bank_accounts: 'mh_user_bank_accounts',
  loans: 'mh_user_loans',
  paper_assets: 'mh_user_paper_assets',
  physical_assets: 'mh_user_assets',
  stocks: 'mh_portfolio_stocks',
  incomes: 'mh_user_incomes',
  expenses: 'mh_user_expenses',
  policies: 'mh_user_policies',
  birthdays: 'mh_user_birthdays',
};

export class FirebaseCloudSync {
  /**
   * Pushes local records to Firebase Cloud Firestore
   */
  public static async pushCategory(
    dataType: FirebaseDataType,
    data: any,
    userId: string = 'rashed01'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${BASE_URL}/users/${userId}/data/${dataType}?key=${FIREBASE_CONFIG.apiKey}`;
      const payload = {
        fields: {
          payloadJson: { stringValue: JSON.stringify(data) },
          updatedAt: { stringValue: new Date().toISOString() },
          device: { stringValue: typeof window !== 'undefined' ? 'web_pwa' : 'mobile' },
        },
      };

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: errText };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  /**
   * Pulls remote records from Firebase Cloud Firestore to local storage
   */
  public static async pullCategory(
    dataType: FirebaseDataType,
    userId: string = 'rashed01'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = `${BASE_URL}/users/${userId}/data/${dataType}?key=${FIREBASE_CONFIG.apiKey}`;
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: errText };
      }

      const json = await res.json();
      const stringified = json.fields?.payloadJson?.stringValue;
      if (stringified) {
        const parsed = JSON.parse(stringified);
        const localKey = STORAGE_MAP[dataType];
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(localKey, JSON.stringify(parsed));
        }
        return { success: true, data: parsed };
      }

      return { success: true, data: null };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  /**
   * Full Backup to Cloud: Syncs all local storage to Firebase Cloud
   */
  public static async syncAllLocalToCloud(
    userId: string = 'rashed01'
  ): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    let syncedCount = 0;
    const errors: string[] = [];

    for (const [dataType, key] of Object.entries(STORAGE_MAP)) {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const res = await this.pushCategory(dataType as FirebaseDataType, parsed, userId);
            if (res.success) syncedCount++;
            else if (res.error) errors.push(`${dataType}: ${res.error}`);
          } catch (e: any) {
            errors.push(`${dataType}: ${e.message}`);
          }
        }
      }
    }

    return { success: errors.length === 0, syncedCount, errors };
  }

  /**
   * Full Restore from Cloud: Restores all records from Firebase Firestore
   */
  public static async restoreAllFromCloud(
    userId: string = 'rashed01'
  ): Promise<{ success: boolean; restoredCount: number; errors: string[] }> {
    let restoredCount = 0;
    const errors: string[] = [];

    for (const dataType of Object.keys(STORAGE_MAP)) {
      const res = await this.pullCategory(dataType as FirebaseDataType, userId);
      if (res.success && res.data) {
        restoredCount++;
      } else if (res.error) {
        errors.push(`${dataType}: ${res.error}`);
      }
    }

    return { success: errors.length === 0, restoredCount, errors };
  }
}
