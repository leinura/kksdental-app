import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, FlatList, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from "react-native";
import { Video, ResizeMode } from "expo-av";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_HEIGHT = 200;

// Shown only if the lab hasn't uploaded any gallery photos yet.
const FALLBACK_SLIDES = [
  { id: "1", label: "Photo Gallery Coming Soon", color: colors.dark },
  { id: "2", label: "Lab Work Showcase", color: colors.lavender },
  { id: "3", label: "Case Highlights", color: "#1D9E75" },
];

export default function ClientHomeScreen() {
  const [photos, setPhotos] = useState(null);

  useEffect(() => {
    apiClient
      .get("/gallery")
      .then((res) => setPhotos(res.data))
      .catch(() => setPhotos([]));
  }, []);

  const slides =
    photos && photos.length > 0
      ? photos.map((p) => ({ id: p.id, image: { uri: p.imageData }, caption: p.caption }))
      : FALLBACK_SLIDES;

  return (
    <ScrollView style={styles.container}>
      {photos === null ? (
        <View style={[styles.slide, { alignItems: "center", justifyContent: "center" }]}>
          <ActivityIndicator color={colors.dark} />
        </View>
      ) : (
        <PhotoCarousel slides={slides} />
      )}

      <View style={styles.videoSection}>
        <Text style={styles.sectionLabel}>Lab Introduction</Text>
        <Video
          source={require("../../../assets/videos/client-home.mp4")}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          useNativeControls
          isLooping={false}
        />
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>Welcome To{"\n"}KKSDENTAL Lab.</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>KKSDENTAL LAB</Text>
      </View>
    </ScrollView>
  );
}

function PhotoCarousel({ slides }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  function handleScroll(event) {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) =>
          item.image ? (
            <View style={{ width: SCREEN_WIDTH }}>
              <Image source={item.image} style={styles.slide} resizeMode="cover" />
              {item.caption ? (
                <View style={styles.captionOverlay}>
                  <Text style={styles.captionText}>{item.caption}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={[styles.slide, styles.placeholderSlide, { width: SCREEN_WIDTH, backgroundColor: item.color }]}>
              <Text style={styles.placeholderText}>{item.label}</Text>
            </View>
          )
        }
      />
      <View style={styles.dots}>
        {slides.map((slide, index) => (
          <View key={slide.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  slide: { height: CAROUSEL_HEIGHT, width: "100%" },
  placeholderSlide: { alignItems: "center", justifyContent: "center" },
  placeholderText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  captionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10,10,10,0.55)",
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  captionText: { color: colors.white, fontSize: 12, fontWeight: "600" },
  dots: { flexDirection: "row", justifyContent: "center", marginTop: spacing.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.dark, width: 18 },
  videoSection: { padding: spacing.lg },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: spacing.sm },
  video: { width: "100%", height: 200, borderRadius: radius.card, backgroundColor: colors.dark },
  banner: {
    backgroundColor: colors.dark,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  bannerText: { color: colors.white, fontSize: 26, fontWeight: "800", textAlign: "center", lineHeight: 32 },
  footer: { backgroundColor: colors.dark, padding: spacing.lg, paddingBottom: spacing.xl },
  footerText: { color: colors.white, fontSize: 18, fontWeight: "800" },
});