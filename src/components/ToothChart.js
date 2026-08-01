import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../theme/colors";

// FDI two-digit notation, laid out the way a dentist actually reads a chart:
// top row = upper arch (quadrant 1 then 2), bottom row = lower arch (4 then 3).
const UPPER_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export default function ToothChart({ selected, onChange }) {
  function toggleTooth(num) {
    const code = String(num);
    const isSelected = selected.includes(code);
    const next = isSelected ? selected.filter((t) => t !== code) : [...selected, code];
    onChange(next);
  }

  function renderRow(row) {
    return (
      <View style={styles.row}>
        {row.map((num) => {
          const code = String(num);
          const active = selected.includes(code);
          return (
            <TouchableOpacity
              key={code}
              onPress={() => toggleTooth(num)}
              style={[styles.tooth, active && styles.toothActive]}
            >
              <Text style={[styles.toothText, active && styles.toothTextActive]}>{num}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tooth Number(s) - FDI</Text>
      {renderRow(UPPER_ROW)}
      <View style={styles.divider} />
      {renderRow(LOWER_ROW)}
      {selected.length > 0 && (
        <Text style={styles.summary}>{selected.length} tooth/teeth selected: {selected.join(", ")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: spacing.sm },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  divider: { height: spacing.md },
  tooth: {
    width: 34,
    height: 34,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  toothActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  toothText: { fontSize: 11, color: colors.text, fontWeight: "600" },
  toothTextActive: { color: colors.white },
  summary: { marginTop: spacing.sm, fontSize: 12, color: colors.textMuted },
});
