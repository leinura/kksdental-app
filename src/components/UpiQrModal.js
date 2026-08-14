import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { colors, spacing, radius } from "../theme/colors";

// Swap the placeholder box below for a real image once the lab's GPay QR
// code is added to the project, e.g.:
// <Image source={require("../../assets/images/upi-qr.png")} style={styles.qrImage} />
export default function UpiQrModal({ visible, amount, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Pay via UPI (GPay)</Text>
          <Text style={styles.amount}>₹{Number(amount).toFixed(2)}</Text>

          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>QR Code{"\n"}Coming Soon</Text>
          </View>

          <Text style={styles.instructions}>
            Scan this code with GPay to pay the amount above. This order will show as paid once
            the lab confirms the payment was received - it won't update automatically.
          </Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(10,10,10,0.6)", justifyContent: "center", padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: radius.card, padding: spacing.lg, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 },
  amount: { fontSize: 24, fontWeight: "800", color: colors.dark, marginBottom: spacing.lg },
  qrPlaceholder: {
    width: 220,
    height: 220,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.offWhite,
    marginBottom: spacing.lg,
  },
  qrPlaceholderText: { color: colors.textMuted, fontSize: 14, fontWeight: "600", textAlign: "center" },
  instructions: { fontSize: 13, color: colors.textMuted, textAlign: "center", marginBottom: spacing.lg, lineHeight: 19 },
  button: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl * 2,
  },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});