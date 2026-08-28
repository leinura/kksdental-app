import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Video, ResizeMode } from "expo-av";
import apiClient from "../../api/client";
import AdCarousel from "../../components/AdCarousel";
import EventCarousel from "../../components/EventCarousel";
import { colors, spacing, radius } from "../../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SHOP_COLUMNS = 2;
const SHOP_GAP = 10;
const SHOP_TILE_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - SHOP_GAP) / SHOP_COLUMNS;

export default function ClientHomeScreen() {
  const [heroAds, setHeroAds] = useState([]);
  const [shopAds, setShopAds] = useState([]);
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [heroRes, shopRes, eventsRes] = await Promise.all([
        apiClient.get("/ads", { params: { placement: "HERO" } }),
        apiClient.get("/ads", { params: { placement: "SHOP" } }),
        apiClient.get("/events"),
      ]);
      setHeroAds(heroRes.data);
      setShopAds(shopRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      // keep whatever was already loaded on a transient failure
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function handleShopAdPress(ad) {
    if (ad.link) {
      Linking.openURL(ad.link).catch(() => {});
    }
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <AdCarousel ads={heroAds} />

      <View style={styles.videoSection}>
        <Text style={styles.sectionLabel}>Lab Introduction</Text>
        <Video
          source={require("../../../assets/videos/client-home.mp4")}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          useNativeControls
          shouldPlay
          isMuted
          isLooping
        />
      </View>

      {shopAds.length > 0 && (
        <View style={styles.shopSection}>
          <Text style={styles.sectionLabel}>Featured Categories</Text>
          <View style={styles.shopGrid}>
            {shopAds.map((ad) => (
              <TouchableOpacity
                key={ad.id}
                style={styles.shopTile}
                activeOpacity={ad.link ? 0.85 : 1}
                onPress={() => handleShopAdPress(ad)}
              >
                <Image source={{ uri: ad.imageData }} style={styles.shopTileImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {events.length > 0 && (
        <View style={styles.eventsSection}>
          <Text style={styles.sectionLabel}>Courses & Events</Text>
          <EventCarousel events={events} />
        </View>
      )}

      <View style={styles.banner}>
        <Text style={styles.bannerText}>Welcome To{"\n"}KKSDENTAL Lab.</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>KKSDENTAL LAB</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  videoSection: { padding: spacing.lg },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: spacing.sm },
  video: { width: "100%", height: 200, borderRadius: radius.card, backgroundColor: colors.dark },
  shopSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  shopGrid: { flexDirection: "row", flexWrap: "wrap", gap: SHOP_GAP },
  shopTile: {
    width: SHOP_TILE_SIZE,
    height: SHOP_TILE_SIZE,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: colors.offWhite,
  },
  shopTileImage: { width: "100%", height: "100%" },
  eventsSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  banner: {
    backgroundColor: colors.dark,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  bannerText: { color: colors.white, fontSize: 26, fontWeight: "800", textAlign: "center", lineHeight: 32 },
  footer: { backgroundColor: colors.dark, padding: spacing.lg, paddingBottom: spacing.xl },
  footerText: { color: colors.white, fontSize: 18, fontWeight: "800" },
});