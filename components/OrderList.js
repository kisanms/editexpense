import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS = {
  ongoing: '#4A6FFF',
  pending: '#FF9500',
  completed: '#34C759',
};

const OrderList = ({ orders, showStatus = true }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

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

  const handleStatusChange = async (newStatus) => {
    try {
      if (!selectedOrder) return;

      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: newStatus,
        updatedAt: new Date(),
      });

      setStatusModalVisible(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ongoing':
        return 'time-outline';
      case 'pending':
        return 'hourglass-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const renderStatusBadge = (status) => (
    <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[status]}15` }]}>
      <Ionicons 
        name={getStatusIcon(status)} 
        size={16} 
        color={STATUS_COLORS[status]} 
        style={styles.statusIcon} 
      />
      <Text style={[styles.statusText, { color: STATUS_COLORS[status] }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => {
        if (showStatus) {
          setSelectedOrder(item);
          setStatusModalVisible(true);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.realtorName}>{item.realtorName}</Text>
          {item.editorName && (
            <Text style={styles.editorName}>Editor: {item.editorName}</Text>
          )}
        </View>
        <View style={styles.orderHeaderRight}>
          {renderStatusBadge(item.status || 'pending')}
          <TouchableOpacity 
            onPress={() => handleDelete(item)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.orderDetails}>
        {item.address && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6e6e73" />
            <Text style={styles.detailText}>{item.address}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#6e6e73" />
          <Text style={styles.detailText}>Charge: ₹{item.chargeAmount.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="wallet-outline" size={16} color="#6e6e73" />
          <Text style={styles.detailText}>Payment: ₹{item.editorPayment.toLocaleString('en-IN')}</Text>
        </View>
        {item.deliveryDate && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6e6e73" />
            <Text style={styles.detailText}>Delivery: {item.deliveryDate}</Text>
          </View>
        )}
        {item.email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#6e6e73" />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>
        )}
        {item.contactNo && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#6e6e73" />
            <Text style={styles.detailText}>{item.contactNo}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color="#6e6e73" />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6e6e73" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.statusOption, { backgroundColor: `${STATUS_COLORS.ongoing}15` }]}
              onPress={() => handleStatusChange('ongoing')}
            >
              <Ionicons name="time-outline" size={24} color={STATUS_COLORS.ongoing} />
              <Text style={[styles.statusOptionText, { color: STATUS_COLORS.ongoing }]}>Ongoing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, { backgroundColor: `${STATUS_COLORS.pending}15` }]}
              onPress={() => handleStatusChange('pending')}
            >
              <Ionicons name="hourglass-outline" size={24} color={STATUS_COLORS.pending} />
              <Text style={[styles.statusOptionText, { color: STATUS_COLORS.pending }]}>Pending</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, { backgroundColor: `${STATUS_COLORS.completed}15` }]}
              onPress={() => handleStatusChange('completed')}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color={STATUS_COLORS.completed} />
              <Text style={[styles.statusOptionText, { color: STATUS_COLORS.completed }]}>Completed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  realtorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  editorName: {
    fontSize: 14,
    color: '#6e6e73',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  orderDetails: {
    padding: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#1c1c1e',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6e6e73',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default OrderList;
