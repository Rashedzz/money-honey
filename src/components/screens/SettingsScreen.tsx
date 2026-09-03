import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import { LifeInsurancePolicy, BirthdayEvent } from '../../finance/insuranceBirthday';
import { useAuth } from '../../auth/AuthContext';
import { triggerTestNotification, sendSystemNotification } from '../../notifications/birthdayNotifier';

interface SettingsScreenProps {
  birthDate: string;
  onUpdateBirthDate: (date: string) => void;
  policies: LifeInsurancePolicy[];
  birthdays: BirthdayEvent[];
  onAddPolicy: () => void;
  onAddBirthday: (b?: BirthdayEvent) => void;
  onDeleteBirthday?: (id: string) => void;
}

const AVATAR_OPTIONS = ['👨‍💼', '👩‍💼', '🦁', '🦅', '👑', '🚀', '💎', '⚡'];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  birthDate,
  onUpdateBirthDate,
  policies,
  birthdays,
  onAddPolicy,
  onAddBirthday,
  onDeleteBirthday,
}) => {
  const {
    user,
    isOnline,
    autoCloudBackup,
    lastBackupTime,
    isPasswordConfigured,
    updateProfile,
    changeCredentials,
    exportLocalBackup,
    restoreLocalBackup,
    toggleAutoCloudBackup,
    triggerManualCloudBackup,
  } = useAuth();

  // Profile Form State
  const [name, setName] = useState(user?.name || 'Rashed Zaman');
  const [email, setEmail] = useState(user?.email || 'sm.rashed.zaman@gmail.com');
  const [userId, setUserId] = useState(user?.id || 'rashed01');
  const [dob, setDob] = useState(birthDate || user?.birthDate || '1985-11-18');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '👨‍💼');
  const [customPhoto, setCustomPhoto] = useState(user?.photoUri || '');
  const [profileSavedMsg, setProfileSavedMsg] = useState('');
  const fileInputRef = useRef<any>(null);

  // Password & Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [secQuestion, setSecQuestion] = useState(
    user?.securityQuestion1 || 'What was your first school or hometown?'
  );
  const [secAnswer, setSecAnswer] = useState(user?.securityAnswer1 || '');
  const [secSavedMsg, setSecSavedMsg] = useState('');
  const [secErrorMsg, setSecErrorMsg] = useState('');

  // Add Birthday Inline Form State
  const [bName, setBName] = useState('');
  const [bRelation, setBRelation] = useState('');
  const [bDate, setBDate] = useState('');
  const [bDaysBefore, setBDaysBefore] = useState('3');
  const [bBudget, setBBudget] = useState('');
  const [bAddOpen, setBAddOpen] = useState(false);
  const [notifTestStatus, setNotifTestStatus] = useState('');

  // Cloud Backup State
  const [backupMsg, setBackupMsg] = useState('');
  const [restoreInput, setRestoreInput] = useState('');
  const [showRestoreBox, setShowRestoreBox] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.id) setUserId(user.id);
      if (user.avatar) setSelectedAvatar(user.avatar);
      if (user.photoUri !== undefined) setCustomPhoto(user.photoUri);
      if (user.birthDate) setDob(user.birthDate);
    }
  }, [user]);

  const triggerImagePicker = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      fileInputRef.current?.click();
    } else {
      Alert.alert('Upload Photo', 'To upload your profile photo, please open Money-Honey in a web browser or modern mobile device.');
    }
  };

  const handlePhotoFileChange = (event: any) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      Alert.alert('Image Too Large', 'Please select an image smaller than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        if (typeof window !== 'undefined') {
          const img = new (window as any).Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 320;
            let w = img.width;
            let h = img.height;
            if (w > h) {
              if (w > maxDim) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              }
            } else {
              if (h > maxDim) {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setCustomPhoto(compressed);
          };
          img.src = dataUrl;
        } else {
          setCustomPhoto(dataUrl);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      onUpdateBirthDate(dob);
      const res = await updateProfile({
        name: name.trim() || 'Rashed Zaman',
        email: email.trim(),
        avatar: selectedAvatar,
        photoUri: customPhoto,
        birthDate: dob,
      });
      if (res.success) {
        setProfileSavedMsg('Profile and photo successfully saved!');
        Alert.alert(
          'Profile Saved',
          'Your legal name, recovery email, birthdate, and profile picture have been updated and permanently saved.'
        );
        setTimeout(() => setProfileSavedMsg(''), 4000);
      } else {
        Alert.alert('Save Failed', res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred while saving.');
    }
  };

  const handleUpdateSecurity = async () => {
    setSecSavedMsg('');
    setSecErrorMsg('');

    if (newPassword || userId !== user?.id) {
      if (isPasswordConfigured && !currentPassword) {
        setSecErrorMsg('Current password required to change User ID or Password.');
        return;
      }
      const credRes = await changeCredentials(currentPassword, userId, newPassword || undefined);
      if (!credRes.success) {
        setSecErrorMsg(credRes.error || 'Failed to update credentials.');
        return;
      }
    }

    if (secAnswer) {
      await updateProfile({
        securityQuestion1: secQuestion,
        securityAnswer1: secAnswer,
      });
    }

    setCurrentPassword('');
    setNewPassword('');
    setSecSavedMsg('Master password & security credentials saved successfully!');
    Alert.alert('Security Saved', 'Master password and recovery security questions saved successfully!');
    setTimeout(() => setSecSavedMsg(''), 3500);
  };

  const handleSaveNewBirthday = () => {
    if (!bName.trim() || !bDate.trim()) {
      Alert.alert('Error', 'Please enter Name and Birth Date (YYYY-MM-DD).');
      return;
    }

    const newEvent: BirthdayEvent = {
      id: `BD-${Date.now()}`,
      personName: bName.trim(),
      relation: (bRelation.trim() as any) || 'Friend',
      birthDate: bDate.trim(),
      giftBudget: parseFloat(bBudget) || 5000,
      notifyDaysBefore: parseInt(bDaysBefore, 10) || 3,
    };

    onAddBirthday(newEvent);
    Alert.alert('Birthday Saved', `Birthday for ${newEvent.personName} saved with reminders!`);
    setBName('');
    setBRelation('');
    setBDate('');
    setBBudget('');
    setBAddOpen(false);
  };

  const handleTestNotification = async () => {
    setNotifTestStatus('Sending notification...');
    const ok = await triggerTestNotification();
    if (ok) {
      setNotifTestStatus('✅ Real notification dispatched to your device!');
    } else {
      setNotifTestStatus('⚠️ Please enable browser notification permissions in your URL bar.');
    }
    setTimeout(() => setNotifTestStatus(''), 4000);
  };

  const handleManualBackup = async () => {
    const res = await triggerManualCloudBackup();
    setBackupMsg(res.message);
    setTimeout(() => setBackupMsg(''), 4000);
  };

  const handleRestoreSubmit = () => {
    if (!restoreInput.trim()) return;
    const res = restoreLocalBackup(restoreInput);
    if (res.success) {
      Alert.alert('Backup Restored', 'All financial tables and user profile successfully restored! Reloading page...');
      if (typeof window !== 'undefined') window.location.reload();
    } else {
      Alert.alert('Restore Failed', res.error || 'Invalid backup format.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Profile & Avatar Card */}
      <GlassCard style={styles.card} padding={20} glowColor={Colors.primary}>
        {/* Hidden Web File Input */}
        {Platform.OS === 'web' && (
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoFileChange}
          />
        )}

        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarLarge}
            onPress={triggerImagePicker}
            activeOpacity={0.8}
          >
            {customPhoto ? (
              <Image source={{ uri: customPhoto }} style={styles.avatarPhoto} />
            ) : (
              <Text style={{ fontSize: 36 }}>{selectedAvatar}</Text>
            )}
            <View style={styles.avatarCameraBadge}>
              <Ionicons name="camera" size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileMeta}>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userRole}>
              User ID: @{user?.id || 'rashed01'} • Wealth Suite Master
            </Text>
            {/* Real Photo Upload & Remove Buttons */}
            <View style={styles.photoActionRow}>
              <TouchableOpacity
                style={styles.uploadPhotoBtn}
                onPress={triggerImagePicker}
                activeOpacity={0.85}
              >
                <Ionicons name="camera" size={14} color="#FFFFFF" />
                <Text style={styles.uploadPhotoBtnText}>
                  {customPhoto ? 'Change Photo' : 'Upload Real Photo'}
                </Text>
              </TouchableOpacity>
              {customPhoto ? (
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => setCustomPhoto('')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="trash-outline" size={13} color="#EF4444" />
                  <Text style={styles.removePhotoBtnText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {profileSavedMsg ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text style={styles.successBannerText}>{profileSavedMsg}</Text>
          </View>
        ) : null}

        {/* Avatar Picker */}
        <Text style={styles.inputLabel}>SELECT PROFILE AVATAR</Text>
        <View style={styles.avatarGrid}>
          {AVATAR_OPTIONS.map((av) => (
            <TouchableOpacity
              key={av}
              style={[styles.avatarChoice, selectedAvatar === av && styles.avatarChoiceActive]}
              onPress={() => setSelectedAvatar(av)}
            >
              <Text style={{ fontSize: 20 }}>{av}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inputs */}
        <Text style={styles.inputLabel}>FULL LEGAL NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.inputLabel}>EMAIL ADDRESS (RECOVERY)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="e.g. rashed@example.com"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>DATE OF BIRTH (DRIVES WEALTH VELOCITY CLOCK)</Text>
        <TextInput
          style={styles.input}
          value={dob}
          onChangeText={setDob}
          placeholder="YYYY-MM-DD (e.g. 1992-05-15)"
          placeholderTextColor="#94A3B8"
        />
        <Text style={styles.helperText}>
          ⚡ Your birthdate calculates lifetime minutes lived, income earned per minute, and hourly burn rate.
        </Text>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Profile Settings</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* 2. Security, Password & Account Recovery Vault */}
      <GlassCard style={styles.card} padding={20} glowColor={Colors.secondary}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: Colors.secondary }]}>
              🔐 SECURITY, CREDENTIALS & ACCOUNT RECOVERY
            </Text>
            <Text style={styles.sectionSub}>Change ID, password, and setup security questions for phone loss recovery</Text>
          </View>
        </View>

        {!isPasswordConfigured && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={18} color="#0284C7" />
            <Text style={styles.infoBannerText}>
              First-Time Password Setup: You have not configured a master password yet. Enter your desired New Password below to protect your account (Current Password is not required).
            </Text>
          </View>
        )}

        {secSavedMsg ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text style={styles.successBannerText}>{secSavedMsg}</Text>
          </View>
        ) : null}

        {secErrorMsg ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorBannerText}>{secErrorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.inputLabel}>CHANGE USER ID / LOGIN NAME</Text>
            <TextInput
              style={styles.input}
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              placeholder="New User ID"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.col}>
            <Text style={styles.inputLabel}>
              {isPasswordConfigured ? 'NEW PASSWORD (OPTIONAL)' : 'SET MASTER PASSWORD *'}
            </Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder={isPasswordConfigured ? 'Leave blank to keep same' : 'Enter new master password'}
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {isPasswordConfigured ? (
          <>
            <Text style={styles.inputLabel}>CURRENT PASSWORD (REQUIRED TO SAVE CREDENTIAL CHANGES) *</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Enter current password"
              placeholderTextColor="#94A3B8"
            />
          </>
        ) : (
          <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: '700', marginBottom: 6 }}>
            ✓ First-Time Setup: No previous password exists. Enter your new password above and save!
          </Text>
        )}

        {/* Security Questions Recovery */}
        <View style={styles.divider} />
        <Text style={[styles.inputLabel, { color: '#0284C7' }]}>
          SECURITY QUESTION (FOR RECOVERY IF PHONE IS LOST)
        </Text>
        <TextInput
          style={styles.input}
          value={secQuestion}
          onChangeText={setSecQuestion}
          placeholder="e.g. What was your first school or hometown?"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.inputLabel}>SECURITY QUESTION ANSWER *</Text>
        <TextInput
          style={styles.input}
          value={secAnswer}
          onChangeText={setSecAnswer}
          placeholder="Enter private answer"
          placeholderTextColor="#94A3B8"
        />
        <Text style={styles.helperText}>
          🛡️ If you lose your phone or forget your password, answering this question will instantly unlock and restore your account.
        </Text>

        <TouchableOpacity style={styles.saveGreenBtn} onPress={handleUpdateSecurity} activeOpacity={0.85}>
          <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>Update Credentials & Security Question</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* 3. Local Storage & Cloud Backup System */}
      <GlassCard style={styles.card} padding={20} glowColor={Colors.accent}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: Colors.accent }]}>
              💾 LOCAL-FIRST STORAGE & CLOUD BACKUP
            </Text>
            <Text style={styles.sectionSub}>All records stay private on this device with optional cloud snapshots</Text>
          </View>
        </View>

        {backupMsg ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text style={styles.successBannerText}>{backupMsg}</Text>
          </View>
        ) : null}

        <View style={styles.storageStatusBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: isOnline ? '#16A34A' : '#F59E0B' }} />
            <View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
                {isOnline ? '🟢 Local Device Active • Cloud Online' : '🟠 Offline Mode • Local Device Only'}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                Last Encrypted Snapshot: {lastBackupTime || 'Never'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.sm }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>
              Auto-Backup to Cloud when Online
            </Text>
            <Switch
              value={autoCloudBackup}
              onValueChange={toggleAutoCloudBackup}
              trackColor={{ false: '#CBD5E1', true: '#16A34A' }}
            />
          </View>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.actionOutlineBtn} onPress={handleManualBackup} activeOpacity={0.85}>
            <Ionicons name="cloud-upload-outline" size={18} color="#0284C7" />
            <Text style={styles.actionOutlineText}>Upload Cloud Snapshot</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionOutlineBtn}
            onPress={() => setShowRestoreBox(!showRestoreBox)}
            activeOpacity={0.85}
          >
            <Ionicons name="cloud-download-outline" size={18} color="#0284C7" />
            <Text style={styles.actionOutlineText}>Restore Snapshot</Text>
          </TouchableOpacity>
        </View>

        {showRestoreBox && (
          <View style={{ marginTop: Spacing.md, gap: 8 }}>
            <Text style={styles.inputLabel}>PASTE ENCRYPTED BACKUP JSON</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              multiline
              value={restoreInput}
              onChangeText={setRestoreInput}
              placeholder="Paste JSON content from your downloaded backup file..."
              placeholderTextColor="#94A3B8"
            />
            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestoreSubmit}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                Execute Full Database Restore
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </GlassCard>

      {/* 4. Friends & Family Birthday Reminder & Notification System */}
      <GlassCard style={styles.card} padding={20} glowColor="#F59E0B">
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: '#B45309' }]}>
              🎂 FRIENDS & FAMILY BIRTHDAY REMINDER VAULT ({birthdays.length})
            </Text>
            <Text style={styles.sectionSub}>Set up birthday alerts with lead time notifications & gift planning</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.addSmallBtn, { backgroundColor: '#F59E0B' }]}
              onPress={handleTestNotification}
              activeOpacity={0.85}
            >
              <Ionicons name="notifications-outline" size={14} color="#FFFFFF" />
              <Text style={styles.addSmallText}>🔔 Test Notification</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addSmallBtn, { backgroundColor: '#16A34A' }]}
              onPress={() => setBAddOpen(!bAddOpen)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.addSmallText}>{bAddOpen ? 'Close' : '+ Add Birthday'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {notifTestStatus ? (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={16} color="#0284C7" />
            <Text style={styles.infoBannerText}>{notifTestStatus}</Text>
          </View>
        ) : null}

        {/* Add Birthday Form */}
        {bAddOpen && (
          <View style={styles.addBirthdayForm}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>
              Record Friend or Family Birthday
            </Text>

            <View style={styles.twoCol}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>PERSON'S NAME *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sarah Rahman"
                  placeholderTextColor="#94A3B8"
                  value={bName}
                  onChangeText={setBName}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.inputLabel}>RELATIONSHIP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Spouse, Child, Friend"
                  placeholderTextColor="#94A3B8"
                  value={bRelation}
                  onChangeText={setBRelation}
                />
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>BIRTH DATE (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1994-08-24"
                  placeholderTextColor="#94A3B8"
                  value={bDate}
                  onChangeText={setBDate}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.inputLabel}>REMIND DAYS BEFORE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3 or 7"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={bDaysBefore}
                  onChangeText={setBDaysBefore}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>GIFT BUDGET (৳)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15000"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={bBudget}
              onChangeText={setBBudget}
            />

            <TouchableOpacity style={styles.saveGreenBtn} onPress={handleSaveNewBirthday} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Birthday & Schedule Alerts</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Birthday Items List */}
        {birthdays.length === 0 ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Text style={{ color: '#64748B', fontStyle: 'italic', fontSize: 13 }}>
              No family or friends birthdays registered yet. Click "+ Add Birthday" above.
            </Text>
          </View>
        ) : (
          <View style={styles.itemList}>
            {birthdays.map((b) => (
              <View key={b.id} style={styles.subItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{b.personName}</Text>
                  <Text style={styles.itemMeta}>
                    {b.relation} • Date: {b.birthDate} • Remind: {b.notifyDaysBefore || 3} days ahead
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={styles.reminderBadge}>
                    <Text style={styles.reminderText}>
                      Gift: ৳{(b.giftBudget || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  {onDeleteBirthday && (
                    <TouchableOpacity onPress={() => onDeleteBirthday(b.id)}>
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </GlassCard>

      {/* 5. Software Architecture: PWA & Standalone APK Status */}
      <GlassCard style={styles.card} padding={20} glowColor="#0284C7">
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: '#0284C7' }]}>
              📱 PWA & STANDALONE ANDROID APK STATUS
            </Text>
            <Text style={styles.sectionSub}>Mobile packaging and progressive web application status</Text>
          </View>
        </View>

        <View style={styles.architectureBox}>
          <View style={styles.archItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                PWA (Progressive Web App): ACTIVE
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 18 }}>
              • Standalone display mode configured in app.json{'\n'}
              • Dynamic Money Tree icon & animated living favicon{'\n'}
              • Installable directly from Chrome / Safari / Edge via "Add to Home Screen"
            </Text>
          </View>

          <View style={[styles.archItem, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="cube-outline" size={20} color="#0284C7" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                Standalone Android APK: READY
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 18 }}>
              • EAS Build configured in eas.json under preview profile: buildType = apk{'\n'}
              • Run command in terminal to produce direct .apk file:{'\n'}
              <Text style={{ fontWeight: '800', color: '#0284C7' }}>npx eas build -p android --profile preview</Text>
            </Text>
          </View>
        </View>
      </GlassCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2FE',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  card: {
    width: '100%',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: Spacing.md,
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0284C7',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  photoActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  uploadPhotoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removePhotoBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  profileMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  userRole: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '700',
    marginTop: 2,
  },
  avatarGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  avatarChoice: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarChoiceActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: Spacing.xs,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 15,
    marginBottom: Spacing.xs,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  divider: {
    height: 1.5,
    backgroundColor: '#E2E8F0',
    marginVertical: Spacing.md,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  saveBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveGreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  addSmallText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  successBannerText: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '700',
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
    marginBottom: Spacing.sm,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  infoBannerText: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '700',
  },
  storageStatusBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    padding: 14,
    marginBottom: Spacing.sm,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.xs,
  },
  actionOutlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  actionOutlineText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  restoreBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  addBirthdayForm: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: Spacing.md,
  },
  itemList: {
    gap: Spacing.xs,
  },
  subItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemMeta: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  reminderBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  reminderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  architectureBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: Radius.md,
    padding: 14,
    gap: 12,
  },
  archItem: {
    gap: 4,
  },
});
