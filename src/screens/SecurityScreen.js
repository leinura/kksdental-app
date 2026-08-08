import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import apiClient from "../api/client";
import { colors, spacing } from "../theme/colors";

const DEVICE_LABELS = { android: "Android", ios: "iOS", web: "Web" };

export default function SecurityScreen() {
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    apiClient
      .get("/auth/login-activity")
      .then((res) => setActivity(res.data))
      .catch(() => setActivity([]));
  }, []);

  if (activity === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recent Login Activity</Text>
      <FlatList
        data={activity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No login activity recorded yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowDate}>
                {new Date(item.createdAt).toLocaleDateString()} ·{" "}
                {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
              {item.ipAddress ? <Text style={styles.rowMeta}>IP: {item.ipAddress}</Text> : null}
            </View>
            <Text style={styles.deviceTag}>{DEVICE_LABELS[item.deviceInfo] || "Unknown device"}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  heading: { fontSize: 18, fontWeight: "700", color: colors.text, padding: spacing.lg, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowDate: { fontSize: 14, fontWeight: "600", color: colors.text },
  rowMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  deviceTag: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    backgroundColor: colors.offWhite,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});