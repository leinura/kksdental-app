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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMNS = 3;
const GAP = 8;
const TILE_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

export default function GalleryScreen() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingImage, setPendingImage] = useState(null); // { base64, uri }
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/gallery");
      setPhotos(res.data);
    } catch (err) {
      Alert.alert("Couldn't load gallery", "Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload gallery photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPendingImage(result.assets[0]);
    }
  }

  async function handleUpload() {
    if (!pendingImage) return;
    setUploading(true);
    try {
      const imageData = `data:image/jpeg;base64,${pendingImage.base64}`;
      await apiClient.post("/gallery", { imageData, caption: caption.trim() || null });
      setPendingImage(null);
      setCaption("");
      loadPhotos();
    } catch (err) {
      Alert.alert("Upload failed", err.response?.data?.error || "Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleDelete(photo) {
    Alert.alert("Delete Photo", "Remove this photo from the gallery?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/gallery/${photo.id}`);
            loadPhotos();
          } catch (err) {
            Alert.alert("Couldn't delete photo", "Please try again.");
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Gallery</Text>
        <TouchableOpacity style={styles.addButton} onPress={pickImage}>
          <Text style={styles.addButtonText}>+ Add Photo</Text>
        </TouchableOpacity>
      </View>

      {pendingImage && (
        <View style={styles.pendingCard}>
          <Image source={{ uri: pendingImage.uri }} style={styles.pendingImage} />
          <View style={{ flex: 1 }}>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Caption (optional)"
              placeholderTextColor={colors.textMuted}
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
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={COLUMNS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: GAP }}
          ListEmptyComponent={<Text style={styles.emptyText}>No photos yet - tap "Add Photo" to upload the first one.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.tile} onLongPress={() => handleDelete(item)}>
              <Image source={{ uri: item.imageData }} style={styles.tileImage} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
  },
  heading: { fontSize: 20, fontWeight: "700", color: colors.text },
  addButton: { backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.white, fontWeight: "700", fontSize: 13 },
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
  captionInput: {
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
});