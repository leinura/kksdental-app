import React from "react";
import { View, StyleSheet } from "react-native";
import ClinicLedgerView from "../../components/ClinicLedgerView";
import { colors } from "../../theme/colors";

export default function InvoiceDetailScreen({ route }) {
  const { clinicId } = route.params;

  return (
    <View style={styles.container}>
      <ClinicLedgerView clinicId={clinicId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
});