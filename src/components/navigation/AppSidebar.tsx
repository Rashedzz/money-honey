import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
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
    { id: 'dashboard', label: 'Home Dashboard', icon: 'grid-outline' },
    { id: 'register', label: 'Quicken Register', icon: 'receipt-outline', badge: 'Active' },
    { id: 'expenses', label: 'Spending & Budgets', icon: 'pie-chart-outline' },
    { id: 'reports', label: 'Financial Statements', icon: 'document-text-outline', badge: 'IFRS / Intuit' },
    { id: 'categories', label: 'Category & Budgets', icon: 'pricetags-outline', badge: 'Setup' },
    { id: 'schedules', label: 'Bills & Schedules', icon: 'calendar-outline' },
    { id: 'settings', label: 'Settings & Vault', icon: 'settings-outline' },
  ];

  return (
    <View style={[styles.sidebar, isCollapsed && styles.sidebarCollapsed]}>
      {/* 1. Brand Header */}
      <View style={[styles.brandHeader, isCollapsed && styles.brandHeaderCollapsed]}>
        {!isCollapsed && (
          <View style={styles.brandRow}>
            <DynamicMoneyTree size={40} />
            <View style={styles.brandTextCol}>
              <Text style={styles.brandTitle}>Money-Honey</Text>
              <Text style={styles.brandTag}>Quicken Executive Suite</Text>
            </View>
          </View>
        )}

        {isCollapsed && <DynamicMoneyTree size={34} />}

        <TouchableOpacity
          style={styles.collapseBtn}
          onPress={onToggleCollapse}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
            size={16}
            color="#94A3B8"
          />
        </TouchableOpacity>
      </View>

      {/* 2. Quicken Net Worth Mini Pill Header (Desktop uncollapsed) */}
      {!isCollapsed && (
        <View style={styles.netWorthWidget}>
          <View style={styles.netWorthHeader}>
            <Text style={styles.netWorthLabel}>NET WORTH</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.netWorthAmount}>৳ {netWorth.toLocaleString('en-IN')}</Text>
          <View style={styles.netWorthBreakdown}>
            <Text style={styles.assetsText}>Assets: ৳{totalAssets.toLocaleString('en-IN')}</Text>
            <Text style={styles.debtText}>Debt: ৳{totalDebt.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      )}

      {/* 3. New Transaction Action Button */}
      <View style={styles.quickEntryWrapper}>
        <TouchableOpacity
          style={[styles.quickEntryBtn, isCollapsed && styles.quickEntryBtnCollapsed]}
          onPress={onQuickEntryPress}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={18} color="#0284C7" />
          {!isCollapsed && <Text style={styles.quickEntryText}>+ New Transaction</Text>}
        </TouchableOpacity>
      </View>

      {/* 4. Quicken Account Bar & Workspaces Scroll */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        style={styles.menuList}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
      >
        {/* SECTION: BANKING & CASH */}
        {!isCollapsed ? (
          <View style={styles.accountSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setBankingExpanded(!bankingExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons
                  name={bankingExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={14}
                  color="#94A3B8"
                />
                <Text style={styles.sectionTitle}>BANKING & CASH</Text>
              </View>
              <Text style={styles.sectionSubtotal}>
                ৳ {totalBanking.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>

            {bankingExpanded && (
              <View style={styles.accountList}>
                {bankAccounts.map((acc) => {
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        styles.accountRow,
                        hoveredItem === acc.id && styles.accountRowHovered,
                      ]}
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
                      <View style={styles.accountRowLeft}>
                        <View style={[styles.accColorBar, { backgroundColor: acc.color || '#0284C7' }]} />
                        <Text style={styles.accName} numberOfLines={1}>
                          {acc.bankName}
                        </Text>
                      </View>
                      <Text style={styles.accBalance}>
                        ৳ {acc.currentBalance.toLocaleString('en-IN')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.collapsedGroupIcon, activeTab === 'accounts' && styles.collapsedGroupIconActive]}
            onPress={() => onSelectTab('accounts')}
          >
            <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* SECTION: INVESTING */}
        {!isCollapsed ? (
          <View style={styles.accountSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setInvestingExpanded(!investingExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons
                  name={investingExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={14}
                  color="#94A3B8"
                />
                <Text style={styles.sectionTitle}>INVESTING</Text>
              </View>
              <Text style={styles.sectionSubtotal}>
                ৳ {totalInvesting.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>

            {investingExpanded && (
              <View style={styles.accountList}>
                <TouchableOpacity
                  style={[styles.accountRow, activeTab === 'stocks' && styles.accountRowActive]}
                  onPress={() => onSelectTab('stocks')}
                  activeOpacity={0.7}
                >
                  <View style={styles.accountRowLeft}>
                    <View style={[styles.accColorBar, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.accName}>DSE/CSE Equities</Text>
                  </View>
                  <Text style={styles.accBalance}>
                    ৳ {stocksValuation.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.accountRow, activeTab === 'paper_assets' && styles.accountRowActive]}
                  onPress={() => onSelectTab('paper_assets')}
                  activeOpacity={0.7}
                >
                  <View style={styles.accountRowLeft}>
                    <View style={[styles.accColorBar, { backgroundColor: '#8B5CF6' }]} />
                    <Text style={styles.accName}>Sanchaypatra & FDR</Text>
                  </View>
                  <Text style={styles.accBalance}>
                    ৳ {paperAssetsValuation.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.collapsedGroupIcon, activeTab === 'stocks' && styles.collapsedGroupIconActive]}
            onPress={() => onSelectTab('stocks')}
          >
            <Ionicons name="trending-up-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* SECTION: PROPERTY & DEBT */}
        {!isCollapsed ? (
          <View style={styles.accountSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setPropertyExpanded(!propertyExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons
                  name={propertyExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={14}
                  color="#94A3B8"
                />
                <Text style={styles.sectionTitle}>PROPERTY & DEBT</Text>
              </View>
              <Text style={styles.sectionSubtotal}>
                ৳ {totalProperty.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>

            {propertyExpanded && (
              <View style={styles.accountList}>
                <TouchableOpacity
                  style={[styles.accountRow, activeTab === 'physical_assets' && styles.accountRowActive]}
                  onPress={() => onSelectTab('physical_assets')}
                  activeOpacity={0.7}
                >
                  <View style={styles.accountRowLeft}>
                    <View style={[styles.accColorBar, { backgroundColor: '#D97706' }]} />
                    <Text style={styles.accName}>Physical Assets</Text>
                  </View>
                  <Text style={styles.accBalance}>
                    ৳ {physicalAssetsValuation.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.accountRow, activeTab === 'loans' && styles.accountRowActive]}
                  onPress={() => onSelectTab('loans')}
                  activeOpacity={0.7}
                >
                  <View style={styles.accountRowLeft}>
                    <View style={[styles.accColorBar, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.accName}>Loans & Liabilities</Text>
                  </View>
                  <Text style={[styles.accBalance, { color: '#EF4444' }]}>
                    -৳ {totalDebt.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.collapsedGroupIcon, activeTab === 'loans' && styles.collapsedGroupIconActive]}
            onPress={() => onSelectTab('loans')}
          >
            <Ionicons name="card-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* SECTION: QUICKEN WORKSPACES */}
        <View style={[styles.accountSection, { marginTop: 12 }]}>
          {!isCollapsed && (
            <View style={styles.sectionHeaderStatic}>
              <Text style={styles.sectionTitle}>QUICKEN WORKSPACES</Text>
            </View>
          )}

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
                <Ionicons
                  name={item.icon}
                  size={19}
                  color={isActive ? '#0284C7' : isHovered ? '#38BDF8' : '#94A3B8'}
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
                      <View style={[styles.badge, isActive && styles.badgeActive]}>
                        <Text style={[styles.badgeText, isActive && { color: '#0284C7' }]}>
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
        </View>
      </ScrollView>

      {/* 5. Bottom Section: Storage State & User Pill (PWA Download cleanly removed to top header) */}
      <View style={styles.footerSection}>
        {!isCollapsed && (
          <View style={styles.storageStatusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text style={styles.storageStatusText}>
              {isOnline ? 'Online Synced' : 'Local Storage Active'}
            </Text>
          </View>
        )}

        {/* User Profile Trigger */}
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
                <Ionicons name="shield-checkmark" size={12} color="#10B981" />
              </View>
              <Text style={styles.userRole}>
                @{userProfile.id || 'rashed01'} • Switch
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
    width: 280,
    backgroundColor: '#0F172A', // Deep Quicken Slate / Navy
    borderRightWidth: 1.5,
    borderRightColor: '#1E293B',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    paddingVertical: Spacing.md,
    zIndex: 40,
  },
  sidebarCollapsed: {
    width: 72,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    marginBottom: Spacing.xs,
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
    gap: 10,
    flex: 1,
  },
  brandTextCol: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandTag: {
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  collapseBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  netWorthWidget: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    backgroundColor: '#1E293B',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netWorthLabel: {
    fontSize: 10,
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
    fontSize: 9,
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
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  quickEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  quickEntryBtnCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  quickEntryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  menuList: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    marginTop: 4,
  },
  accountSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    marginBottom: 2,
  },
  sectionHeaderStatic: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  sectionSubtotal: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  accountList: {
    paddingLeft: 4,
    gap: 1,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  accountRowHovered: {
    backgroundColor: '#1E293B',
  },
  accountRowActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
  },
  accountRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  accColorBar: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
  },
  accName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    flex: 1,
  },
  accBalance: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  collapsedGroupIcon: {
    width: 48,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 4,
  },
  collapsedGroupIconActive: {
    backgroundColor: '#0284C7',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
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
    backgroundColor: '#1E293B',
  },
  navItemHovered: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
  },
  labelRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 13,
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
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  activeIndicatorBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    backgroundColor: '#0284C7',
    borderRadius: 1.5,
  },
  footerSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  storageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  storageStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userPillCollapsed: {
    justifyContent: 'center',
    padding: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userMeta: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
});
