import React, { useState, useRef, useEffect } from "react";
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
  categories: Array<{
    _id: string;
    name: string;
    icon: string;
  }>;

  onParsed: (result: ParsedTransaction) => void;
  onClear: () => void;
}

const SUGGESTIONS = [
  "Swiggy 450",
  "Uber 220",
  "Netflix 649",
  "Zepto 380",
  "Salary 50000",
];

export default function NLPInput({ categories, onParsed, onClear }: Props) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState("");
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);

  const [focused, setFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function runParser(value: string) {
    const result = parseNaturalLanguage(value, categories);

    setParsed(result);

    const previewText = getParsePreview(result);

    setPreview(previewText);

    if (result.confidence >= 0.4 && result.amount) {
      onParsed(result);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }

  function handleChange(value: string) {
    setText(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length < 2) {
      setPreview("");
      setParsed(null);
      onClear();
      return;
    }

    debounceRef.current = setTimeout(() => {
      runParser(value);
    }, 250);
  }

  function handleSuggestion(s: string) {
    setText(s);

    runParser(s);
  }

  function clearInput() {
    setText("");
    setPreview("");
    setParsed(null);

    fadeAnim.setValue(0);

    onClear();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>SMART INPUT</Text>

      <Text style={styles.subLabel}>Type naturally and we’ll auto-fill</Text>

      <View style={[styles.inputContainer, focused && styles.inputFocused]}>
        <Text style={styles.sparkle}>✨</Text>

        <TextInput
          style={styles.input}
          placeholder="Swiggy 450"
          placeholderTextColor="#9CA3AF"
          value={text}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
        />

        {text.length > 0 && (
          <TouchableOpacity
            onPress={clearInput}
            hitSlop={{
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
            }}
          >
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {preview.length > 0 && (
        <Animated.View
          style={[
            styles.previewBox,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.previewEmoji}>
            {parsed?.categoryIcon || "💰"}
          </Text>

          <Text style={styles.previewText}>{preview}</Text>
        </Animated.View>
      )}

      {text.length === 0 && (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.chip}
              onPress={() => handleSuggestion(item)}
            >
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },

  label: {
    fontFamily: font.bold,
    fontSize: 11,
    color: "#9CA3AF",
    letterSpacing: 1,
    marginBottom: 4,
  },

  subLabel: {
    fontFamily: font.regular,
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 10,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    borderWidth: 1.5,
    borderColor: "#E5E7EB",

    paddingHorizontal: 16,

    minHeight: 58,
  },

  inputFocused: {
    borderColor: colors.primary,
  },

  sparkle: {
    fontSize: 18,
    marginRight: 10,
  },

  input: {
    flex: 1,

    fontFamily: font.medium,
    fontSize: 16,

    color: colors.textPrimary,

    paddingVertical: 14,
  },

  clear: {
    fontSize: 14,
    color: "#9CA3AF",
  },

  previewBox: {
    marginTop: 10,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#ECFDF5",

    borderRadius: 14,

    borderWidth: 1,
    borderColor: "#A7F3D0",

    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  previewEmoji: {
    fontSize: 18,
    marginRight: 8,
  },

  previewText: {
    flex: 1,

    fontFamily: font.semibold,
    fontSize: 14,

    color: "#047857",
  },

  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",

    gap: 8,

    marginTop: 12,
  },

  chip: {
    backgroundColor: "#F3F4F6",

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: 999,
  },

  chipText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: "#374151",
  },
});
