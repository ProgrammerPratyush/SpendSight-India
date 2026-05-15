import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontSize, spacing } from "../utils/theme";

export default function CategoryDetailScreen({ navigation, route }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.body}>
        <Text style={styles.placeholder}>Category detail coming next</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  back: { padding: spacing.screenPadding },
  backText: { color: colors.primary, fontSize: fontSize.md, fontWeight: "600" },
  body: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholder: { color: colors.textMuted, fontSize: fontSize.md },
});
