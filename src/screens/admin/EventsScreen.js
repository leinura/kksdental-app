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
import * as ImageManipulator from "expo-image-manipulator";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

const EMPTY_FORM = { title: "", description: "", link: "", phone: "" };

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [image, setImage] = useState(null); // { uri, base64 } or { existingUri }
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const res = await apiClient.get("/events");
      setEvents(res.data);
    } catch (err) {
      Alert.alert("Couldn't load events", "Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadEvents().finally(() => setLoading(false));
  }, [loadEvents]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImage(null);
  }

  function openNewEvent() {
    resetForm();
    setShowForm(true);
  }

  function openEditEvent(event) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description || "",
      link: event.link || "",
      phone: event.phone || "",
    });
    setImage(event.imageData ? { existingUri: event.imageData } : null);
    setShowForm(true);
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to add an event photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setProcessingPhoto(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      setImage({ uri: manipulated.uri, base64: manipulated.base64 });
    } catch (err) {
      Alert.alert("Couldn't process photo", "Please try again.");
    } finally {
      setProcessingPhoto(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      Alert.alert("Missing information", "Title is required.");
      return;
    }
    setSubmitting(true);
    try {
      const imageData = image ? (image.base64 ? `data:image/jpeg;base64,${image.base64}` : image.existingUri) : null;
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        link: form.link.trim() || null,
        phone: form.phone.trim() || null,
        imageData,
      };

      if (editingId) {
        await apiClient.put(`/events/${editingId}`, payload);
      } else {
        await apiClient.post("/events", payload);
      }
      setShowForm(false);
      resetForm();
      loadEvents();
    } catch (err) {
      Alert.alert("Couldn't save event", err.response?.data?.error || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(event) {
    Alert.alert("Delete Event", `Delete "${event.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/events/${event.id}`);
            loadEvents();
          } catch (err) {
            Alert.alert("Couldn't delete event", "Please try again.");
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
              <Text style={styles.backLink}>‹ Back to events</Text>
            </TouchableOpacity>

            <Text style={styles.heading}>{editingId ? "Edit Event" : "New Event"}</Text>

            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={(v) => updateField("title", v)} />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(v) => updateField("description", v)}
              multiline
              placeholder="Course/seminar/conference details..."
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Photo (optional)</Text>
            {previewUri ? <Image source={{ uri: previewUri }} style={styles.coverPreview} /> : null}
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage} disabled={processingPhoto}>
              {processingPhoto ? (
                <ActivityIndicator size="small" color={colors.dark} />
              ) : (
                <Text style={styles.imagePickerText}>{previewUri ? "Change Photo" : "Choose Photo"}</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Link (optional)</Text>
            <TextInput
              style={styles.input}
              value={form.link}
              onChangeText={(v) => updateField("link", v)}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone (used if no link)</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(v) => updateField("phone", v)}
              placeholder="+91..."
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitText}>{editingId ? "Save Changes" : "Publish Event"}</Text>
              )}
            </TouchableOpacity>

            {editingId && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete({ id: editingId, title: form.title })}
              >
                <Text style={styles.deleteButtonText}>Delete Event</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Events</Text>
        <TouchableOpacity style={styles.addButton} onPress={openNewEvent}>
          <Text style={styles.addButtonText}>+ New Event</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.dark} size="large" style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No events yet - tap "New Event" to add the first one.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.eventRow} onPress={() => openEditEvent(item)}>
              {item.imageData ? <Image source={{ uri: item.imageData }} style={styles.eventThumb} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventMeta}>
                  {item.link ? "🔗 Has link" : item.phone ? `📞 ${item.phone}` : "No contact info"}
                </Text>
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
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventThumb: { width: 50, height: 50, borderRadius: radius.input, backgroundColor: colors.offWhite },
  eventTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  eventMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
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
  textArea: { minHeight: 100, textAlignVertical: "top" },
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
  deleteButton: {
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteButtonText: { color: colors.danger, fontWeight: "700", fontSize: 15 },
});