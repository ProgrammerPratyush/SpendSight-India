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
import {
  colors,
  font,
  fontSize,
  spacing,
  radius,
  shadow,
} from "../utils/theme";
import { formatCurrency } from "../utils/formatCurrency";
import { useBudget } from "../hooks/useBudget";
import { useTransactions } from "../hooks/useTransactions";

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

  function openModal() {
    setLimitAmount("");
    setAlertAt("80");
    setShowModal(true);
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
    } else {
      Alert.alert("Error", "Could not save budget. Please try again.");
    }
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert(`Delete Budget`, `Remove "${name}" budget?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteBudget(id),
      },
    ]);
  }

  function getProgress(budget: any) {
    const spent = totals.spent;
    const limit = budget.limitAmount;
    const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const remaining = limit - spent;
    return { spent, pct, remaining };
  }

  function progressColor(pct: number) {
    if (pct >= 100) return colors.danger;
    if (pct >= 80) return colors.warning;
    return colors.accent;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>Set limits, stay in control</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={openModal}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading && !refreshing ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : budgets.length === 0 ? (
          <View style={[styles.emptyCard, shadow.card]}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No budgets yet</Text>
            <Text style={styles.emptySub}>
              Set a monthly limit to stay on track with your spending.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, shadow.card]}
              onPress={openModal}
            >
              <Text style={styles.emptyBtnText}>Set Your First Budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          budgets.map((budget) => {
            const { spent, pct, remaining } = getProgress(budget);
            const color = progressColor(pct);
            const label = budget.categoryId
              ? (budget.categoryId as any).name
              : "Total Monthly Budget";

            return (
              <View key={budget._id} style={[styles.budgetCard, shadow.card]}>
                {/* Top row */}
                <View style={styles.budgetTop}>
                  <View style={styles.budgetLabelWrap}>
                    <Text style={styles.budgetLabel}>{label}</Text>
                    <Text style={styles.budgetMeta}>
                      Monthly · Alert at {budget.alertAt}%
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteIconBtn}
                    onPress={() => handleDelete(budget._id, label)}
                  >
                    <Text style={styles.deleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Big numbers */}
                <View style={styles.budgetAmounts}>
                  <View>
                    <Text style={styles.budgetLimitLabel}>BUDGET LIMIT</Text>
                    <Text style={styles.budgetLimitValue}>
                      {formatCurrency(budget.limitAmount)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.budgetSpentLabel}>SPENT SO FAR</Text>
                    <Text
                      style={[
                        styles.budgetSpentValue,
                        { color: pct >= 80 ? color : colors.textPrimary },
                      ]}
                    >
                      {formatCurrency(spent)}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${pct}%` as any,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>

                {/* Bottom row */}
                <View style={styles.budgetBottom}>
                  <Text style={styles.pctText}>{Math.round(pct)}% used</Text>
                  <Text
                    style={[
                      styles.remainingText,
                      { color: remaining < 0 ? colors.danger : colors.success },
                    ]}
                  >
                    {remaining < 0
                      ? `${formatCurrency(Math.abs(remaining))} over budget`
                      : `${formatCurrency(remaining)} remaining`}
                  </Text>
                </View>

                {/* Alert bar */}
                {pct >= budget.alertAt && (
                  <View
                    style={[
                      styles.alertBar,
                      {
                        backgroundColor:
                          pct >= 100 ? colors.dangerLight : colors.warningLight,
                      },
                    ]}
                  >
                    <Text style={styles.alertBarText}>
                      {pct >= 100
                        ? "⚠️ You have exceeded your budget"
                        : `⚠️ You are at ${Math.round(pct)}% of your budget`}
                    </Text>
                  </View>
                )}
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
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalSectionLabel}>MONTHLY LIMIT (₹)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupeeSign}>₹</Text>
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

            <Text style={styles.modalSectionLabel}>ALERT ME WHEN I REACH</Text>
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
                💡 You will receive a notification when your spending reaches{" "}
                {alertAt}% of{" "}
                {limitAmount
                  ? `₹${parseFloat(limitAmount).toLocaleString("en-IN")}`
                  : "your budget"}{" "}
                this month.
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
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: font.extrabold,
    fontSize: 28,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: font.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  newBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  newBtnText: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    color: "#FFFFFF",
  },

  scrollContent: {
    padding: spacing.screenPadding,
    gap: spacing.md,
    paddingBottom: 100,
  },

  // Empty state
  emptyCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: {
    fontFamily: font.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  emptySub: {
    fontFamily: font.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  emptyBtnText: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    color: "#FFFFFF",
  },

  // Budget card
  budgetCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  budgetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  budgetLabelWrap: { flex: 1 },
  budgetLabel: {
    fontFamily: font.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  budgetMeta: {
    fontFamily: font.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteIconBtn: { padding: spacing.xs },
  deleteIcon: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
  },

  budgetAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  budgetLimitLabel: {
    fontFamily: font.bold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  budgetLimitValue: {
    fontFamily: font.extrabold,
    fontSize: 28,
    color: colors.textPrimary,
  },
  budgetSpentLabel: {
    fontFamily: font.bold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: "right",
  },
  budgetSpentValue: {
    fontFamily: font.extrabold,
    fontSize: 28,
    color: colors.textPrimary,
  },

  progressBg: {
    height: 10,
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
  },

  budgetBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pctText: {
    fontFamily: font.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  remainingText: {
    fontFamily: font.bold,
    fontSize: fontSize.sm,
  },

  alertBar: {
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  alertBarText: {
    fontFamily: font.semibold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    fontFamily: font.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontFamily: font.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  modalSave: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  modalContent: { padding: spacing.screenPadding },
  modalSectionLabel: {
    fontFamily: font.bold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rupeeSign: {
    fontFamily: font.extrabold,
    fontSize: 32,
    color: colors.primary,
  },
  amountInput: {
    flex: 1,
    fontFamily: font.extrabold,
    fontSize: 40,
    color: colors.textPrimary,
  },

  alertRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  alertChip: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  alertChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  alertChipText: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  alertChipTextActive: { color: "#FFFFFF" },

  infoBox: {
    backgroundColor: "#EFF6FF",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    fontFamily: font.regular,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
