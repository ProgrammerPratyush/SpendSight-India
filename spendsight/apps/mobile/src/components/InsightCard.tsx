import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { font, fontSize, radius, spacing } from "../utils/theme";

// ✅ Fixed: Import type from useInsights (single source of truth)
import type { Insight, InsightSeverity } from "../hooks/useInsights";

// Re-export so any screen that needs it can import from here
export type { Insight, InsightSeverity };

interface InsightCardProps {
  insight: Insight;
  onPress?: (insight: Insight) => void;
}

// ─────────────────────────────────────────
// Change #6: Severity color maps
// ─────────────────────────────────────────
const severityColors: Record<InsightSeverity, string> = {
  success: "#10B981", // 🟢 Spending Reduced
  warning: "#F59E0B", // 🟠 Budget Alert / Spending Increased
  danger: "#EF4444", // 🔴 Large Purchase / Budget Exceeded
  info: "#3B82F6", // 🔵 Daily Summary / Recurring / Monthly Wrap
};

const severityBackgrounds: Record<InsightSeverity, string> = {
  success: "#F0FDF4",
  warning: "#FFFBEB",
  danger: "#FEF2F2",
  info: "#EFF6FF",
};

// ─────────────────────────────────────────
// Change #5: Redesigned card
// ─────────────────────────────────────────
export default function InsightCard({ insight, onPress }: InsightCardProps) {
  // ✅ Fixed: Safe fallback if severity is missing
  // (handles old insights in DB that predate Change #3)
  const severity = insight.severity ?? "info";
  const severityColor = severityColors[severity];
  const severityBg = severityBackgrounds[severity];
  const isUnread = !insight.readAt;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(insight)}
      style={[
        styles.card,
        {
          borderLeftColor: severityColor,
          backgroundColor: severityBg,
        },
      ]}
    >
      {/* Unread dot — top right */}
      {isUnread && (
        <View style={[styles.unreadDot, { backgroundColor: severityColor }]} />
      )}

      {/* Icon bubble */}
      <View
        style={[
          styles.iconWrap,
          // ✅ hex + '20' = 12% opacity tint background
          { backgroundColor: severityColor + "20" },
        ]}
      >
        <Text style={styles.icon}>{insight.icon || "💡"}</Text>
      </View>

      {/* Text content */}
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: severityColor }]}
          numberOfLines={1}
        >
          {insight.title || "Smart Insight"}
        </Text>

        <Text style={styles.message} numberOfLines={3}>
          {insight.text}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 5,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    width: 260,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  unreadDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  icon: {
    fontSize: 20,
  },

  content: {
    flex: 1,
  },

  title: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    marginBottom: 4,
  },

  message: {
    fontFamily: font.regular,
    fontSize: fontSize.sm,
    color: "#374151",
    lineHeight: 20,
  },
});
