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
    borderRadius: Radius.lg,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: Spacing.sm,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  avatarGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  avatarChoice: {
    padding: 10,
    borderRadius: Radius.md,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  avatarChoiceActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  input: {
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 15,
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
    marginTop: Spacing.lg,
    shadowColor: '#0284C7',
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
  },
  sectionTitle: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  addSmallText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  itemList: {
    gap: Spacing.sm,
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
  itemRightVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  reminderBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  reminderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.md,
  },
  actionOutlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  actionOutlineText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
});
