import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, FlatList, Linking, Dimensions } from "react-native";
import { colors, spacing, radius } from "../../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GALLERY_HEIGHT = 300;

// Normalizes an event's photos regardless of whether it's a legacy
// single-imageData event or a newer multi-photo one.
function getPhotoUris(event) {
  if (event.photos?.length > 0) return event.photos.map((p) => p.imageData);
  if (event.imageData) return [event.imageData];
  return [];
}

export default function EventDetailScreen({ route }) {
  const { event } = route.params;
  const photoUris = getPhotoUris(event);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleContact() {
    if (event.link) {
      Linking.openURL(event.link).catch(() => {});
    } else if (event.phone) {
      Linking.openURL(`tel:${event.phone}`).catch(() => {});
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
              <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="cover" />
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
  dots: { flexDirection: "row", justifyContent: "center", position: "absolute", bottom: spacing.sm, left: 0, right: 0, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.6)" },
  dotActive: { backgroundColor: colors.white, width: 18 },
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