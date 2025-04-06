import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Button, Text, Surface, Avatar, useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={80} 
              label={user?.username?.substring(0, 2).toUpperCase() || 'U'} 
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.username}>{user?.username}</Text>
            </View>
          </View>
          <View style={styles.roleContainer}>
            <MaterialCommunityIcons 
              name={user?.role === 'admin' ? 'account-tie' : 'account-group'} 
              size={24} 
              color="#3b5998" 
            />
            <Text style={styles.roleText}>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</Text>
          </View>
        </Surface>

        <Surface style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="office-building" size={24} color="#3b5998" />
            <Text style={styles.cardTitle}>Organization</Text>
          </View>
          <Text style={styles.cardContent}>ID: {user?.organizationId}</Text>
        </Surface>

        <Surface style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="email" size={24} color="#3b5998" />
            <Text style={styles.cardTitle}>Email</Text>
          </View>
          <Text style={styles.cardContent}>{user?.email}</Text>
        </Surface>

        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          icon="logout"
        >
          Sign Out
        </Button>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    backgroundColor: '#3b5998',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b5998',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  roleText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#3b5998',
    fontWeight: '500',
  },
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b5998',
    marginLeft: 10,
  },
  cardContent: {
    fontSize: 16,
    color: '#666',
    marginLeft: 34,
  },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#3b5998',
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 