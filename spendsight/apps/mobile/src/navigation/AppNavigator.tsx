import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, font, fontSize } from "../utils/theme";
import { useAuthStore } from "../store/authStore";

import WelcomeScreen from "../screens/WelcomeScreen";
import OTPScreen from "../screens/OTPScreen";
import DashboardScreen from "../screens/DashboardScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import BudgetScreen from "../screens/BudgetScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AddTransactionScreen from "../screens/AddTransactionScreen";
import CategoryDetailScreen from "../screens/CategoryDetailScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

function TabIcon({
  label,
  focused,
  emoji,
}: {
  label: string;
  focused: boolean;
  emoji: string;
}) {
  return (
    <View style={styles.tabItem}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text
        style={[
          styles.tabLabel,
          {
            color: focused ? colors.tabBarActive : colors.tabBarInactive,
            fontFamily: focused ? font.bold : font.medium,
          },
        ]}
      >
        {label}
      </Text>
      {focused && <View style={styles.tabDot} />}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" label="Transactions" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎯" label="Budgets" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" label="Settings" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
    </Stack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="OTP" component={OTPScreen} />
    </AuthStack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();
  return (
    <NavigationContainer>
      {isLoading ? (
        <LoadingScreen />
      ) : isAuthenticated ? (
        <AppStack />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: "center", justifyContent: "center", width: 72 },
  tabEmoji: { fontSize: 20 },
  tabLabel: { fontSize: 10, marginTop: 2 },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
