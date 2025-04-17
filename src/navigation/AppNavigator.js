import React from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { Text } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

// Import screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AddClientScreen from "../screens/AddClientScreen";
import ClientsScreen from "../screens/ClientsScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ReportsScreen from "../screens/ReportsScreen";
import ClientDetailsScreen from "../screens/ClientDetailsScreen";
import EmployeeDetailsScreen from "../screens/EmployeeDetailsScreen";
import OrderDetailsScreen from "../screens/OrderDetailsScreen";
import AddEmployeeScreen from "../screens/AddEmployeeScreen";
import AddOrderScreen from "../screens/AddOrderScreen";
import EmployeesScreen from "../screens/EmployeesScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.bottomNav}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const getIcon = () => {
          switch (route.name) {
            case "Dashboard":
              return "home";
            case "Clients":
              return "users";
            case "Employees":
              return "user-tie";
            case "Orders":
              return "file-invoice-dollar";
            case "Reports":
              return "chart-bar";
            default:
              return "home";
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.navItem, isFocused && styles.navItemActive]}
            onPress={onPress}
          >
            <FontAwesome5
              name={getIcon()}
              size={20}
              color={isFocused ? "#0047CC" : "#666"}
            />
            <Text style={isFocused ? styles.navTextActive : styles.navText}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />
      <Tab.Screen name="Employees" component={EmployeesScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b5998" />
        <Text style={styles.loadingText}>Checking Authentication...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        // User is signed in - Show MainTabs
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        // User is signed out - Show authentication screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}

      {/* Client Screens */}
      <Stack.Screen name="AddClient" component={AddClientScreen} />
      <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />

      {/* Employee Screens */}
      <Stack.Screen name="EmployeeDetails" component={EmployeeDetailsScreen} />
      <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />

      {/* Order Screens */}
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="AddOrder" component={AddOrderScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#3b5998",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  navItem: {
    alignItems: "center",
  },
  navItemActive: {
    backgroundColor: "rgba(0, 71, 204, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  navText: {
    color: "#666666",
    fontSize: 12,
    marginTop: 4,
  },
  navTextActive: {
    color: "#0047CC",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
});

export default AppNavigator;
