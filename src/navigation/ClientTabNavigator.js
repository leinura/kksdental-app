import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ClientHomeScreen from "../screens/client/ClientHomeScreen";
import PatientRegistrationScreen from "../screens/client/PatientRegistrationScreen";
import BillingScreen from "../screens/client/BillingScreen";
import YourOrderScreen from "../screens/client/YourOrderScreen";
import MoreMenuScreen from "../screens/client/MoreMenuScreen";
import InvoicesScreen from "../screens/client/InvoicesScreen";
import AccountSettingScreen from "../screens/client/AccountSettingScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.dark }, headerTintColor: colors.white }}>
      <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: "More" }} />
      <MoreStack.Screen name="Invoices" component={InvoicesScreen} options={{ title: "Clinic-wise Invoices" }} />
      <MoreStack.Screen name="AccountSetting" component={AccountSettingScreen} options={{ title: "Account Setting" }} />
    </MoreStack.Navigator>
  );
}

export default function ClientTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.dark,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="ClientHome" component={ClientHomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="PatientRegistration" component={PatientRegistrationScreen} options={{ title: "Register" }} />
      <Tab.Screen name="Billing" component={BillingScreen} options={{ title: "Billing" }} />
      <Tab.Screen name="YourOrder" component={YourOrderScreen} options={{ title: "Your Order" }} />
      <Tab.Screen name="More" component={MoreStackNavigator} options={{ title: "More", headerShown: false }} />
    </Tab.Navigator>
  );
}
