/**
 * Interactive Side-by-Side Stock Comparison Modal
 * Allows investors to compare 2 to 3 stocks simultaneously side-by-side
 * across 7 institutional research dimensions with color-coded winner highlights
 * and full A4 landscape PDF comparison export.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DseStockItem, DSE_STOCK_UNIVERSE } from '../../finance/bdStockIntelligence';
import { StockDossierPdfGenerator } from '../../services/stockDossierPdfGenerator';
import { calculateDetailedDCF } from '../../finance/dcfValuationEngine';
import { generate5ModelAiEnsemble } from '../../finance/aiMultiModelEnsemble';
import { performForensicAccountingAudit } from '../../finance/accountingFraudDetection';
import { generateTechnicalIndicators } from '../../finance/technicalAnalysisEngine';
import { generateFundamentalDossier } from '../../finance/fundamentalAnalysisEngine';
import { getDividendProfileForStock } from '../../finance/dividendAnalysisEngine';
import { getDseRegulatoryStatus, getDseShareholding } from '../../finance/advancedStockFeatures';
import { Radius } from '../../theme';

interface StockComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  initialStocks?: DseStockItem[];
  onSelectStockDetail?: (stock: DseStockItem) => void;
}

export const StockComparisonModal: React.FC<StockComparisonModalProps> = ({
  visible,
  onClose,
  initialStocks = [],
  onSelectStockDetail,
}) => {
  // Up to 3 stocks can be selected
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() => {
    if (initialStocks.length >= 2) {
      return initialStocks.slice(0, 3).map((s) => s.symbol);
    }
    if (initialStocks.length === 1) {
      // Find a natural peer in the same sector or default to another large cap
      const baseStock = initialStocks[0];
      const peer = DSE_STOCK_UNIVERSE.find(
        (s) => s.sector === baseStock.sector && s.symbol !== baseStock.symbol
      ) || (baseStock.symbol === 'SQURPHARMA' ? DSE_STOCK_UNIVERSE.find((s) => s.symbol === 'RENATA') : DSE_STOCK_UNIVERSE[0]);
      return [baseStock.symbol, peer ? peer.symbol : 'GP'].filter(Boolean);
    }
    return ['SQURPHARMA', 'RENATA'];
  });

  const [isAddPickerOpen, setIsAddPickerOpen] = useState(false);

  // Sync with initialStocks when opened
  React.useEffect(() => {
    if (initialStocks.length >= 2) {
      setSelectedSymbols(initialStocks.slice(0, 3).map((s) => s.symbol));
    } else if (initialStocks.length === 1) {
      const base = initialStocks[0];
      const peer = DSE_STOCK_UNIVERSE.find(
        (s) => s.sector === base.sector && s.symbol !== base.symbol
      ) || DSE_STOCK_UNIVERSE.find((s) => s.symbol !== base.symbol);
      setSelectedSymbols([base.symbol, peer ? peer.symbol : 'GP']);
    }
  }, [initialStocks]);

  const activeStocks = useMemo(() => {
    return selectedSymbols
      .map((sym) => DSE_STOCK_UNIVERSE.find((s) => s.symbol === sym))
      .filter((s): s is DseStockItem => !!s);
  }, [selectedSymbols]);

  // Compute metrics for each active stock
  const stockAnalyses = useMemo(() => {
    return activeStocks.map((s) => {
      const dcf = calculateDetailedDCF(s.symbol, s.ltp, 886.45);
      const ensemble = generate5ModelAiEnsemble(s.symbol, s.ltp);
      const audit = performForensicAccountingAudit(s.symbol, s.companyName);
      const shareholding = getDseShareholding(s.symbol);
      const regulatory = getDseRegulatoryStatus(s.symbol, s.ltp);
      const dividend = getDividendProfileForStock(s.symbol);
      const tech = generateTechnicalIndicators(s.symbol, s.ltp, s.supportLevel, s.resistanceLevel);
      const fundamentals = generateFundamentalDossier(
        s.symbol,
        s.eps,
        s.peRatio,
        s.roePercent,
        s.dividendYieldPercent
      );

      const compositeScore = s.totalAiScore * 0.5 + dcf.marginOfSafetyPercent * 0.3 + fundamentals.roePercent * 0.2;

      return {
        stock: s,
        dcf,
        ensemble,
        audit,
        shareholding,
        regulatory,
        dividend,
        tech,
        fundamentals,
        compositeScore,
      };
    });
  }, [activeStocks]);

  // Determine winners
  const minPe = useMemo(() => {
    const pes = stockAnalyses.map((d) => d.stock.peRatio).filter((p) => p > 0);
    return pes.length ? Math.min(...pes) : 0;
  }, [stockAnalyses]);

  const maxMos = useMemo(() => {
    return Math.max(...stockAnalyses.map((d) => d.dcf.marginOfSafetyPercent));
  }, [stockAnalyses]);

  const maxRoe = useMemo(() => {
    return Math.max(...stockAnalyses.map((d) => d.fundamentals.roePercent));
  }, [stockAnalyses]);

  const maxNetMargin = useMemo(() => {
    return Math.max(...stockAnalyses.map((d) => d.fundamentals.netMarginPercent));
  }, [stockAnalyses]);

  const maxDiv = useMemo(() => {
    return Math.max(...stockAnalyses.map((d) => d.dividend.dividendYieldPercent));
  }, [stockAnalyses]);

  const maxScore = useMemo(() => {
    return Math.max(...stockAnalyses.map((d) => d.stock.totalAiScore));
  }, [stockAnalyses]);

  const maxUpside = useMemo(() => {
    return Math.max(...stockAnalyses.map((d) => d.ensemble.potentialUpsidePercent));
  }, [stockAnalyses]);

  const maxAltman = useMemo(() => {
    return Math.max(...stockAnalyses.map((d) => d.audit.altmanZScore));
  }, [stockAnalyses]);

  const maxPiotroski = useMemo(() => {
    return Math.max(...stockAnalyses.map((d) => d.audit.piotroskiFScore));
  }, [stockAnalyses]);

  const minDebt = useMemo(() => {
    return Math.min(...stockAnalyses.map((d) => d.fundamentals.debtToEquity));
  }, [stockAnalyses]);

  // Overall winner
  const overallWinner = useMemo(() => {
    if (stockAnalyses.length === 0) return null;
    let best = stockAnalyses[0];
    for (const item of stockAnalyses) {
      if (item.compositeScore > best.compositeScore) {
        best = item;
      }
    }
    return best;
  }, [stockAnalyses]);

  const handlePrintComparisonPdf = () => {
    if (activeStocks.length > 0) {
      StockDossierPdfGenerator.openComparisonPrintDossier(activeStocks);
    }
  };

  const addStockToCompare = (symbol: string) => {
    if (selectedSymbols.includes(symbol)) return;
    if (selectedSymbols.length >= 3) {
      setSelectedSymbols([selectedSymbols[0], selectedSymbols[1], symbol]);
    } else {
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
    setIsAddPickerOpen(false);
  };

  const removeStock = (symbol: string) => {
    if (selectedSymbols.length <= 1) return;
    setSelectedSymbols(selectedSymbols.filter((s) => s !== symbol));
  };

  const applyPreset = (symbols: string[]) => {
    setSelectedSymbols(symbols);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header Action Bar */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 22 }}>⚖️</Text>
                <Text style={styles.headerTitle}>SIDE-BY-SIDE STOCK COMPARISON</Text>
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{activeStocks.length} Stocks</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle}>
                Evaluate relative valuation, AI consensus, fundamentals, risk meters & dividends
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <TouchableOpacity
                style={styles.printBtn}
                onPress={handlePrintComparisonPdf}
                activeOpacity={0.8}
              >
                <Ionicons name="print-outline" size={15} color="#FFFFFF" />
                <Text style={styles.printBtnText}>🖨️ Print / PDF Comparison Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
            {/* Quick Presets Bar */}
            <View style={styles.presetsCard}>
              <Text style={styles.presetsLabel}>QUICK PEER COMPARISON PRESETS:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => applyPreset(['SQURPHARMA', 'RENATA', 'BEXIMCO'])}
                  >
                    <Text style={styles.presetChipText}>💊 Pharma: SQURPHARMA vs RENATA vs BEXIMCO</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => applyPreset(['GP', 'ROBI'])}
                  >
                    <Text style={styles.presetChipText}>📡 Telecom: GP vs ROBI</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => applyPreset(['BRACBANK', 'EBL'])}
                  >
                    <Text style={styles.presetChipText}>🏦 Banking: BRACBANK vs EBL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => applyPreset(['BATBC', 'UNILEVERCL'])}
                  >
                    <Text style={styles.presetChipText}>🛒 FMCG: BATBC vs UNILEVERCL</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>

            {/* Overall AI Value Pick Banner */}
            {overallWinner && (
              <View style={styles.winnerBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 24 }}>🏆</Text>
                  <View>
                    <Text style={styles.winnerText}>
                      AI VALUE PICK: {overallWinner.stock.companyName} ({overallWinner.stock.symbol})
                    </Text>
                    <Text style={styles.winnerSub}>
                      Highest composite score: Total AI Score {overallWinner.stock.totalAiScore}/100 • Margin of Safety +{overallWinner.dcf.marginOfSafetyPercent}% • Recommendation: {overallWinner.stock.recommendation}
                    </Text>
                  </View>
                </View>
                <View style={styles.winnerRankPill}>
                  <Text style={styles.winnerRankText}>RANK #1</Text>
                </View>
              </View>
            )}

            {/* Side-by-Side Executive Stock Cards */}
            <View style={styles.stockCardsRow}>
              {stockAnalyses.map((item, idx) => {
                const isWinner = overallWinner?.stock.symbol === item.stock.symbol;
                return (
                  <View
                    key={item.stock.symbol}
                    style={[
                      styles.stockCard,
                      isWinner && styles.stockCardWinner,
                    ]}
                  >
                    {/* Top Row: Symbol, Exchange & Remove */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.cardSymbol}>{item.stock.symbol}</Text>
                          <View style={styles.exchangeBadge}>
                            <Text style={styles.exchangeBadgeText}>{item.stock.exchange}</Text>
                          </View>
                          {isWinner && (
                            <View style={styles.winnerBadgeMini}>
                              <Text style={styles.winnerBadgeMiniText}>🏆 TOP PICK</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.cardName} numberOfLines={1}>
                          {item.stock.companyName}
                        </Text>
                        <Text style={styles.cardSector}>{item.stock.sector}</Text>
                      </View>

                      {stockAnalyses.length > 2 && (
                        <TouchableOpacity
                          onPress={() => removeStock(item.stock.symbol)}
                          style={styles.removeStockBtn}
                        >
                          <Ionicons name="close" size={14} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Pricing & AI Score */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <View>
                        <Text style={styles.cardLtp}>৳{item.stock.ltp}</Text>
                        <Text
                          style={[
                            styles.cardChange,
                            { color: item.stock.change >= 0 ? '#16A34A' : '#EF4444' },
                          ]}
                        >
                          {item.stock.change >= 0 ? '+' : ''}{item.stock.changePercent}% today
                        </Text>
                      </View>

                      <View style={styles.cardAiScoreBox}>
                        <Text style={styles.cardAiScoreNum}>{item.stock.totalAiScore}</Text>
                        <Text style={styles.cardAiScoreLabel}>AI SCORE</Text>
                      </View>
                    </View>

                    {/* DCF Value & Rec */}
                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.cardFooterLabel}>DCF FAIR VALUE</Text>
                        <Text style={styles.cardFooterVal}>৳{item.dcf.intrinsicValuePerShare}</Text>
                        <Text style={{ fontSize: 10, color: '#0284C7', fontWeight: '700' }}>
                          +{item.dcf.marginOfSafetyPercent}% Margin
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.cardFooterLabel}>ACTION</Text>
                        <View style={[styles.recBadgeSmall, item.stock.recommendation.includes('BUY') ? styles.recBuy : styles.recHold]}>
                          <Text style={styles.recBadgeSmallText}>{item.stock.recommendation}</Text>
                        </View>
                      </View>
                    </View>

                    {onSelectStockDetail && (
                      <TouchableOpacity
                        style={styles.viewDeepDiveBtn}
                        onPress={() => {
                          onClose();
                          onSelectStockDetail(item.stock);
                        }}
                      >
                        <Text style={styles.viewDeepDiveText}>Deep Dive Dossier →</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              {/* Add Stock Slot if fewer than 3 */}
              {stockAnalyses.length < 3 && (
                <TouchableOpacity
                  style={styles.addStockSlot}
                  onPress={() => setIsAddPickerOpen(!isAddPickerOpen)}
                >
                  <Ionicons name="add-circle-outline" size={32} color="#0284C7" />
                  <Text style={styles.addStockSlotText}>+ Add 3rd Stock to Compare</Text>
                  <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center' }}>
                    Compare up to 3 peers side-by-side
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Inline Stock Selector Dropdown */}
            {isAddPickerOpen && (
              <View style={styles.pickerContainer}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>
                  SELECT A STOCK TO ADD TO COMPARISON:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {DSE_STOCK_UNIVERSE.filter((s) => !selectedSymbols.includes(s.symbol)).map((s) => (
                    <TouchableOpacity
                      key={s.symbol}
                      style={styles.pickerStockPill}
                      onPress={() => addStockToCompare(s.symbol)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#0284C7' }}>{s.symbol}</Text>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>৳{s.ltp}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 7-DIMENSION SIDE-BY-SIDE COMPARATIVE MATRIX */}
            <View style={{ marginTop: 16 }}>
              {/* 1. Valuation & Pricing Multiples */}
              <View style={styles.matrixSection}>
                <View style={styles.matrixSectionHeader}>
                  <Text style={styles.matrixSectionTitle}>💎 1. VALUATION MULTIPLES & INTRINSIC PRICING</Text>
                </View>
                <View style={styles.matrixTable}>
                  <View style={styles.matrixRowHeader}>
                    <Text style={[styles.mTh, { flex: 1.4 }]}>METRIC</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTh, { flex: 1, textAlign: 'center' }]}>
                        {d.stock.symbol}
                      </Text>
                    ))}
                    <Text style={[styles.mTh, { flex: 1.2 }]}>BENCHMARK</Text>
                  </View>

                  {/* LTP */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Last Traded Price (LTP)</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center' }]}>
                        ৳{d.stock.ltp}
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Current Price</Text>
                  </View>

                  {/* P/E Ratio */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>P/E Ratio (Lower is Cheaper)</Text>
                    {stockAnalyses.map((d) => {
                      const isBest = d.stock.peRatio === minPe;
                      return (
                        <View key={d.stock.symbol} style={[styles.winnerCell, { flex: 1 }, isBest && styles.winnerCellActive]}>
                          <Text style={[styles.mTdVal, isBest && styles.winnerTextVal]}>
                            {d.stock.peRatio}x {isBest && '⭐'}
                          </Text>
                        </View>
                      );
                    })}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Sector Avg ~16.5x</Text>
                  </View>

                  {/* P/B Ratio */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>P/B Ratio</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center' }]}>
                        {d.stock.pbRatio}x
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Book Value Multiple</Text>
                  </View>

                  {/* DCF Intrinsic Fair Value */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>DCF Intrinsic Fair Value</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center', color: '#0284C7', fontWeight: '900' }]}>
                        ৳{d.dcf.intrinsicValuePerShare}
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Cash Flow Value</Text>
                  </View>

                  {/* Margin of Safety */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Margin of Safety (%)</Text>
                    {stockAnalyses.map((d) => {
                      const isBest = d.dcf.marginOfSafetyPercent === maxMos;
                      return (
                        <View key={d.stock.symbol} style={[styles.winnerCell, { flex: 1 }, isBest && styles.winnerCellActive]}>
                          <Text style={[styles.mTdVal, isBest && styles.winnerTextVal]}>
                            +{d.dcf.marginOfSafetyPercent}% {isBest && '⭐'}
                          </Text>
                        </View>
                      );
                    })}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>&gt;15% Desired Buffer</Text>
                  </View>

                  {/* Market Cap */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Market Capitalization</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center' }]}>
                        ৳{d.stock.marketCapCrore.toLocaleString('en-IN')} Cr
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Firm Enterprise Scale</Text>
                  </View>
                </View>
              </View>

              {/* 2. AI Multi-Factor Ensemble Forecasts */}
              <View style={styles.matrixSection}>
                <View style={styles.matrixSectionHeader}>
                  <Text style={styles.matrixSectionTitle}>🧠 2. AI ENSEMBLE FORECASTS & RECOMMENDATIONS</Text>
                </View>
                <View style={styles.matrixTable}>
                  <View style={styles.matrixRowHeader}>
                    <Text style={[styles.mTh, { flex: 1.4 }]}>AI PARAMETER</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTh, { flex: 1, textAlign: 'center' }]}>
                        {d.stock.symbol}
                      </Text>
                    ))}
                    <Text style={[styles.mTh, { flex: 1.2 }]}>METHODOLOGY</Text>
                  </View>

                  {/* Total AI Score */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Total AI Score (/100)</Text>
                    {stockAnalyses.map((d) => {
                      const isBest = d.stock.totalAiScore === maxScore;
                      return (
                        <View key={d.stock.symbol} style={[styles.winnerCell, { flex: 1 }, isBest && styles.winnerCellActive]}>
                          <Text style={[styles.mTdVal, isBest && styles.winnerTextVal]}>
                            {d.stock.totalAiScore} {isBest && '⭐'}
                          </Text>
                        </View>
                      );
                    })}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>14-Factor Composite</Text>
                  </View>

                  {/* Action Recommendation */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>AI Recommendation</Text>
                    {stockAnalyses.map((d) => (
                      <View key={d.stock.symbol} style={{ flex: 1, alignItems: 'center' }}>
                        <View style={[styles.recBadgeSmall, d.stock.recommendation.includes('BUY') ? styles.recBuy : styles.recHold]}>
                          <Text style={styles.recBadgeSmallText}>{d.stock.recommendation}</Text>
                        </View>
                      </View>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>System Action</Text>
                  </View>

                  {/* Target Price */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Consensus AI Target</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center', color: '#16A34A', fontWeight: '900' }]}>
                        ৳{d.ensemble.ensembleTargetPrice}
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Weighted Consensus</Text>
                  </View>

                  {/* Upside Potential */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Expected Upside (%)</Text>
                    {stockAnalyses.map((d) => {
                      const isBest = d.ensemble.potentialUpsidePercent === maxUpside;
                      return (
                        <View key={d.stock.symbol} style={[styles.winnerCell, { flex: 1 }, isBest && styles.winnerCellActive]}>
                          <Text style={[styles.mTdVal, isBest && styles.winnerTextVal]}>
                            +{d.ensemble.potentialUpsidePercent}% {isBest && '⭐'}
                          </Text>
                        </View>
                      );
                    })}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Capital Gain Target</Text>
                  </View>
                </View>
              </View>

              {/* 3. Profitability & Operational Strength */}
              <View style={styles.matrixSection}>
                <View style={styles.matrixSectionHeader}>
                  <Text style={styles.matrixSectionTitle}>📊 3. FINANCIAL PROFITABILITY & CAPITAL EFFICIENCY</Text>
                </View>
                <View style={styles.matrixTable}>
                  <View style={styles.matrixRowHeader}>
                    <Text style={[styles.mTh, { flex: 1.4 }]}>FINANCIAL METRIC</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTh, { flex: 1, textAlign: 'center' }]}>
                        {d.stock.symbol}
                      </Text>
                    ))}
                    <Text style={[styles.mTh, { flex: 1.2 }]}>STANDARD</Text>
                  </View>

                  {/* EPS */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Earnings Per Share (EPS)</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center' }]}>
                        ৳{d.stock.eps}
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Audited TTM</Text>
                  </View>

                  {/* NAV */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Net Asset Value (NAV)</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center' }]}>
                        ৳{d.stock.nav}
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Book Base</Text>
                  </View>

                  {/* ROE */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Return on Equity (ROE %)</Text>
                    {stockAnalyses.map((d) => {
                      const isBest = d.fundamentals.roePercent === maxRoe;
                      return (
                        <View key={d.stock.symbol} style={[styles.winnerCell, { flex: 1 }, isBest && styles.winnerCellActive]}>
                          <Text style={[styles.mTdVal, isBest && styles.winnerTextVal]}>
                            {d.fundamentals.roePercent}% {isBest && '⭐'}
                          </Text>
                        </View>
                      );
                    })}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>&gt;15% Compounder</Text>
                  </View>

                  {/* Net Margin */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Net Profit Margin (%)</Text>
                    {stockAnalyses.map((d) => {
                      const isBest = d.fundamentals.netMarginPercent === maxNetMargin;
                      return (
                        <View key={d.stock.symbol} style={[styles.winnerCell, { flex: 1 }, isBest && styles.winnerCellActive]}>
                          <Text style={[styles.mTdVal, isBest && styles.winnerTextVal]}>
                            {d.fundamentals.netMarginPercent}% {isBest && '⭐'}
                          </Text>
                        </View>
                      );
                    })}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Cash Conversion</Text>
                  </View>

                  {/* Debt to Equity */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Debt-to-Equity Ratio</Text>
                    {stockAnalyses.map((d) => {
                      const isBest = d.fundamentals.debtToEquity === minDebt;
                      return (
                        <View key={d.stock.symbol} style={[styles.winnerCell, { flex: 1 }, isBest && styles.winnerCellActive]}>
                          <Text style={[styles.mTdVal, isBest && styles.winnerTextVal]}>
                            {d.fundamentals.debtToEquity}x {isBest && '⭐'}
                          </Text>
                        </View>
                      );
                    })}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>&lt;0.50x Conservative</Text>
                  </View>

                  {/* Free Cash Flow */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Free Cash Flow (FCF)</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center', color: '#16A34A', fontWeight: '800' }]}>
                        ৳{d.fundamentals.freeCashFlowCrore} Cr
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Organic Capex Surplus</Text>
                  </View>
                </View>
              </View>

              {/* 4. Dividends & Distribution */}
              <View style={styles.matrixSection}>
                <View style={styles.matrixSectionHeader}>
                  <Text style={styles.matrixSectionTitle}>💰 4. DIVIDEND YIELD & SHAREHOLDER DISTRIBUTIONS</Text>
                </View>
                <View style={styles.matrixTable}>
                  <View style={styles.matrixRowHeader}>
                    <Text style={[styles.mTh, { flex: 1.4 }]}>DIVIDEND PARAMETER</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTh, { flex: 1, textAlign: 'center' }]}>
                        {d.stock.symbol}
                      </Text>
                    ))}
                    <Text style={[styles.mTh, { flex: 1.2 }]}>EVALUATION</Text>
                  </View>

                  {/* Dividend Yield */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Dividend Yield (%)</Text>
                    {stockAnalyses.map((d) => {
                      const isBest = d.dividend.dividendYieldPercent === maxDiv;
                      return (
                        <View key={d.stock.symbol} style={[styles.winnerCell, { flex: 1 }, isBest && styles.winnerCellActive]}>
                          <Text style={[styles.mTdVal, isBest && styles.winnerTextVal]}>
                            {d.dividend.dividendYieldPercent}% {isBest && '⭐'}
                          </Text>
                        </View>
                      );
                    })}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Annualized Yield</Text>
                  </View>

                  {/* Payout Ratio */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Dividend Payout Ratio (%)</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center' }]}>
                        {d.dividend.dividendPayoutRatioPercent}%
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Earnings Protection</Text>
                  </View>

                  {/* 5-Yr CAGR */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>5-Year Dividend CAGR</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center', color: '#16A34A', fontWeight: '800' }]}>
                        +{d.dividend.dividendCagr5YrPercent}%
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Distribution Growth</Text>
                  </View>

                  {/* Track Record */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Uninterrupted Track Record</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center', fontWeight: '700' }]}>
                        {d.dividend.consecutiveYearsPaid} Yrs
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Consecutive Years</Text>
                  </View>
                </View>
              </View>

              {/* 5. Forensic Accounting & Distress Risk */}
              <View style={styles.matrixSection}>
                <View style={styles.matrixSectionHeader}>
                  <Text style={styles.matrixSectionTitle}>🛡️ 5. FORENSIC AUDIT & BANKRUPTCY SAFETY METERS</Text>
                </View>
                <View style={styles.matrixTable}>
                  <View style={styles.matrixRowHeader}>
                    <Text style={[styles.mTh, { flex: 1.4 }]}>FORENSIC TEST</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTh, { flex: 1, textAlign: 'center' }]}>
                        {d.stock.symbol}
                      </Text>
                    ))}
                    <Text style={[styles.mTh, { flex: 1.2 }]}>CRITICAL THRESHOLD</Text>
                  </View>

                  {/* Altman Z */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Altman Z-Score (Solvency)</Text>
                    {stockAnalyses.map((d) => {
                      const isBest = d.audit.altmanZScore === maxAltman;
                      return (
                        <View key={d.stock.symbol} style={[styles.winnerCell, { flex: 1 }, isBest && styles.winnerCellActive]}>
                          <Text style={[styles.mTdVal, isBest && styles.winnerTextVal]}>
                            {d.audit.altmanZScore} {isBest && '⭐'}
                          </Text>
                        </View>
                      );
                    })}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Safe &gt; 2.99</Text>
                  </View>

                  {/* Beneish M */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Beneish M-Score (Earnings Risk)</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center', color: '#16A34A', fontWeight: '800' }]}>
                        {d.audit.beneishMScore}
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Safe &lt; -1.78</Text>
                  </View>

                  {/* Piotroski F */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Piotroski F-Score (/9)</Text>
                    {stockAnalyses.map((d) => {
                      const isBest = d.audit.piotroskiFScore === maxPiotroski;
                      return (
                        <View key={d.stock.symbol} style={[styles.winnerCell, { flex: 1 }, isBest && styles.winnerCellActive]}>
                          <Text style={[styles.mTdVal, isBest && styles.winnerTextVal]}>
                            {d.audit.piotroskiFScore}/9 {isBest && '⭐'}
                          </Text>
                        </View>
                      );
                    })}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>High Quality 8-9</Text>
                  </View>
                </View>
              </View>

              {/* 6. Regulatory & Trading Limits */}
              <View style={styles.matrixSection}>
                <View style={styles.matrixSectionHeader}>
                  <Text style={styles.matrixSectionTitle}>🏛️ 6. BSEC REGULATORY STATUS & TRADING PARAMETERS</Text>
                </View>
                <View style={styles.matrixTable}>
                  <View style={styles.matrixRowHeader}>
                    <Text style={[styles.mTh, { flex: 1.4 }]}>REGULATORY PARAMETER</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTh, { flex: 1, textAlign: 'center' }]}>
                        {d.stock.symbol}
                      </Text>
                    ))}
                    <Text style={[styles.mTh, { flex: 1.2 }]}>BSEC COMPLIANCE</Text>
                  </View>

                  {/* DSE Category */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>DSE Category</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center', fontWeight: '800' }]}>
                        Category {d.regulatory.category}
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Dividend Category</Text>
                  </View>

                  {/* Margin Eligibility */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Margin Loan Eligibility</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center', color: d.regulatory.marginLoanEligibility ? '#16A34A' : '#EF4444', fontWeight: '800' }]}>
                        {d.regulatory.marginLoanEligibility ? 'Eligible' : 'Restricted'}
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Margin Financing</Text>
                  </View>

                  {/* Haircut */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>Margin Haircut (%)</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center' }]}>
                        {d.regulatory.marginHaircutPercent}%
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Collateral Discount</Text>
                  </View>

                  {/* 30% Sponsor Rule */}
                  <View style={styles.matrixRow}>
                    <Text style={[styles.mTdLabel, { flex: 1.4 }]}>30% Sponsor Rule</Text>
                    {stockAnalyses.map((d) => (
                      <Text key={d.stock.symbol} style={[styles.mTdVal, { flex: 1, textAlign: 'center', color: d.shareholding.bsec30PercentRuleCompliant ? '#16A34A' : '#EF4444', fontWeight: '800' }]}>
                        {d.shareholding.bsec30PercentRuleCompliant ? '✅ Compliant' : '⚠️ Non-Compliant'}
                      </Text>
                    ))}
                    <Text style={[styles.mTdNote, { flex: 1.2 }]}>Mandatory 30%</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Action Controls */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.bottomPrintBtn}
                onPress={handlePrintComparisonPdf}
                activeOpacity={0.8}
              >
                <Ionicons name="print-outline" size={18} color="#FFFFFF" />
                <Text style={styles.bottomPrintBtnText}>🖨️ Print / Save Comparison PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bottomCloseBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.bottomCloseBtnText}>Close Comparison</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 1040,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badgeCount: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  printBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  presetsCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 12,
  },
  presetsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  winnerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 14,
  },
  winnerText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#166534',
  },
  winnerSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  winnerRankPill: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  winnerRankText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stockCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  stockCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 14,
  },
  stockCardWinner: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  cardSymbol: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  exchangeBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  exchangeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
  },
  winnerBadgeMini: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  winnerBadgeMiniText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#166534',
  },
  cardName: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  cardSector: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#0284C7',
    marginTop: 1,
  },
  removeStockBtn: {
    padding: 4,
  },
  cardLtp: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  cardChange: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardAiScoreBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  cardAiScoreNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#16A34A',
  },
  cardAiScoreLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cardFooterLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  cardFooterVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  recBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  recBuy: {
    backgroundColor: '#DCFCE7',
  },
  recHold: {
    backgroundColor: '#FEF3C7',
  },
  recBadgeSmallText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#166534',
  },
  viewDeepDiveBtn: {
    marginTop: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  viewDeepDiveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  addStockSlot: {
    flex: 1,
    minWidth: 220,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  addStockSlotText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 6,
    marginBottom: 2,
  },
  pickerContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 14,
  },
  pickerStockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  matrixSection: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  matrixSectionHeader: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  matrixSectionTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0369A1',
    letterSpacing: 0.3,
  },
  matrixTable: {
    backgroundColor: '#FFFFFF',
  },
  matrixRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mTh: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mTdLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  mTdVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  mTdNote: {
    fontSize: 10.5,
    color: '#64748B',
  },
  winnerCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 4,
  },
  winnerCellActive: {
    backgroundColor: '#DCFCE7',
  },
  winnerTextVal: {
    color: '#166534',
    fontWeight: '900',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bottomPrintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  bottomPrintBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bottomCloseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  bottomCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});
