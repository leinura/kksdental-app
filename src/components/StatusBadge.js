import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme/colors";

export const STATUS_COLORS = {
  PENDING: colors.statusPending,
  IN_PROGRESS: colors.statusInProgress,
  COMPLETED: colors.statusCompleted,
};

export const STATUS_LABELS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export function StatusBadge({ status }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] || colors.statusPending }]}>
      <Text style={styles.badgeText}>{STATUS_LABELS[status] || status}</Text>
    </View>
  );
}

export function PaymentTag({ paymentStatus }) {
  const paid = paymentStatus === "PAID";
  return (
    <Text style={[styles.paymentTag, paid ? styles.paid : styles.unpaid]}>{paid ? "Paid" : "Unpaid"}</Text>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.white },
  paymentTag: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  paid: { color: colors.success, backgroundColor: "#E4F5EF" },
  unpaid: { color: colors.danger, backgroundColor: "#FBEAEA" },
});