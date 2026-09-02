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
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gradeBadge: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  gradeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  formulaTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  subText: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  recList: {
    gap: Spacing.sm,
  },
  recCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
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
    gap: 6,
  },
  recCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  recDirective: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 6,
  },
  recImpactBox: {
    backgroundColor: '#E0F2FE',
    padding: 8,
    borderRadius: Radius.sm,
  },
  recImpactText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '700',
  },
  ruleList: {
    gap: 10,
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  ruleLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  ruleName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  ruleRate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ruleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 140,
    justifyContent: 'flex-end',
  },
  barWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  doublingBar: {
    height: '100%',
    borderRadius: 4,
  },
  doublingYears: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 55,
    textAlign: 'right',
  },
  firePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  firePillText: {
    fontSize: 11,
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
    height: 44,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  fireLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  fireVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  fireSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  fireProgressContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    padding: 12,
  },
  fireProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fireProgressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  fireProgressPctText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  fireProgressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 8,
  },
  fireProgressFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 4,
  },
  fireEtaText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
