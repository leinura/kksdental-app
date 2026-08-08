import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import ClientHomeScreen from "../screens/client/ClientHomeScreen";
import PatientRegistrationScreen from "../screens/client/PatientRegistrationScreen";
import BillingScreen from "../screens/client/BillingScreen";
import YourOrderScreen from "../screens/client/YourOrderScreen";
import MoreMenuScreen from "../screens/client/MoreMenuScreen";
import InvoicesScreen from "../screens/client/InvoicesScreen";
import AccountSettingScreen from "../screens/client/AccountSettingScreen";
import EditProfileScreen from "../screens/client/EditProfileScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import SecurityScreen from "../screens/SecurityScreen";
import { colors } from "../theme/colors";

const TAB_ICONS = {
  ClientHome: "home-outline",
  PatientRegistration: "person-add-outline",
  Billing: "card-outline",
  YourOrder: "list-outline",
  More: "ellipsis-horizontal-circle-outline",
};

const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.dark }, headerTintColor: colors.white }}>
      <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: "More" }} />
      <MoreStack.Screen name="Invoices" component={InvoicesScreen} options={{ title: "Clinic-wise Invoices" }} />
      <MoreStack.Screen name="AccountSetting" component={AccountSettingScreen} options={{ title: "Account Setting" }} />
      <MoreStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
      <MoreStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Change Password" }} />
      <MoreStack.Screen name="Security" component={SecurityScreen} options={{ title: "Security & Authentication" }} />
    </MoreStack.Navigator>
  );
}

export default function ClientTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.dark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="ClientHome" component={ClientHomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="PatientRegistration" component={PatientRegistrationScreen} options={{ title: "Register" }} />
      <Tab.Screen name="Billing" component={BillingScreen} options={{ title: "Billing" }} />
      <Tab.Screen name="YourOrder" component={YourOrderScreen} options={{ title: "Your Order" }} />
      <Tab.Screen name="More" component={MoreStackNavigator} options={{ title: "More", headerShown: false }} />
    </Tab.Navigator>
  );
}