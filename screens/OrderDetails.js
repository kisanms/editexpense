import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';

const OrderDetails = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      
      if (orderDoc.exists()) {
        setOrder({ id: orderDoc.id, ...orderDoc.data() });
      } else {
        Alert.alert('Error', 'Order not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
      });
      
      setOrder(prev => ({ ...prev, status: newStatus }));
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'ongoing': return '#FF9500';
      case 'pending': return '#007AFF';
      default: return '#6e6e73';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not specified';
    
    if (timestamp.toDate) {
      // Firebase Timestamp
      return timestamp.toDate().toLocaleDateString('en-IN');
    } else if (timestamp.seconds) {
      // Firebase Timestamp object
      return new Date(timestamp.seconds * 1000).toLocaleDateString('en-IN');
    } else {
      // ISO string or other format
      return new Date(timestamp).toLocaleDateString('en-IN');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FFF" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#1c1c1e" />
            </TouchableOpacity>
            <Text style={styles.title}>Order Details</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.statusContainer}>
            <View 
              style={[
                styles.statusBadge, 
                { backgroundColor: getStatusColor(order.status) + '20' }
              ]}
            >
              <Text 
                style={[
                  styles.statusText, 
                  { color: getStatusColor(order.status) }
                ]}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Client Name</Text>
              <Text style={styles.infoValue}>{order.realtorName || 'Not specified'}</Text>
            </View>
          </View>

          {order.address && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{order.address}</Text>
              </View>
            </View>
          )}

          {order.email && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{order.email}</Text>
              </View>
            </View>
          )}

          {order.contactNo && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoValue}>{order.contactNo}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          
          {order.editorName && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Editor Name</Text>
                <Text style={styles.infoValue}>{order.editorName}</Text>
              </View>
            </View>
          )}

          {order.deliveryDate && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Delivery Date</Text>
                <Text style={styles.infoValue}>{order.deliveryDate}</Text>
              </View>
            </View>
          )}

          {order.createdAt && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Created On</Text>
                <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.financialsSection}>
          <Text style={styles.sectionTitle}>Financial Details</Text>
          
          <View style={styles.financialsContainer}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Client Charge</Text>
              <Text style={styles.financialValue}>₹{order.chargeAmount}</Text>
            </View>
            
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Editor Payment</Text>
              <Text style={styles.financialValue}>₹{order.editorPayment}</Text>
            </View>
            
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Profit</Text>
              <Text 
                style={[
                  styles.financialValue, 
                  (order.chargeAmount - order.editorPayment) >= 0 
                    ? styles.profit 
                    : styles.loss
                ]}
              >
                ₹{Math.abs(order.chargeAmount - order.editorPayment)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[
                styles.statusButton, 
                { backgroundColor: '#007AFF20' },
                order.status === 'pending' && styles.activeButton
              ]}
              onPress={() => updateOrderStatus('pending')}
              disabled={order.status === 'pending' || updating}
            >
              <Text 
                style={[
                  styles.statusButtonText, 
                  { color: '#007AFF' },
                  order.status === 'pending' && styles.activeButtonText
                ]}
              >
                Pending
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.statusButton, 
                { backgroundColor: '#FF950020' },
                order.status === 'ongoing' && styles.activeButton
              ]}
              onPress={() => updateOrderStatus('ongoing')}
              disabled={order.status === 'ongoing' || updating}
            >
              <Text 
                style={[
                  styles.statusButtonText, 
                  { color: '#FF9500' },
                  order.status === 'ongoing' && styles.activeButtonText
                ]}
              >
                Ongoing
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.statusButton, 
                { backgroundColor: '#34C75920' },
                order.status === 'completed' && styles.activeButton
              ]}
              onPress={() => updateOrderStatus('completed')}
              disabled={order.status === 'completed' || updating}
            >
              <Text 
                style={[
                  styles.statusButtonText, 
                  { color: '#34C759' },
                  order.status === 'completed' && styles.activeButtonText
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4A6FFF',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  placeholder: {
    width: 32,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6e6e73',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1c1c1e',
    fontWeight: '500',
  },
  financialsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  financialsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialItem: {
    alignItems: 'center',
    flex: 1,
  },
  financialLabel: {
    fontSize: 14,
    color: '#6e6e73',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  profit: {
    color: '#34C759',
  },
  loss: {
    color: '#FF3B30',
  },
  actionsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeButton: {
    opacity: 0.5,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeButtonText: {
    opacity: 0.5,
  },
});

export default OrderDetails; 