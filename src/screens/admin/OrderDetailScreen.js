import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import apiClient from "../../api/client";
import { StatusBadge, PaymentTag } from "../../components/StatusBadge";
import { colors, spacing, radius } from "../../theme/colors";

export default function OrderDetailScreen({ route }) {
  const { caseId } = route.params;
  const [order, setOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const res = await apiClient.get(`/cases/${caseId}`);
      setOrder(res.data);
    } catch (err) {
      setOrder((prev) => prev ?? false);
    }
  }, [caseId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadOrder();
    setRefreshing(false);
  }

  if (order === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  if (order === false) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Couldn't load this order.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.caseCode}>{order.caseCode}</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <StatusBadge status={order.deliveryStatus} />
          <PaymentTag paymentStatus={order.paymentStatus} />
        </View>
      </View>
      <Text style={styles.dateText}>
        Placed {new Date(order.createdAt).toLocaleDateString()} at{" "}
        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Clinic</Text>
        <Text style={styles.value}>{order.clinic?.name}</Text>
        <Text style={styles.subValue}>{order.clinic?.contactPerson}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Patient</Text>
        <Text style={styles.value}>{order.patient?.fullName}</Text>
        <Text style={styles.subValue}>
          {order.patient?.patientCode} · {order.patient?.gender} · {order.patient?.age} yrs
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Service Details</Text>
        <DetailRow label="Service" value={order.service?.name} />
        <DetailRow label="Service Type" value={order.serviceType?.name} />
        <DetailRow label="Warranty" value={order.warranty?.label || "No warranty"} />
        <DetailRow label="Tooth Shade" value={order.toothShade?.code || "-"} />
        <DetailRow
          label="Tooth Number(s)"
          value={order.toothNumbers?.length > 0 ? order.toothNumbers.join(", ") : "-"}
        />
        <DetailRow label="Quantity" value={String(order.quantity)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Price</Text>
        <DetailRow label="Unit Price" value={`₹${Number(order.unitPrice).toFixed(2)}`} />
        <DetailRow label="Total" value={`₹${Number(order.totalPrice).toFixed(2)}`} bold />
      </View>

      {order.photos?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Patient Photos</Text>
          <View style={styles.photoGrid}>
            {order.photos.map((photo) => (
              <Image key={photo.id} source={{ uri: photo.imageData }} style={styles.photoThumb} />
            ))}
          </View>
        </View>
      )}

      {order.comment && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Comment</Text>
          <Text style={styles.commentText}>{order.comment}</Text>
        </View>
      )}

      {order.transactions?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Payments on this order</Text>
          {order.transactions.map((t) => (
            <View key={t.id} style={styles.transactionRow}>
              <Text style={styles.subValue}>
                {new Date(t.createdAt).toLocaleDateString()} · {t.method}
              </Text>
              <Text style={styles.value}>₹{Number(t.amount).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value, bold }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, bold && styles.detailValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  emptyText: { color: colors.textMuted },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  caseCode: { fontSize: 20, fontWeight: "800", color: colors.text },
  dateText: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: spacing.sm, textTransform: "uppercase" },
  value: { fontSize: 15, fontWeight: "700", color: colors.text },
  subValue: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: 13, color: colors.textMuted },
  detailValue: { fontSize: 13, color: colors.text, fontWeight: "600" },
  detailValueBold: { fontSize: 15, fontWeight: "800" },
  commentText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  photoThumb: { width: 90, height: 90, borderRadius: radius.input, backgroundColor: colors.offWhite },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});