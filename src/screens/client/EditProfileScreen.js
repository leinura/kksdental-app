import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import apiClient from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { colors, spacing, radius } from "../../theme/colors";

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const clinic = user?.clinic || {};
  const [name, setName] = useState(clinic.name || "");
  const [contactPerson, setContactPerson] = useState(clinic.contactPerson || "");
  const [email, setEmail] = useState(clinic.email || "");
  const [phone, setPhone] = useState(clinic.phone || "");
  const [address, setAddress] = useState(clinic.address || "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    if (!name || !contactPerson || !email || !phone || !address) {
      Alert.alert("Missing information", "All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.patch("/clinics/me", { name, contactPerson, email, phone, address });
      await updateUser({ clinic: res.data });
      Alert.alert("Profile Updated", "Your clinic details have been saved.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Couldn't update profile", err.response?.data?.error || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Clinic Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Contact Person</Text>
      <TextInput style={styles.input} value={contactPerson} onChangeText={setContactPerson} />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>Address</Text>
      <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} multiline />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={submitting}>
        {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.lg },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
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
  button: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});