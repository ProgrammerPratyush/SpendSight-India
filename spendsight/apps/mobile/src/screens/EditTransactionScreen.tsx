import React, { useState, useEffect, useCallback } from "react";
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
import { format } from "date-fns";

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

import NLPInput from "../components/NLPInput";
import { ParsedTransaction } from "../services/nlpParser";

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

const TOP_CAT_NAMES = ["Food & Dining", "Shopping", "Travel", "Utilities"];

export default function AddTransactionScreen({ navigation, route }: any) {
  const { createTransaction, updateTransaction } = useTransactions();

  // Extract transaction from route params (if editing)
  const { transaction } = route.params || {};
  const isEditMode = !!transaction;

  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount / 100) : "",
  );
  const [merchant, setMerchant] = useState(
    transaction?.merchantNormalised || "",
  );
  const [notes, setNotes] = useState(transaction?.notes || "");

  const [type, setType] = useState<"debit" | "credit">(
    transaction?.type || "debit",
  );

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    transaction?.categoryId || null,
  );

  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATS);

  const [loadingCats, setLoadingCats] = useState(true);
  const [loading, setLoading] = useState(false);

  const [txDate, setTxDate] = useState(
    transaction ? new Date(transaction.txDate) : new Date(),
  );

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [nlpActive, setNlpActive] = useState(
    Platform.OS === "ios" && !isEditMode,
  );

  // Fetch categories
  useEffect(() => {
    let mounted = true;

    async function fetchCategories() {
      try {
        const res = await apiClient.get("/api/categories");

        const cats = res.data?.data?.categories || [];

        if (mounted && cats.length > 0) {
          setCategories(cats);
        }
      } catch (err) {
        console.log("Category fetch failed");
      } finally {
        if (mounted) {
          setLoadingCats(false);
        }
      }
    }

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);

  // NLP Parser Handler
  const handleNLPParsed = useCallback(
    (parsed: ParsedTransaction) => {
      if (!parsed) return;

      if (parsed.amount && parsed.amount > 0) {
        setAmount(String(parsed.amount));
      }

      if (parsed.merchantNormalised) {
        setMerchant(parsed.merchantNormalised);
      }

      if (parsed.type) {
        setType(parsed.type);
      }

      if (parsed.txDate instanceof Date) {
        setTxDate(parsed.txDate);
      }

      // Category matching
      let matchedCategory: Category | undefined;

      if (parsed.categoryId) {
        matchedCategory = categories.find((c) => c._id === parsed.categoryId);
      }

      if (!matchedCategory && parsed.categoryName) {
        matchedCategory = categories.find(
          (c) => c.name.toLowerCase() === parsed.categoryName?.toLowerCase(),
        );
      }

      if (matchedCategory) {
        setSelectedCategory(matchedCategory);
      }
    },
    [categories],
  );

  function handleNLPClear() {
    // intentionally no-op
  }

  function formatDateLabel(date: Date): string {
    const today = new Date();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return format(date, "d MMM yyyy");
  }

  async function handleSubmit() {
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid amount greater than 0.",
      );
      return;
    }

    if (!merchant.trim()) {
      Alert.alert("Missing Merchant", "Please enter merchant or description.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        amount: Number(parsedAmount),
        type,
        merchantRaw: merchant.trim(),
        merchantNormalised: merchant.trim(),
        categoryId: selectedCategory?._id || undefined,
        txDate: txDate.toISOString(),
        notes: notes.trim(),
        source: (nlpActive ? "nlp" : "manual") as "nlp" | "manual",
      };

      console.log("TX PAYLOAD:", payload);

      let result;
      if (isEditMode) {
        result = await updateTransaction(transaction._id, payload);
      } else {
        // create a new transaction when not in edit mode
        result = await createTransaction(payload);
      }

      if (result.success) {
        navigation.goBack();
      } else {
        Alert.alert("Could Not Save", result.error || "Something went wrong.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save transaction.");
    } finally {
      setLoading(false);
    }
  }

  const topCats = categories.filter((c) => TOP_CAT_NAMES.includes(c.name));

  const otherCats = categories.filter((c) => !TOP_CAT_NAMES.includes(c.name));

  return (
    <SafeAreaView style={S.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={S.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={S.closeBtn}
          >
            <Text style={S.closeText}>✕</Text>
          </TouchableOpacity>

          <Text style={S.headerTitle}>
            {isEditMode ? "Edit Transaction" : "Add Transaction"}
          </Text>

          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={S.headerSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={S.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Smart / Manual Toggle - Only show in Add mode */}
          {!isEditMode && (
            <View style={S.modeToggle}>
              <TouchableOpacity
                style={[S.modeBtn, nlpActive && S.modeBtnActive]}
                onPress={() => setNlpActive(true)}
              >
                <Text style={[S.modeBtnText, nlpActive && S.modeBtnTextActive]}>
                  ✨ Smart
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[S.modeBtn, !nlpActive && S.modeBtnActive]}
                onPress={() => setNlpActive(false)}
              >
                <Text
                  style={[S.modeBtnText, !nlpActive && S.modeBtnTextActive]}
                >
                  ✏️ Manual
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* NLP Input - Only show in Add mode */}
          {nlpActive && !isEditMode && (
            <>
              <NLPInput
                categories={categories}
                onParsed={handleNLPParsed}
                onClear={handleNLPClear}
              />

              <View style={S.orRow}>
                <View style={S.orLine} />
                <Text style={S.orText}>or fill manually below</Text>
                <View style={S.orLine} />
              </View>
            </>
          )}

          {/* Type */}
          <View style={S.typeRow}>
            <TouchableOpacity
              style={[S.typeBtn, type === "debit" && S.typeDebitActive]}
              onPress={() => setType("debit")}
            >
              <Text>💸</Text>
              <Text style={S.typeBtnText}>Spent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[S.typeBtn, type === "credit" && S.typeCreditActive]}
              onPress={() => setType("credit")}
            >
              <Text>💰</Text>
              <Text style={S.typeBtnText}>Received</Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <Text style={S.fieldLabel}>ENTER AMOUNT</Text>

          <View style={S.amountRow}>
            <Text style={S.rupee}>₹</Text>

            <TextInput
              style={S.amountInput}
              placeholder="0"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor="#C4C9D4"
            />
          </View>

          {/* Merchant */}
          <View style={[S.fieldCard, shadow.card]}>
            <Text style={S.fieldLabel}>MERCHANT NAME</Text>

            <TextInput
              style={S.fieldInput}
              placeholder="Where did you spend?"
              value={merchant}
              onChangeText={setMerchant}
            />
          </View>

          {/* Transaction Date */}
          <Text style={S.fieldLabel}>TRANSACTION DATE</Text>

          <TouchableOpacity
            style={[S.fieldCard, shadow.card]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={S.dateText}>{formatDateLabel(txDate)}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={txDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);

                if (selectedDate) {
                  setTxDate(selectedDate);
                }
              }}
            />
          )}

          {/* Notes */}
          <View style={[S.fieldCard, shadow.card]}>
            <Text style={S.fieldLabel}>NOTES (OPTIONAL)</Text>

            <TextInput
              style={S.fieldInput}
              placeholder="Add any notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category Selection */}
          <Text style={S.fieldLabel}>CATEGORY</Text>

          <View style={S.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat._id}
                style={[
                  S.categoryChip,
                  selectedCategory?._id === cat._id && S.categoryChipActive,
                  { backgroundColor: cat.color || "#F3F4F6" },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={S.categoryIcon}>{cat.icon}</Text>
                <Text style={S.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },

  closeText: {
    fontSize: 14,
    fontFamily: font.bold,
  },

  headerTitle: {
    fontSize: 17,
    fontFamily: font.bold,
    color: colors.textPrimary,
  },

  headerSaveText: {
    fontFamily: font.bold,
    color: colors.primary,
  },

  content: {
    padding: 20,
    gap: 12,
  },

  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 100,
    padding: 3,
  },

  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 100,
  },

  modeBtnActive: {
    backgroundColor: "#FFFFFF",
  },

  modeBtnText: {
    fontFamily: font.semibold,
    color: "#6B7280",
  },

  modeBtnTextActive: {
    color: colors.textPrimary,
  },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  orText: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  typeRow: {
    flexDirection: "row",
    gap: 10,
  },

  typeBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
  },

  typeDebitActive: {
    backgroundColor: "#EEF0FF",
  },

  typeCreditActive: {
    backgroundColor: "#ECFDF5",
  },

  typeBtnText: {
    fontFamily: font.semibold,
  },

  fieldLabel: {
    fontSize: 11,
    fontFamily: font.bold,
    color: "#9CA3AF",
    marginTop: 8,
  },

  dateText: {
    fontSize: 16,
    fontFamily: font.medium,
    color: colors.textPrimary,
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  rupee: {
    fontSize: 42,
    fontFamily: font.bold,
    color: "#C4C9D4",
  },

  amountInput: {
    fontSize: 52,
    fontFamily: font.extrabold,
    color: colors.textPrimary,
    minWidth: 120,
    textAlign: "center",
  },

  fieldCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
  },

  fieldInput: {
    fontSize: 15,
    fontFamily: font.regular,
    color: colors.textPrimary,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },

  categoryChipActive: {
    borderColor: colors.primary,
  },

  categoryIcon: {
    fontSize: 18,
  },

  categoryName: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: colors.textPrimary,
  },
});
