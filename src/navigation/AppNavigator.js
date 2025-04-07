import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ClientListScreen from '../screens/ClientListScreen';
import AddEditClientScreen from '../screens/AddEditClientScreen';
import ClientDetailsScreen from '../screens/ClientDetailsScreen';
import { Text } from 'react-native-paper'; // Use Text from react-native-paper

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Show a loading indicator while checking auth state
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b5998" />
        <Text style={styles.loadingText}>Checking Authentication...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User is signed in - Show main app screens
        <Stack.Screen name="MainApp" component={MainAppScreens} />
      ) : (
        // User is signed out - Show authentication screens
        <Stack.Screen name="Auth" component={AuthScreens} />
      )}
    </Stack.Navigator>
  );
};

// Separate component for Auth screens stack
const AuthScreens = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      {/* Add ForgotPasswordScreen here later if needed */}
    </Stack.Navigator>
  );
};

// Separate component for Main App screens stack (starting with Home)
const MainAppScreens = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ClientList" 
        component={ClientListScreen} 
        options={{ title: 'Clients' }}
      />
      <Stack.Screen 
        name="AddEditClient" 
        component={AddEditClientScreen} 
        options={({ route }) => ({
            title: route.params?.clientId ? 'Edit Client' : 'Add New Client',
        })} 
      />
      <Stack.Screen 
        name="ClientDetails" 
        component={ClientDetailsScreen} 
        options={{ title: 'Client Details' }}
      />
      {/* Add other main screens like Orders, Expenses etc. here later */}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5', // A light background color
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#3b5998',
  },
});

export default AppNavigator; 