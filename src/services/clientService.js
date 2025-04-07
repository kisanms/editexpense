import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const clientsCollection = collection(db, 'clients');

/**
 * Adds a new client document to Firestore.
 * @param {object} clientData - Data for the new client (excluding timestamps).
 * @param {string} businessId - The ID of the business this client belongs to.
 * @param {string} userId - The UID of the user creating the client.
 * @returns {Promise<string>} The ID of the newly created client document.
 */
export const addClient = async (clientData, businessId, userId) => {
  if (!businessId || !userId) {
    throw new Error('Business ID and User ID are required to add a client.');
  }
  try {
    const docRef = await addDoc(clientsCollection, {
      ...clientData,
      businessId: businessId,
      createdByUid: userId,
      createdAt: serverTimestamp(), // Use server timestamp for creation
      updatedAt: serverTimestamp(), // Also set updatedAt on creation
      status: clientData.status || 'active', // Default status
      // Ensure other potentially missing fields are handled if needed (e.g., communicationHistory: [])
    });
    console.log('Client added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding client:', error);
    throw new Error('Failed to add client. Please try again.');
  }
};

/**
 * Updates an existing client document in Firestore.
 * @param {string} clientId - The ID of the client document to update.
 * @param {object} clientData - Data to update.
 * @returns {Promise<void>}
 */
export const updateClient = async (clientId, clientData) => {
  if (!clientId) {
    throw new Error('Client ID is required to update a client.');
  }
  try {
    const clientRef = doc(db, 'clients', clientId);
    await updateDoc(clientRef, {
      ...clientData,
      updatedAt: serverTimestamp(), // Update the timestamp
    });
    console.log('Client updated with ID:', clientId);
  } catch (error) {
    console.error('Error updating client:', error);
    throw new Error('Failed to update client. Please try again.');
  }
};

/**
 * Fetches a single client document from Firestore.
 * @param {string} clientId - The ID of the client document to fetch.
 * @returns {Promise<object|null>} Client data object or null if not found.
 */
export const getClientById = async (clientId) => {
  if (!clientId) {
    throw new Error('Client ID is required to fetch a client.');
  }
  try {
    const clientRef = doc(db, 'clients', clientId);
    const docSnap = await getDoc(clientRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No such client document!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching client:', error);
    throw new Error('Failed to fetch client data.');
  }
};

/**
 * Fetches all active clients for a given business, primarily for selection lists.
 * @param {string} businessId - The ID of the business.
 * @returns {Promise<Array<{id: string, name: string}>>} Array of client objects with id and name.
 */
export const getActiveClientsForBusiness = async (businessId) => {
  if (!businessId) {
    throw new Error('Business ID is required to fetch clients.');
  }
  try {
    const q = query(
      clientsCollection,
      where("businessId", "==", businessId),
      where("status", "==", "active"), // Only fetch active clients for new orders
      orderBy("name", "asc")
    );
    const querySnapshot = await getDocs(q);
    const clients = [];
    querySnapshot.forEach((doc) => {
      clients.push({ id: doc.id, name: doc.data().name }); // Only return id and name
    });
    return clients;
  } catch (error) {
    console.error('Error fetching active clients for business:', error);
    throw new Error('Failed to fetch clients.');
  }
}; 