/**
 * Firebase Firestore Cloud Sync Engine
 * Direct Cloud Synchronization with money-honey-99f4d
 * Built on high-reliability REST API to guarantee zero bundler resolution errors.
 */

import { FirebaseCloudSync, FirebaseDataType, FIREBASE_CONFIG } from './firebaseRest';

export type SyncDataType = FirebaseDataType;

export class FirebaseSyncService {
  /**
   * Pushes a specific data category to Firestore
   */
  public static async pushCategory(
    userId: string = 'rashed01',
    dataType: SyncDataType,
    payload: any
  ): Promise<boolean> {
    const res = await FirebaseCloudSync.pushCategory(dataType, payload, userId);
    return res.success;
  }

  /**
   * Pulls a specific data category from Firestore and saves to local storage
   */
  public static async pullCategory(
    userId: string = 'rashed01',
    dataType: SyncDataType
  ): Promise<any | null> {
    const res = await FirebaseCloudSync.pullCategory(dataType, userId);
    return res.success ? res.data : null;
  }

  /**
   * Syncs ALL local categories to Firebase in one operation
   */
  public static async syncAllLocalToFirebase(
    userId: string = 'rashed01'
  ): Promise<{ success: boolean; count: number }> {
    const res = await FirebaseCloudSync.syncAllLocalToCloud(userId);
    return { success: res.success, count: res.syncedCount };
  }

  /**
   * Pulls ALL categories from Firebase and restores local storage
   */
  public static async restoreAllFromFirebase(
    userId: string = 'rashed01'
  ): Promise<{ success: boolean; count: number }> {
    const res = await FirebaseCloudSync.restoreAllFromCloud(userId);
    return { success: res.success, count: res.restoredCount };
  }
}
