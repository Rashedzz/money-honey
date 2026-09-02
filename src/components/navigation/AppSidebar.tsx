import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export type SidebarTabType =
  | 'dashboard'
  | 'accounts'
  | 'loans'
  | 'paper_assets'
  | 'physical_assets'
  | 'expenses'
  | 'settings';

interface AppSidebarProps {
  activeTab: SidebarTabType;
  onSelectTab: (tab: SidebarTabType) => void;
  onQuickEntryPress: () => void;
  onOpenQrModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userProfile?: {
    name: string;
    avatar?: string;
  };
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onSelectTab,
  onQuickEntryPress,
  onOpenQrModal,
  isCollapsed,
  onToggleCollapse,
  userProfile = { name: 'Rashed Rahman', avatar: '👨‍💼' },
}) => {
  const menuItems: Array<{
    id: SidebarTabType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { id: 'accounts', label: 'Bank Accounts', icon: 'wallet-outline' },
    { id: 'loans', label: 'Loans & Debts', icon: 'card-outline' },
    { id: 'paper_assets', label: 'Paper Assets', icon: 'document-text-outline', badge: 'Govt' },
    { id: 'physical_assets', label: 'Physical Assets', icon: 'business-outline', badge: 'Land/Gold' },
    { id: 'expenses', label: 'Expenses', icon: 'receipt-outline' },
    { id: 'settings', label: 'Settings & Profile', icon: 'settings-outline' },
  ];

  return (
    <View style={[styles.sidebar, isCollapsed && styles.sidebarCollapsed]}>
      {/* Brand & Collapse Header */}
      <View style={[styles.brandHeader, isCollapsed && styles.brandHeaderCollapsed]}>
        {!isCollapsed && (
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={{ fontSize: 18 }}>🍯</Text>
            </View>
            <View style={styles.brandTextCol}>
              <Text style={styles.brandTitle}>Money-Honey</Text>
              <Text style={styles.brandTag}>AFIL Wealth Suite</Text>
            </View>
          </View>
        )}

        {isCollapsed && (
          <View style={styles.logoBadge}>
            <Text style={{ fontSize: 18 }}>🍯</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.collapseBtn}
          onPress={onToggleCollapse}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
            size={16}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Quick Entry Button */}
      <View style={styles.quickEntryWrapper}>
        <TouchableOpacity
          style={[styles.quickEntryBtn, isCollapsed && styles.quickEntryBtnCollapsed]}
          onPress={onQuickEntryPress}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={18} color="#020617" />
          {!isCollapsed && <Text style={styles.quickEntryText}>+ Data Entry</Text>}
        </TouchableOpacity>
      </View>

      {/* Navigation Links */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.menuList}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                isCollapsed && styles.navItemCollapsed,
                isActive && styles.navItemActive,
              ]}
              onPress={() => onSelectTab(item.id)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={isActive ? Colors.primary : Colors.textSecondary}
              />

              {!isCollapsed && (
                <View style={styles.labelRow}>
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
              )}

              {isActive && <View style={styles.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Actions: Install QR Code + User Profile */}
      <View style={styles.footerSection}>
        {/* Mobile App Install Button */}
        <TouchableOpacity
          style={[styles.installBtn, isCollapsed && styles.installBtnCollapsed]}
          onPress={onOpenQrModal}
          activeOpacity={0.85}
        >
          <Ionicons name="qr-code-outline" size={16} color={Colors.primary} />
          {!isCollapsed && (
            <View style={{ flex: 1 }}>
              <Text style={styles.installTitle}>Install on Mobile</Text>
              <Text style={styles.installSubtitle}>Scan Phone QR Code</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* User Profile Pill */}
        <TouchableOpacity
          style={[styles.userPill, isCollapsed && styles.userPillCollapsed]}
          onPress={() => onSelectTab('settings')}
          activeOpacity={0.85}
        >
          <View style={styles.avatar}>
            <Text style={{ fontSize: 16 }}>{userProfile.avatar || '👨‍💼'}</Text>
          </View>
          {!isCollapsed && (
            <View style={styles.userMeta}>
              <Text style={styles.userName} numberOfLines={1}>
                {userProfile.name}
              </Text>
              <Text style={styles.userRole}>Executive Portfolio</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: '#0F172A',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    paddingVertical: Spacing.md,
    zIndex: 40,
  },
  sidebarCollapsed: {
    width: 68,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: Spacing.sm,
  },
  brandHeaderCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 6,
    flexDirection: 'column',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  brandTextCol: {
    flex: 1,
  },
  brandTitle: {
    ...Typography.heading,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  brandTag: {
    ...Typography.caption,
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  collapseBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  quickEntryWrapper: {
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  quickEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  quickEntryBtnCollapsed: {
    paddingHorizontal: 0,
  },
  quickEntryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#020617',
  },
  menuList: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    marginBottom: 4,
    position: 'relative',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navItemActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  labelRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  navLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  footerSection: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  installBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: Radius.md,
    padding: 8,
  },
  installBtnCollapsed: {
    justifyContent: 'center',
    padding: 10,
  },
  installTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  installSubtitle: {
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '600',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.md,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  userPillCollapsed: {
    justifyContent: 'center',
    padding: 6,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userRole: {
    fontSize: 9,
    color: Colors.textMuted,
  },
});
