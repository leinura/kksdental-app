import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import ToothChart from "./ToothChart";
import { Field, PillSelect } from "./FormControls";
import { colors, spacing, radius } from "../theme/colors";

// Controlled component - all state lives in the parent screen, this just
// renders the fields and reports changes back up. Keeping it controlled
// (rather than owning its own state) means Registration and Billing can
// both reset/prefill it however they need.
//
// A selected Service Type can be priced in one of three ways, decided by
// its own configuration (set up in Catalog > Services):
//   1. Legacy - single global Warranty list, original two-level system.
//      Kept fully working for anything not migrated to the newer structure.
//   2. Sub-Type + that Service Type's own scoped Warranty list (or none).
//   3. Step-based - pick one or more priced Steps, total is their sum.
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
  serviceSubtypeId,
  setServiceSubtypeId,
  serviceTypeWarrantyId,
  setServiceTypeWarrantyId,
  stepIds,
  setStepIds,
  toothShadeId,
  setToothShadeId,
  toothNumbers,
  setToothNumbers,
  quantityOverride,
  setQuantityOverride,
  photos,
  setPhotos,
  comment,
  setComment,
}) {
  const selectedService = services.find((s) => s.id === serviceId);
  const serviceTypes = selectedService ? selectedService.serviceTypes : [];
  const selectedServiceType = serviceTypes.find((t) => t.id === serviceTypeId);
  const quantity = quantityOverride ?? (toothNumbers.length || 1);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  const usesSteps = !!selectedServiceType?.usesSteps;
  const hasSubtypes = !usesSteps && (selectedServiceType?.subtypes?.length || 0) > 0;
  const isLegacy = !usesSteps && !hasSubtypes;

  // Legacy path only: Warranty only matters for these specific Crown service
  // types - everything else skips the warranty question and is priced under
  // the admin-configured "No Warranties" entry automatically. Kept exactly
  // as before for any Service Type not migrated to Sub-Types/Steps.
  const WARRANTY_ELIGIBLE_TYPES = ["zirconia", "pfm", "esthetic zirconia"];
  const needsWarrantyChoice =
    isLegacy &&
    selectedService?.name?.trim().toLowerCase() === "crown" &&
    WARRANTY_ELIGIBLE_TYPES.includes(selectedServiceType?.name?.trim().toLowerCase() || "");
  const noWarrantyEntry = warranties.find((w) => w.label?.trim().toLowerCase() === "no warranties");

  useEffect(() => {
    if (isLegacy && !needsWarrantyChoice && noWarrantyEntry && warrantyId !== noWarrantyEntry.id) {
      setWarrantyId(noWarrantyEntry.id);
    }
  }, [isLegacy, needsWarrantyChoice, noWarrantyEntry?.id]);

  // Reset the OTHER paths' selections whenever the Service Type changes, so
  // a leftover Sub-Type/Step selection from a previous pick never lingers.
  useEffect(() => {
    setServiceSubtypeId(null);
    setServiceTypeWarrantyId(null);
    setStepIds([]);
  }, [serviceTypeId]);

  // Also clear the warranty choice whenever the Sub-Type changes - each
  // Sub-Type can have prices for a different subset of the Service Type's
  // warranty options (e.g. ALL CERAMIC offers 5/10/15 Years, but Inlay only
  // has a price configured for 5 Years), so a warranty valid for the
  // previous Sub-Type may not even be selectable for the new one.
  useEffect(() => {
    setServiceTypeWarrantyId(null);
  }, [serviceSubtypeId]);

  const selectedSubtype = selectedServiceType?.subtypes?.find((s) => s.id === serviceSubtypeId);
  // Only offer warranties that actually have a price entry for THIS
  // Sub-Type, not every warranty the Service Type happens to define.
  const typeWarrantyOptions = selectedSubtype
    ? (selectedServiceType?.typeWarranties || []).filter((w) =>
        (selectedSubtype.priceEntries || []).some((e) => e.serviceTypeWarrantyId === w.id)
      )
    : [];
  const needsTypeWarrantyChoice = hasSubtypes && !!selectedSubtype && typeWarrantyOptions.length > 0;

  // --- Price calculation, one branch per pricing path ---
  let unitPrice = null;
  let totalPrice = null;

  if (usesSteps) {
    const selectedSteps = (selectedServiceType.steps || []).filter((s) => stepIds.includes(s.id));
    if (selectedSteps.length > 0) {
      totalPrice = selectedSteps.reduce((sum, s) => sum + Number(s.price), 0);
      unitPrice = totalPrice;
    }
  } else if (hasSubtypes) {
    if (selectedSubtype) {
      const entry = (selectedSubtype.priceEntries || []).find(
        (e) => (e.serviceTypeWarrantyId || null) === (serviceTypeWarrantyId || null)
      );
      if (entry) {
        unitPrice = Number(entry.price);
        totalPrice = unitPrice * quantity;
      }
    }
  } else {
    const matchedPrice = priceList.find(
      (p) => p.serviceId === serviceId && p.serviceTypeId === serviceTypeId && p.warrantyId === warrantyId
    );
    if (matchedPrice) {
      unitPrice = Number(matchedPrice.price);
      totalPrice = unitPrice * quantity;
    }
  }

  async function addPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to add patient photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setProcessingPhoto(true);
    try {
      // Modern phones (especially iPhones) shoot at 12MP+ - a photo can stay
      // several MB even after JPEG quality compression, since quality and
      // resolution are separate things. Resizing to a sensible max width
      // fixes file size regardless of the clinic's phone, without requiring
      // them to do anything manually.
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      setPhotos([...photos, { uri: manipulated.uri, base64: manipulated.base64 }]);
    } catch (err) {
      Alert.alert("Couldn't process photo", "Please try again.");
    } finally {
      setProcessingPhoto(false);
    }
  }

  function removePhoto(index) {
    setPhotos(photos.filter((_, i) => i !== index));
  }

  function toggleStep(stepId) {
    if (stepIds.includes(stepId)) {
      setStepIds(stepIds.filter((id) => id !== stepId));
    } else {
      setStepIds([...stepIds, stepId]);
    }
  }

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

      {hasSubtypes && (
        <Field label="Sub-Type *">
          <PillSelect
            options={selectedServiceType.subtypes.map((s) => ({ label: s.name, value: s.id }))}
            value={serviceSubtypeId}
            onSelect={setServiceSubtypeId}
          />
        </Field>
      )}

      {needsTypeWarrantyChoice && (
        <Field label="Warranty">
          <PillSelect
            options={typeWarrantyOptions.map((w) => ({ label: w.label, value: w.id }))}
            value={serviceTypeWarrantyId}
            onSelect={setServiceTypeWarrantyId}
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

      {usesSteps && (
        <Field label="Steps *">
          {(selectedServiceType.steps || []).length === 0 ? (
            <Text style={styles.emptyStepsText}>No steps configured for this service type yet.</Text>
          ) : (
            selectedServiceType.steps.map((step) => {
              const isSelected = stepIds.includes(step.id);
              return (
                <TouchableOpacity
                  key={step.id}
                  style={[styles.stepRow, isSelected && styles.stepRowSelected]}
                  onPress={() => toggleStep(step.id)}
                >
                  <Text style={styles.stepCheckbox}>{isSelected ? "☑" : "☐"}</Text>
                  <Text style={styles.stepName}>{step.name}</Text>
                  <Text style={styles.stepPrice}>₹{Number(step.price).toFixed(2)}</Text>
                </TouchableOpacity>
              );
            })
          )}
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
            {totalPrice != null ? `₹${totalPrice.toFixed(2)}` : "Select the options above to see price"}
          </Text>
        </View>
      </Field>

      <Field label="Patient Photos (optional)">
        <View style={styles.photoRow}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoThumbWrap}>
              <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
              <TouchableOpacity style={styles.photoRemoveButton} onPress={() => removePhoto(index)}>
                <Text style={styles.photoRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addPhotoButton} onPress={addPhoto} disabled={processingPhoto}>
            {processingPhoto ? (
              <ActivityIndicator size="small" color={colors.textMuted} />
            ) : (
              <Text style={styles.addPhotoText}>+</Text>
            )}
          </TouchableOpacity>
        </View>
      </Field>

      <Field label="Comment (optional)">
        <TextInput
          style={[styles.input, styles.commentInput]}
          value={comment}
          onChangeText={setComment}
          placeholder="Any notes or special instructions for the lab..."
          placeholderTextColor={colors.textMuted}
          multiline
        />
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
  commentInput: { minHeight: 80, textAlignVertical: "top" },
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
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  photoThumbWrap: { position: "relative" },
  photoThumb: { width: 72, height: 72, borderRadius: radius.input, backgroundColor: colors.offWhite },
  photoRemoveButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveText: { color: colors.white, fontSize: 14, fontWeight: "700", lineHeight: 16 },
  addPhotoButton: {
    width: 72,
    height: 72,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.offWhite,
  },
  addPhotoText: { fontSize: 28, color: colors.textMuted, fontWeight: "300" },
  emptyStepsText: { fontSize: 13, color: colors.textMuted, fontStyle: "italic" },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  stepRowSelected: { borderColor: colors.dark, backgroundColor: colors.offWhite },
  stepCheckbox: { fontSize: 18, color: colors.text },
  stepName: { flex: 1, fontSize: 14, color: colors.text },
  stepPrice: { fontSize: 14, fontWeight: "700", color: colors.text },
});