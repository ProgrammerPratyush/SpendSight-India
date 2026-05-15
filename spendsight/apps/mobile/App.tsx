import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./src/services/firebase";
import { useAuthStore } from "./src/store/authStore";
import AppNavigator from "./src/navigation/AppNavigator";
import apiClient from "./src/services/apiClient";
import { View, ActivityIndicator } from "react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";

export default function App() {
  const { setUser, logout } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await apiClient.post("/api/auth/verify", {
            idToken,
          });
          setUser(response.data.data);
        } catch (err) {
          setUser({
            userId: "",
            firebaseUid: firebaseUser.uid,
            name: "",
            isNewUser: true,
          });
        }
      } else {
        logout();
      }
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F4F6FF",
        }}
      >
        <ActivityIndicator size="large" color="#000B60" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#F4F6FF" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
