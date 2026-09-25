import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../theme/colors";

// FDI primary (baby) teeth notation - quadrants 5/6/7/8, 5 teeth per
// quadrant (no molars beyond the primary second molar). Same reading order
// as the adult chart: top row = upper arch (quadrant 5 then 6), bottom row
// = lower arch (8 then 7).
const UPPER_ROW = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const LOWER_ROW = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

export default function ChildToothChart({ selected, onChange }) {
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
      <Text style={styles.label}>Tooth Number(s) - FDI (Children's / Primary Teeth)</Text>
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