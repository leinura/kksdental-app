import React, { useEffect, useRef, useState } from "react";
import { View, Image, FlatList, TouchableOpacity, Linking, StyleSheet, Dimensions } from "react-native";
import { colors, spacing } from "../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_HEIGHT = 260;
const AUTO_SLIDE_INTERVAL = 4000;

// First photo from either the new multi-photo set or the old single
// imageData field - this compact Home preview shows one photo per event
// slide; the full set is browsable on the Events tab / event detail page.
function getFirstPhoto(event) {
  if (event.photos?.length > 0) return event.photos[0].imageData;
  return event.imageData || null;
}

// Same auto-advance-but-swipeable behavior as AdCarousel, for Events
// (courses/seminars/conferences). Tapping opens the event's link if it has
// one, otherwise dials the phone number if that's what was provided instead.
export default function EventCarousel({ events }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (events.length <= 1) return;
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % events.length;
      flatListRef.current?.scrollToIndex({ index: indexRef.current, animated: true });
      setActiveIndex(indexRef.current);
    }, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [events.length]);

  function handleScroll(event) {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    indexRef.current = index;
    setActiveIndex(index);
  }

  function handlePress(item) {
    if (item.link) {
      Linking.openURL(item.link).catch(() => {});
    } else if (item.phone) {
      Linking.openURL(`tel:${item.phone}`).catch(() => {});
    }
  }

  if (events.length === 0) return null;

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={events}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
        renderItem={({ item }) => {
          const photoUri = getFirstPhoto(item);
          return (
            <TouchableOpacity
              activeOpacity={item.link || item.phone ? 0.85 : 1}
              onPress={() => handlePress(item)}
              style={{ width: SCREEN_WIDTH }}
            >
              {photoUri ? (
                // contain, not cover - these are posters/flyers at real
                // paper proportions (A4, A5, A3, Letter, etc.), so the
                // full poster must stay visible rather than being cropped.
                <Image source={{ uri: photoUri }} style={styles.slide} resizeMode="contain" />
              ) : (
                <View style={[styles.slide, styles.placeholderSlide]} />
              )}
            </TouchableOpacity>
          );
        }}
      />
      {events.length > 1 && (
        <View style={styles.dots}>
          {events.map((item, index) => (
            <View key={item.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { height: CAROUSEL_HEIGHT, width: "100%", backgroundColor: colors.offWhite },
  placeholderSlide: { alignItems: "center", justifyContent: "center" },
  dots: { flexDirection: "row", justifyContent: "center", marginTop: spacing.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.dark, width: 18 },
});