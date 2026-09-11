import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, FlatList, Linking, Alert, Dimensions } from "react-native";
import { colors, spacing, radius } from "../../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GALLERY_HEIGHT = 420;

// Normalizes an event's photos regardless of whether it's a legacy
// single-imageData event or a newer multi-photo one.
function getPhotoUris(event) {
  if (event.photos?.length > 0) return event.photos.map((p) => p.imageData);
  if (event.imageData) return [event.imageData];
  return [];
}

// Admins often type a link without a protocol (e.g. "google.com") - that
// fails silently otherwise, so add https:// when it's missing.
function normalizeLink(link) {
  if (/^https?:\/\//i.test(link)) return link;
  return `https://${link}`;
}

export default function EventDetailScreen({ route }) {
  const { event } = route.params;
  const photoUris = getPhotoUris(event);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleContact() {
    if (event.link) {
      const url = normalizeLink(event.link.trim());
      Linking.openURL(url).catch(() => {
        Alert.alert("Couldn't open link", "This event's link doesn't look valid.");
      });
    } else if (event.phone) {
      Linking.openURL(`tel:${event.phone}`).catch(() => {
        Alert.alert("Couldn't start call", "Please try dialing manually.");
      });
    }
  }

  function handleScroll(e) {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }

  return (
    <ScrollView style={styles.container}>
      {photoUris.length > 0 && (
        <View>
          <FlatList
            data={photoUris}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              // contain, not cover - these are posters/flyers at real paper
              // proportions (A4, A5, A3, Letter, etc.), so the full poster
              // must stay visible rather than being cropped to fill the box.
              <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="contain" />
            )}
          />
          {photoUris.length > 1 && (
            <View style={styles.dots}>
              {photoUris.map((_, index) => (
                <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

        {(event.link || event.phone) && (
          <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
            <Text style={styles.contactButtonText}>{event.link ? "Open Link" : `Call ${event.phone}`}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  galleryImage: { width: SCREEN_WIDTH, height: GALLERY_HEIGHT, backgroundColor: colors.offWhite },
  dots: { flexDirection: "row", justifyContent: "center", paddingVertical: spacing.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.dark, width: 18 },
  content: { padding: spacing.lg },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  description: { fontSize: 14, color: colors.textMuted, lineHeight: 21, marginBottom: spacing.lg },
  contactButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xl,
  },
  contactButtonText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});