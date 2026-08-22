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

const EMPTY_FORM = { name: "", email: "", username: "", password: "" };

export default function ManageStaffScreen() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [mode, setMode] = useState("list"); // "list" | "add" | "edit"
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = useCallback(async () => {
    try {
      const res = await apiClient.get("/staff");
      setStaff(res.data);
    } catch (err) {
      Alert.alert("Couldn't load staff", err.response?.data?.error || "Please try again.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadStaff().finally(() => setLoading(false));
  }, [loadStaff]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadStaff();
    setRefreshing(false);
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openAddForm() {
    setEditingStaff(null);
    setForm(EMPTY_FORM);
    setMode("add");
  }

  function openEditForm(member) {
    setEditingStaff(member);
    setForm({ name: member.name, email: member.email, username: "", password: "" });
    setMode("edit");
  }

  function backToList() {
    setMode("list");
    setEditingStaff(null);
    setForm(EMPTY_FORM);
  }

  async function handleCreate() {
    const { name, email, username, password } = form;
    if (!name || !email || !username || !password) {
      Alert.alert("Missing information", "All fields are required to create a staff account.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/staff", form);
      Alert.alert("Staff Account Created", `${name}'s account is ready. Share the username/password with them directly.`);
      backToList();
      loadStaff();
    } catch (err) {
      Alert.alert("Couldn't create account", err.response?.data?.error || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit() {
    const { name, email, username, password } = form;
    if (!name || !email) {
      Alert.alert("Missing information", "Name and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.put(`/staff/${editingStaff.id}`, {
        name,
        email,
        username: username || undefined,
        password: password || undefined,
      });
      Alert.alert("Saved", `${name}'s account has been updated.`);
      backToList();
      loadStaff();
    } catch (err) {
      Alert.alert("Couldn't save changes", err.response?.data?.error || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      `Remove ${editingStaff.name}?`,
      "This permanently deletes their account and login access. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            try {
              await apiClient.delete(`/staff/${editingStaff.id}`);
              backToList();
              loadStaff();
            } catch (err) {
              Alert.alert("Couldn't remove account", err.response?.data?.error || "Please try again.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
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
              <Text style={styles.heading}>{isEdit ? editingStaff.name : "Add Staff Account"}</Text>

              <Field label="Full Name *">
                <TextInput style={styles.input} value={form.name} onChangeText={(v) => updateField("name", v)} />
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

              <Text style={styles.sectionLabel}>Login Credentials</Text>
              <Field label={isEdit ? "Username" : "Username *"}>
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
                  <Text style={styles.submitText}>{isEdit ? "Save Changes" : "Create Account"}</Text>
                )}
              </TouchableOpacity>

              {isEdit && (
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={submitting}>
                  <Text style={styles.deleteButtonText}>Remove Staff Account</Text>
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
          <Text style={styles.heading}>Lab Staff</Text>
          <Text style={styles.subheading}>
            {staff.length} staff account{staff.length === 1 ? "" : "s"}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
          <Text style={styles.addButtonText}>+ Add Staff</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.helperText}>
        Staff accounts can access Dashboard, Orders, and For Lab only - no billing, clinic management, or content
        tools.
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.dark} size="large" style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No staff accounts yet - tap "Add Staff" to create the first one.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.staffRow} onPress={() => openEditForm(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.staffName}>{item.name}</Text>
                <Text style={styles.staffMeta}>{item.email}</Text>
                <Text style={styles.staffMeta}>@{item.username}</Text>
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
    paddingBottom: spacing.sm,
  },
  heading: { fontSize: 20, fontWeight: "700", color: colors.text },
  subheading: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  helperText: { fontSize: 12, color: colors.textMuted, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  addButton: { backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  staffName: { fontSize: 16, fontWeight: "700", color: colors.text },
  staffMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  rowArrow: { fontSize: 20, color: colors.textMuted },
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
  sectionLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: spacing.sm, marginBottom: spacing.md },
  submitButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.md,
  },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  deleteButton: {
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteButtonText: { color: colors.danger, fontWeight: "700", fontSize: 15 },
});