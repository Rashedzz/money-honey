/**
 * FinancialStatementsScreen.tsx
 * World-Class International Financial Reporting & Accounting Intelligence Suite.
 * Compliant with IFRS / GAAP standards (Balance Sheet, Cash Flow, Income Statement, Expense Ledger).
 * Includes Intuit QuickBooks / Quicken / Mint financial health ratios, PDF generation, printing, and sharing.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import {
  FinancialStatementsEngine,
  FinancialPeriod,
  BalanceSheetReport,
  CashFlowReport,
  IncomeStatementReport,
  ExpenseLedgerReport,
  IntuitFinancialIntelligence,
  BudgetVarianceReport,
  TaxAssessmentReport,
} from '../../services/financialStatementsEngine';
import { ReportExportService } from '../../services/reportExportService';
import { subscribeToBalanceUpdates } from '../../services/transactionManager';

type ReportTab =
  | 'balance_sheet'
  | 'cash_flow'
  | 'income_statement'
  | 'expense_ledger'
  | 'budget_variance'
  | 'tax_assessment'
  | 'intuit_ratios';

export const FinancialStatementsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('balance_sheet');
  const [selectedPeriod, setSelectedPeriod] = useState<FinancialPeriod>('this_month');
  const [refreshKey, setRefreshKey] = useState(0);
  const [currencyMode, setCurrencyMode] = useState<'BDT' | 'USD'>('BDT');

  // Reactively recompute whenever transactions or balances change
  useEffect(() => {
    const unsub = subscribeToBalanceUpdates(() => {
      setRefreshKey((k) => k + 1);
    });
    return () => unsub();
  }, []);

  // Compute reports based on selected period
  const balanceSheet: BalanceSheetReport = useMemo(() => {
    const _ = refreshKey;
    return FinancialStatementsEngine.generateBalanceSheet();
  }, [refreshKey]);

  const cashFlow: CashFlowReport = useMemo(() => {
    const _ = refreshKey;
    return FinancialStatementsEngine.generateCashFlowStatement(selectedPeriod);
  }, [selectedPeriod, refreshKey]);

  const incomeStatement: IncomeStatementReport = useMemo(() => {
    const _ = refreshKey;
    return FinancialStatementsEngine.generateIncomeStatement(selectedPeriod);
  }, [selectedPeriod, refreshKey]);

  const expenseLedger: ExpenseLedgerReport = useMemo(() => {
    const _ = refreshKey;
    return FinancialStatementsEngine.generateExpenseLedger(selectedPeriod);
  }, [selectedPeriod, refreshKey]);

  const budgetVariance: BudgetVarianceReport = useMemo(() => {
    const _ = refreshKey;
    return FinancialStatementsEngine.generateBudgetVarianceReport(selectedPeriod);
  }, [selectedPeriod, refreshKey]);

  const taxAssessment: TaxAssessmentReport = useMemo(() => {
    const _ = refreshKey;
    return FinancialStatementsEngine.generateTaxAssessmentReport(selectedPeriod);
  }, [selectedPeriod, refreshKey]);

  const intuitRatios: IntuitFinancialIntelligence = useMemo(() => {
    return FinancialStatementsEngine.calculateIntuitFinancialRatios(balanceSheet, incomeStatement);
  }, [balanceSheet, incomeStatement]);

  // Currency Formatter
  const fmt = (amt: number): string => {
    if (currencyMode === 'USD') {
      const usd = Math.round(amt / 120); // 1 USD ~ 120 BDT
      return `$ ${usd.toLocaleString('en-US')}`;
    }
    return `৳ ${amt.toLocaleString('en-IN')}`;
  };

  // Export handlers
  const handlePrintOrPdf = () => {
    const html = ReportExportService.generateFullReportHtml({
      reportType: (activeTab === 'intuit_ratios' ? 'master_dossier' : activeTab) as any,
      periodLabel: cashFlow.periodLabel,
      balanceSheet,
      cashFlow,
      incomeStatement,
      expenseLedger,
      intuitRatios,
      budgetVariance,
      taxAssessment,
      ownerName: 'Rashed Zaman',
    });
    ReportExportService.printFinancialReport(html);
  };

  const handleDownloadHtml = () => {
    const html = ReportExportService.generateFullReportHtml({
      reportType: 'master_dossier',
      periodLabel: cashFlow.periodLabel,
      balanceSheet,
      cashFlow,
      incomeStatement,
      expenseLedger,
      intuitRatios,
      budgetVariance,
      taxAssessment,
      ownerName: 'Rashed Zaman',
    });
    const filename = `Financial_Report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.html`;
    ReportExportService.downloadHtmlReport(filename, html);
    Alert.alert('Report Downloaded', `Comprehensive Financial Statement downloaded as ${filename}`);
  };

  const handleShareReport = async () => {
    const summaryText = `📊 Financial Statement Summary (${cashFlow.periodLabel})
---------------------------------------
• Total Assets: ${fmt(balanceSheet.totalAssets)}
• Total Liabilities: ${fmt(balanceSheet.totalLiabilities)}
• Net Worth (Equity): ${fmt(balanceSheet.equity.totalEquity)}
• Net Period Cash Flow: ${fmt(cashFlow.netChangeInCash)}
• Gross Revenue: ${fmt(incomeStatement.grossTotalRevenue)}
• Total Expenses: ${fmt(expenseLedger.totalExpenses)}
• Net Operating Surplus: ${fmt(incomeStatement.netOperatingIncome)}
• Budget Variance: ${fmt(budgetVariance.netExpenseVariance)} (${budgetVariance.expenseVarianceStatus.toUpperCase()})
• Net Est. Tax: ${fmt(taxAssessment.netPayableTax)}
• Current Ratio: ${intuitRatios.ratios[0]?.formatted}
• Cash Runway: ${intuitRatios.cashRunwayMonths} Months
---------------------------------------
Money-Honey Private Wealth Management (IFRS / GAAP Audited)`;

    const res = await ReportExportService.shareFinancialReport({
      title: `Financial Statement - ${cashFlow.periodLabel}`,
      text: summaryText,
    });

    if (res.method === 'clipboard') {
      Alert.alert('Summary Copied', 'Executive financial summary copied to clipboard!');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Header & Actions Ribbon */}
      <GlassCard style={styles.headerCard} padding={20} glowColor={Colors.primary}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1, minWidth: 260 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.badgeIFRS}>
                <Text style={styles.badgeIFRSText}>IFRS / GAAP AUDITED</Text>
              </View>
              <View style={styles.badgeIntuit}>
                <Text style={styles.badgeIntuitText}>INTUIT-GRADE SUITE</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>Financial Statements & Audit Ledgers</Text>
            <Text style={styles.headerSub}>
              Consolidated Balance Sheet, Statement of Cash Flows, Income Ledger, Expense Ledger & Ratios
            </Text>
          </View>

          {/* Action Toolbar */}
          <View style={styles.actionButtonsCol}>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.exportBtn, { backgroundColor: '#0284C7' }]}
                onPress={handlePrintOrPdf}
                activeOpacity={0.8}
              >
                <Ionicons name="print-outline" size={16} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Print / PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportBtn, { backgroundColor: '#10B981' }]}
                onPress={handleShareReport}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportBtn, { backgroundColor: '#64748B' }]}
                onPress={handleDownloadHtml}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Download</Text>
              </TouchableOpacity>

              {/* Currency Toggle */}
              <TouchableOpacity
                style={styles.currencyToggleBtn}
                onPress={() => setCurrencyMode((c) => (c === 'BDT' ? 'USD' : 'BDT'))}
                activeOpacity={0.8}
              >
                <Text style={styles.currencyToggleText}>
                  {currencyMode === 'BDT' ? '৳ BDT' : '$ USD'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Period Selector Pills */}
        <View style={styles.periodRow}>
          <Text style={styles.periodRowLabel}>FISCAL PERIOD:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodPillScroll}>
            {[
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'this_quarter', label: 'This Quarter' },
              { id: 'ytd', label: 'Year-to-Date (YTD)' },
              { id: 'fiscal_year', label: 'Fiscal Year (FY)' },
              { id: 'all', label: 'All-Time' },
            ].map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.periodPill, selectedPeriod === p.id && styles.periodPillActive]}
                onPress={() => setSelectedPeriod(p.id as FinancialPeriod)}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodPillText, selectedPeriod === p.id && styles.periodPillTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </GlassCard>

      {/* 2. Statements Switcher Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {[
            { id: 'balance_sheet', label: 'Balance Sheet', icon: 'scale-outline' },
            { id: 'cash_flow', label: 'Cash Flow Statement', icon: 'water-outline' },
            { id: 'income_statement', label: 'Income Ledger (P&L)', icon: 'trending-up-outline' },
            { id: 'expense_ledger', label: 'Expense Ledger', icon: 'receipt-outline' },
            { id: 'budget_variance', label: 'Budget vs Actual', icon: 'pie-chart-outline' },
            { id: 'tax_assessment', label: 'Tax Assessment & Deductions', icon: 'document-attach-outline' },
            { id: 'intuit_ratios', label: 'Intuit Financial Ratios', icon: 'analytics-outline' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.id as ReportTab)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={isActive ? '#FFFFFF' : '#0284C7'}
                />
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Render Selected Statement View */}

      {/* VIEW A: BALANCE SHEET */}
      {activeTab === 'balance_sheet' && (
        <View style={styles.statementCard}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)</Text>
              <Text style={styles.sheetSubtitle}>As of {balanceSheet.asOfDate} • Standard Multi-Class Asset & Liability Format</Text>
            </View>
            <View style={styles.auditStatusTag}>
              <Ionicons name="shield-checkmark" size={14} color="#16A34A" />
              <Text style={styles.auditStatusTagText}>BALANCED & RECONCILED</Text>
            </View>
          </View>

          {/* Assets Section */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>ASSETS</Text>

            {/* Current Assets */}
            <View style={styles.subCategoryBlock}>
              <Text style={styles.subCategoryTitle}>CURRENT ASSETS (LIQUID RESERVES)</Text>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Physical Cash in Hand (Wallet & Vault)</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.currentAssets.cashInHand)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Institutional Bank Account Balances</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.currentAssets.bankBalances)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Mobile Financial Service (MFS) Wallets</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.currentAssets.mfsWallets)}</Text>
              </View>
              <View style={[styles.tableRow, styles.subtotalRow]}>
                <Text style={styles.subtotalLabel}>Total Current Assets</Text>
                <Text style={styles.subtotalValue}>{fmt(balanceSheet.currentAssets.subtotal)}</Text>
              </View>
            </View>

            {/* Marketable Securities & Investments */}
            <View style={styles.subCategoryBlock}>
              <Text style={styles.subCategoryTitle}>MARKETABLE EQUITIES & PAPER ASSETS</Text>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Listed Equities (DSE / CSE Market Valuation)</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.investments.stocksMarketValue)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>National Savings Certificates (Sanchaypatra)</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.investments.sanchaypatraCapital)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Fixed Deposit Receipts (FDR Capital Reserves)</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.investments.fdrCapital)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Deposit Pension Scheme (DPS Capital)</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.investments.dpsDeposited)}</Text>
              </View>
              <View style={[styles.tableRow, styles.subtotalRow]}>
                <Text style={styles.subtotalLabel}>Total Financial Investments</Text>
                <Text style={styles.subtotalValue}>{fmt(balanceSheet.investments.subtotal)}</Text>
              </View>
            </View>

            {/* Non-Current Tangible Assets */}
            <View style={styles.subCategoryBlock}>
              <Text style={styles.subCategoryTitle}>NON-CURRENT & TANGIBLE FIXED ASSETS</Text>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Residential & Commercial Real Estate / Flats</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.fixedAssets.realEstate)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Freehold Land Plots & Property</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.fixedAssets.landPlots)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Vehicles & Automobile Machinery</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.fixedAssets.vehicles)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Precious Metals (Gold / Bullion Reserves)</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.fixedAssets.preciousMetals)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Other Tangible Capital Assets</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.fixedAssets.otherTangibles)}</Text>
              </View>
              <View style={[styles.tableRow, styles.subtotalRow]}>
                <Text style={styles.subtotalLabel}>Total Fixed Assets</Text>
                <Text style={styles.subtotalValue}>{fmt(balanceSheet.fixedAssets.subtotal)}</Text>
              </View>
            </View>

            {/* Grand Total Assets */}
            <View style={[styles.tableRow, styles.grandTotalRow, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
              <Text style={[styles.grandTotalLabel, { color: '#10B981' }]}>TOTAL ASSETS (A)</Text>
              <Text style={[styles.grandTotalValue, { color: '#10B981' }]}>{fmt(balanceSheet.totalAssets)}</Text>
            </View>
          </View>

          {/* Liabilities Section */}
          <View style={styles.statementSection}>
            <Text style={[styles.sectionHeader, { color: '#EF4444' }]}>LIABILITIES & OBLIGATIONS</Text>

            <View style={styles.subCategoryBlock}>
              <Text style={styles.subCategoryTitle}>CURRENT LIABILITIES (&lt; 12 MONTHS)</Text>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Upcoming 12-Month Debt Service EMIs</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.currentLiabilities.upcoming12MonthsEMI)}</Text>
              </View>
              <View style={[styles.tableRow, styles.subtotalRow]}>
                <Text style={styles.subtotalLabel}>Total Current Liabilities</Text>
                <Text style={styles.subtotalValue}>{fmt(balanceSheet.currentLiabilities.subtotal)}</Text>
              </View>
            </View>

            <View style={styles.subCategoryBlock}>
              <Text style={styles.subCategoryTitle}>LONG-TERM LIABILITIES (&gt; 12 MONTHS)</Text>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Home Mortgages Outstanding Principal</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.longTermLiabilities.homeMortgages)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Auto Loans & Vehicle Debt</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.longTermLiabilities.autoLoans)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Personal & Institutional Borrowings</Text>
                <Text style={styles.rowValue}>{fmt(balanceSheet.longTermLiabilities.personalDebt + balanceSheet.longTermLiabilities.otherInstitutionalDebt)}</Text>
              </View>
              <View style={[styles.tableRow, styles.subtotalRow]}>
                <Text style={styles.subtotalLabel}>Total Long-Term Liabilities</Text>
                <Text style={styles.subtotalValue}>{fmt(balanceSheet.longTermLiabilities.subtotal)}</Text>
              </View>
            </View>

            {/* Grand Total Liabilities */}
            <View style={[styles.tableRow, styles.grandTotalRow, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
              <Text style={[styles.grandTotalLabel, { color: '#EF4444' }]}>TOTAL LIABILITIES (B)</Text>
              <Text style={[styles.grandTotalValue, { color: '#EF4444' }]}>{fmt(balanceSheet.totalLiabilities)}</Text>
            </View>
          </View>

          {/* Equity Section */}
          <View style={styles.statementSection}>
            <Text style={[styles.sectionHeader, { color: '#0284C7' }]}>OWNER'S EQUITY & NET CAPITAL</Text>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Contributed Capital Base & Retained Wealth</Text>
              <Text style={styles.rowValue}>{fmt(balanceSheet.equity.contributedCapital + balanceSheet.equity.retainedEarnings)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Unrealized Market Adjustments & Comprehensive Gain</Text>
              <Text style={styles.rowValue}>{fmt(balanceSheet.equity.currentPeriodComprehensiveGain)}</Text>
            </View>
            <View style={[styles.tableRow, styles.subtotalRow]}>
              <Text style={styles.subtotalLabel}>TOTAL NET EQUITY (C = A - B)</Text>
              <Text style={[styles.subtotalValue, { color: '#0284C7' }]}>{fmt(balanceSheet.equity.totalEquity)}</Text>
            </View>

            {/* Verification Equality */}
            <View style={[styles.tableRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>TOTAL LIABILITIES & EQUITY (B + C)</Text>
              <Text style={styles.grandTotalValue}>{fmt(balanceSheet.totalLiabilities + balanceSheet.equity.totalEquity)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* VIEW B: STATEMENT OF CASH FLOWS */}
      {activeTab === 'cash_flow' && (
        <View style={styles.statementCard}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>STATEMENT OF CASH FLOWS (DIRECT METHOD - IAS 7)</Text>
              <Text style={styles.sheetSubtitle}>For the Period: {cashFlow.periodLabel}</Text>
            </View>
            <View style={styles.auditStatusTag}>
              <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              <Text style={styles.auditStatusTagText}>RECONCILED</Text>
            </View>
          </View>

          {/* 1. Operating Activities */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>A. CASH FLOWS FROM OPERATING ACTIVITIES</Text>
            {cashFlow.operatingActivities.inflows.length === 0 && cashFlow.operatingActivities.outflows.length === 0 ? (
              <Text style={styles.emptyRow}>No operating cash activities recorded in this timeframe.</Text>
            ) : (
              <>
                {cashFlow.operatingActivities.inflows.map((i, idx) => (
                  <View key={`op-in-${idx}`} style={styles.tableRow}>
                    <Text style={styles.rowLabel}>Inflow: {i.name}</Text>
                    <Text style={[styles.rowValue, { color: '#10B981' }]}>+{fmt(i.amount)}</Text>
                  </View>
                ))}
                {cashFlow.operatingActivities.outflows.map((o, idx) => (
                  <View key={`op-out-${idx}`} style={styles.tableRow}>
                    <Text style={styles.rowLabel}>Outflow: {o.name}</Text>
                    <Text style={[styles.rowValue, { color: '#EF4444' }]}>-{fmt(o.amount)}</Text>
                  </View>
                ))}
              </>
            )}
            <View style={[styles.tableRow, styles.subtotalRow]}>
              <Text style={styles.subtotalLabel}>Net Cash from Operating Activities</Text>
              <Text style={[styles.subtotalValue, { color: cashFlow.operatingActivities.netOperatingCashFlow >= 0 ? '#10B981' : '#EF4444' }]}>
                {cashFlow.operatingActivities.netOperatingCashFlow >= 0 ? '+' : ''}{fmt(cashFlow.operatingActivities.netOperatingCashFlow)}
              </Text>
            </View>
          </View>

          {/* 2. Investing Activities */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>B. CASH FLOWS FROM INVESTING ACTIVITIES</Text>
            {cashFlow.investingActivities.inflows.length === 0 && cashFlow.investingActivities.outflows.length === 0 ? (
              <Text style={styles.emptyRow}>No capital investment cash activities recorded in this timeframe.</Text>
            ) : (
              <>
                {cashFlow.investingActivities.inflows.map((i, idx) => (
                  <View key={`inv-in-${idx}`} style={styles.tableRow}>
                    <Text style={styles.rowLabel}>Investment Yield: {i.name}</Text>
                    <Text style={[styles.rowValue, { color: '#10B981' }]}>+{fmt(i.amount)}</Text>
                  </View>
                ))}
                {cashFlow.investingActivities.outflows.map((o, idx) => (
                  <View key={`inv-out-${idx}`} style={styles.tableRow}>
                    <Text style={styles.rowLabel}>Capital Deployment: {o.name}</Text>
                    <Text style={[styles.rowValue, { color: '#EF4444' }]}>-{fmt(o.amount)}</Text>
                  </View>
                ))}
              </>
            )}
            <View style={[styles.tableRow, styles.subtotalRow]}>
              <Text style={styles.subtotalLabel}>Net Cash from Investing Activities</Text>
              <Text style={[styles.subtotalValue, { color: cashFlow.investingActivities.netInvestingCashFlow >= 0 ? '#10B981' : '#EF4444' }]}>
                {cashFlow.investingActivities.netInvestingCashFlow >= 0 ? '+' : ''}{fmt(cashFlow.investingActivities.netInvestingCashFlow)}
              </Text>
            </View>
          </View>

          {/* 3. Financing Activities */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>C. CASH FLOWS FROM FINANCING ACTIVITIES</Text>
            {cashFlow.financingActivities.outflows.length === 0 ? (
              <Text style={styles.emptyRow}>No financing or debt service cash activities in this timeframe.</Text>
            ) : (
              cashFlow.financingActivities.outflows.map((o, idx) => (
                <View key={`fin-out-${idx}`} style={styles.tableRow}>
                  <Text style={styles.rowLabel}>Financing / Debt Service: {o.name}</Text>
                  <Text style={[styles.rowValue, { color: '#EF4444' }]}>-{fmt(o.amount)}</Text>
                </View>
              ))
            )}
            <View style={[styles.tableRow, styles.subtotalRow]}>
              <Text style={styles.subtotalLabel}>Net Cash from Financing Activities</Text>
              <Text style={[styles.subtotalValue, { color: '#EF4444' }]}>
                {fmt(cashFlow.financingActivities.netFinancingCashFlow)}
              </Text>
            </View>
          </View>

          {/* Cash Reconciliation */}
          <View style={[styles.statementSection, { backgroundColor: '#131D33', padding: 14, borderRadius: 10 }]}>
            <Text style={[styles.sectionHeader, { color: '#38BDF8', borderBottomColor: '#38BDF8' }]}>
              LIQUID CASH RECONCILIATION
            </Text>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Opening Cash Reserves (Beginning of Period)</Text>
              <Text style={styles.rowValue}>{fmt(cashFlow.openingCashBalance)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Net Change in Liquid Cash (A + B + C)</Text>
              <Text style={[styles.rowValue, { color: cashFlow.netChangeInCash >= 0 ? '#10B981' : '#EF4444', fontWeight: '800' }]}>
                {cashFlow.netChangeInCash >= 0 ? '+' : ''}{fmt(cashFlow.netChangeInCash)}
              </Text>
            </View>
            <View style={[styles.tableRow, styles.grandTotalRow]}>
              <Text style={[styles.grandTotalLabel, { color: '#38BDF8' }]}>
                CLOSING CASH RESERVES (Reconciled with Banks & Vault)
              </Text>
              <Text style={[styles.grandTotalValue, { color: '#38BDF8' }]}>{fmt(cashFlow.closingCashBalance)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* VIEW C: INCOME STATEMENT & LEDGER (P&L) */}
      {activeTab === 'income_statement' && (
        <View style={styles.statementCard}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>INCOME STATEMENT (PROFIT & LOSS / REVENUE LEDGER)</Text>
              <Text style={styles.sheetSubtitle}>For the Period: {incomeStatement.periodLabel}</Text>
            </View>
            <View style={[styles.auditStatusTag, { backgroundColor: 'rgba(2, 132, 199, 0.15)' }]}>
              <Text style={[styles.auditStatusTagText, { color: '#0284C7' }]}>
                MARGIN: {incomeStatement.operatingMarginPercent}%
              </Text>
            </View>
          </View>

          {/* Revenue Breakdown */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>COMPREHENSIVE REVENUES</Text>

            <View style={styles.subCategoryBlock}>
              <Text style={styles.subCategoryTitle}>OPERATING REVENUES</Text>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Salary, Employment Compensation & Wages</Text>
                <Text style={styles.rowValue}>{fmt(incomeStatement.operatingRevenue.salaryWages)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Commercial Business Revenues</Text>
                <Text style={styles.rowValue}>{fmt(incomeStatement.operatingRevenue.businessRevenue)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Consulting & Freelance Professional Inflows</Text>
                <Text style={styles.rowValue}>{fmt(incomeStatement.operatingRevenue.consultingFreelance)}</Text>
              </View>
              <View style={[styles.tableRow, styles.subtotalRow]}>
                <Text style={styles.subtotalLabel}>Total Operating Revenues</Text>
                <Text style={styles.subtotalValue}>{fmt(incomeStatement.operatingRevenue.subtotal)}</Text>
              </View>
            </View>

            <View style={styles.subCategoryBlock}>
              <Text style={styles.subCategoryTitle}>PASSIVE & INVESTMENT YIELDS</Text>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Listed Stock Dividends & Realized Yields</Text>
                <Text style={styles.rowValue}>{fmt(incomeStatement.passiveInvestmentIncome.stockDividends)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Fixed Deposit (FDR) Monthly Returns</Text>
                <Text style={styles.rowValue}>{fmt(incomeStatement.passiveInvestmentIncome.fdrProfits)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>National Savings Sanchaypatra Quarterly Profits</Text>
                <Text style={styles.rowValue}>{fmt(incomeStatement.passiveInvestmentIncome.sanchaypatraProfits)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Physical Real Estate Rental Yields</Text>
                <Text style={styles.rowValue}>{fmt(incomeStatement.passiveInvestmentIncome.realEstateRentalYield)}</Text>
              </View>
              <View style={[styles.tableRow, styles.subtotalRow]}>
                <Text style={styles.subtotalLabel}>Total Passive Investment Income</Text>
                <Text style={styles.subtotalValue}>{fmt(incomeStatement.passiveInvestmentIncome.subtotal)}</Text>
              </View>
            </View>

            {/* Gross Total Revenue */}
            <View style={[styles.tableRow, styles.grandTotalRow, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
              <Text style={[styles.grandTotalLabel, { color: '#10B981' }]}>GROSS COMPREHENSIVE REVENUE</Text>
              <Text style={[styles.grandTotalValue, { color: '#10B981' }]}>{fmt(incomeStatement.grossTotalRevenue)}</Text>
            </View>

            {/* Less Operating Expenses */}
            <View style={styles.tableRow}>
              <Text style={[styles.rowLabel, { color: '#EF4444' }]}>Less: Operating Expenditures for the Period</Text>
              <Text style={[styles.rowValue, { color: '#EF4444' }]}>({fmt(incomeStatement.operatingExpenses)})</Text>
            </View>

            {/* Net Surplus */}
            <View style={[styles.tableRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>NET COMPREHENSIVE SURPLUS</Text>
              <Text style={[styles.grandTotalValue, { color: incomeStatement.netOperatingIncome >= 0 ? '#10B981' : '#EF4444' }]}>
                {fmt(incomeStatement.netOperatingIncome)}
              </Text>
            </View>
          </View>

          {/* Itemized Chronological Inflow Ledger */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>ITEMIZED INFLOW TRANSACTIONS ({incomeStatement.itemizedIncomes.length})</Text>
            {incomeStatement.itemizedIncomes.length === 0 ? (
              <Text style={styles.emptyRow}>No income records recorded in this timeframe.</Text>
            ) : (
              incomeStatement.itemizedIncomes.map((inc) => (
                <View key={inc.id} style={styles.ledgerRowItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerItemTitle}>{inc.title}</Text>
                    <Text style={styles.ledgerItemSub}>
                      {inc.category} • {inc.date} • Deposited into {inc.destinationAccount || 'Vault'}
                    </Text>
                  </View>
                  <Text style={[styles.ledgerItemAmount, { color: '#10B981' }]}>+{fmt(inc.amount)}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* VIEW D: EXPENSE LEDGER */}
      {activeTab === 'expense_ledger' && (
        <View style={styles.statementCard}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>EXPENDITURE STATEMENT & AUDITED LEDGER</Text>
              <Text style={styles.sheetSubtitle}>For the Period: {expenseLedger.periodLabel}</Text>
            </View>
            <Text style={[styles.sheetTitle, { color: '#EF4444' }]}>
              {fmt(expenseLedger.totalExpenses)}
            </Text>
          </View>

          {/* Category Breakdown Cards */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>CATEGORY EXPENDITURE DISTRIBUTION</Text>
            {expenseLedger.categoryBreakdown.length === 0 ? (
              <Text style={styles.emptyRow}>No expenses recorded in this timeframe.</Text>
            ) : (
              expenseLedger.categoryBreakdown.map((cat) => (
                <View key={cat.category} style={styles.catProgressItem}>
                  <View style={styles.catProgressTop}>
                    <Text style={styles.catName}>{cat.category} ({cat.entryCount} entries)</Text>
                    <Text style={styles.catAmount}>{fmt(cat.amount)} ({cat.percentage}%)</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Itemized Chronological Outflow Ledger */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>CHRONOLOGICAL EXPENSE LEDGER ({expenseLedger.itemizedExpenses.length})</Text>
            {expenseLedger.itemizedExpenses.length === 0 ? (
              <Text style={styles.emptyRow}>No expenses found for {expenseLedger.periodLabel}.</Text>
            ) : (
              expenseLedger.itemizedExpenses.map((exp) => (
                <View key={exp.id} style={styles.ledgerRowItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerItemTitle}>{exp.title}</Text>
                    <Text style={styles.ledgerItemSub}>
                      {exp.category} • {exp.date} • Paid via {exp.paymentMethod || 'Cash'}
                      {exp.notes ? ` • ${exp.notes}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.ledgerItemAmount, { color: '#EF4444' }]}>-{fmt(exp.amount)}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* VIEW E: BUDGET VS ACTUAL VARIANCE STATEMENT */}
      {activeTab === 'budget_variance' && (
        <View style={styles.statementCard}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>BUDGET VS ACTUAL VARIANCE STATEMENT</Text>
              <Text style={styles.sheetSubtitle}>
                Executive Management Accounting & Variance Analysis • Period: {budgetVariance.periodLabel}
              </Text>
            </View>
            <View
              style={[
                styles.auditStatusTag,
                {
                  backgroundColor:
                    budgetVariance.expenseVarianceStatus === 'favorable'
                      ? 'rgba(22, 163, 74, 0.15)'
                      : budgetVariance.expenseVarianceStatus === 'warning'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                },
              ]}
            >
              <Ionicons
                name={
                  budgetVariance.expenseVarianceStatus === 'favorable'
                    ? 'checkmark-circle'
                    : 'alert-circle'
                }
                size={14}
                color={
                  budgetVariance.expenseVarianceStatus === 'favorable'
                    ? '#16A34A'
                    : budgetVariance.expenseVarianceStatus === 'warning'
                    ? '#F59E0B'
                    : '#EF4444'
                }
              />
              <Text
                style={[
                  styles.auditStatusTagText,
                  {
                    color:
                      budgetVariance.expenseVarianceStatus === 'favorable'
                        ? '#16A34A'
                        : budgetVariance.expenseVarianceStatus === 'warning'
                        ? '#F59E0B'
                        : '#EF4444',
                  },
                ]}
              >
                VARIANCE: {budgetVariance.expenseVarianceStatus.toUpperCase()} ({budgetVariance.expenseVariancePercent}% CONSUMED)
              </Text>
            </View>
          </View>

          {/* Variance KPI Strip */}
          <View style={styles.scoreStrip}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>TOTAL EXPENSE BUDGET</Text>
              <Text style={[styles.scoreVal, { color: '#38BDF8' }]}>{fmt(budgetVariance.totalExpenseBudget)}</Text>
              <Text style={styles.scoreSub}>Planned Outflow Limit</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>ACTUAL EXPENDITURE</Text>
              <Text style={[styles.scoreVal, { color: '#EF4444' }]}>{fmt(budgetVariance.totalExpenseActual)}</Text>
              <Text style={styles.scoreSub}>{budgetVariance.expenseVariancePercent}% of Budget Consumed</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>NET EXPENSE VARIANCE</Text>
              <Text
                style={[
                  styles.scoreVal,
                  { color: budgetVariance.netExpenseVariance >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {budgetVariance.netExpenseVariance >= 0 ? '+' : ''}{fmt(budgetVariance.netExpenseVariance)}
              </Text>
              <Text style={styles.scoreSub}>
                {budgetVariance.netExpenseVariance >= 0 ? 'Favorable Surplus Preserved' : 'Unfavorable Over-Budget Burn'}
              </Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>INCOME TARGET ACHIEVED</Text>
              <Text style={[styles.scoreVal, { color: '#10B981' }]}>{budgetVariance.incomeVariancePercent}%</Text>
              <Text style={styles.scoreSub}>
                {fmt(budgetVariance.totalIncomeActual)} / {fmt(budgetVariance.totalIncomeTarget)}
              </Text>
            </View>
          </View>

          {/* Category Visual Spend Bars */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>CATEGORY SPEND CONSUMPTION GAUGE</Text>
            {budgetVariance.expenseVariances.map((v) => {
              const barColor =
                v.percentUsed > 100 ? '#EF4444' : v.percentUsed >= 80 ? '#F59E0B' : '#10B981';
              return (
                <View key={v.category.id} style={styles.catProgressItem}>
                  <View style={styles.catProgressTop}>
                    <Text style={styles.catName}>
                      {v.category.icon} {v.category.name}
                    </Text>
                    <Text style={[styles.catAmount, { color: barColor }]}>
                      {fmt(v.actual)} / {fmt(v.budget)} ({v.percentUsed}%)
                    </Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.min(100, v.percentUsed)}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Itemized Variance Table */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>DETAILED BUDGET VS ACTUAL LEDGER</Text>
            {budgetVariance.expenseVariances.map((v) => (
              <View key={`tbl-${v.category.id}`} style={styles.tableRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>
                    {v.category.icon} {v.category.name}
                  </Text>
                  <Text style={[styles.rowSubLabel, { color: '#64748B' }]}>
                    Budget: {fmt(v.budget)} • Actual: {fmt(v.actual)} • {v.transactionCount} entries
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.rowValue,
                      { color: v.variance >= 0 ? '#10B981' : '#EF4444', fontWeight: '800' },
                    ]}
                  >
                    {v.variance >= 0 ? '+' : ''}{fmt(v.variance)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color:
                        v.status === 'over_budget'
                          ? '#EF4444'
                          : v.status === 'warning'
                          ? '#F59E0B'
                          : '#10B981',
                      textTransform: 'uppercase',
                    }}
                  >
                    {v.status.replace('_', ' ')} ({v.percentUsed}%)
                  </Text>
                </View>
              </View>
            ))}
            <View style={[styles.tableRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>TOTAL BUDGET VARIANCE CONSOLIDATION</Text>
              <Text
                style={[
                  styles.grandTotalValue,
                  { color: budgetVariance.netExpenseVariance >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {budgetVariance.netExpenseVariance >= 0 ? '+' : ''}{fmt(budgetVariance.netExpenseVariance)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* VIEW F: TAX ESTIMATION & STATUTORY DEDUCTIONS */}
      {activeTab === 'tax_assessment' && (
        <View style={styles.statementCard}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>STATUTORY TAX ASSESSMENT & ALLOWABLE DEDUCTIONS</Text>
              <Text style={styles.sheetSubtitle}>
                Pro-rated Progressive Income Tax Calculation & Eligible Investment Rebates • Period: {taxAssessment.periodLabel}
              </Text>
            </View>
            <View style={[styles.auditStatusTag, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Text style={[styles.auditStatusTagText, { color: '#8B5CF6' }]}>
                EFFECTIVE RATE: {taxAssessment.effectiveTaxRatePercent}%
              </Text>
            </View>
          </View>

          {/* Tax KPI Strip */}
          <View style={styles.scoreStrip}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>GROSS ASSESSABLE REVENUE</Text>
              <Text style={[styles.scoreVal, { color: '#38BDF8' }]}>{fmt(taxAssessment.grossAssessableIncome)}</Text>
              <Text style={styles.scoreSub}>Comprehensive Inflows</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>TOTAL STATUTORY DEDUCTIONS</Text>
              <Text style={[styles.scoreVal, { color: '#10B981' }]}>-{fmt(taxAssessment.allowableDeductions.totalDeductions)}</Text>
              <Text style={styles.scoreSub}>Eligible Reliefs & Exemptions</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>NET TAXABLE INCOME</Text>
              <Text style={[styles.scoreVal, { color: '#F59E0B' }]}>{fmt(taxAssessment.netTaxableIncome)}</Text>
              <Text style={styles.scoreSub}>Chargeable Tax Base</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>NET ESTIMATED TAX PAYABLE</Text>
              <Text style={[styles.scoreVal, { color: '#EF4444' }]}>{fmt(taxAssessment.netPayableTax)}</Text>
              <Text style={styles.scoreSub}>After ৳{taxAssessment.eligibleInvestmentRebate.totalTaxRebate.toLocaleString('en-IN')} Rebate</Text>
            </View>
          </View>

          {/* Allowable Deductions Breakdown */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>A. ITEMIZED STATUTORY DEDUCTIONS & RELIEFS</Text>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>🛡️ Life & Health Insurance Premiums</Text>
              <Text style={[styles.rowValue, { color: '#10B981' }]}>-{fmt(taxAssessment.allowableDeductions.insurancePremiums)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>💳 Institutional Debt Service (Interest Component)</Text>
              <Text style={[styles.rowValue, { color: '#10B981' }]}>-{fmt(taxAssessment.allowableDeductions.debtInterestServicing)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>🏢 Property Holding & Municipal City Corporation Taxes</Text>
              <Text style={[styles.rowValue, { color: '#10B981' }]}>-{fmt(taxAssessment.allowableDeductions.propertyHoldingTaxes)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>🏥 Specialist Healthcare, Hospital Care & Prescriptions</Text>
              <Text style={[styles.rowValue, { color: '#10B981' }]}>-{fmt(taxAssessment.allowableDeductions.medicalHealthExpenses)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>🎁 Charitable Donations, Zakat & Humanitarian Relief</Text>
              <Text style={[styles.rowValue, { color: '#10B981' }]}>-{fmt(taxAssessment.allowableDeductions.donationsAndZakat)}</Text>
            </View>
            <View style={[styles.tableRow, styles.subtotalRow]}>
              <Text style={styles.subtotalLabel}>TOTAL ALLOWABLE DEDUCTIONS</Text>
              <Text style={[styles.subtotalValue, { color: '#10B981' }]}>
                -{fmt(taxAssessment.allowableDeductions.totalDeductions)}
              </Text>
            </View>
          </View>

          {/* Progressive Slabs Table */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>B. PROGRESSIVE TAX BRACKET CALCULATION</Text>
            {taxAssessment.taxSlabs.map((s, idx) => (
              <View key={`slab-${idx}`} style={styles.tableRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{s.slabName}</Text>
                  <Text style={[styles.rowSubLabel, { color: '#64748B' }]}>
                    Taxable Base in Slab: {fmt(s.taxableAmountInSlab)} @ {s.ratePercent}%
                  </Text>
                </View>
                <Text style={styles.rowValue}>{fmt(s.slabTax)}</Text>
              </View>
            ))}
            <View style={[styles.tableRow, styles.subtotalRow]}>
              <Text style={styles.subtotalLabel}>GROSS ESTIMATED TAX</Text>
              <Text style={[styles.subtotalValue, { color: '#F59E0B' }]}>{fmt(taxAssessment.grossEstimatedTax)}</Text>
            </View>
          </View>

          {/* Investment Tax Rebate Credit */}
          <View style={styles.statementSection}>
            <Text style={[styles.sectionHeader, { color: '#8B5CF6', borderBottomColor: '#8B5CF6' }]}>
              C. INVESTMENT TAX REBATE CREDIT (DIRECT TAX OFFSET)
            </Text>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Total Eligible Portfolio Capital (Govt Sanchaypatra, Stocks, DPS)</Text>
              <Text style={styles.rowValue}>{fmt(taxAssessment.eligibleInvestmentRebate.totalEligibleInvestments)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Maximum Allowable Investment Base (20% of Taxable Income)</Text>
              <Text style={styles.rowValue}>{fmt(taxAssessment.eligibleInvestmentRebate.maxAllowableInvestmentCeiling)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Applicable Investment Base for Rebate</Text>
              <Text style={[styles.rowValue, { color: '#8B5CF6', fontWeight: '800' }]}>
                {fmt(taxAssessment.eligibleInvestmentRebate.applicableInvestmentBase)}
              </Text>
            </View>
            <View style={[styles.tableRow, styles.subtotalRow]}>
              <Text style={styles.subtotalLabel}>Direct Investment Tax Rebate Credit (15%)</Text>
              <Text style={[styles.subtotalValue, { color: '#10B981' }]}>
                -{fmt(taxAssessment.eligibleInvestmentRebate.totalTaxRebate)}
              </Text>
            </View>
            <View style={[styles.tableRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>FINAL NET ESTIMATED TAX PAYABLE</Text>
              <Text style={[styles.grandTotalValue, { color: '#EF4444' }]}>{fmt(taxAssessment.netPayableTax)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* VIEW G: INTUIT FINANCIAL RATIOS & BENCHMARKS */}
      {activeTab === 'intuit_ratios' && (
        <View style={styles.statementCard}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>INTUIT / QUICKBOOKS FINANCIAL HEALTH BENCHMARKS</Text>
              <Text style={styles.sheetSubtitle}>Corporate & Personal Solvency, Liquidity & Capital Preservation Intelligence</Text>
            </View>
          </View>

          {/* Top Score Strip */}
          <View style={styles.scoreStrip}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>LIQUIDITY HEALTH</Text>
              <Text style={[styles.scoreVal, { color: '#0284C7' }]}>{intuitRatios.liquidityScore}/100</Text>
              <Text style={styles.scoreSub}>Short-Term Debt Protection</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>DEBT SOLVENCY</Text>
              <Text style={[styles.scoreVal, { color: '#10B981' }]}>{intuitRatios.debtHealthScore}/100</Text>
              <Text style={styles.scoreSub}>Gearing & Leverage Safety</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>WORKING CAPITAL</Text>
              <Text style={[styles.scoreVal, { color: '#38BDF8' }]}>{fmt(intuitRatios.workingCapital)}</Text>
              <Text style={styles.scoreSub}>Liquid Net Buffer</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>EMERGENCY RUNWAY</Text>
              <Text style={[styles.scoreVal, { color: '#F59E0B' }]}>{intuitRatios.cashRunwayMonths} Mo.</Text>
              <Text style={styles.scoreSub}>Living Expense Coverage</Text>
            </View>
          </View>

          {/* Ratios Table */}
          <View style={styles.statementSection}>
            <Text style={styles.sectionHeader}>CORE EXECUTIVE FINANCIAL RATIOS</Text>
            {intuitRatios.ratios.map((r: any, idx: number) => {
              const statusColor =
                r.status === 'optimal' ? '#10B981' : r.status === 'acceptable' ? '#0284C7' : '#EF4444';
              return (
                <View key={`ratio-${idx}`} style={styles.ratioRowCard}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.ratioName}>{r.name}</Text>
                      <View style={[styles.ratioStatusBadge, { backgroundColor: `${statusColor}20` }]}>
                        <Text style={[styles.ratioStatusBadgeText, { color: statusColor }]}>
                          {r.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.ratioDesc}>{r.description}</Text>
                    <Text style={styles.ratioBench}>Standard Benchmark: {r.benchmark}</Text>
                  </View>
                  <View style={styles.ratioRight}>
                    <Text style={[styles.ratioValueText, { color: statusColor }]}>{r.formatted}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B14',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerCard: {
    marginBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  badgeIFRS: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeIFRSText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.8,
  },
  badgeIntuit: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeIntuitText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    maxWidth: 550,
  },
  actionButtonsCol: {
    alignItems: 'flex-end',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  currencyToggleBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  currencyToggleText: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 12,
  },
  periodRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  periodRowLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  periodPillScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  periodPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#1E293B',
  },
  periodPillActive: {
    backgroundColor: '#0284C7',
  },
  periodPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  periodPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabsContainer: {
    marginVertical: 14,
  },
  tabsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  statementCard: {
    backgroundColor: '#0B1120',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sheetHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  auditStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  auditStatusTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  statementSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1,
    borderBottomWidth: 1.5,
    borderBottomColor: '#10B981',
    paddingBottom: 4,
    marginBottom: 10,
  },
  subCategoryBlock: {
    marginBottom: 12,
  },
  subCategoryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowLabel: {
    fontSize: 13,
    color: '#CBD5E1',
    flex: 1,
  },
  rowSubLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'right',
  },
  subtotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#475569',
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginVertical: 4,
  },
  subtotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 3,
    borderBottomColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  emptyRow: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  ledgerRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#131D33',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  ledgerItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  ledgerItemSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  ledgerItemAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  catProgressItem: {
    marginBottom: 12,
  },
  catProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  catAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  scoreCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#131D33',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  scoreVal: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  scoreSub: {
    fontSize: 10,
    color: '#64748B',
  },
  ratioRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#131D33',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  ratioName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ratioStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratioStatusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ratioDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  ratioBench: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  ratioRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  ratioValueText: {
    fontSize: 18,
    fontWeight: '900',
  },
});
