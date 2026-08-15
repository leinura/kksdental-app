import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors, spacing } from "../../theme/colors";

export default function PrivacyControlScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Privacy & Data Control</Text>

      <Text style={styles.sectionTitle}>What we store</Text>
      <Text style={styles.paragraph}>
        Your clinic account stores patient records (name, age, gender), case/order details
        (service, tooth shade, tooth numbers, pricing), and your payment history with the lab.
        This data is used only to process and track your orders.
      </Text>

      <Text style={styles.sectionTitle}>Who can see it</Text>
      <Text style={styles.paragraph}>
        Only your clinic and KKSDENTAL Lab's admin/lab staff can view your patients, orders, and
        account ledger. Other clinics never have access to your data.
      </Text>

      <Text style={styles.sectionTitle}>Data retention</Text>
      <Text style={styles.paragraph}>
        Patient and order records are kept for as long as your clinic account is active, so your
        order history and invoices remain available to you.
      </Text>

      <Text style={styles.sectionTitle}>Questions or requests</Text>
      <Text style={styles.paragraph}>
        For questions about your data, or to request a copy or deletion of your records, contact
        KKSDENTAL Lab directly.
      </Text>
{/* 
      <Text style={styles.placeholderNote}>
        (This is placeholder policy text - replace it with your lab's actual data handling policy
        whenever you're ready.)
      </Text> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  heading: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  paragraph: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  placeholderNote: { fontSize: 11, color: colors.textMuted, fontStyle: "italic", marginTop: spacing.lg },
});