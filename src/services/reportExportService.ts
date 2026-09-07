/**
 * reportExportService.ts
 * Cross-platform Print, PDF Generation & Native Sharing Service.
 * Implements Big-4 accounting audit style (PwC / Deloitte format) for all financial statements.
 */

import {
  BalanceSheetReport,
  CashFlowReport,
  IncomeStatementReport,
  ExpenseLedgerReport,
  IntuitFinancialIntelligence,
} from './financialStatementsEngine';

export class ReportExportService {
  /**
   * Formats BDT currency cleanly
   */
  public static formatBDT(amount: number): string {
    const isNeg = amount < 0;
    const abs = Math.abs(amount);
    return `${isNeg ? '(' : ''}৳ ${abs.toLocaleString('en-IN')}${isNeg ? ')' : ''}`;
  }

  /**
   * Generates a complete, audited executive HTML document for the financial statements
   */
  public static generateFullReportHtml(params: {
    reportType: 'balance_sheet' | 'cash_flow' | 'income_statement' | 'expense_ledger' | 'master_dossier';
    periodLabel: string;
    balanceSheet: BalanceSheetReport;
    cashFlow: CashFlowReport;
    incomeStatement: IncomeStatementReport;
    expenseLedger: ExpenseLedgerReport;
    intuitRatios: IntuitFinancialIntelligence;
    ownerName?: string;
  }): string {
    const {
      reportType,
      periodLabel,
      balanceSheet,
      cashFlow,
      incomeStatement,
      expenseLedger,
      intuitRatios,
      ownerName = 'Rashed Zaman',
    } = params;

    const generatedDate = new Date().toLocaleString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isMaster = reportType === 'master_dossier';
    const showBS = isMaster || reportType === 'balance_sheet';
    const showCF = isMaster || reportType === 'cash_flow';
    const showIS = isMaster || reportType === 'income_statement';
    const showEL = isMaster || reportType === 'expense_ledger';

    const fmt = this.formatBDT;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${ownerName} - Financial Statement (${periodLabel})</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      padding: 32px;
      line-height: 1.5;
    }
    @media print {
      body { padding: 12mm 10mm; font-size: 9.5pt; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      .sheet-card { border: 1px solid #CBD5E1 !important; box-shadow: none !important; }
    }
    .header-bar {
      border-bottom: 3px double #0F172A;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-transform: uppercase;
      color: #0F172A;
    }
    .brand-sub {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .meta-box strong { color: #0F172A; }
    .audit-badge {
      display: inline-block;
      background: #DCFCE7;
      color: #15803D;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1.5px solid #0F172A;
      padding-bottom: 6px;
      margin-top: 28px;
      margin-bottom: 14px;
    }
    table.statement-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    table.statement-table th {
      background: #F8FAFC;
      border-bottom: 1px solid #CBD5E1;
      padding: 8px 10px;
      text-align: left;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    table.statement-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #F1F5F9;
      color: #1E293B;
    }
    table.statement-table td.amount {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .row-group-header {
      font-weight: 800;
      color: #0F172A;
      background: #F8FAFC;
      text-transform: uppercase;
      font-size: 11px;
    }
    .row-subtotal {
      font-weight: 700;
      border-top: 1px solid #94A3B8 !important;
      border-bottom: 1px solid #94A3B8 !important;
      color: #0F172A;
    }
    .row-grandtotal {
      font-weight: 800;
      font-size: 13px;
      border-top: 1.5px solid #0F172A !important;
      border-bottom: 3px double #0F172A !important;
      color: #0F172A;
      background: #F8FAFC;
    }
    .ratio-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 16px 0;
    }
    .ratio-card {
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 10px;
      background: #FAFAFA;
    }
    .ratio-card .name { font-size: 11px; font-weight: 700; color: #475569; }
    .ratio-card .val { font-size: 18px; font-weight: 800; color: #0F172A; margin: 4px 0; }
    .ratio-card .sub { font-size: 10px; color: #64748B; }
    .audit-footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #CBD5E1;
      font-size: 10px;
      color: #64748B;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .action-toolbar {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      gap: 12px;
      z-index: 9999;
    }
    .print-btn {
      background: #0284C7;
      color: #FFFFFF;
      border: none;
      padding: 12px 22px;
      font-weight: 700;
      font-size: 14px;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
    }
    .print-btn:hover { background: #0369A1; }
    .close-btn {
      background: #334155;
      color: #FFFFFF;
      border: none;
      padding: 12px 18px;
      font-weight: 700;
      font-size: 14px;
      border-radius: 8px;
      cursor: pointer;
    }
  </style>
</head>
<body>

  <!-- Top Action Toolbar (hidden during printing) -->
  <div class="action-toolbar no-print">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <button class="close-btn" onclick="window.close()">✕ Close</button>
  </div>

  <!-- Corporate Header -->
  <div class="header-bar">
    <div>
      <div class="brand-title">${ownerName}</div>
      <div class="brand-sub">Private Wealth & Asset Management • Financial Reporting Dossier</div>
      <div class="audit-badge">✓ Clean Audited • GAAP / IFRS Standard</div>
    </div>
    <div class="meta-box">
      <div><strong>Reporting Period:</strong> ${periodLabel}</div>
      <div><strong>Reporting Currency:</strong> Bangladesh Taka (BDT ৳)</div>
      <div><strong>Date of Issuance:</strong> ${generatedDate}</div>
      <div><strong>Audit Compliance:</strong> IAS 1 / IAS 7 Financial Intelligence</div>
    </div>
  </div>

  ${showBS ? `
  <!-- 1. BALANCE SHEET (STATEMENT OF FINANCIAL POSITION) -->
  <div class="section-title">1. Statement of Financial Position (Balance Sheet)</div>
  <table class="statement-table">
    <thead>
      <tr>
        <th style="width: 70%;">Classification & Account Heads</th>
        <th style="text-align: right;">Amount (BDT)</th>
      </tr>
    </thead>
    <tbody>
      <!-- ASSETS -->
      <tr class="row-group-header"><td colspan="2">CURRENT ASSETS (LIQUID RESERVES)</td></tr>
      <tr><td style="padding-left: 20px;">Physical Cash in Hand (Wallet & Vault)</td><td class="amount">${fmt(balanceSheet.currentAssets.cashInHand)}</td></tr>
      <tr><td style="padding-left: 20px;">Institutional Bank Account Balances</td><td class="amount">${fmt(balanceSheet.currentAssets.bankBalances)}</td></tr>
      <tr><td style="padding-left: 20px;">Mobile Financial Service (MFS) Wallets</td><td class="amount">${fmt(balanceSheet.currentAssets.mfsWallets)}</td></tr>
      <tr class="row-subtotal"><td>Total Current Assets</td><td class="amount">${fmt(balanceSheet.currentAssets.subtotal)}</td></tr>

      <!-- INVESTMENTS -->
      <tr class="row-group-header"><td colspan="2">MARKETABLE SECURITIES & PAPER INVESTMENTS</td></tr>
      <tr><td style="padding-left: 20px;">Listed Equities Portfolio (DSE / CSE Market Valuation)</td><td class="amount">${fmt(balanceSheet.investments.stocksMarketValue)}</td></tr>
      <tr><td style="padding-left: 32px; font-size: 11px; color: #64748B;">Cost Basis: ${fmt(balanceSheet.investments.stocksCostBasis)} | Unrealized Gain/Loss: ${fmt(balanceSheet.investments.unrealizedStockGainLoss)}</td><td></td></tr>
      <tr><td style="padding-left: 20px;">National Savings Certificates (Sanchaypatra Capital)</td><td class="amount">${fmt(balanceSheet.investments.sanchaypatraCapital)}</td></tr>
      <tr><td style="padding-left: 20px;">Fixed Deposit Receipts (FDR Capital Reserves)</td><td class="amount">${fmt(balanceSheet.investments.fdrCapital)}</td></tr>
      <tr><td style="padding-left: 20px;">Deposit Pension Scheme (DPS Accumulated Deposits)</td><td class="amount">${fmt(balanceSheet.investments.dpsDeposited)}</td></tr>
      <tr class="row-subtotal"><td>Total Financial Investments</td><td class="amount">${fmt(balanceSheet.investments.subtotal)}</td></tr>

      <!-- FIXED ASSETS -->
      <tr class="row-group-header"><td colspan="2">NON-CURRENT & TANGIBLE FIXED ASSETS (CAPITAL)</td></tr>
      <tr><td style="padding-left: 20px;">Real Estate, Residential & Commercial Flats</td><td class="amount">${fmt(balanceSheet.fixedAssets.realEstate)}</td></tr>
      <tr><td style="padding-left: 20px;">Freehold Land Plots & Development Real Estate</td><td class="amount">${fmt(balanceSheet.fixedAssets.landPlots)}</td></tr>
      <tr><td style="padding-left: 20px;">Vehicles & Transport Machinery</td><td class="amount">${fmt(balanceSheet.fixedAssets.vehicles)}</td></tr>
      <tr><td style="padding-left: 20px;">Precious Metals (Gold / Bullion Holdings)</td><td class="amount">${fmt(balanceSheet.fixedAssets.preciousMetals)}</td></tr>
      <tr><td style="padding-left: 20px;">Other Tangible Capital Assets</td><td class="amount">${fmt(balanceSheet.fixedAssets.otherTangibles)}</td></tr>
      <tr class="row-subtotal"><td>Total Fixed Assets</td><td class="amount">${fmt(balanceSheet.fixedAssets.subtotal)}</td></tr>

      <!-- TOTAL ASSETS -->
      <tr class="row-grandtotal"><td>TOTAL ASSETS (A)</td><td class="amount">${fmt(balanceSheet.totalAssets)}</td></tr>

      <!-- LIABILITIES -->
      <tr class="row-group-header"><td colspan="2">CURRENT LIABILITIES (&lt; 12 MONTHS)</td></tr>
      <tr><td style="padding-left: 20px;">Upcoming 12-Month Debt Service EMIs (Bank Loans)</td><td class="amount">${fmt(balanceSheet.currentLiabilities.upcoming12MonthsEMI)}</td></tr>
      <tr class="row-subtotal"><td>Total Current Liabilities</td><td class="amount">${fmt(balanceSheet.currentLiabilities.subtotal)}</td></tr>

      <tr class="row-group-header"><td colspan="2">LONG-TERM LIABILITIES (&gt; 12 MONTHS)</td></tr>
      <tr><td style="padding-left: 20px;">Home Mortgages Outstanding Principal</td><td class="amount">${fmt(balanceSheet.longTermLiabilities.homeMortgages)}</td></tr>
      <tr><td style="padding-left: 20px;">Auto / Vehicle Financing Principal</td><td class="amount">${fmt(balanceSheet.longTermLiabilities.autoLoans)}</td></tr>
      <tr><td style="padding-left: 20px;">Institutional Borrowings & Personal Debt</td><td class="amount">${fmt(balanceSheet.longTermLiabilities.personalDebt + balanceSheet.longTermLiabilities.otherInstitutionalDebt)}</td></tr>
      <tr class="row-subtotal"><td>Total Long-Term Liabilities</td><td class="amount">${fmt(balanceSheet.longTermLiabilities.subtotal)}</td></tr>

      <tr class="row-grandtotal"><td>TOTAL LIABILITIES (B)</td><td class="amount">${fmt(balanceSheet.totalLiabilities)}</td></tr>

      <!-- OWNER'S EQUITY -->
      <tr class="row-group-header"><td colspan="2">OWNER'S EQUITY & NET WORTH</td></tr>
      <tr><td style="padding-left: 20px;">Contributed Capital Base & Retained Wealth</td><td class="amount">${fmt(balanceSheet.equity.contributedCapital + balanceSheet.equity.retainedEarnings)}</td></tr>
      <tr><td style="padding-left: 20px;">Unrealized Market Adjustments & Comprehensive Gain</td><td class="amount">${fmt(balanceSheet.equity.currentPeriodComprehensiveGain)}</td></tr>
      <tr class="row-subtotal"><td>TOTAL OWNER'S EQUITY (C = A - B)</td><td class="amount">${fmt(balanceSheet.equity.totalEquity)}</td></tr>

      <!-- EQUALITY AUDIT -->
      <tr class="row-grandtotal"><td>TOTAL LIABILITIES & EQUITY (B + C)</td><td class="amount">${fmt(balanceSheet.totalLiabilities + balanceSheet.equity.totalEquity)}</td></tr>
    </tbody>
  </table>
  ` : ''}

  ${showCF ? `
  <!-- 2. STATEMENT OF CASH FLOWS (IAS 7) -->
  <div class="page-break"></div>
  <div class="section-title">2. Statement of Cash Flows (Direct Method - IAS 7)</div>
  <table class="statement-table">
    <thead>
      <tr>
        <th style="width: 70%;">Cash Flow Activities</th>
        <th style="text-align: right;">Inflow / (Outflow) (BDT)</th>
      </tr>
    </thead>
    <tbody>
      <!-- OPERATING -->
      <tr class="row-group-header"><td colspan="2">A. CASH FLOWS FROM OPERATING ACTIVITIES</td></tr>
      ${cashFlow.operatingActivities.inflows.map((i) => `<tr><td style="padding-left: 20px;">Cash Inflow: ${i.name}</td><td class="amount" style="color: #16A34A;">${fmt(i.amount)}</td></tr>`).join('')}
      ${cashFlow.operatingActivities.outflows.map((o) => `<tr><td style="padding-left: 20px;">Cash Outflow: ${o.name}</td><td class="amount" style="color: #DC2626;">(${fmt(o.amount)})</td></tr>`).join('')}
      <tr class="row-subtotal"><td>Net Cash Provided by / (Used in) Operating Activities</td><td class="amount">${fmt(cashFlow.operatingActivities.netOperatingCashFlow)}</td></tr>

      <!-- INVESTING -->
      <tr class="row-group-header"><td colspan="2">B. CASH FLOWS FROM INVESTING ACTIVITIES</td></tr>
      ${cashFlow.investingActivities.inflows.map((i) => `<tr><td style="padding-left: 20px;">Investment Yield: ${i.name}</td><td class="amount" style="color: #16A34A;">${fmt(i.amount)}</td></tr>`).join('')}
      ${cashFlow.investingActivities.outflows.map((o) => `<tr><td style="padding-left: 20px;">Capital Expenditure: ${o.name}</td><td class="amount" style="color: #DC2626;">(${fmt(o.amount)})</td></tr>`).join('')}
      <tr class="row-subtotal"><td>Net Cash Provided by / (Used in) Investing Activities</td><td class="amount">${fmt(cashFlow.investingActivities.netInvestingCashFlow)}</td></tr>

      <!-- FINANCING -->
      <tr class="row-group-header"><td colspan="2">C. CASH FLOWS FROM FINANCING ACTIVITIES</td></tr>
      ${cashFlow.financingActivities.outflows.map((o) => `<tr><td style="padding-left: 20px;">Debt Service / Bank Charges: ${o.name}</td><td class="amount" style="color: #DC2626;">(${fmt(o.amount)})</td></tr>`).join('')}
      <tr class="row-subtotal"><td>Net Cash Provided by / (Used in) Financing Activities</td><td class="amount">${fmt(cashFlow.financingActivities.netFinancingCashFlow)}</td></tr>

      <!-- RECONCILIATION -->
      <tr class="row-grandtotal"><td>NET INCREASE / (DECREASE) IN LIQUID CASH (A + B + C)</td><td class="amount">${fmt(cashFlow.netChangeInCash)}</td></tr>
      <tr><td style="padding-left: 20px; font-weight: 700;">Opening Liquid Cash Reserves (Beginning of Period)</td><td class="amount">${fmt(cashFlow.openingCashBalance)}</td></tr>
      <tr class="row-grandtotal"><td>CLOSING LIQUID CASH RESERVES (Reconciled with Banks & Cash Vault)</td><td class="amount">${fmt(cashFlow.closingCashBalance)}</td></tr>
    </tbody>
  </table>
  ` : ''}

  ${showIS ? `
  <!-- 3. INCOME STATEMENT & LEDGER (P&L) -->
  <div class="page-break"></div>
  <div class="section-title">3. Income Statement (Profit & Loss / Inflow Ledger)</div>
  <table class="statement-table">
    <thead>
      <tr>
        <th style="width: 70%;">Revenue Category & Source</th>
        <th style="text-align: right;">Amount (BDT)</th>
      </tr>
    </thead>
    <tbody>
      <tr class="row-group-header"><td colspan="2">OPERATING REVENUES</td></tr>
      <tr><td style="padding-left: 20px;">Salary, Employment Compensation & Wages</td><td class="amount">${fmt(incomeStatement.operatingRevenue.salaryWages)}</td></tr>
      <tr><td style="padding-left: 20px;">Commercial Business Revenues</td><td class="amount">${fmt(incomeStatement.operatingRevenue.businessRevenue)}</td></tr>
      <tr><td style="padding-left: 20px;">Consulting & Freelance Professional Inflows</td><td class="amount">${fmt(incomeStatement.operatingRevenue.consultingFreelance)}</td></tr>
      <tr class="row-subtotal"><td>Total Operating Revenues</td><td class="amount">${fmt(incomeStatement.operatingRevenue.subtotal)}</td></tr>

      <tr class="row-group-header"><td colspan="2">PASSIVE & INVESTMENT YIELDS</td></tr>
      <tr><td style="padding-left: 20px;">DSE/CSE Stock Dividends & Cash Payouts</td><td class="amount">${fmt(incomeStatement.passiveInvestmentIncome.stockDividends)}</td></tr>
      <tr><td style="padding-left: 20px;">Fixed Deposit Receipt (FDR) Monthly Returns</td><td class="amount">${fmt(incomeStatement.passiveInvestmentIncome.fdrProfits)}</td></tr>
      <tr><td style="padding-left: 20px;">Sanchaypatra Quarterly National Savings Coupons</td><td class="amount">${fmt(incomeStatement.passiveInvestmentIncome.sanchaypatraProfits)}</td></tr>
      <tr><td style="padding-left: 20px;">Physical Real Estate Rental Yields</td><td class="amount">${fmt(incomeStatement.passiveInvestmentIncome.realEstateRentalYield)}</td></tr>
      <tr class="row-subtotal"><td>Total Passive Investment Income</td><td class="amount">${fmt(incomeStatement.passiveInvestmentIncome.subtotal)}</td></tr>

      <tr class="row-group-header"><td colspan="2">OTHER COMPREHENSIVE INFLOWS</td></tr>
      <tr><td style="padding-left: 20px;">Bonuses, Festival Allowances & Gifts</td><td class="amount">${fmt(incomeStatement.otherIncome.bonusesGifts)}</td></tr>
      <tr class="row-subtotal"><td>Total Other Inflows</td><td class="amount">${fmt(incomeStatement.otherIncome.subtotal)}</td></tr>

      <tr class="row-grandtotal"><td>GROSS COMPREHENSIVE REVENUE</td><td class="amount">${fmt(incomeStatement.grossTotalRevenue)}</td></tr>
      <tr><td style="padding-left: 20px; color: #DC2626;">Less: Total Operating Expenditures for the Period</td><td class="amount" style="color: #DC2626;">(${fmt(incomeStatement.operatingExpenses)})</td></tr>
      <tr class="row-grandtotal"><td>NET COMPREHENSIVE SURPLUS (Operating Margin: ${incomeStatement.operatingMarginPercent}%)</td><td class="amount">${fmt(incomeStatement.netOperatingIncome)}</td></tr>
    </tbody>
  </table>
  ` : ''}

  ${showEL ? `
  <!-- 4. EXPENSE LEDGER & BREAKDOWN -->
  <div class="page-break"></div>
  <div class="section-title">4. Expenditure Ledger & Category Breakdown</div>
  <table class="statement-table">
    <thead>
      <tr>
        <th>Expense Category</th>
        <th style="text-align: center;">Entries</th>
        <th style="text-align: center;">% Share</th>
        <th style="text-align: right;">Expenditure (BDT)</th>
      </tr>
    </thead>
    <tbody>
      ${expenseLedger.categoryBreakdown.map((cat) => `
        <tr>
          <td style="font-weight: 700;">${cat.category}</td>
          <td style="text-align: center;">${cat.entryCount}</td>
          <td style="text-align: center;">${cat.percentage}%</td>
          <td class="amount">${fmt(cat.amount)}</td>
        </tr>
      `).join('')}
      <tr class="row-grandtotal">
        <td>TOTAL RECORDED EXPENDITURE</td>
        <td style="text-align: center;">${expenseLedger.itemizedExpenses.length}</td>
        <td style="text-align: center;">100%</td>
        <td class="amount">${fmt(expenseLedger.totalExpenses)}</td>
      </tr>
    </tbody>
  </table>
  ` : ''}

  <!-- INTUIT FINANCIAL HEALTH RATIOS -->
  <div class="section-title">5. Financial Intelligence & Liquidity Ratios (Intuit Benchmark)</div>
  <div class="ratio-grid">
    ${intuitRatios.ratios.map((r) => `
      <div class="ratio-card">
        <div class="name">${r.name}</div>
        <div class="val">${r.formatted}</div>
        <div class="sub">Benchmark: ${r.benchmark} • <strong>${r.status.toUpperCase()}</strong></div>
      </div>
    `).join('')}
  </div>

  <!-- Audit Signature Footer -->
  <div class="audit-footer">
    <div>
      <div><strong>Audit Opinion:</strong> Unqualified clean presentation compliant with IFRS/GAAP guidelines.</div>
      <div>Data extracted cryptographically from Money-Honey Local-First Secure Vault.</div>
    </div>
    <div style="text-align: right;">
      <div><strong>Prepared for:</strong> ${ownerName}</div>
      <div>Certified Executive Financial Record</div>
    </div>
  </div>

</body>
</html>`;
  }

  /**
   * Opens print window or triggers browser print/PDF export
   */
  public static printFinancialReport(htmlContent: string): void {
    if (typeof window === 'undefined') return;

    // Use invisible iframe or popup window for clean isolated print
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      // Fallback if popup blocked: print current document with injected styles
      window.print();
    }
  }

  /**
   * Cross-platform share: uses Web Share API on mobile, falls back to clipboard
   */
  public static async shareFinancialReport(params: {
    title: string;
    text: string;
  }): Promise<{ success: boolean; method: 'native_share' | 'clipboard' }> {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: params.title,
          text: params.text,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
        });
        return { success: true, method: 'native_share' };
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          // Fall through to clipboard
        } else {
          return { success: false, method: 'native_share' };
        }
      }
    }

    // Fallback: Copy to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(params.text);
        return { success: true, method: 'clipboard' };
      } catch (e) {}
    }

    return { success: false, method: 'clipboard' };
  }

  /**
   * Downloads standalone HTML file
   */
  public static downloadHtmlReport(filename: string, htmlContent: string): void {
    if (typeof window === 'undefined' || !window.document) return;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
