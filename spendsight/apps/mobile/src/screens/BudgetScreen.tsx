import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontSize, spacing, radius, shadow } from "../utils/theme";
import { formatCurrency } from "../utils/formatCurrency";
import { useBudget } from "../hooks/useBudget";
import { useTransactions } from "../hooks/useTransactions";
import apiClient from "../services/apiClient";

export default function BudgetScreen() {
  const { budgets, isLoading, fetchBudgets, createBudget, deleteBudget } =
    useBudget();
  const { totals, fetchTransactions } = useTransactions();
  const [showModal, setShowModal] = useState(false);
  const [limitAmount, setLimitAmount] = useState("");
  const [alertAt, setAlertAt] = useState("80");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBudgets();
    fetchTransactions();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([fetchBudgets(), fetchTransactions()]);
    setRefreshing(false);
  }

  async function handleSave() {
    const amount = parseFloat(limitAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid budget limit.");
      return;
    }
    setSaving(true);
    const result = await createBudget({
      period: "monthly",
      categoryId: null,
      limitAmount: amount,
      alertAt: parseInt(alertAt) || 80,
    });
    setSaving(false);
    if (result.success) {
      setShowModal(false);
      setLimitAmount("");
    } else {
      Alert.alert("Error", "Could not save budget.");
    }
  }

  async function handleDelete(id: string) {
    Alert.alert("Delete Budget", "Remove this budget?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBudget(id);
        },
      },
    ]);
  }

  function getBudgetProgress(budget: any) {
    const spent = totals.spent;
    const limit = budget.limitAmount;
    const pct = Math.min((spent / limit) * 100, 100);
    return { spent, pct };
  }

  function getProgressColor(pct: number) {
    if (pct >= 100) return colors.danger;
    if (pct >= 80) return colors.warning;
    return colors.success;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>Set limits, stay in control</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{
          padding: spacing.screenPadding,
          gap: spacing.md,
          paddingBottom: 100,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : budgets.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>No budgets set yet</Text>
            <Text style={styles.emptySubText}>
              Tap + New to set your first monthly budget
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, shadow.card]}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.emptyBtnText}>Set a Budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          budgets.map((budget) => {
            const { spent, pct } = getBudgetProgress(budget);
            const progressColor = getProgressColor(pct);
            const remaining = budget.limitAmount - spent;

            return (
              <View key={budget._id} style={[styles.budgetCard, shadow.card]}>
                <View style={styles.budgetTop}>
                  <View>
                    <Text style={styles.budgetLabel}>
                      {budget.categoryId
                        ? budget.categoryId.name
                        : "Total Monthly Budget"}
                    </Text>
                    <Text style={styles.budgetPeriod}>
                      {budget.period} · Alert at {budget.alertAt}%
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(budget._id)}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${pct}%` as any,
                        backgroundColor: progressColor,
                      },
                    ]}
                  />
                </View>

                <View style={styles.budgetBottom}>
                  <Text style={styles.spentText}>
                    {formatCurrency(spent)} spent
                  </Text>
                  <Text
                    style={[
                      styles.remainingText,
                      { color: remaining < 0 ? colors.danger : colors.success },
                    ]}
                  >
                    {remaining < 0
                      ? `${formatCurrency(Math.abs(remaining))} over`
                      : `${formatCurrency(remaining)} left`}
                  </Text>
                </View>

                <Text style={styles.limitText}>
                  Limit: {formatCurrency(budget.limitAmount)}
                  {" · "}
                  {Math.round(pct)}% used
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Budget Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Budget</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalLabel}>Monthly limit (Rs)</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.amountPrefix}>Rs</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="10,000"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={limitAmount}
                onChangeText={setLimitAmount}
                autoFocus
              />
            </View>

            <Text style={styles.modalLabel}>Alert me when I reach (%)</Text>
            <View style={styles.alertRow}>
              {["60", "70", "80", "90"].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.alertChip,
                    alertAt === val && styles.alertChipActive,
                  ]}
                  onPress={() => setAlertAt(val)}
                >
                  <Text
                    style={[
                      styles.alertChipText,
                      alertAt === val && styles.alertChipTextActive,
                    ]}
                  >
                    {val}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 You will get a notification when your spending reaches{" "}
                {alertAt}% of Rs {limitAmount || "0"} this month.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.screenPadding,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  addBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: fontSize.sm },
  empty: { alignItems: "center", paddingTop: 80, gap: spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptySubText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  emptyBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: fontSize.md },
  budgetCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  budgetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  budgetLabel: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  budgetPeriod: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    padding: spacing.xs,
  },
  progressBg: {
    height: 10,
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: radius.full },
  budgetBottom: { flexDirection: "row", justifyContent: "space-between" },
  spentText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  remainingText: { fontSize: fontSize.sm, fontWeight: "700" },
  limitText: { fontSize: fontSize.xs, color: colors.textMuted },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  modalCancel: { color: colors.textSecondary, fontSize: fontSize.md },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalSave: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  modalContent: { padding: spacing.screenPadding },
  modalLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  amountPrefix: { fontSize: 28, fontWeight: "800", color: colors.primary },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  alertRow: { flexDirection: "row", gap: spacing.sm },
  alertChip: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  alertChipText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  alertChipTextActive: { color: "#FFFFFF" },
  infoBox: {
    marginTop: spacing.lg,
    backgroundColor: "#EFF6FF",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
