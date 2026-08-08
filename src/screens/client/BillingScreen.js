import React, { useState } from "react";
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
} from "react-native";
import apiClient from "../../api/client";
import { useCatalog } from "../../hooks/useCatalog";
import CaseDetailsFields from "../../components/CaseDetailsFields";
import { colors, spacing, radius } from "../../theme/colors";

export default function BillingScreen() {
  const { loading: loadingCatalog, services, warranties, toothShades, priceList } = useCatalog();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [serviceId, setServiceId] = useState(null);
  const [serviceTypeId, setServiceTypeId] = useState(null);
  const [warrantyId, setWarrantyId] = useState(null);
  const [toothShadeId, setToothShadeId] = useState(null);
  const [toothNumbers, setToothNumbers] = useState([]);
  const [quantityOverride, setQuantityOverride] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSearch() {
    if (!query.trim()) {
      Alert.alert("Enter a Patient ID or Patient Name", "The patient should be registered first.");
      return;
    }
    setSearching(true);
    try {
      const res = await apiClient.get("/patients/search", { params: { query } });
      setResults(res.data);
      if (res.data.length === 0) {
        Alert.alert("No patients found", "Double check the ID or name, or register them first.");
      }
    } catch (err) {
      Alert.alert("Search failed", err.response?.data?.error || "Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function resetCaseFields() {
    setServiceId(null);
    setServiceTypeId(null);
    setWarrantyId(null);
    setToothShadeId(null);
    setToothNumbers([]);
    setQuantityOverride(null);
  }

  function selectPatient(patient) {
    setSelectedPatient(patient);
    setResults([]);
    resetCaseFields();
  }

  function backToSearch() {
    setSelectedPatient(null);
    setQuery("");
  }

  async function submitOrder(payNow, paymentMethod) {
    if (!serviceId || !serviceTypeId || !warrantyId) {
      Alert.alert("Missing information", "Select a Service, Service Type, and Warranty first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post("/cases", {
        patientId: selectedPatient.id,
        serviceId,
        serviceTypeId,
        warrantyId,
        toothShadeId,
        toothNumbers,
        quantity: quantityOverride,
        payNow,
        paymentMethod,
      });
      Alert.alert(
        "Order Placed",
        `Case ${res.data.caseCode} created for ${selectedPatient.fullName}. Total: ₹${Number(res.data.totalPrice).toFixed(2)}${
          payNow ? " (Paid)" : " (Payment pending)"
        }`
      );
      resetCaseFields();
    } catch (err) {
      Alert.alert("Order failed", err.response?.data?.error || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOrderAndPay() {
    Alert.alert("How was this paid?", "Choose how to record payment for this order.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Pay Online",
        onPress: () =>
          Alert.alert(
            "Online payments coming soon",
            "Razorpay checkout isn't wired up yet - use \"Mark as Paid Manually\" for now, or \"Order Now\" to leave it unpaid."
          ),
      },
      { text: "Mark as Paid Manually", onPress: () => submitOrder(true, "MANUAL") },
    ]);
  }

  if (loadingCatalog) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  // --- Step 1: search for the patient ---
  if (!selectedPatient) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.heading}>Billing</Text>
          <Text style={styles.helperText}>
            Enter Patient ID or Patient Name. The patient should be registered first.
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, styles.searchInput]}
              value={query}
              onChangeText={setQuery}
              placeholder="Patient ID or Patient Name"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searching}>
            {searching ? <ActivityIndicator color={colors.white} /> : <Text style={styles.searchButtonText}>Search</Text>}
          </TouchableOpacity>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
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
      </View>
    );
  }

  // --- Step 2: place the order for the selected patient ---
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={backToSearch}>
        <Text style={styles.backLink}>‹ Back to search</Text>
      </TouchableOpacity>

      <View style={styles.patientCard}>
        <Text style={styles.patientName}>{selectedPatient.fullName}</Text>
        <Text style={styles.patientMeta}>
          {selectedPatient.patientCode} · {selectedPatient.gender} · {selectedPatient.age} yrs
        </Text>
      </View>

      <CaseDetailsFields
        services={services}
        warranties={warranties}
        toothShades={toothShades}
        priceList={priceList}
        serviceId={serviceId}
        setServiceId={setServiceId}
        serviceTypeId={serviceTypeId}
        setServiceTypeId={setServiceTypeId}
        warrantyId={warrantyId}
        setWarrantyId={setWarrantyId}
        toothShadeId={toothShadeId}
        setToothShadeId={setToothShadeId}
        toothNumbers={toothNumbers}
        setToothNumbers={setToothNumbers}
        quantityOverride={quantityOverride}
        setQuantityOverride={setQuantityOverride}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.orderButton, styles.orderNowButton]}
          onPress={() => submitOrder(false, null)}
          disabled={submitting}
        >
          <Text style={styles.orderButtonText}>Order Now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.orderButton, styles.orderPayButton]}
          onPress={handleOrderAndPay}
          disabled={submitting}
        >
          <Text style={styles.orderButtonText}>Order & Pay</Text>
        </TouchableOpacity>
      </View>
      {submitting && <ActivityIndicator color={colors.dark} style={{ marginTop: spacing.md }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.lg },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
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
  resultsList: { paddingHorizontal: spacing.lg },
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
  buttonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  orderButton: { flex: 1, borderRadius: radius.pill, paddingVertical: 15, alignItems: "center" },
  orderNowButton: { backgroundColor: colors.dark },
  orderPayButton: { backgroundColor: colors.success },
  orderButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});