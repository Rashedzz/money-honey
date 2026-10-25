import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      {/* 1. Home Overview */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('dashboard')}
        activeOpacity={0.8}
      >
        <Ionicons
          name={activeTab === 'dashboard' ? 'grid' : 'grid-outline'}
          size={20}
          color={activeTab === 'dashboard' ? '#0F172A' : '#64748B'}
        />
        <Text style={[styles.navLabel, activeTab === 'dashboard' && styles.navLabelActive]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* 2. Daily Cash Book */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('income_expense_details')}
        activeOpacity={0.8}
      >
        <Ionicons
          name={activeTab === 'income_expense_details' ? 'swap-horizontal' : 'swap-horizontal-outline'}
          size={21}
          color={activeTab === 'income_expense_details' ? '#0F172A' : '#64748B'}
        />
        <Text
          style={[
            styles.navLabel,
            activeTab === 'income_expense_details' && styles.navLabelActive,
          ]}
        >
          Cash Book
        </Text>
      </TouchableOpacity>

      {/* 3. Center Quick Add Button (Expense, Income, FDR, DPS, Sanchaypatra, Transfer) */}
      <TouchableOpacity
        style={styles.centerAddBtn}
        onPress={onQuickEntryPress}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 4. Direct Mobile Access to FDR, DPS & Sanchaypatra */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('paper_assets')}
        activeOpacity={0.8}
      >
        <Ionicons
          name={activeTab === 'paper_assets' ? 'lock-closed' : 'lock-closed-outline'}
          size={20}
          color={activeTab === 'paper_assets' ? '#0F172A' : '#64748B'}
        />
        <Text style={[styles.navLabel, activeTab === 'paper_assets' && styles.navLabelActive]}>
          FDR / DPS
        </Text>
      </TouchableOpacity>

      {/* 5. Full Menu Drawer */}
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
    height: 62,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 6,
    position: 'relative',
    zIndex: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  centerAddBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});
