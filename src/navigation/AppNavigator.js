import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { Text } from "react-native-paper";

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

// Import the updated CustomTabBar
import CustomTabBar from "./CustomTabBar";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
      {/* Summary Card Screen for Details Data */}
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
});

export default AppNavigator;
