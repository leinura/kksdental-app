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

  const [mode, setMode] = useState("list"); // "list" | "add" | "edit"
  const [editingClinic, setEditingClinic] = useState(null);
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

  function openAddForm() {
    setEditingClinic(null);
    setForm(EMPTY_FORM);
    setMode("add");
  }

  function openEditForm(clinic) {
    setEditingClinic(clinic);
    setForm({
      name: clinic.name,
      contactPerson: clinic.contactPerson,
      email: clinic.email,
      phone: clinic.phone,
      address: clinic.address,
      username: "",
      password: "",
    });
    setMode("edit");
  }

  function backToList() {
    setMode("list");
    setEditingClinic(null);
    setForm(EMPTY_FORM);
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
      backToList();
      loadClinics();
    } catch (err) {
      Alert.alert("Couldn't create clinic", err.response?.data?.error || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit() {
    const { name, contactPerson, email, phone, address, username, password } = form;
    if (!name || !contactPerson || !email || !phone || !address) {
      Alert.alert("Missing information", "Name, contact person, email, phone, and address are required.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.put(`/clinics/${editingClinic.id}`, {
        name,
        contactPerson,
        email,
        phone,
        address,
        username: username || undefined,
        password: password || undefined,
      });
      Alert.alert("Saved", `${name}'s details have been updated.`);
      backToList();
      loadClinics();
    } catch (err) {
      Alert.alert("Couldn't save changes", err.response?.data?.error || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleToggleActive() {
    const goingActive = !editingClinic.active;
    const verb = goingActive ? "Reactivate" : "Deactivate";
    const message = goingActive
      ? `${editingClinic.name} will be able to log in again.`
      : `${editingClinic.name} will be hidden from active use and won't be able to log in. Their order and payment history is kept - this can be undone anytime.`;

    Alert.alert(`${verb} ${editingClinic.name}?`, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: verb,
        style: goingActive ? "default" : "destructive",
        onPress: async () => {
          setSubmitting(true);
          try {
            await apiClient.put(`/clinics/${editingClinic.id}`, { active: goingActive });
            backToList();
            loadClinics();
          } catch (err) {
            Alert.alert("Couldn't update clinic", err.response?.data?.error || "Please try again.");
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  }

  if (mode === "add" || mode === "edit") {
    const isEdit = mode === "edit";
    return (
      <View style={styles.container}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={backToList}>
            <Text style={styles.backLink}>‹ Back to list</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={[1]}
          keyExtractor={() => "form"}
          contentContainerStyle={styles.formContent}
          renderItem={() => (
            <View>
              <View style={styles.formTitleRow}>
                <Text style={styles.heading}>{isEdit ? editingClinic.name : "Add New Clinic"}</Text>
                {isEdit && !editingClinic.active && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>Inactive</Text>
                  </View>
                )}
              </View>

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
              <Field label={isEdit ? `Username (current: ${editingClinic.user?.username || "-"})` : "Username *"}>
                <TextInput
                  style={styles.input}
                  value={form.username}
                  onChangeText={(v) => updateField("username", v)}
                  autoCapitalize="none"
                  placeholder={isEdit ? "Leave blank to keep current" : ""}
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
              <Field label={isEdit ? "New Password" : "Password *"}>
                <TextInput
                  style={styles.input}
                  value={form.password}
                  onChangeText={(v) => updateField("password", v)}
                  secureTextEntry
                  placeholder={isEdit ? "Leave blank to keep current" : ""}
                  placeholderTextColor={colors.textMuted}
                />
              </Field>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={isEdit ? handleSaveEdit : handleCreate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitText}>{isEdit ? "Save Changes" : "Create Clinic Account"}</Text>
                )}
              </TouchableOpacity>

              {isEdit && (
                <TouchableOpacity
                  style={[styles.toggleButton, editingClinic.active ? styles.deactivateButton : styles.reactivateButton]}
                  onPress={handleToggleActive}
                  disabled={submitting}
                >
                  <Text style={editingClinic.active ? styles.deactivateText : styles.reactivateText}>
                    {editingClinic.active ? "Deactivate Clinic" : "Reactivate Clinic"}
                  </Text>
                </TouchableOpacity>
              )}
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
        <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
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
            <TouchableOpacity style={styles.clinicRow} onPress={() => openEditForm(item)}>
              <View style={{ flex: 1 }}>
                <View style={styles.clinicNameRow}>
                  <Text style={styles.clinicName}>{item.name}</Text>
                  {!item.active && (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>Inactive</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.clinicMeta}>{item.contactPerson}</Text>
                <Text style={styles.clinicMeta}>{item.email}</Text>
                <Text style={styles.clinicMeta}>{item.phone}</Text>
              </View>
              <Text style={styles.rowArrow}>›</Text>
            </TouchableOpacity>
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
  clinicRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clinicNameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  clinicName: { fontSize: 16, fontWeight: "700", color: colors.text },
  clinicMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  rowArrow: { fontSize: 20, color: colors.textMuted },
  inactiveBadge: { backgroundColor: "#FBEAEA", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  inactiveBadgeText: { color: colors.danger, fontSize: 10, fontWeight: "700" },
  formHeader: { padding: spacing.lg, paddingBottom: 0 },
  backLink: { color: colors.textMuted, fontSize: 14 },
  formContent: { padding: spacing.lg },
  formTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
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
  toggleButton: {
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.md,
    borderWidth: 1,
  },
  deactivateButton: { borderColor: colors.danger },
  reactivateButton: { borderColor: colors.success },
  deactivateText: { color: colors.danger, fontWeight: "700", fontSize: 15 },
  reactivateText: { color: colors.success, fontWeight: "700", fontSize: 15 },
});