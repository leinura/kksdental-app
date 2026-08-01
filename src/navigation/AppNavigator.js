import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import ClientTabNavigator from "./ClientTabNavigator";
import AdminTabNavigator from "./AdminTabNavigator";
import { colors } from "../theme/colors";

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.dark} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <LoginScreen />
      ) : user.role === "DENTIST" ? (
        <ClientTabNavigator />
      ) : (
        // ADMIN and LAB_STAFF share the same dashboard for now - split later
        // if lab staff end up needing a more restricted view.
        <AdminTabNavigator />
      )}
    </NavigationContainer>
  );
}
