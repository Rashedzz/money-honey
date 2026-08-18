import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import { FinancialPlanningSuite } from '../../finance/financialPlanningTools';

interface FinancialConsultantToolsCardProps {
  planning: FinancialPlanningSuite;
}

export const FinancialConsultantToolsCard: React.FC<FinancialConsultantToolsCardProps> = ({
  planning,
}) => {
  return (
    <View style={styles.container}>
      {/* ========================================================= */}
      {/* 1. PRINCIPAL CONSULTANT STRATEGIC DIRECTIVES              */}
      {/* ========================================================= */}
      <GlassCard style={styles.card} padding={18} glowColor={Colors.primary}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={{ fontSize: 18 }}>👑</Text>
            <Text style={styles.title}>PRINCIPAL WEALTH CONSULTANT DIRECTIVES</Text>
          </View>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeText}>Audit Grade: {planning.budget503020.consultantGrade}</Text>
          </View>
        </View>

        <Text style={styles.subText}>
          Institutional financial recommendations based on your balance sheet, cash velocity, and debt structure:
        </Text>

        <View style={styles.recList}>
          {planning.consultantRecommendations.map((rec) => (
            <View key={rec.id} style={styles.recCard}>
              <View style={styles.recHeader}>
                <View style={styles.recTagRow}>
                  <Ionicons name={rec.icon as any} size={14} color={Colors.primary} />
                  <Text style={styles.recCategory}>{rec.category}</Text>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor:
                        rec.severity === 'CRITICAL'
                          ? 'rgba(255,71,87,0.18)'
                          : rec.severity === 'STRATEGIC'
                          ? 'rgba(0,229,179,0.18)'
                          : 'rgba(123,110,246,0.18)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      {
                        color:
                          rec.severity === 'CRITICAL'
                            ? Colors.danger
                            : rec.severity === 'STRATEGIC'
                            ? Colors.primary
                            : Colors.secondary,
                      },
                    ]}
                  >
                    {rec.severity}
                  </Text>
                </View>
              </View>

              <Text style={styles.recTitle}>{rec.title}</Text>
              <Text style={styles.recDirective}>{rec.directive}</Text>
              <View style={styles.recImpactBox}>
                <Text style={styles.recImpactText}>💡 Financial Impact: {rec.impact}</Text>
              </View>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* ========================================================= */}
      {/* 2. RULE OF 72 CAPITAL DOUBLING TIME COMPARISON             */}
      {/* ========================================================= */}
      <GlassCard style={styles.card} padding={18} glowColor={Colors.secondary}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={{ fontSize: 18 }}>⚡</Text>
            <Text style={[styles.title, { color: Colors.secondary }]}>
              RULE OF 72: YEARS TO DOUBLE YOUR CAPITAL
            </Text>
          </View>
          <Text style={styles.formulaTag}>t = 72 ÷ Annual Return (%)</Text>
        </View>

        <Text style={styles.subText}>
          How many years it takes for ৳ 10 Lakhs to compound into ৳ 20 Lakhs across your asset classes:
        </Text>

        <View style={styles.ruleList}>
          {planning.ruleOf72.map((item) => (
            <View key={item.instrument} style={styles.ruleRow}>
              <View style={styles.ruleLeft}>
                <Text style={styles.ruleName}>{item.instrument}</Text>
                <Text style={styles.ruleRate}>
                  {item.annualRatePct}% p.a. • {item.category}
                </Text>
              </View>

              <View style={styles.ruleRight}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.doublingBar,
                      {
                        width: `${Math.max(15, 100 - item.yearsToDouble * 7)}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.doublingYears, { color: item.color }]}>
                  {item.yearsToDouble} Years
                </Text>
              </View>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* ========================================================= */}
      {/* 3. FIRE RETIREMENT (4% SAFE WITHDRAWAL RULE) & 50/30/20   */}
      {/* ========================================================= */}
      <GlassCard style={styles.card} padding={18} glowColor={Colors.accent}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={{ fontSize: 18 }}>🎯</Text>
            <Text style={[styles.title, { color: Colors.accent }]}>
              FIRE RETIREMENT FREEDOM & 4% WITHDRAWAL RULE
            </Text>
          </View>
          <View style={styles.firePill}>
            <Text style={styles.firePillText}>{planning.firePlan.fireStatus}</Text>
          </View>
        </View>

        <View style={styles.fireGrid}>
          <View style={styles.fireCol}>
            <Text style={styles.fireLabel}>FREEDOM NUMBER (25X EXPENSES)</Text>
            <Text style={[styles.fireVal, { color: Colors.accent }]}>
              ৳ {(planning.firePlan.fireCorpusTarget / 10000000).toFixed(2)} Crore
            </Text>
            <Text style={styles.fireSub}>
              Covers ৳ {(planning.firePlan.annualExpenses / 100000).toFixed(1)}L Annual Living Forever
            </Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.fireCol}>
            <Text style={styles.fireLabel}>SAFE MONTHLY WITHDRAWAL</Text>
            <Text style={[styles.fireVal, { color: Colors.primary }]}>
              ৳ {planning.firePlan.monthlySafeWithdrawalAmount.toLocaleString('en-IN')}/mo
            </Text>
            <Text style={styles.fireSub}>At 4% perpetual safe withdrawal rate</Text>
          </View>
        </View>

        {/* FIRE Progress Bar */}
        <View style={styles.fireProgressContainer}>
          <View style={styles.fireProgressHeader}>
            <Text style={styles.fireProgressText}>Financial Freedom Progress</Text>
            <Text style={styles.fireProgressPctText}>{planning.firePlan.fireProgressPct}% Achieved</Text>
          </View>
          <View style={styles.fireProgressBg}>
            <View
              style={[
                styles.fireProgressFill,
                { width: `${Math.min(100, planning.firePlan.fireProgressPct)}%` },
              ]}
            />
          </View>
          <Text style={styles.fireEtaText}>
            ⏱️ Estimated {planning.firePlan.estimatedYearsToFIRE} years to 100% passive freedom at current savings pace.
          </Text>
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
    marginBottom: 4,
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
    color: Colors.primary,
    fontWeight: '800',
  },
  gradeBadge: {
    backgroundColor: 'rgba(0, 229, 179, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  gradeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  formulaTag: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  subText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  recList: {
    gap: Spacing.sm,
  },
  recCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recCategory: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.primary,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  severityText: {
    fontSize: 8,
    fontWeight: '800',
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  recDirective: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  recImpactBox: {
    backgroundColor: 'rgba(0, 229, 179, 0.05)',
    padding: 6,
    borderRadius: Radius.sm,
  },
  recImpactText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  ruleList: {
    gap: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  ruleLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  ruleName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ruleRate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  ruleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 130,
    justifyContent: 'flex-end',
  },
  barWrapper: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  doublingBar: {
    height: '100%',
    borderRadius: 3,
  },
  doublingYears: {
    fontSize: 11,
    fontWeight: '800',
    minWidth: 50,
    textAlign: 'right',
  },
  firePill: {
    backgroundColor: 'rgba(255, 181, 71, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  firePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accent,
  },
  fireGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  fireCol: {
    flex: 1,
  },
  vLine: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 8,
  },
  fireLabel: {
    ...Typography.label,
    fontSize: 7,
    color: Colors.textMuted,
  },
  fireVal: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  fireSub: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  fireProgressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.md,
    padding: 10,
  },
  fireProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fireProgressText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  fireProgressPctText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accent,
  },
  fireProgressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  fireProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  fireEtaText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
