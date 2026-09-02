import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { FirebaseCloudSync, FIREBASE_CONFIG } from '../../services/firebaseRest';
import { FirebaseSyncService } from '../../services/firebaseSync';

interface FirebaseSyncModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  onDataRestored?: () => void;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({
  visible,
  onClose,
  userId = 'rashed01',
  onDataRestored,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<string[]>([]);

  const handleBackupToFirebase = async () => {
    setLoading(true);
    setStatusMessage('Syncing all local portfolios, accounts & loans to Firebase Firestore...');
    try {
      // First try standard Firebase SDK, fall back to REST
      let res = await FirebaseSyncService.syncAllLocalToFirebase(userId);
      if (!res.success) {
        const restRes = await FirebaseCloudSync.syncAllLocalToCloud(userId);
        res = { success: restRes.success, count: restRes.syncedCount };
      }

      if (res.success) {
        const msg = `Successfully backed up ${res.count} categories to Firebase (Project: ${FIREBASE_CONFIG.projectId})!`;
        setStatusMessage(`✓ ${msg}`);
        setSyncHistory((prev) => [`[${new Date().toLocaleTimeString()}] Backup: ${res.count} categories pushed`, ...prev]);
        Alert.alert('Cloud Sync Complete', msg);
      } else {
        const msg = `Firebase project reached, but Firestore database needs to be enabled in Firebase Console.`;
        setStatusMessage(`⚠️ ${msg}`);
        Alert.alert(
          'Firestore Setup Required',
          'Please ensure Cloud Firestore is enabled in your Firebase Console:\n1. Go to console.firebase.google.com\n2. Open money-honey-99f4d\n3. Click Build -> Firestore Database -> Create database (Start in Test mode).'
        );
      }
    } catch (e: any) {
      setStatusMessage(`Error: ${e.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromFirebase = async () => {
    setLoading(true);
    setStatusMessage('Fetching latest cloud records from Firebase Firestore...');
    try {
      let res = await FirebaseSyncService.restoreAllFromFirebase(userId);
      if (!res.success || res.count === 0) {
        const restRes = await FirebaseCloudSync.restoreAllFromCloud(userId);
        res = { success: restRes.success, count: restRes.restoredCount };
      }

      if (res.success && res.count > 0) {
        const msg = `Successfully restored ${res.count} data categories from Firebase!`;
        setStatusMessage(`✓ ${msg}`);
        setSyncHistory((prev) => [`[${new Date().toLocaleTimeString()}] Restored: ${res.count} categories downloaded`, ...prev]);
        if (onDataRestored) onDataRestored();
        Alert.alert('Cloud Restore Complete', msg);
      } else {
        setStatusMessage('No existing remote data found in Firebase for this user account.');
        Alert.alert('No Cloud Data', 'No records found in Cloud Firestore for user @' + userId);
      }
    } catch (e: any) {
      setStatusMessage(`Error: ${e.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="flame" size={24} color="#F97316" />
              </View>
              <View>
                <Text style={styles.title}>Firebase Cloud Sync Engine</Text>
                <Text style={styles.subtitle}>Project: {FIREBASE_CONFIG.projectId}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            style={{ flex: 1, width: '100%', overflowY: 'auto' as any }}
            contentContainerStyle={styles.body}
          >
            {/* Connection Status Card */}
            <View style={styles.statusBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.onlineDot} />
                <Text style={styles.statusTitle}>Firebase Connected & Ready</Text>
              </View>
              <Text style={styles.statusDetails}>
                Linked to Google Firebase App: <Text style={{ fontWeight: '800' }}>{FIREBASE_CONFIG.appId.slice(0, 20)}...</Text>
              </Text>
              <Text style={styles.statusDetails}>
                Auth Domain: <Text style={{ fontWeight: '800' }}>{FIREBASE_CONFIG.authDomain}</Text>
              </Text>
            </View>

            {/* Sync Action Buttons */}
            <View style={{ width: '100%', gap: 12, marginVertical: Spacing.md }}>
              <TouchableOpacity
                style={[styles.syncBtn, { backgroundColor: '#F97316' }]}
                onPress={handleBackupToFirebase}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                    <Text style={styles.syncBtnText}>⬆️ Backup All to Firebase Cloud</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.syncBtn, { backgroundColor: '#0284C7' }]}
                onPress={handleRestoreFromFirebase}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-download" size={20} color="#FFFFFF" />
                    <Text style={styles.syncBtnText}>⬇️ Restore All from Firebase Cloud</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Live Status Message */}
            {statusMessage ? (
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{statusMessage}</Text>
              </View>
            ) : null}

            {/* Sync Checklist & Architecture Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoHeading}>🔥 Synced Financial Modules:</Text>
              <Text style={styles.infoItem}>• 🏦 Liquid Bank Accounts (including BEFTN Routing Numbers)</Text>
              <Text style={styles.infoItem}>• 💳 Institutional Loans & Private Family Debts</Text>
              <Text style={styles.infoItem}>• 📜 Paper Assets (Sanchaypatra, FDR, DPS Certificates)</Text>
              <Text style={styles.infoItem}>• 🏠 Physical Assets (Land Plots, Gold, Commercial Flats)</Text>
              <Text style={styles.infoItem}>• 📈 Bangladesh DSE/CSE & Global Stock Portfolios</Text>
              <Text style={styles.infoItem}>• 💸 Daily Household Expenses & Cash Inflow Logs</Text>
            </View>

            {/* Cloud Setup Guidance */}
            <View style={[styles.infoCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="information-circle" size={16} color="#D97706" />
                <Text style={[styles.infoHeading, { color: '#92400E' }]}>First-Time Firestore Setup:</Text>
              </View>
              <Text style={[styles.infoItem, { color: '#78350F' }]}>
                If your project is brand new, make sure to visit{' '}
                <Text style={{ fontWeight: '800' }}>console.firebase.google.com</Text> → Select{' '}
                <Text style={{ fontWeight: '800' }}>money-honey-99f4d</Text> → Click{' '}
                <Text style={{ fontWeight: '800' }}>Build → Firestore Database → Create database</Text> (Choose Test Mode).
              </Text>
            </View>

            {/* Sync History Ledger */}
            {syncHistory.length > 0 ? (
              <View style={{ width: '100%', marginTop: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>
                  RECENT SYNC EVENTS:
                </Text>
                {syncHistory.map((item, idx) => (
                  <Text key={idx} style={{ fontSize: 11, color: '#334155', marginVertical: 1 }}>
                    {item}
                  </Text>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '96%',
    maxWidth: 580,
    height: '88vh',
    maxHeight: '90vh',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: '#FED7AA',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '700',
    marginTop: 1,
  },
  closeBtn: {
    padding: 8,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
  },
  body: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 40,
  },
  statusBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: Radius.lg,
    padding: 14,
    marginTop: 4,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#166534',
  },
  statusDetails: {
    fontSize: 11,
    color: '#334155',
    marginTop: 4,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  syncBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  messageBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: Spacing.sm,
  },
  messageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    padding: 14,
    marginTop: 8,
  },
  infoHeading: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  infoItem: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 18,
  },
});
