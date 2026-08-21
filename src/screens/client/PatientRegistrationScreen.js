import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
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
import { Field, PillSelect } from "../../components/FormControls";
import { colors, spacing, radius } from "../../theme/colors";

export default function PatientRegistrationScreen() {
  const { loading: loadingCatalog, services, warranties, toothShades, priceList, reload } = useCatalog();
  const [refreshing, setRefreshing] = useState(false);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [serviceId, setServiceId] = useState(null);
  const [serviceTypeId, setServiceTypeId] = useState(null);
  const [warrantyId, setWarrantyId] = useState(null);
  const [toothShadeId, setToothShadeId] = useState(null);
  const [toothNumbers, setToothNumbers] = useState([]);
  const [quantityOverride, setQuantityOverride] = useState(null);
  const [photos, setPhotos] = useState([]); // [{ uri, base64 }]
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // "form" -> filling everything in
  // "review" -> read-only summary shown, waiting for Confirm
  // "choosing" -> Confirm was tapped, showing Pay & Order Now / Order Now (Pay Later)
  const [step, setStep] = useState("form");

  const [justRegistered, setJustRegistered] = useState(null); // { patient, case }
  const [upiModalVisible, setUpiModalVisible] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  function resetAll() {
    setFullName("");
    setGender("");
    setAge("");
    setServiceId(null);
    setServiceTypeId(null);
    setWarrantyId(null);
    setToothShadeId(null);
    setToothNumbers([]);
    setQuantityOverride(null);
    setPhotos([]);
    setComment("");
    setJustRegistered(null);
    setStep("form");
  }

  function handleReview() {
    if (!fullName || !gender || !age || !serviceId || !serviceTypeId || !warrantyId) {
      Alert.alert("Missing information", "Please fill in all required fields.");
      return;
    }
    setStep("review");
  }

  // Actually creates the patient + first case. Called from whichever button
  // the clinic picks after Confirm - nothing is saved before this point.
  async function createRegistration() {
    setSubmitting(true);
    try {
      const res = await apiClient.post("/patients/register", {
        fullName,
        gender,
        age: Number(age),
        serviceId,
        serviceTypeId,
        warrantyId,
        toothShadeId,
        toothNumbers,
        quantity: quantityOverride,
        photos: photos.map((p) => `data:image/jpeg;base64,${p.base64}`),
        comment: comment.trim() || undefined,
      });
      return res.data;
    } catch (err) {
      Alert.alert("Registration failed", err.response?.data?.error || "Please try again.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOrderNowPayLater() {
    const result = await createRegistration();
    if (result) {
      Alert.alert(
        "Order Placed",
        `${result.patient.fullName} registered - Case ${result.case.caseCode}. Payment pending.`
      );
      resetAll();
    }
  }

  async function handlePayAndOrderNow() {
    const result = await createRegistration();
    if (result) {
      setJustRegistered(result);
    }
  }

  function handleCashNoted() {
    Alert.alert(
      "Cash payment noted",
      "The lab will confirm once received. You can start registering the next patient now."
    );
    resetAll();
  }

  function handleUpiSelected() {
    setUpiModalVisible(true);
  }

  function handleUpiModalClose() {
    setUpiModalVisible(false);
    resetAll();
  }

  if (loadingCatalog) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  // --- Review summary values ---
  const selectedService = services.find((s) => s.id === serviceId);
  const selectedServiceType = selectedService?.serviceTypes?.find((t) => t.id === serviceTypeId);
  const selectedWarranty = warranties.find((w) => w.id === warrantyId);
  const selectedShade = toothShades.find((s) => s.id === toothShadeId);
  const quantity = quantityOverride ?? (toothNumbers.length || 1);
  const matchedPrice = priceList.find(
    (p) => p.serviceId === serviceId && p.serviceTypeId === serviceTypeId && p.warrantyId === warrantyId
  );
  const unitPrice = matchedPrice ? Number(matchedPrice.price) : null;
  const totalPrice = unitPrice != null ? unitPrice * quantity : null;

  if (step === "review" || step === "choosing") {
    return (
      <>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Review Details</Text>

          <View style={styles.summaryCard}>
            <SummaryRow label="Patient Name" value={fullName} />
            <SummaryRow label="Gender" value={gender} />
            <SummaryRow label="Age" value={age} />
            <SummaryRow label="Service" value={selectedService?.name} />
            <SummaryRow label="Service Type" value={selectedServiceType?.name} />
            <SummaryRow label="Warranty" value={selectedWarranty?.label || "No warranty"} />
            <SummaryRow label="Tooth Shade" value={selectedShade?.code || "-"} />
            <SummaryRow label="Tooth Number(s)" value={toothNumbers.length > 0 ? toothNumbers.join(", ") : "-"} />
            <SummaryRow label="Quantity" value={String(quantity)} />
            <SummaryRow label="Comment" value={comment.trim() || "-"} />
            <SummaryRow
              label="Price"
              value={totalPrice != null ? `₹${totalPrice.toFixed(2)}` : "-"}
              bold
            />
          </View>

          {photos.length > 0 && (
            <View style={styles.photoPreviewRow}>
              {photos.map((photo, index) => (
                <Image key={index} source={{ uri: photo.uri }} style={styles.photoPreviewThumb} />
              ))}
            </View>
          )}

          {step === "review" && (
            <>
              <TouchableOpacity style={styles.editLink} onPress={() => setStep("form")}>
                <Text style={styles.editLinkText}>‹ Back to edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={() => setStep("choosing")}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </>
          )}

          {!justRegistered && step === "choosing" && (
            <TouchableOpacity style={styles.editLink} onPress={() => setStep("form")}>
              <Text style={styles.editLinkText}>‹ Back to edit</Text>
            </TouchableOpacity>
          )}

          {step === "choosing" && !justRegistered && (
            <View style={styles.choiceCard}>
              <Text style={styles.choiceHeading}>How will this be paid?</Text>
              <View style={styles.choiceButtonRow}>
                <TouchableOpacity
                  style={[styles.choiceButton, styles.payNowButton]}
                  onPress={handlePayAndOrderNow}
                  disabled={submitting}
                >
                  <Text style={styles.choiceButtonText}>Pay & Order Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.choiceButton, styles.orderLaterButton]}
                  onPress={handleOrderNowPayLater}
                  disabled={submitting}
                >
                  <Text style={styles.choiceButtonText}>Order Now (Pay Later)</Text>
                </TouchableOpacity>
              </View>
              {submitting && <ActivityIndicator color={colors.dark} style={{ marginTop: spacing.md }} />}
            </View>
          )}

          {justRegistered && (
            <View style={styles.paymentCard}>
              <Text style={styles.paymentHeading}>
                {justRegistered.patient.fullName} registered - Case {justRegistered.case.caseCode}
              </Text>
              <Text style={styles.paymentSubtext}>Choose a payment method</Text>

              <View style={styles.paymentButtonRow}>
                <TouchableOpacity style={[styles.paymentButton, styles.cashButton]} onPress={handleCashNoted}>
                  <Text style={styles.paymentButtonText}>Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.paymentButton, styles.upiButton]} onPress={handleUpiSelected}>
                  <Text style={styles.paymentButtonText}>UPI (GPay)</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={resetAll}>
                <Text style={styles.skipLink}>Skip - decide later</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <UpiQrModal
          visible={upiModalVisible}
          amount={justRegistered?.case?.totalPrice || 0}
          onClose={handleUpiModalClose}
        />
      </>
    );
  }

  // --- Form step ---
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Text style={styles.heading}>Register Patient</Text>

      <Field label="Patient's Full Name *">
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Patient's Full Name" />
      </Field>

      <Field label="Gender *">
        <PillSelect options={["Male", "Female", "Other"]} value={gender} onSelect={setGender} />
      </Field>

      <Field label="Age *">
        <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="Age" />
      </Field>

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

      <TouchableOpacity style={styles.submitButton} onPress={handleReview}>
        <Text style={styles.submitText}>Review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SummaryRow({ label, value, bold }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.summaryValueBold]}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.md,
  },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 15 },

  summaryCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: { fontSize: 13, color: colors.textMuted },
  summaryValue: { fontSize: 13, color: colors.text, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  summaryValueBold: { fontSize: 16, fontWeight: "800" },

  photoPreviewRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  photoPreviewThumb: { width: 64, height: 64, borderRadius: radius.input, backgroundColor: colors.offWhite },

  editLink: { marginTop: spacing.md, alignItems: "center" },
  editLinkText: { color: colors.textMuted, fontSize: 13, textDecorationLine: "underline" },
  confirmButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.md,
  },
  confirmButtonText: { color: colors.white, fontWeight: "700", fontSize: 15 },

  choiceCard: { marginTop: spacing.lg, alignItems: "center" },
  choiceHeading: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  choiceButtonRow: { flexDirection: "row", gap: spacing.sm, width: "100%" },
  choiceButton: { flex: 1, borderRadius: radius.pill, paddingVertical: 14, alignItems: "center" },
  payNowButton: { backgroundColor: colors.success },
  orderLaterButton: { backgroundColor: colors.dark },
  choiceButtonText: { color: colors.white, fontWeight: "700", fontSize: 13, textAlign: "center" },

  paymentCard: {
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.lg,
    alignItems: "center",
  },
  paymentHeading: { fontSize: 15, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: 4 },
  paymentSubtext: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  paymentButtonRow: { flexDirection: "row", gap: spacing.sm, width: "100%" },
  paymentButton: { flex: 1, borderRadius: radius.pill, paddingVertical: 14, alignItems: "center" },
  cashButton: { backgroundColor: colors.dark },
  upiButton: { backgroundColor: colors.success },
  paymentButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  skipLink: { color: colors.textMuted, fontSize: 12, marginTop: spacing.md, textDecorationLine: "underline" },
});