import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import apiClient from "../../api/client";
import { colors, spacing } from "../../theme/colors";

export default function InvoiceScreen({ navigation }) {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/clinics")
      .then((res) => setClinics(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Invoices</Text>
      <Text style={styles.subheading}>Select a clinic to view their full account.</Text>

      <FlatList
        data={clinics}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No clinics yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("InvoiceDetail", { clinicId: item.id, clinicName: item.name })}
          >
            <View>
              <Text style={styles.clinicName}>{item.name}</Text>
              <Text style={styles.clinicMeta}>{item.contactPerson}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  heading: { fontSize: 20, fontWeight: "700", color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  subheading: { fontSize: 12, color: colors.textMuted, paddingHorizontal: spacing.lg, marginTop: 4, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clinicName: { fontSize: 15, fontWeight: "700", color: colors.text },
  clinicMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  arrow: { fontSize: 20, color: colors.textMuted },
});