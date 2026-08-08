import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import apiClient from "../api/client";

export function useRegisterPushToken() {
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  async function registerForPushNotifications() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        // Not fatal - the in-app bell/badge still works without push
        // permission, this just skips the device-level push registration.
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.log("Push token registration skipped: no EAS projectId found in app.json yet.");
        return;
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      await apiClient.patch("/auth/push-token", { pushToken: tokenResponse.data });
    } catch (err) {
      console.log("Push token registration failed:", err.message);
    }
  }
}