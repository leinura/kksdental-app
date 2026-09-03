import React, { useCallback, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import apiClient from "../../api/client";
import { StatusBadge, PaymentTag } from "../../components/StatusBadge";
import { colors, spacing, radius } from "../../theme/colors";

export default function YourOrderScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");

  const loadOrders = useCallback(async (params = {}) => {
    try {
      const res = await apiClient.get("/cases", { params });
      setOrders(res.data);
    } catch (err) {
      // Keep whatever was already on screen rather than clearing it on a
      // transient network error.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders().finally(() => setLoading(false));
    }, [loadOrders])
  );

  async function handleRefresh() {
    setRefreshing(true);
    const params = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    await loadOrders(params);
    setRefreshing(false);
  }

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

  // Patient name filter runs client-side over whatever's already loaded -
  // instant, no extra network round trip, and combines with the date
  // range search above it (which is server-side).
  const visibleOrders = patientQuery.trim()
    ? orders.filter((o) => o.patient?.fullName?.toLowerCase().includes(patientQuery.trim().toLowerCase()))
    : orders;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Order List</Text>
        <TouchableOpacity onPress={() => setShowSearch((s) => !s)}>
          <Text style={styles.searchToggle}>{showSearch ? "Hide search" : "Search by date"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.patientSearchRow}>
        <TextInput
          style={styles.patientSearchInput}
          value={patientQuery}
          onChangeText={setPatientQuery}
          placeholder="Search by patient name"
          placeholderTextColor={colors.textMuted}
        />
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
          data={visibleOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders yet.</Text>}
          renderItem={({ item }) => (
            <OrderRow order={item} onPress={() => navigation.navigate("ClientOrderDetail", { caseId: item.id })} />
          )}
        />
      )}
    </View>
  );
}

function OrderRow({ order, onPress }) {
  const date = new Date(order.createdAt).toLocaleDateString();
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowTop}>
        <Text style={styles.rowDate}>{date}</Text>
        <StatusBadge status={order.deliveryStatus} />
      </View>
      <Text style={styles.rowTitle}>
        {order.patient?.fullName} · {order.service?.name}
      </Text>
      <View style={styles.rowBottom}>
        <Text style={styles.rowCode}>{order.caseCode}</Text>
        <PaymentTag paymentStatus={order.paymentStatus} />
      </View>
    </TouchableOpacity>
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
  patientSearchRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  patientSearchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
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
  rowTitle: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 6 },
  rowBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowCode: { fontSize: 12, color: colors.textMuted },
});