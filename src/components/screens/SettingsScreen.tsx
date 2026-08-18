import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import { LifeInsurancePolicy, BirthdayEvent } from '../../finance/insuranceBirthday';

interface SettingsScreenProps {
  birthDate: string;
  onUpdateBirthDate: (date: string) => void;
  policies: LifeInsurancePolicy[];
  birthdays: BirthdayEvent[];
  onAddPolicy: () => void;
  onAddBirthday: () => void;
}

const AVATAR_OPTIONS = ['👨‍💼', '👩‍💼', '🦁', '🦅', '👑', '🚀', '💎', '⚡'];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  birthDate,
  onUpdateBirthDate,
  policies,
  birthdays,
  onAddPolicy,
  onAddBirthday,
}) => {
  const [userName, setUserName] = useState('Rashed Rahman');
  const [userEmail, setUserEmail] = useState('rashed@example.com');
  const [dob, setDob] = useState(birthDate);
  const [selectedAvatar, setSelectedAvatar] = useState('👨‍💼');

  const handleSaveProfile = () => {
    onUpdateBirthDate(dob);
    Alert.alert('Profile Saved', 'Your profile and wealth calculation parameters have been updated.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Profile & Avatar Card */}
      <GlassCard style={styles.card} padding={20} glowColor={Colors.primary}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={{ fontSize: 36 }}>{selectedAvatar}</Text>
          </View>

          <View style={styles.profileMeta}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userRole}>Principal Wealth Owner • BDT (৳)</Text>
          </View>
        </View>

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
          value={userName}
          onChangeText={setUserName}
          placeholder="Enter your name"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.inputLabel}>DATE OF BIRTH (DRIVES REAL-TIME WEALTH VELOCITY)</Text>
        <TextInput
          style={styles.input}
          value={dob}
          onChangeText={setDob}
          placeholder="YYYY-MM-DD (e.g. 1992-05-15)"
          placeholderTextColor={Colors.textMuted}
        />
        <Text style={styles.helperText}>
          ⚡ Your birthdate calculates lifetime minutes lived, income earned per minute, and hourly burn rate.
        </Text>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
          <Text style={styles.saveBtnText}>Save Profile Settings</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* 2. Life Insurance Policies Vault */}
      <GlassCard style={styles.card} padding={20} glowColor={Colors.secondary}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: Colors.secondary }]}>
              🛡️ LIFE INSURANCE POLICIES ({policies.length})
            </Text>
            <Text style={styles.sectionSub}>Family death benefit protection & nominee tracking</Text>
          </View>
          <TouchableOpacity style={styles.addSmallBtn} onPress={onAddPolicy}>
            <Ionicons name="add" size={14} color="#0B0F19" />
            <Text style={styles.addSmallText}>+ Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemList}>
          {policies.map((p) => (
            <View key={p.id} style={styles.subItemRow}>
              <View>
                <Text style={styles.itemTitle}>{p.policyName}</Text>
                <Text style={styles.itemMeta}>
                  {p.insurer} • Cover: ৳ {(p.sumAssured / 10000000).toFixed(2)} Cr • Nominee: {p.nomineeName}
                </Text>
              </View>
              <Text style={styles.itemRightVal}>৳ {p.premiumAmount.toLocaleString('en-IN')}/yr</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* 3. Family Birthday Celebration Reminders */}
      <GlassCard style={styles.card} padding={20} glowColor={Colors.accent}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: Colors.accent }]}>
              🎂 FAMILY BIRTHDAYS & MILESTONES ({birthdays.length})
            </Text>
            <Text style={styles.sectionSub}>Upcoming celebrations & gift budget plans</Text>
          </View>
          <TouchableOpacity style={[styles.addSmallBtn, { backgroundColor: Colors.accent }]} onPress={onAddBirthday}>
            <Ionicons name="add" size={14} color="#0B0F19" />
            <Text style={styles.addSmallText}>+ Birthday</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemList}>
          {birthdays.map((b) => (
            <View key={b.id} style={styles.subItemRow}>
              <View>
                <Text style={styles.itemTitle}>{b.personName} ({b.relation})</Text>
                <Text style={styles.itemMeta}>Birth Date: {b.birthDate} • Gift Budget: ৳ {b.giftBudget.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.reminderBadge}>
                <Text style={styles.reminderText}>Active</Text>
              </View>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* 4. Security & Data Export */}
      <GlassCard style={styles.card} padding={20}>
        <Text style={styles.sectionTitle}>🔒 LOCAL-FIRST ENCRYPTION & DATA VAULT</Text>
        <Text style={styles.sectionSub}>All financial records are encrypted locally with AES-256</Text>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.actionOutlineBtn}>
            <Ionicons name="cloud-upload-outline" size={16} color={Colors.primary} />
            <Text style={styles.actionOutlineText}>Export Encrypted JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionOutlineBtn}>
            <Ionicons name="cloud-download-outline" size={16} color={Colors.secondary} />
            <Text style={[styles.actionOutlineText, { color: Colors.secondary }]}>Restore Backup</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.lg,
  },
  card: {
    width: '100%',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: Spacing.md,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(0, 245, 160, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 160, 0.3)',
  },
  profileMeta: {
    flex: 1,
  },
  userName: {
    ...Typography.heading,
    fontSize: 18,
  },
  userRole: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  inputLabel: {
    ...Typography.label,
    fontSize: 9,
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  avatarGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  avatarChoice: {
    padding: 8,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  avatarChoiceActive: {
    backgroundColor: 'rgba(0, 245, 160, 0.15)',
    borderColor: Colors.primary,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  helperText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 14,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B0F19',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '800',
  },
  sectionSub: {
    ...Typography.caption,
    marginTop: 2,
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  addSmallText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0B0F19',
  },
  itemList: {
    gap: Spacing.sm,
  },
  subItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemTitle: {
    ...Typography.bodyBold,
    fontSize: 13,
  },
  itemMeta: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemRightVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  reminderBadge: {
    backgroundColor: 'rgba(0, 245, 160, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  reminderText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  actionOutlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionOutlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
});
