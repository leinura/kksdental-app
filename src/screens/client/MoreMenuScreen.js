import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing } from "../../theme/colors";

const ITEMS = [
  { label: "Invoice", screen: "Invoices" },
  { label: "Account Setting", screen: "AccountSetting" },
];

export default function MoreMenuScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {ITEMS.map((item) => (
        <TouchableOpacity key={item.screen} style={styles.row} onPress={() => navigation.navigate(item.screen)}>
          <Text style={styles.rowText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingTop: spacing.lg },
  row: { paddingVertical: 16, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { fontSize: 15, color: colors.text, fontWeight: "500" },
});
