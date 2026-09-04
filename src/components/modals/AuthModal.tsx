import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { DynamicMoneyTree } from '../visuals/DynamicMoneyTree';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { login, register, getSecurityQuestion, recoverPassword, user, isOnline } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'recover'>('login');

  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Recovery State
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (tab === 'login') {
      const res = await login(userId, password);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Login failed.');
      } else {
        onClose();
      }
    } else if (tab === 'register') {
      const res = await register(userId, name, password);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Registration failed.');
      } else {
        onClose();
      }
    }
  };

  const handleFetchQuestion = async () => {
    setErrorMsg('');
    if (!userId.trim()) {
      setErrorMsg('Please enter your User ID.');
      return;
    }
    setLoading(true);
    const res = await getSecurityQuestion(userId);
    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSecurityQuestion(res.question1 || 'What was your first school or hometown?');
      setRecoveryStep(2);
    }
  };

  const handleExecuteRecovery = async () => {
    setErrorMsg('');
    if (!securityAnswer.trim() || !newPassword.trim()) {
      setErrorMsg('Please fill in the security answer and your new password.');
      return;
    }
    setLoading(true);
    const res = await recoverPassword(userId, securityAnswer, newPassword);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Recovery failed.');
    } else {
      setSuccessMsg('Password successfully reset! You are now logged in.');
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header with Dynamic Money Tree */}
          <View style={styles.header}>
            <DynamicMoneyTree size={52} />
            <Text style={styles.appTitle}>Money-Honey</Text>
            <Text style={styles.appTag}>Personal Wealth Security & Access Control</Text>
          </View>

          {/* Local vs Online Storage Pill */}
          <View style={styles.storageStatusPill}>
            <Ionicons
              name={isOnline ? 'cloud-done' : 'save-outline'}
              size={14}
              color={isOnline ? '#16A34A' : '#F59E0B'}
            />
            <Text style={styles.storageStatusText}>
              {isOnline
                ? '🌐 Online Available • Local-First Storage Active'
                : '🟢 Offline Ready • All data saved locally on this device'}
            </Text>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
              onPress={() => {
                setTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, tab === 'login' && styles.tabBtnTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
              onPress={() => {
                setTab('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, tab === 'register' && styles.tabBtnTextActive]}>
                Create ID
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tab === 'recover' && styles.tabBtnActive]}
              onPress={() => {
                setTab('recover');
                setErrorMsg('');
                setSuccessMsg('');
                setRecoveryStep(1);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, tab === 'recover' && styles.tabBtnTextActive]}>
                Recovery
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error & Success Messages */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              <Text style={styles.successBannerText}>{successMsg}</Text>
            </View>
          ) : null}

          <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
            {tab !== 'recover' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>USER ID / USERNAME *</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="person-outline" size={18} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. rashed01"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      value={userId}
                      onChangeText={setUserId}
                    />
                  </View>
                </View>

                {tab === 'register' && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>FULL NAME *</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="person-outline" size={18} color="#64748B" />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Rashed Rahman"
                        placeholderTextColor="#94A3B8"
                        value={name}
                        onChangeText={setName}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>PASSWORD *</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ padding: 4 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {tab === 'login' && (
                  <TouchableOpacity
                    onPress={() => {
                      setTab('recover');
                      setErrorMsg('');
                    }}
                    style={styles.forgotLink}
                  >
                    <Text style={styles.forgotLinkText}>Forgot ID or Password? Tap here</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Ionicons
                    name={tab === 'login' ? 'log-in-outline' : 'person-add-outline'}
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.submitBtnText}>
                    {loading
                      ? 'Authenticating...'
                      : tab === 'login'
                      ? 'Sign In to Wealth Suite'
                      : 'Create & Register Account'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Account Recovery Flow */}
            {tab === 'recover' && (
              <View style={{ width: '100%' }}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>ENTER YOUR USER ID *</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="person-outline" size={18} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. rashed01"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      value={userId}
                      onChangeText={setUserId}
                    />
                  </View>
                </View>

                {recoveryStep === 1 ? (
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleFetchQuestion}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    <Ionicons name="search-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>
                      {loading ? 'Verifying...' : 'Find Security Question'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={styles.questionCard}>
                      <Text style={styles.questionLabel}>YOUR SECURITY QUESTION:</Text>
                      <Text style={styles.questionText}>{securityQuestion}</Text>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.inputLabel}>YOUR SECURITY ANSWER *</Text>
                      <View style={styles.inputBox}>
                        <Ionicons name="key-outline" size={18} color="#64748B" />
                        <TextInput
                          style={styles.input}
                          placeholder="Your answer"
                          placeholderTextColor="#94A3B8"
                          value={securityAnswer}
                          onChangeText={setSecurityAnswer}
                        />
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.inputLabel}>NEW PASSWORD *</Text>
                      <View style={styles.inputBox}>
                        <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry={!showPassword}
                          value={newPassword}
                          onChangeText={setNewPassword}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={handleExecuteRecovery}
                      activeOpacity={0.85}
                      disabled={loading}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>
                        {loading ? 'Resetting...' : 'Reset Password & Log In'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </ScrollView>

          {user && (
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Continue as {user.name} ({user.id})</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#0369A1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  appTag: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
    marginTop: 1,
  },
  storageStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginVertical: Spacing.sm,
  },
  storageStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: Radius.full,
    padding: 4,
    width: '100%',
    marginVertical: Spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  tabBtnActive: {
    backgroundColor: '#16A34A', // Vibrant Green Button
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    width: '100%',
    marginBottom: Spacing.sm,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    width: '100%',
    marginBottom: Spacing.sm,
  },
  successBannerText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '800',
    flex: 1,
  },
  fieldGroup: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0F172A',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.sm,
    paddingVertical: 2,
  },
  forgotLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A', // Green Action Button
    width: '100%',
    paddingVertical: 13,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  questionCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: Spacing.md,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 3,
  },
  cancelBtn: {
    marginTop: Spacing.sm,
    paddingVertical: 6,
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
});
