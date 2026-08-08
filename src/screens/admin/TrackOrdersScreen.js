import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import apiClient from "../../api/client";
import { STATUS_COLORS, STATUS_LABELS, PaymentTag } from "../../components/StatusBadge";
import { colors, spacing, radius } from "../../theme/colors";

const DELIVERY_STAGES = ["PENDING", "IN_PROGRESS", "COMPLETED"];

export default function TrackOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/cases");
      setOrders(res.data);
    } catch (err) {
      Alert.alert("Couldn't load orders", "Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function updateStatus(orderId, body) {
    setUpdatingId(orderId);
    try {
      await apiClient.patch(`/cases/${orderId}/status`, body);
      await loadOrders();
    } catch (err) {
      Alert.alert("Update failed", err.response?.data?.error || "Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleMarkPaid(order) {
    Alert.alert(
      "Mark as Paid",
      `Confirm ${order.patient?.fullName}'s order (₹${Number(order.totalPrice).toFixed(2)}) has been paid?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => updateStatus(order.id, { paymentStatus: "PAID" }) },
      ]
    );
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
      <View style={styles.header}>
        <Text style={styles.heading}>Track Orders</Text>
        <Text style={styles.subheading}>Tap a stage or payment status to update it live.</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders yet.</Text>}
        renderItem={({ item }) => {
          const isUpdating = updatingId === item.id;
          return (
            <View style={styles.row}>
              <Text style={styles.rowClinic}>{item.clinic?.name}</Text>
              <Text style={styles.rowTitle}>
                {item.patient?.fullName} · {item.service?.name}
              </Text>
              <Text style={styles.rowCode}>{item.caseCode}</Text>

              <View style={styles.stageRow}>
                {DELIVERY_STAGES.map((stage) => {
                  const active = item.deliveryStatus === stage;
                  return (
                    <TouchableOpacity
                      key={stage}
                      style={[
                        styles.stagePill,
                        active && { backgroundColor: STATUS_COLORS[stage], borderColor: STATUS_COLORS[stage] },
                      ]}
                      disabled={isUpdating || active}
                      onPress={() => updateStatus(item.id, { deliveryStatus: stage })}
                    >
                      <Text style={[styles.stageText, active && styles.stageTextActive]}>
                        {STATUS_LABELS[stage]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.paymentRow}>
                <PaymentTag paymentStatus={item.paymentStatus} />
                {item.paymentStatus !== "PAID" && (
                  <TouchableOpacity
                    style={styles.markPaidButton}
                    disabled={isUpdating}
                    onPress={() => handleMarkPaid(item)}
                  >
                    <Text style={styles.markPaidText}>Mark as Paid</Text>
                  </TouchableOpacity>
                )}
                {isUpdating && <ActivityIndicator size="small" color={colors.dark} style={{ marginLeft: spacing.sm }} />}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text },
  subheading: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowClinic: { fontSize: 12, color: colors.textMuted, fontWeight: "600", marginBottom: 2 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 2 },
  rowCode: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.sm },
  stageRow: { flexDirection: "row", gap: 6, marginBottom: spacing.sm },
  stagePill: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    alignItems: "center",
  },
  stageText: { fontSize: 11, fontWeight: "700", color: colors.textMuted },
  stageTextActive: { color: colors.white },
  paymentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  markPaidButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  markPaidText: { color: colors.white, fontSize: 11, fontWeight: "700" },
});