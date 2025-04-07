import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const ordersCollection = collection(db, 'orders');

/**
 * Adds a new order document to Firestore.
 * @param {object} orderData - Data for the new order.
 * @param {string} businessId - The ID of the business this order belongs to.
 * @param {string} userId - The UID of the user creating the order.
 * @returns {Promise<string>} The ID of the newly created order document.
 */
export const addOrder = async (orderData, businessId, userId) => {
  if (!businessId || !userId || !orderData.clientId || !orderData.clientNameSnapshot) {
    throw new Error('Business ID, User ID, Client ID, and Client Name Snapshot are required to add an order.');
  }
  try {
    const docRef = await addDoc(ordersCollection, {
      ...orderData,
      businessId: businessId,
      createdByUid: userId,
      orderDate: orderData.orderDate || serverTimestamp(), // Default order date to now if not provided
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: orderData.status || 'pending', // Default status
      // Ensure optional fields are handled appropriately (e.g., assignedWorkerId: null)
      assignedWorkerId: orderData.assignedWorkerId || null,
      workerNameSnapshot: orderData.workerNameSnapshot || null,
      deadline: orderData.deadline || null,
      pricing: orderData.pricing || null,
    });
    console.log('Order added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw new Error('Failed to add order. Please try again.');
  }
};

/**
 * Updates an existing order document in Firestore.
 * @param {string} orderId - The ID of the order document to update.
 * @param {object} orderData - Data to update.
 * @returns {Promise<void>}
 */
export const updateOrder = async (orderId, orderData) => {
  if (!orderId) {
    throw new Error('Order ID is required to update an order.');
  }
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: serverTimestamp(), // Update the timestamp
    });
    console.log('Order updated with ID:', orderId);
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error('Failed to update order. Please try again.');
  }
};

/**
 * Fetches a single order document from Firestore.
 * @param {string} orderId - The ID of the order document to fetch.
 * @returns {Promise<object|null>} Order data object or null if not found.
 */
export const getOrderById = async (orderId) => {
  if (!orderId) {
    throw new Error('Order ID is required to fetch an order.');
  }
  try {
    const orderRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(orderRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No such order document!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    throw new Error('Failed to fetch order data.');
  }
};

/**
 * Fetches orders for a specific client.
 * @param {string} businessId 
 * @param {string} clientId 
 * @returns {Promise<Array<object>>} Array of order objects.
 */
export const getOrdersByClient = async (businessId, clientId) => {
    if (!businessId || !clientId) {
        throw new Error('Business ID and Client ID are required.');
    }
    try {
        const q = query(
            ordersCollection,
            where("businessId", "==", businessId),
            where("clientId", "==", clientId),
            orderBy("orderDate", "desc") // Or createdAt
        );
        const querySnapshot = await getDocs(q);
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        return orders;
    } catch (error) {
        console.error('Error fetching orders by client:', error);
        throw new Error('Failed to fetch client orders.');
    }
}; 