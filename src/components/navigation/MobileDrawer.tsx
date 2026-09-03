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
  onOpenQrModal: () => void;
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
    { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { id: 'stocks', label: 'Stock Market', icon: 'trending-up-outline', badge: 'DSE/CSE' },
    { id: 'accounts', label: 'Bank Accounts', icon: 'wallet-outline' },
    { id: 'loans', label: 'Loans & Debts', icon: 'card-outline' },
    { id: 'paper_assets', label: 'Paper Assets', icon: 'document-text-outline', badge: 'Govt' },
    { id: 'physical_assets', label: 'Physical Assets', icon: 'business-outline', badge: 'Land/Gold' },
    { id: 'expenses', label: 'Expenses', icon: 'receipt-outline' },
    { id: 'settings', label: 'Settings & Profile', icon: 'settings-outline' },
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
                <DynamicMoneyTree size={40} />
                <View style={styles.brandCol}>
                  <Text style={styles.brandTitle}>Money-Honey</Text>
                  <Text style={styles.brandSubtitle}>Private Wealth & Stock AI</Text>
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
              <Text style={styles.quickEntryBtnText}>+ New Data Entry</Text>
            </TouchableOpacity>

            {/* Navigation Menu Items */}
            <ScrollView
              style={[styles.menuScroll, { overflow: 'scroll' } as any]}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              <Text style={styles.sectionLabel}>NAVIGATION</Text>
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

              {/* Install PWA / Mobile App Button */}
              <TouchableOpacity
                style={styles.installAppBtn}
                onPress={() => {
                  onClose();
                  onOpenQrModal();
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="phone-portrait-outline" size={18} color="#00E5B3" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.installAppTitle}>Install Mobile App</Text>
                  <Text style={styles.installAppSub}>PWA / Android Shortcut</Text>
                </View>
                <Ionicons name="download-outline" size={18} color="#00E5B3" />
              </TouchableOpacity>
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
    backgroundColor: '#000000',
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
    color: '#0284C7',
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.full,
    backgroundColor: '#1E293B',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F172A',
    borderRadius: Radius.lg,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    fontSize: 24,
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
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
    backgroundColor: '#16A34A',
    borderRadius: Radius.md,
    paddingVertical: 11,
    marginTop: 12,
  },
  quickEntryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  menuScroll: {
    flex: 1,
    marginTop: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#16A34A',
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 12,
    flex: 1,
  },
  menuLabelActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeInactive: {
    backgroundColor: '#1E293B',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
  badgeTextInactive: {
    color: '#94A3B8',
  },
  installAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#00E5B3',
  },
  installAppTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  installAppSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
});
