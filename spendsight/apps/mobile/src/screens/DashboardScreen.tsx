import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  colors,
  font,
  fontSize,
  spacing,
  radius,
  shadow,
} from "../utils/theme";
import { formatCurrency } from "../utils/formatCurrency";
import { useAuthStore } from "../store/authStore";
import { useTransactions } from "../hooks/useTransactions";
import { useInsights } from "../hooks/useInsights";
import { Period } from "../store/transactionStore";

// ✅ Fixed: Import Insight type from useInsights (single source of truth)
// No longer importing from InsightCard to avoid circular imports
import type { Insight } from "../hooks/useInsights";
import InsightCard from "../components/InsightCard";

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────
const PERIOD_LABELS: Record<Period, string> = {
  today: "Total spent today",
  week: "Total spent this week",
  month: "Total spent this month",
};

const CAT_BG: Record<string, string> = {
  "Food & Dining": "#FFF4E6",
  Shopping: "#F3E8FF",
  Travel: "#E8F4FD",
  Utilities: "#E8FDF4",
  Entertainment: "#FFF8E1",
  Health: "#FEE8E8",
  Education: "#EEF2FF",
  Groceries: "#F0FDF4",
  Subscriptions: "#E0F2FE",
  Transfers: "#F3F4F6",
  Other: "#F8F9FC",
};

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────
export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();

  const {
    transactions,
    totals,
    period,
    isLoading,
    fetchTransactions,
    changePeriod,
  } = useTransactions();

  // ✅ Fixed: markRead now comes from useInsights
  // No need to call apiClient directly in Dashboard
  const {
    insights,
    isLoading: insightsLoading,
    fetchInsights,
    markRead,
  } = useInsights();

  const [refreshing, setRefreshing] = useState(false);

  // ─────────────────────────────────────
  // Generate insights (debug button)
  // ─────────────────────────────────────
  // ✅ Change: Renamed from runInsights to refreshInsights
  // No longer calls /api/admin/run-insights
  // Simply re-fetches the latest insights from the DB
  const refreshInsights = async () => {
    try {
      await fetchInsights();

      Alert.alert("Insights Updated", "Latest spending analysis loaded.");
    } catch (err) {
      Alert.alert("Error", "Unable to refresh insights.");
    }
  };

  // ─────────────────────────────────────
  // On mount: load everything
  // ─────────────────────────────────────
  useEffect(() => {
    fetchTransactions();
    fetchInsights();

    // ✅ Step 8: Load unread count on mount
    fetchUnreadCount();
  }, []);

  // ─────────────────────────────────────
  // Pull to refresh: reload everything
  // ─────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTransactions(),
      fetchInsights(),

      // ✅ Step 8: Also refresh badge on pull-to-refresh
      fetchUnreadCount(),
    ]);
    setRefreshing(false);
  }, [fetchTransactions, fetchInsights, fetchUnreadCount]);

  // ─────────────────────────────────────
  // Category totals
  // ─────────────────────────────────────
  const categoryTotals = transactions
    .filter((tx) => tx.type === "debit" && tx.status !== "failed")
    .reduce(
      (
        acc: Record<
          string,
          {
            name: string;
            icon: string;
            total: number;
            bg: string;
          }
        >,
        tx,
      ) => {
        const cat = tx.categoryId;
        if (!cat) return acc;

        if (!acc[cat._id]) {
          acc[cat._id] = {
            name: cat.name,
            icon: cat.icon,
            total: 0,
            bg: CAT_BG[cat.name] || "#F3F4F6",
          };
        }

        acc[cat._id].total += tx.amount;
        return acc;
      },
      {},
    );

  const topCategories = Object.values(categoryTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  // ─────────────────────────────────────
  // Insight press → mark as read
  // ✅ Fixed: Uses markRead from useInsights
  // which does optimistic local update
  // No extra fetchInsights() call needed
  // ─────────────────────────────────────
  const handleInsightPress = useCallback(
    async (insight: Insight) => {
      if (!insight._id || insight.readAt) return;
      await markRead(insight._id);
    },
    [markRead],
  );

  // ─────────────────────────────────────
  // Render
  // ─────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>Hi, {user?.name || "there"} 👋</Text>
          </View>

          {/* ✅ Step 8: Notification bell with unread badge */}
          {/* Tapping navigates to Notifications screen     */}
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Text style={styles.notifIcon}>🔔</Text>

            {/* ✅ Badge: only shown when unreadCount > 0 */}
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {/* ✅ Cap display at 99+ to avoid overflow */}
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Period tabs ── */}
        <View style={styles.tabsRow}>
          {(["today", "week", "month"] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.tab, period === p && styles.tabActive]}
              onPress={() => changePeriod(p)}
            >
              <Text
                style={[styles.tabText, period === p && styles.tabTextActive]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Main spend card ── */}
        <View style={[styles.spendCard, shadow.strong]}>
          {isLoading ? (
            <ActivityIndicator
              color="#FFF"
              size="large"
              style={{ padding: spacing.xl }}
            />
          ) : (
            <>
              <Text style={styles.spendLabel}>{PERIOD_LABELS[period]}</Text>
              <Text style={styles.spendAmount}>
                ₹{(totals.spent / 100).toLocaleString("en-IN")}
              </Text>
              {totals.received > 0 && (
                <View style={styles.receivedPill}>
                  <Text style={styles.receivedText}>
                    ↑ {formatCurrency(totals.received)} received
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Change #7: Section header with count ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            Smart Insights{" "}
            {insights.length > 0 && (
              <Text style={styles.insightCount}>({insights.length})</Text>
            )}
          </Text>
        </View>

        {/* ── Change #4: Horizontal FlatList ── */}
        {insightsLoading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginBottom: spacing.md }}
          />
        ) : insights.length > 0 ? (
          <FlatList
            horizontal
            data={insights}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id ?? item.type}
            contentContainerStyle={styles.insightListContent}
            renderItem={({ item }) => (
              <InsightCard insight={item} onPress={handleInsightPress} />
            )}
          />
        ) : (
          // Fallback: no insights yet
          <View style={[styles.insightEmpty, shadow.card]}>
            <Text style={{ fontSize: 26 }}>💡</Text>
            <Text style={styles.insightEmptyText}>
              Add your first transaction to see insights here.
            </Text>
          </View>
        )}

        {/* ── Debug button ── */}
        <TouchableOpacity onPress={refreshInsights} style={styles.debugButton}>
          <Text style={styles.debugButtonText}>Refresh Insights</Text>
        </TouchableOpacity>

        {/* ── Category breakdown ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
            <Text style={styles.sectionLink}>VIEW DETAILS</Text>
          </TouchableOpacity>
        </View>

        {topCategories.length > 0 ? (
          <View style={[styles.categoryCard, shadow.card]}>
            {topCategories.map((cat, i) => (
              <View key={`${cat.name}-${i}`}>
                <View style={styles.catRow}>
                  <View
                    style={[
                      styles.catIconWrap,
                      {
                        backgroundColor: cat.bg,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 22,
                      }}
                    >
                      {cat.icon}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{cat.name}</Text>
                  </View>
                  <Text style={styles.catAmount}>
                    {formatCurrency(cat.total)}
                  </Text>
                </View>

                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          (cat.total / (totals.spent || 1)) * 100,
                          100,
                        )}%` as any,
                      },
                    ]}
                  />
                </View>

                {i < topCategories.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        ) : (
          !isLoading && (
            <View style={[styles.emptyCard, shadow.card]}>
              <Text style={{ fontSize: 36 }}>📊</Text>
              <Text style={styles.emptyText}>No spending data yet</Text>
              <Text style={styles.emptySub}>
                Add a transaction to see breakdown
              </Text>
            </View>
          )
        )}

        {/* ── Recent activity ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
            <Text style={styles.sectionLink}>SEE ALL</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 && !isLoading ? (
          <View style={[styles.emptyCard, shadow.card]}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first spend</Text>
          </View>
        ) : (
          <View style={[styles.recentCard, shadow.card]}>
            {transactions.slice(0, 5).map((tx, i) => (
              <View key={tx._id || `${tx.merchantRaw}-${i}`}>
                <View style={styles.txRow}>
                  <View
                    style={[
                      styles.txIconWrap,
                      {
                        backgroundColor:
                          CAT_BG[tx.categoryId?.name || ""] || "#F3F4F6",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 22,
                      }}
                    >
                      {tx.categoryId?.icon || "💰"}
                    </Text>
                  </View>

                  <View style={styles.txInfo}>
                    <Text style={styles.txMerchant} numberOfLines={1}>
                      {tx.merchantNormalised || tx.merchantRaw || "Transaction"}
                    </Text>
                    <Text style={styles.txMeta}>
                      {tx.categoryId?.name || "Uncategorised"}
                    </Text>
                  </View>

                  <View style={styles.txRight}>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color:
                            tx.type === "credit"
                              ? colors.success
                              : colors.textPrimary,
                        },
                      ]}
                    >
                      {tx.type === "credit" ? "+" : ""}
                      {formatCurrency(tx.amount)}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            tx.type === "credit"
                              ? colors.successLight
                              : colors.borderLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              tx.type === "credit"
                                ? colors.success
                                : colors.textMuted,
                          },
                        ]}
                      >
                        {tx.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {i < Math.min(transactions.length, 5) - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, shadow.fab]}
        onPress={() => navigation.navigate("AddTransaction")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  greeting: {
    fontFamily: font.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  userName: {
    fontFamily: font.extrabold,
    fontSize: 26,
    color: colors.textPrimary,
    marginTop: 2,
  },

  // ✅ Step 8: Bell button — position relative
  // so badge can be absolutely positioned on top
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
  },
  notifIcon: { fontSize: 20 },

  // ✅ Step 8: Red badge — top-right corner of bell
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,

    // White border so badge floats above the button clearly
    borderWidth: 1.5,
    borderColor: colors.cardBackground,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: font.bold,
    lineHeight: 13,
  },

  // Period tabs
  tabsRow: {
    flexDirection: "row",
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.full,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: {
    fontFamily: font.semibold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  tabTextActive: { color: "#FFFFFF" },

  // Spend card
  spendCard: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    minHeight: 140,
    justifyContent: "center",
  },
  spendLabel: {
    fontFamily: font.medium,
    fontSize: fontSize.md,
    color: "rgba(255,255,255,0.75)",
    marginBottom: spacing.xs,
  },
  spendAmount: {
    fontFamily: font.extrabold,
    fontSize: 52,
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  receivedPill: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  receivedText: {
    fontFamily: font.semibold,
    fontSize: fontSize.xs,
    color: "#FFFFFF",
  },

  // Change #7: insight count style
  insightCount: {
    fontFamily: font.regular,
    fontSize: fontSize.lg,
    color: colors.textMuted,
  },

  // Change #4: FlatList padding
  insightListContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },

  // Insight empty fallback
  insightEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  insightEmptyText: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Section headers
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: font.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  sectionLink: {
    fontFamily: font.bold,
    fontSize: fontSize.xs,
    color: colors.primary,
    letterSpacing: 0.5,
  },

  // Category card
  categoryCard: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  catName: {
    fontFamily: font.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  catAmount: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  progressBg: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 52,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },

  // Recent card
  recentCard: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  txIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  txInfo: { flex: 1 },
  txMerchant: {
    fontFamily: font.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  txMeta: {
    fontFamily: font.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  txRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  txAmount: {
    fontFamily: font.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  statusText: {
    fontFamily: font.semibold,
    fontSize: 10,
    letterSpacing: 0.3,
  },

  // Empty states
  emptyCard: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  emptyText: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  emptySub: {
    fontFamily: font.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 96,
    right: spacing.screenPadding,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: font.regular,
    lineHeight: 36,
    textAlign: "center",
  },

  // Debug
  debugButton: {
    backgroundColor: "#0A1172",
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  debugButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: font.bold,
    fontSize: fontSize.md,
  },
});
