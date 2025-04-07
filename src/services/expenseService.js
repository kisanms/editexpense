import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";

const expensesCollection = collection(db, "expenses");

/**
 * Adds a new expense document to Firestore.
 * @param {object} expenseData - Data for the new expense.
 * @param {string} businessId - The ID of the business this expense belongs to.
 * @param {string} userId - The UID of the user creating the expense.
 * @returns {Promise<string>} The ID of the newly created expense document.
 */
export const addExpense = async (expenseData, businessId, userId) => {
  if (!businessId || !userId) {
    throw new Error("Business ID and User ID are required to add an expense.");
  }
  try {
    const docRef = await addDoc(expensesCollection, {
      ...expenseData,
      businessId: businessId,
      createdByUid: userId,
      expenseDate: expenseData.expenseDate || serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: expenseData.status || "pending", // Default status
      // Ensure optional fields are handled appropriately
      receiptUrl: expenseData.receiptUrl || null,
      notes: expenseData.notes || null,
      category: expenseData.category || "uncategorized",
    });
    console.log("Expense added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding expense:", error);
    throw new Error("Failed to add expense. Please try again.");
  }
};

/**
 * Updates an existing expense document in Firestore.
 * @param {string} expenseId - The ID of the expense document to update.
 * @param {object} expenseData - Data to update.
 * @returns {Promise<void>}
 */
export const updateExpense = async (expenseId, expenseData) => {
  if (!expenseId) {
    throw new Error("Expense ID is required to update an expense.");
  }
  try {
    const expenseRef = doc(db, "expenses", expenseId);
    await updateDoc(expenseRef, {
      ...expenseData,
      updatedAt: serverTimestamp(),
    });
    console.log("Expense updated with ID:", expenseId);
  } catch (error) {
    console.error("Error updating expense:", error);
    throw new Error("Failed to update expense. Please try again.");
  }
};

/**
 * Fetches a single expense document from Firestore.
 * @param {string} expenseId - The ID of the expense document to fetch.
 * @returns {Promise<object|null>} Expense data object or null if not found.
 */
export const getExpenseById = async (expenseId) => {
  if (!expenseId) {
    throw new Error("Expense ID is required to fetch an expense.");
  }
  try {
    const expenseRef = doc(db, "expenses", expenseId);
    const docSnap = await getDoc(expenseRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log("No such expense document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching expense:", error);
    throw new Error("Failed to fetch expense data.");
  }
};

/**
 * Fetches expenses for a specific business with optional filters.
 * @param {string} businessId - The ID of the business.
 * @param {object} filters - Optional filters (status, category, dateRange)
 * @returns {Promise<Array<object>>} Array of expense objects.
 */
export const getExpensesForBusiness = async (businessId, filters = {}) => {
  if (!businessId) {
    throw new Error("Business ID is required to fetch expenses.");
  }
  try {
    const queryConstraints = [
      where("businessId", "==", businessId),
      orderBy("expenseDate", "desc"),
    ];

    // Add status filter if provided
    if (filters.status) {
      queryConstraints.push(where("status", "==", filters.status));
    }

    // Add category filter if provided
    if (filters.category) {
      queryConstraints.push(where("category", "==", filters.category));
    }

    // Add date range filter if provided
    if (filters.startDate && filters.endDate) {
      queryConstraints.push(
        where("expenseDate", ">=", filters.startDate),
        where("expenseDate", "<=", filters.endDate)
      );
    }

    const q = query(expensesCollection, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    const expenses = [];
    querySnapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() });
    });
    return expenses;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw new Error("Failed to fetch expenses.");
  }
};
