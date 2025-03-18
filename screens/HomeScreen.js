import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import OrderList from '../components/OrderList';
import { exportToPDF, exportToExcel } from '../services/exportData';

const HomeScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      navigation.replace('Login');
      return;
    }

    // Subscribe to orders for the current user
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      }));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [navigation]);

  const handleExportPDF = async () => {
    try {
      await exportToPDF(orders);
    } catch (error) {
      Alert.alert('Error', 'Failed to export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel(orders);
    } catch (error) {
      Alert.alert('Error', 'Failed to export Excel');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const totalCharge = orders.reduce((sum, order) => sum + (order.chargeAmount || 0), 0);
  const totalPayment = orders.reduce((sum, order) => sum + (order.editorPayment || 0), 0);
  const netProfit = totalCharge - totalPayment;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Charge</Text>
            <Text style={styles.statValue}>₹{totalCharge}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Payment</Text>
            <Text style={styles.statValue}>₹{totalPayment}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Net Profit</Text>
            <Text style={[styles.statValue, netProfit >= 0 ? styles.profit : styles.loss]}>
              ₹{netProfit}
            </Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
            <Text style={styles.buttonText}>Export PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportExcel}>
            <Text style={styles.buttonText}>Export Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      <OrderList orders={orders} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  profit: {
    color: '#34C759',
  },
  loss: {
    color: '#FF3B30',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
