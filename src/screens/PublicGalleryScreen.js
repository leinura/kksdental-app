import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, FlatList, ActivityIndicator, Dimensions } from "react-native";
import apiClient from "../api/client";
import PublicNavHeader from "../components/PublicNavHeader";
import PublicFooter from "../components/PublicFooter";
import { colors, spacing, radius } from "../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMNS = 2;
const GAP = 10;
const TILE_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - GAP) / COLUMNS;

export default function PublicGalleryScreen({ navigation }) {
  const [photos, setPhotos] = useState(null);

  useEffect(() => {
    apiClient
      .get("/gallery")
      .then((res) => setPhotos(res.data))
      .catch(() => setPhotos([]));
  }, []);

  return (
    <View style={styles.container}>
      <PublicNavHeader navigation={navigation} active="PublicGallery" />

      {photos === null ? (
        <ActivityIndicator color={colors.dark} size="large" style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={COLUMNS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: GAP }}
          ListHeaderComponent={<Text style={styles.heading}>Gallery</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>No photos yet - check back soon.</Text>}
          ListFooterComponent={<PublicFooter />}
          ListFooterComponentStyle={styles.footerWrapper}
          renderItem={({ item }) => (
            <View style={styles.tile}>
              <Image source={{ uri: item.imageData }} style={styles.tileImage} />
              {item.caption ? (
                <View style={styles.captionOverlay}>
                  <Text style={styles.captionText} numberOfLines={1}>
                    {item.caption}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  grid: { padding: spacing.lg, gap: GAP, flexGrow: 1 },
  footerWrapper: { marginHorizontal: -spacing.lg, marginBottom: -spacing.lg, marginTop: "auto" },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, width: "100%" },
  tile: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: radius.input, overflow: "hidden", backgroundColor: colors.offWhite },
  tileImage: { width: "100%", height: "100%" },
  captionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10,10,10,0.55)",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  captionText: { color: colors.white, fontSize: 10, fontWeight: "600" },
});