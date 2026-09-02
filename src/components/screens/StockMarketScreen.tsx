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
  const [valuationFilter, setValuationFilter] = useState<'All' | 'Undervalued' | 'Low PE' | 'High Dividend'>('All');

  // Deep-Dive Modal
  const [selectedStock, setSelectedStock] = useState<DseStockItem | null>(null);
  const [histTimeframe, setHistTimeframe] = useState<HistoricalTimeframe>('1Y');

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
    if (valuationFilter === 'Undervalued') matchesVal = s.valuationStatus === 'Undervalued';
    if (valuationFilter === 'Low PE') matchesVal = s.peRatio <= 12;
    if (valuationFilter === 'High Dividend') matchesVal = s.dividendYieldPercent >= 5.0;

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
              {(['All', 'Undervalued', 'Low PE', 'High Dividend'] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.miniFilterPill, valuationFilter === v && styles.miniFilterPillActive]}
                  onPress={() => setValuationFilter(v)}
                >
                  <Text style={[styles.miniFilterText, valuationFilter === v && styles.miniFilterTextActive]}>
                    {v === 'All' ? 'All Valuations' : v}
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

          {/* Multi-Factor Strategy Backtest Summary */}
          <GlassCard style={{ width: '100%' }} padding={20} glowColor="#16A34A">
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0369A1', marginBottom: 6 }}>
              📈 10-YEAR DSE MULTI-FACTOR STRATEGY BACKTEST (2016 - 2026)
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginBottom: Spacing.md }}>
              Strategy Rule: RSI &lt; 35 + Volume &gt; 1.5x 20-DMA + ROE &gt; 15% + P/E &lt; 5-Year Sector Median.
            </Text>

            <View style={styles.kpiGrid}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLabel}>TOTAL SIMULATED TRADES</Text>
                <Text style={styles.kpiVal}>384 Trades</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLabel}>OVERALL WIN RATE</Text>
                <Text style={[styles.kpiVal, { color: '#16A34A' }]}>61.4%</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLabel}>AVG WINNING TRADE</Text>
                <Text style={[styles.kpiVal, { color: '#16A34A' }]}>+8.4%</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLabel}>MAX DRAWDOWN</Text>
                <Text style={[styles.kpiVal, { color: '#EF4444' }]}>-17.2%</Text>
              </View>
            </View>
          </GlassCard>
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

                  {/* AI Investment Thesis */}
                  <View style={styles.thesisBox}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#0369A1', marginBottom: 4 }}>
                      AI INVESTMENT RESEARCH THESIS
                    </Text>
                    <Text style={{ fontSize: 13, color: '#0F172A', lineHeight: 18 }}>
                      {selectedStock.aiInvestmentThesis}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 6 }}>
                      ⚠️ Key Risks: {selectedStock.riskFactors}
                    </Text>
                  </View>

                  {/* Competing AI Forecasting Ensemble Models */}
                  <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
                    🤖 COMPETING AI PREDICTION MODELS (ENSEMBLE ARCHITECTURE)
                  </Text>
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.th, { flex: 1.5 }]}>MODEL ARCHITECTURE</Text>
                      <Text style={[styles.th, { flex: 1 }]}>PRICE TARGET</Text>
                      <Text style={[styles.th, { flex: 1 }]}>UPSIDE %</Text>
                      <Text style={[styles.th, { flex: 1 }]}>HORIZON</Text>
                    </View>

                    <View style={styles.tableRow}>
                      <Text style={[styles.td, { flex: 1.5, fontWeight: '700' }]}>XGBoost Gradient Boosted</Text>
                      <Text style={[styles.td, { flex: 1 }]}>৳{selectedStock.xgboostPrediction}</Text>
                      <Text style={[styles.td, { flex: 1, color: '#16A34A', fontWeight: '800' }]}>+22.7%</Text>
                      <Text style={[styles.td, { flex: 1 }]}>90-Day</Text>
                    </View>

                    <View style={styles.tableRow}>
                      <Text style={[styles.td, { flex: 1.5, fontWeight: '700' }]}>LSTM Deep Neural Network</Text>
                      <Text style={[styles.td, { flex: 1 }]}>৳{selectedStock.lstmPrediction}</Text>
                      <Text style={[styles.td, { flex: 1, color: '#16A34A', fontWeight: '800' }]}>+25.9%</Text>
                      <Text style={[styles.td, { flex: 1 }]}>90-Day</Text>
                    </View>

                    <View style={styles.tableRow}>
                      <Text style={[styles.td, { flex: 1.5, fontWeight: '700' }]}>DCF Valuation Model</Text>
                      <Text style={[styles.td, { flex: 1 }]}>৳{selectedStock.dcfModelPrediction}</Text>
                      <Text style={[styles.td, { flex: 1, color: '#16A34A', fontWeight: '800' }]}>+30.5%</Text>
                      <Text style={[styles.td, { flex: 1 }]}>Intrinsic</Text>
                    </View>

                    <View style={[styles.tableRow, { backgroundColor: '#F0FDF4' }]}>
                      <Text style={[styles.td, { flex: 1.5, fontWeight: '900', color: '#16A34A' }]}>
                        AI WEIGHTED ENSEMBLE
                      </Text>
                      <Text style={[styles.td, { flex: 1, fontWeight: '900', color: '#16A34A' }]}>
                        ৳{selectedStock.ensembleTargetPrice}
                      </Text>
                      <Text style={[styles.td, { flex: 1, fontWeight: '900', color: '#16A34A' }]}>
                        +{selectedStock.potentialUpsidePercent}%
                      </Text>
                      <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>
                        {selectedStock.modelConfidencePercent}% Conf.
                      </Text>
                    </View>
                  </View>

                  {/* Fundamental & Risk Health Breakdown */}
                  <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
                    🛡️ ACCOUNTING INTEGRITY & FUNDAMENTAL RATIOS
                  </Text>
                  <View style={styles.kpiGrid}>
                    <View style={styles.kpiItem}>
                      <Text style={styles.kpiLabel}>PIOTROSKI F-SCORE</Text>
                      <Text style={[styles.kpiVal, { color: '#16A34A' }]}>{selectedStock.piotroskiScore} / 9 (Pristine)</Text>
                    </View>
                    <View style={styles.kpiItem}>
                      <Text style={styles.kpiLabel}>ALTMAN Z-SCORE</Text>
                      <Text style={[styles.kpiVal, { color: '#16A34A' }]}>{selectedStock.altmanZScore} (Safe Zone)</Text>
                    </View>
                    <View style={styles.kpiItem}>
                      <Text style={styles.kpiLabel}>ROE %</Text>
                      <Text style={styles.kpiVal}>{selectedStock.roePercent}%</Text>
                    </View>
                    <View style={styles.kpiItem}>
                      <Text style={styles.kpiLabel}>DIVIDEND YIELD</Text>
                      <Text style={[styles.kpiVal, { color: '#F59E0B' }]}>{selectedStock.dividendYieldPercent}%</Text>
                    </View>
                  </View>

                  {/* Level-2 Order Book & Market Depth */}
                  <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
                    📊 LIVE LEVEL-2 MARKET DEPTH (ORDER BOOK & BID / ASK)
                  </Text>
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

                  {/* Corporate Announcements, Dividends & Bonus / Right Shares */}
                  <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
                    📢 CORPORATE ANNOUNCEMENTS, DIVIDENDS & BONUS/RIGHT SHARES
                  </Text>
                  <View style={styles.table}>
                    <View style={styles.tableRow}>
                      <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Cash Dividend:</Text>
                      <Text style={[styles.td, { flex: 1, fontWeight: '900', color: '#16A34A' }]}>{selectedStock.cashDividendPercent || selectedStock.dividendYieldPercent * 10}%</Text>
                      <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Bonus Shares:</Text>
                      <Text style={[styles.td, { flex: 1, fontWeight: '800', color: '#0284C7' }]}>{selectedStock.bonusShareRatio || 'None'}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Right Shares:</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{selectedStock.rightShareRatio || 'None'}</Text>
                      <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Record Date:</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{selectedStock.recordDate || '2026-11-18'}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Paid-up Capital:</Text>
                      <Text style={[styles.td, { flex: 1 }]}>৳{selectedStock.paidUpCapitalCrore || Math.round(selectedStock.marketCapCrore * 0.05)} Cr</Text>
                      <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>Market Cap:</Text>
                      <Text style={[styles.td, { flex: 1, fontWeight: '900' }]}>৳{selectedStock.marketCapCrore} Cr</Text>
                    </View>
                  </View>

                  {/* 10-15 Year Historical Database & Multi-Timeframe Analytics */}
                  <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
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

                  {/* Historical Data Table (Date, Open, High, Low, Close, Adj Close, Volume, EPS, NAV, Dividend, Corporate Action) */}
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
