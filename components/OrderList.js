import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';

const OrderList = ({ orders }) => {
  const handleDelete = async (order) => {
    try {
      Alert.alert(
        'Delete Order',
        'Are you sure you want to delete this order?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              // Delete from Firestore
              await deleteDoc(doc(db, 'orders', order.id));
              Alert.alert('Success', 'Order deleted successfully');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting order:', error);
      Alert.alert('Error', 'Failed to delete order');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.realtorName}>{item.realtorName}</Text>
        <TouchableOpacity onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      <View style={styles.orderDetails}>
        <Text style={styles.detailText}>Address: {item.address}</Text>
        <Text style={styles.detailText}>Charge: ₹{item.chargeAmount}</Text>
        <Text style={styles.detailText}>Editor Payment: ₹{item.editorPayment}</Text>
        <Text style={styles.detailText}>Delivery Date: {item.deliveryDate}</Text>
        <Text style={styles.detailText}>Email: {item.email}</Text>
        <Text style={styles.detailText}>Contact: {item.contactNo}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No orders found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  realtorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  orderDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});

export default OrderList;
