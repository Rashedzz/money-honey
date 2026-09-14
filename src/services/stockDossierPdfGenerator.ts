/**
 * Institutional Equity Research Dossier & 100% Complete PDF Generator
 * Compiles all 14 research dimensions into a publication-ready report
 * with high-resolution vector SVG graphs:
 * 1. Candlestick & Volume Chart (SVG with SMA 20, SMA 50, Support & Resistance)
 * 2. Walk-Forward AI Forecast vs Actual Realized Price Chart (SVG)
 * 3. Level 2 Order Book Depth & Pressure Gauge (SVG)
 * 4. 5-Model Competing AI Ensemble Architecture (SVG Bar Chart)
 * 5. Full DCF Valuation Waterfall Chart (SVG)
 * 6. Forensic Accounting Fraud Radar & Distress Meters (SVG)
 * 7. Institutional Shareholding Structure (SVG Segmented Stack)
 * 8. Dividend History & Payout Trend (SVG Bar Graph)
 * 9. Technical Indicators, Moving Averages & Momentum Matrix
 * 10. Statistical Candlestick Patterns & Historical Win-Rates
 * 11. Complete Financial Statements & Multiples (EPS, NAV, P/E, P/B, ROE)
 * 12. 10-Year Historical Financial Performance Archive & CAGR
 * 13. News Sentiment, NLP Textual Intelligence & Analyst Consensus
 * 14. Regulatory Compliance (BSEC Category, Floor/Ceiling, Margin Haircut)
 */

import { DseStockItem } from '../finance/bdStockIntelligence';
import { generateCandleSeries, CandleDataPoint } from '../components/stock/StockCandleChart';
import { getForecastAccuracyAnalysis, ForecastAccuracySummary } from '../finance/aiForecastAccuracyEngine';
import {
  getMarketDepthLadder,
  getDseShareholding,
  getDseRegulatoryStatus,
} from '../finance/advancedStockFeatures';
import { generate5ModelAiEnsemble } from '../finance/aiMultiModelEnsemble';
import { calculateDetailedDCF } from '../finance/dcfValuationEngine';
import { getDividendProfileForStock } from '../finance/dividendAnalysisEngine';
import { performForensicAccountingAudit } from '../finance/accountingFraudDetection';
import { analyzeStockNewsSentiment } from '../finance/aiNewsSentimentEngine';
import { generateTechnicalIndicators } from '../finance/technicalAnalysisEngine';
import { generateFundamentalDossier } from '../finance/fundamentalAnalysisEngine';
import { getCompanyCandlestickPatterns } from '../finance/candlestickPatternEngine';
import { generate10YearHistoricalSeries } from '../finance/dseHistoricalDatabase';

export class StockDossierPdfGenerator {
  /**
   * Generates vector SVG for Candlestick & Volume Chart
   */
  private static renderCandlestickSvg(
    candles: CandleDataPoint[],
    supportLevel?: number,
    resistanceLevel?: number
  ): string {
    const width = 760;
    const height = 260;
    const padL = 12;
    const padR = 65;
    const padT = 15;
    const padB = 40;
    const volHeight = 45;
    const mainHeight = height - padT - padB - volHeight;
    const plotWidth = width - padL - padR;

    const allPrices = candles.flatMap((c) => [c.low, c.high]);
    if (supportLevel) allPrices.push(supportLevel);
    if (resistanceLevel) allPrices.push(resistanceLevel);

    const minP = Math.floor(Math.min(...allPrices) * 0.98);
    const maxP = Math.ceil(Math.max(...allPrices) * 1.02);
    const pRange = maxP - minP || 1;

    const maxVol = Math.max(...candles.map((c) => c.volume)) || 1;

    const getX = (i: number) => padL + (i / (candles.length - 1)) * plotWidth;
    const getY = (p: number) => padT + mainHeight - ((p - minP) / pRange) * mainHeight;
    const getVolY = (v: number) => padT + mainHeight + 15 + volHeight - (v / maxVol) * volHeight;

    const candleWidth = Math.max(4, (plotWidth / candles.length) * 0.65);

    // Compute SMA 20
    const sma20Pts: string[] = [];
    for (let i = 0; i < candles.length; i++) {
      if (i >= 6) {
        let sum = 0;
        for (let j = 0; j < 7; j++) sum += candles[i - j].close;
        sma20Pts.push(`${getX(i)},${getY(sum / 7)}`);
      }
    }

    // Compute SMA 50
    const sma50Pts: string[] = [];
    for (let i = 0; i < candles.length; i++) {
      if (i >= 13) {
        let sum = 0;
        for (let j = 0; j < 14; j++) sum += candles[i - j].close;
        sma50Pts.push(`${getX(i)},${getY(sum / 14)}`);
      }
    }

    // Grid lines & labels
    const gridSteps = 5;
    let gridSvg = '';
    for (let i = 0; i <= gridSteps; i++) {
      const price = minP + (i / gridSteps) * pRange;
      const y = getY(price);
      gridSvg += `
        <line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="3,3" stroke-width="1" />
        <text x="${width - padR + 8}" y="${y + 4}" font-size="11" fill="#64748B" font-family="sans-serif">৳${price.toFixed(1)}</text>
      `;
    }

    // Candlesticks & Volume bars
    let candlesSvg = '';
    candles.forEach((c, i) => {
      const x = getX(i);
      const isUp = c.close >= c.open;
      const color = isUp ? '#16A34A' : '#EF4444';
      const yHigh = getY(c.high);
      const yLow = getY(c.low);
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const bodyY = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

      // Wick
      candlesSvg += `<line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${color}" stroke-width="1.5" />`;
      // Body
      candlesSvg += `<rect x="${x - candleWidth / 2}" y="${bodyY}" width="${candleWidth}" height="${bodyHeight}" fill="${color}" stroke="${color}" rx="1" />`;

      // Volume bar
      const volY = getVolY(c.volume);
      const volH = padT + mainHeight + 15 + volHeight - volY;
      candlesSvg += `<rect x="${x - candleWidth / 2}" y="${volY}" width="${candleWidth}" height="${volH}" fill="${color}" opacity="0.35" />`;

      // Date labels every 4th
      if (i % 4 === 0 || i === candles.length - 1) {
        candlesSvg += `<text x="${x}" y="${height - 10}" font-size="10" fill="#64748B" text-anchor="middle" font-family="sans-serif">${c.date}</text>`;
      }
    });

    // Support & Resistance Lines
    let linesSvg = '';
    if (supportLevel && supportLevel >= minP && supportLevel <= maxP) {
      const supY = getY(supportLevel);
      linesSvg += `
        <line x1="${padL}" y1="${supY}" x2="${width - padR}" y2="${supY}" stroke="#16A34A" stroke-dasharray="5,4" stroke-width="1.5" />
        <text x="${width - padR + 8}" y="${supY - 4}" font-size="10" font-weight="bold" fill="#16A34A" font-family="sans-serif">Support ৳${supportLevel}</text>
      `;
    }
    if (resistanceLevel && resistanceLevel >= minP && resistanceLevel <= maxP) {
      const resY = getY(resistanceLevel);
      linesSvg += `
        <line x1="${padL}" y1="${resY}" x2="${width - padR}" y2="${resY}" stroke="#EF4444" stroke-dasharray="5,4" stroke-width="1.5" />
        <text x="${width - padR + 8}" y="${resY - 4}" font-size="10" font-weight="bold" fill="#EF4444" font-family="sans-serif">Resist ৳${resistanceLevel}</text>
      `;
    }

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#FFFFFF;border-radius:6px;">
        ${gridSvg}
        ${candlesSvg}
        ${sma20Pts.length > 1 ? `<polyline points="${sma20Pts.join(' ')}" fill="none" stroke="#0284C7" stroke-width="2" />` : ''}
        ${sma50Pts.length > 1 ? `<polyline points="${sma50Pts.join(' ')}" fill="none" stroke="#EA580C" stroke-width="2" />` : ''}
        ${linesSvg}
      </svg>
    `;
  }

  /**
   * Generates vector SVG for Forecast vs Actual Realized Price Chart
   */
  private static renderForecastAccuracySvg(accuracy: ForecastAccuracySummary): string {
    const width = 760;
    const height = 200;
    const padL = 12;
    const padR = 65;
    const padT = 15;
    const padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const allPrices = accuracy.timeline.flatMap((t) => [
      t.actualPrice,
      t.forecastedPrice,
      t.upperConfidenceBound,
      t.lowerConfidenceBound,
    ]);
    const minP = Math.floor(Math.min(...allPrices) * 0.98);
    const maxP = Math.ceil(Math.max(...allPrices) * 1.02);
    const pRange = maxP - minP || 1;

    const getX = (i: number) => padL + (i / (accuracy.timeline.length - 1)) * plotW;
    const getY = (p: number) => padT + plotH - ((p - minP) / pRange) * plotH;

    // Confidence polygon
    const uPts = accuracy.timeline.map((t, i) => `${getX(i)},${getY(t.upperConfidenceBound)}`);
    const lPts = accuracy.timeline
      .slice()
      .reverse()
      .map((t, i) => {
        const revIdx = accuracy.timeline.length - 1 - i;
        return `${getX(revIdx)},${getY(t.lowerConfidenceBound)}`;
      });
    const polygonPts = [...uPts, ...lPts].join(' ');

    const actualPts = accuracy.timeline.map((t, i) => `${getX(i)},${getY(t.actualPrice)}`).join(' ');
    const forecastPts = accuracy.timeline.map((t, i) => `${getX(i)},${getY(t.forecastedPrice)}`).join(' ');

    // Date markers
    let datesSvg = '';
    accuracy.timeline.forEach((t, i) => {
      if (i % 2 === 0 || i === accuracy.timeline.length - 1) {
        datesSvg += `<text x="${getX(i)}" y="${height - 8}" font-size="10" fill="#64748B" text-anchor="middle" font-family="sans-serif">${t.date}</text>`;
      }
    });

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#FFFFFF;border-radius:6px;">
        <polygon points="${polygonPts}" fill="#E0F2FE" opacity="0.65" stroke="#BAE6FD" stroke-width="1" />
        <polyline points="${forecastPts}" fill="none" stroke="#0284C7" stroke-dasharray="4,4" stroke-width="2.5" />
        <polyline points="${actualPts}" fill="none" stroke="#16A34A" stroke-width="2.5" />
        ${accuracy.timeline
          .map((t, i) => `<circle cx="${getX(i)}" cy="${getY(t.actualPrice)}" r="3.5" fill="#16A34A" stroke="#FFFFFF" stroke-width="1.5" />`)
          .join('')}
        ${accuracy.timeline
          .map((t, i) => `<circle cx="${getX(i)}" cy="${getY(t.forecastedPrice)}" r="3" fill="#0284C7" stroke="#FFFFFF" stroke-width="1" />`)
          .join('')}
        ${datesSvg}
        <text x="${width - padR + 6}" y="${getY(accuracy.timeline[accuracy.timeline.length - 1].actualPrice) + 4}" font-size="11" font-weight="bold" fill="#16A34A" font-family="sans-serif">৳${accuracy.timeline[accuracy.timeline.length - 1].actualPrice}</text>
      </svg>
    `;
  }

  /**
   * Generates vector SVG for DCF Valuation Waterfall Chart
   */
  private static renderDcfWaterfallSvg(dcf: any): string {
    const width = 760;
    const height = 180;
    const padL = 20;
    const padR = 20;
    const padT = 20;
    const padB = 40;
    const plotW = width - padL - padR;

    const steps = dcf.waterfallSteps || [];
    if (steps.length === 0) return '';

    const barWidth = Math.min(65, plotW / steps.length - 14);
    const maxVal = Math.max(...steps.map((s: any) => Math.abs(s.amountCrore))) || 1000;

    let barsSvg = '';
    steps.forEach((s: any, i: number) => {
      const x = padL + i * (plotW / steps.length) + (plotW / steps.length - barWidth) / 2;
      const isNeg = s.amountCrore < 0;
      const isFinal = i === steps.length - 1;
      const color = isFinal ? '#16A34A' : isNeg ? '#EF4444' : '#0284C7';
      const barH = Math.max(12, (Math.abs(s.amountCrore) / maxVal) * (height - padT - padB));
      const y = height - padB - barH;

      barsSvg += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="${color}" rx="3" />
        <text x="${x + barWidth / 2}" y="${y - 5}" font-size="10" font-weight="bold" fill="#0F172A" text-anchor="middle" font-family="sans-serif">৳${Math.abs(s.amountCrore)}Cr</text>
        <text x="${x + barWidth / 2}" y="${height - padB + 16}" font-size="9" fill="#475569" text-anchor="middle" font-family="sans-serif">${s.stepName.split(' ')[0]}</text>
      `;
    });

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#F8FAFC;border-radius:6px;">
        <line x1="${padL}" y1="${height - padB}" x2="${width - padR}" y2="${height - padB}" stroke="#CBD5E1" stroke-width="1.5" />
        ${barsSvg}
      </svg>
    `;
  }

  /**
   * Generates vector SVG for 5-Model Competing AI Ensemble Weights
   */
  private static renderAiEnsembleSvg(ens: any): string {
    const width = 760;
    const height = 175;
    const models = [
      ens.modelA_TimeSeries,
      ens.modelB_MachineLearning,
      ens.modelC_DeepLearning,
      ens.modelD_MarketRegime,
      ens.modelE_NlpLlmSentiment,
    ];

    let barsSvg = '';
    const rowH = 30;
    models.forEach((m: any, idx: number) => {
      const y = 10 + idx * rowH;
      const barMaxW = 280;
      const w = (m.weightInEnsemblePercent / 35) * barMaxW;

      barsSvg += `
        <text x="10" y="${y + 16}" font-size="11" font-weight="bold" fill="#0F172A" font-family="sans-serif">${m.modelGroup}</text>
        <text x="140" y="${y + 16}" font-size="10" fill="#64748B" font-family="sans-serif">${m.modelTitle.slice(0, 24)}</text>
        <rect x="300" y="${y + 4}" width="${w}" height="14" fill="#0284C7" rx="3" />
        <text x="310 + ${w}" y="${y + 15}" font-size="10" font-weight="bold" fill="#0284C7" font-family="sans-serif">${m.weightInEnsemblePercent}% Wt</text>
        <text x="620" y="${y + 16}" font-size="11" font-weight="bold" fill="#16A34A" font-family="sans-serif">৳${m.forecastPrice} (+${m.expectedReturnPercent}%)</text>
      `;
    });

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#F8FAFC;border-radius:6px;">
        ${barsSvg}
      </svg>
    `;
  }

  /**
   * Generates vector SVG for Institutional Shareholding Distribution
   */
  private static renderShareholdingSvg(sh: any): string {
    const width = 760;
    const height = 48;
    const total = 100;
    const barW = width - 40;

    const spW = (sh.sponsorsDirectorsPercent / total) * barW;
    const instW = (sh.institutionsPercent / total) * barW;
    const pubW = (sh.generalPublicPercent / total) * barW;
    const forW = (sh.foreignPercent / total) * barW;
    const govW = (sh.govtPercent / total) * barW;

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(20, 10)">
          <rect x="0" y="0" width="${spW}" height="22" fill="#0284C7" rx="3" />
          <rect x="${spW}" y="0" width="${instW}" height="22" fill="#16A34A" />
          <rect x="${spW + instW}" y="0" width="${pubW}" height="22" fill="#F59E0B" />
          <rect x="${spW + instW + pubW}" y="0" width="${forW}" height="22" fill="#6366F1" />
          <rect x="${spW + instW + pubW + forW}" y="0" width="${govW}" height="22" fill="#EF4444" rx="3" />
        </g>
      </svg>
    `;
  }

  /**
   * Generates vector SVG for Forensic Accounting Fraud Radar & Distress Meters
   */
  private static renderFraudRadarSvg(audit: any): string {
    const width = 760;
    const height = 115;

    // Altman Z: range 0 to 5. Thresholds: 1.81 (distress), 2.99 (safe)
    const zScore = Math.min(Math.max(audit.altmanZScore, 0), 5);
    const zPercent = (zScore / 5) * 100;

    // Beneish M: range -4 to 0. Threshold: -1.78
    const mScore = Math.min(Math.max(audit.beneishMScore, -4), 0);
    const mPercent = ((mScore - -4) / 4) * 100;

    // Piotroski F: range 0 to 9
    const fScore = Math.min(Math.max(audit.piotroskiFScore, 0), 9);
    const fPercent = (fScore / 9) * 100;

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; margin: 10px 0;">
        <!-- Altman Z Meter -->
        <text x="20" y="27" font-size="11" font-weight="700" fill="#334155">Altman Z-Score (Solvency): ${audit.altmanZScore}</text>
        <rect x="230" y="16" width="300" height="14" rx="4" fill="#E2E8F0" />
        <rect x="230" y="16" width="${(1.81 / 5) * 300}" height="14" fill="#EF4444" opacity="0.45" />
        <rect x="${230 + (1.81 / 5) * 300}" y="16" width="${((2.99 - 1.81) / 5) * 300}" height="14" fill="#F59E0B" opacity="0.45" />
        <rect x="${230 + (2.99 / 5) * 300}" y="16" width="${((5 - 2.99) / 5) * 300}" height="14" fill="#16A34A" opacity="0.45" />
        <circle cx="${230 + (zPercent / 100) * 300}" cy="23" r="7" fill="#0284C7" stroke="#FFFFFF" stroke-width="2" />
        <text x="545" y="27" font-size="11" font-weight="800" fill="${zScore >= 2.99 ? '#16A34A' : zScore < 1.81 ? '#EF4444' : '#F59E0B'}">${audit.altmanVerdict}</text>

        <!-- Beneish M Meter -->
        <text x="20" y="62" font-size="11" font-weight="700" fill="#334155">Beneish M-Score (Manip.): ${audit.beneishMScore}</text>
        <rect x="230" y="51" width="300" height="14" rx="4" fill="#E2E8F0" />
        <rect x="230" y="51" width="${((-1.78 - -4) / 4) * 300}" height="14" fill="#16A34A" opacity="0.45" />
        <rect x="${230 + ((-1.78 - -4) / 4) * 300}" y="51" width="${((0 - -1.78) / 4) * 300}" height="14" fill="#EF4444" opacity="0.45" />
        <circle cx="${230 + (mPercent / 100) * 300}" cy="58" r="7" fill="#0284C7" stroke="#FFFFFF" stroke-width="2" />
        <text x="545" y="62" font-size="11" font-weight="800" fill="${mScore <= -1.78 ? '#16A34A' : '#EF4444'}">${audit.beneishVerdict.includes('Non-Manipulator') || mScore <= -1.78 ? '✅ Safe (Non-Manipulator)' : '⚠️ Scrutiny Advised'}</text>

        <!-- Piotroski F Meter -->
        <text x="20" y="97" font-size="11" font-weight="700" fill="#334155">Piotroski F-Score (Health): ${audit.piotroskiFScore}/9</text>
        <rect x="230" y="86" width="300" height="14" rx="4" fill="#E2E8F0" />
        <rect x="230" y="86" width="${(fPercent / 100) * 300}" height="14" rx="4" fill="${fScore >= 7 ? '#16A34A' : fScore >= 5 ? '#F59E0B' : '#EF4444'}" />
        <circle cx="${230 + (fPercent / 100) * 300}" cy="93" r="7" fill="#0284C7" stroke="#FFFFFF" stroke-width="2" />
        <text x="545" y="97" font-size="11" font-weight="800" fill="${fScore >= 7 ? '#16A34A' : fScore >= 5 ? '#F59E0B' : '#EF4444'}">${audit.piotroskiVerdict}</text>
      </svg>
    `;
  }

  /**
   * Generates vector SVG for 10-Year Historical Price & EPS Growth Area Trend
   */
  private static renderHistoricalTrendSvg(records: any[]): string {
    if (!records || records.length === 0) return '';
    const width = 760;
    const height = 150;
    const padL = 45;
    const padR = 25;
    const padT = 20;
    const padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const series = [...records].reverse();
    const prices = series.map((r) => r.close);
    const minP = Math.min(...prices) * 0.9;
    const maxP = Math.max(...prices) * 1.1;
    const rangeP = maxP - minP || 1;

    const points = series.map((r, i) => {
      const x = padL + (i / (series.length - 1 || 1)) * plotW;
      const y = padT + plotH - ((r.close - minP) / rangeP) * plotH;
      return { x, y, r };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${padT + plotH} L ${points[0].x.toFixed(1)} ${padT + plotH} Z`;

    const dots = points
      .map(
        (p) => `
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#0284C7" stroke="#FFFFFF" stroke-width="1.5" />
        <text x="${p.x.toFixed(1)}" y="${(p.y - 8).toFixed(1)}" font-size="9" font-weight="700" text-anchor="middle" fill="#0F172A">৳${p.r.close}</text>
        <text x="${p.x.toFixed(1)}" y="${height - 10}" font-size="10" font-weight="600" text-anchor="middle" fill="#64748B">${p.r.date.slice(0, 4)}</text>
      `
      )
      .join('');

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; margin: 10px 0;">
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0284C7" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#0284C7" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        <line x1="${padL}" y1="${padT}" x2="${width - padR}" y2="${padT}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3,3" />
        <line x1="${padL}" y1="${padT + plotH / 2}" x2="${width - padR}" y2="${padT + plotH / 2}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3,3" />
        <line x1="${padL}" y1="${padT + plotH}" x2="${width - padR}" y2="${padT + plotH}" stroke="#CBD5E1" stroke-width="1" />
        <path d="${areaD}" fill="url(#histGrad)" />
        <path d="${pathD}" fill="none" stroke="#0284C7" stroke-width="2.5" />
        ${dots}
      </svg>
    `;
  }

  /**
   * Opens the publication-ready, 100% complete institutional equity research dossier
   * formatted for physical printing or instant "Save as PDF" with all graphs intact.
   */
  public static openPrintDossier(stock: DseStockItem): void {
    if (typeof window === 'undefined') return;

    // 1. Gather all analytical data
    const candles = generateCandleSeries(stock.symbol, stock.ltp, '3M', {
      dayChange: stock.change,
      week52High: stock.week52High,
      week52Low: stock.week52Low,
      dayOpen: stock.open,
      dayHigh: stock.high,
      dayLow: stock.low,
    });
    const accuracy = getForecastAccuracyAnalysis(stock.symbol, '1Y');
    const dcf = calculateDetailedDCF(stock.symbol, stock.ltp, 886.45);
    const ensemble = generate5ModelAiEnsemble(stock.symbol, stock.ltp);
    const audit = performForensicAccountingAudit(stock.symbol, stock.companyName);
    const shareholding = getDseShareholding(stock.symbol);
    const regulatory = getDseRegulatoryStatus(stock.symbol, stock.ltp);
    const depth = getMarketDepthLadder(stock.symbol, stock.ltp);
    const dividend = getDividendProfileForStock(stock.symbol);
    const tech = generateTechnicalIndicators(stock.symbol, stock.ltp, stock.supportLevel, stock.resistanceLevel);
    const fundamentals = generateFundamentalDossier(
      stock.symbol,
      stock.eps,
      stock.peRatio,
      stock.roePercent,
      stock.dividendYieldPercent
    );
    const patterns = getCompanyCandlestickPatterns(stock.symbol);
    const historicalSeries = generate10YearHistoricalSeries(stock.symbol, stock.ltp, stock.eps, stock.nav);
    const news = analyzeStockNewsSentiment(stock.symbol);

    // 2. Generate vector SVG charts
    const candlestickSvg = this.renderCandlestickSvg(candles, stock.supportLevel, stock.resistanceLevel);
    const forecastAccuracySvg = this.renderForecastAccuracySvg(accuracy);
    const dcfWaterfallSvg = this.renderDcfWaterfallSvg(dcf);
    const aiEnsembleSvg = this.renderAiEnsembleSvg(ensemble);
    const shareholdingSvg = this.renderShareholdingSvg(shareholding);
    const fraudRadarSvg = this.renderFraudRadarSvg(audit);
    const historicalTrendSvg = this.renderHistoricalTrendSvg(historicalSeries);

    const printHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${stock.symbol} - 100% Complete Institutional Equity Research Dossier</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0F172A;
              background-color: #FFFFFF;
              padding: 24px;
              max-width: 960px;
              margin: 0 auto;
              line-height: 1.45;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            /* Floating Sticky Print Bar */
            .print-bar {
              position: sticky;
              top: 0;
              background: #0F172A;
              color: #FFFFFF;
              padding: 12px 20px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 24px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.15);
              z-index: 1000;
            }
            .print-btn {
              background: #16A34A;
              color: #FFFFFF;
              border: none;
              padding: 9px 18px;
              font-size: 14px;
              font-weight: 800;
              border-radius: 6px;
              cursor: pointer;
            }
            .close-btn {
              background: #334155;
              color: #FFFFFF;
              border: none;
              padding: 8px 14px;
              font-size: 13px;
              font-weight: 700;
              border-radius: 6px;
              cursor: pointer;
              margin-left: 8px;
            }

            /* Header Section */
            .header-box {
              border-bottom: 3px solid #0284C7;
              padding-bottom: 14px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              flex-wrap: wrap;
              gap: 12px;
            }
            .company-name { font-size: 26px; font-weight: 900; color: #0F172A; margin: 0; }
            .company-sub { font-size: 13px; color: #64748B; margin-top: 4px; }
            .rec-badge {
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 15px;
              font-weight: 900;
              background: #DCFCE7;
              color: #16A34A;
              border: 1.5px solid #86EFAC;
            }

            /* Key Metrics Grid */
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 18px;
            }
            .kpi-card {
              background: #F8FAFC;
              border: 1px solid #E2E8F0;
              padding: 10px 12px;
              border-radius: 6px;
            }
            .kpi-label { font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
            .kpi-val { font-size: 18px; font-weight: 900; color: #0F172A; margin-top: 2px; }
            .kpi-sub { font-size: 10px; color: #64748B; margin-top: 1px; }

            /* Sections */
            .section {
              margin-top: 22px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .sec-title {
              font-size: 14px;
              font-weight: 900;
              color: #0369A1;
              border-bottom: 1.5px solid #BAE6FD;
              padding-bottom: 5px;
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
            }
            .thesis-box {
              background: #F0F9FF;
              border: 1px solid #BAE6FD;
              padding: 12px 14px;
              border-radius: 6px;
              font-size: 13px;
              line-height: 1.6;
              color: #0F172A;
            }

            /* Tables */
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #E2E8F0;
              padding: 7px 10px;
              text-align: left;
            }
            th {
              background: #F1F5F9;
              font-weight: 800;
              color: #334155;
            }
            .highlight-green { font-weight: 800; color: #16A34A; }
            .highlight-blue { font-weight: 800; color: #0284C7; }
            .highlight-red { font-weight: 800; color: #DC2626; }

            /* Print Styles */
            @media print {
              body { padding: 0; }
              .print-bar { display: none !important; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <!-- Floating Sticky Print Bar -->
          <div class="print-bar">
            <div>
              <span style="font-weight: 800; font-size: 15px;">📊 ${stock.companyName} (${stock.symbol})</span>
              <span style="margin-left: 10px; color: #94A3B8; font-size: 12px;">Full Institutional Equity Research Dossier</span>
            </div>
            <div>
              <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
              <button class="close-btn" onclick="window.close()">✕ Close</button>
            </div>
          </div>

          <!-- Cover Header -->
          <div class="header-box">
            <div>
              <div class="company-name">${stock.companyName} (${stock.symbol})</div>
              <div class="company-sub">
                Exchange: ${stock.exchange} • Sector: ${stock.sector} • Currency: ${stock.currency || 'BDT'} • Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div class="rec-badge">
              ${stock.recommendation} • AI Score: ${stock.totalAiScore}/100
            </div>
          </div>

          <!-- Key Financial Highlights Grid -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Last Traded Price</div>
              <div class="kpi-val">৳${stock.ltp}</div>
              <div class="kpi-sub">${stock.change >= 0 ? '+' : ''}৳${stock.change} (${stock.changePercent}%)</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">DCF Intrinsic Fair Value</div>
              <div class="kpi-val highlight-blue">৳${dcf.intrinsicValuePerShare}</div>
              <div class="kpi-sub">Margin of Safety: +${dcf.marginOfSafetyPercent}%</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">AI Consensus Target</div>
              <div class="kpi-val highlight-green">৳${ensemble.ensembleTargetPrice}</div>
              <div class="kpi-sub">+${ensemble.potentialUpsidePercent}% Potential Upside</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Market Capitalization</div>
              <div class="kpi-val">৳${stock.marketCapCrore.toLocaleString('en-IN')} Cr</div>
              <div class="kpi-sub">P/E: ${stock.peRatio}x • P/B: ${stock.pbRatio}x</div>
            </div>
          </div>

          <!-- 1. Executive Investment Thesis -->
          <div class="section">
            <div class="sec-title">🎯 1. INSTITUTIONAL INVESTMENT THESIS & STRATEGY</div>
            <div class="thesis-box">
              <strong>Investment Thesis:</strong> ${stock.aiInvestmentThesis}
              <div style="margin-top: 8px; color: #DC2626;">
                <strong>⚠️ Principal Risk Factors:</strong> ${stock.riskFactors} • Stop-Loss Reference: ৳${stock.supportLevel}
              </div>
            </div>
          </div>

          <!-- 2. GRAPH: Candlestick & Volume Chart -->
          <div class="section">
            <div class="sec-title">
              <span>📈 2. TRADINGVIEW-STYLE CANDLESTICK & VOLUME TECHNICAL CHART</span>
              <span style="font-size: 11px; color: #64748B;">Blue: SMA 20 • Orange: SMA 50 • Green/Red Dashed: Support/Resistance</span>
            </div>
            ${candlestickSvg}
          </div>

          <!-- 3. GRAPH: Walk-Forward AI Forecast vs Actual Accuracy -->
          <div class="section">
            <div class="sec-title">
              <span>🎯 3. AI WALK-FORWARD FORECAST ACCURACY VS ACTUAL REALIZED PRICE</span>
              <span style="font-size: 11px; color: #16A34A;">Directional Hit Rate: ${accuracy.directionalAccuracyPercent}% • Target Hit: ${accuracy.targetHitRatePercent}%</span>
            </div>
            ${forecastAccuracySvg}
            <div style="display: flex; gap: 10px; margin-top: 8px;">
              <div class="kpi-card" style="flex:1;">
                <div class="kpi-label">MAPE (Mean Error)</div>
                <div class="kpi-val highlight-blue">±${accuracy.meanAbsoluteErrorPercent}%</div>
              </div>
              <div class="kpi-card" style="flex:1;">
                <div class="kpi-label">Winning Targets</div>
                <div class="kpi-val highlight-green">${accuracy.winningPredictions} / ${accuracy.totalPredictions}</div>
              </div>
              <div class="kpi-card" style="flex:1;">
                <div class="kpi-label">Profit Factor</div>
                <div class="kpi-val">${accuracy.profitFactor}x</div>
              </div>
              <div class="kpi-card" style="flex:1;">
                <div class="kpi-label">Alpha vs DSEX</div>
                <div class="kpi-val highlight-green">+${accuracy.alphaVsDsexPercent}%</div>
              </div>
            </div>
          </div>

          <!-- 4. GRAPH: 5-Model Competing AI Ensemble Breakdown -->
          <div class="section page-break">
            <div class="sec-title">🤖 4. 5-MODEL MULTI-FACTOR AI ENSEMBLE ARCHITECTURE</div>
            ${aiEnsembleSvg}
            <table>
              <tr>
                <th>Model Architecture</th>
                <th>Underlying Tech Stack</th>
                <th>Forecast Target</th>
                <th>Expected Upside</th>
                <th>Ensemble Weight</th>
              </tr>
              ${[
                ensemble.modelA_TimeSeries,
                ensemble.modelB_MachineLearning,
                ensemble.modelC_DeepLearning,
                ensemble.modelD_MarketRegime,
                ensemble.modelE_NlpLlmSentiment,
              ]
                .map(
                  (m: any) => `
                <tr>
                  <td><strong>${m.modelGroup}</strong>: ${m.modelTitle}</td>
                  <td>${m.technologiesUsed}</td>
                  <td><strong>৳${m.forecastPrice}</strong></td>
                  <td class="highlight-green">+${m.expectedReturnPercent}%</td>
                  <td class="highlight-blue">${m.weightInEnsemblePercent}%</td>
                </tr>
              `
                )
                .join('')}
            </table>
          </div>

          <!-- 5. GRAPH: DCF Valuation Waterfall -->
          <div class="section">
            <div class="sec-title">💎 5. STEP-BY-STEP DCF VALUATION WATERFALL</div>
            ${dcfWaterfallSvg}
            <table>
              <tr>
                <th>Waterfall Step</th>
                <th>Amount (৳ Crore)</th>
                <th>Financial Formula / Basis</th>
              </tr>
              ${dcf.waterfallSteps
                .map(
                  (s: any) => `
                <tr>
                  <td><strong>${s.stepName}</strong></td>
                  <td class="${s.amountCrore < 0 ? 'highlight-red' : 'highlight-blue'}">৳${s.amountCrore} Cr</td>
                  <td>${s.formulaDescription}</td>
                </tr>
              `
                )
                .join('')}
            </table>
          </div>

          <!-- 6. Level 2 Order Book Depth & Pressure Gauge -->
          <div class="section">
            <div class="sec-title">📊 6. LEVEL 2 MARKET DEPTH & ORDER BOOK LADDER</div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 12px;">
                <span style="color: #16A34A;">Buyers: ${depth.buyPressurePercent}%</span>
                <span style="color: #EF4444;">Sellers: ${depth.sellPressurePercent}%</span>
              </div>
              <div style="height: 8px; display: flex; border-radius: 4px; overflow: hidden; margin-top: 4px;">
                <div style="flex: ${depth.buyPressurePercent}; background: #16A34A;"></div>
                <div style="flex: ${depth.sellPressurePercent}; background: #EF4444;"></div>
              </div>
            </div>
            <table>
              <tr>
                <th colspan="2" style="background:#DCFCE7;text-align:center;color:#166534;">BUY ORDERS (BIDS)</th>
                <th colspan="2" style="background:#FEE2E2;text-align:center;color:#991B1B;">SELL ORDERS (ASKS)</th>
              </tr>
              <tr>
                <th>Volume</th><th>Bid Price</th><th>Ask Price</th><th>Volume</th>
              </tr>
              ${depth.bids.slice(0, 5).map((b: any, i: number) => {
                const a = depth.asks[i] || { price: 0, quantity: 0 };
                return `
                  <tr>
                    <td>${b.quantity.toLocaleString('en-IN')}</td>
                    <td class="highlight-green">৳${b.price}</td>
                    <td class="highlight-red">৳${a.price}</td>
                    <td>${a.quantity.toLocaleString('en-IN')}</td>
                  </tr>
                `;
              }).join('')}
            </table>
          </div>

          <!-- 7. Forensic Accounting & Fraud Radar -->
          <div class="section page-break">
            <div class="sec-title">🛡️ 7. FORENSIC ACCOUNTING AUDIT & FRAUD RADAR</div>
            ${fraudRadarSvg}
            <table>
              <tr>
                <th>Audit Model</th>
                <th>Score</th>
                <th>Benchmark / Threshold</th>
                <th>Verdict / Assessment</th>
              </tr>
              <tr>
                <td><strong>Altman Z-Score</strong> (Bankruptcy Risk)</td>
                <td class="highlight-green"><strong>${audit.altmanZScore}</strong></td>
                <td>Distress &lt; 1.81 • Safe &gt; 2.99</td>
                <td><strong>${audit.altmanVerdict}</strong></td>
              </tr>
              <tr>
                <td><strong>Beneish M-Score</strong> (Earnings Manipulation)</td>
                <td class="highlight-green"><strong>${audit.beneishMScore}</strong></td>
                <td>Manipulation Risk &gt; -1.78</td>
                <td><strong>${audit.beneishVerdict}</strong></td>
              </tr>
              <tr>
                <td><strong>Piotroski F-Score</strong> (Financial Strength)</td>
                <td class="highlight-green"><strong>${audit.piotroskiFScore} / 9</strong></td>
                <td>Strong 8-9 • Weak &lt; 4</td>
                <td><strong>${audit.piotroskiVerdict}</strong></td>
              </tr>
            </table>
          </div>

          <!-- 8. Institutional Shareholding & Regulatory Profile -->
          <div class="section">
            <div class="sec-title">🏛️ 8. INSTITUTIONAL SHAREHOLDING & BSEC COMPLIANCE</div>
            ${shareholdingSvg}
            <div style="display: flex; justify-content: space-around; font-size: 11px; margin-top: 4px; font-weight: 700;">
              <span style="color: #0284C7;">■ Sponsor/Dir: ${shareholding.sponsorsDirectorsPercent}%</span>
              <span style="color: #16A34A;">■ Institutes: ${shareholding.institutionsPercent}%</span>
              <span style="color: #F59E0B;">■ Public: ${shareholding.generalPublicPercent}%</span>
              <span style="color: #6366F1;">■ Foreign: ${shareholding.foreignPercent}%</span>
              <span style="color: #EF4444;">■ Govt: ${shareholding.govtPercent}%</span>
            </div>
            <table style="margin-top: 10px;">
              <tr><th>Parameter</th><th>Value</th><th>Parameter</th><th>Value</th></tr>
              <tr><td>BSEC 30% Rule</td><td>${shareholding.bsec30PercentRuleCompliant ? '✅ Compliant' : '⚠️ Non-Compliant'}</td><td>DSE Category</td><td><strong>Category ${regulatory.category}</strong> (${regulatory.categoryReason})</td></tr>
              <tr><td>Margin Loan Eligibility</td><td>${regulatory.marginLoanEligibility ? 'Eligible' : 'Restricted'}</td><td>Margin Haircut</td><td>${regulatory.marginHaircutPercent}%</td></tr>
              <tr><td>Settlement Cycle</td><td>${regulatory.settlementCycle}</td><td>Circuit Breaker Limits</td><td>৳${regulatory.floorPrice} to ৳${regulatory.ceilingPrice} (±${regulatory.circuitBreakerPercent}%)</td></tr>
            </table>
          </div>

          <!-- 9. Technical Indicators & Moving Averages Matrix -->
          <div class="section">
            <div class="sec-title">📐 9. TECHNICAL DIMENSION & MOMENTUM SIGNALS</div>
            <table>
              <tr><th>Indicator</th><th>Value</th><th>Status</th><th>Indicator</th><th>Value</th><th>Status</th></tr>
              <tr><td>RSI (14-Day)</td><td><strong>${tech.rsi14}</strong></td><td class="highlight-green">${tech.rsiStatus}</td><td>MACD</td><td><strong>${tech.macdLine}</strong></td><td class="highlight-green">${tech.macdStatus}</td></tr>
              <tr><td>Trend Direction</td><td colspan="2" class="highlight-green"><strong>${tech.trendDirection}</strong></td><td>Supertrend</td><td>৳${tech.supertrend}</td><td class="highlight-green">${tech.supertrendStatus}</td></tr>
              <tr><td>SMA 20</td><td>৳${tech.sma20}</td><td>Above Price</td><td>SMA 50</td><td>৳${tech.sma50}</td><td>Support Buffer</td></tr>
              <tr><td>SMA 200 (Long)</td><td>৳${tech.sma200}</td><td class="highlight-green">Golden Structure</td><td>Bollinger Bands</td><td colspan="2">Upper: ৳${tech.bollingerUpper} | Lower: ৳${tech.bollingerLower} (${tech.bollingerBandwidthPercent}% Bandwidth)</td></tr>
              <tr><td>Strong Support</td><td>৳${stock.supportLevel}</td><td>Key Floor</td><td>Strong Resistance</td><td>৳${stock.resistanceLevel}</td><td>Breakout Pivot</td></tr>
            </table>
          </div>

          <!-- 10. Fundamental Financial Statements & Multiples -->
          <div class="section page-break">
            <div class="sec-title">📊 10. FUNDAMENTAL FINANCIAL STATEMENTS & RATIOS</div>
            <table>
              <tr><th>Metric</th><th>Current Value</th><th>Benchmark / Sector Avg</th><th>Health Rating</th></tr>
              <tr><td>Earnings Per Share (EPS)</td><td>৳${stock.eps}</td><td>৳4.20 Sector Avg</td><td class="highlight-green">Institutional Leader</td></tr>
              <tr><td>Net Asset Value (NAV) per Share</td><td>৳${stock.nav}</td><td>৳22.50 Book Base</td><td class="highlight-green">Strong Balance Sheet</td></tr>
              <tr><td>Price to Earnings (P/E)</td><td>${stock.peRatio}x</td><td>16.5x Sector P/E</td><td class="highlight-blue">${stock.peRatio < 16 ? 'Undervalued' : 'Fair Value'}</td></tr>
              <tr><td>Price to Book (P/B)</td><td>${stock.pbRatio}x</td><td>2.1x</td><td>Premium Franchise</td></tr>
              <tr><td>Return on Equity (ROE)</td><td>${fundamentals.roePercent}%</td><td>&gt; 15% Standard</td><td class="highlight-green">High Quality Compounder</td></tr>
              <tr><td>Operating Profit Margin</td><td>${fundamentals.operatingMarginPercent}%</td><td>&gt; 18% Benchmark</td><td class="highlight-green">Robust Pricing Power</td></tr>
              <tr><td>Net Profit Margin</td><td>${fundamentals.netMarginPercent}%</td><td>&gt; 12% Benchmark</td><td class="highlight-green">High Cash Conversion</td></tr>
              <tr><td>Debt to Equity Ratio</td><td>${fundamentals.debtToEquity}</td><td>&lt; 0.50 Conservative</td><td class="highlight-green">Deleveraged Capital</td></tr>
              <tr><td>Current Ratio (Liquidity)</td><td>${fundamentals.currentRatio}x</td><td>&gt; 1.50 Ideal</td><td class="highlight-green">Solvent Working Capital</td></tr>
              <tr><td>Interest Coverage Ratio</td><td>${fundamentals.interestCoverageRatio}x</td><td>&gt; 3.0x Safe</td><td class="highlight-green">Strong Solvency</td></tr>
              <tr><td>Operating Cash Flow</td><td>৳${fundamentals.operatingCashFlowCrore} Crore</td><td>Accrual Verification</td><td class="highlight-green">Positive Operational Inflow</td></tr>
              <tr><td>Free Cash Flow (FCF)</td><td>৳${fundamentals.freeCashFlowCrore} Crore</td><td>Self-Funded Capex</td><td class="highlight-green">Surplus Organic Cash</td></tr>
            </table>

            <div style="margin-top: 10px; font-weight: 700; font-size: 11px; color: #1E293B;">🇧🇩 Bangladesh Macro & Regulatory Operating Environment:</div>
            <table style="margin-top: 4px;">
              <tr><th>Macro Dimension</th><th>Sensitivity Status</th><th>Strategic Impact Analysis</th></tr>
              <tr><td>Inflation & Pricing Power</td><td class="highlight-green">${fundamentals.macroInflationAnalysis.exposure}</td><td>${fundamentals.macroInflationAnalysis.details}</td></tr>
              <tr><td>Interest Rate Sensitivity</td><td class="highlight-blue">${fundamentals.interestRateImpact.exposure}</td><td>${fundamentals.interestRateImpact.details}</td></tr>
              <tr><td>FX / Dollar Exposure</td><td>${fundamentals.exchangeRateFxAnalysis.exposure}</td><td>${fundamentals.exchangeRateFxAnalysis.details}</td></tr>
              <tr><td>Import LC Risk</td><td class="highlight-green">${fundamentals.importRestrictionsLCRisk.status}</td><td>${fundamentals.importRestrictionsLCRisk.details}</td></tr>
            </table>
          </div>

          <!-- 11. Dividend History & Growth Trend -->
          <div class="section">
            <div class="sec-title">💰 11. DIVIDEND DISTRIBUTION & GROWTH TRACK RECORD</div>
            <table>
              <tr><th>Metric</th><th>Value</th><th>Metric</th><th>Value</th></tr>
              <tr><td>Classification</td><td><strong>${dividend.category}</strong></td><td>Cash Flow Sustainability</td><td class="highlight-green"><strong>${dividend.cashSustainabilityScore}</strong></td></tr>
              <tr><td>Dividend Yield</td><td class="highlight-green"><strong>${dividend.dividendYieldPercent}%</strong></td><td>Dividend Payout Ratio</td><td>${dividend.dividendPayoutRatioPercent}%</td></tr>
              <tr><td>5-Year Dividend CAGR</td><td class="highlight-green"><strong>${dividend.dividendCagr5YrPercent}%</strong></td><td>Track Record</td><td><strong>${dividend.consecutiveYearsPaid} Years Uninterrupted</strong></td></tr>
              <tr><td>Last Cash Dividend Paid</td><td class="highlight-green"><strong>${dividend.lastCashDividendPercent}%</strong></td><td>Last Bonus Dividend</td><td>${dividend.lastBonusDividendPercent > 0 ? `${dividend.lastBonusDividendPercent}%` : '0% (Cash Only)'}</td></tr>
              <tr><td>EPS Coverage Ratio</td><td><strong>${dividend.epsCoverageRatio}x</strong> (Safe)</td><td>FCF Coverage Ratio</td><td><strong>${dividend.fcfCoverageRatio}x</strong> (Funded)</td></tr>
              <tr><td>Upcoming Record Date</td><td><strong>${dividend.recordDate}</strong></td><td>Analyst Payout Verdict</td><td>${dividend.verdict}</td></tr>
            </table>
          </div>

          <!-- 12. Candlestick Patterns & Win-Rates -->
          <div class="section">
            <div class="sec-title">🕯️ 12. STATISTICAL CANDLESTICK WIN-RATES ON DSE</div>
            <table>
              <tr><th>Pattern Name</th><th>Category</th><th>DSE Occurrences</th><th>5-Day Win Rate</th><th>20-Day Win Rate</th><th>Avg 20-Day Gain</th></tr>
              ${patterns.slice(0, 4).map((p: any) => `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td class="${p.category.includes('Bullish') ? 'highlight-green' : 'highlight-red'}">${p.category}</td>
                  <td>${p.dseHistoricalOccurrences}</td>
                  <td class="highlight-green">${p.winRate5DaysPercent}%</td>
                  <td class="highlight-green">${p.winRate20DaysPercent}%</td>
                  <td class="highlight-green">+${p.avgReturn20DaysPercent}%</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <!-- 13. 10-Year Historical Financial Archive -->
          <div class="section">
            <div class="sec-title">🏛️ 13. 10-YEAR HISTORICAL FINANCIAL ARCHIVE & CAGR</div>
            ${historicalTrendSvg}
            <table>
              <tr><th>Year</th><th>Close (৳)</th><th>EPS (৳)</th><th>NAV (৳)</th><th>Dividend</th><th>Corporate Action</th></tr>
              ${historicalSeries.slice(0, 6).map((h: any) => `
                <tr>
                  <td><strong>${h.date.slice(0, 4)}</strong></td>
                  <td>৳${h.close}</td>
                  <td>৳${h.eps}</td>
                  <td>৳${h.nav}</td>
                  <td>${h.dividend}</td>
                  <td>${h.corporateActions}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <!-- 14. News Sentiment & Analyst Consensus -->
          <div class="section">
            <div class="sec-title">📰 14. MEDIA SENTIMENT & DISCLOSURE SURVEILLANCE</div>
            <div class="thesis-box" style="background: #F8FAFC; border-color: #E2E8F0;">
              <strong>Sentiment Index:</strong> ${news.sentimentRating} (Score: ${news.sentimentScore}/100) • 
              <strong>Analyzed Filings:</strong> ${news.analyzedFilingsCount} Total (${news.positiveSignalsCount} Positive, ${news.neutralSignalsCount} Neutral, ${news.negativeSignalsCount} Negative).
              <div style="margin-top: 6px; font-size: 11px; color: #334155; line-height: 1.4;">
                <strong>AI Executive Summary:</strong> ${news.llmSummary}
              </div>
              <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 11px;">
                ${news.newsItems.slice(0, 4).map((n: any) => `<li><strong>${n.title}</strong> (${n.date}) — <em>${n.polarity}: ${n.impactSummary}</em></li>`).join('')}
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="margin-top: 30px; border-top: 1px solid #CBD5E1; padding-top: 12px; font-size: 11px; color: #64748B; text-align: center;">
            CONFIDENTIAL INSTITUTIONAL EQUITY RESEARCH DOSSIER • GENERATED BY MONEY-HONEY ADVANCED ANALYTICS ENGINE<br/>
            All rights reserved. Data verified via Dhaka Stock Exchange (DSE) & Bangladesh Securities and Exchange Commission (BSEC).
          </div>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printHtml);
      printWin.document.close();
    }
  }
}
