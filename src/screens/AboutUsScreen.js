import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import PublicNavHeader from "../components/PublicNavHeader";
import PublicFooter from "../components/PublicFooter";
import { colors, spacing } from "../theme/colors";

export default function AboutUsScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <PublicNavHeader navigation={navigation} active="AboutUs" />

        <View style={styles.body}>
          <Text style={styles.heading}>About KKSDENTAL Lab</Text>
          <Text style={styles.paragraph}>
            KKSDENTAL Lab is a dental laboratory dedicated to precision restorative and removable
            solutions - crowns, bridges, dentures, and custom appliances - built for dentists and
            clinics who need reliable, consistent results delivered on time.
          </Text>
          <Text style={styles.paragraph}>
            Every case is handled with careful attention to fit, function, and aesthetics, using
            modern materials and techniques. We work as an extension of your practice, so your
            patients get the same quality and confidence in every restoration.
          </Text>
          <Text style={styles.paragraph}>
            Our online platform lets partner clinics register patients, place orders, track case
            status in real time, and manage billing - all in one place.
          </Text>
          <Text style={styles.placeholderNote}>
            (This is placeholder copy - replace it with your lab's real story, team, and
            credentials whenever you're ready.)
          </Text>
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
  body: { padding: spacing.lg },
  heading: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: spacing.lg },
  paragraph: { fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: spacing.md },
  placeholderNote: { fontSize: 12, color: colors.textMuted, fontStyle: "italic", marginTop: spacing.md },
});