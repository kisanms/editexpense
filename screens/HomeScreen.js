import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Platform,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { exportToPDF, exportToExcel } from '../services/exportData';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const OrderItem = ({ order, navigation }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'ongoing': return '#FF9500';
      case 'pending': return '#007AFF';
      default: return '#6e6e73';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.orderItem}
      onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderName} numberOfLines={1}>
          {order.realtorName}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        {order.address && (
          <View style={styles.orderDetail}>
            <Ionicons name="location-outline" size={14} color="#6e6e73" />
            <Text style={styles.orderDetailText} numberOfLines={1}>{order.address}</Text>
          </View>
        )}
        
        <View style={styles.orderFinancials}>
          <View style={styles.orderFinancial}>
            <Text style={styles.orderFinancialLabel}>Charge</Text>
            <Text style={styles.orderFinancialValue}>₹{order.chargeAmount}</Text>
          </View>
          
          <View style={styles.orderFinancial}>
            <Text style={styles.orderFinancialLabel}>Payment</Text>
            <Text style={styles.orderFinancialValue}>₹{order.editorPayment}</Text>
          </View>
          
          <View style={styles.orderFinancial}>
            <Text style={styles.orderFinancialLabel}>Profit</Text>
            <Text style={[
              styles.orderFinancialValue, 
              (order.chargeAmount - order.editorPayment) >= 0 ? styles.profit : styles.loss
            ]}>
              ₹{Math.abs(order.chargeAmount - order.editorPayment)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const { user, organizationData, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const [personalMode, setPersonalMode] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [organizationData]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }
      
      // Determine the query: organization-based or personal
      let ordersQuery;
      
      if (organizationData) {
        // Organization-based: fetch orders for the organization
        ordersQuery = query(
          collection(db, 'orders'),
          where('organizationId', '==', organizationData.id),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      } else {
        // Personal: fetch orders created by this user
        ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      }
      
      const querySnapshot = await getDocs(ordersQuery);
      const ordersList = [];
      
      querySnapshot.forEach((doc) => {
        ordersList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setOrders(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const handleExport = () => {
    Alert.alert(
      'Export Data',
      'Choose export format',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF', onPress: handleExportPDF },
        { text: 'Excel', onPress: handleExportExcel },
      ]
    );
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF(orders);
      Alert.alert('Success', 'PDF exported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel(orders);
      Alert.alert('Success', 'Excel exported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to export Excel');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // No need to navigate, AuthContext will handle it
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={48} color="#d1d1d6" />
      <Text style={styles.emptyStateTitle}>No Orders Found</Text>
      <Text style={styles.emptyStateText}>
        {organizationData 
          ? "Your organization doesn't have any orders yet."
          : "You don't have any orders yet."}
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate('Add Order')}
      >
        <Text style={styles.emptyStateButtonText}>Create New Order</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FFF" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  // Calculate key stats
  const totalCharge = orders.reduce((sum, order) => sum + (order.chargeAmount || 0), 0);
  const totalPayment = orders.reduce((sum, order) => sum + (order.editorPayment || 0), 0);
  const netProfit = totalCharge - totalPayment;
  const ongoing = orders.filter(order => order.status === 'ongoing').length;
  const pending = orders.filter(order => order.status === 'pending').length;
  const completed = orders.filter(order => order.status === 'completed').length;

  // Header Component for FlatList
  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome, {user?.username || 'User'}</Text>
            {organizationData ? (
              <View style={styles.orgContainer}>
                <Ionicons name="business-outline" size={16} color="#6e6e73" />
                <Text style={styles.orgName}>{organizationData.name}</Text>
              </View>
            ) : (
              <View style={styles.personalModeContainer}>
                <Ionicons name="person-outline" size={16} color="#6e6e73" />
                <Text style={styles.personalMode}>Personal Mode</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>₹{totalCharge.toLocaleString('en-IN')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={styles.statValue}>₹{totalPayment.toLocaleString('en-IN')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Profit</Text>
            <Text style={[styles.statValue, netProfit >= 0 ? styles.profit : styles.loss]}>
              ₹{Math.abs(netProfit).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <View style={[styles.statusCard, { backgroundColor: '#007AFF20' }]}>
            <Text style={[styles.statusNumber, { color: '#007AFF' }]}>{pending}</Text>
            <Text style={styles.statusLabel}>Pending</Text>
          </View>
          
          <View style={[styles.statusCard, { backgroundColor: '#FF950020' }]}>
            <Text style={[styles.statusNumber, { color: '#FF9500' }]}>{ongoing}</Text>
            <Text style={styles.statusLabel}>Ongoing</Text>
          </View>
          
          <View style={[styles.statusCard, { backgroundColor: '#34C75920' }]}>
            <Text style={[styles.statusNumber, { color: '#34C759' }]}>{completed}</Text>
            <Text style={styles.statusLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {orders.length > 0 && (
        <View style={styles.recentOrdersHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleExport}
            >
              <Ionicons name="download-outline" size={20} color="#4A6FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Status')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={orders}
        renderItem={({ item }) => <OrderItem order={item} navigation={navigation} />}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={orders.length === 0 ? { flexGrow: 1 } : styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Add Order')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4A6FFF',
    fontWeight: '500',
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  orgContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  orgName: {
    fontSize: 14,
    color: '#6e6e73',
    marginLeft: 4,
  },
  personalModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  personalMode: {
    fontSize: 14,
    color: '#6e6e73',
    marginLeft: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6e6e73',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusCard: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statusNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusLabel: {
    fontSize: 12,
    color: '#6e6e73',
  },
  profit: {
    color: '#34C759',
  },
  loss: {
    color: '#FF3B30',
  },
  recentOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  viewAllButton: {
    backgroundColor: '#4A6FFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  orderItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    gap: 8,
  },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderDetailText: {
    fontSize: 14,
    color: '#6e6e73',
    flex: 1,
  },
  orderFinancials: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderFinancial: {
    alignItems: 'center',
  },
  orderFinancialLabel: {
    fontSize: 12,
    color: '#6e6e73',
    marginBottom: 4,
  },
  orderFinancialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6e6e73',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#4A6FFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#4A6FFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A6FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default HomeScreen;

