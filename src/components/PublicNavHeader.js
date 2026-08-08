import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { colors, spacing } from "../theme/colors";

const NAV_ITEMS = [
  { label: "Home", screen: "Welcome" },
  { label: "About Us", screen: "AboutUs" },
  { label: "Gallery", screen: "PublicGallery" },
  { label: "Blog", screen: "PublicBlog" },
  { label: "Log In", screen: "Login" },
];

export default function PublicNavHeader({ navigation, active }) {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>KKSDENTAL Lab</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRow}>
        {NAV_ITEMS.map((item) => (
          <TouchableOpacity key={item.screen} onPress={() => navigation.navigate(item.screen)} style={styles.navItem}>
            <Text style={[styles.navText, active === item.screen && styles.navTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.dark, paddingTop: 60, paddingBottom: spacing.sm },
  logo: { color: colors.white, fontSize: 18, fontWeight: "800", letterSpacing: 0.5, paddingHorizontal: spacing.lg },
  navRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.lg },
  navItem: { paddingBottom: 4 },
  navText: { color: "#B8B8C0", fontSize: 13, fontWeight: "600" },
  navTextActive: { color: colors.white, borderBottomWidth: 2, borderBottomColor: colors.white },
});