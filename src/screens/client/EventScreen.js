import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_IMAGE_HEIGHT = 220;

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

export default function EventScreen({ navigation }) {
  const [events, setEvents] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const res = await apiClient.get("/events");
      setEvents(res.data);
    } catch (err) {
      setEvents((prev) => prev ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }

  function handleContact(event) {
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

  if (events === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={events}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      ListHeaderComponent={<Text style={styles.heading}>Events</Text>}
      ListEmptyComponent={<Text style={styles.emptyText}>No events, courses, or seminars posted yet.</Text>}
      renderItem={({ item }) => {
        const photoUris = getPhotoUris(item);
        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("EventDetail", { event: item })}
          >
            {photoUris.length > 0 && <EventCardCarousel photos={photoUris} />}
            <View style={styles.cardBody}>
              <Text style={styles.title}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              {(item.link || item.phone) && (
                <TouchableOpacity style={styles.contactButton} onPress={() => handleContact(item)}>
                  <Text style={styles.contactButtonText}>{item.link ? "Open Link" : `Call ${item.phone}`}</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

// Small per-card photo browser - manual swipe only (no auto-advance),
// since multiple auto-sliding carousels stacked in one scrolling list
// would be visually noisy. contain (not cover) so a full poster - A4, A5,
// A3, Letter, whatever proportions it happens to be - is always fully
// visible, never cropped.
function EventCardCarousel({ photos }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardWidth = SCREEN_WIDTH - spacing.lg * 2 - 2;

  function handleScroll(e) {
    const index = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
    setActiveIndex(index);
  }

  if (photos.length === 1) {
    return <Image source={{ uri: photos[0] }} style={styles.image} resizeMode="contain" />;
  }

  return (
    <View>
      <FlatList
        data={photos}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={[styles.image, { width: cardWidth }]}
            resizeMode="contain"
          />
        )}
      />
      <View style={styles.dots}>
        {photos.map((_, index) => (
          <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: "hidden",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: "100%", height: CARD_IMAGE_HEIGHT, backgroundColor: colors.offWhite },
  dots: { flexDirection: "row", justifyContent: "center", paddingVertical: spacing.xs, gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.dark, width: 14 },
  cardBody: { padding: spacing.md },
  title: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 4 },
  description: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: spacing.sm },
  contactButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  contactButtonText: { color: colors.white, fontWeight: "700", fontSize: 13 },
});