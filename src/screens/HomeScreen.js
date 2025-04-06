import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const HomeScreen = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.username}!</Text>
      <Text style={styles.subtitle}>Role: {user?.role}</Text>
      <Text style={styles.subtitle}>Organization ID: {user?.organizationId}</Text>
      
      <Button
        mode="contained"
        onPress={logout}
        style={styles.button}
      >
        Logout
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
  },
});

export default HomeScreen; 