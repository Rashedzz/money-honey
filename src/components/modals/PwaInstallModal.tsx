import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="phone-portrait-outline" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Install on Mobile Phone</Text>
                <Text style={styles.subtitle}>Scan QR or copy link to install PWA app</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
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
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0F172A',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.heading,
    fontSize: 15,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 11,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  body: {
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: '#1E293B',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 11,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    marginBottom: Spacing.md,
    gap: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  copyBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  instructions: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  instructionHeader: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.primary,
    marginBottom: 4,
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
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: Colors.primary,
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
