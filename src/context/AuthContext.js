import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, onAuthStateChanged, signOut, 
  createUserWithEmailAndPassword, updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { auth, app, db } from '../config/firebase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const profile = userDoc.data();
      setUserProfile(profile);
      const businessMemberDoc = await getDoc(doc(db, 'businessMembers', uid));
      if (businessMemberDoc.exists()) {
        const businessId = businessMemberDoc.data().businessId;
        const businessDoc = await getDoc(doc(db, 'businesses', businessId));
        setBusinessDetails(businessDoc.exists() ? businessDoc.data() : null);
      }
      return profile;
    }
    return null;
  };

  const fetchBusinessDetails = async (businessId) => {
    if (!businessId) return null;
    try {
      const businessDoc = await getDoc(doc(db, 'businesses', businessId));
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
      const businessesRef = collection(db, 'businesses');
      const q = query(businessesRef, limit(1));
      const querySnapshot = await getDocs(q);
      const isFirstBusiness = querySnapshot.empty;

      let newUser;
      let businessIdToAssign;
      let newUserProfileData;
      let newBusinessData = null;

      if (isFirstBusiness) {
        console.log('First user registration: Creating new business...');
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        newUser = userCredential.user;
        businessIdToAssign = newUser.uid;

        const businessRef = doc(db, 'businesses', businessIdToAssign);
        newBusinessData = {
          businessName: `${username}'s Business`,
          createdAt: Timestamp.now(),
          ownerUids: [newUser.uid],
          invitationKeys: {},
        };
        await setDoc(businessRef, newBusinessData);
        console.log('Business document created with ID:', businessIdToAssign);

        newUserProfileData = {
          uid: newUser.uid,
          email,
          username,
          role: 'owner',
          businessId: businessIdToAssign,
          createdAt: Timestamp.now(),
          lastLogin: Timestamp.now(),
        };

      } else {
        console.log('Business already exists. Direct registration blocked.');
        throw new Error('Registration failed: A business already exists. Please join via invitation.');
      }
      
      await updateProfile(newUser, { displayName: username });
      await setDoc(doc(db, 'users', newUser.uid), newUserProfileData);
      console.log('User document created for:', newUser.uid);

      setUser(newUser);
      setUserProfile(newUserProfileData);
      if (newBusinessData) {
        setBusinessDetails(newBusinessData);
      }
      
      return newUser;

    } catch (error) {
      console.error("Registration Error:", error);
      if (userCredential?.user && error.message !== 'Registration failed: A business already exists. Please join via invitation.') {
        try { await userCredential.user.delete(); console.log("Cleaned up auth user after registration failure."); } catch (deleteError) { console.error("Failed to clean up auth user:", deleteError); }
      }
      setError(error.message || 'Registration failed. Please try again.');
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

  const invitePartner = async (partnerEmail) => {
    if (!businessDetails) throw new Error('No business associated');
    const token = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await setDoc(doc(db, 'invitations', token), {
      token,
      businessId: businessDetails.businessId,
      email: partnerEmail,
      expiresAt
    });
    return token;
  };

  const joinBusiness = async (token, email, password, username) => {
    const inviteDoc = await getDoc(doc(db, 'invitations', token));
    if (!inviteDoc.exists() || new Date(inviteDoc.data().expiresAt) < new Date()) {
      throw new Error('Invalid or expired invitation');
    }
    const { businessId } = inviteDoc.data();

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: username });

    const userProfile = { userId: user.uid, email, name: username, businessId };
    await setDoc(doc(db, 'users', user.uid), userProfile);
    await setDoc(doc(db, 'businessMembers', user.uid), { userId: user.uid, businessId, role: 'owner' });

    setUser(user);
    setUserProfile(userProfile);
    const businessDoc = await getDoc(doc(db, 'businesses', businessId));
    setBusinessDetails(businessDoc.data());
    return user;
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      businessDetails,
      loading,
      error,
      login,
      register,
      logout,
      invitePartner,
      joinBusiness
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};