import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

export default function ForLabScreen({ navigation }) {
  const [clinics, setClinics] = useState([]);
  const [orderCounts, setOrderCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [clinicsRes, casesRes] = await Promise.all([
        apiClient.get("/clinics"),
        apiClient.get("/cases"),
      ]);
      setClinics(clinicsRes.data);

      const counts = {};
      casesRes.data.forEach((c) => {
        counts[c.clinicId] = (counts[c.clinicId] || 0) + 1;
      });
      setOrderCounts(counts);
    } catch (err) {
      // keep whatever was already loaded on a transient failure
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>For Lab</Text>
      <Text style={styles.subheading}>Pick a clinic to see their orders.</Text>

      <FlatList
        data={clinics}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No clinics yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("ForLabOrders", { clinicId: item.id, clinicName: item.name })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.clinicName}>{item.name}</Text>
              {!item.active && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>Inactive</Text>
                </View>
              )}
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{orderCounts[item.id] || 0}</Text>
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
  heading: { fontSize: 22, fontWeight: "700", color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  subheading: { fontSize: 13, color: colors.textMuted, paddingHorizontal: spacing.lg, marginTop: 4, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clinicName: { fontSize: 16, fontWeight: "700", color: colors.text },
  inactiveBadge: { backgroundColor: "#FBEAEA", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, alignSelf: "flex-start" },
  inactiveBadgeText: { color: colors.danger, fontSize: 10, fontWeight: "700" },
  countBadge: {
    backgroundColor: colors.dark,
    borderRadius: 999,
    minWidth: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countText: { color: colors.white, fontSize: 13, fontWeight: "700" },
  arrow: { fontSize: 20, color: colors.textMuted },
});