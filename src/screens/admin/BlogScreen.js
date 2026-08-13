import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

export default function BlogScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null); // { base64, uri } or existing imageData string
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const res = await apiClient.get("/blog");
      setPosts(res.data);
    } catch (err) {
      Alert.alert("Couldn't load posts", "Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadPosts().finally(() => setLoading(false));
  }, [loadPosts]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImage(null);
  }

  function openNewPost() {
    resetForm();
    setShowForm(true);
  }

  async function openEditPost(postSummary) {
    try {
      const res = await apiClient.get(`/blog/${postSummary.id}`);
      setEditingId(res.data.id);
      setTitle(res.data.title);
      setContent(res.data.content);
      setImage(res.data.imageData ? { existingUri: res.data.imageData } : null);
      setShowForm(true);
    } catch (err) {
      Alert.alert("Couldn't load post", "Please try again.");
    }
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to add a cover image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
    });
    if (!result.canceled && result.assets?.[0]) {
      setImage(result.assets[0]);
    }
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Missing information", "Title and content are required.");
      return;
    }
    setSubmitting(true);
    try {
      const imageData = image
        ? image.base64
          ? `data:image/jpeg;base64,${image.base64}`
          : image.existingUri
        : null;

      if (editingId) {
        await apiClient.put(`/blog/${editingId}`, { title, content, imageData });
      } else {
        await apiClient.post("/blog", { title, content, imageData });
      }
      setShowForm(false);
      resetForm();
      loadPosts();
    } catch (err) {
      Alert.alert("Couldn't save post", err.response?.data?.error || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(post) {
    Alert.alert("Delete Post", `Delete "${post.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/blog/${post.id}`);
            loadPosts();
          } catch (err) {
            Alert.alert("Couldn't delete post", "Please try again.");
          }
        },
      },
    ]);
  }

  if (showForm) {
    const previewUri = image ? image.uri || image.existingUri : null;
    return (
      <FlatList
        style={styles.container}
        data={[1]}
        keyExtractor={() => "form"}
        contentContainerStyle={styles.formContent}
        renderItem={() => (
          <View>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.backLink}>‹ Back to posts</Text>
            </TouchableOpacity>

            <Text style={styles.heading}>{editingId ? "Edit Post" : "New Post"}</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />

            <Text style={styles.label}>Cover Image (optional)</Text>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.coverPreview} />
            ) : null}
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Text style={styles.imagePickerText}>{previewUri ? "Change Image" : "Choose Image"}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              multiline
              placeholder="Write the article..."
              placeholderTextColor={colors.textMuted}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitText}>{editingId ? "Save Changes" : "Publish Post"}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Blog</Text>
        <TouchableOpacity style={styles.addButton} onPress={openNewPost}>
          <Text style={styles.addButtonText}>+ New Post</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.dark} size="large" style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No posts yet - tap "New Post" to write the first one.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.postRow} onPress={() => openEditPost(item)} onLongPress={() => handleDelete(item)}>
              {item.imageData ? <Image source={{ uri: item.imageData }} style={styles.postThumb} /> : null}
              <View style={{ flex: 1 }}>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg },
  heading: { fontSize: 20, fontWeight: "700", color: colors.text },
  addButton: { backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  postRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  postThumb: { width: 50, height: 50, borderRadius: radius.input, backgroundColor: colors.offWhite },
  postTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  postDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  formContent: { padding: spacing.lg },
  backLink: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  textArea: { minHeight: 150, textAlignVertical: "top" },
  coverPreview: { width: "100%", height: 160, borderRadius: radius.card, marginBottom: spacing.sm },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: "center",
  },
  imagePickerText: { color: colors.dark, fontWeight: "700", fontSize: 13 },
  submitButton: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});