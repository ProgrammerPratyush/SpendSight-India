import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { colors, font, fontSize, spacing, radius } from "../utils/theme";
import {
  parseNaturalLanguage,
  getParsePreview,
  ParsedTransaction,
} from "../services/nlpParser";

interface Props {
  categories: Array<{ _id: string; name: string; icon: string }>;
  onParsed: (result: ParsedTransaction) => void;
  onClear: () => void;
}

const SUGGESTIONS = [
  "Swiggy 450",
  "Uber 230 yesterday",
  "Netflix 649",
  "Zepto 380",
  "Salary received 50000",
];

export default function NLPInput({ categories, onParsed, onClear }: Props) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState("");
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [focused, setFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  function handleChange(value: string) {
    setText(value);
    if (value.trim().length < 2) {
      setPreview("");
      setParsed(null);
      onClear();
      return;
    }

    const result = parseNaturalLanguage(value, categories);
    const preview = getParsePreview(result);
    setPreview(preview);
    setParsed(result);

    if (result.confidence >= 0.4 && result.amount) {
      onParsed(result);
      // Fade in the preview
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }

  function handleSuggestion(s: string) {
    handleChange(s);
  }

  function handleClear() {
    setText("");
    setPreview("");
    setParsed(null);
    fadeAnim.setValue(0);
    onClear();
  }

  return (
    <View style={S.container}>
      {/* Label */}
      <Text style={S.label}>SMART INPUT</Text>
      <Text style={S.sublabel}>Type naturally — we auto-fill the rest</Text>

      {/* Input field */}
      <View style={[S.inputWrap, focused && S.inputWrapFocused]}>
        <Text style={S.inputIcon}>✨</Text>
        <TextInput
          style={S.input}
          placeholder="e.g. Swiggy 450 or Uber yesterday"
          placeholderTextColor="#9CA3AF"
          value={text}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        {text.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={S.clearBtn}>
            <Text style={S.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Live preview */}
      {preview.length > 0 && (
        <Animated.View style={[S.previewBox, { opacity: fadeAnim }]}>
          <Text style={S.previewIcon}>{parsed?.categoryIcon || "💰"}</Text>
          <Text style={S.previewText}>{preview}</Text>
          <View
            style={[
              S.confidenceDot,
              {
                backgroundColor:
                  (parsed?.confidence || 0) >= 0.7 ? "#10B981" : "#F59E0B",
              },
            ]}
          />
        </Animated.View>
      )}

      {/* Suggestions — shown when empty */}
      {text.length === 0 && (
        <View style={S.suggestions}>
          <Text style={S.suggestionsLabel}>Try these:</Text>
          <View style={S.suggestionChips}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={S.suggestionChip}
                onPress={() => handleSuggestion(s)}
              >
                <Text style={S.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  label: {
    fontFamily: font.bold,
    fontSize: fontSize.xs,
    color: "#9CA3AF",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sublabel: {
    fontFamily: font.regular,
    fontSize: fontSize.xs,
    color: "#9CA3AF",
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "#E8ECF0",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  inputWrapFocused: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  inputIcon: { fontSize: 18 },
  input: {
    flex: 1,
    fontFamily: font.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    paddingVertical: 14,
  },
  clearBtn: { padding: 4 },
  clearIcon: { fontSize: 14, color: "#9CA3AF" },
  previewBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    backgroundColor: "#F0FDF9",
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  previewIcon: { fontSize: 16 },
  previewText: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: fontSize.sm,
    color: "#0D9488",
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  suggestions: { marginTop: spacing.sm },
  suggestionsLabel: {
    fontFamily: font.medium,
    fontSize: fontSize.xs,
    color: "#9CA3AF",
    marginBottom: 6,
  },
  suggestionChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  suggestionChip: {
    backgroundColor: "#F3F4F6",
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  suggestionText: {
    fontFamily: font.medium,
    fontSize: fontSize.xs,
    color: "#374151",
  },
});
