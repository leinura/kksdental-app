import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { colors, spacing } from "../../theme/colors";

const MENU_ITEMS = ["Edit Profile", "Authentication", "Security"];

const ROUTES = {
  "Edit Profile": "EditProfile",
  Authentication: "ChangePassword",
  Security: "Security",
};

export default function AdminAccountSettingScreen({ navigation }) {
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
  }

  return (
    <View style={styles.container}>
      {user?.name && <Text style={styles.name}>{user.name}</Text>}

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
  name: { fontSize: 13, color: colors.textMuted, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  row: { paddingVertical: 16, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { fontSize: 15, color: colors.text, fontWeight: "600" },
  logoutText: { color: colors.danger },
});