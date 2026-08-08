import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, radius } from "../theme/colors";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!emailOrUsername || !password) {
      setError("Enter your username/email and password");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await login(emailOrUsername, password);
      // Navigation switches automatically based on the logged-in user's
      // role - see AppNavigator.js. No manual redirect needed here.
    } catch (err) {
      console.log("LOGIN ERROR STATUS:", err.response?.status);
      console.log("LOGIN ERROR DATA:", JSON.stringify(err.response?.data));
      console.log("LOGIN ERROR MESSAGE:", err.message);
      if (err.response) {
        // Server responded, so this is a real auth failure (wrong password, etc.)
        setError(err.response.data?.error || "Login failed. Check your credentials.");
      } else {
        // No response at all - the app couldn't reach the server
        setError(
          "Couldn't reach the server. Check that the backend is running and that BASE_URL in src/api/client.js is set correctly."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.logo}>KKSDENTAL Lab</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to manage your cases</Text>

        <Text style={styles.label}>Email or Username</Text>
        <TextInput
          style={styles.input}
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
          autoCapitalize="none"
          placeholder="you@clinic.com"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((s) => !s)}>
            <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          Don't have login details? Contact the lab to have your clinic account set up.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    backgroundColor: colors.dark,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    alignItems: "center",
  },
  backButton: { position: "absolute", left: spacing.lg, top: 62 },
  backButtonText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  logo: { color: colors.white, fontSize: 20, fontWeight: "800", letterSpacing: 0.5 },
  form: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1 },
  eyeButton: { position: "absolute", right: spacing.md },
  eyeText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  error: { color: colors.danger, marginTop: spacing.md, fontSize: 13 },
  button: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  helpText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});