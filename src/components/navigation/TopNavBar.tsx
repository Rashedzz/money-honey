import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export type MainTabType =
  | 'dashboard'
  | 'accounts'
  | 'loans'
  | 'paper_assets'
  | 'physical_assets'
  | 'expenses'
  | 'settings';

interface TopNavBarProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  onQuickEntryPress: () => void;
  userProfile?: {
    name: string;
    avatarUrl?: string;
  };
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeTab,
  onSelectTab,
  onQuickEntryPress,
  userProfile = { name: 'Rashed Rahman' },
}) => {
  const menuItems: Array<{ id: MainTabType; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { id: 'accounts', label: 'Bank Accounts', icon: 'wallet-outline' },
    { id: 'loans', label: 'Loans & Debts', icon: 'card-outline' },
    { id: 'paper_assets', label: 'Paper Assets', icon: 'document-text-outline' },
    { id: 'physical_assets', label: 'Physical Assets', icon: 'business-outline' },
    { id: 'expenses', label: 'Expenses', icon: 'receipt-outline' },
    { id: 'settings', label: 'Settings & Profile', icon: 'settings-outline' },
  ];

  return (
    <View style={styles.navContainer}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        {/* Brand Logo */}
        <View style={styles.brandCol}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🍯</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Money-Honey</Text>
            <Text style={styles.brandSubtitle}>Executive Wealth Suite</Text>
          </View>
        </View>

        {/* Right Actions: Quick Entry + User Profile Pill */}
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.quickEntryBtn} onPress={onQuickEntryPress} activeOpacity={0.85}>
            <Ionicons name="add-circle" size={16} color="#0B0F19" />
            <Text style={styles.quickEntryText}>+ Data Entry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.profilePill, activeTab === 'settings' && styles.profilePillActive]}
            onPress={() => onSelectTab('settings')}
            activeOpacity={0.85}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{userProfile.name.charAt(0)}</Text>
            </View>
            <Text style={styles.profileName} numberOfLines={1}>
              {userProfile.name}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal Menu Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.menuScroll}
      >
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => onSelectTab(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={isActive ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: '#0F1626',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  brandCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0, 245, 160, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 160, 0.3)',
  },
  logoEmoji: {
    fontSize: 20,
  },
  brandTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  brandSubtitle: {
    ...Typography.caption,
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  quickEntryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B0F19',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingRight: 10,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  profilePillActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 245, 160, 0.12)',
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  profileName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  menuScroll: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 6,
    paddingBottom: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.md,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: 'rgba(0, 245, 160, 0.1)',
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  menuItemTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
});
