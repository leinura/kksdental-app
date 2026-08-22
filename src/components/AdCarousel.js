import React, { useEffect, useRef, useState } from "react";
import { View, Image, FlatList, TouchableOpacity, Linking, StyleSheet, Dimensions } from "react-native";
import { colors, spacing } from "../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_HEIGHT = 160;
const AUTO_SLIDE_INTERVAL = 3500;

// Auto-advancing ad carousel - unlike the gallery carousel above it (manual
// swipe only), this one moves on its own on a timer, still swipeable too.
export default function AdCarousel({ ads }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % ads.length;
      flatListRef.current?.scrollToIndex({ index: indexRef.current, animated: true });
      setActiveIndex(indexRef.current);
    }, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [ads.length]);

  function handleScroll(event) {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    indexRef.current = index;
    setActiveIndex(index);
  }

  function handlePress(ad) {
    if (ad.link) {
      Linking.openURL(ad.link).catch(() => {});
    }
  }

  if (ads.length === 0) return null;

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={ads}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={item.link ? 0.85 : 1}
            onPress={() => handlePress(item)}
            style={{ width: SCREEN_WIDTH }}
          >
            <Image source={{ uri: item.imageData }} style={styles.slide} resizeMode="cover" />
          </TouchableOpacity>
        )}
      />
      {ads.length > 1 && (
        <View style={styles.dots}>
          {ads.map((ad, index) => (
            <View key={ad.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { height: CAROUSEL_HEIGHT, width: "100%", backgroundColor: colors.offWhite },
  dots: { flexDirection: "row", justifyContent: "center", marginTop: spacing.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.dark, width: 18 },
});