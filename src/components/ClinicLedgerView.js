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
import apiClient from "../api/client";
import { colors, spacing, radius } from "../theme/colors";

const METHOD_LABELS = { CASH: "Cash", UPI: "UPI" };

// Each month needs its OWN Paid/Due, not a single lifetime total - a due
// sitting in August should still show as August's due even once September
// starts. Cases and transactions are separate lists that don't necessarily
// share the same months (an August order could get paid in September), so
// this builds one combined group per month that has EITHER an order or a
// payment, using that month's own cases for "billed" and that month's own
// transactions for "paid"/"adjustment".
function buildMonthlyStatements(cases, transactions) {
  const monthKeyOf = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth()}`;
  };
  const monthLabelOf = (dateStr) =>
    new Date(dateStr).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const monthMap = {};
  function ensureMonth(key, label) {
    if (!monthMap[key]) {
      monthMap[key] = { monthKey: key, monthLabel: label, cases: [], transactions: [], sortValue: new Date(0) };
    }
    return monthMap[key];
  }

  cases.forEach((c) => {
    const key = monthKeyOf(c.createdAt);
    const month = ensureMonth(key, monthLabelOf(c.createdAt));
    month.cases.push(c);
    if (new Date(c.createdAt) > month.sortValue) month.sortValue = new Date(c.createdAt);
  });
  transactions.forEach((t) => {
    const key = monthKeyOf(t.createdAt);
    const month = ensureMonth(key, monthLabelOf(t.createdAt));
    month.transactions.push(t);
    if (new Date(t.createdAt) > month.sortValue) month.sortValue = new Date(t.createdAt);
  });

  return Object.values(monthMap)
    .map((month) => {
      const billed = month.cases.reduce((sum, c) => sum + Number(c.totalPrice), 0);
      const paid = month.transactions
        .filter((t) => t.type === "PAYMENT")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const adjustment = month.transactions
        .filter((t) => t.type === "ADJUSTMENT")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { ...month, billed, paid, adjustment, due: billed - paid - adjustment };
    })
    .sort((a, b) => b.sortValue - a.sortValue);
}

// canManage controls whether the "Add Payment / Adjustment" form appears -
// pass true only from the admin side (InvoiceDetailScreen). The client's
// own Invoices screen omits it, keeping their view read-only.
export default function ClinicLedgerView({ clinicId, canManage = false }) {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState(null); // null = not yet initialized

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("PAYMENT");
  const [method, setMethod] = useState("CASH");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadLedger = useCallback(async () => {
    try {
      const res = await apiClient.get(`/clinics/${clinicId}/ledger`);
      setLedger(res.data);
      // Default to only the most recent month expanded, the first time
      // data loads - don't re-collapse everything on every refresh.
      setExpandedMonths((prev) => {
        if (prev !== null) return prev;
        const statements = buildMonthlyStatements(res.data.cases, res.data.transactions);
        return statements.length > 0 ? { [statements[0].monthKey]: true } : {};
      });
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

  function toggleMonth(monthKey) {
    setExpandedMonths((prev) => ({ ...prev, [monthKey]: !prev?.[monthKey] }));
  }

  async function handleAddTransaction() {
    const numericAmount = Number(amount);
    if (!amount || numericAmount <= 0) {
      Alert.alert("Enter an amount", "Amount must be greater than zero.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/clinics/${clinicId}/transactions`, {
        amount: numericAmount,
        type,
        method: type === "PAYMENT" ? method : undefined,
        remarks: remarks.trim() || undefined,
      });
      setAmount("");
      setRemarks("");
      loadLedger();
    } catch (err) {
      Alert.alert("Couldn't add entry", err.response?.data?.error || "Please try again.");
    } finally {
      setSubmitting(false);
    }
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
  const monthlyStatements = buildMonthlyStatements(cases, transactions);

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

          {canManage && (
            <View style={styles.formCard}>
              <Text style={styles.formHeading}>Add Payment / Adjustment</Text>

              <Text style={styles.formLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.formLabel}>Type</Text>
              <View style={styles.pillRow}>
                {[
                  { label: "Payment", value: "PAYMENT" },
                  { label: "Adjustment", value: "ADJUSTMENT" },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pill, type === opt.value && styles.pillActive]}
                    onPress={() => setType(opt.value)}
                  >
                    <Text style={[styles.pillText, type === opt.value && styles.pillTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {type === "PAYMENT" && (
                <>
                  <Text style={styles.formLabel}>Method</Text>
                  <View style={styles.pillRow}>
                    {[
                      { label: "Cash", value: "CASH" },
                      { label: "UPI", value: "UPI" },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.pill, method === opt.value && styles.pillActive]}
                        onPress={() => setMethod(opt.value)}
                      >
                        <Text style={[styles.pillText, method === opt.value && styles.pillTextActive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.formLabel}>Remarks (optional)</Text>
              <TextInput
                style={styles.input}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="e.g. Paid in person, July batch"
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction} disabled={submitting}>
                {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.addButtonText}>Add</Text>}
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.sectionHeading, { marginTop: spacing.xl }]}>Payment History</Text>
          {monthlyStatements.length === 0 ? (
            <Text style={styles.emptyText}>No orders or payments recorded yet.</Text>
          ) : (
            monthlyStatements.map((month) => {
              const isExpanded = !!expandedMonths?.[month.monthKey];
              return (
                <View key={month.monthKey} style={styles.monthGroup}>
                  <TouchableOpacity style={styles.monthHeader} onPress={() => toggleMonth(month.monthKey)}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.monthArrow}>{isExpanded ? "▼" : "▶"}</Text>
                      <Text style={styles.monthLabel}>{month.monthLabel}</Text>
                    </View>
                    <Text style={[styles.monthTotal, month.due > 0 && styles.monthTotalDue]}>
                      Due ₹{month.due.toFixed(2)}
                    </Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.monthBody}>
                      {month.transactions.length === 0 ? (
                        <Text style={styles.emptyText}>No payments recorded for this month.</Text>
                      ) : (
                        month.transactions.map((t) => (
                          <View key={t.id} style={styles.transactionRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.transactionDate}>{new Date(t.createdAt).toLocaleDateString()}</Text>
                              {t.remarks ? <Text style={styles.transactionRemarks}>{t.remarks}</Text> : null}
                            </View>
                            <Text style={styles.transactionType}>
                              {t.type === "PAYMENT" ? "Payment" : "Adjustment"}
                              {t.method ? ` (${METHOD_LABELS[t.method] || t.method})` : ""}
                            </Text>
                            <Text style={styles.transactionAmount}>₹{Number(t.amount).toFixed(2)}</Text>
                          </View>
                        ))
                      )}

                      <View style={styles.monthSummaryRow}>
                        <Text style={styles.monthSummaryLabel}>Billed this month</Text>
                        <Text style={styles.monthSummaryValue}>₹{month.billed.toFixed(2)}</Text>
                      </View>
                      <View style={styles.monthSummaryRow}>
                        <Text style={styles.monthSummaryLabel}>Total Paid</Text>
                        <Text style={styles.monthSummaryValue}>₹{(month.paid + month.adjustment).toFixed(2)}</Text>
                      </View>
                      <View style={[styles.monthSummaryRow, month.due > 0 && styles.monthDueRow]}>
                        <Text style={[styles.monthSummaryLabel, month.due > 0 && styles.monthDueLabel]}>Due</Text>
                        <Text style={[styles.monthSummaryValue, month.due > 0 && styles.monthDueLabel]}>
                          ₹{month.due.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
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
  formCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  formHeading: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  formLabel: { fontSize: 12, fontWeight: "600", color: colors.text, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.white,
  },
  pillRow: { flexDirection: "row", gap: spacing.sm },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  pillActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  pillText: { fontSize: 12, color: colors.text, fontWeight: "600" },
  pillTextActive: { color: colors.white },
  addButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: spacing.md,
  },
  addButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  monthGroup: { marginBottom: spacing.xs },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.offWhite,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  monthArrow: { fontSize: 11, color: colors.textMuted },
  monthLabel: { fontSize: 13, fontWeight: "800", color: colors.text, textTransform: "uppercase", letterSpacing: 0.5 },
  monthTotal: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  monthTotalDue: { color: colors.danger },
  monthBody: { paddingTop: spacing.xs },
  monthSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  monthSummaryLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  monthSummaryValue: { fontSize: 13, color: colors.text, fontWeight: "700" },
  monthDueRow: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: "#FBEAEA",
    borderRadius: radius.input,
  },
  monthDueLabel: { color: colors.danger, fontWeight: "800" },
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