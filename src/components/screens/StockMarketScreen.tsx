import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { GlassCard } from '../shared/GlassCard';
import { StockHolding, StockExchange, calculateStockHoldingMetrics } from '../../finance/stocks';

interface StockMarketScreenProps {
  stocks: StockHolding[];
  onAddStockPress: () => void;
  onDeleteStock: (id: string) => void;
  onUpdatePrice: (id: string, newPrice: number) => void;
}

export const StockMarketScreen: React.FC<StockMarketScreenProps> = ({
  stocks,
  onAddStockPress,
  onDeleteStock,
  onUpdatePrice,
}) => {
  const [filterExchange, setFilterExchange] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPriceInput, setEditPriceInput] = useState('');

  const filteredStocks = stocks.filter((s) => {
    if (filterExchange === 'all') return true;
    return s.exchange.toLowerCase() === filterExchange.toLowerCase();
  });

  // Calculate totals
  let totalInvested = 0;
  let totalCurrentValue = 0;
  for (const s of stocks) {
    totalInvested += s.quantity * s.buyPrice;
    totalCurrentValue += s.quantity * s.currentPrice;
  }
  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalGainLossPct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
  const isProfitable = totalGainLoss >= 0;

  const handleStartEdit = (stock: StockHolding) => {
    setEditingId(stock.id);
    setEditPriceInput(stock.currentPrice.toString());
  };

  const handleSavePrice = (id: string) => {
    const parsed = parseFloat(editPriceInput);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdatePrice(id, parsed);
    }
    setEditingId(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Executive Portfolio Header */}
      <GlassCard style={styles.summaryCard} padding={20} glowColor={isProfitable ? Colors.success : Colors.danger}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>EQUITY & STOCK PORTFOLIO VALUATION</Text>
            <Text style={styles.summaryAmount}>৳ {totalCurrentValue.toLocaleString('en-IN')}</Text>
            <Text style={styles.summarySub}>
              Invested Capital: ৳ {totalInvested.toLocaleString('en-IN')} • {stocks.length} Holdings
            </Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={onAddStockPress} activeOpacity={0.85}>
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>+ Add Stock</Text>
          </TouchableOpacity>
        </View>

        {/* P&L Performance Pill Bar */}
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

      {/* Exchange Filter Pills */}
      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'All Exchanges' },
          { id: 'dse', label: '🏛️ DSE (Dhaka)' },
          { id: 'cse', label: '🏛️ CSE (Chittagong)' },
          { id: 'global', label: '🌐 Global' },
        ].map((btn) => (
          <TouchableOpacity
            key={btn.id}
            style={[styles.filterBtn, filterExchange === btn.id && styles.filterBtnActive]}
            onPress={() => setFilterExchange(btn.id)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterBtnText, filterExchange === btn.id && styles.filterBtnTextActive]}>
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stock Holdings List */}
      {filteredStocks.length === 0 ? (
        <GlassCard style={styles.emptyCard} padding={32}>
          <Ionicons name="trending-up-outline" size={48} color="#0284C7" />
          <Text style={styles.emptyTitle}>No Stock Holdings Recorded</Text>
          <Text style={styles.emptySubtitle}>
            Track your Dhaka Stock Exchange (DSE), CSE, and global equities with real-time profit and loss calculations.
          </Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddStockPress} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.emptyAddBtnText}>Record Your First Stock</Text>
          </TouchableOpacity>
        </GlassCard>
      ) : (
        <View style={styles.stockList}>
          {filteredStocks.map((stock) => {
            const metrics = calculateStockHoldingMetrics(stock);
            const isEditing = editingId === stock.id;

            return (
              <GlassCard
                key={stock.id}
                style={styles.stockCard}
                padding={18}
                glowColor={metrics.isProfitable ? Colors.success : Colors.danger}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.tickerBadge}>
                      <Text style={styles.tickerText}>{stock.symbol}</Text>
                    </View>
                    <View>
                      <Text style={styles.stockName}>{stock.companyName}</Text>
                      <Text style={styles.stockSector}>
                        {stock.exchange} • {stock.sector || 'Equities'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.gainBadge,
                      {
                        backgroundColor: metrics.isProfitable
                          ? 'rgba(22, 163, 74, 0.14)'
                          : 'rgba(239, 68, 68, 0.14)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.gainBadgeText,
                        { color: metrics.isProfitable ? Colors.success : Colors.danger },
                      ]}
                    >
                      {metrics.isProfitable ? '▲ +' : '▼ −'}
                      {Math.abs(metrics.gainLossPercent).toFixed(2)}%
                    </Text>
                  </View>
                </View>

                {/* Metrics Grid */}
                <View style={styles.metricGrid}>
                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>SHARES OWNED</Text>
                    <Text style={styles.gridVal}>{stock.quantity.toLocaleString('en-IN')} shares</Text>
                  </View>

                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>AVG BUY PRICE</Text>
                    <Text style={styles.gridVal}>৳ {stock.buyPrice.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>CURRENT MARKET PRICE</Text>
                    {isEditing ? (
                      <View style={styles.editPriceRow}>
                        <TextInput
                          style={styles.priceInput}
                          keyboardType="numeric"
                          value={editPriceInput}
                          onChangeText={setEditPriceInput}
                          autoFocus
                        />
                        <TouchableOpacity
                          style={styles.savePriceBtn}
                          onPress={() => handleSavePrice(stock.id)}
                        >
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.priceClickable}
                        onPress={() => handleStartEdit(stock)}
                      >
                        <Text style={[styles.gridVal, { color: '#0284C7' }]}>
                          ৳ {stock.currentPrice.toLocaleString('en-IN')} ✏️
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>CURRENT VALUATION</Text>
                    <Text style={[styles.gridVal, { fontWeight: '900' }]}>
                      ৳ {metrics.current.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Footer P&L breakdown & delete */}
                <View style={styles.cardFooter}>
                  <Text style={styles.footerInvestedText}>
                    Invested: ৳ {metrics.invested.toLocaleString('en-IN')} | Unrealized Return:{' '}
                    <Text
                      style={{
                        color: metrics.isProfitable ? Colors.success : Colors.danger,
                        fontWeight: '800',
                      }}
                    >
                      {metrics.isProfitable ? '+' : '−'}৳ {Math.abs(metrics.gainLoss).toLocaleString('en-IN')}
                    </Text>
                  </Text>

                  <TouchableOpacity
                    onPress={() => onDeleteStock(stock.id)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}
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
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A', // Green Action Button
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pnlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    padding: 12,
  },
  pnlItem: {
    flex: 1,
    alignItems: 'center',
  },
  vLine: {
    width: 1.5,
    height: 32,
    backgroundColor: '#BAE6FD',
  },
  pnlLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  pnlVal: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  filterBtnActive: {
    backgroundColor: '#16A34A', // Green Active Button
    borderColor: '#16A34A',
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 400,
    marginTop: 4,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: Radius.full,
    marginTop: Spacing.lg,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stockList: {
    gap: Spacing.md,
  },
  stockCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tickerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  tickerText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  stockName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  stockSector: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  gainBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  gainBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: Spacing.md,
  },
  gridCol: {
    width: '47%',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  gridVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  priceClickable: {
    marginTop: 2,
  },
  editPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  priceInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: '700',
    width: 80,
    color: '#0F172A',
  },
  savePriceBtn: {
    backgroundColor: '#16A34A',
    padding: 6,
    borderRadius: Radius.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: Spacing.sm,
  },
  footerInvestedText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});
