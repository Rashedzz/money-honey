import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { GlassCard } from '../../src/components/shared/GlassCard';
import { NetWorthMeter } from '../../src/components/dashboard/NetWorthMeter';
import { CountdownCard } from '../../src/components/dashboard/CountdownCard';
import { EMIReminderCard } from '../../src/components/dashboard/EMIReminderCard';
import { CashFlowChart } from '../../src/components/dashboard/CashFlowChart';

// Mocks for hooks
const useAccounts = () => ({ data: { netWorth: 12345678, totalAssets: 15000000, totalLiabilities: 2654322, allocation: { cash: 2000000, fixedDeposits: 10000000, savings: 3000000 } }, isLoading: false });
const useLoans = () => ({ data: [{ id: '1', title: 'Home Loan', bank: 'City Bank', emi: 45000, dueDate: new Date(2026, 7, 25), paymentNumber: 12, totalPayments: 240, outstanding: 4500000 }], isLoading: false });
const useInvestments = () => ({ data: [{ id: '1', title: 'DBBL FDR', subtitle: 'Ref: 123456', days: 45, date: new Date(2026, 9, 2), amount: 500000, type: 'fdr' as const, urgency: 'safe' as const, pct: 85 }], isLoading: false });

export default function DashboardScreen() {
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: loansData, isLoading: loansLoading } = useLoans();
  const { data: investmentsData, isLoading: invLoading } = useInvestments();
  const [refreshing, setRefreshing] = React.useState(false);

  const shimmerOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 800 }), withTiming(0.3, { duration: 800 })),
      -1,
      true
    );
  }, []);

  const animatedShimmer = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.seeAll}>See All →</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.date}>{format(new Date(), 'EEEE, d MMMM yyyy')}</Text>
          </View>
          <View style={styles.headerIcons}>
            <Ionicons name="settings-outline" size={22} color="#FFF" style={styles.icon} />
            <Ionicons name="notifications-outline" size={22} color="#FFF" />
          </View>
        </View>

        {/* Net Worth */}
        {accountsLoading ? (
          <Animated.View style={[styles.skeletonBlock, animatedShimmer]} />
        ) : (
          <NetWorthMeter
            netWorth={accountsData.netWorth}
            totalAssets={accountsData.totalAssets}
            totalLiabilities={accountsData.totalLiabilities}
            allocation={accountsData.allocation}
          />
        )}

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard} padding={12}>
            <LinearGradient colors={Colors.gradientGreen} style={styles.statIconBg}>
              <Text>🏦</Text>
            </LinearGradient>
            <Text style={styles.statLabel}>BANKS</Text>
            <Text style={styles.statValue}>৳1.2M</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding={12}>
            <LinearGradient colors={Colors.gradientPurple} style={styles.statIconBg}>
              <Text>📊</Text>
            </LinearGradient>
            <Text style={styles.statLabel}>INVESTMENTS</Text>
            <Text style={styles.statValue}>৳4.5M</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding={12}>
            <LinearGradient colors={Colors.gradientDanger} style={styles.statIconBg}>
              <Text>💳</Text>
            </LinearGradient>
            <Text style={styles.statLabel}>LOANS</Text>
            <Text style={styles.statValue}>2 active</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding={12}>
            <LinearGradient colors={Colors.gradientAmber} style={styles.statIconBg}>
              <Text>📈</Text>
            </LinearGradient>
            <Text style={styles.statLabel}>MONTHLY</Text>
            <Text style={[styles.statValue, { color: Colors.primary }]}>+৳45K</Text>
          </GlassCard>
        </View>

        {/* Upcoming EMIs */}
        <View style={styles.section}>
          {renderSectionHeader('UPCOMING EMIS')}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {loansData.map((loan) => (
              <View key={loan.id} style={{ width: 320, marginRight: Spacing.md }}>
                <EMIReminderCard
                  loanTitle={loan.title}
                  bankName={loan.bank}
                  emiAmount={loan.emi}
                  dueDate={loan.dueDate}
                  paymentNumber={loan.paymentNumber}
                  totalPayments={loan.totalPayments}
                  outstandingPrincipal={loan.outstanding}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Maturity Countdowns */}
        <View style={styles.section}>
          {renderSectionHeader('MATURITY COUNTDOWNS')}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {investmentsData.map((inv) => (
              <CountdownCard
                key={inv.id}
                title={inv.title}
                subtitle={inv.subtitle}
                daysRemaining={inv.days}
                targetDate={inv.date}
                amount={inv.amount}
                amountLabel="Maturity Value"
                type={inv.type}
                urgencyLevel={inv.urgency}
                percentageElapsed={inv.pct}
              />
            ))}
          </ScrollView>
        </View>

        {/* Cash Flow */}
        <View style={styles.section}>
          {renderSectionHeader('CASH FLOW')}
          <View style={{ marginHorizontal: Spacing.md }}>
            <CashFlowChart
              data={[
                { month: 'May', income: 120000, expense: 45000, emi: 20000 },
                { month: 'Jun', income: 125000, expense: 50000, emi: 20000 },
                { month: 'Jul', income: 130000, expense: 48000, emi: 20000 },
                { month: 'Aug', income: 140000, expense: 60000, emi: 20000 },
              ]}
              currentMonth="August"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  greeting: {
    ...Typography.displayM,
    color: Colors.textPrimary,
  },
  date: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.md,
  },
  skeletonBlock: {
    height: 200,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '47%',
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: 10,
    marginBottom: 4,
  },
  statValue: {
    ...Typography.displayM,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.primary,
  },
  seeAll: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  hScroll: {
    paddingHorizontal: Spacing.md,
  },
});
