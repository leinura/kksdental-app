import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme/colors";

export default function StubScreen({ title }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>This screen is next up on the build list.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white, padding: spacing.lg },
  title: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
});
