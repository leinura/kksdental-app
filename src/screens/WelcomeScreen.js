import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import ServicesCarousel from "../components/ServicesCarousel";
import PublicNavHeader from "../components/PublicNavHeader";
import PublicFooter from "../components/PublicFooter";
import { colors, spacing, radius } from "../theme/colors";

export default function WelcomeScreen({ navigation }) {
  // expo-video's API: a player object (created once, configured here) is
  // handed to <VideoView> to render - replaces expo-av's <Video> component,
  // which is deprecated and being removed in SDK 54.
  const player = useVideoPlayer(require("../../assets/videos/hero.mp4"), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <PublicNavHeader navigation={navigation} active="Welcome" />

        {/* Hero - video background with the headline/button overlaid on top,
            plus a dark scrim so the white text stays readable regardless of
            what's playing underneath. */}
        <View style={styles.hero}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
          <View style={styles.heroScrim} />

          <View style={styles.heroContent}>
            <Text style={styles.headline}>Creating Confidence,{"\n"}One Smile at a Time</Text>

            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Login")}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.subtext}>
              Advanced dental restorations with unmatched quality, accuracy, and care. Trusted by
              dental professionals for reliable results and confident smiles.
            </Text>
          </View>
        </View>

        <View style={styles.servicesSection}>
          <Text style={[styles.servicesHeading, styles.sectionInset]}>Comprehensive Dental Lab Services</Text>
          <Text style={[styles.servicesText, styles.sectionInset]}>
            We provide a wide range of high-quality dental laboratory solutions designed to support
            dentists and clinics with precision, reliability, and timely delivery.
          </Text>
          <ServicesCarousel />
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaHeading}>Ready to Change and Order?</Text>
          <Text style={styles.ctaText}>
            Our laboratory specializes in advanced restorative and removable dental solutions using
            modern materials and expert craftsmanship.
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PublicFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flexGrow: 1, justifyContent: "space-between" },
  top: {},
  hero: { minHeight: 460, backgroundColor: colors.dark, overflow: "hidden" },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,10,10,0.45)" },
  heroContent: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl * 1.5 },
  headline: { fontSize: 34, fontWeight: "800", color: colors.white, lineHeight: 40, marginBottom: spacing.lg },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingLeft: spacing.lg,
    paddingRight: 6,
    alignSelf: "flex-start",
    marginBottom: spacing.xl,
  },
  primaryButtonText: { color: colors.dark, fontWeight: "700", fontSize: 15, marginRight: spacing.md },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  subtext: { fontSize: 13, color: "#E8E8EC", lineHeight: 20 },
  servicesSection: { paddingVertical: spacing.lg, backgroundColor: colors.offWhite },
  sectionInset: { paddingHorizontal: spacing.lg },
  servicesHeading: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  servicesText: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.sm },
  ctaSection: { padding: spacing.lg, backgroundColor: colors.lavender },
  ctaHeading: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  ctaText: { fontSize: 13, color: colors.text, lineHeight: 20, marginBottom: spacing.lg },
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xl,
  },
  secondaryButtonText: { color: colors.text, fontWeight: "700", fontSize: 15 },
});