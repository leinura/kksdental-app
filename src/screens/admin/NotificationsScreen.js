import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/notifications");
      setNotifications(res.data);
      apiClient.patch("/notifications/mark-read").catch(() => {});
    } catch (err) {
      setNotifications((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          disabled={!item.caseId}
          onPress={() => navigation.navigate("OrderDetail", { caseId: item.caseId })}
        >
          <View style={[styles.iconCircle, { backgroundColor: item.type === "PAYMENT" ? colors.success : colors.dark }]}>
            <Ionicons name={item.type === "PAYMENT" ? "cash-outline" : "receipt-outline"} size={16} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.message}>{item.message}</Text>
            {item.comment ? (
              <Text style={styles.comment} numberOfLines={2}>
                💬 {item.comment}
              </Text>
            ) : null}
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString()} ·{" "}
              {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
          {item.caseId && <Text style={styles.arrow}>›</Text>}
        </TouchableOpacity>
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
  comment: { fontSize: 12, color: colors.textMuted, fontStyle: "italic", marginTop: 2 },
  date: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  arrow: { fontSize: 18, color: colors.textMuted, marginTop: 4 },
});