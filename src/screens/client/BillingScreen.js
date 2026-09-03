import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import apiClient from "../../api/client";
import UpiQrModal from "../../components/UpiQrModal";
import { PaymentTag } from "../../components/StatusBadge";
import { colors, spacing, radius } from "../../theme/colors";

// Billing is now purely for looking up a patient's account and settling
// unpaid orders - placing NEW orders moved to Your Order > tap an order >
// "Place a New Order", so it lives alongside that patient's order history
// instead of duplicating a whole separate flow here.
export default function BillingScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const [allPatients, setAllPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null); // null = not searching, show allPatients instead

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientOrders, setPatientOrders] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [upiAmount, setUpiAmount] = useState(0);

  const loadPatients = useCallback(async () => {
    try {
      const res = await apiClient.get("/patients");
      setAllPatients(res.data);
    } catch (err) {
      // keep whatever was already loaded on a transient failure
    }
  }, []);

  useEffect(() => {
    setLoadingPatients(true);
    loadPatients().finally(() => setLoadingPatients(false));
  }, [loadPatients]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  }

  async function handleSearch() {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await apiClient.get("/patients/search", { params: { query } });
      setSearchResults(res.data);
      if (res.data.length === 0) {
        Alert.alert("No patients found", "Double check the ID or name, or register them first.");
      }
    } catch (err) {
      Alert.alert("Search failed", err.response?.data?.error || "Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function selectPatient(patient) {
    setSelectedPatient(patient);
    loadPatientOrders(patient.id);
  }

  async function loadPatientOrders(patientId) {
    setLoadingOrders(true);
    try {
      const res = await apiClient.get(`/patients/${patientId}`);
      setPatientOrders(res.data.cases || []);
    } catch (err) {
      setPatientOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }

  function backToSearch() {
    setSelectedPatient(null);
    setPatientOrders(null);
    setQuery("");
    setSearchResults(null);
  }

  // Reminder for an ALREADY-placed order that's still unpaid - e.g. the
  // first order created automatically during registration. Doesn't change
  // anything server-side, purely shows the clinic how to pay.
  function handleRemindPay(order) {
    Alert.alert(`Pay for ${order.caseCode}`, `₹${Number(order.totalPrice).toFixed(2)} - how will this be paid?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Cash",
        onPress: () =>
          Alert.alert("Cash payment noted", "The lab will confirm once received."),
      },
      {
        text: "UPI (GPay)",
        onPress: () => {
          setUpiAmount(order.totalPrice);
          setUpiModalVisible(true);
        },
      },
    ]);
  }

  // --- Step 1: browse or search for a patient ---
  if (!selectedPatient) {
    const listData = searchResults !== null ? searchResults : allPatients;
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.heading}>Billing</Text>
          <Text style={styles.helperText}>Search, or pick a patient below.</Text>

          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, styles.searchInput]}
              value={query}
              onChangeText={(v) => {
                setQuery(v);
                if (!v.trim()) setSearchResults(null);
              }}
              placeholder="Patient ID or Patient Name"
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={handleSearch}
            />
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searching}>
            {searching ? <ActivityIndicator color={colors.white} /> : <Text style={styles.searchButtonText}>Search</Text>}
          </TouchableOpacity>
        </View>

        {loadingPatients ? (
          <ActivityIndicator color={colors.dark} size="large" style={{ marginTop: spacing.xl }} />
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No patients registered yet.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => selectPatient(item)}>
                <View>
                  <Text style={styles.resultName}>{item.fullName}</Text>
                  <Text style={styles.resultMeta}>{item.patientCode}</Text>
                </View>
                <Text style={styles.resultArrow}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // --- Step 2: this patient's order history + settle payment ---
  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadPatientOrders(selectedPatient.id)} />
        }
      >
        <TouchableOpacity onPress={backToSearch}>
          <Text style={styles.backLink}>‹ Back to patients</Text>
        </TouchableOpacity>

        <View style={styles.patientCard}>
          <Text style={styles.patientName}>{selectedPatient.fullName}</Text>
          <Text style={styles.patientMeta}>
            {selectedPatient.patientCode} · {selectedPatient.gender} · {selectedPatient.age} yrs
          </Text>
        </View>

        <Text style={styles.sectionHeading}>Order History</Text>
        {loadingOrders ? (
          <ActivityIndicator color={colors.dark} style={{ marginVertical: spacing.md }} />
        ) : patientOrders && patientOrders.length > 0 ? (
          patientOrders.map((order) => (
            <View key={order.id} style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderCode}>{order.caseCode}</Text>
                <Text style={styles.orderMeta}>₹{Number(order.totalPrice).toFixed(2)}</Text>
              </View>
              <PaymentTag paymentStatus={order.paymentStatus} />
              {order.paymentStatus !== "PAID" && (
                <TouchableOpacity style={styles.payButton} onPress={() => handleRemindPay(order)}>
                  <Text style={styles.payButtonText}>Pay</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No orders yet.</Text>
        )}
      </ScrollView>

      <UpiQrModal visible={upiModalVisible} amount={upiAmount} onClose={() => setUpiModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.lg },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  helperText: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg },
  searchRow: { marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  searchInput: {},
  searchButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: "center",
  },
  searchButtonText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  resultsList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.md },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultName: { fontSize: 15, fontWeight: "600", color: colors.text },
  resultMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  resultArrow: { fontSize: 20, color: colors.textMuted },
  backLink: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.md },
  patientCard: {
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  patientName: { fontSize: 17, fontWeight: "700", color: colors.text },
  patientMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  sectionHeading: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderCode: { fontSize: 13, fontWeight: "700", color: colors.text },
  orderMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  payButton: { backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  payButtonText: { color: colors.white, fontSize: 11, fontWeight: "700" },
});