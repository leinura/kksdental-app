import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import apiClient from "../../api/client";
import ToothChart from "../../components/ToothChart";
import { colors, spacing, radius } from "../../theme/colors";

export default function PatientRegistrationScreen() {
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [services, setServices] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [toothShades, setToothShades] = useState([]);
  const [priceList, setPriceList] = useState([]);

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

  useEffect(() => {
    loadCatalog();
  }, []);

  async function loadCatalog() {
    try {
      const [servicesRes, warrantiesRes, shadesRes, priceRes] = await Promise.all([
        apiClient.get("/catalog/services"),
        apiClient.get("/catalog/warranties"),
        apiClient.get("/catalog/tooth-shades"),
        apiClient.get("/catalog/price-list"),
      ]);
      setServices(servicesRes.data);
      setWarranties(warrantiesRes.data);
      setToothShades(shadesRes.data);
      setPriceList(priceRes.data);
    } catch (err) {
      Alert.alert("Couldn't load form options", "Check your connection and try again.");
    } finally {
      setLoadingCatalog(false);
    }
  }

  const selectedService = services.find((s) => s.id === serviceId);
  const serviceTypes = selectedService ? selectedService.serviceTypes : [];
  const quantity = quantityOverride ?? (toothNumbers.length || 1);

  const matchedPrice = priceList.find(
    (p) => p.serviceId === serviceId && p.serviceTypeId === serviceTypeId && p.warrantyId === warrantyId
  );
  const unitPrice = matchedPrice ? Number(matchedPrice.price) : null;
  const totalPrice = unitPrice != null ? unitPrice * quantity : null;

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
      Alert.alert(
        "Patient Registered",
        `${res.data.patient.fullName} (${res.data.patient.patientCode}) registered successfully. Case ${res.data.case.caseCode} created.`
      );
      resetForm();
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      <Field label="Services *">
        <PillSelect
          options={services.map((s) => ({ label: s.name, value: s.id }))}
          value={serviceId}
          onSelect={(id) => {
            setServiceId(id);
            setServiceTypeId(null);
          }}
        />
      </Field>

      {selectedService && (
        <Field label="Service Type *">
          <PillSelect
            options={serviceTypes.map((t) => ({ label: t.name, value: t.id }))}
            value={serviceTypeId}
            onSelect={setServiceTypeId}
          />
        </Field>
      )}

      <Field label="Warranty">
        <PillSelect
          options={warranties.map((w) => ({ label: w.label, value: w.id }))}
          value={warrantyId}
          onSelect={setWarrantyId}
        />
      </Field>

      <Field label="Tooth Shade">
        <PillSelect
          options={toothShades.map((s) => ({ label: s.code, value: s.id }))}
          value={toothShadeId}
          onSelect={setToothShadeId}
        />
      </Field>

      <ToothChart selected={toothNumbers} onChange={setToothNumbers} />

      <Field label="Quantity">
        <TextInput
          style={styles.input}
          value={String(quantity)}
          onChangeText={(v) => setQuantityOverride(v ? Number(v) : null)}
          keyboardType="number-pad"
        />
      </Field>

      <Field label="Price">
        <View style={styles.priceBox}>
          <Text style={styles.priceText}>
            {totalPrice != null ? `₹${totalPrice.toFixed(2)}` : "Select service, type & warranty to see price"}
          </Text>
        </View>
      </Field>

      <TouchableOpacity style={styles.submitButton} onPress={handleRegister} disabled={submitting}>
        {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Register</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function PillSelect({ options, value, onSelect }) {
  const normalized = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  return (
    <View style={styles.pillRow}>
      {normalized.map((opt) => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.lg },
  field: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  pillActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  pillText: { fontSize: 13, color: colors.text, fontWeight: "500" },
  pillTextActive: { color: colors.white },
  priceBox: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  priceText: { fontSize: 16, fontWeight: "700", color: colors.text },
  submitButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.md,
  },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});
