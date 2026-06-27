import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { formatRelative } from "../utils/time";
import { getNotifications, markAllRead } from "../services/notificationService";
import {
  colors,
  font,
  fontSize,
  spacing,
  radius,
  shadow,
} from "../utils/theme";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
interface Notification {
  _id: string;
  title: string;
  body: string;
  type: string;
  severity: string;
  createdAt: string;
  readAt: string | null;
}

// ─────────────────────────────────────────
// Phase 3A — Change #3: Type → Icon map
// ─────────────────────────────────────────
const ICONS: Record<string, string> = {
  daily_digest: "🟢",
  limit_alert: "🟠",
  trend: "📈",
  recurring_detected: "🔁",
  monthly_wrap: "📅",
  unusual_spend: "🚨",
  system: "🔔",
};

// ─────────────────────────────────────────
// Phase 3A — Change #4: Severity → Color
// ─────────────────────────────────────────
function getSeverityColor(severity: string): string {
  const map: Record<string, string> = {
    info: "#3B82F6", // 🔵 Blue
    success: "#10B981", // 🟢 Green
    warning: "#F59E0B", // 🟠 Orange
    critical: "#EF4444", // 🔴 Red
    danger: "#EF4444", // 🔴 Red
  };
  return map[severity] ?? "#3B82F6";
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────
export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // ─────────────────────────────────────
  // Load notifications
  // ─────────────────────────────────────
  async function loadNotifications() {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.log("[NOTIFICATIONS]", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // ─────────────────────────────────────
  // Auto-load when screen comes into focus
  // ─────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, []),
  );

  // ─────────────────────────────────────
  // Phase 3A — Change #2: Mark all read
  // ─────────────────────────────────────
  async function handleMarkAllRead() {
    if (markingAll) return;

    // Check if there are any unread ones first
    const hasUnread = notifications.some((n) => !n.readAt);
    if (!hasUnread) {
      Alert.alert("All caught up", "No unread notifications.");
      return;
    }

    try {
      setMarkingAll(true);
      await markAllRead();

      // Optimistically update local state
      // so UI responds instantly without a re-fetch
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
      );
    } catch (err) {
      console.log("[NOTIFICATIONS] Mark all read failed:", err);
      Alert.alert("Error", "Could not mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  // ─────────────────────────────────────
  // Pull to refresh
  // ─────────────────────────────────────
  function onRefresh() {
    setRefreshing(true);
    loadNotifications();
  }

  // ─────────────────────────────────────
  // Count unread for header hint
  // ─────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // ─────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────
  // Render
  // ─────────────────────────────────────
  return (
    // Phase 3A — Change #1: SafeAreaView
    <SafeAreaView style={styles.container}>
      {/* Phase 3A — Change #2: Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Notifications
          {unreadCount > 0 && (
            <Text style={styles.headerCount}> ({unreadCount})</Text>
          )}
        </Text>

        <TouchableOpacity
          onPress={handleMarkAllRead}
          disabled={markingAll}
          style={styles.markAllBtn}
        >
          <Text style={styles.markAllText}>
            {markingAll ? "Updating..." : "Mark all read"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        // Phase 3A — Change #9: Pull to refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyWrapper : styles.listContent
        }
        // Phase 3A — Change #10: Empty state
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>You're all caught up.</Text>
            <Text style={styles.emptyText}>
              New spending alerts and AI insights will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUnread = !item.readAt;
          const icon = ICONS[item.type] ?? "🔔";
          const severityColor = getSeverityColor(item.severity);
          const timeAgo = formatRelative(item.createdAt);

          return (
            // Phase 3A — Change #8: Read card background
            <View
              style={[
                styles.card,
                isUnread ? styles.cardUnread : styles.cardRead,
              ]}
            >
              {/* Left column: icon */}
              <View style={styles.cardLeft}>
                <Text style={styles.cardIcon}>{icon}</Text>
              </View>

              {/* Center column: title + body + time */}
              <View style={styles.cardBody}>
                {/* Phase 3A — Change #5: Title row */}
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.cardTitle,
                      !isUnread && styles.cardTitleRead,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.cardMessage,
                    !isUnread && styles.cardMessageRead,
                  ]}
                  numberOfLines={3}
                >
                  {item.body}
                </Text>

                {/* Phase 3A — Change #6: Relative time */}
                <Text style={styles.cardTime}>{timeAgo}</Text>
              </View>

              {/* Right column: severity dot + unread dot */}
              <View style={styles.cardRight}>
                {/* Phase 3A — Change #4: Severity dot */}
                <View
                  style={[
                    styles.severityDot,
                    {
                      backgroundColor: severityColor,
                    },
                  ]}
                />

                {/* Phase 3A — Change #7: Unread blue dot */}
                {isUnread && <View style={styles.unreadDot} />}
              </View>
            </View>
          );
        }}
      />
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Header ──
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
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 22,
    color: colors.textPrimary,
    fontFamily: font.bold,
  },
  headerTitle: {
    fontFamily: font.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  headerCount: {
    fontFamily: font.regular,
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  markAllBtn: {
    width: 90,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  markAllText: {
    fontFamily: font.semibold,
    fontSize: fontSize.xs,
    color: colors.primary,
  },

  // ── List ──
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: 40,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Card ──
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: spacing.screenPadding,
    marginVertical: spacing.xs,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Phase 3A — Change #8: Unread = white, Read = light grey
  cardUnread: {
    backgroundColor: "#FFFFFF",
  },
  cardRead: {
    backgroundColor: "#F8F8F8",
    opacity: 0.85,
  },

  cardLeft: {
    width: 36,
    alignItems: "center",
    paddingTop: 2,
  },
  cardIcon: {
    fontSize: 22,
  },

  cardBody: {
    flex: 1,
    gap: 4,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  cardTitle: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    flex: 1,
  },
  // Phase 3A — Change #8: Read title is muted
  cardTitleRead: {
    color: colors.textSecondary,
    fontFamily: font.semibold,
  },

  cardMessage: {
    fontFamily: font.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardMessageRead: {
    color: colors.textMuted,
  },

  // Phase 3A — Change #6: Time stamp
  cardTime: {
    fontFamily: font.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  cardRight: {
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },

  // Phase 3A — Change #4: Severity dot
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // Phase 3A — Change #7: Unread indicator
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },

  // Phase 3A — Change #10: Empty state
  emptyContainer: {
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: font.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: font.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },
});
