import React, { useCallback, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Linking, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

export default function EventScreen() {
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
      Linking.openURL(event.link).catch(() => {});
    } else if (event.phone) {
      Linking.openURL(`tel:${event.phone}`).catch(() => {});
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
      renderItem={({ item }) => (
        <View style={styles.card}>
          {item.imageData ? <Image source={{ uri: item.imageData }} style={styles.image} /> : null}
          <View style={styles.cardBody}>
            <Text style={styles.title}>{item.title}</Text>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

            {(item.link || item.phone) && (
              <TouchableOpacity style={styles.contactButton} onPress={() => handleContact(item)}>
                <Text style={styles.contactButtonText}>{item.link ? "Open Link" : `Call ${item.phone}`}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    />
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
  image: { width: "100%", height: 160, backgroundColor: colors.offWhite },
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