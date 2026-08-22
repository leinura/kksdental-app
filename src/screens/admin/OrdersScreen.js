import React, { useCallback, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SectionList, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import apiClient from "../../api/client";
import { StatusBadge, PaymentTag } from "../../components/StatusBadge";
import { colors, spacing, radius } from "../../theme/colors";

function isToday(dateString) {
  const d = new Date(dateString);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function sectionTitleFor(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

// Orders already arrive sorted newest-first from the backend - group
// consecutive same-day orders under one date header rather than repeating
// the date on every row.
function groupByDate(orders) {
  const sections = [];
  orders.forEach((order) => {
    const dateKey = new Date(order.createdAt).toDateString();
    const lastSection = sections[sections.length - 1];
    if (lastSection && lastSection.dateKey === dateKey) {
      lastSection.data.push(order);
    } else {
      sections.push({ dateKey, title: sectionTitleFor(order.createdAt), data: [order] });
    }
  });
  return sections;
}

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const loadOrders = useCallback(async (params = {}) => {
    try {
      const res = await apiClient.get("/cases", { params });
      setOrders(res.data);
    } catch (err) {
      // keep existing list on a transient failure
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

  const todayCount = orders.filter((o) => isToday(o.createdAt)).length;
  const sections = groupByDate(orders);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Orders</Text>
          <Text style={styles.subheading}>{todayCount} order{todayCount === 1 ? "" : "s"} today</Text>
        </View>
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
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders yet.</Text>}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("OrderDetail", { caseId: item.id })}>
              <View style={styles.rowTop}>
                <View style={styles.rowClinicRow}>
                  <View style={[styles.pickupDot, { backgroundColor: item.pickedUpAt ? colors.success : colors.danger }]} />
                  <Text style={styles.rowClinic}>{item.clinic?.name}</Text>
                </View>
                <StatusBadge status={item.deliveryStatus} />
              </View>
              <Text style={styles.rowTitle}>
                {item.patient?.fullName} · {item.service?.name}
              </Text>
              {item.comment ? (
                <Text style={styles.rowComment} numberOfLines={1}>
                  💬 {item.comment}
                </Text>
              ) : null}
              <View style={styles.rowBottom}>
                <Text style={styles.rowCode}>{item.caseCode}</Text>
                <PaymentTag paymentStatus={item.paymentStatus} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text },
  subheading: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
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
  sectionHeader: {
    backgroundColor: colors.offWhite,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderText: { fontSize: 13, fontWeight: "800", color: colors.text, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  rowClinicRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pickupDot: { width: 8, height: 8, borderRadius: 4 },
  rowClinic: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  rowTitle: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 6 },
  rowBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowCode: { fontSize: 12, color: colors.textMuted },
  rowComment: { fontSize: 12, color: colors.textMuted, fontStyle: "italic", marginBottom: 6 },
});