import React, { useState } from 'react';
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
  | 'stocks'
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
  onOpenAuthModal?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userProfile?: {
    id?: string;
    name: string;
    avatar?: string;
  };
  isOnline?: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onSelectTab,
  onQuickEntryPress,
  onOpenQrModal,
  onOpenAuthModal,
  isCollapsed,
  onToggleCollapse,
  userProfile = { id: 'rashed01', name: 'Rashed Rahman', avatar: '👨‍💼' },
  isOnline = true,
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const menuItems: Array<{
    id: SidebarTabType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { id: 'stocks', label: 'Stock Market', icon: 'trending-up-outline', badge: 'DSE/CSE' },
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
            <DynamicMoneyTree size={44} />
            <View style={styles.brandTextCol}>
              <Text style={styles.brandTitle}>Money-Honey</Text>
              <Text style={styles.brandTag}>Private Wealth Architecture</Text>
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

      {/* Quick Entry Button */}
      <View style={styles.quickEntryWrapper}>
        <TouchableOpacity
          style={[styles.quickEntryBtn, isCollapsed && styles.quickEntryBtnCollapsed]}
          onPress={onQuickEntryPress}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={20} color="#16A34A" />
          {!isCollapsed && <Text style={styles.quickEntryText}>+ New Data Entry</Text>}
        </TouchableOpacity>
      </View>

      {/* Navigation Links: Pure Black background, Pure White text, Green selected button, Gold hover */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.menuList}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const isHovered = hoveredTab === item.id && !isActive;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                isCollapsed && styles.navItemCollapsed,
                isActive && styles.navItemActive,
                isHovered && styles.navItemHovered,
              ]}
              onPress={() => onSelectTab(item.id)}
              activeOpacity={0.8}
              // @ts-ignore Web hover support
              onMouseEnter={() => setHoveredTab(item.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={isActive ? '#FFFFFF' : isHovered ? '#F59E0B' : '#FFFFFF'}
              />

              {!isCollapsed && (
                <View style={styles.labelRow}>
                  <Text
                    style={[
                      styles.navLabel,
                      isActive && styles.navLabelActive,
                      isHovered && styles.navLabelHovered,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.badge && (
                    <View
                      style={[
                        styles.badge,
                        isActive && styles.badgeActive,
                        isHovered && styles.badgeHovered,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isActive && { color: '#FFFFFF' },
                          isHovered && { color: '#F59E0B' },
                        ]}
                      >
                        {item.badge}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {isActive && <View style={styles.activeIndicatorBar} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Actions: Storage Status, Install QR & User ID Auth */}
      <View style={styles.footerSection}>
        {/* Storage State Indicator */}
        {!isCollapsed && (
          <View style={styles.storageStatusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? '#16A34A' : '#F59E0B' },
              ]}
            />
            <Text style={styles.storageStatusText}>
              {isOnline ? 'Online Synced' : 'Local Storage Active'}
            </Text>
          </View>
        )}

        {/* Mobile App Install Button */}
        <TouchableOpacity
          style={[styles.installBtn, isCollapsed && styles.installBtnCollapsed]}
          onPress={onOpenQrModal}
          activeOpacity={0.85}
        >
          <Ionicons name="qr-code-outline" size={20} color="#F59E0B" />
          {!isCollapsed && (
            <View style={{ flex: 1 }}>
              <Text style={styles.installTitle}>Install Mobile App</Text>
              <Text style={styles.installSubtitle}>Scan Phone QR Code</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* User Profile / Auth System Trigger */}
        <TouchableOpacity
          style={[styles.userPill, isCollapsed && styles.userPillCollapsed]}
          onPress={onOpenAuthModal}
          activeOpacity={0.85}
        >
          <View style={styles.avatar}>
            <Text style={{ fontSize: 18 }}>{userProfile.avatar || '👨‍💼'}</Text>
          </View>
          {!isCollapsed && (
            <View style={styles.userMeta}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {userProfile.name}
                </Text>
                <Ionicons name="lock-closed" size={12} color="#16A34A" />
              </View>
              <Text style={styles.userRole}>
                ID: @{userProfile.id || 'rashed01'} • Switch
              </Text>
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
    backgroundColor: '#000000', // Pure Solid Black
    borderRightWidth: 1.5,
    borderRightColor: '#1F2430',
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
    borderBottomColor: '#1F2430',
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
  brandTextCol: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF', // Pure White
    letterSpacing: -0.3,
  },
  brandTag: {
    fontSize: 11,
    color: '#F59E0B', // Gold Subtitle
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  collapseBtn: {
    padding: 8,
    borderRadius: Radius.md,
    backgroundColor: '#161922',
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
    backgroundColor: '#11141C',
    borderWidth: 1.5,
    borderColor: '#16A34A', // Green Border
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  quickEntryBtnCollapsed: {
    paddingHorizontal: 0,
  },
  quickEntryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navItemActive: {
    backgroundColor: '#16A34A', // Vibrant Green Button when selected
    borderColor: '#22C55E',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  navItemHovered: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)', // Golden Tint Hover
    borderColor: '#F59E0B', // Golden Border on Hover
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
    color: '#FFFFFF', // Pure White Font
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  navLabelHovered: {
    color: '#FBBF24', // Golden Color on Hover
    fontWeight: '700',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  badgeActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  badgeHovered: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  activeIndicatorBar: {
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
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#1F2430',
    gap: 10,
  },
  storageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  storageStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  installBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#11141C',
    borderWidth: 1,
    borderColor: '#F59E0B', // Gold Border
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
    color: '#F59E0B',
    fontWeight: '600',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#11141C',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1F2430',
  },
  userPillCollapsed: {
    justifyContent: 'center',
    padding: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F2430',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  userMeta: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
});
