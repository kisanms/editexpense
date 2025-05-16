import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const profile = userDoc.data();
      setUserProfile(profile);
      return profile;
    }
    return null;
  };

  const fetchBusinessDetails = async (businessId) => {
    if (!businessId) return null;
    try {
      const businessDoc = await getDoc(doc(db, "businesses", businessId));
      if (businessDoc.exists()) {
        setBusinessDetails(businessDoc.data());
        return businessDoc.data();
      }
      console.warn("Business document not found for ID:", businessId);
      return null;
    } catch (error) {
      console.error("Error fetching business details:", error);
      setError("Could not load business details.");
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setError(null);
      if (user) {
        try {
          const profile = await fetchUserProfile(user.uid);
          if (profile?.businessId) {
            await fetchBusinessDetails(profile.businessId);
          } else {
            console.warn("User profile loaded but has no businessId.");
            setBusinessDetails(null);
          }
          setUser(user);
        } catch (fetchError) {
          console.error("Error fetching profile or business data:", fetchError);
          setError("Failed to load user data.");
          setUser(null);
          setUserProfile(null);
          setBusinessDetails(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setBusinessDetails(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const profile = await fetchUserProfile(userCredential.user.uid);
      if (profile?.businessId) {
        await fetchBusinessDetails(profile.businessId);
      }
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      setError(error.message);
      setBusinessDetails(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, username) => {
    setLoading(true);
    setError(null);
    let userCredential = null;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser = userCredential.user;
      const businessIdToAssign = newUser.uid;

      const businessRef = doc(db, "businesses", businessIdToAssign);
      const newBusinessData = {
        businessName: `${username}'s Business`,
        createdAt: Timestamp.now(),
        ownerUids: [newUser.uid],
      };
      await setDoc(businessRef, newBusinessData);
      console.log("Business document created with ID:", businessIdToAssign);

      const newUserProfileData = {
        uid: newUser.uid,
        email,
        username,
        role: "owner",
        businessId: businessIdToAssign,
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
      };

      await updateProfile(newUser, { displayName: username });
      await setDoc(doc(db, "users", newUser.uid), newUserProfileData);
      console.log("User document created for:", newUser.uid);

      setUser(newUser);
      setUserProfile(newUserProfileData);
      setBusinessDetails(newBusinessData);

      return newUser;
    } catch (error) {
      console.error("Registration Error:", error);
      if (userCredential?.user) {
        try {
          await userCredential.user.delete();
          console.log("Cleaned up auth user after registration failure.");
        } catch (deleteError) {
          console.error("Failed to clean up auth user:", deleteError);
        }
      }
      setError(error.message || "Registration failed. Please try again.");
      setUserProfile(null);
      setBusinessDetails(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setBusinessDetails(null);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        businessDetails,
        loading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
