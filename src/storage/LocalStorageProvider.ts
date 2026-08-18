import { MMKV } from 'react-native-mmkv';
import { database } from '../db/DatabaseProvider';
import * as FileSystem from 'expo-file-system';
import { encryptData, decryptData } from './EncryptionService';

const mmkv = new MMKV({ id: 'money-honey-prefs', encryptionKey: 'prefs-key' });

export class PreferencesStorage {
  getTheme(): 'light' | 'dark' | 'system' {
    return (mmkv.getString('theme') as 'light' | 'dark' | 'system') || 'system';
  }

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    mmkv.set('theme', theme);
  }

  getCurrency(): string {
    return mmkv.getString('currency') || 'BDT';
  }

  setCurrency(currency: string): void {
    mmkv.set('currency', currency);
  }

  getBiometricsEnabled(): boolean {
    return mmkv.getBoolean('biometrics_enabled') || false;
  }

  setBiometricsEnabled(enabled: boolean): void {
    mmkv.set('biometrics_enabled', enabled);
  }

  getLastSyncTime(): Date | null {
    const val = mmkv.getNumber('last_sync_time');
    return val ? new Date(val) : null;
  }

  setLastSyncTime(date: Date): void {
    mmkv.set('last_sync_time', date.getTime());
  }

  getCloudProvider(): 'google_drive' | 'firebase' | 'none' {
    return (mmkv.getString('cloud_provider') as 'google_drive' | 'firebase' | 'none') || 'none';
  }

  setCloudProvider(provider: 'google_drive' | 'firebase' | 'none'): void {
    mmkv.set('cloud_provider', provider);
  }

  getOnboardingComplete(): boolean {
    return mmkv.getBoolean('onboarding_complete') || false;
  }

  setOnboardingComplete(v: boolean): void {
    mmkv.set('onboarding_complete', v);
  }
}

export interface ImportResult {
  success: boolean;
  recordsImported: number;
  errors: string[];
}

export class BackupExporter {
  async exportEncryptedBackup(encryptionKey: string): Promise<string> {
    const tables = Object.keys(database.collections.map);
    const backupData: any = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tables: {}
    };

    for (const table of tables) {
      const collection = database.collections.get(table);
      const records = await collection.query().fetch();
      backupData.tables[table] = records.map(r => r._raw);
    }

    const jsonString = JSON.stringify(backupData);
    const encryptedString = await encryptData(jsonString, encryptionKey);
    
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `money-honey-backup-${dateStr}.ehb`;
    const filePath = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(filePath, encryptedString);
    return filePath;
  }

  async importEncryptedBackup(filePath: string, encryptionKey: string): Promise<ImportResult> {
    const result: ImportResult = { success: false, recordsImported: 0, errors: [] };
    try {
      const encryptedData = await FileSystem.readAsStringAsync(filePath);
      const decryptedString = await decryptData(encryptedData, encryptionKey);
      const backupData = JSON.parse(decryptedString);

      if (backupData.version !== '1.0') {
        result.errors.push('Unsupported schema version');
        return result;
      }

      await database.write(async () => {
        // Simple full replace: Wipes and inserts
        for (const table of Object.keys(backupData.tables)) {
          const collection = database.collections.get(table);
          // Delete existing
          const existing = await collection.query().fetch();
          const deleteOps = existing.map(record => record.prepareDestroyPermanently());
          
          // Insert new
          const newOps = backupData.tables[table].map((rawRecord: any) => {
            return collection.prepareCreate(record => {
              record._raw = rawRecord;
            });
          });
          
          await database.batch(...deleteOps, ...newOps);
          result.recordsImported += newOps.length;
        }
      });
      
      result.success = true;
    } catch (e: any) {
      result.errors.push(e.message);
    }
    return result;
  }
}

export const prefsStorage = new PreferencesStorage();
export const backupExporter = new BackupExporter();
