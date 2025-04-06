import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setUser({ ...user, ...userDoc.data() });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email, password, username, role, organizationKey = null) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (role === 'admin') {
        // Create new organization
        const organizationRef = doc(db, 'organizations', user.uid);
        const invitationKey = Math.random().toString(36).substring(2, 15);
        
        await setDoc(organizationRef, {
          name: `${username}'s Organization`,
          adminId: user.uid,
          partners: [],
          createdAt: new Date(),
          invitationKey
        });

        // Create user document
        await setDoc(doc(db, 'users', user.uid), {
          email,
          username,
          role,
          organizationId: user.uid,
          createdAt: new Date(),
          lastLogin: new Date()
        });
      } else {
        // Partner registration
        if (!organizationKey) throw new Error('Organization key is required for partners');
        
        const organizationsRef = doc(db, 'organizations', organizationKey);
        const orgDoc = await getDoc(organizationsRef);
        
        if (!orgDoc.exists()) throw new Error('Invalid organization key');
        
        const organization = orgDoc.data();
        await setDoc(doc(db, 'users', user.uid), {
          email,
          username,
          role,
          organizationId: organizationKey,
          createdAt: new Date(),
          lastLogin: new Date()
        });

        // Add partner to organization
        await setDoc(organizationsRef, {
          ...organization,
          partners: [...organization.partners, user.uid]
        }, { merge: true });
      }

      return user;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 