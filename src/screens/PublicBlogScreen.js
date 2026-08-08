import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import apiClient from "../api/client";
import PublicNavHeader from "../components/PublicNavHeader";
import PublicFooter from "../components/PublicFooter";
import { colors, spacing, radius } from "../theme/colors";

export default function PublicBlogScreen({ navigation }) {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    apiClient
      .get("/blog")
      .then((res) => setPosts(res.data))
      .catch(() => setPosts([]));
  }, []);

  return (
    <View style={styles.container}>
      <PublicNavHeader navigation={navigation} active="PublicBlog" />

      {posts === null ? (
        <ActivityIndicator color={colors.dark} size="large" style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.heading}>Blog</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>No posts yet - check back soon.</Text>}
          ListFooterComponent={<PublicFooter />}
          ListFooterComponentStyle={styles.footerWrapper}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.postCard} onPress={() => navigation.navigate("PublicBlogDetail", { postId: item.id })}>
              {item.imageData ? <Image source={{ uri: item.imageData }} style={styles.postImage} /> : null}
              <View style={styles.postBody}>
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  list: { padding: spacing.lg, flexGrow: 1 },
  footerWrapper: { marginHorizontal: -spacing.lg, marginBottom: -spacing.lg, marginTop: "auto" },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  postCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  postImage: { width: "100%", height: 150, backgroundColor: colors.offWhite },
  postBody: { padding: spacing.md },
  postTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 4 },
  postDate: { fontSize: 12, color: colors.textMuted },
});