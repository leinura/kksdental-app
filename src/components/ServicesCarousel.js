import React, { useRef } from "react";
import { View, Text, Image, Animated, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../theme/colors";

// Photos live in assets/images/services/ - rename the files there to match
// these paths, or edit the require() calls below to match your filenames.
const SERVICES = [
  {
    id: "01",
    title: "Zirconia Crown & Bridge",
    description: "Strong, natural-looking restorations milled from solid zirconia.",
    image: require("../../assets/images/services/zirconia-crown-bridge.jpg"),
  },
  {
    id: "02",
    title: "Porcelain Fused to Metal Crown & Bridge",
    description: "Durable metal-core crowns layered with lifelike porcelain.",
    image: require("../../assets/images/services/pfm-crown-bridge.jpg"),
  },
  {
    id: "03",
    title: "Complete Denture",
    description: "Full-arch dentures crafted for comfort, fit, and a confident smile.",
    image: require("../../assets/images/services/complete-denture.jpg"),
  },
  {
    id: "04",
    title: "Night Guard",
    description: "Custom guards that protect teeth from grinding and jaw tension.",
    image: require("../../assets/images/services/night-guard.jpg"),
  },
];

const CARD_WIDTH = 220;
const CARD_SPACING = 16;
const SNAP = CARD_WIDTH + CARD_SPACING;
const IMAGE_HEIGHT = 140;

export default function ServicesCarousel() {
  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    <Animated.FlatList
      data={SERVICES}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={SNAP}
      decelerationRate="fast"
      contentContainerStyle={styles.listContent}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      })}
      scrollEventThrottle={16}
      renderItem={({ item, index }) => {
        const inputRange = [(index - 1) * SNAP, index * SNAP, (index + 1) * SNAP];
        const scale = scrollX.interpolate({ inputRange, outputRange: [0.92, 1, 0.92], extrapolate: "clamp" });
        const opacity = scrollX.interpolate({ inputRange, outputRange: [0.6, 1, 0.6], extrapolate: "clamp" });

        return (
          <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
            <View style={styles.imageWrapper}>
              <Image source={item.image} style={styles.image} resizeMode="cover" />
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{item.id}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
          </Animated.View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  card: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageWrapper: { width: "100%", height: IMAGE_HEIGHT, backgroundColor: colors.dark },
  image: { width: "100%", height: "100%" },
  numberBadge: { position: "absolute", top: spacing.sm, left: spacing.sm },
  numberText: { fontSize: 22, fontWeight: "800", color: colors.white },
  cardBody: { padding: spacing.md },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 6, lineHeight: 20 },
  cardDescription: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
});