import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  colors,
  font,
  fontSize,
  spacing,
  radius,
  shadow,
} from "../utils/theme";
import { useTransactions } from "../hooks/useTransactions";
import apiClient from "../services/apiClient";
import { format } from "date-fns";

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

const FALLBACK_CATS: Category[] = [
  { _id: "food", name: "Food & Dining", icon: "🍔", color: "#FFF4E6" },
  { _id: "shopping", name: "Shopping", icon: "🛒", color: "#EDE9FE" },
  { _id: "travel", name: "Travel", icon: "🚗", color: "#DBEAFE" },
  { _id: "utilities", name: "Utilities", icon: "⚡", color: "#D1FAE5" },
  { _id: "entertainment", name: "Entertainment", icon: "🎬", color: "#FCE7F3" },
  { _id: "health", name: "Health", icon: "💊", color: "#FEE2E2" },
  { _id: "groceries", name: "Groceries", icon: "🛍️", color: "#ECFDF5" },
  { _id: "subscriptions", name: "Subscriptions", icon: "🔄", color: "#E0F2FE" },
  { _id: "other", name: "Other", icon: "💰", color: "#F9FAFB" },
];

export default function AddTransactionScreen({ navigation }: any) {
  const { createTransaction } = useTransactions();
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATS);
  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [txDate, setTxDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    apiClient
      .get("/api/categories")
      .then((res) => {
        const cats = res.data?.data?.categories || [];
        if (cats.length > 0) setCategories(cats);
      })
      .catch(() => {
        // keep fallback categories
      })
      .finally(() => setLoadingCats(false));
  }, []);

  function formatDateLabel(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return format(date, "d MMM yyyy");
  }

  async function handleSubmit() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid amount greater than 0.",
      );
      return;
    }
    if (!merchant.trim()) {
      Alert.alert("Missing Info", "Please enter the merchant or description.");
      return;
    }

    setLoading(true);
    const result = await createTransaction({
      amount: parsed,
      type,
      merchantNormalised: merchant.trim(),
      categoryId: selectedCategory?._id,
      txDate: txDate.toISOString(),
      notes: notes.trim(),
      source: "manual",
    });
    setLoading(false);

    if (result.success) {
      navigation.goBack();
    } else {
      Alert.alert(
        "Could Not Save",
        result.error || "Please check your connection and try again.",
      );
    }
  }

  const topCats = categories.filter((c) =>
    ["Food & Dining", "Shopping", "Travel", "Utilities"].includes(c.name),
  );
  const otherCats = categories.filter(
    (c) =>
      !["Food & Dining", "Shopping", "Travel", "Utilities"].includes(c.name),
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={styles.saveBtn}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Type toggle */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === "debit" && styles.typeDebitActive,
              ]}
              onPress={() => setType("debit")}
            >
              <Text style={styles.typeBtnEmoji}>💸</Text>
              <Text
                style={[
                  styles.typeBtnText,
                  type === "debit" && styles.typeBtnTextActive,
                ]}
              >
                Spent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === "credit" && styles.typeCreditActive,
              ]}
              onPress={() => setType("credit")}
            >
              <Text style={styles.typeBtnEmoji}>💰</Text>
              <Text
                style={[
                  styles.typeBtnText,
                  type === "credit" && styles.typeBtnTextActive,
                ]}
              >
                Received
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <Text style={styles.fieldLabel}>ENTER AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.rupeeSign}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          {/* Merchant */}
          <View style={[styles.fieldCard, shadow.card]}>
            <Text style={styles.fieldLabel}>MERCHANT NAME</Text>
            <View style={styles.fieldRow}>
              <Text style={{ fontSize: 18, marginRight: spacing.sm }}>🏪</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Where did you spend?"
                placeholderTextColor={colors.textMuted}
                value={merchant}
                onChangeText={setMerchant}
              />
            </View>
          </View>

          {/* Category grid */}
          <Text style={[styles.fieldLabel, { marginTop: spacing.sm }]}>
            SELECT CATEGORY
          </Text>
          {loadingCats ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginVertical: spacing.md }}
            />
          ) : (
            <>
              <View style={styles.catGrid}>
                {topCats.map((cat) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={[
                      styles.catGridItem,
                      selectedCategory?._id === cat._id &&
                        styles.catGridItemActive,
                    ]}
                    onPress={() =>
                      setSelectedCategory(
                        selectedCategory?._id === cat._id ? null : cat,
                      )
                    }
                  >
                    <View
                      style={[
                        styles.catGridIconWrap,
                        {
                          backgroundColor:
                            selectedCategory?._id === cat._id
                              ? colors.primary
                              : colors.accentLight,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 26 }}>{cat.icon}</Text>
                    </View>
                    <Text
                      style={[
                        styles.catGridName,
                        selectedCategory?._id === cat._id && {
                          color: colors.primary,
                          fontFamily: font.bold,
                        },
                      ]}
                    >
                      {cat.name.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Other categories — horizontal scroll */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.otherCatsScroll}
                contentContainerStyle={{ gap: spacing.sm, paddingVertical: 4 }}
              >
                {otherCats.map((cat) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={[
                      styles.catChip,
                      selectedCategory?._id === cat._id && styles.catChipActive,
                    ]}
                    onPress={() =>
                      setSelectedCategory(
                        selectedCategory?._id === cat._id ? null : cat,
                      )
                    }
                  >
                    <Text style={{ fontSize: 15 }}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.catChipText,
                        selectedCategory?._id === cat._id && {
                          color: "#FFFFFF",
                        },
                      ]}
                    >
                      {cat.name.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Date picker */}
          <TouchableOpacity
            style={[styles.fieldCard, shadow.card, { marginTop: spacing.sm }]}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.fieldRow}>
              <Text style={{ fontSize: 18, marginRight: spacing.sm }}>📅</Text>
              <Text style={styles.fieldLabel}>DATE</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.dateValue}>{formatDateLabel(txDate)}</Text>
              <Text style={styles.dateChevron}> ›</Text>
            </View>
          </TouchableOpacity>

          {/* iOS date picker modal */}
          {showDatePicker && (
            <Modal transparent animationType="slide">
              <View style={styles.datePickerOverlay}>
                <View style={styles.datePickerSheet}>
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.datePickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={txDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      if (date) setTxDate(date);
                    }}
                    maximumDate={new Date()}
                    textColor={colors.textPrimary}
                  />
                </View>
              </View>
            </Modal>
          )}

          {/* Notes */}
          <View
            style={[styles.fieldCard, shadow.card, { marginTop: spacing.sm }]}
          >
            <View style={styles.fieldRow}>
              <Text style={{ fontSize: 18, marginRight: spacing.sm }}>📝</Text>
              <TextInput
                style={[styles.fieldInput, { flex: 1 }]}
                placeholder="Note  (optional)"
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>

          {/* Privacy note */}
          <View style={styles.privacyRow}>
            <Text style={{ fontSize: 14 }}>🔒</Text>
            <Text style={styles.privacyText}>
              Your manual entry stays private and local.
            </Text>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBigBtn, shadow.strong]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBigBtnText}>
                Save {type === "debit" ? "Expense" : "Income"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: { padding: spacing.xs },
  closeBtnText: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    fontFamily: font.regular,
  },
  headerTitle: {
    fontFamily: font.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  saveBtn: { padding: spacing.xs },
  saveBtnText: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    color: colors.primary,
  },

  content: {
    padding: spacing.screenPadding,
    gap: spacing.sm,
  },

  // Type toggle
  typeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeDebitActive: {
    borderColor: colors.primary,
    backgroundColor: "#EEF0FF",
  },
  typeCreditActive: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  typeBtnEmoji: { fontSize: 20 },
  typeBtnText: {
    fontFamily: font.semibold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  typeBtnTextActive: { color: colors.textPrimary },

  // Amount
  fieldLabel: {
    fontFamily: font.bold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  rupeeSign: {
    fontFamily: font.bold,
    fontSize: 44,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  amountInput: {
    fontFamily: font.extrabold,
    fontSize: 56,
    color: colors.textPrimary,
    minWidth: 120,
    textAlign: "center",
  },

  // Field cards
  fieldCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldRow: { flexDirection: "row", alignItems: "center" },
  fieldInput: {
    fontFamily: font.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    flex: 1,
  },

  // Category grid
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  catGridItem: {
    width: "47%",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  catGridItemActive: {
    borderColor: colors.primary,
    backgroundColor: "#EEF0FF",
  },
  catGridIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  catGridName: {
    fontFamily: font.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  otherCatsScroll: { marginBottom: spacing.xs },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontFamily: font.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Date
  dateValue: {
    fontFamily: font.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  dateChevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  datePickerSheet: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 40,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  datePickerDone: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    color: colors.primary,
  },

  // Notes + privacy
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  privacyText: {
    fontFamily: font.medium,
    fontSize: fontSize.xs,
    color: colors.accent,
  },

  // Save button
  saveBigBtn: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.xl,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  saveBigBtnText: {
    fontFamily: font.bold,
    fontSize: fontSize.lg,
    color: "#FFFFFF",
  },
});
