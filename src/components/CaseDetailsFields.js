import React, { useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import ToothChart from "./ToothChart";
import { Field, PillSelect } from "./FormControls";
import { colors, spacing, radius } from "../theme/colors";

// Controlled component - all state lives in the parent screen, this just
// renders the fields and reports changes back up. Keeping it controlled
// (rather than owning its own state) means Registration and Billing can
// both reset/prefill it however they need.
export default function CaseDetailsFields({
  services,
  warranties,
  toothShades,
  priceList,
  serviceId,
  setServiceId,
  serviceTypeId,
  setServiceTypeId,
  warrantyId,
  setWarrantyId,
  toothShadeId,
  setToothShadeId,
  toothNumbers,
  setToothNumbers,
  quantityOverride,
  setQuantityOverride,
}) {
  const selectedService = services.find((s) => s.id === serviceId);
  const serviceTypes = selectedService ? selectedService.serviceTypes : [];
  const selectedServiceType = serviceTypes.find((t) => t.id === serviceTypeId);
  const quantity = quantityOverride ?? (toothNumbers.length || 1);

  // Warranty only matters for these specific Crown service types - everything
  // else (other services, or Crown/METAL) skips the warranty question and is
  // priced under the admin-configured "No Warranties" entry automatically.
  const WARRANTY_ELIGIBLE_TYPES = ["zirconia", "pfm", "esthetic zirconia"];
  const needsWarrantyChoice =
    selectedService?.name?.trim().toLowerCase() === "crown" &&
    WARRANTY_ELIGIBLE_TYPES.includes(selectedServiceType?.name?.trim().toLowerCase() || "");
  const noWarrantyEntry = warranties.find((w) => w.label?.trim().toLowerCase() === "no warranties");

  useEffect(() => {
    if (!needsWarrantyChoice && noWarrantyEntry && warrantyId !== noWarrantyEntry.id) {
      setWarrantyId(noWarrantyEntry.id);
    }
  }, [needsWarrantyChoice, noWarrantyEntry?.id]);

  const matchedPrice = priceList.find(
    (p) => p.serviceId === serviceId && p.serviceTypeId === serviceTypeId && p.warrantyId === warrantyId
  );
  const unitPrice = matchedPrice ? Number(matchedPrice.price) : null;
  const totalPrice = unitPrice != null ? unitPrice * quantity : null;

  return (
    <View>
      <Field label="Services *">
        <PillSelect
          options={services.map((s) => ({ label: s.name, value: s.id }))}
          value={serviceId}
          onSelect={(id) => {
            setServiceId(id);
            setServiceTypeId(null);
          }}
        />
      </Field>

      {selectedService && (
        <Field label="Service Type *">
          <PillSelect
            options={serviceTypes.map((t) => ({ label: t.name, value: t.id }))}
            value={serviceTypeId}
            onSelect={setServiceTypeId}
          />
        </Field>
      )}

      {needsWarrantyChoice && (
        <Field label="Warranty">
          <PillSelect
            options={warranties.map((w) => ({ label: w.label, value: w.id }))}
            value={warrantyId}
            onSelect={setWarrantyId}
          />
        </Field>
      )}

      <Field label="Tooth Shade">
        <PillSelect
          options={toothShades.map((s) => ({ label: s.code, value: s.id }))}
          value={toothShadeId}
          onSelect={setToothShadeId}
        />
      </Field>

      <ToothChart selected={toothNumbers} onChange={setToothNumbers} />

      <Field label="Quantity">
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setQuantityOverride(Math.max(1, quantity - 1))}
          >
            <Text style={styles.stepperButtonText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.stepperInput}
            value={String(quantity)}
            onChangeText={(v) => setQuantityOverride(v ? Number(v) : null)}
            keyboardType="number-pad"
            textAlign="center"
          />
          <TouchableOpacity style={styles.stepperButton} onPress={() => setQuantityOverride(quantity + 1)}>
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </Field>

      <Field label="Price">
        <View style={styles.priceBox}>
          <Text style={styles.priceText}>
            {totalPrice != null ? `₹${totalPrice.toFixed(2)}` : "Select service, type & warranty to see price"}
          </Text>
        </View>
      </Field>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  priceBox: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  priceText: { fontSize: 16, fontWeight: "700", color: colors.text },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.offWhite,
  },
  stepperButtonText: { fontSize: 20, fontWeight: "700", color: colors.text },
  stepperInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
});