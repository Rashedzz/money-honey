import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../theme';
import { DynamicMoneyTree } from '../visuals/DynamicMoneyTree';
import { SidebarTabType } from './AppSidebar';

interface MobileDrawerProps {
  visible: boolean;
  onClose: () => void;
  activeTab: SidebarTabType;
  onSelectTab: (tab: SidebarTabType) => void;
  onQuickEntryPress: () => void;
  onOpenQrModal?: () => void;
  onOpenAuthModal?: () => void;
  userProfile?: {
    id?: string;
    name: string;
    avatar?: string;
    photoUri?: string;
  };
  isOnline?: boolean;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  visible,
  onClose,
  activeTab,
  onSelectTab,
  onQuickEntryPress,
  onOpenQrModal,
  onOpenAuthModal,
  userProfile = { id: 'rashed01', name: 'Rashed Zaman', avatar: '👨‍💼' },
  isOnline = true,
}) => {
  const menuItems: Array<{
    id: SidebarTabType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Home Dashboard', icon: 'grid-outline' },
    { id: 'register', label: 'Quicken Register', icon: 'receipt-outline', badge: 'Active' },
    { id: 'expenses', label: 'Spending & Budgets', icon: 'pie-chart-outline' },
    { id: 'reports', label: 'Financial Statements', icon: 'document-text-outline', badge: 'IFRS' },
    { id: 'categories', label: 'Category & Budget Setup', icon: 'pricetags-outline', badge: 'Setup' },
    { id: 'stocks', label: 'Stock Market Equities', icon: 'trending-up-outline', badge: 'DSE/CSE' },
    { id: 'accounts', label: 'Bank Accounts & Cash', icon: 'wallet-outline' },
    { id: 'loans', label: 'Loans & Debt Service', icon: 'card-outline' },
    { id: 'schedules', label: 'Bills & Income Schedules', icon: 'calendar-outline' },
    { id: 'paper_assets', label: 'Paper Assets (Sanchaypatra)', icon: 'document-text-outline' },
    { id: 'physical_assets', label: 'Physical Assets (Land/Gold)', icon: 'business-outline' },
    { id: 'settings', label: 'Settings & Security Vault', icon: 'settings-outline' },
  ];

  const handleItemPress = (tab: SidebarTabType) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop click to close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        {/* Drawer Content */}
        <SafeAreaView style={styles.drawerContainer}>
          <View style={styles.drawerContent}>
            {/* Brand Header */}
            <View style={styles.brandHeader}>
              <View style={styles.brandRow}>
                <DynamicMoneyTree size={38} />
                <View style={styles.brandCol}>
                  <Text style={styles.brandTitle}>Money-Honey</Text>
                  <Text style={styles.brandSubtitle}>Quicken Executive Suite</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* User Profile Card */}
            <TouchableOpacity
              style={styles.profileCard}
              onPress={() => {
                onClose();
                onOpenAuthModal?.();
              }}
              activeOpacity={0.8}
            >
              {userProfile.photoUri ? (
                <Image source={{ uri: userProfile.photoUri }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatar}>{userProfile.avatar || '👨‍💼'}</Text>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{userProfile.name}</Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isOnline ? '#10B981' : '#F59E0B' },
                    ]}
                  />
                  <Text style={styles.profileId}>
                    @{userProfile.id || 'user'} • {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Quick Action Button */}
            <TouchableOpacity
              style={styles.quickEntryBtn}
              onPress={() => {
                onClose();
                onQuickEntryPress();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.quickEntryBtnText}>+ New Transaction</Text>
            </TouchableOpacity>

            {/* Navigation Menu Items */}
            <ScrollView
              style={[styles.menuScroll, { overflow: 'hidden' }]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                    onPress={() => handleItemPress(item.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={isActive ? '#38BDF8' : '#94A3B8'}
                    />
                    <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                      {item.label}
                    </Text>
                    {item.badge && (
                      <View
                        style={[
                          styles.badge,
                          isActive ? styles.badgeActive : styles.badgeInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isActive ? styles.badgeTextActive : styles.badgeTextInactive,
                          ]}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Install Mobile App Utility Link */}
              {onOpenQrModal && (
                <TouchableOpacity
                  style={styles.mobileAppUtilityBtn}
                  onPress={() => {
                    onClose();
                    onOpenQrModal();
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="phone-portrait-outline" size={18} color="#38BDF8" />
                  <Text style={styles.mobileAppUtilityText}>
                    Install Mobile App / PWA
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#64748B" />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerContainer: {
    width: '82%',
    maxWidth: 340,
    height: '100%',
    backgroundColor: '#0F172A', // Quicken Deep Slate
    borderRightWidth: 1.5,
    borderRightColor: '#1E293B',
  },
  drawerContent: {
    flex: 1,
    padding: Spacing.md,
  },
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.full,
    backgroundColor: '#1E293B',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: Radius.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    fontSize: 28,
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  profileId: {
    fontSize: 11,
    color: '#94A3B8',
  },
  quickEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  quickEntryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  menuScroll: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginVertical: 1,
  },
  menuItemActive: {
    backgroundColor: '#1E293B',
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    flex: 1,
  },
  menuLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
  },
  badgeInactive: {
    backgroundColor: '#1E293B',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextActive: {
    color: '#38BDF8',
  },
  badgeTextInactive: {
    color: '#94A3B8',
  },
  mobileAppUtilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  mobileAppUtilityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    flex: 1,
    marginLeft: 10,
  },
});
