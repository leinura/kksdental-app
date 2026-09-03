import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import apiClient from "../../api/client";
import { useCatalog } from "../../hooks/useCatalog";
import CaseDetailsFields from "../../components/CaseDetailsFields";
import UpiQrModal from "../../components/UpiQrModal";
import { StatusBadge, PaymentTag } from "../../components/StatusBadge";
import { colors, spacing, radius } from "../../theme/colors";

export default function ClientOrderDetailScreen({ route }) {
  const { caseId } = route.params;
  const { loading: loadingCatalog, services, warranties, toothShades, priceList } = useCatalog();

  const [order, setOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);

  // New order form - collapsed by default, for the SAME patient as this order.
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [serviceId, setServiceId] = useState(null);
  const [serviceTypeId, setServiceTypeId] = useState(null);
  const [warrantyId, setWarrantyId] = useState(null);
  const [serviceSubtypeId, setServiceSubtypeId] = useState(null);
  const [serviceTypeWarrantyId, setServiceTypeWarrantyId] = useState(null);
  const [stepIds, setStepIds] = useState([]);
  const [toothShadeId, setToothShadeId] = useState(null);
  const [toothNumbers, setToothNumbers] = useState([]);
  const [quantityOverride, setQuantityOverride] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [upiAmount, setUpiAmount] = useState(0);

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

  function resetNewOrderFields() {
    setServiceId(null);
    setServiceTypeId(null);
    setWarrantyId(null);
    setServiceSubtypeId(null);
    setServiceTypeWarrantyId(null);
    setStepIds([]);
    setToothShadeId(null);
    setToothNumbers([]);
    setQuantityOverride(null);
    setPhotos([]);
    setComment("");
    setShowNewOrderForm(false);
  }

  async function submitOrder() {
    if (!serviceId || !serviceTypeId) {
      Alert.alert("Missing information", "Select a Service and Service Type first.");
      return null;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post("/cases", {
        patientId: order.patient.id,
        serviceId,
        serviceTypeId,
        warrantyId,
        serviceSubtypeId,
        serviceTypeWarrantyId,
        stepIds,
        toothShadeId,
        toothNumbers,
        quantity: quantityOverride,
        photos: photos.map((p) => `data:image/jpeg;base64,${p.base64}`),
        comment: comment.trim() || undefined,
      });
      resetNewOrderFields();
      return res.data;
    } catch (err) {
      Alert.alert("Order failed", err.response?.data?.error || "Please try again.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOrderNow() {
    const newOrder = await submitOrder();
    if (newOrder) {
      Alert.alert(
        "Order Placed",
        `Case ${newOrder.caseCode} created for ${order.patient.fullName}. Total: ₹${Number(newOrder.totalPrice).toFixed(2)} (Payment pending)`
      );
    }
  }

  function handleOrderAndPay() {
    Alert.alert(
      "How will this be paid?",
      "The order will be marked paid once the lab confirms receipt - choosing a method here just shows the clinic how to pay.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Cash", onPress: handleCashOrder },
        { text: "UPI (GPay)", onPress: handleUpiOrder },
      ]
    );
  }

  async function handleCashOrder() {
    const newOrder = await submitOrder();
    if (newOrder) {
      Alert.alert(
        "Order Placed",
        `Case ${newOrder.caseCode} created for ${order.patient.fullName}. Total: ₹${Number(newOrder.totalPrice).toFixed(2)}\n\nCash payment noted - the lab will confirm once received.`
      );
    }
  }

  async function handleUpiOrder() {
    const newOrder = await submitOrder();
    if (newOrder) {
      setUpiAmount(newOrder.totalPrice);
      setUpiModalVisible(true);
    }
  }

  if (order === null || loadingCatalog) {
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
    <>
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
          {order.serviceSubtype ? (
            <>
              <DetailRow label="Sub-Type" value={order.serviceSubtype.name} />
              <DetailRow label="Warranty" value={order.serviceTypeWarranty?.label || "No warranty"} />
            </>
          ) : order.caseSteps?.length > 0 ? null : (
            <DetailRow label="Warranty" value={order.warranty?.label || "No warranty"} />
          )}
          <DetailRow label="Tooth Shade" value={order.toothShade?.code || "-"} />
          <DetailRow
            label="Tooth Number(s)"
            value={order.toothNumbers?.length > 0 ? order.toothNumbers.join(", ") : "-"}
          />
          <DetailRow label="Quantity" value={String(order.quantity)} />
        </View>

        {order.caseSteps?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Steps</Text>
            {order.caseSteps.map((step) => (
              <DetailRow key={step.id} label={step.name} value={`₹${Number(step.price).toFixed(2)}`} />
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Price</Text>
          <DetailRow label="Unit Price" value={`₹${Number(order.unitPrice).toFixed(2)}`} />
          <DetailRow label="Total" value={`₹${Number(order.totalPrice).toFixed(2)}`} bold />
        </View>

        {order.photos?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Patient Photos</Text>
            <View style={styles.photoGrid}>
              {order.photos.map((photo, index) => (
                <TouchableOpacity key={photo.id} onPress={() => setViewerIndex(index)}>
                  <Image source={{ uri: photo.imageData }} style={styles.photoThumb} />
                </TouchableOpacity>
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

        {!showNewOrderForm ? (
          <TouchableOpacity style={styles.newOrderButton} onPress={() => setShowNewOrderForm(true)}>
            <Text style={styles.newOrderButtonText}>+ Place a New Order for {order.patient?.fullName}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.newOrderCard}>
            <View style={styles.newOrderHeader}>
              <Text style={styles.sectionLabel}>New Order</Text>
              <TouchableOpacity onPress={() => setShowNewOrderForm(false)}>
                <Text style={styles.cancelLink}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <CaseDetailsFields
              services={services}
              warranties={warranties}
              toothShades={toothShades}
              priceList={priceList}
              serviceId={serviceId}
              setServiceId={setServiceId}
              serviceTypeId={serviceTypeId}
              setServiceTypeId={setServiceTypeId}
              warrantyId={warrantyId}
              setWarrantyId={setWarrantyId}
              serviceSubtypeId={serviceSubtypeId}
              setServiceSubtypeId={setServiceSubtypeId}
              serviceTypeWarrantyId={serviceTypeWarrantyId}
              setServiceTypeWarrantyId={setServiceTypeWarrantyId}
              stepIds={stepIds}
              setStepIds={setStepIds}
              toothShadeId={toothShadeId}
              setToothShadeId={setToothShadeId}
              toothNumbers={toothNumbers}
              setToothNumbers={setToothNumbers}
              quantityOverride={quantityOverride}
              setQuantityOverride={setQuantityOverride}
              photos={photos}
              setPhotos={setPhotos}
              comment={comment}
              setComment={setComment}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.orderButton, styles.orderNowButton]}
                onPress={handleOrderNow}
                disabled={submitting}
              >
                <Text style={styles.orderButtonText}>Order Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.orderButton, styles.orderPayButton]}
                onPress={handleOrderAndPay}
                disabled={submitting}
              >
                <Text style={styles.orderButtonText}>Order & Pay</Text>
              </TouchableOpacity>
            </View>
            {submitting && <ActivityIndicator color={colors.dark} style={{ marginTop: spacing.md }} />}
          </View>
        )}
      </ScrollView>

      {order.photos?.length > 0 && (
        <Modal visible={viewerIndex !== null} transparent animationType="fade" onRequestClose={() => setViewerIndex(null)}>
          <View style={styles.viewerOverlay}>
            <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerIndex(null)}>
              <Text style={styles.viewerCloseText}>×</Text>
            </TouchableOpacity>
            {viewerIndex !== null && (
              <Image
                source={{ uri: order.photos[viewerIndex].imageData }}
                style={styles.viewerImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>
      )}

      <UpiQrModal visible={upiModalVisible} amount={upiAmount} onClose={() => setUpiModalVisible(false)} />
    </>
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
  newOrderButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  newOrderButtonText: { color: colors.white, fontWeight: "700", fontSize: 14, textAlign: "center" },
  newOrderCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  newOrderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cancelLink: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  buttonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  orderButton: { flex: 1, borderRadius: radius.pill, paddingVertical: 15, alignItems: "center" },
  orderNowButton: { backgroundColor: colors.dark },
  orderPayButton: { backgroundColor: colors.success },
  orderButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  viewerOverlay: { flex: 1, backgroundColor: "rgba(10,10,10,0.95)", alignItems: "center", justifyContent: "center" },
  viewerClose: { position: "absolute", top: 50, right: spacing.lg, zIndex: 1, padding: spacing.sm },
  viewerCloseText: { color: colors.white, fontSize: 32, fontWeight: "300", lineHeight: 34 },
  viewerImage: { width: "100%", height: "75%" },
});