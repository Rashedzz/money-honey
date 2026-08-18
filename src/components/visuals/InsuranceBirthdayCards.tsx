import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import {
  LifeInsurancePolicy,
  InsuranceSummary,
  BirthdayReminderSummary,
} from '../../finance/insuranceBirthday';

interface InsuranceBirthdayCardsProps {
  policies: LifeInsurancePolicy[];
  insuranceSummary: InsuranceSummary;
  birthdayReminders: BirthdayReminderSummary[];
  onAddPolicyPress?: () => void;
  onAddBirthdayPress?: () => void;
}

export const InsuranceBirthdayCards: React.FC<InsuranceBirthdayCardsProps> = ({
  policies,
  insuranceSummary,
  birthdayReminders,
  onAddPolicyPress,
  onAddBirthdayPress,
}) => {
  const [selectedGreeting, setSelectedGreeting] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* ========================================================= */}
      {/* 1. LIFE INSURANCE VAULT & FAMILY PROTECTION               */}
      {/* ========================================================= */}
      <GlassCard style={styles.card} padding={18} glowColor={Colors.secondary}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="shield-half-outline" size={20} color={Colors.secondary} />
            <Text style={styles.title}>LIFE INSURANCE & FAMILY PROTECTION VAULT</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={onAddPolicyPress}>
            <Ionicons name="add" size={14} color="#000" />
            <Text style={styles.addBtnText}>+ Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.protectionValueRow}>
          <View>
            <Text style={styles.metricLabel}>TOTAL DEATH BENEFIT / SUM ASSURED</Text>
            <Text style={[styles.mainVal, { color: Colors.secondary }]}>
              ৳ {(insuranceSummary.totalLifeCoverage / 10000000).toFixed(2)} Crore
            </Text>
            <Text style={styles.subMeta}>
              Across {insuranceSummary.policiesCount} Active Life Policies
            </Text>
          </View>

          <View style={styles.coverageRatioBox}>
            <Text style={styles.coverageRatioLabel}>Debt Coverage</Text>
            <View
              style={[
                styles.ratioPill,
                {
                  backgroundColor:
                    insuranceSummary.coverageToDebtRatioPct >= 100
                      ? 'rgba(0,229,179,0.15)'
                      : 'rgba(255,181,71,0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.ratioText,
                  {
                    color:
                      insuranceSummary.coverageToDebtRatioPct >= 100
                        ? Colors.primary
                        : Colors.accent,
                  },
                ]}
              >
                {insuranceSummary.coverageToDebtRatioPct}% Covered
              </Text>
            </View>
          </View>
        </View>

        {/* Mini 3-stat strip */}
        <View style={styles.statStrip}>
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>ANNUAL PREMIUMS</Text>
            <Text style={styles.stripVal}>
              ৳ {insuranceSummary.totalAnnualPremiums.toLocaleString('en-IN')}/yr
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>PREMIUMS PAID TO DATE</Text>
            <Text style={[styles.stripVal, { color: Colors.primary }]}>
              ৳ {(insuranceSummary.totalPremiumsPaidToDate / 100000).toFixed(1)} Lakhs
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.stripCol}>
            <Text style={styles.stripLabel}>MATURITY VALUE</Text>
            <Text style={[styles.stripVal, { color: Colors.secondary }]}>
              ৳ {(insuranceSummary.projectedTotalMaturityValue / 10000000).toFixed(2)} Cr
            </Text>
          </View>
        </View>

        {/* Policy List */}
        <View style={styles.policyList}>
          {policies.map((p) => (
            <View key={p.id} style={styles.policyRow}>
              <View style={styles.policyLeft}>
                <Text style={styles.policyName}>{p.policyName}</Text>
                <Text style={styles.policySub}>
                  {p.insurer} • {p.policyNumber} • Nominee: {p.nomineeName}
                </Text>
              </View>
              <View style={styles.policyRight}>
                <Text style={styles.policySum}>৳ {(p.sumAssured / 100000).toFixed(1)}L Cover</Text>
                <Text style={styles.policyPrem}>
                  ৳ {p.premiumAmount.toLocaleString('en-IN')} ({p.premiumFrequency})
                </Text>
              </View>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* ========================================================= */}
      {/* 2. BIRTHDAY CELEBRATIONS & FAMILY MILESTONE REMINDERS     */}
      {/* ========================================================= */}
      <GlassCard style={styles.card} padding={18} glowColor={Colors.accent}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={{ fontSize: 18 }}>🎂</Text>
            <Text style={[styles.title, { color: Colors.accent }]}>
              FAMILY BIRTHDAYS & CELEBRATION CALENDAR
            </Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.accent }]} onPress={onAddBirthdayPress}>
            <Ionicons name="add" size={14} color="#000" />
            <Text style={styles.addBtnText}>+ Birthday</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.bdaySubText}>
          Upcoming family milestones, gift budgets & personalized greeting messages
        </Text>

        <View style={styles.bdayList}>
          {birthdayReminders.map((b, idx) => (
            <View key={idx} style={styles.bdayCard}>
              <View style={styles.bdayRow}>
                {/* Left Emoji & Info */}
                <View style={styles.bdayInfoCol}>
                  <View style={styles.bdayNameRow}>
                    <Text style={styles.bdayName}>{b.personName}</Text>
                    <View
                      style={[
                        styles.urgencyBadge,
                        {
                          backgroundColor:
                            b.urgency === 'critical'
                              ? 'rgba(255,71,87,0.18)'
                              : 'rgba(255,181,71,0.18)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          {
                            color:
                              b.urgency === 'critical' ? Colors.danger : Colors.accent,
                          },
                        ]}
                      >
                        {b.daysRemaining === 0 ? 'TODAY! 🎉' : `in ${b.daysRemaining} days`}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.bdayDetails}>
                    Turning {b.turningAge} • {b.nextBirthdayFormatted} • Gift Budget: ৳ {b.giftBudget.toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Right Action: Show Greeting Message */}
                <TouchableOpacity
                  style={styles.greetingBtn}
                  onPress={() => setSelectedGreeting(selectedGreeting === b.personName ? null : b.personName)}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.primary} />
                  <Text style={styles.greetingBtnText}>
                    {selectedGreeting === b.personName ? 'Hide' : 'Greeting'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Collapsible Greeting Card Preview */}
              {selectedGreeting === b.personName && (
                <View style={styles.greetingPreviewBox}>
                  <Text style={styles.greetingCardHeader}>✨ PERSONALIZED BIRTHDAY MESSAGE:</Text>
                  <Text style={styles.greetingCardBody}>{b.greetingText}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  card: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  addBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  protectionValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  metricLabel: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
  },
  mainVal: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  coverageRatioBox: {
    alignItems: 'flex-end',
  },
  coverageRatioLabel: {
    ...Typography.caption,
    fontSize: 9,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  ratioPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  ratioText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: Spacing.md,
  },
  stripCol: {
    flex: 1,
    alignItems: 'center',
  },
  vLine: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  stripLabel: {
    ...Typography.label,
    fontSize: 8,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  stripVal: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  policyList: {
    gap: 8,
  },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  policyLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  policyName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  policySub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  policyRight: {
    alignItems: 'flex-end',
  },
  policySum: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.secondary,
  },
  policyPrem: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  bdaySubText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: Spacing.md,
  },
  bdayList: {
    gap: 8,
  },
  bdayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  bdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bdayInfoCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  bdayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  bdayName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: '800',
  },
  bdayDetails: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  greetingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 179, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  greetingBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  greetingPreviewBox: {
    backgroundColor: 'rgba(0, 229, 179, 0.06)',
    borderRadius: Radius.sm,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 179, 0.15)',
  },
  greetingCardHeader: {
    ...Typography.label,
    fontSize: 8,
    color: Colors.primary,
    marginBottom: 4,
  },
  greetingCardBody: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
