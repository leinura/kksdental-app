import React, { useEffect, useRef, useState } from "react";
import { View, Image, FlatList, TouchableOpacity, Linking, StyleSheet, Dimensions } from "react-native";
import { colors, spacing } from "../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_HEIGHT = 160;
const AUTO_SLIDE_INTERVAL = 4000;

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
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={item.link || item.phone ? 0.85 : 1}
            onPress={() => handlePress(item)}
            style={{ width: SCREEN_WIDTH }}
          >
            {item.imageData ? (
              <Image source={{ uri: item.imageData }} style={styles.slide} resizeMode="cover" />
            ) : (
              <View style={[styles.slide, styles.placeholderSlide]} />
            )}
          </TouchableOpacity>
        )}
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