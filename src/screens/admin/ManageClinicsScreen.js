import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import apiClient from "../../api/client";
import { Field } from "../../components/FormControls";
import { colors, spacing, radius } from "../../theme/colors";

const EMPTY_FORM = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  username: "",
  password: "",
};

export default function ManageClinicsScreen() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadClinics = useCallback(async () => {
    try {
      const res = await apiClient.get("/clinics");
      setClinics(res.data);
    } catch (err) {
      Alert.alert("Couldn't load clinics", err.response?.data?.error || "Please try again.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadClinics().finally(() => setLoading(false));
  }, [loadClinics]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadClinics();
    setRefreshing(false);
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate() {
    const { name, contactPerson, email, phone, address, username, password } = form;
    if (!name || !contactPerson || !email || !phone || !address || !username || !password) {
      Alert.alert("Missing information", "All fields are required to create a clinic account.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/clinics", form);
      Alert.alert("Clinic Created", `${name}'s account is ready. Share the username/password with them directly.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadClinics();
    } catch (err) {
      Alert.alert("Couldn't create clinic", err.response?.data?.error || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (showForm) {
    return (
      <View style={styles.container}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setShowForm(false)}>
            <Text style={styles.backLink}>‹ Back to list</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={[1]}
          keyExtractor={() => "form"}
          contentContainerStyle={styles.formContent}
          renderItem={() => (
            <View>
              <Text style={styles.heading}>Add New Clinic</Text>

              <Field label="Clinic Name *">
                <TextInput style={styles.input} value={form.name} onChangeText={(v) => updateField("name", v)} />
              </Field>
              <Field label="Contact Person *">
                <TextInput
                  style={styles.input}
                  value={form.contactPerson}
                  onChangeText={(v) => updateField("contactPerson", v)}
                />
              </Field>
              <Field label="Email Address *">
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(v) => updateField("email", v)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </Field>
              <Field label="Mobile Number *">
                <TextInput
                  style={styles.input}
                  value={form.phone}
                  onChangeText={(v) => updateField("phone", v)}
                  keyboardType="phone-pad"
                />
              </Field>
              <Field label="Address *">
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.address}
                  onChangeText={(v) => updateField("address", v)}
                  multiline
                />
              </Field>

              <Text style={styles.sectionLabel}>Login Credentials</Text>
              <Field label="Username *">
                <TextInput
                  style={styles.input}
                  value={form.username}
                  onChangeText={(v) => updateField("username", v)}
                  autoCapitalize="none"
                />
              </Field>
              <Field label="Password *">
                <TextInput
                  style={styles.input}
                  value={form.password}
                  onChangeText={(v) => updateField("password", v)}
                  secureTextEntry
                />
              </Field>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitText}>Create Clinic Account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <View>
          <Text style={styles.heading}>Clinic Management</Text>
          <Text style={styles.subheading}>{clinics.length} Total Clinics</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>+ Add New Clinic</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.dark} size="large" style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={clinics}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No clinics yet - tap "Add New Clinic" to create the first one.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.clinicRow}>
              <Text style={styles.clinicName}>{item.name}</Text>
              <Text style={styles.clinicMeta}>{item.contactPerson}</Text>
              <Text style={styles.clinicMeta}>{item.email}</Text>
              <Text style={styles.clinicMeta}>{item.phone}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.lg,
  },
  heading: { fontSize: 20, fontWeight: "700", color: colors.text },
  subheading: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  addButton: { backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  clinicRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  clinicName: { fontSize: 16, fontWeight: "700", color: colors.text },
  clinicMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  formHeader: { padding: spacing.lg, paddingBottom: 0 },
  backLink: { color: colors.textMuted, fontSize: 14 },
  formContent: { padding: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: spacing.sm, marginBottom: spacing.md },
  submitButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.md,
  },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});