import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  colors,
  font,
  fontSize,
  spacing,
  radius,
  shadow,
} from "../utils/theme";

const FEATURES = [
  {
    icon: "🔒",
    title: "Read alerts, not passwords",
    sub: "We only look at bank SMS, never your PIN. Your security remains untouched.",
  },
  {
    icon: "👁️",
    title: "Always Private",
    sub: "Your raw SMS messages never leave your phone. All processing happens locally.",
  },
  {
    icon: "💬",
    title: "Plain Language",
    sub: "We turn bank-speak into simple summaries that help you understand your habits.",
  },
];

export default function WelcomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>💰</Text>
        </View>
        <Text style={styles.appName}>SpendSight</Text>
        <Text style={styles.tagline}>How we help you track spending</Text>
        <Text style={styles.desc}>
          SpendSight automatically categorises your bank alerts to give you a
          real-time view of your finances.
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={[styles.featureCard, shadow.card]}>
            <View style={styles.featureIconWrap}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureSub}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.bottom}>
        <View style={styles.encryptionBadge}>
          <Text style={styles.encryptionText}>🔐 BANK-GRADE ENCRYPTION</Text>
        </View>
        <TouchableOpacity
          style={[styles.primaryBtn, shadow.strong]}
          onPress={() => navigation.navigate("OTP")}
        >
          <Text style={styles.primaryBtnText}>Get Started →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip, I'll add manually</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xl,
    alignItems: "center",
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    ...shadow.strong,
  },
  logoEmoji: { fontSize: 36 },
  appName: {
    fontFamily: font.extrabold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  tagline: {
    fontFamily: font.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  desc: {
    fontFamily: font.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  features: {
    padding: spacing.screenPadding,
    gap: spacing.sm,
    flex: 1,
    justifyContent: "center",
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  featureIcon: { fontSize: 20 },
  featureText: { flex: 1 },
  featureTitle: {
    fontFamily: font.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  featureSub: {
    fontFamily: font.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  bottom: { padding: spacing.screenPadding, gap: spacing.sm },
  encryptionBadge: {
    alignSelf: "center",
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  encryptionText: {
    fontFamily: font.semibold,
    fontSize: fontSize.xs,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md + 2,
    borderRadius: radius.xl,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: font.bold,
    fontSize: fontSize.lg,
    color: "#FFFFFF",
  },
  skipBtn: { alignItems: "center", padding: spacing.sm },
  skipText: {
    fontFamily: font.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
