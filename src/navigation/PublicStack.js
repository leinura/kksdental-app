import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../screens/WelcomeScreen";
import AboutUsScreen from "../screens/AboutUsScreen";
import PublicGalleryScreen from "../screens/PublicGalleryScreen";
import PublicBlogScreen from "../screens/PublicBlogScreen";
import PublicBlogDetailScreen from "../screens/PublicBlogDetailScreen";
import LoginScreen from "../screens/LoginScreen";

const Stack = createNativeStackNavigator();

export default function PublicStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="AboutUs" component={AboutUsScreen} />
      <Stack.Screen name="PublicGallery" component={PublicGalleryScreen} />
      <Stack.Screen name="PublicBlog" component={PublicBlogScreen} />
      <Stack.Screen name="PublicBlogDetail" component={PublicBlogDetailScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}