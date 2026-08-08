import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const storedUser = await AsyncStorage.getItem("kksdental_user");
      const token = await AsyncStorage.getItem("kksdental_token");
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      }
    } finally {
      setLoading(false);
    }
  }

  async function login(emailOrUsername, password) {
    const { data } = await apiClient.post("/auth/login", {
      emailOrUsername,
      password,
      deviceInfo: Platform.OS,
    });
    await AsyncStorage.setItem("kksdental_token", data.token);
    await AsyncStorage.setItem("kksdental_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await AsyncStorage.multiRemove(["kksdental_token", "kksdental_user"]);
    setUser(null);
  }

  // Call after a profile edit succeeds server-side, so the app reflects the
  // new name/email/clinic details immediately without requiring re-login.
  async function updateUser(partialUser) {
    const merged = { ...user, ...partialUser };
    setUser(merged);
    await AsyncStorage.setItem("kksdental_user", JSON.stringify(merged));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}