import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme/colors";

export default function PublicFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>KKSDENTAL LAB</Text>
      <Text style={styles.footerSubtext}>© 2026 by KKSDENTAL LAB.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { backgroundColor: colors.dark, padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  footerText: { color: colors.white, fontSize: 22, fontWeight: "800" },
  footerSubtext: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
});