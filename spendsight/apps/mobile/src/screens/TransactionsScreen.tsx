import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swipeable from "react-native-gesture-handler/Swipeable";
import {
  colors,
  font,
  fontSize,
  spacing,
  radius,
  shadow,
} from "../utils/theme";
import { formatCurrency } from "../utils/formatCurrency";
import { formatTransactionDate } from "../utils/dateHelpers";
import { useTransactions } from "../hooks/useTransactions";
import { Transaction } from "../store/transactionStore";
import apiClient from "../services/apiClient";

const CAT_BG: Record<string, string> = {
  "Food & Dining": "#FFF4E6",
  Shopping: "#F3E8FF",
  Travel: "#E8F4FD",
  Utilities: "#E8FDF4",
  Entertainment: "#FFF8E1",
  Health: "#FEE8E8",
  Groceries: "#F0FDF4",
  Subscriptions: "#E0F2FE",
  Other: "#F8F9FC",
};

interface Category {
  _id: string;
  name: string;
  icon: string;
  color?: string;
}

export default function TransactionsScreen({ navigation }: any) {
  const {
    transactions,
    totals,
    period,
    isLoading,
    fetchTransactions,
    changePeriod,
  } = useTransactions();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchTransactions();
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await apiClient.get("/api/categories");
      setCategories(res.data.data.categories || []);
    } catch (err) {
      console.log("Failed to load categories:", err);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([fetchTransactions(), loadCategories()]);
    setRefreshing(false);
  }

  function handleDelete(id: string) {
    Alert.alert("Delete Transaction", "This action cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/api/transactions/${id}`);
            await fetchTransactions();
          } catch (err) {
            Alert.alert("Error", "Failed to delete transaction");
          }
        },
      },
    ]);
  }

  const renderLeftActions = (tx: Transaction) => (
    <TouchableOpacity
      style={styles.editAction}
      onPress={() =>
        navigation.navigate("EditTransaction", {
          transaction: tx,
        })
      }
    >
      <Text style={styles.actionText}>✏️ Edit</Text>
    </TouchableOpacity>
  );

  const renderRightActions = (tx: Transaction) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => handleDelete(tx._id)}
    >
      <Text style={styles.actionText}>🗑 Delete</Text>
    </TouchableOpacity>
  );

  // Generate dynamic filters
  const filters = ["All", ...categories.map((c) => c.name)];

  const filtered = transactions.filter((tx) => {
    const matchSearch = (tx.merchantNormalised || tx.merchantRaw || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchFilter =
      activeFilter === "All" || tx.categoryId?.name === activeFilter;
    return matchSearch && matchFilter;
  });

  // Group by date
  const grouped = filtered.reduce((acc: Record<string, Transaction[]>, tx) => {
    const label = formatTransactionDate(tx.txDate);
    if (!acc[label]) acc[label] = [];
    acc[label].push(tx);
    return acc;
  }, {});

  const groupedArray = Object.entries(grouped).map(([date, txs]) => ({
    date,
    total: txs
      .filter((t) => t.type === "debit")
      .reduce((s, t) => s + t.amount, 0),
    txs,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>SpendSight</Text>
          <Text style={styles.title}>Transactions</Text>
          <Text style={styles.subtitle}>Review your spending patterns</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item}
          contentContainerStyle={{ gap: spacing.xs }}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === f && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={groupedArray}
        keyExtractor={(item) => item.date}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: spacing.screenPadding,
          paddingBottom: 100,
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>📭</Text>
            <Text style={styles.emptyText}>
              {search ? "No results" : "No transactions yet"}
            </Text>
          </View>
        }
        renderItem={({ item: group }) => (
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupDate}>{group.date.toUpperCase()}</Text>
              <Text style={styles.groupTotal}>
                {formatCurrency(group.total)} Total
              </Text>
            </View>
            <View style={[styles.groupCard, shadow.card]}>
              {group.txs.map((tx, i) => (
                <View key={tx._id}>
                  <Swipeable
                    renderLeftActions={() => renderLeftActions(tx)}
                    renderRightActions={() => renderRightActions(tx)}
                  >
                    <TouchableOpacity
                      style={styles.txRow}
                      onPress={() =>
                        navigation.navigate("TransactionDetail", {
                          transactionId: tx._id,
                        })
                      }
                    >
                      <View
                        style={[
                          styles.txIcon,
                          {
                            backgroundColor:
                              CAT_BG[tx.categoryId?.name || ""] || "#F3F4F6",
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>
                          {tx.categoryId?.icon || "💰"}
                        </Text>
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txMerchant} numberOfLines={1}>
                          {tx.merchantNormalised ||
                            tx.merchantRaw ||
                            "Transaction"}
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
                          {tx.type === "credit" ? "+" : ""}₹
                          {(tx.amount / 100).toLocaleString("en-IN")}
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
                    </TouchableOpacity>
                  </Swipeable>
                  {i < group.txs.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}
      />

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
    alignItems: "flex-start",
    padding: spacing.screenPadding,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appName: {
    fontFamily: font.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  title: {
    fontFamily: font.extrabold,
    fontSize: fontSize.xxxl,
    color: colors.textPrimary,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: font.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  filterRow: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: font.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  filterTextActive: { color: "#FFFFFF" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    padding: spacing.sm,
    fontFamily: font.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  group: { marginBottom: spacing.md },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  groupDate: {
    fontFamily: font.bold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  groupTotal: {
    fontFamily: font.semibold,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  groupCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.cardBackground,
  },
  txIcon: {
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
  txRight: { alignItems: "flex-end", gap: 3 },
  txAmount: { fontFamily: font.bold, fontSize: fontSize.md },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  statusText: { fontFamily: font.semibold, fontSize: 9, letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 60 },
  empty: { alignItems: "center", paddingTop: 60, gap: spacing.sm },
  emptyText: {
    fontFamily: font.semibold,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: spacing.screenPadding,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: font.regular,
    marginTop: -2,
  },
  // Swipe action styles
  editAction: {
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    marginVertical: 1,
  },
  deleteAction: {
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    marginVertical: 1,
  },
  actionText: {
    color: "#FFFFFF",
    fontFamily: font.bold,
    fontSize: fontSize.sm,
  },
});
