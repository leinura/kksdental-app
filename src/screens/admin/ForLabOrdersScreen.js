import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import apiClient from "../../api/client";
import { StatusBadge, PaymentTag } from "../../components/StatusBadge";
import { colors, spacing, radius } from "../../theme/colors";

export default function ForLabOrdersScreen({ route, navigation }) {
  const { clinicId, clinicName } = route.params;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const res = await apiClient.get("/cases", { params: { clinicId } });
      setOrders(res.data);
    } catch (err) {
      // keep whatever was already loaded on a transient failure
    }
  }, [clinicId]);

  useEffect(() => {
    navigation.setOptions({ title: clinicName || "Clinic Orders" });
    setLoading(true);
    loadOrders().finally(() => setLoading(false));
  }, [loadOrders]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadOrders();
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
      <Text style={styles.subheading}>{orders.length} order{orders.length === 1 ? "" : "s"}</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders from this clinic yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("OrderDetail", { caseId: item.id })}>
            <View style={styles.rowTop}>
              <Text style={styles.rowDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              <StatusBadge status={item.deliveryStatus} />
            </View>
            <Text style={styles.rowTitle}>
              {item.patient?.fullName} · {item.service?.name}
            </Text>
            <View style={styles.rowBottom}>
              <Text style={styles.rowCode}>{item.caseCode}</Text>
              <PaymentTag paymentStatus={item.paymentStatus} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  subheading: { fontSize: 13, color: colors.textMuted, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  rowDate: { fontSize: 12, color: colors.textMuted },
  rowTitle: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 6 },
  rowBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowCode: { fontSize: 12, color: colors.textMuted },
});