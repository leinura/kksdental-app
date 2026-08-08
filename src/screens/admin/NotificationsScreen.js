import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await apiClient.get("/notifications");
      setNotifications(res.data);
      apiClient.patch("/notifications/mark-read").catch(() => {});
    } catch (err) {
      setNotifications([]);
    }
  }

  if (notifications === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={notifications}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: item.type === "PAYMENT" ? colors.success : colors.dark }]}>
            <Ionicons name={item.type === "PAYMENT" ? "cash-outline" : "receipt-outline"} size={16} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString()} ·{" "}
              {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  list: { padding: spacing.lg },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 2 },
  message: { fontSize: 14, fontWeight: "600", color: colors.text, lineHeight: 20 },
  date: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});