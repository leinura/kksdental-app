import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import ClinicLedgerView from "../../components/ClinicLedgerView";
import { colors, spacing } from "../../theme/colors";

export default function InvoicesScreen() {
  const { user } = useAuth();

  if (!user?.clinic?.id) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No clinic account linked to this login.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ClinicLedgerView clinicId={user.clinic.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: colors.white },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
});