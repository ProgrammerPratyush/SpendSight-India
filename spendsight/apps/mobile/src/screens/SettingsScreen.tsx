import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView as SafeArea } from "react-native-safe-area-context";
import { colors, fontSize, spacing, radius, shadow } from "../utils/theme";
import { useAuthStore } from "../store/authStore";
import { signOut, deleteUser } from "firebase/auth";
import { auth } from "../services/firebase";
import apiClient from "../services/apiClient";

export default function SettingsScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // ── Logout ──────────────────────────────────────────────────────────────────
  async function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            logout();
          } catch (err) {
            Alert.alert("Error", "Could not log out. Please try again.");
          }
        },
      },
    ]);
  }

  // ── Save Profile ─────────────────────────────────────────────────────────────
  async function handleSaveProfile() {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }
    setSaving(true);
    try {
      const payload: any = { name: name.trim() };
      if (monthlyIncome) payload.monthlyIncome = parseFloat(monthlyIncome);

      const res = await apiClient.patch("/api/auth/profile", payload);
      updateUser({ name: res.data.data.name });
      setShowEditProfile(false);
      Alert.alert("Saved ✓", "Your profile has been updated.");
    } catch (err) {
      Alert.alert("Error", "Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete Account ───────────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await apiClient.delete("/api/auth/account");
      const firebaseUser = auth.currentUser;
      if (firebaseUser) await deleteUser(firebaseUser);
      logout();
    } catch (err: any) {
      // If Firebase delete fails due to token age, sign out anyway
      if (err.code === "auth/requires-recent-login") {
        Alert.alert(
          "Re-login Required",
          "For security, please log out and log back in before deleting your account.",
          [{ text: "OK", onPress: () => logout() }],
        );
      } else {
        Alert.alert("Error", "Could not delete account. Please try again.");
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  // ── Settings sections ────────────────────────────────────────────────────────
  const sections = [
    {
      title: "Account",
      items: [
        {
          icon: "👤",
          label: "Edit Profile",
          sub: user?.name ? `Signed in as ${user.name}` : "Set your name",
          onPress: () => {
            setName(user?.name || "");
            setShowEditProfile(true);
          },
          showArrow: true,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: "🔔",
          label: "Daily Digest",
          sub: "Morning summary of yesterday's spend",
          toggle: true,
          value: notifications,
          onToggle: (val: boolean) => setNotifications(val),
        },
      ],
    },
    {
      title: "Privacy & Data",
      items: [
        {
          icon: "🔒",
          label: "Privacy Policy",
          sub: "How we handle your data",
          onPress: () =>
            Alert.alert(
              "Privacy",
              "SpendSight processes your transactions on-device. We never store raw SMS content. You can delete all your data at any time.",
            ),
          showArrow: true,
        },
        {
          icon: "📤",
          label: "Export My Data",
          sub: "Coming soon",
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "Data export will be available in the next update.",
            ),
          showArrow: true,
          disabled: true,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "❓",
          label: "How SpendSight Works",
          sub: "SMS parsing, privacy, categories",
          onPress: () =>
            Alert.alert(
              "How it works",
              "1. SpendSight reads your bank SMS alerts on-device only.\n\n2. Raw SMS text is never sent to any server.\n\n3. Only the parsed amount, merchant, and date are stored.\n\n4. You can delete everything at any time from Settings.",
            ),
          showArrow: true,
        },
        {
          icon: "⭐",
          label: "Rate SpendSight",
          sub: "Help us improve",
          onPress: () =>
            Alert.alert(
              "Thank you!",
              "App Store rating coming when we launch publicly.",
            ),
          showArrow: true,
        },
      ],
    },
  ];

  return (
    <SafeArea style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile card */}
        <TouchableOpacity
          style={[styles.profileCard, shadow.card]}
          onPress={() => {
            setName(user?.name || "");
            setShowEditProfile(true);
          }}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(user?.name || "S").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.name || "Set your name →"}
            </Text>
            <Text style={styles.profileSub}>Tap to edit profile</Text>
          </View>
          <Text style={styles.profileArrow}>›</Text>
        </TouchableOpacity>

        {/* Settings sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item: any, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.row,
                    index < section.items.length - 1 && styles.rowBorder,
                    item.disabled && styles.rowDisabled,
                  ]}
                  onPress={item.onPress}
                  disabled={item.disabled || item.toggle}
                  activeOpacity={item.toggle ? 1 : 0.7}
                >
                  <Text style={styles.rowIcon}>{item.icon}</Text>
                  <View style={styles.rowContent}>
                    <Text
                      style={[
                        styles.rowLabel,
                        item.disabled && { color: colors.textMuted },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.rowSub}>{item.sub}</Text>
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary,
                      }}
                      thumbColor="#FFFFFF"
                    />
                  ) : (
                    item.showArrow && <Text style={styles.chevron}>›</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout button */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <TouchableOpacity style={styles.row} onPress={handleLogout}>
              <Text style={styles.rowIcon}>🚪</Text>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: colors.warning }]}>
                  Log Out
                </Text>
                <Text style={styles.rowSub}>Sign out of your account</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete account */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Text style={styles.rowIcon}>🗑️</Text>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: colors.danger }]}>
                  Delete Account
                </Text>
                <Text style={styles.rowSub}>
                  Permanently removes all your data
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.version}>SpendSight v1.0.0</Text>
      </ScrollView>

      {/* ── Edit Profile Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeArea style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditProfile(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Your name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Pratyush"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={50}
            />

            <Text style={styles.inputLabel}>Monthly income (optional)</Text>
            <View style={styles.incomeWrap}>
              <Text style={styles.incomePrefix}>Rs</Text>
              <TextInput
                style={styles.incomeInput}
                placeholder="50,000"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
              />
            </View>
            <Text style={styles.inputHint}>
              Used only to show what % of income you have spent. Never shared.
            </Text>
          </ScrollView>
        </SafeArea>
      </Modal>

      {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.confirmCard, shadow.strong]}>
            <Text style={styles.confirmIcon}>⚠️</Text>
            <Text style={styles.confirmTitle}>Delete Account?</Text>
            <Text style={styles.confirmText}>
              This will permanently delete all your transactions, budgets, and
              insights. This cannot be undone.
            </Text>

            <TouchableOpacity
              style={styles.confirmDeleteBtn}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmDeleteText}>
                  Yes, Delete Everything
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmCancelBtn}
              onPress={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              <Text style={styles.confirmCancelText}>Keep My Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    margin: spacing.screenPadding,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatarText: {
    color: "#FFFFFF",
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  profileSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  profileArrow: { fontSize: 22, color: colors.textMuted },
  section: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowDisabled: { opacity: 0.5 },
  rowIcon: { fontSize: 22, width: 32 },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rowSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  chevron: { fontSize: 20, color: colors.textMuted },
  version: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fontSize.xs,
    padding: spacing.lg,
  },
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
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  textInput: {
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: radius.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  incomeWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.md,
  },
  incomePrefix: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.primary,
    marginRight: spacing.xs,
  },
  incomeInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  inputHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.screenPadding,
  },
  confirmCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: "100%",
    alignItems: "center",
    gap: spacing.sm,
  },
  confirmIcon: { fontSize: 48 },
  confirmTitle: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  confirmText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  confirmDeleteBtn: {
    backgroundColor: colors.danger,
    padding: spacing.md,
    borderRadius: radius.lg,
    width: "100%",
    alignItems: "center",
    marginTop: spacing.md,
  },
  confirmDeleteText: {
    color: "#FFFFFF",
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  confirmCancelBtn: {
    padding: spacing.md,
    width: "100%",
    alignItems: "center",
  },
  confirmCancelText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
function updateUser(arg0: { name: any }) {
  throw new Error("Function not implemented.");
}
