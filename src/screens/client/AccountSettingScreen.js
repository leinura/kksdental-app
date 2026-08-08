import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { colors, spacing } from "../../theme/colors";

const MENU_ITEMS = ["Edit Profile", "Security & Authentication", "Privacy & Data Control", "Change Password"];

const ROUTES = {
  "Edit Profile": "EditProfile",
  "Security & Authentication": "Security",
  "Change Password": "ChangePassword",
};

export default function AccountSettingScreen({ navigation }) {
  const { logout, user } = useAuth();

  function confirmLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);
  }

  function handleMenuPress(item) {
    const route = ROUTES[item];
    if (route) navigation.navigate(route);
    // "Privacy & Data Control" isn't wired up yet - tapping it does nothing.
  }

  return (
    <View style={styles.container}>
      {user?.clinic && <Text style={styles.clinicName}>{user.clinic.name}</Text>}

      {MENU_ITEMS.map((item) => (
        <TouchableOpacity key={item} style={styles.row} onPress={() => handleMenuPress(item)}>
          <Text style={styles.rowText}>{item}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.row} onPress={confirmLogout}>
        <Text style={[styles.rowText, styles.logoutText]}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingTop: spacing.lg },
  clinicName: { fontSize: 13, color: colors.textMuted, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  row: { paddingVertical: 16, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { fontSize: 15, color: colors.text, fontWeight: "500" },
  logoutText: { color: colors.danger },
});