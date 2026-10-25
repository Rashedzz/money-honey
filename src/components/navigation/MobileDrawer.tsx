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
import { Spacing, Radius } from '../../theme';
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
  pendingNotifCount?: number;
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
  pendingNotifCount = 0,
}) => {
  const menuItems: Array<{
    id: SidebarTabType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: 'grid-outline' },
    { id: 'income_expense_details', label: 'Daily Cash Book', icon: 'swap-horizontal-outline', badge: 'Ledger' },
    { id: 'paper_assets', label: 'FDR, DPS & Sanchaypatra', icon: 'lock-closed-outline', badge: 'Savings' },
    { id: 'planner', label: 'Goals, Zakat & Calculators', icon: 'calculator-outline', badge: 'New' },
    { id: 'accounts', label: 'Bank Accounts & Cash', icon: 'wallet-outline' },
    { id: 'register', label: 'All Transactions', icon: 'receipt-outline' },
    { id: 'expenses', label: 'Expenses & Monthly Budget', icon: 'pie-chart-outline' },
    { id: 'projects', label: 'Projects Income & Cost', icon: 'briefcase-outline' },
    { id: 'loans', label: 'Loans & Monthly EMI', icon: 'card-outline' },
    { id: 'stocks', label: 'DSE Stocks & Shares', icon: 'trending-up-outline' },
    { id: 'physical_assets', label: 'Land, Gold & Property', icon: 'business-outline' },
    { id: 'reports', label: 'Reports & Tax Statements', icon: 'document-text-outline' },
    { id: 'categories', label: 'Categories & Budget Limits', icon: 'pricetags-outline' },
    {
      id: 'schedules',
      label: 'Bills & Profit Reminders',
      icon: 'calendar-outline',
      badge: pendingNotifCount > 0 ? `${pendingNotifCount}` : undefined,
    },
    { id: 'settings', label: 'Settings & Backup', icon: 'settings-outline' },
  ];

  const handleItemPress = (tab: SidebarTabType) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <SafeAreaView style={styles.drawerContainer}>
          <View style={styles.drawerContent}>
            {/* Brand Header */}
            <View style={styles.brandHeader}>
              <View style={styles.brandRow}>
                <DynamicMoneyTree size={36} />
                <View style={styles.brandCol}>
                  <Text style={styles.brandTitle}>Money-Honey</Text>
                  <Text style={styles.brandSubtitle}>Personal Wealth Suite</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
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
                      { backgroundColor: isOnline ? '#16A34A' : '#F59E0B' },
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
              <Text style={styles.quickEntryBtnText}>+ Add Expense / Income / FDR / DPS</Text>
            </TouchableOpacity>

            {/* Scrollable Navigation Menu Items */}
            <ScrollView
              style={styles.menuScroll}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 48 }}
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
                      size={19}
                      color={isActive ? '#FFFFFF' : '#94A3B8'}
                    />
                    <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                      {item.label}
                    </Text>
                    {item.badge && (
                      <View
                        style={[
                          styles.badge,
                          isActive ? styles.badgeActive : styles.badgeInactive,
                          item.id === 'schedules' && {
                            backgroundColor: '#DC2626',
                            borderRadius: 10,
                            minWidth: 18,
                            paddingHorizontal: 5,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isActive ? styles.badgeTextActive : styles.badgeTextInactive,
                            item.id === 'schedules' && { color: '#FFFFFF', fontWeight: '900' },
                          ]}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {onOpenQrModal && (
                <TouchableOpacity
                  style={styles.mobileAppUtilityBtn}
                  onPress={() => {
                    onClose();
                    onOpenQrModal();
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="phone-portrait-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.mobileAppUtilityText}>
                    Install App on Phone / Laptop
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerContainer: {
    width: '84%',
    maxWidth: 340,
    height: '100%',
    backgroundColor: '#0F172A',
    borderRightWidth: 1,
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
    paddingBottom: 12,
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
    fontSize: 17.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
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
    padding: 11,
    borderRadius: Radius.md,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    fontSize: 26,
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileName: {
    fontSize: 15,
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
    fontSize: 12,
    color: '#94A3B8',
  },
  quickEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    borderRadius: Radius.md,
    marginBottom: 8,
  },
  quickEntryBtnText: {
    fontSize: 13.5,
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
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginVertical: 1,
  },
  menuItemActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  menuLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#CBD5E1',
    flex: 1,
  },
  menuLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: '#2563EB',
  },
  badgeInactive: {
    backgroundColor: '#1E293B',
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#FFFFFF',
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
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mobileAppUtilityText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#E2E8F0',
    flex: 1,
    marginLeft: 10,
  },
});
