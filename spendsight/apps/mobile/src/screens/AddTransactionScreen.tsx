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
import { useTransactions } from "../hooks/useTransactions";
import apiClient from "../services/apiClient";

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

const TOP_CATEGORIES = ["Food & Dining", "Shopping", "Travel", "Utilities"];

export default function AddTransactionScreen({ navigation }: any) {
  const { createTransaction } = useTransactions();
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      setLoadingCats(true);
      try {
        const res = await apiClient.get("/api/categories");
        const cats = res.data?.data?.categories || [];
        setCategories(cats);
        // Auto-select first category so grid is never empty
        if (cats.length > 0 && !selectedCategory) {
          // Don't auto-select — just ensure they load
        }
      } catch (err: any) {
        console.log("Category load error:", err.message);
        // Fallback — show hardcoded categories so UI is never blank
        setCategories([
          { _id: "food", name: "Food & Dining", icon: "🍔", color: "#FEF3C7" },
          { _id: "shopping", name: "Shopping", icon: "🛒", color: "#EDE9FE" },
          { _id: "travel", name: "Travel", icon: "🚗", color: "#DBEAFE" },
          { _id: "utilities", name: "Utilities", icon: "⚡", color: "#D1FAE5" },
          {
            _id: "entertainment",
            name: "Entertainment",
            icon: "🎬",
            color: "#FCE7F3",
          },
          { _id: "health", name: "Health", icon: "💊", color: "#FEE2E2" },
          { _id: "groceries", name: "Groceries", icon: "🛍️", color: "#ECFDF5" },
          { _id: "other", name: "Other", icon: "💰", color: "#F9FAFB" },
        ]);
      } finally {
        setLoadingCats(false);
      }
    }
    loadCategories();
  }, []);

  async function handleSubmit() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    if (!merchant.trim()) {
      Alert.alert("Missing Info", "Please enter where you spent.");
      return;
    }
    setLoading(true);
    try {
      const result = await createTransaction({
        amount: parsed,
        type,
        merchantNormalised: merchant.trim(),
        categoryId: selectedCategory?._id,
        txDate: new Date().toISOString(),
        notes: notes.trim(),
        source: "manual",
      });
      if (result.success) {
        navigation.goBack();
      } else {
        Alert.alert(
          "Could Not Save",
          result.error || "Please check your connection and try again.",
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const topCats = categories.filter((c) => TOP_CATEGORIES.includes(c.name));
  const otherCats = categories.filter((c) => !TOP_CATEGORIES.includes(c.name));

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.headerClose}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <View style={styles.headerLock}>
            <Text style={{ fontSize: 16 }}>🔒</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Type toggle */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === "debit" && styles.typeBtnActive]}
              onPress={() => setType("debit")}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  type === "debit" && styles.typeBtnTextActive,
                ]}
              >
                💸 Spent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === "credit" && styles.typeCreditActive,
              ]}
              onPress={() => setType("credit")}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  type === "credit" && styles.typeBtnTextActive,
                ]}
              >
                💰 Received
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <Text style={styles.amountLabel}>ENTER AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
              caretHidden={amount === ""}
              selectTextOnFocus
            />
          </View>

          {/* Merchant */}
          <View style={[styles.fieldCard, shadow.card]}>
            <Text style={styles.fieldLabel}>Merchant Name</Text>
            <View style={styles.fieldInputRow}>
              <Text style={{ fontSize: 16, marginRight: spacing.sm }}>🏪</Text>
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
          <Text style={styles.fieldLabel}>Select Category</Text>
          {loadingCats ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
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
                      styles.catGridIcon,
                      {
                        backgroundColor:
                          selectedCategory?._id === cat._id
                            ? colors.primary
                            : colors.accentLight,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{cat.icon}</Text>
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
          )}

          {/* More categories horizontal scroll */}
          {otherCats.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: spacing.sm }}
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
                  <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.catChipText,
                      selectedCategory?._id === cat._id && { color: "#FFFFFF" },
                    ]}
                  >
                    {cat.name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Date — today for now */}
          <View style={[styles.fieldCard, shadow.card]}>
            <View style={styles.fieldInputRow}>
              <Text style={{ fontSize: 16, marginRight: spacing.sm }}>📅</Text>
              <Text style={styles.fieldLabel}>DATE</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.dateValue}>Today ▾</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={[styles.fieldCard, shadow.card]}>
            <View style={styles.fieldInputRow}>
              <Text style={{ fontSize: 16, marginRight: spacing.sm }}>📝</Text>
              <TextInput
                style={[styles.fieldInput, { flex: 1 }]}
                placeholder="NOTE  Optional details..."
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
            style={[styles.saveBtn, shadow.strong]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Transaction</Text>
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
    padding: spacing.screenPadding,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerClose: {
    fontSize: 20,
    color: colors.textSecondary,
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: font.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  headerLock: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { padding: spacing.screenPadding, gap: spacing.sm },
  typeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xs },
  typeBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: "#EEF0FF" },
  typeCreditActive: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  typeBtnText: {
    fontFamily: font.semibold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  typeBtnTextActive: { color: colors.textPrimary },
  amountLabel: {
    fontFamily: font.bold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 1,
    textAlign: "center",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  rupeeSymbol: {
    fontFamily: font.bold,
    fontSize: 40,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  amountInput: {
    fontFamily: font.extrabold,
    fontSize: 48, // reduced from 52 — prevents overflow on small screens
    color: colors.textPrimary,
    minWidth: 100,
    maxWidth: 220, // prevents ₹ + number overflowing screen
    textAlign: "center",
  },
  fieldCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: {
    fontFamily: font.bold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldInputRow: { flexDirection: "row", alignItems: "center" },
  fieldInput: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
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
  catGridIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  catGridName: {
    fontFamily: font.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontFamily: font.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  dateValue: {
    fontFamily: font.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  privacyText: {
    fontFamily: font.medium,
    fontSize: fontSize.xs,
    color: colors.accent,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md + 2,
    borderRadius: radius.xl,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  saveBtnText: {
    fontFamily: font.bold,
    fontSize: fontSize.lg,
    color: "#FFFFFF",
  },
});
