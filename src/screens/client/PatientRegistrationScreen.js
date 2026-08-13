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
import { Field, PillSelect } from "../../components/FormControls";
import { colors, spacing, radius } from "../../theme/colors";

export default function PatientRegistrationScreen({ navigation }) {
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
      const prefill = { serviceId, serviceTypeId, warrantyId, toothShadeId, toothNumbers, quantityOverride };
      Alert.alert(
        "Patient Registered",
        `${res.data.patient.fullName} (${res.data.patient.patientCode}) registered successfully. Case ${res.data.case.caseCode} created.`,
        [
          {
            text: "Continue to Billing",
            onPress: () => {
              navigation.navigate("Billing", { patient: res.data.patient, prefill });
              resetForm();
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert("Registration failed", err.response?.data?.error || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCatalog) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Text style={styles.heading}>Register Patient</Text>

      <Field label="Patient's Full Name *">
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Patient's Full Name" />
      </Field>

      <Field label="Gender *">
        <PillSelect options={["Male", "Female", "Other"]} value={gender} onSelect={setGender} />
      </Field>

      <Field label="Age *">
        <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="Age" />
      </Field>

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

      <TouchableOpacity style={styles.submitButton} onPress={handleRegister} disabled={submitting}>
        {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Register</Text>}
      </TouchableOpacity>
    </ScrollView>
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
});