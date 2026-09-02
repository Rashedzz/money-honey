import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../theme';
import { SidebarTabType } from './AppSidebar';

interface MobileBottomNavProps {
  activeTab: SidebarTabType;
  onSelectTab: (tab: SidebarTabType) => void;
  onOpenDrawer: () => void;
  onQuickEntryPress: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenDrawer,
  onQuickEntryPress,
}) => {
  return (
    <View style={styles.bottomBar}>
      {/* 1. Dashboard */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('dashboard')}
        activeOpacity={0.8}
      >
        <Ionicons
          name={activeTab === 'dashboard' ? 'grid' : 'grid-outline'}
          size={21}
          color={activeTab === 'dashboard' ? '#16A34A' : '#64748B'}
        />
        <Text style={[styles.navLabel, activeTab === 'dashboard' && styles.navLabelActive]}>
          Dashboard
        </Text>
      </TouchableOpacity>

      {/* 2. Stock Market */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('stocks')}
        activeOpacity={0.8}
      >
        <Ionicons
          name={activeTab === 'stocks' ? 'trending-up' : 'trending-up-outline'}
          size={22}
          color={activeTab === 'stocks' ? '#16A34A' : '#64748B'}
        />
        <Text style={[styles.navLabel, activeTab === 'stocks' && styles.navLabelActive]}>
          Stocks
        </Text>
      </TouchableOpacity>

      {/* 3. Center Quick Add Button */}
      <TouchableOpacity
        style={styles.centerAddBtn}
        onPress={onQuickEntryPress}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 4. Bank Accounts */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('accounts')}
        activeOpacity={0.8}
      >
        <Ionicons
          name={activeTab === 'accounts' ? 'wallet' : 'wallet-outline'}
          size={21}
          color={activeTab === 'accounts' ? '#16A34A' : '#64748B'}
        />
        <Text style={[styles.navLabel, activeTab === 'accounts' && styles.navLabelActive]}>
          Accounts
        </Text>
      </TouchableOpacity>

      {/* 5. Menu / More */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={onOpenDrawer}
        activeOpacity={0.8}
      >
        <Ionicons name="menu" size={22} color="#64748B" />
        <Text style={styles.navLabel}>Menu</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#BAE6FD',
    paddingHorizontal: 8,
    position: 'relative',
    zIndex: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#16A34A',
    fontWeight: '900',
  },
  centerAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
