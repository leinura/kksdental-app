import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import apiClient from "../../api/client";
import { STATUS_COLORS, STATUS_LABELS } from "../../components/StatusBadge";
import { colors, spacing, radius } from "../../theme/colors";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CHART_HEIGHT = 100;

// Brand colors first, then extra distinct hues for labs with more than a
// handful of services - cycles if there are ever more services than colors.
const SERVICE_COLOR_PALETTE = [
  "#6B21A8",
  "#DB2777",
  "#1D9E75",
  "#EF9F27",
  "#3742FA",
  "#E24B4A",
  "#0EA5E9",
  "#84CC16",
];

function lastSevenDays() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export default function AdminDashboardScreen() {
  const [cases, setCases] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCases = useCallback(async () => {
    try {
      const res = await apiClient.get("/cases");
      setCases(res.data);
    } catch (err) {
      setCases((prev) => prev ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCases();
    }, [loadCases])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadCases();
    setRefreshing(false);
  }

  if (cases === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  const days = lastSevenDays();

  // Every distinct service name that appears anywhere in the data, sorted
  // so the color assignment is stable across reloads (not dependent on
  // fetch order) and so the stacking order looks consistent day to day.
  const serviceNames = Array.from(new Set(cases.map((c) => c.service?.name || "Other"))).sort();
  const colorForService = (name) => SERVICE_COLOR_PALETTE[serviceNames.indexOf(name) % SERVICE_COLOR_PALETTE.length];

  // Per-day breakdown: how many of each service landed on that day.
  const dailyServiceCounts = days.map((day) => {
    const dayCases = cases.filter((c) => new Date(c.createdAt).toDateString() === day.toDateString());
    const counts = {};
    dayCases.forEach((c) => {
      const name = c.service?.name || "Other";
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  });
  const dailyTotals = dailyServiceCounts.map((counts) => Object.values(counts).reduce((a, b) => a + b, 0));
  const maxCount = Math.max(...dailyTotals, 1);

  const totalRevenue = cases.reduce((sum, c) => sum + Number(c.totalPrice), 0);
  const paidAmount = cases.filter((c) => c.paymentStatus === "PAID").reduce((sum, c) => sum + Number(c.totalPrice), 0);
  const unpaidAmount = totalRevenue - paidAmount;

  const statusCounts = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 };
  cases.forEach((c) => {
    if (statusCounts[c.deliveryStatus] !== undefined) statusCounts[c.deliveryStatus] += 1;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Text style={styles.pageHeading}>Dashboard</Text>

      {/* Weekly growth - stacked by service */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly Order Volume</Text>
        <View style={styles.chartRow}>
          {dailyTotals.map((total, i) => (
            <View key={i} style={styles.barColumn}>
              <Text style={styles.barCount}>{total}</Text>
              <View style={styles.barTrack}>
                <View style={styles.barStack}>
                  {serviceNames.map((name) => {
                    const count = dailyServiceCounts[i][name];
                    if (!count) return null;
                    const segmentHeight = (count / maxCount) * CHART_HEIGHT;
                    return (
                      <View
                        key={name}
                        style={{ height: Math.max(segmentHeight, 3), backgroundColor: colorForService(name) }}
                      />
                    );
                  })}
                </View>
              </View>
              <Text style={styles.barLabel}>{DAY_LABELS[days[i].getDay()]}</Text>
            </View>
          ))}
        </View>

        {serviceNames.length > 0 && (
          <View style={styles.legend}>
            {serviceNames.map((name) => (
              <View key={name} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colorForService(name) }]} />
                <Text style={styles.legendText}>{name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Payment summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>₹{totalRevenue.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Collected</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>₹{paidAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Outstanding</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>₹{unpaidAmount.toFixed(2)}</Text>
          </View>
        </View>
        {totalRevenue > 0 && (
          <View style={styles.proportionBar}>
            <View style={[styles.proportionFill, { flex: paidAmount, backgroundColor: colors.success }]} />
            <View style={{ flex: unpaidAmount || 0.001, backgroundColor: colors.danger }} />
          </View>
        )}
      </View>

      {/* Progress overview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Case Progress</Text>
        <View style={styles.progressRow}>
          {Object.keys(statusCounts).map((status) => (
            <View key={status} style={styles.progressItem}>
              <View style={[styles.progressDot, { backgroundColor: STATUS_COLORS[status] }]} />
              <Text style={styles.progressCount}>{statusCounts[status]}</Text>
              <Text style={styles.progressLabel}>{STATUS_LABELS[status]}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  pageHeading: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  chartRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: CHART_HEIGHT + 40 },
  barColumn: { alignItems: "center", flex: 1 },
  barCount: { fontSize: 10, color: colors.textMuted, marginBottom: 4 },
  barTrack: { height: CHART_HEIGHT, justifyContent: "flex-end" },
  barStack: { width: 16, borderRadius: 4, overflow: "hidden" },
  barLabel: { fontSize: 10, color: colors.textMuted, marginTop: 6 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: colors.textMuted, fontWeight: "600" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: "700", color: colors.text },
  proportionBar: { flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: colors.border },
  proportionFill: {},
  progressRow: { flexDirection: "row", justifyContent: "space-around" },
  progressItem: { alignItems: "center" },
  progressDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
  progressCount: { fontSize: 18, fontWeight: "800", color: colors.text },
  progressLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});