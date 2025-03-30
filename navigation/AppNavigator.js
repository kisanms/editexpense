import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import OrderFormScreen from '../screens/AddOrderScreen';
import StatusScreen from '../screens/StatusScreen';
import MembersScreen from '../screens/MembersScreen';
import OrganizationSetupScreen from '../screens/OrganizationSetupScreen';
import OrderDetails from '../screens/OrderDetails';
import ActivityHistoryScreen from '../screens/ActivityHistoryScreen';
import EditorProfileScreen from '../screens/EditorProfileScreen';
import { useAuth } from '../contexts/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Add Order') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Status') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Team') {
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A6FFF',
        tabBarInactiveTintColor: '#6e6e73',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Add Order" component={OrderFormScreen} />
      <Tab.Screen name="Status" component={StatusScreen} />
      <Tab.Screen name="Team" component={MembersScreen} />
    </Tab.Navigator>
  );
};

// Create a stack navigator for the main app screens
const MainStack = createStackNavigator();

const MainStackNavigator = () => {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="OrderDetails" component={OrderDetails} />
    </MainStack.Navigator>
  );
};

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#4A6FFF" />
  </View>
);

const AppNavigator = () => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Debug info to help troubleshoot navigation issues
  console.log("Navigation state:", { 
    isAuthenticated: !!user, 
    hasOrgId: !!user?.organizationId,
    hasOrgData: !!userData,
    userRole: user?.role,
    email: user?.email,
    userObject: user ? JSON.stringify({
      uid: user.uid,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role
    }) : null
  });

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth Stack
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      ) : (
        // Main App Stack
        <Stack.Group>
          <Stack.Screen name="MainStack" component={MainStackNavigator} />
          <Stack.Screen name="OrganizationSetup" component={OrganizationSetupScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
