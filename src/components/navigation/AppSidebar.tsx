import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../theme';
import { DynamicMoneyTree } from '../visuals/DynamicMoneyTree';
import { BankAccountItem } from '../../services/transactionManager';

export type SidebarTabType =
  | 'dashboard'
  | 'register'
  | 'reports'
  | 'categories'
  | 'stocks'
  | 'accounts'
  | 'loans'
  | 'schedules'
  | 'paper_assets'
  | 'physical_assets'
  | 'expenses'
  | 'settings';

interface AppSidebarProps {
  activeTab: SidebarTabType;
  onSelectTab: (tab: SidebarTabType) => void;
  onSelectAccountForRegister?: (accountId: string) => void;
  bankAccounts?: BankAccountItem[];
  netWorth?: number;
  totalAssets?: number;
  totalDebt?: number;
  stocksValuation?: number;
  paperAssetsValuation?: number;
  physicalAssetsValuation?: number;
  onQuickEntryPress: () => void;
  onOpenQrModal?: () => void;
  onOpenAuthModal?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userProfile?: {
    id?: string;
    name: string;
    avatar?: string;
    photoUri?: string;
  };
  isOnline?: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onSelectTab,
  onSelectAccountForRegister,
  bankAccounts = [],
  netWorth = 0,
  totalAssets = 0,
  totalDebt = 0,
  stocksValuation = 0,
  paperAssetsValuation = 0,
  physicalAssetsValuation = 0,
  onQuickEntryPress,
  onOpenQrModal,
  onOpenAuthModal,
  isCollapsed,
  onToggleCollapse,
  userProfile = { id: 'rashed01', name: 'Rashed Zaman', avatar: '👨‍💼' },
  isOnline = true,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [bankingExpanded, setBankingExpanded] = useState(true);
  const [investingExpanded, setInvestingExpanded] = useState(true);
  const [propertyExpanded, setPropertyExpanded] = useState(true);

  // Subtotals
  const totalBanking = bankAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const totalInvesting = stocksValuation + paperAssetsValuation;
  const totalProperty = physicalAssetsValuation;

  const workspaceMenuItems: Array<{
    id: SidebarTabType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { id: 'register', label: 'Quicken Register', icon: 'receipt-outline', badge: 'Live' },
    { id: 'expenses', label: 'Spending & Budgets', icon: 'pie-chart-outline' },
    { id: 'reports', label: 'Financial Statements', icon: 'document-text-outline', badge: 'IFRS' },
    { id: 'categories', label: 'Category & Budgets', icon: 'pricetags-outline' },
    { id: 'stocks', label: 'Stock Equities', icon: 'trending-up-outline', badge: 'DSE' },
    { id: 'schedules', label: 'Bills & Schedules', icon: 'calendar-outline' },
    { id: 'settings', label: 'Settings & Security', icon: 'settings-outline' },
  ];

  return (
    <View style={[styles.sidebar, isCollapsed && styles.sidebarCollapsed]}>
      {/* 1. Brand Header */}
      <View style={[styles.brandHeader, isCollapsed && styles.brandHeaderCollapsed]}>
        {!isCollapsed ? (
          <View style={styles.brandRow}>
            <DynamicMoneyTree size={36} />
            <View style={styles.brandTextCol}>
              <Text style={styles.brandTitle} numberOfLines={1}>Money-Honey</Text>
              <Text style={styles.brandTag} numberOfLines={1}>Quicken Deluxe Suite</Text>
            </View>
          </View>
        ) : (
          <DynamicMoneyTree size={32} />
        )}

        <TouchableOpacity
          style={styles.collapseBtn}
          onPress={onToggleCollapse}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
            size={14}
            color="#94A3B8"
          />
        </TouchableOpacity>
      </View>

      {/* 2. Quicken Net Worth Mini Card (Zero Horizontal Overflow) */}
      {!isCollapsed && (
        <View style={styles.netWorthWidget}>
          <View style={styles.netWorthHeader}>
            <Text style={styles.netWorthLabel}>CONSOLIDATED NET WORTH</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.netWorthAmount} numberOfLines={1}>
            ৳ {netWorth.toLocaleString('en-IN')}
          </Text>
          <View style={styles.netWorthBreakdown}>
            <Text style={styles.assetsText} numberOfLines={1}>
              Assets: ৳{(totalAssets / 100000).toFixed(1)}L
            </Text>
            <Text style={styles.debtText} numberOfLines={1}>
              Debt: ৳{(totalDebt / 100000).toFixed(1)}L
            </Text>
          </View>
        </View>
      )}

      {/* 3. New Transaction Quick Action */}
      <View style={styles.quickEntryWrapper}>
        <TouchableOpacity
          style={[styles.quickEntryBtn, isCollapsed && styles.quickEntryBtnCollapsed]}
          onPress={onQuickEntryPress}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={17} color="#FFFFFF" />
          {!isCollapsed && <Text style={styles.quickEntryText}>+ New Transaction</Text>}
        </TouchableOpacity>
      </View>

      {/* 4. Scrollable Navigation (No horizontal scroll, strictly vertical) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.menuList}
        contentContainerStyle={styles.menuListContent}
      >
        {/* WORKSPACES */}
        <View style={styles.navGroup}>
          {!isCollapsed && <Text style={styles.groupHeaderTitle}>WORKSPACES</Text>}

          {workspaceMenuItems.map((item) => {
            const isActive = activeTab === item.id;
            const isHovered = hoveredItem === item.id && !isActive;

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
                // @ts-ignore
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {isActive && <View style={styles.activeBar} />}

                <Ionicons
                  name={item.icon}
                  size={18}
                  color={isActive ? '#38BDF8' : isHovered ? '#0284C7' : '#94A3B8'}
                />

                {!isCollapsed && (
                  <View style={styles.labelRow}>
                    <Text
                      style={[
                        styles.navLabel,
                        isActive && styles.navLabelActive,
                        isHovered && styles.navLabelHovered,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {item.badge && (
                      <View style={[styles.badge, isActive && styles.badgeActive]}>
                        <Text style={[styles.badgeText, isActive && { color: '#38BDF8' }]}>
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ACCOUNTS ACCORDION */}
        {!isCollapsed && (
          <View style={[styles.navGroup, { marginTop: 12 }]}>
            <Text style={styles.groupHeaderTitle}>ACCOUNTS & BALANCES</Text>

            {/* BANKING */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setBankingExpanded(!bankingExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.accordionHeaderLeft}>
                <Ionicons
                  name={bankingExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={12}
                  color="#94A3B8"
                />
                <Text style={styles.accordionTitle}>BANKING & CASH</Text>
              </View>
              <Text style={styles.accordionSubtotal} numberOfLines={1}>
                ৳ {totalBanking.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>

            {bankingExpanded && (
              <View style={styles.accountSubList}>
                {bankAccounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    style={[styles.accountItemRow, hoveredItem === acc.id && styles.accountItemRowHovered]}
                    onPress={() => {
                      if (onSelectAccountForRegister) {
                        onSelectAccountForRegister(acc.id);
                      } else {
                        onSelectTab('register');
                      }
                    }}
                    activeOpacity={0.7}
                    // @ts-ignore
                    onMouseEnter={() => setHoveredItem(acc.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <View style={styles.accountItemLeft}>
                      <View style={[styles.accountColorDot, { backgroundColor: acc.color || '#0284C7' }]} />
                      <Text style={styles.accountItemName} numberOfLines={1}>
                        {acc.bankName}
                      </Text>
                    </View>
                    <Text style={styles.accountItemBal} numberOfLines={1}>
                      ৳ {acc.currentBalance.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* INVESTING */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setInvestingExpanded(!investingExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.accordionHeaderLeft}>
                <Ionicons
                  name={investingExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={12}
                  color="#94A3B8"
                />
                <Text style={styles.accordionTitle}>INVESTING</Text>
              </View>
              <Text style={styles.accordionSubtotal} numberOfLines={1}>
                ৳ {totalInvesting.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>

            {investingExpanded && (
              <View style={styles.accountSubList}>
                <TouchableOpacity
                  style={[styles.accountItemRow, activeTab === 'stocks' && styles.accountItemRowActive]}
                  onPress={() => onSelectTab('stocks')}
                  activeOpacity={0.7}
                >
                  <View style={styles.accountItemLeft}>
                    <View style={[styles.accountColorDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.accountItemName} numberOfLines={1}>DSE Equities</Text>
                  </View>
                  <Text style={styles.accountItemBal} numberOfLines={1}>
                    ৳ {stocksValuation.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.accountItemRow, activeTab === 'paper_assets' && styles.accountItemRowActive]}
                  onPress={() => onSelectTab('paper_assets')}
                  activeOpacity={0.7}
                >
                  <View style={styles.accountItemLeft}>
                    <View style={[styles.accountColorDot, { backgroundColor: '#8B5CF6' }]} />
                    <Text style={styles.accountItemName} numberOfLines={1}>Sanchaypatra & FDR</Text>
                  </View>
                  <Text style={styles.accountItemBal} numberOfLines={1}>
                    ৳ {paperAssetsValuation.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PROPERTY & DEBT */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setPropertyExpanded(!propertyExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.accordionHeaderLeft}>
                <Ionicons
                  name={propertyExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={12}
                  color="#94A3B8"
                />
                <Text style={styles.accordionTitle}>PROPERTY & DEBT</Text>
              </View>
              <Text style={styles.accordionSubtotal} numberOfLines={1}>
                ৳ {totalProperty.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>

            {propertyExpanded && (
              <View style={styles.accountSubList}>
                <TouchableOpacity
                  style={[styles.accountItemRow, activeTab === 'physical_assets' && styles.accountItemRowActive]}
                  onPress={() => onSelectTab('physical_assets')}
                  activeOpacity={0.7}
                >
                  <View style={styles.accountItemLeft}>
                    <View style={[styles.accountColorDot, { backgroundColor: '#D97706' }]} />
                    <Text style={styles.accountItemName} numberOfLines={1}>Physical Assets</Text>
                  </View>
                  <Text style={styles.accountItemBal} numberOfLines={1}>
                    ৳ {physicalAssetsValuation.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.accountItemRow, activeTab === 'loans' && styles.accountItemRowActive]}
                  onPress={() => onSelectTab('loans')}
                  activeOpacity={0.7}
                >
                  <View style={styles.accountItemLeft}>
                    <View style={[styles.accountColorDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.accountItemName} numberOfLines={1}>Debts & Loans</Text>
                  </View>
                  <Text style={[styles.accountItemBal, { color: '#EF4444' }]} numberOfLines={1}>
                    -৳ {totalDebt.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 5. Footer: Dedicated Mobile App Utility Button + User Profile */}
      <View style={styles.footerSection}>
        {/* Eye-Catching Mobile App & PWA Trigger in Sidebar Utility */}
        {!isCollapsed && onOpenQrModal && (
          <TouchableOpacity
            style={styles.mobileAppUtilityBtn}
            onPress={onOpenQrModal}
            activeOpacity={0.85}
          >
            <Ionicons name="phone-portrait-outline" size={15} color="#38BDF8" />
            <Text style={styles.mobileAppUtilityText} numberOfLines={1}>
              Install Mobile App (PWA)
            </Text>
            <Ionicons name="chevron-forward" size={12} color="#64748B" />
          </TouchableOpacity>
        )}

        {/* User Profile Bar */}
        <TouchableOpacity
          style={[styles.userPill, isCollapsed && styles.userPillCollapsed]}
          onPress={onOpenAuthModal}
          activeOpacity={0.85}
        >
          <View style={styles.avatar}>
            {userProfile.photoUri ? (
              <Image source={{ uri: userProfile.photoUri }} style={styles.avatarImg} />
            ) : (
              <Text style={{ fontSize: 16 }}>{userProfile.avatar || '👨‍💼'}</Text>
            )}
          </View>
          {!isCollapsed && (
            <View style={styles.userMeta}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {userProfile.name}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOnline ? '#10B981' : '#F59E0B' },
                  ]}
                />
              </View>
              <Text style={styles.userRole} numberOfLines={1}>
                @{userProfile.id || 'rashed01'} • {isOnline ? 'Online' : 'Local'}
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
    width: 260,
    minWidth: 260,
    maxWidth: 260,
    backgroundColor: '#0B132B', // Deep Quicken Obsidian Navy
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    paddingVertical: Spacing.md,
    zIndex: 40,
    overflow: 'hidden',
  },
  sidebarCollapsed: {
    width: 68,
    minWidth: 68,
    maxWidth: 68,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
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
  brandTextCol: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandTag: {
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  collapseBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#111D38',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  netWorthWidget: {
    marginHorizontal: 12,
    marginVertical: 4,
    backgroundColor: '#111D38',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netWorthLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#10B981',
  },
  netWorthAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  netWorthBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  assetsText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
  },
  debtText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '700',
  },
  quickEntryWrapper: {
    paddingHorizontal: 12,
    marginVertical: 6,
  },
  quickEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    borderRadius: Radius.md,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  quickEntryBtnCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  quickEntryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  menuListContent: {
    paddingBottom: 20,
  },
  navGroup: {
    marginBottom: 4,
  },
  groupHeaderTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    marginVertical: 1,
    position: 'relative',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navItemActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.16)',
  },
  navItemHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    backgroundColor: '#38BDF8',
    borderRadius: 1.5,
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
    color: '#94A3B8',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  navLabelHovered: {
    color: '#38BDF8',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.3)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#111D38',
    borderRadius: 5,
    marginTop: 4,
    marginBottom: 2,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  accordionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  accordionSubtotal: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  accountSubList: {
    paddingLeft: 4,
    gap: 1,
  },
  accountItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  accountItemRowHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  accountItemRowActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
  },
  accountItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  accountColorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  accountItemName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
    flex: 1,
  },
  accountItemBal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F1F5F9',
    flexShrink: 0,
    marginLeft: 6,
  },
  footerSection: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  mobileAppUtilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111D38',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  mobileAppUtilityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    flex: 1,
    marginLeft: 6,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111D38',
    padding: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  userPillCollapsed: {
    justifyContent: 'center',
    padding: 6,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  userMeta: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  userRole: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
});
