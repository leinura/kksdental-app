import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

const STATUS_COLORS = {
  PENDING: colors.statusPending,
  IN_PROGRESS: colors.statusInProgress,
  COMPLETED: colors.statusCompleted,
};

const STATUS_LABELS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export default function YourOrderScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const loadOrders = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await apiClient.get("/cases", { params });
      setOrders(res.data);
    } catch (err) {
      // Keep whatever was already on screen rather than clearing it on a
      // transient network error.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  function handleSearch() {
    const params = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    loadOrders(params);
  }

  function clearSearch() {
    setFromDate("");
    setToDate("");
    loadOrders();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Order List</Text>
        <TouchableOpacity onPress={() => setShowSearch((s) => !s)}>
          <Text style={styles.searchToggle}>{showSearch ? "Hide search" : "Search by date"}</Text>
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={styles.searchBox}>
          <View style={styles.searchRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>From</Text>
              <TextInput
                style={styles.dateInput}
                value={fromDate}
                onChangeText={setFromDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>To</Text>
              <TextInput
                style={styles.dateInput}
                value={toDate}
                onChangeText={setToDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
          <View style={styles.searchButtonRow}>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.dark} size="large" style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders yet.</Text>}
          renderItem={({ item }) => <OrderRow order={item} />}
        />
      )}
    </View>
  );
}

function OrderRow({ order }) {
  const date = new Date(order.createdAt).toLocaleDateString();
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.rowDate}>{date}</Text>
        <StatusBadge status={order.deliveryStatus} />
      </View>
      <Text style={styles.rowTitle}>
        {order.patient?.fullName} · {order.service?.name}
      </Text>
      <View style={styles.rowBottom}>
        <Text style={styles.rowCode}>{order.caseCode}</Text>
        <Text style={[styles.paymentTag, order.paymentStatus === "PAID" ? styles.paid : styles.unpaid]}>
          {order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
        </Text>
      </View>
    </View>
  );
}

function StatusBadge({ status }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] || colors.statusPending }]}>
      <Text style={styles.badgeText}>{STATUS_LABELS[status] || status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text },
  searchToggle: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  searchBox: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  searchRow: { flexDirection: "row", gap: spacing.sm },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 12, fontWeight: "600", color: colors.text, marginBottom: 4 },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  searchButtonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  searchButton: { flex: 1, backgroundColor: colors.dark, borderRadius: radius.pill, paddingVertical: 10, alignItems: "center" },
  searchButtonText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  clearButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 10, alignItems: "center" },
  clearButtonText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  rowDate: { fontSize: 12, color: colors.textMuted },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.white },
  rowTitle: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 6 },
  rowBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowCode: { fontSize: 12, color: colors.textMuted },
  paymentTag: { fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, overflow: "hidden" },
  paid: { color: colors.success, backgroundColor: "#E4F5EF" },
  unpaid: { color: colors.danger, backgroundColor: "#FBEAEA" },
});