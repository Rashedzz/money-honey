import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { DynamicMoneyTree } from '../visuals/DynamicMoneyTree';

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
            <DynamicMoneyTree size={42} />
            <View style={styles.brandTextCol}>
              <Text style={styles.brandTitle}>Money-Honey</Text>
              <Text style={styles.brandTag}>Sky Blue Wealth Suite</Text>
            </View>
          </View>
        )}

        {isCollapsed && (
          <DynamicMoneyTree size={36} />
        )}

        <TouchableOpacity
          style={styles.collapseBtn}
          onPress={onToggleCollapse}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Quick Entry Button (Larger) */}
      <View style={styles.quickEntryWrapper}>
        <TouchableOpacity
          style={[styles.quickEntryBtn, isCollapsed && styles.quickEntryBtnCollapsed]}
          onPress={onQuickEntryPress}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={20} color="#0369A1" />
          {!isCollapsed && <Text style={styles.quickEntryText}>+ New Data Entry</Text>}
        </TouchableOpacity>
      </View>

      {/* Navigation Links (Larger font, larger icons, larger padding) */}
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
                size={22}
                color={isActive ? '#FFFFFF' : '#BAE6FD'}
              />

              {!isCollapsed && (
                <View style={styles.labelRow}>
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  {item.badge && (
                    <View style={[styles.badge, isActive && styles.badgeActive]}>
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
        {/* Mobile App Install Button (Larger) */}
        <TouchableOpacity
          style={[styles.installBtn, isCollapsed && styles.installBtnCollapsed]}
          onPress={onOpenQrModal}
          activeOpacity={0.85}
        >
          <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
          {!isCollapsed && (
            <View style={{ flex: 1 }}>
              <Text style={styles.installTitle}>Install on Phone</Text>
              <Text style={styles.installSubtitle}>Scan Mobile QR Code</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* User Profile Pill (Larger) */}
        <TouchableOpacity
          style={[styles.userPill, isCollapsed && styles.userPillCollapsed]}
          onPress={() => onSelectTab('settings')}
          activeOpacity={0.85}
        >
          <View style={styles.avatar}>
            <Text style={{ fontSize: 18 }}>{userProfile.avatar || '👨‍💼'}</Text>
          </View>
          {!isCollapsed && (
            <View style={styles.userMeta}>
              <Text style={styles.userName} numberOfLines={1}>
                {userProfile.name}
              </Text>
              <Text style={styles.userRole}>Principal Wealth Owner</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 290,
    backgroundColor: '#0369A1', // Sky 700 Royal Blue
    borderRightWidth: 1.5,
    borderRightColor: 'rgba(255, 255, 255, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    paddingVertical: Spacing.md,
    zIndex: 40,
  },
  sidebarCollapsed: {
    width: 76,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: Spacing.sm,
  },
  brandHeaderCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 6,
    flexDirection: 'column',
    gap: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  brandTextCol: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandTag: {
    fontSize: 11,
    color: '#BAE6FD',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  collapseBtn: {
    padding: 8,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  quickEntryBtnCollapsed: {
    paddingHorizontal: 0,
  },
  quickEntryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0369A1',
  },
  menuList: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: Radius.md,
    marginBottom: 5,
    position: 'relative',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  labelRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E0F2FE',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  badgeActive: {
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  footerSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    gap: 10,
  },
  installBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: Radius.md,
    padding: 10,
  },
  installBtnCollapsed: {
    justifyContent: 'center',
    padding: 10,
  },
  installTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  installSubtitle: {
    fontSize: 11,
    color: '#BAE6FD',
    fontWeight: '600',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Radius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  userPillCollapsed: {
    justifyContent: 'center',
    padding: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 11,
    color: '#BAE6FD',
  },
});
