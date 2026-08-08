import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import apiClient from "../api/client";
import { colors, spacing } from "../theme/colors";

export default function PublicBlogDetailScreen({ route, navigation }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);

  useEffect(() => {
    apiClient
      .get(`/blog/${postId}`)
      .then((res) => setPost(res.data))
      .catch(() => setPost(false));
  }, [postId]);

  if (post === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.dark} size="large" />
      </View>
    );
  }

  if (post === false) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Couldn't load this post.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      {post.imageData ? <Image source={{ uri: post.imageData }} style={styles.image} /> : null}

      <View style={styles.body}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.date}>{new Date(post.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.content}>{post.content}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  errorText: { color: colors.textMuted },
  header: { backgroundColor: colors.dark, paddingTop: 60, paddingBottom: spacing.md, paddingHorizontal: spacing.lg },
  backLink: { color: colors.white, fontSize: 14, fontWeight: "600" },
  image: { width: "100%", height: 220, backgroundColor: colors.offWhite },
  body: { padding: spacing.lg },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 6 },
  date: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  content: { fontSize: 15, color: colors.text, lineHeight: 24 },
});