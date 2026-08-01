import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import OrdersScreen from "../screens/admin/OrdersScreen";
import TrackOrdersScreen from "../screens/admin/TrackOrdersScreen";
import AdminMoreMenuScreen from "../screens/admin/AdminMoreMenuScreen";
import InvoiceScreen from "../screens/admin/InvoiceScreen";
import ManageClinicsScreen from "../screens/admin/ManageClinicsScreen";
import ReportsScreen from "../screens/admin/ReportsScreen";
import AdminAccountSettingScreen from "../screens/admin/AdminAccountSettingScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();

function AdminMoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.dark }, headerTintColor: colors.white }}>
      <MoreStack.Screen name="AdminMoreMenu" component={AdminMoreMenuScreen} options={{ title: "More" }} />
      <MoreStack.Screen name="Invoice" component={InvoiceScreen} />
      <MoreStack.Screen name="ManageClinics" component={ManageClinicsScreen} options={{ title: "Manage Clinics" }} />
      <MoreStack.Screen name="Reports" component={ReportsScreen} />
      <MoreStack.Screen
        name="AdminAccountSetting"
        component={AdminAccountSettingScreen}
        options={{ title: "Account Settings" }}
      />
    </MoreStack.Navigator>
  );
}

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.dark,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="TrackOrders" component={TrackOrdersScreen} options={{ title: "Track Orders" }} />
      <Tab.Screen name="AdminMore" component={AdminMoreStackNavigator} options={{ title: "More", headerShown: false }} />
    </Tab.Navigator>
  );
}
