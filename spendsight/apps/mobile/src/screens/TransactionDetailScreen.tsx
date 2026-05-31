import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import apiClient from "../services/apiClient";

import {
  colors,
  font,
  fontSize,
  spacing,
  radius,
  shadow,
} from "../utils/theme";

import { formatCurrency } from "../utils/formatCurrency";

interface Transaction {
  _id: string;
  amount: number;
  type: "debit" | "credit";
  merchantRaw?: string;
  merchantNormalised?: string;

  categoryId?: {
    _id: string;
    name: string;
    icon: string;
  };

  txDate: string;

  status: string;

  source: string;

  notes?: string;

  createdAt?: string;
}

export default function TransactionDetailScreen({ route, navigation }: any) {
  const { transactionId } = route.params;

  const [loading, setLoading] = useState(true);

  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransaction();
  }, []);

  async function loadTransaction() {
    try {
      setLoading(true);

      const res = await apiClient.get(`/api/transactions/${transactionId}`);

      setTransaction(res.data.data.transaction);
    } catch (err) {
      Alert.alert("Error", "Could not load transaction.");

      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/api/transactions/${transactionId}`);

              Alert.alert("Deleted", "Transaction removed successfully.");

              navigation.goBack();
            } catch (err) {
              Alert.alert("Error", "Failed to delete transaction.");
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>No transaction found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.screenPadding,
        }}
      >
        {/* Header */}

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Transaction Details</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Amount Card */}

        <View style={[styles.amountCard, shadow.card]}>
          <Text style={styles.amountLabel}>Amount</Text>

          <Text
            style={[
              styles.amountValue,
              {
                color:
                  transaction.type === "credit"
                    ? colors.success
                    : colors.textPrimary,
              },
            ]}
          >
            {transaction.type === "credit" ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </Text>
        </View>

        {/* Details */}

        <View style={[styles.detailCard, shadow.card]}>
          <DetailRow
            label="Merchant"
            value={
              transaction.merchantNormalised || transaction.merchantRaw || "-"
            }
          />

          <DetailRow
            label="Category"
            value={
              transaction.categoryId
                ? `${transaction.categoryId.icon} ${transaction.categoryId.name}`
                : "Uncategorised"
            }
          />

          <DetailRow
            label="Date"
            value={new Date(transaction.txDate).toLocaleDateString("en-IN")}
          />

          <DetailRow label="Type" value={transaction.type} />

          <DetailRow label="Status" value={transaction.status} />

          <DetailRow label="Source" value={transaction.source} />

          <DetailRow label="Notes" value={transaction.notes || "-"} />
        </View>

        {/* Buttons */}

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() =>
            navigation.navigate("AddTransaction", {
              transaction: transaction,
            })
          }
        >
          <Text style={styles.editBtnText}>Edit Transaction</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete Transaction</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>

      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  backBtn: {
    fontSize: 24,
    color: colors.textPrimary,
  },

  headerTitle: {
    fontFamily: font.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },

  amountCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    alignItems: "center",
  },

  amountLabel: {
    fontFamily: font.medium,
    color: colors.textMuted,
    marginBottom: 8,
  },

  amountValue: {
    fontFamily: font.extrabold,
    fontSize: 36,
  },

  detailCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  rowLabel: {
    fontFamily: font.medium,
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },

  rowValue: {
    marginTop: 4,
    fontFamily: font.semibold,
    color: colors.textPrimary,
    fontSize: fontSize.md,
  },

  editBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
  },

  editBtnText: {
    textAlign: "center",
    color: "#FFF",
    fontFamily: font.bold,
  },

  deleteBtn: {
    backgroundColor: "#DC2626",
    borderRadius: radius.md,
    padding: 16,
  },

  deleteBtnText: {
    textAlign: "center",
    color: "#FFF",
    fontFamily: font.bold,
  },
});
