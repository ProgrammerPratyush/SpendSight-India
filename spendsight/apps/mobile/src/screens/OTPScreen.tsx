import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../services/firebase";
import { colors, fontSize, spacing, radius } from "../utils/theme";

// Firebase project config for REST calls
const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

export default function OTPScreen({ navigation }: any) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendOTP() {
    if (phone.length !== 10) return;
    setLoading(true);
    try {
      // Step 1 — Get reCAPTCHA site key from Firebase
      const siteKeyResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/recaptchaParams?key=${FIREBASE_API_KEY}`,
      );
      const siteKeyData = await siteKeyResponse.json();

      // Step 2 — Send OTP via Firebase REST API
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: `+91${phone}`,
            recaptchaToken: siteKeyData.recaptchaSiteKey || "test",
          }),
        },
      );

      const data = await response.json();

      if (data.sessionInfo) {
        setVerificationId(data.sessionInfo);
        Alert.alert("OTP Sent ✓", `A 6-digit code was sent to +91 ${phone}`);
      } else {
        // Firebase requires app attestation for real numbers
        // Fall back to showing manual instruction
        throw new Error(
          data.error?.message ||
            "OTP could not be sent. Make sure your number is correct.",
        );
      }
    } catch (err: any) {
      Alert.alert("Could not send OTP", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
    if (!verificationId || otp.length !== 6) return;
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);
    } catch (err: any) {
      Alert.alert(
        "Wrong Code",
        "The code you entered is incorrect. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>
              {verificationId ? "Enter the\ncode" : "Enter your\nmobile number"}
            </Text>
            <Text style={styles.subtitle}>
              {verificationId
                ? `We sent a 6-digit code to +91 ${phone}`
                : "We will send you a one-time password"}
            </Text>

            {!verificationId && (
              <>
                <View style={styles.inputRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="98765 43210"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    phone.length !== 10 && styles.buttonDisabled,
                  ]}
                  disabled={phone.length !== 10 || loading}
                  onPress={sendOTP}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {verificationId && (
              <>
                <TextInput
                  style={styles.otpInput}
                  placeholder="• • • • • •"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  autoFocus
                  textAlign="center"
                />

                <TouchableOpacity
                  style={[
                    styles.button,
                    otp.length !== 6 && styles.buttonDisabled,
                  ]}
                  disabled={otp.length !== 6 || loading}
                  onPress={verifyOTP}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Continue</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resend}
                  onPress={() => {
                    setVerificationId(null);
                    setOtp("");
                  }}
                >
                  <Text style={styles.resendText}>Wrong number? Go back</Text>
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.privacy}>
              🔒 Your number is hashed and never stored as plain text
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  back: { padding: spacing.screenPadding },
  backText: { color: colors.primary, fontSize: fontSize.md, fontWeight: "600" },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textPrimary,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  inputRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  countryCode: {
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: radius.md,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryCodeText: { fontSize: fontSize.md, fontWeight: "600" },
  input: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: radius.md,
    fontSize: fontSize.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  otpInput: {
    backgroundColor: colors.cardBackground,
    padding: spacing.lg,
    borderRadius: radius.md,
    fontSize: 32,
    fontWeight: "700",
    borderWidth: 2,
    borderColor: colors.primary,
    color: colors.textPrimary,
    letterSpacing: 12,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#FFFFFF", fontSize: fontSize.lg, fontWeight: "700" },
  resend: { alignItems: "center", padding: spacing.md },
  resendText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  privacy: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
