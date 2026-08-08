import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

export default function ReportsScreen({ navigation }) {
  const [allCases, setAllCases] = useState(null);
  const [clinicQuery, setClinicQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases(params = {}) {
    try {
      const res = await apiClient.get("/cases", { params });
      setAllCases(res.data);
      applyClinicFilter(res.data, clinicQuery);
    } catch (err) {
      Alert.alert("Couldn't load report data", "Check your connection and try again.");
    }
  }

  function applyClinicFilter(cases, query) {
    if (!query.trim()) {
      setFiltered(cases);
      return;
    }
    const q = query.trim().toLowerCase();
    setFiltered(cases.filter((c) => c.clinic?.name?.toLowerCase().includes(q)));
  }

  function handleSearch() {
    const params = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    loadCases(params);
  }

  function handleClear() {
    setClinicQuery("");
    setFromDate("");
    setToDate("");
    loadCases();
  }

  // Discount tracking per-case isn't wired up yet (adjustments are recorded
  // at the clinic account level, not per order) - shows as 0 for now.
  const totalOrders = filtered.length;
  const totalAmount = filtered.reduce((sum, c) => sum + Number(c.totalPrice), 0);
  const totalDiscount = 0;
  const finalAmount = totalAmount - totalDiscount;

  async function handleExportCsv() {
    if (filtered.length === 0) {
      Alert.alert("Nothing to export", "No records match the current filters.");
      return;
    }
    const header = "Date,Clinic,Patient Code,Total Amount,Discount,Final Amount";
    const rows = filtered.map((c) => {
      const date = new Date(c.createdAt).toLocaleDateString();
      const amount = Number(c.totalPrice).toFixed(2);
      return `${date},${c.clinic?.name || ""},${c.patient?.patientCode || ""},${amount},0.00,${amount}`;
    });
    const csv = [header, ...rows].join("\n");

    try {
      await Share.share({ title: "KKSDENTAL Lab Financial Report", message: csv });
    } catch (err) {
      Alert.alert("Export failed", "Please try again.");
    }
  }

  const [exportingPdf, setExportingPdf] = useState(false);

  async function handleExportPdf() {
    if (filtered.length === 0) {
      Alert.alert("Nothing to export", "No records match the current filters.");
      return;
    }
    setExportingPdf(true);
    try {
      const token = await AsyncStorage.getItem("kksdental_token");
      const params = new URLSearchParams();
      if (clinicQuery.trim()) params.append("clinicName", clinicQuery.trim());
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const url = `${apiClient.defaults.baseURL}/reports/export-pdf?${params.toString()}`;
      const fileUri = FileSystem.documentDirectory + "kksdental-financial-report.pdf";

      const result = await FileSystem.downloadAsync(url, fileUri, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, { mimeType: "application/pdf" });
      } else {
        Alert.alert("PDF saved", `Saved to ${result.uri}`);
      }
    } catch (err) {
      Alert.alert("Export failed", "Please try again.");
    } finally {
      setExportingPdf(false);
    }
  }

  if (allCases === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={filtered}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <Text style={styles.heading}>Financial Reports</Text>

          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>Clinic Name</Text>
            <TextInput
              style={styles.input}
              value={clinicQuery}
              onChangeText={(v) => {
                setClinicQuery(v);
                applyClinicFilter(allCases, v);
              }}
              placeholder="e.g., Smile Dental"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.filterLabel}>From Date</Text>
                <TextInput
                  style={styles.input}
                  value={fromDate}
                  onChangeText={setFromDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.filterLabel}>To Date</Text>
                <TextInput
                  style={styles.input}
                  value={toDate}
                  onChangeText={setToDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
            <View style={styles.filterButtonRow}>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryCard label="Total Orders" value={String(totalOrders)} />
            <SummaryCard label="Total Amount" value={`₹${totalAmount.toFixed(2)}`} />
            <SummaryCard label="Total Discount" value={`₹${totalDiscount.toFixed(2)}`} />
            <SummaryCard label="Final Amount" value={`₹${finalAmount.toFixed(2)}`} highlight />
          </View>

          <View style={styles.exportCard}>
            <View>
              <Text style={styles.exportTitle}>Export Reports</Text>
              <Text style={styles.exportSubtitle}>Download financial data in different formats</Text>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <TouchableOpacity style={styles.exportButton} onPress={handleExportCsv}>
                <Text style={styles.exportButtonText}>CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton} onPress={handleExportPdf} disabled={exportingPdf}>
                {exportingPdf ? (
                  <ActivityIndicator size="small" color={colors.dark} />
                ) : (
                  <Text style={styles.exportButtonText}>PDF</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.recordsHeading}>Financial Records ({filtered.length})</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.emptyText}>No records match these filters.</Text>}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.recordRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.recordClinic}>{item.clinic?.name}</Text>
            <Text style={styles.recordMeta}>
              {new Date(item.createdAt).toLocaleDateString()} · {item.patient?.patientCode}
            </Text>
          </View>
          <Text style={styles.recordAmount}>₹{Number(item.totalPrice).toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() =>
              navigation.navigate("InvoiceDetail", { clinicId: item.clinic?.id, clinicName: item.clinic?.name })
            }
          >
            <Text style={styles.manageButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

function SummaryCard({ label, value, highlight }) {
  return (
    <View style={[styles.summaryCard, highlight && styles.summaryCardHighlight]}>
      <Text style={styles.summaryCardLabel}>{label}</Text>
      <Text style={[styles.summaryCardValue, highlight && styles.summaryCardValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  filterCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  filterLabel: { fontSize: 12, fontWeight: "600", color: colors.text, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dateRow: { flexDirection: "row", gap: spacing.sm },
  dateField: { flex: 1 },
  filterButtonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  searchButton: { flex: 1, backgroundColor: colors.dark, borderRadius: radius.pill, paddingVertical: 10, alignItems: "center" },
  searchButtonText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  clearButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 10, alignItems: "center" },
  clearButtonText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: {
    flexBasis: "47%",
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryCardHighlight: { backgroundColor: colors.dark, borderColor: colors.dark },
  summaryCardLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  summaryCardValue: { fontSize: 16, fontWeight: "700", color: colors.text },
  summaryCardValueHighlight: { color: colors.white },
  exportCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exportTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
  exportSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  exportButton: { borderWidth: 1, borderColor: colors.dark, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8 },
  exportButtonText: { fontSize: 12, fontWeight: "700", color: colors.dark },
  recordsHeading: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.lg },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  recordClinic: { fontSize: 13, fontWeight: "700", color: colors.text },
  recordMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  recordAmount: { fontSize: 13, fontWeight: "700", color: colors.text },
  manageButton: { borderWidth: 1, borderColor: colors.success, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  manageButtonText: { fontSize: 11, fontWeight: "700", color: colors.success },
});