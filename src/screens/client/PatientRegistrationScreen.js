import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import apiClient from "../../api/client";
import { useCatalog } from "../../hooks/useCatalog";
import CaseDetailsFields from "../../components/CaseDetailsFields";
import UpiQrModal from "../../components/UpiQrModal";
import { Field, PillSelect } from "../../components/FormControls";
import { colors, spacing, radius } from "../../theme/colors";

export default function PatientRegistrationScreen() {
  const { loading: loadingCatalog, services, warranties, toothShades, priceList, reload } = useCatalog();
  const [refreshing, setRefreshing] = useState(false);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [serviceId, setServiceId] = useState(null);
  const [serviceTypeId, setServiceTypeId] = useState(null);
  const [warrantyId, setWarrantyId] = useState(null);
  const [toothShadeId, setToothShadeId] = useState(null);
  const [toothNumbers, setToothNumbers] = useState([]);
  const [quantityOverride, setQuantityOverride] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Set right after a successful registration - shows the inline "how will
  // this be paid" step below the form instead of navigating away.
  const [justRegistered, setJustRegistered] = useState(null); // { patient, case }
  const [upiModalVisible, setUpiModalVisible] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  function resetForm() {
    setFullName("");
    setGender("");
    setAge("");
    setServiceId(null);
    setServiceTypeId(null);
    setWarrantyId(null);
    setToothShadeId(null);
    setToothNumbers([]);
    setQuantityOverride(null);
    setJustRegistered(null);
  }

  async function handleRegister() {
    if (!fullName || !gender || !age || !serviceId || !serviceTypeId || !warrantyId) {
      Alert.alert("Missing information", "Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post("/patients/register", {
        fullName,
        gender,
        age: Number(age),
        serviceId,
        serviceTypeId,
        warrantyId,
        toothShadeId,
        toothNumbers,
        quantity: quantityOverride,
      });
      setJustRegistered(res.data);
    } catch (err) {
      Alert.alert("Registration failed", err.response?.data?.error || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCashNoted() {
    Alert.alert(
      "Cash payment noted",
      "The lab will confirm once received. You can start registering the next patient now."
    );
    resetForm();
  }

  function handleUpiSelected() {
    setUpiModalVisible(true);
  }

  function handleUpiModalClose() {
    setUpiModalVisible(false);
    resetForm();
  }

  if (loadingCatalog) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <Text style={styles.heading}>Register Patient</Text>

        <Field label="Patient's Full Name *">
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Patient's Full Name"
            editable={!justRegistered}
          />
        </Field>

        <Field label="Gender *">
          <PillSelect options={["Male", "Female", "Other"]} value={gender} onSelect={justRegistered ? undefined : setGender} />
        </Field>

        <Field label="Age *">
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholder="Age"
            editable={!justRegistered}
          />
        </Field>

        <CaseDetailsFields
          services={services}
          warranties={warranties}
          toothShades={toothShades}
          priceList={priceList}
          serviceId={serviceId}
          setServiceId={justRegistered ? () => {} : setServiceId}
          serviceTypeId={serviceTypeId}
          setServiceTypeId={justRegistered ? () => {} : setServiceTypeId}
          warrantyId={warrantyId}
          setWarrantyId={justRegistered ? () => {} : setWarrantyId}
          toothShadeId={toothShadeId}
          setToothShadeId={justRegistered ? () => {} : setToothShadeId}
          toothNumbers={toothNumbers}
          setToothNumbers={justRegistered ? () => {} : setToothNumbers}
          quantityOverride={quantityOverride}
          setQuantityOverride={justRegistered ? () => {} : setQuantityOverride}
        />

        {!justRegistered && (
          <TouchableOpacity style={styles.submitButton} onPress={handleRegister} disabled={submitting}>
            {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Register</Text>}
          </TouchableOpacity>
        )}

        {justRegistered && (
          <View style={styles.paymentCard}>
            <Text style={styles.paymentHeading}>
              {justRegistered.patient.fullName} registered - Case {justRegistered.case.caseCode}
            </Text>
            <Text style={styles.paymentSubtext}>How will this be paid?</Text>

            <View style={styles.paymentButtonRow}>
              <TouchableOpacity style={[styles.paymentButton, styles.cashButton]} onPress={handleCashNoted}>
                <Text style={styles.paymentButtonText}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.paymentButton, styles.upiButton]} onPress={handleUpiSelected}>
                <Text style={styles.paymentButtonText}>UPI (GPay)</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={resetForm}>
              <Text style={styles.skipLink}>Skip - decide later</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <UpiQrModal
        visible={upiModalVisible}
        amount={justRegistered?.case?.totalPrice || 0}
        onClose={handleUpiModalClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.md,
  },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  paymentCard: {
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.lg,
    alignItems: "center",
  },
  paymentHeading: { fontSize: 15, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: 4 },
  paymentSubtext: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  paymentButtonRow: { flexDirection: "row", gap: spacing.sm, width: "100%" },
  paymentButton: { flex: 1, borderRadius: radius.pill, paddingVertical: 14, alignItems: "center" },
  cashButton: { backgroundColor: colors.dark },
  upiButton: { backgroundColor: colors.success },
  paymentButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  skipLink: { color: colors.textMuted, fontSize: 12, marginTop: spacing.md, textDecorationLine: "underline" },
});