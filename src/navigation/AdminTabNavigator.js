import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import OrdersScreen from "../screens/admin/OrdersScreen";
import TrackOrdersScreen from "../screens/admin/TrackOrdersScreen";
import ForLabScreen from "../screens/admin/ForLabScreen";
import ForLabOrdersScreen from "../screens/admin/ForLabOrdersScreen";
import AdminMoreMenuScreen from "../screens/admin/AdminMoreMenuScreen";
import InvoiceScreen from "../screens/admin/InvoiceScreen";
import InvoiceDetailScreen from "../screens/admin/InvoiceDetailScreen";
import ManageClinicsScreen from "../screens/admin/ManageClinicsScreen";
import GalleryScreen from "../screens/admin/GalleryScreen";
import BlogScreen from "../screens/admin/BlogScreen";
import CatalogScreen from "../screens/admin/CatalogScreen";
import ReportsScreen from "../screens/admin/ReportsScreen";
import AdminAccountSettingScreen from "../screens/admin/AdminAccountSettingScreen";
import AdminEditProfileScreen from "../screens/admin/AdminEditProfileScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import SecurityScreen from "../screens/SecurityScreen";
import NotificationsScreen from "../screens/admin/NotificationsScreen";
import OrderDetailScreen from "../screens/admin/OrderDetailScreen";
import NotificationBell from "../components/NotificationBell";
import { useRegisterPushToken } from "../hooks/useRegisterPushToken";
import { colors } from "../theme/colors";

const TAB_ICONS = {
  Dashboard: "speedometer-outline",
  Orders: "receipt-outline",
  TrackOrders: "navigate-outline",
  ForLab: "flask-outline",
  AdminMore: "ellipsis-horizontal-circle-outline",
  Notifications: "notifications-outline",
  OrderDetail: "document-text-outline",
  ForLabOrders: "list-outline",
};

const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();

function AdminMoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.dark }, headerTintColor: colors.white }}>
      <MoreStack.Screen name="AdminMoreMenu" component={AdminMoreMenuScreen} options={{ title: "More" }} />
      <MoreStack.Screen name="Invoice" component={InvoiceScreen} />
      <MoreStack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={({ route }) => ({ title: route.params?.clinicName || "Invoice" })}
      />
      <MoreStack.Screen name="ManageClinics" component={ManageClinicsScreen} options={{ title: "Manage Clinics" }} />
      <MoreStack.Screen name="Gallery" component={GalleryScreen} />
      <MoreStack.Screen name="Blog" component={BlogScreen} />
      <MoreStack.Screen name="Catalog" component={CatalogScreen} options={{ title: "Services & Pricing" }} />
      <MoreStack.Screen name="Reports" component={ReportsScreen} />
      <MoreStack.Screen
        name="AdminAccountSetting"
        component={AdminAccountSettingScreen}
        options={{ title: "Account Settings" }}
      />
      <MoreStack.Screen name="EditProfile" component={AdminEditProfileScreen} options={{ title: "Edit Profile" }} />
      <MoreStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Change Password" }} />
      <MoreStack.Screen name="Security" component={SecurityScreen} options={{ title: "Security" }} />
    </MoreStack.Navigator>
  );
}

export default function AdminTabNavigator() {
  useRegisterPushToken();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.dark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />,
        headerRight: () => <NotificationBell navigation={navigation} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="TrackOrders" component={TrackOrdersScreen} options={{ title: "Track Orders" }} />
      <Tab.Screen name="ForLab" component={ForLabScreen} options={{ title: "For Lab" }} />
      <Tab.Screen name="AdminMore" component={AdminMoreStackNavigator} options={{ title: "More", headerShown: false }} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Notifications", tabBarButton: () => null, tabBarStyle: { display: "none" } }}
      />
      <Tab.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: "Order Details", tabBarButton: () => null, tabBarStyle: { display: "none" } }}
      />
      <Tab.Screen
        name="ForLabOrders"
        component={ForLabOrdersScreen}
        options={{ title: "Clinic Orders", tabBarButton: () => null, tabBarStyle: { display: "none" } }}
      />
    </Tab.Navigator>
  );
}