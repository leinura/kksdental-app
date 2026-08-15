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
import { useCatalog } from "../../hooks/useCatalog";
import CaseDetailsFields from "../../components/CaseDetailsFields";
import UpiQrModal from "../../components/UpiQrModal";
import { PaymentTag } from "../../components/StatusBadge";
import { colors, spacing, radius } from "../../theme/colors";

export default function BillingScreen({ navigation, route }) {
  const { loading: loadingCatalog, services, warranties, toothShades, priceList, reload } = useCatalog();
  const [refreshing, setRefreshing] = useState(false);

  const [allPatients, setAllPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null); // null = not searching, show allPatients instead

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientOrders, setPatientOrders] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [serviceId, setServiceId] = useState(null);
  const [serviceTypeId, setServiceTypeId] = useState(null);
  const [warrantyId, setWarrantyId] = useState(null);
  const [toothShadeId, setToothShadeId] = useState(null);
  const [toothNumbers, setToothNumbers] = useState([]);
  const [quantityOverride, setQuantityOverride] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    await Promise.all([reload(), loadPatients()]);
    setRefreshing(false);
  }

  // Coming from "Continue to Billing" style flows in the past - kept for
  // compatibility in case anything still navigates here with a patient param.
  useEffect(() => {
    if (route.params?.patient) {
      const { patient, prefill } = route.params;
      selectPatient(patient);
      if (prefill) {
        setServiceId(prefill.serviceId ?? null);
        setServiceTypeId(prefill.serviceTypeId ?? null);
        setWarrantyId(prefill.warrantyId ?? null);
        setToothShadeId(prefill.toothShadeId ?? null);
        setToothNumbers(prefill.toothNumbers ?? []);
        setQuantityOverride(prefill.quantityOverride ?? null);
      }
      navigation.setParams({ patient: undefined, prefill: undefined });
    }
  }, [route.params?.patient]);

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

  function resetCaseFields() {
    setServiceId(null);
    setServiceTypeId(null);
    setWarrantyId(null);
    setToothShadeId(null);
    setToothNumbers([]);
    setQuantityOverride(null);
  }

  async function selectPatient(patient) {
    setSelectedPatient(patient);
    resetCaseFields();
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

  // Every order starts unpaid regardless of how the clinic intends to pay -
  // Cash and UPI both require the lab to confirm receipt afterward. Returns
  // the created case (or null on failure) so callers can react accordingly.
  async function submitOrder() {
    if (!serviceId || !serviceTypeId || !warrantyId) {
      Alert.alert("Missing information", "Select a Service, Service Type, and Warranty first.");
      return null;
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
      });
      resetCaseFields();
      loadPatientOrders(selectedPatient.id);
      return res.data;
    } catch (err) {
      Alert.alert("Order failed", err.response?.data?.error || "Please try again.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOrderNow() {
    const order = await submitOrder();
    if (order) {
      Alert.alert(
        "Order Placed",
        `Case ${order.caseCode} created for ${selectedPatient.fullName}. Total: ₹${Number(order.totalPrice).toFixed(2)} (Payment pending)`
      );
    }
  }

  function handleOrderAndPay() {
    Alert.alert(
      "How will this be paid?",
      "The order will be marked paid once the lab confirms receipt - choosing a method here just shows the clinic how to pay.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Cash", onPress: handleCashOrder },
        { text: "UPI (GPay)", onPress: handleUpiOrder },
      ]
    );
  }

  async function handleCashOrder() {
    const order = await submitOrder();
    if (order) {
      Alert.alert(
        "Order Placed",
        `Case ${order.caseCode} created for ${selectedPatient.fullName}. Total: ₹${Number(order.totalPrice).toFixed(2)}\n\nCash payment noted - the lab will confirm once received.`
      );
    }
  }

  async function handleUpiOrder() {
    const order = await submitOrder();
    if (order) {
      setUpiAmount(order.totalPrice);
      setUpiModalVisible(true);
    }
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

  if (loadingCatalog) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
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

  // --- Step 2: this patient's order history + place a new order ---
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

        <Text style={[styles.sectionHeading, { marginTop: spacing.xl }]}>Place a New Order</Text>

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
            onPress={handleOrderNow}
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

      <UpiQrModal visible={upiModalVisible} amount={upiAmount} onClose={() => setUpiModalVisible(false)} />
    </>
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
  buttonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  orderButton: { flex: 1, borderRadius: radius.pill, paddingVertical: 15, alignItems: "center" },
  orderNowButton: { backgroundColor: colors.dark },
  orderPayButton: { backgroundColor: colors.success },
  orderButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});