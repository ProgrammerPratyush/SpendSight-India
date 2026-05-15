import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
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
import { getGreeting } from "../utils/dateHelpers";
import { useAuthStore } from "../store/authStore";
import { useTransactions } from "../hooks/useTransactions";
import { useInsights } from "../hooks/useInsights";
import { Period } from "../store/transactionStore";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Total spent today",
  week: "Total spent this week",
  month: "Total spent this month",
};

const CAT_ICON_BG: Record<string, string> = {
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
  const { insights, fetchInsights } = useInsights();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchInsights();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTransactions(), fetchInsights()]);
    setRefreshing(false);
  }, []);

  const categoryTotals = transactions
    .filter((tx) => tx.type === "debit" && tx.status !== "failed")
    .reduce((acc: Record<string, any>, tx) => {
      const cat = tx.categoryId;
      if (!cat) return acc;
      if (!acc[cat._id]) {
        acc[cat._id] = {
          name: cat.name,
          icon: cat.icon,
          total: 0,
          bg: CAT_ICON_BG[cat.name] || "#F3F4F6",
        };
      }
      acc[cat._id].total += tx.amount;
      return acc;
    }, {});

  const topCategories = Object.values(categoryTotals)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 4);
  const topInsight = insights[0];

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
        {/* Header */}
        {/* Header */}
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>Hi, {user?.name || "there"} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Text style={styles.notifBell}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Period tabs */}
        <View style={styles.tabsWrap}>
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

        {/* Main spend card */}
        <View style={[styles.spendCard, shadow.strong]}>
          {isLoading ? (
            <ActivityIndicator
              color="#FFF"
              size="large"
              style={{ padding: 24 }}
            />
          ) : (
            <>
              <Text style={styles.spendLabel}>{PERIOD_LABELS[period]}</Text>
              <Text style={styles.spendAmount}>
                ₹{(totals.spent / 100).toLocaleString("en-IN")}
              </Text>
              {totals.received > 0 && (
                <View style={styles.receivedRow}>
                  <Text style={styles.receivedText}>
                    ↑ {formatCurrency(totals.received)} received
                  </Text>
                </View>
              )}
            </>
          )}
          <View style={styles.cardIconBg}>
            <Text style={{ fontSize: 64, opacity: 0.08 }}>₹</Text>
          </View>
        </View>

        {/* Insight card */}
        {topInsight ? (
          <View style={[styles.insightCard, shadow.card]}>
            <View style={styles.insightIconWrap}>
              <Text style={{ fontSize: 20 }}>💡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>Smart Insight</Text>
              <Text style={styles.insightText}>{topInsight.text}</Text>
            </View>
          </View>
        ) : (
          !isLoading && (
            <View style={[styles.insightCard, shadow.card]}>
              <View style={styles.insightIconWrap}>
                <Text style={{ fontSize: 20 }}>💡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>Smart Insight</Text>
                <Text style={styles.insightText}>
                  Add your first transaction to see insights here.
                </Text>
              </View>
            </View>
          )
        )}

        {/* Category breakdown */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
            <Text style={styles.sectionLink}>VIEW DETAILS</Text>
          </TouchableOpacity>
        </View>

        {topCategories.length > 0 ? (
          <View style={[styles.categoryCard, shadow.card]}>
            {topCategories.map((cat: any, i: number) => (
              <View key={cat.name}>
                <View style={styles.catRow}>
                  <View
                    style={[styles.catIconWrap, { backgroundColor: cat.bg }]}
                  >
                    <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                  </View>
                  <View style={styles.catInfo}>
                    <Text style={styles.catName}>{cat.name}</Text>
                  </View>
                  <Text style={styles.catAmount}>
                    {formatCurrency(cat.total)}
                  </Text>
                </View>
                {/* Progress bar */}
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width:
                          `${Math.min((cat.total / (totals.spent || 1)) * 100, 100)}%` as any,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                {i < topCategories.length - 1 && (
                  <View style={styles.catDivider} />
                )}
              </View>
            ))}
          </View>
        ) : (
          !isLoading && (
            <View style={[styles.emptyCategories, shadow.card]}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No spending data yet</Text>
              <Text style={styles.emptySubText}>
                Add a transaction to see breakdown
              </Text>
            </View>
          )
        )}

        {/* Recent activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
            <Text style={styles.sectionLink}>SEE ALL</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 && !isLoading ? (
          <View style={[styles.emptyCategories, shadow.card]}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubText}>
              Tap + to add your first spend
            </Text>
          </View>
        ) : (
          <View style={[styles.recentCard, shadow.card]}>
            {transactions.slice(0, 5).map((tx, i) => (
              <View key={tx._id}>
                <View style={styles.txRow}>
                  <View
                    style={[
                      styles.txIconWrap,
                      {
                        backgroundColor:
                          CAT_ICON_BG[tx.categoryId?.name || ""] || "#F3F4F6",
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>
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
                        styles.statusBadge,
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
                  <View style={styles.catDivider} />
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, shadow.fab]}
        onPress={() => navigation.navigate("AddTransaction")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  welcomeText: {
    fontFamily: font.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  userName: {
    fontFamily: font.extrabold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifBell: {
    fontSize: 18,
  },
  tabsWrap: {
    flexDirection: "row",
    marginHorizontal: spacing.screenPadding,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: radius.full,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: {
    fontFamily: font.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tabTextActive: { color: "#FFFFFF" },
  spendCard: {
    margin: spacing.screenPadding,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: "hidden",
    minHeight: 120,
  },
  spendLabel: {
    fontFamily: font.medium,
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.7)",
  },
  spendAmount: {
    fontFamily: font.extrabold,
    fontSize: fontSize.hero,
    color: "#FFFFFF",
    marginTop: 4,
  },
  receivedRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  receivedText: {
    fontFamily: font.semibold,
    fontSize: fontSize.xs,
    color: "#FFFFFF",
  },
  cardIconBg: { position: "absolute", right: -10, top: -10 },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: spacing.screenPadding,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    // shadow
    shadowColor: "#000B60",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  insightIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  insightTitle: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    color: colors.accent,
  },
  insightText: {
    fontFamily: font.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  sectionHeader: {
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
  categoryCard: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  catRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  catIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  catInfo: { flex: 1 },
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
    marginTop: spacing.xs,
    marginLeft: 52,
  },
  progressFill: { height: "100%", borderRadius: radius.full },
  catDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
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
    width: 44,
    height: 44,
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
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontFamily: font.bold, fontSize: fontSize.md },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  statusText: { fontFamily: font.semibold, fontSize: 9, letterSpacing: 0.3 },
  emptyCategories: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyIcon: { fontSize: 36, marginBottom: spacing.sm },
  emptyText: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  emptySubText: {
    fontFamily: font.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    bottom: 90, // was 100, now sits above tab bar cleanly
    right: spacing.screenPadding,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000B60",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: font.regular,
    lineHeight: 32,
    textAlign: "center",
  },
});
