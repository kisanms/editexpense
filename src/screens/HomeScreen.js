import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, Surface, Avatar, useTheme, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const HomeScreen = ({ navigation }) => {
  const { user, userProfile, businessDetails, logout, loading } = useAuth();
  const theme = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = () => {
    if (userProfile?.username) {
      return userProfile.username.substring(0, 1).toUpperCase();
    }
    if (user?.displayName) {
      return user.displayName.substring(0, 1).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 1).toUpperCase();
    }
    return 'U';
  };

  const getUsername = () => {
    return userProfile?.username || user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  const getRole = () => {
    if (!userProfile?.role) return '...';
    return userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1);
  };

  const getOrganizationId = () => {
    return userProfile?.businessId || '...';
  };

  const getBusinessName = () => {
    return businessDetails?.businessName || 'Loading Business...';
  };

  if (loading && !userProfile) {
    return (
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.loadingContainer}>
        <ActivityIndicator animating={true} color={theme.colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading Your Dashboard...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.headerSurface} elevation={4}>
          <View style={styles.headerTopRow}>
            <Avatar.Text 
              size={wp('15%')}
              label={getInitials()} 
              style={styles.avatar}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.usernameText} numberOfLines={1}>{getUsername()}</Text>
            </View>
          </View>
          <View style={styles.headerBottomRow}>
            <View style={styles.detailChip}>
              <MaterialCommunityIcons name="domain" size={18} color={theme.colors.primary} />
              <Text style={styles.detailChipText} numberOfLines={1}>{getBusinessName()}</Text>
            </View>
            <View style={styles.detailChip}>
              <MaterialCommunityIcons name="account-group" size={18} color={theme.colors.primary} />
              <Text style={styles.detailChipText}>{getRole()}</Text>
            </View>
          </View>
        </Surface>

        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.kpiRow}>
          <Surface style={styles.kpiCard} elevation={2}>
            <Text style={styles.kpiValue}>--</Text>
            <Text style={styles.kpiLabel}>Active Orders</Text>
          </Surface>
          <Surface style={styles.kpiCard} elevation={2}>
            <Text style={styles.kpiValue}>--</Text>
            <Text style={styles.kpiLabel}>Total Clients</Text>
          </Surface>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <Button 
            icon="receipt-text-plus-outline"
            mode="contained" 
            onPress={() => navigation.navigate('OrderList')}
            style={styles.quickActionButton}
          >
            View Orders
          </Button>
          <Button 
            icon="account-multiple"
            mode="contained" 
            onPress={() => navigation.navigate('ClientList')}
            style={styles.quickActionButton}
          >
            View Clients
          </Button>
          <Button 
            icon="cash-plus" 
            mode="contained" 
            onPress={() => alert('Navigate to Add Expense screen')}
            style={styles.quickActionButton}
          >
            Add Expense
          </Button>
        </View>

        <Text style={styles.sectionTitle}>Settings & Management</Text>
        <Button
          icon="account-multiple-plus-outline"
          mode="outlined"
          onPress={() => alert('Open Invite Partner Modal/Screen')}
          style={styles.managementButton}
          labelStyle={styles.managementButtonLabel}
        >
          Invite Partner
        </Button>
        <Button
          icon="logout"
          mode="outlined"
          onPress={handleLogout}
          style={[styles.managementButton, styles.logoutButton]}
          labelStyle={[styles.managementButtonLabel, styles.logoutButtonLabel]}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4.5%'),
    color: '#fff',
  },
  scrollContent: {
    padding: wp('5%'),
    paddingBottom: hp('5%'),
  },
  headerSurface: {
    padding: wp('4%'),
    borderRadius: wp('4%'),
    marginBottom: hp('3%'),
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  avatar: {
    backgroundColor: '#3b5998',
    marginRight: wp('4%'),
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: wp('4%'),
    color: '#666',
    marginBottom: hp('0.5%')
  },
  usernameText: {
    fontSize: wp('5.5%'),
    fontWeight: 'bold',
    color: '#333',
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp('1%'),
    flexWrap: 'wrap',
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7eaf3',
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('5%'),
    marginRight: wp('2%'),
    marginBottom: hp('1%'),
  },
  detailChipText: {
    marginLeft: wp('1.5%'),
    fontSize: wp('3.5%'),
    color: '#3b5998',
    fontWeight: '500',
    maxWidth: wp('35%'),
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: hp('2%'),
    marginBottom: hp('2%'),
    marginLeft: wp('1%'),
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp('2%'),
  },
  kpiCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    alignItems: 'center',
    width: wp('42%'),
    minHeight: hp('12%'),
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#3b5998',
    marginBottom: hp('0.5%'),
  },
  kpiLabel: {
    fontSize: wp('3.8%'),
    color: '#666',
    textAlign: 'center',
  },
  quickActionsContainer: {
  },
  quickActionButton: {
    marginBottom: hp('1.5%'),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
  },
  managementButton: {
    marginTop: hp('1.5%'),
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  managementButtonLabel: {
    color: '#fff',
  },
  logoutButton: {
    borderColor: '#ffadad',
    marginTop: hp('3%'),
  },
  logoutButtonLabel: {
    color: '#ffadad',
  },
});

export default HomeScreen;