import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import apiClient from "../api/client";
import { colors, spacing, radius } from "../theme/colors";

export default function ClinicLedgerView({ clinicId }) {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLedger = useCallback(async () => {
    try {
      const res = await apiClient.get(`/clinics/${clinicId}/ledger`);
      setLedger(res.data);
    } catch (err) {
      // leave whatever was already loaded on a transient failure
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clinicId]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  function handleRefresh() {
    setRefreshing(true);
    loadLedger();
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  if (!ledger) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Couldn't load this account. Pull down to try again.</Text>
      </View>
    );
  }

  const { cases, transactions, summary } = ledger;

  return (
    <FlatList
      data={[1]}
      keyExtractor={() => "ledger"}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      contentContainerStyle={styles.container}
      renderItem={() => (
        <View>
          <Text style={styles.sectionHeading}>Orders</Text>
          {cases.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet.</Text>
          ) : (
            cases.map((c) => (
              <View key={c.id} style={styles.caseRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseTitle}>{c.patient?.fullName}</Text>
                  <Text style={styles.caseMeta}>
                    {c.service?.name} · {c.warranty?.label || "No warranty"}
                  </Text>
                </View>
                <Text style={styles.casePrice}>₹{Number(c.totalPrice).toFixed(2)}</Text>
              </View>
            ))
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{summary.totalBilled.toFixed(2)}</Text>
          </View>

          <Text style={[styles.sectionHeading, { marginTop: spacing.xl }]}>Payment History</Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded yet.</Text>
          ) : (
            transactions.map((t) => (
              <View key={t.id} style={styles.transactionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.transactionDate}>{new Date(t.createdAt).toLocaleDateString()}</Text>
                  {t.remarks ? <Text style={styles.transactionRemarks}>{t.remarks}</Text> : null}
                </View>
                <Text style={styles.transactionType}>{t.type === "PAYMENT" ? "Payment" : "Adjustment"}</Text>
                <Text style={styles.transactionAmount}>₹{Number(t.amount).toFixed(2)}</Text>
              </View>
            ))
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{(summary.totalPaid + summary.totalAdjustment).toFixed(2)}</Text>
          </View>

          <View style={[styles.totalRow, styles.dueRow]}>
            <Text style={styles.dueLabel}>Due</Text>
            <Text style={styles.dueValue}>₹{summary.due.toFixed(2)}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: "center", marginVertical: spacing.md },
  sectionHeading: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  caseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  caseTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  caseMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  casePrice: { fontSize: 14, fontWeight: "700", color: colors.text },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: 14, fontWeight: "700", color: colors.text },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  transactionDate: { fontSize: 13, color: colors.text, fontWeight: "600" },
  transactionRemarks: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  transactionType: { fontSize: 12, color: colors.textMuted },
  transactionAmount: { fontSize: 14, fontWeight: "700", color: colors.success },
  dueRow: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: "#FBEAEA",
    borderRadius: radius.card,
  },
  dueLabel: { fontSize: 15, fontWeight: "800", color: colors.danger },
  dueValue: { fontSize: 15, fontWeight: "800", color: colors.danger },
});