import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertButton,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '../../theme';

interface DialogPayload {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface ToastPayload {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

type DialogListener = (payload: DialogPayload) => void;
type ToastListener = (payload: ToastPayload) => void;

let dialogListener: DialogListener | null = null;
let toastListener: ToastListener | null = null;

/**
 * Cross-platform alert & confirmation dialog that works identically
 * on Desktop Web, Mobile PWA (iOS/Android), and Native apps.
 */
export function showAppAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (dialogListener) {
    dialogListener({ title, message, buttons });
    return;
  }
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  if (typeof window !== 'undefined') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message || ''}`);
      if (confirmed) {
        const actionBtn = buttons.find((b) => b.style !== 'cancel') || buttons[1];
        actionBtn?.onPress?.();
      } else {
        const cancelBtn = buttons.find((b) => b.style === 'cancel') || buttons[0];
        cancelBtn?.onPress?.();
      }
    } else {
      window.alert(`${title}${message ? `\n\n${message}` : ''}`);
      buttons?.[0]?.onPress?.();
    }
  }
}

export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'success'
): void {
  if (toastListener) {
    toastListener({ id: Date.now(), message, type });
  }
}

// Install global Alert.alert bridge on Web so all existing Alert.alert calls
// across every screen work reliably on both Laptop browsers and Mobile PWAs.
let isAlertPatched = false;
export function installWebAlertBridge(): void {
  if (Platform.OS === 'web' && !isAlertPatched) {
    isAlertPatched = true;
    try {
      (Alert as any).alert = (
        title: string,
        message?: string,
        buttons?: AlertButton[]
      ) => {
        showAppAlert(title, message, buttons);
      };
    } catch (e) {
      // Ignore if Alert object is frozen
    }
  }
}

export const GlobalDialogHost: React.FC = () => {
  const [dialog, setDialog] = useState<DialogPayload | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    installWebAlertBridge();
    dialogListener = (payload) => setDialog(payload);
    toastListener = (payload) => {
      setToast(payload);
    };
    return () => {
      dialogListener = null;
      toastListener = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast((prev) => (prev?.id === toast.id ? null : prev));
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const buttons: AlertButton[] =
    dialog?.buttons && dialog.buttons.length > 0
      ? dialog.buttons
      : [{ text: 'OK', style: 'default' }];

  const isDestructive = buttons.some((b) => b.style === 'destructive');
  const isErrorTitle =
    dialog?.title?.toLowerCase().includes('error') ||
    dialog?.title?.toLowerCase().includes('required') ||
    dialog?.title?.toLowerCase().includes('fail') ||
    dialog?.title?.toLowerCase().includes('incomplete');

  return (
    <>
      {/* Non-blocking Toast Notification Banner */}
      {toast && (
        <View style={styles.toastWrapper} pointerEvents="box-none">
          <View
            style={[
              styles.toastCard,
              toast.type === 'error' && styles.toastCardError,
              toast.type === 'info' && styles.toastCardInfo,
            ]}
          >
            <Ionicons
              name={
                toast.type === 'error'
                  ? 'alert-circle'
                  : toast.type === 'info'
                  ? 'information-circle'
                  : 'checkmark-circle'
              }
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.toastText}>{toast.message}</Text>
            <TouchableOpacity onPress={() => setToast(null)}>
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Executive Confirmation & Feedback Modal */}
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={() => setDialog(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View
                style={[
                  styles.iconBadge,
                  isDestructive || isErrorTitle
                    ? styles.iconBadgeDanger
                    : styles.iconBadgePrimary,
                ]}
              >
                <Ionicons
                  name={
                    isDestructive
                      ? 'trash-outline'
                      : isErrorTitle
                      ? 'alert-circle-outline'
                      : 'checkmark-circle-outline'
                  }
                  size={20}
                  color={isDestructive || isErrorTitle ? '#DC2626' : '#0F172A'}
                />
              </View>
              <Text style={styles.title}>{dialog?.title}</Text>
            </View>

            {!!dialog?.message && (
              <Text style={styles.message}>{dialog.message}</Text>
            )}

            <View style={styles.buttonRow}>
              {buttons.map((btn, idx) => {
                const isCancel = btn.style === 'cancel';
                const isDelete = btn.style === 'destructive';
                return (
                  <TouchableOpacity
                    key={`${btn.text || 'btn'}-${idx}`}
                    style={[
                      styles.btn,
                      isCancel
                        ? styles.btnCancel
                        : isDelete
                        ? styles.btnDestructive
                        : styles.btnPrimary,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      const callback = btn.onPress;
                      setDialog(null);
                      if (callback) {
                        setTimeout(() => callback(), 20);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        isCancel ? styles.btnTextCancel : styles.btnTextSolid,
                      ]}
                    >
                      {btn.text || 'OK'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgePrimary: {
    backgroundColor: '#F1F5F9',
  },
  iconBadgeDanger: {
    backgroundColor: '#FEF2F2',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    marginBottom: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
  },
  btn: {
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnPrimary: {
    backgroundColor: '#0F172A',
  },
  btnDestructive: {
    backgroundColor: '#DC2626',
  },
  btnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  btnTextCancel: {
    color: '#334155',
  },
  btnTextSolid: {
    color: '#FFFFFF',
  },
  toastWrapper: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.full,
    maxWidth: 480,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  toastCardError: {
    backgroundColor: '#DC2626',
  },
  toastCardInfo: {
    backgroundColor: '#1E293B',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    flexShrink: 1,
  },
});
