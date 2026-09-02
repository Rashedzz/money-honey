import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { DynamicMoneyTree } from '../visuals/DynamicMoneyTree';

interface PwaInstallModalProps {
  visible: boolean;
  onClose: () => void;
  appUrl?: string;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  visible,
  onClose,
  appUrl = 'https://rashedzz.github.io/money-honey/',
}) => {
  const [copied, setCopied] = useState(false);

  // Dynamic QR Code URL using high-reliability QR code image endpoint
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    appUrl
  )}&bgcolor=0F172A&color=22C55E&margin=1`;

  const handleCopyLink = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const [canInstallDirectly, setCanInstallDirectly] = useState(
    typeof window !== 'undefined' && !!(window as any).deferredPWAInstallPrompt
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleInstallable = () => setCanInstallDirectly(true);
      window.addEventListener('pwa-installable', handleInstallable);
      return () => window.removeEventListener('pwa-installable', handleInstallable);
    }
  }, []);

  const handleDirectInstall = () => {
    if (typeof window !== 'undefined' && (window as any).deferredPWAInstallPrompt) {
      (window as any).deferredPWAInstallPrompt.prompt();
      (window as any).deferredPWAInstallPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted PWA installation');
        }
        (window as any).deferredPWAInstallPrompt = null;
        setCanInstallDirectly(false);
      });
    } else {
      Alert.alert(
        'Install Money-Honey',
        'In your browser top address bar, click the Install App icon (⊕ or computer icon) or click the browser menu (⋮) → "Install Money-Honey" / "Add to Home Screen".'
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <DynamicMoneyTree size={38} />
              <View>
                <Text style={styles.title}>Install App on Laptop & Phone</Text>
                <Text style={styles.subtitle}>Install as standalone desktop/mobile app</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            style={{ flex: 1, width: '100%', overflowY: 'auto' as any }}
            contentContainerStyle={styles.body}
          >
            {/* Direct 1-Click Install Button */}
            <TouchableOpacity
              style={styles.directInstallBtn}
              onPress={handleDirectInstall}
              activeOpacity={0.85}
            >
              <Ionicons name="download" size={20} color="#FFFFFF" />
              <Text style={styles.directInstallBtnText}>
                {canInstallDirectly ? '📥 Install App on this Device Now' : '📥 1-Click Install Money-Honey'}
              </Text>
            </TouchableOpacity>

            {/* QR Code Container */}
            <View style={styles.qrCard}>
              <Image
                source={{ uri: qrCodeUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              <Text style={styles.scanHint}>
                Scan with your phone camera to open & install instantly
              </Text>
            </View>

            {/* URL Copy Box */}
            <View style={styles.urlBox}>
              <Text style={styles.urlText} numberOfLines={1}>
                {appUrl}
              </Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={14}
                  color="#0F172A"
                />
                <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy Link'}</Text>
              </TouchableOpacity>
            </View>

            {/* Step-by-Step Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionHeader}>HOW TO INSTALL AS APP:</Text>

              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>1</Text>
                <Text style={styles.stepText}>
                  <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>Android (Chrome):</Text> Tap the 3 dots (⋮) menu at top right, then tap <Text style={{ color: Colors.primary, fontWeight: '700' }}>"Install app"</Text> or "Add to Home screen".
                </Text>
              </View>

              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>2</Text>
                <Text style={styles.stepText}>
                  <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>iPhone / iPad (Safari):</Text> Tap the Share button (<Ionicons name="share-outline" size={12} color={Colors.textPrimary} />), scroll down and tap <Text style={{ color: Colors.primary, fontWeight: '700' }}>"Add to Home Screen"</Text>.
                </Text>
              </View>

              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>3</Text>
                <Text style={styles.stepText}>
                  <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>Laptop / Desktop:</Text> Click the install icon in the address bar to install as a standalone desktop app.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '96%',
    maxWidth: 480,
    maxHeight: '90vh',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    padding: Spacing.xl,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#0369A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    padding: 8,
    borderRadius: Radius.full,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  body: {
    alignItems: 'center',
    width: '100%',
  },
  directInstallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  directInstallBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  qrCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    marginBottom: Spacing.md,
    width: '100%',
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  scanHint: {
    textAlign: 'center',
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
    marginBottom: Spacing.md,
    gap: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  instructions: {
    width: '100%',
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  instructionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#BAE6FD',
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
  },
  stepText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
