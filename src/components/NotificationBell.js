import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../api/client";
import { colors, spacing } from "../theme/colors";

export default function NotificationBell({ navigation }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadCount();
    // Simple poll for near-live updates without needing websockets.
    const interval = setInterval(loadCount, 20000);
    return () => clearInterval(interval);
  }, []);

  async function loadCount() {
    try {
      const res = await apiClient.get("/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch (err) {
      // silent - badge just won't update this cycle
    }
  }

  return (
    <TouchableOpacity style={styles.container} onPress={() => navigation.navigate("Notifications")}>
      <Ionicons name="notifications-outline" size={24} color={colors.white} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginRight: spacing.lg, padding: 4 },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: "700" },
});