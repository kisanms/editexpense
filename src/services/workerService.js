import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export const addWorker = async (workerData) => {
  try {
    const workersRef = collection(db, "workers");
    const newWorker = {
      ...workerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(workersRef, newWorker);
    return { id: docRef.id, ...newWorker };
  } catch (error) {
    console.error("Error adding worker:", error);
    throw error;
  }
};

export const updateWorker = async (workerId, workerData) => {
  try {
    const workerRef = doc(db, "workers", workerId);
    const updatedWorker = {
      ...workerData,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(workerRef, updatedWorker);
    return { id: workerId, ...updatedWorker };
  } catch (error) {
    console.error("Error updating worker:", error);
    throw error;
  }
};

export const getWorkerById = async (workerId) => {
  try {
    if (!workerId) {
      throw new Error("Worker ID is required");
    }
    const workerRef = doc(db, "workers", workerId);
    const workerDoc = await getDoc(workerRef);
    if (workerDoc.exists()) {
      return { id: workerDoc.id, ...workerDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching worker:", error);
    throw error;
  }
};

export const getWorkersByBusiness = async (businessId, filters = {}) => {
  try {
    if (!businessId) {
      throw new Error("Business ID is required");
    }

    const workersRef = collection(db, "workers");
    const queryConstraints = [
      where("businessId", "==", businessId),
      orderBy("createdAt", "desc"),
    ];

    // Add status filter if provided
    if (filters.status) {
      queryConstraints.push(where("status", "==", filters.status));
    }

    // Add role filter if provided
    if (filters.role) {
      queryConstraints.push(where("role", "==", filters.role));
    }

    const q = query(workersRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const workers = [];
    querySnapshot.forEach((doc) => {
      workers.push({ id: doc.id, ...doc.data() });
    });

    return workers;
  } catch (error) {
    console.error("Error fetching workers:", error);
    throw error;
  }
};

export const getActiveWorkersForBusiness = async (businessId) => {
  try {
    if (!businessId) {
      throw new Error("Business ID is required");
    }

    const workersRef = collection(db, "workers");
    const q = query(
      workersRef,
      where("businessId", "==", businessId),
      where("status", "==", "active"),
      orderBy("name", "asc")
    );

    const querySnapshot = await getDocs(q);
    const workers = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      workers.push({
        id: doc.id,
        name: data.name,
        role: data.role,
      });
    });

    return workers;
  } catch (error) {
    console.error("Error fetching active workers:", error);
    throw error;
  }
};
