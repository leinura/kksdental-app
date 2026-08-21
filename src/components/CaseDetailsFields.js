import React, { useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
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
  photos,
  setPhotos,
  comment,
  setComment,
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

  async function addPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to add patient photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setPhotos([...photos, { uri: asset.uri, base64: asset.base64 }]);
    }
  }

  function removePhoto(index) {
    setPhotos(photos.filter((_, i) => i !== index));
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
          <TouchableOpacity style={styles.addPhotoButton} onPress={addPhoto}>
            <Text style={styles.addPhotoText}>+</Text>
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
});