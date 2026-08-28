import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMNS = 2;
const GAP = 10;
const TILE_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - GAP) / COLUMNS;

const PLACEMENTS = [
  { value: "HERO", label: "Top Carousel" },
  { value: "SHOP", label: "Shop Section" },
];

export default function AdsScreen() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPlacement, setFilterPlacement] = useState("HERO");
  const [pendingImage, setPendingImage] = useState(null); // { uri, base64 }
  const [link, setLink] = useState("");
  const [placement, setPlacement] = useState("HERO");
  const [uploading, setUploading] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  const loadAds = useCallback(async () => {
    try {
      const res = await apiClient.get("/ads");
      setAds(res.data);
    } catch (err) {
      Alert.alert("Couldn't load ads", "Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAds().finally(() => setLoading(false));
  }, [loadAds]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAds();
    setRefreshing(false);
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload ad photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setProcessingPhoto(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      setPendingImage({ uri: manipulated.uri, base64: manipulated.base64 });
      setPlacement(filterPlacement);
    } catch (err) {
      Alert.alert("Couldn't process photo", "Please try again.");
    } finally {
      setProcessingPhoto(false);
    }
  }

  async function handleUpload() {
    if (!pendingImage) return;
    setUploading(true);
    try {
      const imageData = `data:image/jpeg;base64,${pendingImage.base64}`;
      await apiClient.post("/ads", { imageData, link: link.trim() || null, placement });
      setPendingImage(null);
      setLink("");
      loadAds();
    } catch (err) {
      Alert.alert("Upload failed", err.response?.data?.error || "Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleDelete(ad) {
    Alert.alert("Delete Ad", "Remove this ad?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/ads/${ad.id}`);
            loadAds();
          } catch (err) {
            Alert.alert("Couldn't delete ad", "Please try again.");
          }
        },
      },
    ]);
  }

  const filteredAds = ads.filter((ad) => ad.placement === filterPlacement);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Ads</Text>
        <TouchableOpacity style={styles.addButton} onPress={pickImage} disabled={processingPhoto}>
          {processingPhoto ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.addButtonText}>+ Add Ad</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.placementTabs}>
        {PLACEMENTS.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[styles.placementTab, filterPlacement === p.value && styles.placementTabActive]}
            onPress={() => setFilterPlacement(p.value)}
          >
            <Text style={[styles.placementTabText, filterPlacement === p.value && styles.placementTabTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.helperText}>
        {filterPlacement === "HERO"
          ? "These auto-slide at the very top of the client's Home screen."
          : "These show as a grid below Lab Introduction on the client's Home screen."}
      </Text>

      {pendingImage && (
        <View style={styles.pendingCard}>
          <Image source={{ uri: pendingImage.uri }} style={styles.pendingImage} />
          <View style={{ flex: 1 }}>
            <View style={styles.pendingPlacementRow}>
              {PLACEMENTS.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.pendingPill, placement === p.value && styles.pendingPillActive]}
                  onPress={() => setPlacement(p.value)}
                >
                  <Text style={[styles.pendingPillText, placement === p.value && styles.pendingPillTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.linkInput}
              value={link}
              onChangeText={setLink}
              placeholder="Link (optional) - e.g. https://..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <View style={styles.pendingButtonRow}>
              <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.uploadButtonText}>Upload</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPendingImage(null)} disabled={uploading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.dark} size="large" style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={filteredAds}
          keyExtractor={(item) => item.id}
          numColumns={COLUMNS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: GAP }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No ads here yet - tap "Add Ad" to upload one.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.tile} onLongPress={() => handleDelete(item)}>
              <Image source={{ uri: item.imageData }} style={styles.tileImage} />
              {item.link ? (
                <View style={styles.linkBadge}>
                  <Text style={styles.linkBadgeText} numberOfLines={1}>
                    🔗 {item.link}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg, paddingBottom: 0 },
  heading: { fontSize: 20, fontWeight: "700", color: colors.text },
  addButton: { backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  placementTabs: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  placementTab: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, alignItems: "center" },
  placementTabActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  placementTabText: { fontSize: 12, fontWeight: "600", color: colors.text },
  placementTabTextActive: { color: colors.white },
  helperText: { fontSize: 12, color: colors.textMuted, paddingHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.sm },
  pendingCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.offWhite,
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.sm,
    borderRadius: radius.card,
  },
  pendingImage: { width: 70, height: 70, borderRadius: radius.input },
  pendingPlacementRow: { flexDirection: "row", gap: 6, marginBottom: spacing.xs },
  pendingPill: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  pendingPillActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  pendingPillText: { fontSize: 10, fontWeight: "600", color: colors.text },
  pendingPillTextActive: { color: colors.white },
  linkInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.white,
  },
  pendingButtonRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  uploadButton: { backgroundColor: colors.dark, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8 },
  uploadButtonText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  cancelText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  grid: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: GAP },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, width: "100%" },
  tile: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: radius.input, overflow: "hidden", backgroundColor: colors.offWhite },
  tileImage: { width: "100%", height: "100%" },
  linkBadge: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(10,10,10,0.6)", paddingVertical: 3, paddingHorizontal: 6 },
  linkBadgeText: { color: colors.white, fontSize: 9, fontWeight: "600" },
});