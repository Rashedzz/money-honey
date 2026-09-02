import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import { StockHolding } from '../../finance/stocks';
import {
  DSE_INDICES,
  DSE_MARKET_REGIME,
  DSE_SECTOR_PERFORMANCE,
  DSE_CANDLESTICK_STATS,
  DSE_STOCK_UNIVERSE,
  DseStockItem,
} from '../../finance/bdStockIntelligence';
import {
  generateOptimizedPortfolio,
  OptimizedPortfolioResult,
} from '../../finance/aiPortfolioOptimizer';
import {
  getStoredPaperPortfolio,
  saveStoredPaperPortfolio,
  buyPaperStock,
  sellPaperStock,
  resetPaperPortfolio,
  PaperPortfolioState,
} from '../../finance/paperTrading';
import {
  HistoricalTimeframe,
  calculateTimeframeAnalytics,
  DSE_HISTORICAL_DATABASE,
  generate10YearHistoricalSeries,
} from '../../finance/dseHistoricalDatabase';
import { generateTechnicalIndicators } from '../../finance/technicalAnalysisEngine';
import { generateFundamentalDossier } from '../../finance/fundamentalAnalysisEngine';
import { getCompanyCandlestickPatterns } from '../../finance/candlestickPatternEngine';
import { calculateDetailedDCF } from '../../finance/dcfValuationEngine';
import { getDividendProfileForStock } from '../../finance/dividendAnalysisEngine';
import { generate5ModelAiEnsemble } from '../../finance/aiMultiModelEnsemble';
import { BACKTEST_STRATEGIES, getBacktestStrategy } from '../../finance/backtestEngine';

interface StockMarketScreenProps {
  stocks: StockHolding[];
  onAddStockPress: () => void;
  onDeleteStock: (id: string) => void;
  onUpdatePrice: (id: string, newPrice: number) => void;
}

type MainTabType = 'ai_intelligence' | 'screener' | 'portfolio_optimizer' | 'backtest' | 'paper_trading' | 'my_holdings';

export const StockMarketScreen: React.FC<StockMarketScreenProps> = ({
  stocks,
  onAddStockPress,
  onDeleteStock,
  onUpdatePrice,
}) => {
  const [activeTab, setActiveTab] = useState<MainTabType>('ai_intelligence');

  // Screener Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [valuationFilter, setValuationFilter] = useState<
    'All' | '🏆 Best Dividend Stocks' | '🚀 Best Growth Stocks' | '🟢 Undervalued (DCF)' | 'Low PE'
  >('All');

  // Deep-Dive Modal
  const [selectedStock, setSelectedStock] = useState<DseStockItem | null>(null);
  const [histTimeframe, setHistTimeframe] = useState<HistoricalTimeframe>('1Y');
  const [modalSubTab, setModalSubTab] = useState<
    'ai_models' | 'dcf_waterfall' | 'dividends' | 'technical' | 'patterns' | 'fundamentals' | 'historical'
  >('ai_models');

  // Backtest Strategy State
  const [selectedBacktestStrategy, setSelectedBacktestStrategy] = useState<string>('multi_factor_ai');

  // Portfolio Optimizer State
  const [optCapital, setOptCapital] = useState('1000000');
  const [optHorizon, setOptHorizon] = useState<'3 Months' | '6 Months' | '1 Year' | '3 Years' | '5 Years'>('3 Years');
  const [optRisk, setOptRisk] = useState<'Conservative' | 'Moderate' | 'Aggressive'>('Moderate');
  const [optObjective, setOptObjective] = useState<'Capital Growth' | 'High Dividend Yield' | 'Balanced Total Return'>('Balanced Total Return');
  const [optimizerResult, setOptimizerResult] = useState<OptimizedPortfolioResult | null>(() =>
    generateOptimizedPortfolio(1000000, '3 Years', 'Moderate', 'Balanced Total Return')
  );

  // Paper Trading State
  const [paperState, setPaperState] = useState<PaperPortfolioState>(() => getStoredPaperPortfolio());
  const [paperBuyModalStock, setPaperBuyModalStock] = useState<DseStockItem | null>(null);
  const [paperBuyShares, setPaperBuyShares] = useState('500');

  // Real Holdings Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPriceInput, setEditPriceInput] = useState('');

  // Screener filter logic
  const filteredStocks = DSE_STOCK_UNIVERSE.filter((s) => {
    const matchesSearch =
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = sectorFilter === 'All' || s.sector === sectorFilter;
    let matchesVal = true;
    if (valuationFilter === '🏆 Best Dividend Stocks') {
      matchesVal = s.dividendYieldPercent >= 5.0 && s.operatingMarginPercent >= 20;
    } else if (valuationFilter === '🚀 Best Growth Stocks') {
      matchesVal = s.eps >= 5 && s.roePercent >= 16;
    } else if (valuationFilter === '🟢 Undervalued (DCF)') {
      matchesVal = s.marginOfSafetyPercent >= 15;
    } else if (valuationFilter === 'Low PE') {
      matchesVal = s.peRatio <= 12;
    }

    return matchesSearch && matchesSector && matchesVal;
  });

  // Calculate Real Holdings totals
  let totalInvested = 0;
  let totalCurrentValue = 0;
  for (const s of stocks) {
    totalInvested += s.quantity * s.buyPrice;
    totalCurrentValue += s.quantity * s.currentPrice;
  }
  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalGainLossPct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
  const isProfitable = totalGainLoss >= 0;

  // Paper Trading Portfolio totals
  const paperStockValue = paperState.positions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
  const paperTotalNetWorth = paperState.cashBalance + paperStockValue;
  const paperTotalReturn = paperTotalNetWorth - paperState.startingCapital;
  const paperReturnPct = (paperTotalReturn / paperState.startingCapital) * 100;

  const handleRunOptimizer = () => {
    const cap = parseFloat(optCapital.replace(/,/g, '')) || 1000000;
    const res = generateOptimizedPortfolio(cap, optHorizon, optRisk, optObjective);
    setOptimizerResult(res);
  };

  const handleExecutePaperBuy = () => {
    if (!paperBuyModalStock) return;
    const count = parseInt(paperBuyShares, 10);
    if (!count || count <= 0) {
      Alert.alert('Error', 'Please enter a valid share quantity.');
      return;
    }

    const res = buyPaperStock(
      paperState,
      paperBuyModalStock.symbol,
      paperBuyModalStock.companyName,
      paperBuyModalStock.ltp,
      count,
      paperBuyModalStock.ensembleTargetPrice,
      paperBuyModalStock.supportLevel
    );

    if (res.success) {
      setPaperState(res.updated);
      setPaperBuyModalStock(null);
      Alert.alert(
        'Virtual Order Executed',
        `Bought ${count} shares of ${paperBuyModalStock.symbol} at ৳${paperBuyModalStock.ltp}. Recorded in your Paper Trading portfolio!`
      );
    } else {
      Alert.alert('Trade Failed', res.error || 'Insufficient virtual funds.');
    }
  };

  const handleExecutePaperSell = (posId: string, currentPrice: number) => {
    const res = sellPaperStock(paperState, posId, currentPrice);
    if (res.success) {
      setPaperState(res.updated);
      Alert.alert('Position Closed', 'Virtual shares sold and cash credited to virtual balance.');
    }
  };

  const handleResetPaper = () => {
    Alert.alert('Reset Simulator', 'Reset paper trading portfolio back to ৳10,00,000 virtual cash?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => setPaperState(resetPaperPortfolio()),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Live Bangladesh Market Header Bar (DSEX, DS30, DSES & Regime) */}
      <GlassCard style={styles.marketTickerCard} padding={16} glowColor="#0284C7">
        <View style={styles.tickerRow}>
          {DSE_INDICES.map((idx) => {
            const isUp = idx.change >= 0;
            return (
              <View key={idx.name} style={styles.indexItem}>
                <Text style={styles.indexName}>{idx.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={styles.indexVal}>{idx.value.toLocaleString()}</Text>
                  <Text style={[styles.indexChange, { color: isUp ? '#16A34A' : '#EF4444' }]}>
                    {isUp ? '▲ +' : '▼ '}{idx.changePercent}%
                  </Text>
                </View>
                <Text style={styles.turnoverSub}>Turnover: ৳{idx.turnoverCrore} Cr</Text>
              </View>
            );
          })}

          <View style={styles.regimeBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.regimeIndicatorDot} />
              <Text style={styles.regimeTitle}>MARKET REGIME: {DSE_MARKET_REGIME.regime.toUpperCase()}</Text>
            </View>
            <Text style={styles.regimeSub}>
              Breadth: {DSE_MARKET_REGIME.advances} Adv / {DSE_MARKET_REGIME.declines} Dec • Flow: {DSE_MARKET_REGIME.institutionalFlow}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* 2. Platform Navigation Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.platformTabs}>
          {[
            { id: 'ai_intelligence', label: '🧠 AI Intelligence & Top Picks' },
            { id: 'screener', label: '📊 DSE Stock Screener' },
            { id: 'portfolio_optimizer', label: '💼 AI Portfolio Optimizer' },
            { id: 'backtest', label: '🔬 Patterns & Backtesting' },
            { id: 'paper_trading', label: '🎮 Virtual Paper Trading' },
            { id: 'my_holdings', label: '📈 My Real Holdings' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.platformTabBtn, activeTab === tab.id && styles.platformTabBtnActive]}
              onPress={() => setActiveTab(tab.id as any)}
              activeOpacity={0.8}
            >
              <Text style={[styles.platformTabText, activeTab === tab.id && styles.platformTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* TAB 1: AI INTELLIGENCE & TOP PICKS */}
      {activeTab === 'ai_intelligence' && (
        <View style={{ gap: Spacing.md }}>
          {/* Hero "Find Best Investments" Scanner Banner */}
          <GlassCard style={styles.heroBanner} padding={20} glowColor="#16A34A">
            <View style={styles.heroBannerRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 24 }}>🔍</Text>
                  <Text style={styles.heroTitle}>AI STOCK SELECTION & RANKING ENGINE</Text>
                </View>
                <Text style={styles.heroDesc}>
                  The AI continuously evaluates DSE equities across 8 dimensions: Fundamentals, DCF Valuation, Technical Momentum, Earnings Growth, and Accounting Integrity.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.scanBtn}
                onPress={() => setActiveTab('screener')}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.scanBtnText}>Scan Entire DSE Market</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Top 4 AI Recommendations Cards */}
          <Text style={styles.sectionHeading}>🏆 TOP AI PICKS (CONFIDENCE SCORED & EXPLAINABLE)</Text>
          <View style={styles.picksGrid}>
            {DSE_STOCK_UNIVERSE.slice(0, 4).map((stock) => (
              <TouchableOpacity
                key={stock.symbol}
                style={styles.pickCardWrapper}
                onPress={() => setSelectedStock(stock)}
                activeOpacity={0.85}
              >
                <GlassCard style={styles.pickCard} padding={16} glowColor="#16A34A">
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.pickSymbol}>{stock.symbol}</Text>
                        <View style={styles.strongBuyPill}>
                          <Text style={styles.strongBuyText}>{stock.recommendation}</Text>
                        </View>
                      </View>
                      <Text style={styles.pickName} numberOfLines={1}>{stock.companyName}</Text>
                    </View>

                    <View style={styles.scoreCircle}>
                      <Text style={styles.scoreNum}>{stock.totalAiScore}</Text>
                      <Text style={styles.scoreLabel}>AI SCORE</Text>
                    </View>
                  </View>

                  <View style={styles.pickMetricsRow}>
                    <View>
                      <Text style={styles.pickMuted}>LTP</Text>
                      <Text style={styles.pickPrice}>৳{stock.ltp}</Text>
                    </View>
                    <View>
                      <Text style={styles.pickMuted}>DCF FAIR VALUE</Text>
                      <Text style={[styles.pickPrice, { color: '#0284C7' }]}>৳{stock.dcfIntrinsicValue}</Text>
                    </View>
                    <View>
                      <Text style={styles.pickMuted}>POTENTIAL UPSIDE</Text>
                      <Text style={[styles.pickPrice, { color: '#16A34A' }]}>+{stock.potentialUpsidePercent}%</Text>
                    </View>
                    <View>
                      <Text style={styles.pickMuted}>DIV YIELD</Text>
                      <Text style={[styles.pickPrice, { color: '#F59E0B' }]}>{stock.dividendYieldPercent}%</Text>
                    </View>
                  </View>

                  <Text style={styles.pickThesis} numberOfLines={2}>
                    💡 {stock.aiInvestmentThesis}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sector Heatmap & Performance */}
          <GlassCard style={styles.sectorCard} padding={18} glowColor="#0284C7">
            <Text style={styles.sectionHeading}>📊 DSE SECTOR PERFORMANCE & TURNOVER SHARE</Text>
            <View style={styles.sectorGrid}>
              {DSE_SECTOR_PERFORMANCE.map((sec) => {
                const isPos = sec.changePercent >= 0;
                return (
                  <View key={sec.sector} style={styles.sectorItem}>
                    <Text style={styles.sectorName}>{sec.sector}</Text>
                    <Text style={[styles.sectorChange, { color: isPos ? '#16A34A' : '#EF4444' }]}>
                      {isPos ? '+' : ''}{sec.changePercent}%
                    </Text>
                    <Text style={styles.sectorTurnover}>{sec.turnoverSharePercent}% Market Turnover</Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>
        </View>
      )}

      {/* TAB 2: DSE STOCK SCREENER */}
      {activeTab === 'screener' && (
        <View style={{ gap: Spacing.md }}>
          {/* Search & Filter Controls */}
          <GlassCard style={{ width: '100%' }} padding={16}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Ticker or Name (e.g. GP, Square, BRAC, BATBC)..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Filter Pills */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {(['All', '🏆 Best Dividend Stocks', '🚀 Best Growth Stocks', '🟢 Undervalued (DCF)', 'Low PE'] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.miniFilterPill, valuationFilter === v && styles.miniFilterPillActive]}
                  onPress={() => setValuationFilter(v)}
                >
                  <Text style={[styles.miniFilterText, valuationFilter === v && styles.miniFilterTextActive]}>
                    {v === 'All' ? 'All Equities' : v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          {/* Stock List Cards */}
          <Text style={styles.sectionHeading}>
            MATCHING DSE EQUITIES ({filteredStocks.length} STOCKS)
          </Text>

          <View style={{ gap: 10 }}>
            {filteredStocks.map((stock) => (
              <TouchableOpacity
                key={stock.symbol}
                onPress={() => setSelectedStock(stock)}
                activeOpacity={0.8}
              >
                <GlassCard style={{ width: '100%' }} padding={16} glowColor="#0284C7">
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={styles.stockIconBox}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#0284C7' }}>
                          {stock.symbol.slice(0, 2)}
                        </Text>
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>
                            {stock.symbol}
                          </Text>
                          <View style={[styles.recBadge, stock.recommendation.includes('BUY') ? styles.recBadgeBuy : styles.recBadgeHold]}>
                            <Text style={styles.recBadgeText}>{stock.recommendation}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 12, color: '#64748B' }}>{stock.companyName} • {stock.sector}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>৳{stock.ltp}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: stock.change >= 0 ? '#16A34A' : '#EF4444' }}>
                          {stock.change >= 0 ? '+' : ''}{stock.changePercent}%
                        </Text>
                      </View>

                      <View style={styles.scorePillSmall}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }}>{stock.totalAiScore}</Text>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#E2E8F0' }}>SCORE</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.quickBuyBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          setPaperBuyModalStock(stock);
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>+ Paper Buy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Quick Ratio Row */}
                  <View style={styles.screenerRatioRow}>
                    <Text style={styles.ratioItem}>P/E: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{stock.peRatio}x</Text></Text>
                    <Text style={styles.ratioItem}>EPS: <Text style={{ fontWeight: '800', color: '#0F172A' }}>৳{stock.eps}</Text></Text>
                    <Text style={styles.ratioItem}>ROE: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{stock.roePercent}%</Text></Text>
                    <Text style={styles.ratioItem}>Div Yield: <Text style={{ fontWeight: '800', color: '#16A34A' }}>{stock.dividendYieldPercent}%</Text></Text>
                    <Text style={styles.ratioItem}>DCF Value: <Text style={{ fontWeight: '800', color: '#0284C7' }}>৳{stock.dcfIntrinsicValue}</Text></Text>
                    <Text style={styles.ratioItem}>Upside: <Text style={{ fontWeight: '800', color: '#16A34A' }}>+{stock.potentialUpsidePercent}%</Text></Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* TAB 3: AI PORTFOLIO OPTIMIZER */}
      {activeTab === 'portfolio_optimizer' && (
        <View style={{ gap: Spacing.md }}>
          <GlassCard style={{ width: '100%' }} padding={20} glowColor="#16A34A">
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 4 }}>
              🧠 PERSONALIZED BANGLADESH AI PORTFOLIO GENERATOR
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: Spacing.md }}>
              Input your target investment capital, horizon, and risk tolerance. The AI generates an optimal asset allocation with expected CAGR return, dividend yield, and Sharpe ratio.
            </Text>

            <View style={styles.optControlsRow}>
              <View style={styles.optCol}>
                <Text style={styles.inputLabel}>INVESTMENT CAPITAL (৳) *</Text>
                <TextInput
                  style={styles.input}
                  value={optCapital}
                  onChangeText={setOptCapital}
                  keyboardType="numeric"
                  placeholder="e.g. 1000000"
                />
              </View>

              <View style={styles.optCol}>
                <Text style={styles.inputLabel}>INVESTMENT HORIZON</Text>
                <View style={styles.optPillRow}>
                  {(['6 Months', '1 Year', '3 Years', '5 Years'] as const).map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.optPill, optHorizon === h && styles.optPillActive]}
                      onPress={() => setOptHorizon(h)}
                    >
                      <Text style={[styles.optPillText, optHorizon === h && styles.optPillTextActive]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.optControlsRow}>
              <View style={styles.optCol}>
                <Text style={styles.inputLabel}>RISK TOLERANCE</Text>
                <View style={styles.optPillRow}>
                  {(['Conservative', 'Moderate', 'Aggressive'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.optPill, optRisk === r && styles.optPillActive]}
                      onPress={() => setOptRisk(r)}
                    >
                      <Text style={[styles.optPillText, optRisk === r && styles.optPillTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.optCol}>
                <Text style={styles.inputLabel}>INVESTMENT OBJECTIVE</Text>
                <View style={styles.optPillRow}>
                  {(['Capital Growth', 'High Dividend Yield', 'Balanced Total Return'] as const).map((o) => (
                    <TouchableOpacity
                      key={o}
                      style={[styles.optPill, optObjective === o && styles.optPillActive]}
                      onPress={() => setOptObjective(o)}
                    >
                      <Text style={[styles.optPillText, optObjective === o && styles.optPillTextActive]}>{o}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.runOptBtn} onPress={handleRunOptimizer} activeOpacity={0.85}>
              <Ionicons name="flash" size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>
                Run AI Portfolio Optimization
              </Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Optimizer Results View */}
          {optimizerResult && (
            <GlassCard style={{ width: '100%' }} padding={20} glowColor="#0284C7">
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#0369A1', marginBottom: 8 }}>
                RECOMMENDED PORTFOLIO ALLOCATION
              </Text>
              <Text style={{ fontSize: 13, color: '#334155', lineHeight: 18, marginBottom: Spacing.md }}>
                {optimizerResult.executiveSummary}
              </Text>

              {/* KPI Grid */}
              <View style={styles.kpiGrid}>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>EXPECTED ANNUAL CAGR</Text>
                  <Text style={[styles.kpiVal, { color: '#16A34A' }]}>+{optimizerResult.expectedAnnualReturnPercent}%</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>ANNUAL DIVIDEND YIELD</Text>
                  <Text style={[styles.kpiVal, { color: '#F59E0B' }]}>
                    ৳{optimizerResult.expectedAnnualDividendIncome.toLocaleString('en-IN')} ({optimizerResult.portfolioDividendYieldPercent}%)
                  </Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>SHARPE RATIO</Text>
                  <Text style={styles.kpiVal}>{optimizerResult.sharpeRatio}</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>MAX HISTORICAL DRAWDOWN</Text>
                  <Text style={[styles.kpiVal, { color: '#EF4444' }]}>-{optimizerResult.maxDrawdownPercent}%</Text>
                </View>
              </View>

              {/* Allocations Table */}
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 1 }]}>EQUITY</Text>
                  <Text style={[styles.th, { width: 60 }]}>WEIGHT</Text>
                  <Text style={[styles.th, { flex: 1 }]}>ALLOCATION (৳)</Text>
                  <Text style={[styles.th, { flex: 1 }]}>SHARES TO BUY</Text>
                  <Text style={[styles.th, { flex: 1 }]}>TARGET UPSIDE</Text>
                </View>

                {optimizerResult.stockAllocations.map((item) => (
                  <View key={item.symbol} style={styles.tableRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13 }}>{item.symbol}</Text>
                      <Text style={{ fontSize: 11, color: '#64748B' }}>{item.sector}</Text>
                    </View>
                    <Text style={[styles.td, { width: 60, fontWeight: '800' }]}>{item.weightPercent}%</Text>
                    <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>৳{Math.round(item.allocatedAmount).toLocaleString('en-IN')}</Text>
                    <Text style={[styles.td, { flex: 1 }]}>{item.sharesToBuy.toLocaleString()} shares</Text>
                    <Text style={[styles.td, { flex: 1, fontWeight: '800', color: '#16A34A' }]}>+{item.expectedReturnPercent}%</Text>
                  </View>
                ))}

                <View style={[styles.tableRow, { backgroundColor: '#F0F9FF' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: '#0284C7' }}>Liquid Cash Reserves</Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>Buffer for dips</Text>
                  </View>
                  <Text style={[styles.td, { width: 60, fontWeight: '800' }]}>{optimizerResult.cashReservePercent}%</Text>
                  <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>৳{Math.round(optimizerResult.cashReserveAmount).toLocaleString('en-IN')}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>Liquid Reserves</Text>
                  <Text style={[styles.td, { flex: 1, color: '#64748B' }]}>Risk buffer</Text>
                </View>
              </View>
            </GlassCard>
          )}
        </View>
      )}

      {/* TAB 4: PATTERNS & BACKTESTING */}
      {activeTab === 'backtest' && (
        <View style={{ gap: Spacing.md }}>
          <GlassCard style={{ width: '100%' }} padding={20} glowColor="#F59E0B">
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 4 }}>
              🔬 HISTORICAL CANDLESTICK PATTERN MINING ON DSE
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: Spacing.md }}>
              Rather than blindly trusting candlestick theory, our engine analyzes thousands of historical DSE occurrences to measure true empirical success rates.
            </Text>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 1.5 }]}>PATTERN NAME</Text>
                <Text style={[styles.th, { width: 80 }]}>OCCURRENCES</Text>
                <Text style={[styles.th, { width: 80 }]}>5-DAY WIN%</Text>
                <Text style={[styles.th, { width: 80 }]}>20-DAY WIN%</Text>
                <Text style={[styles.th, { width: 90 }]}>AVG 20D RETURN</Text>
                <Text style={[styles.th, { flex: 1 }]}>CURRENT DSE MATCHES</Text>
              </View>

              {DSE_CANDLESTICK_STATS.map((pat) => (
                <View key={pat.patternName} style={styles.tableRow}>
                  <Text style={[styles.td, { flex: 1.5, fontWeight: '800' }]}>{pat.patternName}</Text>
                  <Text style={[styles.td, { width: 80 }]}>{pat.historicalOccurrencesDSE.toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 80, fontWeight: '800', color: '#16A34A' }]}>{pat.winRateNext5Days}%</Text>
                  <Text style={[styles.td, { width: 80, fontWeight: '800', color: '#16A34A' }]}>{pat.winRateNext20Days}%</Text>
                  <Text style={[styles.td, { width: 90, fontWeight: '800', color: '#16A34A' }]}>+{pat.avgReturnNext20Days}%</Text>
                  <View style={{ flex: 1, flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                    {pat.currentMatches.map((sym) => (
                      <View key={sym} style={styles.symBadge}>
                        <Text style={styles.symBadgeText}>{sym}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Multi-Factor Strategy Backtest Summary & Comparison */}
          {(() => {
            const bt = getBacktestStrategy(selectedBacktestStrategy);
            return (
              <GlassCard style={{ width: '100%' }} padding={20} glowColor="#16A34A">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                      📈 10-YEAR STRATEGY BACKTESTING ENGINE (2016 – 2026)
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      Empirical evidence: Testing whether multi-factor signals actually beat the market historically on DSE
                    </Text>
                  </View>
                </View>

                {/* Strategy Selector Pills */}
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {[
                    { id: 'multi_factor_ai', label: 'RSI + MACD + EPS + DCF' },
                    { id: 'deep_value_dcf', label: 'Pure Deep Value (P/E < 10)' },
                    { id: 'momentum_breakout', label: 'Momentum Breakout (52W High)' },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.optPill, selectedBacktestStrategy === s.id && styles.optPillActive]}
                      onPress={() => setSelectedBacktestStrategy(s.id)}
                    >
                      <Text style={[styles.optPillText, selectedBacktestStrategy === s.id && styles.optPillTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Strategy Rules Banner */}
                <View style={[styles.thesisBox, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', marginBottom: Spacing.md }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#0369A1' }}>STRATEGY: {bt.strategyName.toUpperCase()}</Text>
                  <Text style={{ fontSize: 12, color: '#0F172A', marginTop: 3 }}>{bt.rulesSummary}</Text>
                </View>

                {/* KPI Grid */}
                <View style={styles.kpiGrid}>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>TOTAL SIMULATED TRADES</Text>
                    <Text style={styles.kpiVal}>{bt.totalTrades} Trades</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>WIN RATE %</Text>
                    <Text style={[styles.kpiVal, { color: '#16A34A' }]}>{bt.winRatePercent}%</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>AVG WINNING TRADE</Text>
                    <Text style={[styles.kpiVal, { color: '#16A34A' }]}>+{bt.avgWinningTradePercent}%</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>AVG LOSING TRADE</Text>
                    <Text style={[styles.kpiVal, { color: '#EF4444' }]}>{bt.avgLosingTradePercent}%</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>MAX HISTORICAL DRAWDOWN</Text>
                    <Text style={[styles.kpiVal, { color: '#EF4444' }]}>-{bt.maxDrawdownPercent}%</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>SHARPE RATIO (SORTINO)</Text>
                    <Text style={styles.kpiVal}>{bt.sharpeRatio} ({bt.sortinoRatio})</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>STRATEGY 10-YR RETURN</Text>
                    <Text style={[styles.kpiVal, { color: '#16A34A' }]}>+{bt.strategyTotalReturnPercent}% ({bt.strategyCagrPercent}% CAGR)</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>DSEX BENCHMARK RETURN</Text>
                    <Text style={styles.kpiVal}>+{bt.dsexBenchmarkReturnPercent}% (Alpha: +{bt.alphaGeneratedPercent}%)</Text>
                  </View>
                </View>

                {/* Historical Simulated Trades Ledger */}
                <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
                  📜 SAMPLE BACKTEST EXECUTIONS & PROVEN OUTCOMES
                </Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { width: 80 }]}>SYMBOL</Text>
                    <Text style={[styles.th, { width: 85 }]}>ENTRY DATE</Text>
                    <Text style={[styles.th, { width: 85 }]}>EXIT DATE</Text>
                    <Text style={[styles.th, { width: 70 }]}>RETURN</Text>
                    <Text style={[styles.th, { width: 65 }]}>DAYS</Text>
                    <Text style={[styles.th, { flex: 1 }]}>TRIGGER & EXIT REASON</Text>
                  </View>

                  {bt.tradesLedger.map((tr) => (
                    <View key={tr.tradeId} style={styles.tableRow}>
                      <Text style={[styles.td, { width: 80, fontWeight: '800' }]}>{tr.symbol}</Text>
                      <Text style={[styles.td, { width: 85, fontSize: 11 }]}>{tr.entryDate}</Text>
                      <Text style={[styles.td, { width: 85, fontSize: 11 }]}>{tr.exitDate}</Text>
                      <Text style={[styles.td, { width: 70, fontWeight: '900', color: tr.returnPercent >= 0 ? '#16A34A' : '#EF4444' }]}>
                        {tr.returnPercent >= 0 ? '+' : ''}{tr.returnPercent}%
                      </Text>
                      <Text style={[styles.td, { width: 65, fontSize: 11 }]}>{tr.holdingDays}d</Text>
                      <Text style={[styles.td, { flex: 1, fontSize: 11, color: '#64748B' }]}>
                        {tr.entryTrigger} → {tr.exitReason}
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            );
          })()}
        </View>
      )}

      {/* TAB 5: VIRTUAL PAPER TRADING SIMULATOR */}
      {activeTab === 'paper_trading' && (
        <View style={{ gap: Spacing.md }}>
          <GlassCard style={{ width: '100%' }} padding={20} glowColor="#16A34A">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <View>
                <Text style={styles.summaryLabel}>ZERO-RISK VIRTUAL PAPER TRADING PORTFOLIO</Text>
                <Text style={styles.summaryAmount}>৳{paperTotalNetWorth.toLocaleString('en-IN')}</Text>
                <Text style={styles.summarySub}>
                  Virtual Cash: ৳{paperState.cashBalance.toLocaleString('en-IN')} • Equity Holdings: ৳{paperStockValue.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.resetBtn} onPress={handleResetPaper}>
                  <Ionicons name="refresh" size={16} color="#64748B" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>Reset ৳10L</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setActiveTab('screener')}
                >
                  <Ionicons name="cart" size={16} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>+ Buy Virtual Stock</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Performance Pill */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: Spacing.md }}>
              <View style={[styles.paperPerfPill, paperTotalReturn >= 0 ? styles.perfPos : styles.perfNeg]}>
                <Text style={[styles.paperPerfText, { color: paperTotalReturn >= 0 ? '#16A34A' : '#EF4444' }]}>
                  {paperTotalReturn >= 0 ? '▲ +' : '▼ −'}৳{Math.abs(paperTotalReturn).toLocaleString('en-IN')} ({paperReturnPct.toFixed(2)}%)
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#64748B' }}>
                Benchmark: DSEX (+0.46% today) • Practice investing with real prices without risking money.
              </Text>
            </View>
          </GlassCard>

          {/* Active Virtual Positions */}
          <Text style={styles.sectionHeading}>ACTIVE VIRTUAL POSITIONS ({paperState.positions.length})</Text>

          {paperState.positions.length === 0 ? (
            <GlassCard style={{ alignItems: 'center', padding: 32 }} padding={32}>
              <Ionicons name="game-controller-outline" size={44} color="#0284C7" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 8 }}>
                No Active Virtual Positions
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
                Switch to the "DSE Stock Screener" or "AI Intelligence" tab and tap "+ Paper Buy" to execute your first virtual trade!
              </Text>
            </GlassCard>
          ) : (
            <View style={{ gap: 10 }}>
              {paperState.positions.map((pos) => {
                const curVal = pos.shares * pos.currentPrice;
                const costVal = pos.shares * pos.buyPrice;
                const pnl = curVal - costVal;
                const pnlPct = (pnl / costVal) * 100;
                const isWin = pnl >= 0;

                return (
                  <GlassCard key={pos.id} style={{ width: '100%' }} padding={16} glowColor={isWin ? Colors.success : Colors.danger}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <View>
                        <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>{pos.symbol}</Text>
                        <Text style={{ fontSize: 12, color: '#64748B' }}>
                          {pos.shares} shares @ ৳{pos.buyPrice.toFixed(1)} • Current: ৳{pos.currentPrice}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
                          ৳{curVal.toLocaleString('en-IN')}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: isWin ? '#16A34A' : '#EF4444' }}>
                          {isWin ? '+' : ''}৳{pnl.toLocaleString('en-IN')} ({pnlPct.toFixed(2)}%)
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.sellBtn}
                        onPress={() => handleExecutePaperSell(pos.id, pos.currentPrice)}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Sell Virtual</Text>
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* TAB 6: MY REAL HOLDINGS */}
      {activeTab === 'my_holdings' && (
        <View style={{ gap: Spacing.md }}>
          <GlassCard style={styles.summaryCard} padding={20} glowColor={isProfitable ? Colors.success : Colors.danger}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>MY REAL STOCK PORTFOLIO VALUATION</Text>
                <Text style={styles.summaryAmount}>৳ {totalCurrentValue.toLocaleString('en-IN')}</Text>
                <Text style={styles.summarySub}>
                  Invested Capital: ৳ {totalInvested.toLocaleString('en-IN')} • {stocks.length} Positions
                </Text>
              </View>

              <TouchableOpacity style={styles.addBtn} onPress={onAddStockPress} activeOpacity={0.85}>
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.addBtnText}>+ Add Real Stock</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pnlBar}>
              <View style={styles.pnlItem}>
                <Text style={styles.pnlLabel}>TOTAL UNREALIZED RETURN</Text>
                <Text style={[styles.pnlVal, { color: isProfitable ? Colors.success : Colors.danger }]}>
                  {isProfitable ? '+' : '−'}৳ {Math.abs(totalGainLoss).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.vLine} />
              <View style={styles.pnlItem}>
                <Text style={styles.pnlLabel}>OVERALL ROI</Text>
                <Text style={[styles.pnlVal, { color: isProfitable ? Colors.success : Colors.danger }]}>
                  {isProfitable ? '+' : ''}{totalGainLossPct.toFixed(2)}%
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Holdings Cards */}
          {stocks.length === 0 ? (
            <GlassCard style={{ alignItems: 'center', padding: 32 }} padding={32}>
              <Ionicons name="briefcase-outline" size={44} color="#0284C7" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 8 }}>
                No Real Stock Holdings Recorded
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
                Click "+ Add Real Stock" to enter your actual bought shares, buy prices, and brokerage accounts.
              </Text>
            </GlassCard>
          ) : (
            <View style={{ gap: 10 }}>
              {stocks.map((stock) => {
                const invested = stock.quantity * stock.buyPrice;
                const currentVal = stock.quantity * stock.currentPrice;
                const gain = currentVal - invested;
                const isGain = gain >= 0;

                return (
                  <GlassCard key={stock.id} style={{ width: '100%' }} padding={16} glowColor={isGain ? Colors.success : Colors.danger}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <View>
                        <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>{stock.symbol}</Text>
                        <Text style={{ fontSize: 12, color: '#64748B' }}>
                          {stock.quantity} shares @ ৳{stock.buyPrice} • Current: ৳{stock.currentPrice}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>৳{currentVal.toLocaleString('en-IN')}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: isGain ? '#16A34A' : '#EF4444' }}>
                          {isGain ? '+' : ''}৳{gain.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <TouchableOpacity onPress={() => onDeleteStock(stock.id)} style={{ padding: 6 }}>
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* 3. Deep-Dive Stock Analysis Modal (Comprehensive Research Dossier) */}
      <Modal visible={!!selectedStock} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            {selectedStock && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A' }}>
                        {selectedStock.symbol}
                      </Text>
                      <View style={[styles.recBadge, selectedStock.recommendation.includes('BUY') ? styles.recBadgeBuy : styles.recBadgeHold]}>
                        <Text style={styles.recBadgeText}>{selectedStock.recommendation}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>
                      {selectedStock.companyName} • {selectedStock.sector} (DSE)
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => setSelectedStock(null)}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
                  {/* Score & Pricing Header */}
                  <View style={styles.scoreRow}>
                    <View style={styles.bigScoreBox}>
                      <Text style={{ fontSize: 32, fontWeight: '900', color: '#16A34A' }}>
                        {selectedStock.totalAiScore}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B' }}>TOTAL AI SCORE</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>CURRENT PRICE</Text>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A' }}>৳{selectedStock.ltp}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#16A34A' }}>
                        +{selectedStock.changePercent}% today
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>DCF INTRINSIC VALUE</Text>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: '#0284C7' }}>৳{selectedStock.dcfIntrinsicValue}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284C7' }}>
                        {selectedStock.marginOfSafetyPercent}% Margin of Safety
                      </Text>
                    </View>
                  </View>

                  {/* 7 Sub-Tabs Navigation */}
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8 }}>
                    {[
                      { id: 'ai_models', label: '🧠 5-Model AI Ensemble' },
                      { id: 'dcf_waterfall', label: '💎 DCF Waterfall' },
                      { id: 'dividends', label: '💰 Dividend & Growth' },
                      { id: 'technical', label: '📐 Technicals' },
                      { id: 'patterns', label: '🕯️ Candlestick Win-Rates' },
                      { id: 'fundamentals', label: '📊 Fundamentals & BD Macro' },
                      { id: 'historical', label: '🏛️ 10-Yr Historical' },
                    ].map((tab) => (
                      <TouchableOpacity
                        key={tab.id}
                        style={[styles.optPill, modalSubTab === tab.id && styles.optPillActive]}
                        onPress={() => setModalSubTab(tab.id as any)}
                      >
                        <Text style={[styles.optPillText, modalSubTab === tab.id && styles.optPillTextActive]}>
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* TAB 1: 5-Model Competing AI Forecasting Ensemble (Model A, B, C, D, E) */}
                  {modalSubTab === 'ai_models' && (() => {
                    const ens = generate5ModelAiEnsemble(selectedStock.symbol, selectedStock.ltp);
                    return (
                      <>
                        {/* Consensus Target Card */}
                        <View style={[styles.thesisBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 13, fontWeight: '900', color: '#16A34A' }}>
                              🎯 AI ENSEMBLE CONSENSUS TARGET: ৳{ens.ensembleTargetPrice} (+{ens.potentialUpsidePercent}%)
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>{ens.overallConfidencePercent}% Conf.</Text>
                          </View>
                          <Text style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>
                            {ens.modelAgreementRating} • Horizon: {ens.forecastHorizon}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#0F172A', marginTop: 6, lineHeight: 18 }}>
                            {ens.executiveSynthesis}
                          </Text>
                        </View>

                        {/* 5 Competing Models Table */}
                        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
                          🤖 5 COMPETING AI FORECASTING ARCHITECTURES (MULTI-MODEL ENSEMBLE)
                        </Text>
                        <View style={styles.table}>
                          <View style={styles.tableHeader}>
                            <Text style={[styles.th, { width: 85 }]}>MODEL</Text>
                            <Text style={[styles.th, { flex: 1.5 }]}>TECH STACK</Text>
                            <Text style={[styles.th, { width: 75 }]}>TARGET</Text>
                            <Text style={[styles.th, { width: 65 }]}>UPSIDE</Text>
                            <Text style={[styles.th, { width: 60 }]}>WEIGHT</Text>
                          </View>

                          {[ens.modelA_TimeSeries, ens.modelB_MachineLearning, ens.modelC_DeepLearning, ens.modelD_MarketRegime, ens.modelE_NlpLlmSentiment].map((m) => (
                            <View key={m.modelGroup} style={styles.tableRow}>
                              <View style={{ width: 85 }}>
                                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>{m.modelGroup}</Text>
                                <Text style={{ fontSize: 10, color: '#64748B' }}>{m.modelTitle}</Text>
                              </View>
                              <Text style={[styles.td, { flex: 1.5, fontSize: 11 }]}>{m.technologiesUsed}</Text>
                              <Text style={[styles.td, { width: 75, fontWeight: '900' }]}>৳{m.forecastPrice}</Text>
                              <Text style={[styles.td, { width: 65, fontWeight: '800', color: '#16A34A' }]}>+{m.expectedReturnPercent}%</Text>
                              <Text style={[styles.td, { width: 60, fontWeight: '800', color: '#0284C7' }]}>{m.weightInEnsemblePercent}%</Text>
                            </View>
                          ))}
                        </View>

                        {/* Model E NLP Sentiment Highlights */}
                        <View style={{ backgroundColor: '#F8FAFC', borderRadius: Radius.sm, padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#0284C7' }}>
                            📰 MODEL E: NLP & LLM TEXTUAL SENTIMENT SIGNALS
                          </Text>
                          <Text style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>
                            • {ens.modelE_NlpLlmSentiment.signals[0]}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                            • {ens.modelE_NlpLlmSentiment.signals[1]}
                          </Text>
                        </View>

                        {/* AI Research Thesis */}
                        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
                          🧠 EXPLAINABLE RESEARCH THESIS & RISK FACTORS
                        </Text>
                        <View style={styles.thesisBox}>
                          <Text style={{ fontSize: 13, color: '#0F172A', lineHeight: 18 }}>
                            {selectedStock.aiInvestmentThesis}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 6 }}>
                            ⚠️ Key Risks: {selectedStock.riskFactors}
                          </Text>
                        </View>
                      </>
                    );
                  })()}

                  {/* TAB 2: Full Step-by-Step DCF Valuation Waterfall */}
                  {modalSubTab === 'dcf_waterfall' && (() => {
                    const dcf = calculateDetailedDCF(selectedStock.symbol, selectedStock.ltp, 886.45);
                    return (
                      <>
                        {/* DCF Valuation Status Banner */}
                        <View style={[styles.thesisBox, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                              <Text style={{ fontSize: 16, fontWeight: '900', color: '#0284C7' }}>
                                DCF INTRINSIC VALUE: ৳{dcf.intrinsicValuePerShare}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#0369A1' }}>
                                Current Price: ৳{dcf.currentPrice} • Margin of Safety: {dcf.marginOfSafetyPercent}%
                              </Text>
                            </View>
                            <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.sm, borderWidth: 1, borderColor: '#0284C7' }}>
                              <Text style={{ fontSize: 12, fontWeight: '900', color: '#0284C7' }}>{dcf.classification}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Step-by-Step Waterfall Table */}
                        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
                          💎 STEP-BY-STEP DCF WATERFALL (REVENUE TO INTRINSIC VALUE)
                        </Text>
                        <View style={styles.table}>
                          <View style={styles.tableHeader}>
                            <Text style={[styles.th, { flex: 1.5 }]}>FINANCIAL WATERFALL STEP</Text>
                            <Text style={[styles.th, { flex: 1 }]}>AMOUNT (৳ CRORE)</Text>
                            <Text style={[styles.th, { flex: 1.8 }]}>FINANCIAL FORMULA / BASIS</Text>
                          </View>

                          {dcf.waterfallSteps.map((s, idx) => (
                            <View key={idx} style={[styles.tableRow, idx === dcf.waterfallSteps.length - 1 && { backgroundColor: '#F0FDF4' }]}>
                              <Text style={[styles.td, { flex: 1.5, fontWeight: idx === dcf.waterfallSteps.length - 1 ? '900' : '700', color: idx === dcf.waterfallSteps.length - 1 ? '#16A34A' : '#0F172A' }]}>
                                {s.stepName}
                              </Text>
                              <Text style={[styles.td, { flex: 1, fontWeight: '800', color: s.amountCrore < 0 ? '#EF4444' : '#0F172A' }]}>
                                {s.amountCrore < 0 ? `-৳${Math.abs(s.amountCrore)} Cr` : `৳${s.amountCrore} Cr`}
                              </Text>
                              <Text style={[styles.td, { flex: 1.8, fontSize: 11, color: '#64748B' }]}>{s.formulaDescription}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Key Valuation Inputs */}
                        <View style={[styles.kpiGrid, { marginTop: Spacing.sm }]}>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>DISCOUNT RATE (WACC)</Text>
                            <Text style={styles.kpiVal}>{dcf.waccPercent}%</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>TERMINAL GROWTH (G)</Text>
                            <Text style={styles.kpiVal}>{dcf.terminalGrowthRatePercent}%</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>ENTERPRISE VALUE</Text>
                            <Text style={styles.kpiVal}>৳{dcf.enterpriseValueCrore} Cr</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>MARGIN OF SAFETY</Text>
                            <Text style={[styles.kpiVal, { color: dcf.marginOfSafetyPercent >= 15 ? '#16A34A' : '#EF4444' }]}>
                              {dcf.marginOfSafetyPercent}%
                            </Text>
                          </View>
                        </View>
                      </>
                    );
                  })()}

                  {/* TAB 3: Dividend & Growth Analysis */}
                  {modalSubTab === 'dividends' && (() => {
                    const divProfile = getDividendProfileForStock(selectedStock.symbol);
                    return (
                      <>
                        {/* Dividend Category & Verdict */}
                        <View style={[styles.thesisBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 14, fontWeight: '900', color: '#B45309' }}>
                              {divProfile.category.toUpperCase()}
                            </Text>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#92400E' }}>
                              {divProfile.cashSustainabilityScore}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 12, color: '#78350F', marginTop: 4, lineHeight: 18 }}>
                            {divProfile.verdict}
                          </Text>
                        </View>

                        {/* Dividend Metrics Grid */}
                        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
                          💰 CASH DIVIDEND SUSTAINABILITY & COVERAGE METRICS
                        </Text>
                        <View style={styles.kpiGrid}>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>DIVIDEND YIELD</Text>
                            <Text style={[styles.kpiVal, { color: '#B45309' }]}>{divProfile.dividendYieldPercent}%</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>PAYOUT RATIO</Text>
                            <Text style={styles.kpiVal}>{divProfile.dividendPayoutRatioPercent}%</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>5-YR DIVIDEND CAGR</Text>
                            <Text style={[styles.kpiVal, { color: '#16A34A' }]}>+{divProfile.dividendCagr5YrPercent}%</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>CONSECUTIVE YEARS</Text>
                            <Text style={styles.kpiVal}>{divProfile.consecutiveYearsPaid} Years Unbroken</Text>
                          </View>
                        </View>

                        {/* Coverage Ratios */}
                        <View style={styles.table}>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>EPS Coverage Ratio:</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '900', color: '#16A34A' }]}>{divProfile.epsCoverageRatio}x Coverage</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>FCF Coverage Ratio:</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '900', color: '#16A34A' }]}>{divProfile.fcfCoverageRatio}x Coverage</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Latest Cash Dividend:</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '900', color: '#16A34A' }]}>{divProfile.lastCashDividendPercent}% Cash</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Bonus / Stock Dividend:</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800', color: '#0284C7' }]}>{divProfile.lastBonusDividendPercent}% Stock</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Upcoming Record Date:</Text>
                            <Text style={[styles.td, { flex: 1 }]}>{divProfile.recordDate}</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Income Style:</Text>
                            <Text style={[styles.td, { flex: 1 }]}>{divProfile.category}</Text>
                          </View>
                        </View>
                      </>
                    );
                  })()}

                  {/* TAB 2: Full Technical Analysis Engine */}
                  {modalSubTab === 'technical' && (() => {
                    const tech = generateTechnicalIndicators(
                      selectedStock.symbol,
                      selectedStock.ltp,
                      selectedStock.supportLevel,
                      selectedStock.resistanceLevel
                    );
                    return (
                      <>
                        {/* Trend Indicators */}
                        <Text style={styles.sectionHeading}>📈 1. TREND INDICATORS (MOVING AVERAGES & SYSTEM)</Text>
                        <View style={styles.table}>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Trend Direction:</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '900', color: '#16A34A' }]}>{tech.trendDirection}</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Supertrend:</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800', color: '#16A34A' }]}>৳{tech.supertrend} ({tech.supertrendStatus})</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1 }]}>SMA 5 / 10 / 20:</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '700' }]}>৳{tech.sma5} / ৳{tech.sma10} / ৳{tech.sma20}</Text>
                            <Text style={[styles.td, { flex: 1 }]}>SMA 50 / 100 / 200:</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '700' }]}>৳{tech.sma50} / ৳{tech.sma100} / ৳{tech.sma200}</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1 }]}>EMA 12 / 26 & WMA 20:</Text>
                            <Text style={[styles.td, { flex: 1 }]}>৳{tech.ema12} / ৳{tech.ema26} (WMA ৳{tech.wma20})</Text>
                            <Text style={[styles.td, { flex: 1 }]}>MACD (Line / Signal / Hist):</Text>
                            <Text style={[styles.td, { flex: 1, color: '#16A34A', fontWeight: '800' }]}>{tech.macdLine} / {tech.macdSignal} (Hist: +{tech.macdHistogram})</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1 }]}>ADX (14) & Aroon:</Text>
                            <Text style={[styles.td, { flex: 1 }]}>{tech.adx14} ({tech.adxTrendStrength}) • Aroon Up {tech.aroonUp}</Text>
                            <Text style={[styles.td, { flex: 1 }]}>Ichimoku Cloud:</Text>
                            <Text style={[styles.td, { flex: 1, color: '#16A34A', fontWeight: '800' }]}>{tech.ichimokuCloud}</Text>
                          </View>
                        </View>

                        {/* Momentum Indicators */}
                        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>⚡ 2. MOMENTUM INDICATORS</Text>
                        <View style={styles.kpiGrid}>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>RSI (14)</Text>
                            <Text style={[styles.kpiVal, { color: '#0284C7' }]}>{tech.rsi14} ({tech.rsiStatus})</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>STOCHASTIC %K / %D</Text>
                            <Text style={styles.kpiVal}>{tech.stochasticK} / {tech.stochasticD}</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>WILLIAMS %R / ROC</Text>
                            <Text style={styles.kpiVal}>{tech.williamsPercentR}% / +{tech.rocPercent}%</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>MFI & CCI</Text>
                            <Text style={styles.kpiVal}>MFI: {tech.mfi} | CCI: {tech.cci}</Text>
                          </View>
                        </View>

                        {/* Volatility & Volume Indicators */}
                        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>🌊 3. VOLATILITY & VOLUME FLOW</Text>
                        <View style={styles.table}>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>ATR (14) Volatility:</Text>
                            <Text style={[styles.td, { flex: 1 }]}>৳{tech.atr14} (Annualized {tech.historicalVolatilityAnnualized}%)</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Bollinger Bands:</Text>
                            <Text style={[styles.td, { flex: 1 }]}>৳{tech.bollingerLower} – ৳{tech.bollingerMiddle} – ৳{tech.bollingerUpper}</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>On-Balance Volume (OBV):</Text>
                            <Text style={[styles.td, { flex: 1 }]}>{tech.obvMillion}M shares</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>VWAP (Volume Wtd Price):</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '900', color: '#0284C7' }]}>৳{tech.vwap}</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Accumulation / Distribution:</Text>
                            <Text style={[styles.td, { flex: 1, color: '#16A34A', fontWeight: '800' }]}>{tech.accumulationDistributionStatus}</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Volume Spike / Divergence:</Text>
                            <Text style={[styles.td, { flex: 1, color: '#16A34A', fontWeight: '800' }]}>{tech.volumeSpikeStatus} • {tech.volumePriceDivergence}</Text>
                          </View>
                        </View>

                        {/* Support, Resistance & AI Market Structure */}
                        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>🎯 4. SUPPORT, RESISTANCE & MARKET STRUCTURE</Text>
                        <View style={styles.kpiGrid}>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>STRONG SUPPORT (S1 / S2)</Text>
                            <Text style={[styles.kpiVal, { color: '#16A34A' }]}>৳{tech.strongSupport1} / ৳{tech.strongSupport2}</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>STRONG RESISTANCE (R1 / R2)</Text>
                            <Text style={[styles.kpiVal, { color: '#EF4444' }]}>৳{tech.strongResistance1} / ৳{tech.strongResistance2}</Text>
                          </View>
                          <View style={[styles.kpiItem, { flex: 2 }]}>
                            <Text style={styles.kpiLabel}>AI MARKET STRUCTURE DETECTION</Text>
                            <Text style={[styles.kpiVal, { color: '#0284C7' }]}>{tech.aiStructureDetection}</Text>
                          </View>
                        </View>

                        {/* Level-2 Order Book & Market Depth */}
                        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>📊 5. LEVEL-2 ORDER BOOK & MARKET DEPTH</Text>
                        <View style={styles.table}>
                          <View style={styles.tableHeader}>
                            <Text style={[styles.th, { flex: 1, color: '#16A34A' }]}>BUY ORDERS</Text>
                            <Text style={[styles.th, { flex: 1, color: '#16A34A' }]}>BID QTY</Text>
                            <Text style={[styles.th, { flex: 1, color: '#16A34A' }]}>BID PRICE</Text>
                            <Text style={[styles.th, { flex: 1, color: '#EF4444' }]}>ASK PRICE</Text>
                            <Text style={[styles.th, { flex: 1, color: '#EF4444' }]}>ASK QTY</Text>
                            <Text style={[styles.th, { flex: 1, color: '#EF4444' }]}>SELL ORDERS</Text>
                          </View>

                          {(selectedStock.marketDepth || [
                            { buyOrders: 14, buyVolume: 42500, bidPrice: selectedStock.ltp - 0.2, askPrice: selectedStock.ltp + 0.1, sellVolume: 31800, sellOrders: 9 },
                            { buyOrders: 22, buyVolume: 65200, bidPrice: selectedStock.ltp - 0.4, askPrice: selectedStock.ltp + 0.4, sellVolume: 48500, sellOrders: 15 },
                            { buyOrders: 31, buyVolume: 98400, bidPrice: selectedStock.ltp - 0.9, askPrice: selectedStock.ltp + 0.6, sellVolume: 82000, sellOrders: 24 },
                            { buyOrders: 18, buyVolume: 51200, bidPrice: selectedStock.ltp - 1.4, askPrice: selectedStock.ltp + 1.1, sellVolume: 64000, sellOrders: 19 },
                            { buyOrders: 40, buyVolume: 125000, bidPrice: selectedStock.ltp - 1.9, askPrice: selectedStock.ltp + 1.6, sellVolume: 110000, sellOrders: 32 },
                          ]).map((tier, idx) => (
                            <View key={idx} style={styles.tableRow}>
                              <Text style={[styles.td, { flex: 1, color: '#64748B' }]}>{tier.buyOrders}</Text>
                              <Text style={[styles.td, { flex: 1, fontWeight: '700', color: '#16A34A' }]}>{tier.buyVolume.toLocaleString()}</Text>
                              <Text style={[styles.td, { flex: 1, fontWeight: '900', color: '#16A34A' }]}>৳{tier.bidPrice.toFixed(1)}</Text>
                              <Text style={[styles.td, { flex: 1, fontWeight: '900', color: '#EF4444' }]}>৳{tier.askPrice.toFixed(1)}</Text>
                              <Text style={[styles.td, { flex: 1, fontWeight: '700', color: '#EF4444' }]}>{tier.sellVolume.toLocaleString()}</Text>
                              <Text style={[styles.td, { flex: 1, color: '#64748B' }]}>{tier.sellOrders}</Text>
                            </View>
                          ))}
                        </View>
                      </>
                    );
                  })()}

                  {/* TAB 3: Candlestick Pattern Engine & DSE Historical Win-Rates */}
                  {modalSubTab === 'patterns' && (() => {
                    const patterns = getCompanyCandlestickPatterns(selectedStock.symbol);
                    return (
                      <>
                        <Text style={styles.sectionHeading}>🕯️ CANDLESTICK PATTERNS & EMPIRICAL DSE WIN-RATES</Text>
                        <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                          Every pattern is backtested against 10+ years of Dhaka Stock Exchange trading cycles:
                        </Text>

                        <View style={styles.table}>
                          <View style={styles.tableHeader}>
                            <Text style={[styles.th, { flex: 1.5 }]}>PATTERN</Text>
                            <Text style={[styles.th, { width: 75 }]}>STATUS</Text>
                            <Text style={[styles.th, { width: 70 }]}>DSE HIST.</Text>
                            <Text style={[styles.th, { width: 75 }]}>5-D WIN</Text>
                            <Text style={[styles.th, { width: 75 }]}>20-D WIN</Text>
                            <Text style={[styles.th, { flex: 1 }]}>TRADING RULE</Text>
                          </View>

                          {patterns.map((pat) => (
                            <View key={pat.id} style={styles.tableRow}>
                              <View style={{ flex: 1.5 }}>
                                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>{pat.name}</Text>
                                <Text style={{ fontSize: 10, color: '#64748B' }}>{pat.category}</Text>
                              </View>
                              <View style={{ width: 75 }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: pat.isDetectedToday ? '#16A34A' : '#94A3B8' }}>
                                  {pat.isDetectedToday ? '✓ Detected' : '—'}
                                </Text>
                              </View>
                              <Text style={[styles.td, { width: 70 }]}>{pat.dseHistoricalOccurrences.toLocaleString()}</Text>
                              <View style={{ width: 75 }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#16A34A' }}>{pat.winRate5DaysPercent}%</Text>
                                <Text style={{ fontSize: 10, color: '#64748B' }}>+{pat.avgReturn5DaysPercent}%</Text>
                              </View>
                              <View style={{ width: 75 }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#0284C7' }}>{pat.winRate20DaysPercent}%</Text>
                                <Text style={{ fontSize: 10, color: '#64748B' }}>+{pat.avgReturn20DaysPercent}%</Text>
                              </View>
                              <Text style={[styles.td, { flex: 1, fontSize: 11 }]}>{pat.tradingRule}</Text>
                            </View>
                          ))}
                        </View>
                      </>
                    );
                  })()}

                  {/* TAB 4: Fundamental Analysis & Bangladesh Macro Engine */}
                  {modalSubTab === 'fundamentals' && (() => {
                    const fund = generateFundamentalDossier(
                      selectedStock.symbol,
                      selectedStock.eps,
                      selectedStock.peRatio,
                      selectedStock.roePercent,
                      selectedStock.dividendYieldPercent
                    );
                    return (
                      <>
                        {/* Profitability & Ratios */}
                        <Text style={styles.sectionHeading}>💼 1. PROFITABILITY & RETURNS</Text>
                        <View style={styles.kpiGrid}>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>GROSS / OPERATING MARGIN</Text>
                            <Text style={styles.kpiVal}>{fund.grossMarginPercent}% / {fund.operatingMarginPercent}%</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>NET PROFIT MARGIN</Text>
                            <Text style={[styles.kpiVal, { color: '#16A34A' }]}>{fund.netMarginPercent}%</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>ROE / ROA / ROIC</Text>
                            <Text style={[styles.kpiVal, { color: '#0284C7' }]}>{fund.roePercent}% / {fund.roaPercent}% / {fund.roicPercent}%</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>REVENUE GROWTH (YOY)</Text>
                            <Text style={[styles.kpiVal, { color: '#16A34A' }]}>+{fund.revenueGrowthYoYPercent}%</Text>
                          </View>
                        </View>

                        {/* Financial Strength & Cash Flow */}
                        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>🛡️ 2. FINANCIAL STRENGTH & SOLVENCY</Text>
                        <View style={styles.table}>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Debt-to-Equity:</Text>
                            <Text style={[styles.td, { flex: 1, color: '#16A34A', fontWeight: '900' }]}>{fund.debtToEquity} (Virtually Debt-Free)</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Current Ratio:</Text>
                            <Text style={[styles.td, { flex: 1, color: '#16A34A', fontWeight: '800' }]}>{fund.currentRatio} (Strong Liquidity)</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Interest Coverage:</Text>
                            <Text style={[styles.td, { flex: 1, color: '#16A34A', fontWeight: '800' }]}>{fund.interestCoverageRatio}x</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Cash-to-Debt Ratio:</Text>
                            <Text style={[styles.td, { flex: 1 }]}>{fund.cashToDebtRatio}x</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Operating Cash Flow:</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>৳{fund.operatingCashFlowCrore} Cr</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Free Cash Flow (FCF):</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: '900', color: '#16A34A' }]}>৳{fund.freeCashFlowCrore} Cr</Text>
                          </View>
                        </View>

                        {/* Valuation Multiples */}
                        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>💎 3. VALUATION MULTIPLES</Text>
                        <View style={styles.kpiGrid}>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>P/E & FORWARD P/E</Text>
                            <Text style={styles.kpiVal}>{fund.peRatio}x / {fund.forwardPE}x</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>P/B & PEG RATIO</Text>
                            <Text style={styles.kpiVal}>{fund.pbRatio}x (PEG: {fund.pegRatio})</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>EV / EBITDA & EV / SALES</Text>
                            <Text style={styles.kpiVal}>{fund.evToEbitda}x / {fund.evToSales}x</Text>
                          </View>
                          <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>DIVIDEND YIELD</Text>
                            <Text style={[styles.kpiVal, { color: '#F59E0B' }]}>{fund.dividendYieldPercent}%</Text>
                          </View>
                        </View>

                        {/* Bangladesh-Specific Macro Economic & Regulatory Exposure */}
                        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>🇧🇩 4. BANGLADESH-SPECIFIC MACRO & REGULATORY EXPOSURE</Text>
                        <View style={styles.table}>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800', color: '#0369A1' }]}>Inflation & Pricing Power:</Text>
                            <Text style={[styles.td, { flex: 2 }]}>{fund.macroInflationAnalysis.exposure} — {fund.macroInflationAnalysis.details}</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800', color: '#0369A1' }]}>Interest Rate Sensitivity:</Text>
                            <Text style={[styles.td, { flex: 2 }]}>{fund.interestRateImpact.exposure} — {fund.interestRateImpact.details}</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800', color: '#0369A1' }]}>USD/BDT FX & Dollar Liquidity:</Text>
                            <Text style={[styles.td, { flex: 2 }]}>{fund.exchangeRateFxAnalysis.exposure} — {fund.exchangeRateFxAnalysis.details}</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800', color: '#0369A1' }]}>Import Restrictions & LC Risk:</Text>
                            <Text style={[styles.td, { flex: 2 }]}>{fund.importRestrictionsLCRisk.status} — {fund.importRestrictionsLCRisk.details}</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800', color: '#0369A1' }]}>Energy & Captive Power:</Text>
                            <Text style={[styles.td, { flex: 2 }]}>{fund.energyPricesImpact.status} — {fund.energyPricesImpact.details}</Text>
                          </View>
                          <View style={styles.tableRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '800', color: '#0369A1' }]}>Govt & Bangladesh Bank Policy:</Text>
                            <Text style={[styles.td, { flex: 2 }]}>{fund.governmentAndBbPolicy.status} — {fund.governmentAndBbPolicy.details}</Text>
                          </View>
                        </View>
                      </>
                    );
                  })()}

                  {/* TAB 5: 10-15 Year Historical Database & Multi-Timeframe Analytics */}
                  {modalSubTab === 'historical' && (
                    <>
                      <Text style={styles.sectionHeading}>
                        🏛️ 10–15 YEAR HISTORICAL TIME-SERIES & TIMEFRAME ANALYTICS
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                        Analyze historical returns, EPS CAGR, dividend growth, and historical P/E bands (DSE & ICE Data Services EOD Archive):
                      </Text>

                      {/* Timeframe Selector */}
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {(['1D', '1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', '10Y'] as const).map((tf) => (
                          <TouchableOpacity
                            key={tf}
                            style={[styles.optPill, histTimeframe === tf && styles.optPillActive]}
                            onPress={() => setHistTimeframe(tf)}
                          >
                            <Text style={[styles.optPillText, histTimeframe === tf && styles.optPillTextActive]}>{tf}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Calculated metrics for this timeframe */}
                      {(() => {
                        const tfMetrics = calculateTimeframeAnalytics(selectedStock.symbol, histTimeframe, selectedStock.ltp);
                        const isUp = tfMetrics.percentageReturn >= 0;
                        return (
                          <View style={styles.kpiGrid}>
                            <View style={styles.kpiItem}>
                              <Text style={styles.kpiLabel}>{histTimeframe} TOTAL RETURN</Text>
                              <Text style={[styles.kpiVal, { color: isUp ? '#16A34A' : '#EF4444' }]}>
                                {isUp ? '+' : ''}{tfMetrics.percentageReturn}%
                                {histTimeframe !== '1D' && histTimeframe !== '1W' && histTimeframe !== '1M' ? ` (${tfMetrics.cagrReturnPercent}% CAGR)` : ''}
                              </Text>
                            </View>
                            <View style={styles.kpiItem}>
                              <Text style={styles.kpiLabel}>PERIOD RANGE (HIGH / LOW)</Text>
                              <Text style={styles.kpiVal}>৳{tfMetrics.periodHigh} / ৳{tfMetrics.periodLow}</Text>
                            </View>
                            <View style={styles.kpiItem}>
                              <Text style={styles.kpiLabel}>EPS / DIVIDEND CAGR</Text>
                              <Text style={[styles.kpiVal, { color: '#0284C7' }]}>+{tfMetrics.epsCagrPercent}% / +{tfMetrics.dividendCagrPercent}%</Text>
                            </View>
                            <View style={styles.kpiItem}>
                              <Text style={styles.kpiLabel}>HISTORICAL P/E RANGE</Text>
                              <Text style={styles.kpiVal}>{tfMetrics.peMin}x – {tfMetrics.medianPeRatio}x – {tfMetrics.peMax}x</Text>
                            </View>
                          </View>
                        );
                      })()}

                      {/* Historical Data Table */}
                      <View style={styles.table}>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.th, { width: 80 }]}>DATE</Text>
                          <Text style={[styles.th, { width: 55 }]}>OPEN</Text>
                          <Text style={[styles.th, { width: 55 }]}>HIGH</Text>
                          <Text style={[styles.th, { width: 55 }]}>LOW</Text>
                          <Text style={[styles.th, { width: 60 }]}>CLOSE</Text>
                          <Text style={[styles.th, { width: 65 }]}>ADJ CLS</Text>
                          <Text style={[styles.th, { width: 55 }]}>EPS</Text>
                          <Text style={[styles.th, { width: 55 }]}>NAV</Text>
                          <Text style={[styles.th, { flex: 1 }]}>DIVIDEND & ACTION</Text>
                        </View>

                        {((DSE_HISTORICAL_DATABASE[selectedStock.symbol] || generate10YearHistoricalSeries(selectedStock.symbol, selectedStock.ltp, selectedStock.eps, selectedStock.nav)).slice(0, 6)).map((row, idx) => (
                          <View key={idx} style={styles.tableRow}>
                            <Text style={[styles.td, { width: 80, fontSize: 11, fontWeight: '700' }]}>{row.date}</Text>
                            <Text style={[styles.td, { width: 55, fontSize: 11 }]}>৳{row.open}</Text>
                            <Text style={[styles.td, { width: 55, fontSize: 11, color: '#16A34A' }]}>৳{row.high}</Text>
                            <Text style={[styles.td, { width: 55, fontSize: 11, color: '#EF4444' }]}>৳{row.low}</Text>
                            <Text style={[styles.td, { width: 60, fontSize: 11, fontWeight: '800' }]}>৳{row.close}</Text>
                            <Text style={[styles.td, { width: 65, fontSize: 11, fontWeight: '700', color: '#0284C7' }]}>৳{row.adjustedClose}</Text>
                            <Text style={[styles.td, { width: 55, fontSize: 11 }]}>৳{row.eps}</Text>
                            <Text style={[styles.td, { width: 55, fontSize: 11 }]}>৳{row.nav}</Text>
                            <Text style={[styles.td, { flex: 1, fontSize: 11, color: '#334155' }]}>{row.dividend !== 'None' ? row.dividend : row.corporateActions}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.lg }}>
                    <TouchableOpacity
                      style={styles.modalActionBtn}
                      onPress={() => {
                        const stockToBuy = selectedStock;
                        setSelectedStock(null);
                        setPaperBuyModalStock(stockToBuy);
                      }}
                    >
                      <Ionicons name="game-controller" size={16} color="#FFFFFF" />
                      <Text style={styles.modalActionText}>+ Buy in Paper Simulator</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalActionBtn, { backgroundColor: '#0284C7' }]}
                      onPress={() => {
                        setSelectedStock(null);
                        onAddStockPress();
                      }}
                    >
                      <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.modalActionText}>+ Add to Real Holdings</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 4. Quick Paper Buy Order Modal */}
      <Modal visible={!!paperBuyModalStock} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {paperBuyModalStock && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 4 }}>
                  Virtual Paper Order: {paperBuyModalStock.symbol}
                </Text>
                <Text style={{ fontSize: 13, color: '#64748B', marginBottom: Spacing.md }}>
                  Price: ৳{paperBuyModalStock.ltp} • Target: ৳{paperBuyModalStock.ensembleTargetPrice} (+{paperBuyModalStock.potentialUpsidePercent}%)
                </Text>

                <Text style={styles.inputLabel}>NUMBER OF SHARES TO BUY</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={paperBuyShares}
                  onChangeText={setPaperBuyShares}
                  placeholder="e.g. 500"
                />

                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0284C7', marginVertical: 8 }}>
                  Total Estimated Cost: ৳{(paperBuyModalStock.ltp * (parseInt(paperBuyShares, 10) || 0)).toLocaleString('en-IN')}
                </Text>
                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: Spacing.md }}>
                  Available Virtual Balance: ৳{paperState.cashBalance.toLocaleString('en-IN')}
                </Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#F1F5F9' }]}
                    onPress={() => setPaperBuyModalStock(null)}
                  >
                    <Text style={{ color: '#475569', fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#16A34A' }]}
                    onPress={handleExecutePaperBuy}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Execute Virtual Buy</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2FE',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.md,
  },
  marketTickerCard: {
    width: '100%',
  },
  tickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  indexItem: {
    minWidth: 140,
  },
  indexName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  indexVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  indexChange: {
    fontSize: 12,
    fontWeight: '800',
  },
  turnoverSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  regimeBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  regimeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  regimeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  regimeSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  tabsScroll: {
    marginVertical: 4,
  },
  platformTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    gap: 6,
  },
  platformTabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  platformTabBtnActive: {
    backgroundColor: '#16A34A', // Vibrant Green Button
  },
  platformTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  platformTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroBanner: {
    width: '100%',
  },
  heroBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  heroDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 680,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  scanBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
    marginVertical: 2,
  },
  picksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pickCardWrapper: {
    width: '49%',
    minWidth: 320,
    flex: 1,
  },
  pickCard: {
    width: '100%',
  },
  pickSymbol: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  pickName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  strongBuyPill: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  strongBuyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNum: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pickMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.sm,
    padding: 10,
    marginVertical: 10,
  },
  pickMuted: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  pickPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  pickThesis: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  sectorCard: {
    width: '100%',
  },
  sectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  sectorItem: {
    width: '31%',
    minWidth: 150,
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: Radius.sm,
    padding: 10,
  },
  sectorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectorChange: {
    fontSize: 14,
    fontWeight: '900',
    marginVertical: 2,
  },
  sectorTurnover: {
    fontSize: 11,
    color: '#64748B',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  miniFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  miniFilterPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  miniFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  miniFilterTextActive: {
    color: '#FFFFFF',
  },
  stockIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  recBadgeBuy: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
  },
  recBadgeHold: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  recBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  scorePillSmall: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  quickBuyBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  screenerRatioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 8,
  },
  ratioItem: {
    fontSize: 12,
    color: '#64748B',
  },
  optControlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  optCol: {
    flex: 1,
    minWidth: 260,
  },
  optPillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  optPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  optPillActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  optPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  optPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  runOptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 13,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: Spacing.md,
  },
  kpiItem: {
    width: '48%',
    flex: 1,
    minWidth: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  td: {
    fontSize: 13,
    color: '#0F172A',
  },
  symBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  symBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
  },
  summaryCard: {
    width: '100%',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  summarySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  pnlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 12,
    marginTop: Spacing.md,
    gap: 24,
  },
  pnlItem: {
    flex: 1,
  },
  pnlLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  pnlVal: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 1,
  },
  vLine: {
    width: 1,
    height: 30,
    backgroundColor: '#CBD5E1',
  },
  paperPerfPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  perfPos: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
  },
  perfNeg: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  paperPerfText: {
    fontSize: 13,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  sellBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCardLarge: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    padding: 14,
    gap: 16,
    marginBottom: Spacing.md,
  },
  bigScoreBox: {
    alignItems: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#BAE6FD',
  },
  thesisBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.sm,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 13,
    borderRadius: Radius.md,
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
});
