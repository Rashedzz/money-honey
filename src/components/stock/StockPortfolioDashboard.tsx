import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../theme';
import { StockHolding } from '../../finance/stocks';
import {
  DSE_STOCK_UNIVERSE,
  DseStockItem,
} from '../../finance/bdStockIntelligence';
import { WatchlistHook } from '../../hooks/useWatchlist';

interface StockPortfolioDashboardProps {
  stocks: StockHolding[];
  watchlist: WatchlistHook;
  onAddStockPress: (prefillSymbol?: string, prefillPrice?: number) => void;
  onDeleteStock: (id: string) => void;
  onUpdatePrice: (id: string, newPrice: number) => void;
  onDeepAnalyze: (stockItem: DseStockItem) => void;
}

const SECTOR_COLORS: Record<string, string> = {
  Pharmaceuticals: '#0284C7', // Sky Blue
  Banking: '#16A34A',         // Emerald Green
  Telecommunication: '#7C3AED', // Violet
  'Fuel & Power': '#EA580C',  // Orange
  'Food & Allied': '#D97706',  // Amber
  Engineering: '#0D9488',      // Teal
  Textile: '#EC4899',          // Pink
  Miscellaneous: '#64748B',    // Slate
};

export const StockPortfolioDashboard: React.FC<StockPortfolioDashboardProps> = ({
  stocks,
  watchlist,
  onAddStockPress,
  onDeleteStock,
  onUpdatePrice,
  onDeepAnalyze,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPriceInput, setEditPriceInput] = useState('');
  const [watchlistSearch, setWatchlistSearch] = useState('');
  const [activeViewMode, setActiveViewMode] = useState<'all' | 'gainers' | 'losers'>('all');

  // ==========================================
  // 1. CALCULATE CORE PORTFOLIO AGGREGATES
  // ==========================================
  const portfolioStats = useMemo(() => {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let profitableCount = 0;
    let lossCount = 0;
    let totalProjectedAnnualDividend = 0;

    let topGainer: { symbol: string; gainPct: number; gainAmt: number } | null = null;
    let topLaggard: { symbol: string; gainPct: number; gainAmt: number } | null = null;

    const sectorAllocations: Record<string, number> = {};

    stocks.forEach((s) => {
      const invested = s.quantity * s.buyPrice;
      const current = s.quantity * s.currentPrice;
      const gain = current - invested;
      const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

      totalInvested += invested;
      totalCurrentValue += current;

      if (gain >= 0) profitableCount++;
      else lossCount++;

      // Sector mapping
      const sec = s.sector || 'Miscellaneous';
      sectorAllocations[sec] = (sectorAllocations[sec] || 0) + current;

      // Dividend estimate
      const divYield = s.dividendYieldPercent || 4.2;
      totalProjectedAnnualDividend += current * (divYield / 100);

      // Track extreme performers
      if (!topGainer || gainPct > topGainer.gainPct) {
        topGainer = { symbol: s.symbol, gainPct, gainAmt: gain };
      }
      if (!topLaggard || gainPct < topLaggard.gainPct) {
        topLaggard = { symbol: s.symbol, gainPct, gainAmt: gain };
      }
    });

    const netGainLoss = totalCurrentValue - totalInvested;
    const netGainLossPct = totalInvested > 0 ? (netGainLoss / totalInvested) * 100 : 0;
    const isProfitable = netGainLoss >= 0;
    const winRate = stocks.length > 0 ? (profitableCount / stocks.length) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      netGainLoss,
      netGainLossPct,
      isProfitable,
      profitableCount,
      lossCount,
      winRate,
      topGainer,
      topLaggard,
      totalProjectedAnnualDividend,
      sectorAllocations,
    };
  }, [stocks]);

  // Sector allocation percentages
  const sectorBars = useMemo(() => {
    if (portfolioStats.totalCurrentValue === 0) return [];
    return Object.entries(portfolioStats.sectorAllocations).map(([sector, amount]) => ({
      sector,
      amount,
      pct: (amount / portfolioStats.totalCurrentValue) * 100,
      color: SECTOR_COLORS[sector] || '#64748B',
    })).sort((a, b) => b.amount - a.amount);
  }, [portfolioStats]);

  // Filtered holdings list
  const filteredHoldings = useMemo(() => {
    if (activeViewMode === 'gainers') {
      return stocks.filter((s) => s.currentPrice >= s.buyPrice);
    }
    if (activeViewMode === 'losers') {
      return stocks.filter((s) => s.currentPrice < s.buyPrice);
    }
    return stocks;
  }, [stocks, activeViewMode]);

  // Watchlist (Interested Stocks) items resolved from DSE Universe
  const interestedStocksData = useMemo(() => {
    const list: DseStockItem[] = [];
    watchlist.interestedSymbols.forEach((sym) => {
      const found = DSE_STOCK_UNIVERSE.find((u) => u.symbol.toUpperCase() === sym.toUpperCase());
      if (found) list.push(found);
      else {
        // Fallback item for user-added tickers
        const template = DSE_STOCK_UNIVERSE[0];
        list.push({
          ...template,
          symbol: sym,
          companyName: `${sym} Ltd.`,
        });
      }
    });

    if (!watchlistSearch.trim()) return list;
    const query = watchlistSearch.toLowerCase();
    return list.filter(
      (s) => s.symbol.toLowerCase().includes(query) || s.companyName.toLowerCase().includes(query)
    );
  }, [watchlist.interestedSymbols, watchlistSearch]);

  // Handle Save Price Edit
  const handleSavePrice = (id: string) => {
    const parsed = parseFloat(editPriceInput);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdatePrice(id, parsed);
    }
    setEditingId(null);
    setEditPriceInput('');
  };

  return (
    <View style={styles.container}>
      {/* ========================================================================= */}
      {/* 1. LIVE SCROLLING TICKER MARQUEE OF INVESTED STOCKS                       */}
      {/* ========================================================================= */}
      <View style={styles.marqueeSection}>
        <View style={styles.marqueeHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.liveDot} />
            <Text style={styles.marqueeTitle}>LIVE INVESTED POSITIONS STREAM</Text>
          </View>
          <Text style={styles.marqueeSub}>
            {stocks.length} Position{stocks.length === 1 ? '' : 's'} • ৳{' '}
            {portfolioStats.totalCurrentValue.toLocaleString('en-IN')} Current
          </Text>
        </View>

        {stocks.length === 0 ? (
          <View style={styles.marqueeEmpty}>
            <Text style={styles.marqueeEmptyText}>
              No active stock positions. Click "+ Add Real Stock" below to build your live portfolio.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.marqueeScroll}
          >
            {stocks.map((stock) => {
              const invested = stock.quantity * stock.buyPrice;
              const currentVal = stock.quantity * stock.currentPrice;
              const gainAmt = currentVal - invested;
              const gainPct = invested > 0 ? (gainAmt / invested) * 100 : 0;
              const isGain = gainAmt >= 0;

              // Find DseStockItem for deep dive if tapped
              const dseItem = DSE_STOCK_UNIVERSE.find((u) => u.symbol === stock.symbol);

              return (
                <TouchableOpacity
                  key={stock.id}
                  style={styles.tickerChip}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (dseItem) onDeepAnalyze(dseItem);
                  }}
                >
                  <View style={styles.tickerTopRow}>
                    <Text style={styles.tickerSymbol}>{stock.symbol}</Text>
                    <View
                      style={[
                        styles.tickerPill,
                        { backgroundColor: isGain ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tickerPillText,
                          { color: isGain ? '#059669' : '#DC2626' },
                        ]}
                      >
                        {isGain ? '▲ +' : '▼ −'}{Math.abs(gainPct).toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tickerBottomRow}>
                    <Text style={styles.tickerPrice}>৳ {stock.currentPrice.toLocaleString('en-IN')}</Text>
                    <Text style={styles.tickerVal}>
                      Val: ৳ {(currentVal / 1000).toFixed(0)}k
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE PORTFOLIO AGGREGATES HERO (HOW MUCH I INVEST & PRESENT VAL)  */}
      {/* ========================================================================= */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroPreTitle}>INSTITUTIONAL STOCK PORTFOLIO VALUATION</Text>
            <Text style={styles.heroPresentValue}>
              ৳ {portfolioStats.totalCurrentValue.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.heroInvestedSub}>
              How Much I Invested: <Text style={{ fontWeight: '800', color: '#0F172A' }}>৳ {portfolioStats.totalInvested.toLocaleString('en-IN')}</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addStockBtn}
            onPress={() => onAddStockPress()}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
            <Text style={styles.addStockBtnText}>+ Add Real Stock</Text>
          </TouchableOpacity>
        </View>

        {/* Profit / Loss & Performance Trajectory Bar */}
        <View style={styles.heroMetricsGrid}>
          {/* Net Unrealized Return */}
          <View style={styles.heroMetricBox}>
            <Text style={styles.heroMetricLabel}>TOTAL PROFIT / LOSS</Text>
            <Text
              style={[
                styles.heroMetricValue,
                { color: portfolioStats.isProfitable ? '#059669' : '#DC2626' },
              ]}
            >
              {portfolioStats.isProfitable ? '+ ৳ ' : '− ৳ '}
              {Math.abs(portfolioStats.netGainLoss).toLocaleString('en-IN')}
            </Text>
            <Text
              style={[
                styles.heroMetricSub,
                { color: portfolioStats.isProfitable ? '#059669' : '#DC2626' },
              ]}
            >
              {portfolioStats.isProfitable ? '▲ ' : '▼ '}
              {portfolioStats.netGainLossPct.toFixed(2)}% Overall ROI
            </Text>
          </View>

          {/* Win Rate */}
          <View style={styles.heroMetricBox}>
            <Text style={styles.heroMetricLabel}>POSITION WIN RATE</Text>
            <Text style={styles.heroMetricValue}>
              {portfolioStats.winRate.toFixed(0)}%
            </Text>
            <Text style={styles.heroMetricSub}>
              {portfolioStats.profitableCount} Profitable • {portfolioStats.lossCount} Down
            </Text>
          </View>

          {/* Annual Projected Dividend Yield */}
          <View style={styles.heroMetricBox}>
            <Text style={styles.heroMetricLabel}>EST. ANNUAL DIVIDEND</Text>
            <Text style={[styles.heroMetricValue, { color: '#0284C7' }]}>
              ৳ {Math.round(portfolioStats.totalProjectedAnnualDividend).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.heroMetricSub}>
              ~{portfolioStats.totalCurrentValue > 0
                ? ((portfolioStats.totalProjectedAnnualDividend / portfolioStats.totalCurrentValue) * 100).toFixed(1)
                : '0.0'}% Cash Yield / yr
            </Text>
          </View>
        </View>

        {/* Sector Allocation Proportional Bar */}
        {sectorBars.length > 0 && (
          <View style={styles.sectorBarSection}>
            <View style={styles.sectorBarHeader}>
              <Text style={styles.sectorBarTitle}>SECTOR ALLOCATION & DIVERSIFICATION</Text>
              <Text style={styles.sectorBarSub}>
                {sectorBars.length} Active Industry Sector{sectorBars.length === 1 ? '' : 's'}
              </Text>
            </View>

            {/* Progress Track */}
            <View style={styles.sectorProgressTrack}>
              {sectorBars.map((sec) => (
                <View
                  key={sec.sector}
                  style={{
                    width: `${Math.max(4, sec.pct)}%`,
                    backgroundColor: sec.color,
                    height: '100%',
                  }}
                />
              ))}
            </View>

            {/* Legend Pills */}
            <View style={styles.sectorLegendRow}>
              {sectorBars.map((sec) => (
                <View key={sec.sector} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: sec.color }]} />
                  <Text style={styles.legendText}>
                    {sec.sector}: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{sec.pct.toFixed(0)}%</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* ========================================================================= */}
      {/* 3. INDIVIDUAL HOLDINGS DETAILED TABLE & PERFORMANCE CARDS                 */}
      {/* ========================================================================= */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>INDIVIDUAL STOCK HOLDINGS BREAKDOWN</Text>
            <Text style={styles.sectionSub}>
              Detailed audit of each invested stock: shares, cost basis, CMP, P&L, and trend
            </Text>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterPillsRow}>
            {(['all', 'gainers', 'losers'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setActiveViewMode(mode)}
                style={[
                  styles.filterPill,
                  activeViewMode === mode && styles.filterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activeViewMode === mode && styles.filterPillTextActive,
                  ]}
                >
                  {mode === 'all'
                    ? `All (${stocks.length})`
                    : mode === 'gainers'
                    ? `Profit (${portfolioStats.profitableCount})`
                    : `Loss (${portfolioStats.lossCount})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {filteredHoldings.length === 0 ? (
          <View style={styles.emptyHoldingsBox}>
            <Ionicons name="briefcase-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyHoldingsTitle}>
              {stocks.length === 0
                ? 'No Real Stock Holdings Recorded'
                : 'No Stocks Match This Filter'}
            </Text>
            <Text style={styles.emptyHoldingsSub}>
              {stocks.length === 0
                ? 'Record your first stock purchase to monitor capital, price trends, and returns.'
                : 'Switch filters or add new stock positions.'}
            </Text>
            {stocks.length === 0 && (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => onAddStockPress()}
              >
                <Text style={styles.emptyAddBtnText}>+ Record Stock Position</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 780 }}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 140 }]}>STOCK / COMPANY</Text>
                <Text style={[styles.th, { width: 110, textAlign: 'right' }]}>SHARES & AVG BUY</Text>
                <Text style={[styles.th, { width: 120, textAlign: 'right' }]}>INVESTED CAPITAL</Text>
                <Text style={[styles.th, { width: 120, textAlign: 'right' }]}>CMP & VALUE</Text>
                <Text style={[styles.th, { width: 130, textAlign: 'right' }]}>PROFIT / LOSS</Text>
                <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>TREND</Text>
                <Text style={[styles.th, { width: 120, textAlign: 'center' }]}>ACTIONS</Text>
              </View>

              {/* Table Body */}
              {filteredHoldings.map((stock) => {
                const invested = stock.quantity * stock.buyPrice;
                const currentVal = stock.quantity * stock.currentPrice;
                const gainAmt = currentVal - invested;
                const gainPct = invested > 0 ? (gainAmt / invested) * 100 : 0;
                const isGain = gainAmt >= 0;

                // Technical momentum inference
                const trendSignal =
                  gainPct >= 10
                    ? { label: 'Bullish ▲', color: '#059669', bg: 'rgba(16, 185, 129, 0.12)' }
                    : gainPct >= -3
                    ? { label: 'Neutral ◼', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)' }
                    : { label: 'Bearish ▼', color: '#DC2626', bg: 'rgba(239, 68, 68, 0.12)' };

                const dseItem = DSE_STOCK_UNIVERSE.find((u) => u.symbol === stock.symbol);

                return (
                  <View key={stock.id} style={styles.tableRow}>
                    {/* Stock Symbol & Company */}
                    <View style={{ width: 140 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.tdSymbol}>{stock.symbol}</Text>
                        <Text style={styles.tdExchange}>{stock.exchange}</Text>
                      </View>
                      <Text style={styles.tdCompany} numberOfLines={1}>
                        {stock.companyName}
                      </Text>
                    </View>

                    {/* Shares & Avg Buy */}
                    <View style={{ width: 110, alignItems: 'flex-end' }}>
                      <Text style={styles.tdMainVal}>
                        {stock.quantity.toLocaleString('en-IN')} shs
                      </Text>
                      <Text style={styles.tdSubVal}>@ ৳{stock.buyPrice.toFixed(1)}</Text>
                    </View>

                    {/* Invested Capital */}
                    <View style={{ width: 120, alignItems: 'flex-end' }}>
                      <Text style={styles.tdMainVal}>
                        ৳ {invested.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.tdSubVal}>Cost Basis</Text>
                    </View>

                    {/* CMP & Current Value */}
                    <View style={{ width: 120, alignItems: 'flex-end' }}>
                      {editingId === stock.id ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <TextInput
                            style={styles.priceEditInput}
                            value={editPriceInput}
                            onChangeText={setEditPriceInput}
                            keyboardType="numeric"
                            autoFocus
                            placeholder="Price"
                          />
                          <TouchableOpacity
                            onPress={() => handleSavePrice(stock.id)}
                            style={styles.savePriceBtn}
                          >
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => {
                            setEditingId(stock.id);
                            setEditPriceInput(stock.currentPrice.toString());
                          }}
                          style={{ alignItems: 'flex-end' }}
                        >
                          <Text style={styles.tdMainVal}>
                            ৳ {currentVal.toLocaleString('en-IN')}
                          </Text>
                          <Text style={[styles.tdSubVal, { color: '#0284C7' }]}>
                            CMP: ৳{stock.currentPrice.toFixed(1)} ✏️
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Profit / Loss */}
                    <View style={{ width: 130, alignItems: 'flex-end' }}>
                      <Text
                        style={[
                          styles.tdMainVal,
                          { color: isGain ? '#059669' : '#DC2626' },
                        ]}
                      >
                        {isGain ? '+ ৳ ' : '− ৳ '}
                        {Math.abs(gainAmt).toLocaleString('en-IN')}
                      </Text>
                      <Text
                        style={[
                          styles.tdSubVal,
                          { color: isGain ? '#059669' : '#DC2626', fontWeight: '800' },
                        ]}
                      >
                        {isGain ? '+' : ''}{gainPct.toFixed(2)}%
                      </Text>
                    </View>

                    {/* Trend Momentum Badge */}
                    <View style={{ width: 100, alignItems: 'center' }}>
                      <View
                        style={[
                          styles.trendBadge,
                          { backgroundColor: trendSignal.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.trendBadgeText,
                            { color: trendSignal.color },
                          ]}
                        >
                          {trendSignal.label}
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={{ width: 120, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {dseItem && (
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => onDeepAnalyze(dseItem)}
                        >
                          <Ionicons name="analytics-outline" size={15} color="#0284C7" />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => {
                          setEditingId(stock.id);
                          setEditPriceInput(stock.currentPrice.toString());
                        }}
                      >
                        <Ionicons name="pencil-outline" size={15} color="#64748B" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionIconBtn, { borderColor: '#FEE2E2' }]}
                        onPress={() => onDeleteStock(stock.id)}
                      >
                        <Ionicons name="trash-outline" size={15} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      {/* ========================================================================= */}
      {/* 4. ⭐ INTERESTED STOCKS (WATCHLIST) WITH CHECK-MARK TRACKING & ANALYSIS    */}
      {/* ========================================================================= */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="star" size={18} color="#EAB308" />
              <Text style={styles.sectionTitle}>INTERESTED STOCKS (WATCHLIST)</Text>
            </View>
            <Text style={styles.sectionSub}>
              Stocks you've check-marked (☑️) to keep an eye on with live pricing, technicals, and fair values
            </Text>
          </View>

          {/* Quick Search inside Watchlist */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={14} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Filter watchlist..."
              value={watchlistSearch}
              onChangeText={setWatchlistSearch}
            />
          </View>
        </View>

        {interestedStocksData.length === 0 ? (
          <View style={styles.emptyWatchlistBox}>
            <Ionicons name="eye-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyWatchlistTitle}>No Interested Stocks Check-Marked</Text>
            <Text style={styles.emptyWatchlistSub}>
              Browse the DSE Screener and check-mark (☑️) any stock you want to monitor closely.
            </Text>
          </View>
        ) : (
          <View style={styles.watchlistGrid}>
            {interestedStocksData.map((item) => {
              const isChecked = watchlist.isInterested(item.symbol);
              const isPositive = item.changePercent >= 0;

              return (
                <View key={item.symbol} style={styles.watchlistCard}>
                  {/* Card Top: Checkmark + Symbol + Rec Badge */}
                  <View style={styles.wlCardTop}>
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => watchlist.toggleInterested(item.symbol)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isChecked ? '#0284C7' : '#94A3B8'}
                      />
                      <View>
                        <Text style={styles.wlSymbol}>{item.symbol}</Text>
                        <Text style={styles.wlSector}>{item.sector}</Text>
                      </View>
                    </TouchableOpacity>

                    <View
                      style={[
                        styles.recBadge,
                        {
                          backgroundColor:
                            item.recommendation.includes('BUY')
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(2, 132, 199, 0.12)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.recBadgeText,
                          {
                            color: item.recommendation.includes('BUY') ? '#059669' : '#0284C7',
                          },
                        ]}
                      >
                        {item.recommendation}
                      </Text>
                    </View>
                  </View>

                  {/* Card Price & Change */}
                  <View style={styles.wlPriceRow}>
                    <Text style={styles.wlPrice}>৳ {item.ltp.toFixed(1)}</Text>
                    <View
                      style={[
                        styles.wlChangePill,
                        { backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.wlChangeText,
                          { color: isPositive ? '#059669' : '#DC2626' },
                        ]}
                      >
                        {isPositive ? '▲ +' : '▼ −'}{Math.abs(item.changePercent).toFixed(2)}%
                      </Text>
                    </View>
                  </View>

                  {/* Valuation & Fundamental Summary */}
                  <View style={styles.wlMetricsRow}>
                    <View style={styles.wlMetricCol}>
                      <Text style={styles.wlMetricLabel}>P/E RATIO</Text>
                      <Text style={styles.wlMetricVal}>{item.peRatio.toFixed(1)}x</Text>
                    </View>
                    <View style={styles.wlMetricCol}>
                      <Text style={styles.wlMetricLabel}>DIV YIELD</Text>
                      <Text style={styles.wlMetricVal}>{item.dividendYieldPercent.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.wlMetricCol}>
                      <Text style={styles.wlMetricLabel}>DCF VALUE</Text>
                      <Text style={[styles.wlMetricVal, { color: '#0284C7' }]}>
                        ৳ {item.dcfIntrinsicValue}
                      </Text>
                    </View>
                  </View>

                  {/* 52-Week Range Bar */}
                  <View style={styles.rangeSection}>
                    <View style={styles.rangeLabelsRow}>
                      <Text style={styles.rangeSubLabel}>52W L: ৳{item.week52Low}</Text>
                      <Text style={styles.rangeSubLabel}>52W H: ৳{item.week52High}</Text>
                    </View>
                    <View style={styles.rangeTrack}>
                      <View
                        style={[
                          styles.rangeFill,
                          {
                            width: `${Math.min(
                              100,
                              Math.max(
                                8,
                                ((item.ltp - item.week52Low) /
                                  Math.max(1, item.week52High - item.week52Low)) *
                                  100
                              )
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Action Buttons: Deep Analysis & Buy / Invest */}
                  <View style={styles.wlActionRow}>
                    <TouchableOpacity
                      style={styles.wlAnalyzeBtn}
                      onPress={() => onDeepAnalyze(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="analytics" size={14} color="#0284C7" />
                      <Text style={styles.wlAnalyzeBtnText}>Deep Analysis</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.wlBuyBtn}
                      onPress={() => onAddStockPress(item.symbol, item.ltp)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="cart-outline" size={14} color="#FFFFFF" />
                      <Text style={styles.wlBuyBtnText}>+ Invest / Buy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
    width: '100%',
  },

  // 1. Marquee / Ticker Stream
  marqueeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  marqueeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  marqueeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  marqueeSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  marqueeScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  marqueeEmpty: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  marqueeEmptyText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  tickerChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 150,
  },
  tickerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tickerSymbol: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  tickerPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  tickerPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tickerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tickerPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  tickerVal: {
    fontSize: 11,
    color: '#64748B',
  },

  // 2. Hero Card (How Much I Invested & Present Value)
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.md,
  },
  heroPreTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  heroPresentValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
    marginTop: 2,
  },
  heroInvestedSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addStockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.full,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  addStockBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  heroMetricBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroMetricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  heroMetricSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },

  // Sector Allocation Progress
  sectorBarSection: {
    marginTop: Spacing.md,
  },
  sectorBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectorBarTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  sectorBarSub: {
    fontSize: 11,
    color: '#64748B',
  },
  sectorProgressTrack: {
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 8,
  },
  sectorLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
  },

  // 3. Section Cards (Holdings Breakdown & Watchlist)
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Holdings Table
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  tdSymbol: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  tdExchange: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  tdCompany: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  tdMainVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  tdSubVal: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  priceEditInput: {
    width: 60,
    height: 28,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: Radius.sm,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  savePriceBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  trendBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyHoldingsBox: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 6,
  },
  emptyHoldingsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyHoldingsSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 360,
  },
  emptyAddBtn: {
    marginTop: 10,
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 4. Watchlist Grid
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 180,
  },
  searchInput: {
    fontSize: 12,
    flex: 1,
    padding: 0,
    color: '#0F172A',
  },
  watchlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  watchlistCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wlCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wlSymbol: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  wlSector: {
    fontSize: 11,
    color: '#64748B',
  },
  recBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  recBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  wlPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wlPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  wlChangePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  wlChangeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  wlMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  wlMetricCol: {
    alignItems: 'center',
  },
  wlMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  wlMetricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  rangeSection: {
    marginBottom: 12,
  },
  rangeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rangeSubLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  rangeTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  rangeFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 2,
  },
  wlActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  wlAnalyzeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  wlAnalyzeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  wlBuyBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  wlBuyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyWatchlistBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyWatchlistTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyWatchlistSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
