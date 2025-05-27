import React, { useEffect, useRef } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useColorScheme,
} from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { Text } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

// Import screens
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import DashboardScreen from "../screens/Home/DashboardScreen";
import AddClientScreen from "../screens/Clients/AddClientScreen";
import ClientsScreen from "../screens/Clients/ClientsScreen";
import AddProjectScreen from "../screens/Clients/Projects/AddProjectScreen";
import ProjectDetailsScreen from "../screens/Clients/Projects/ProjectDetailsScreen";
import EditProjectScreen from "../screens/Clients/Projects/EditProjectScreen";
import OrdersScreen from "../screens/Orders/OrdersScreen";
import ReportsScreen from "../screens/ReportsScreen";
import ClientDetailsScreen from "../screens/Clients/ClientDetailsScreen";
import EmployeeDetailsScreen from "../screens/Employees/EmployeeDetailsScreen";
import OrderDetailsScreen from "../screens/Orders/OrderDetailsScreen";
import AddEmployeeScreen from "../screens/Employees/AddEmployeeScreen";
import AddOrderScreen from "../screens/Orders/AddOrderScreen";
import EmployeesScreen from "../screens/Employees/EmployeesScreen";
import EditClientScreen from "../screens/Clients/EditClientScreen";
import EditEmployeeScreen from "../screens/Employees/EditEmployeeScreen";
import EditOrderScreen from "../screens/Orders/EditOrderScreen";
import ProfileScreen from "../screens/Home/ProfileScreen";
import DetailsListScreen from "../component/DetailsListScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom BottomTab Bar Component with Refined Design
const CustomTabBar = React.memo(({ state, descriptors, navigation }) => {
  const colorScheme = useColorScheme();
  const tabWidth = wp("100%") / state.routes.length; // Dynamic width per tab
  const animatedValues = useRef(
    state.routes.map(() => ({
      lift: new Animated.Value(0), // For pop-up effect
      scale: new Animated.Value(1), // For icon container scaling
      pressScale: new Animated.Value(1), // For press feedback
    }))
  ).current;

  // Animate lift and scale for each tab when the active tab changes
  useEffect(() => {
    animatedValues.forEach((value, index) => {
      const isFocused = state.index === index;
      Animated.parallel([
        Animated.spring(value.lift, {
          toValue: isFocused ? -10 : 0, // Lift active tab
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.spring(value.scale, {
          toValue: isFocused ? 1.1 : 1, // Scale icon container on active
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
      ]).start();
    });
  }, [state.index, animatedValues]);

  return (
    <View style={styles.bottomNav}>
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#111827", "#1F2937"]
            : ["#E0E7FF", "#F8FAFC"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
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

          // Press animation
          Animated.sequence([
            Animated.timing(animatedValues[index].pressScale, {
              toValue: 0.95,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValues[index].pressScale, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();
        };

        const getIcon = () => {
          switch (route.name) {
            case "Home":
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
            style={[styles.navItem, { width: tabWidth }]}
            onPress={onPress}
          >
            <Animated.View
              style={{
                transform: [
                  { translateY: animatedValues[index].lift },
                  { scale: animatedValues[index].pressScale },
                ],
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Animated.View
                style={[
                  styles.iconContainer,
                  isFocused && styles.iconContainerActive,
                  isFocused &&
                    (colorScheme === "dark"
                      ? styles.iconContainerActiveDark
                      : {}),
                  { transform: [{ scale: animatedValues[index].scale }] },
                ]}
              >
                <FontAwesome5
                  name={getIcon()}
                  size={24}
                  color={isFocused ? "#FFFFFF" : "#666"}
                />
              </Animated.View>
              <Text
                style={[
                  styles.navText,
                  {
                    color: isFocused
                      ? colorScheme === "dark"
                        ? "#3B82F6"
                        : "#0047CC"
                      : "#666",
                    fontWeight: isFocused ? "600" : "400",
                  },
                ]}
              >
                {label}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />
      <Tab.Screen name="Employees" component={EmployeesScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      {/* <Tab.Screen name="Reports" component={ReportsScreen} /> */}
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
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}

      {/* Client Screens */}
      <Stack.Screen name="AddClient" component={AddClientScreen} />
      <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
      <Stack.Screen name="EditClient" component={EditClientScreen} />
      <Stack.Screen name="AddProjectScreen" component={AddProjectScreen} />
      <Stack.Screen name="EditProjectScreen" component={EditProjectScreen} />
      <Stack.Screen
        name="ProjectDetailsScreen"
        component={ProjectDetailsScreen}
      />
      {/*Summary Card Screen for Details Data */}
      <Stack.Screen
        name="ProjectDetailsList"
        component={DetailsListScreen}
        initialParams={{ type: "projects" }}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfitDetailsList"
        component={DetailsListScreen}
        initialParams={{ type: "profits" }}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="IncomeDetailsList"
        component={DetailsListScreen}
        initialParams={{ type: "income" }}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ExpenseDetailsList"
        component={DetailsListScreen}
        initialParams={{ type: "expenses" }}
        options={{ headerShown: false }}
      />

      {/* Employee Screens */}
      <Stack.Screen name="EmployeeDetails" component={EmployeeDetailsScreen} />
      <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
      <Stack.Screen name="EditEmployee" component={EditEmployeeScreen} />

      {/* Order Screens */}
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="AddOrder" component={AddOrderScreen} />
      <Stack.Screen name="EditOrder" component={EditOrderScreen} />

      {/* Profile Screen */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
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
    paddingVertical: 15,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
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
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerActive: {
    backgroundColor: "#0047CC",
    borderRadius: 20,
  },
  iconContainerActiveDark: {
    backgroundColor: "#3B82F6",
  },
});

export default AppNavigator;
