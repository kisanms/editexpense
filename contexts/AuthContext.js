import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [organizationData, setOrganizationData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data() || {};
        
        // Fetch organization data if user belongs to one
        if (userData.organizationId) {
          const orgDoc = await getDoc(doc(db, 'organizations', userData.organizationId));
          if (orgDoc.exists()) {
            setOrganizationData({ id: orgDoc.id, ...orgDoc.data() });
          }
        }
        
        setUser({ ...user, ...userData });
      } else {
        setUser(null);
        setOrganizationData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const createOrganization = async (orgName, userEmail) => {
    try {
      // Create organization
      const orgRef = doc(collection(db, 'organizations'));
      const now = new Date().toISOString();
      
      await setDoc(orgRef, {
        name: orgName,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        members: [{
          uid: user.uid,
          email: userEmail,
          role: 'admin',
          joinedAt: now  // Using ISO string instead of serverTimestamp
        }],
        pendingInvites: []
      });

      // Update user with organization reference
      await setDoc(doc(db, 'users', user.uid), {
        organizationId: orgRef.id,
        role: 'admin',
        name: user.displayName || userEmail.split('@')[0],
        email: userEmail,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update local state
      const orgDoc = await getDoc(orgRef);
      setOrganizationData({ id: orgRef.id, ...orgDoc.data() });
      
      return orgRef.id;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  const inviteMember = async (email) => {
    try {
      if (!organizationData) throw new Error('No organization found');

      // Check if user is already a member
      const memberExists = organizationData.members.some(member => member.email === email);
      if (memberExists) {
        throw new Error('User is already a member');
      }

      // Check if invitation already exists
      const inviteExists = organizationData.pendingInvites.includes(email);
      if (inviteExists) {
        throw new Error('Invitation already sent');
      }

      // Add to pending invites
      const orgRef = doc(db, 'organizations', organizationData.id);
      await setDoc(orgRef, {
        pendingInvites: [...organizationData.pendingInvites, email]
      }, { merge: true });

      // Create invitation record
      await setDoc(doc(collection(db, 'invitations')), {
        email,
        organizationId: organizationData.id,
        organizationName: organizationData.name,
        invitedBy: user.uid,
        invitedByEmail: user.email,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Update local state
      setOrganizationData(prev => ({
        ...prev,
        pendingInvites: [...prev.pendingInvites, email]
      }));

      return true;
    } catch (error) {
      console.error('Error inviting member:', error);
      throw error;
    }
  };

  const declineInvitation = async (invitationId, email) => {
    try {
      // Update invitation status
      await setDoc(doc(db, 'invitations', invitationId), {
        status: 'declined',
        declinedAt: serverTimestamp()
      }, { merge: true });

      // Remove from organization's pending invites
      const invitesQuery = query(
        collection(db, 'organizations'),
        where('pendingInvites', 'array-contains', email)
      );
      
      const orgsSnapshot = await getDocs(invitesQuery);
      for (const orgDoc of orgsSnapshot.docs) {
        await setDoc(doc(db, 'organizations', orgDoc.id), {
          pendingInvites: orgDoc.data().pendingInvites.filter(e => e !== email)
        }, { merge: true });
      }

      return true;
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user document to check organization
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data() || {};
      
      // If user is already in an organization, no need to check invitations
      if (userData.organizationId) {
        // Fetch organization data
        const orgDoc = await getDoc(doc(db, 'organizations', userData.organizationId));
        if (orgDoc.exists()) {
          setOrganizationData({ id: orgDoc.id, ...orgDoc.data() });
        }
        
        return user;
      }
      
      // Check for pending invitations
      const invitesQuery = query(
        collection(db, 'invitations'),
        where('email', '==', email),
        where('status', '==', 'pending')
      );
      
      const invitesSnapshot = await getDocs(invitesQuery);
      if (!invitesSnapshot.empty) {
        const invite = invitesSnapshot.docs[0].data();
        
        // Fetch organization details to show in alert
        const orgDoc = await getDoc(doc(db, 'organizations', invite.organizationId));
        const orgName = orgDoc.exists() ? orgDoc.data().name : 'an organization';
        
        Alert.alert(
          'Team Invitation',
          `You've been invited to join "${orgName}" as a team member. Would you like to accept?`,
          [
            {
              text: 'Decline',
              style: 'cancel',
              onPress: () => declineInvitation(invitesSnapshot.docs[0].id, email)
            },
            {
              text: 'Accept',
              onPress: async () => {
                try {
                  const orgRef = doc(db, 'organizations', invite.organizationId);
                  const orgDoc = await getDoc(orgRef);
                  const orgData = orgDoc.data();
                  const now = new Date().toISOString();

                  // Add user to organization members
                  await setDoc(orgRef, {
                    members: [...orgData.members, {
                      uid: user.uid,
                      email: user.email,
                      role: 'member',
                      joinedAt: now  // Using ISO string instead of serverTimestamp
                    }],
                    pendingInvites: orgData.pendingInvites.filter(e => e !== user.email)
                  }, { merge: true });

                  // Update user's organization reference
                  await setDoc(doc(db, 'users', user.uid), {
                    organizationId: invite.organizationId,
                    role: 'member',
                    name: user.displayName || email.split('@')[0],
                    email: user.email,
                    updatedAt: serverTimestamp()
                  }, { merge: true });

                  // Update invitation status
                  await setDoc(doc(db, 'invitations', invitesSnapshot.docs[0].id), {
                    status: 'accepted',
                    acceptedAt: serverTimestamp()
                  }, { merge: true });

                  // Fetch updated organization data
                  const updatedOrgDoc = await getDoc(orgRef);
                  setOrganizationData({ id: orgRef.id, ...updatedOrgDoc.data() });
                  
                  Alert.alert('Success', `You've successfully joined "${orgName}" as a team member.`);
                } catch (error) {
                  console.error('Error accepting invitation:', error);
                  Alert.alert('Error', 'Failed to accept invitation');
                }
              }
            }
          ]
        );
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
        // No organization yet
      });
      
      // Check for pending invitations
      const invitesQuery = query(
        collection(db, 'invitations'),
        where('email', '==', email),
        where('status', '==', 'pending')
      );
      
      const invitesSnapshot = await getDocs(invitesQuery);
      if (!invitesSnapshot.empty) {
        const invite = invitesSnapshot.docs[0].data();
        
        // Fetch organization details to show in alert
        const orgDoc = await getDoc(doc(db, 'organizations', invite.organizationId));
        const orgName = orgDoc.exists() ? orgDoc.data().name : 'an organization';
        
        Alert.alert(
          'Team Invitation Found',
          `You've been invited to join "${orgName}" as a team member. Would you like to accept?`,
          [
            {
              text: 'Decide Later',
              style: 'cancel'
            },
            {
              text: 'Accept',
              onPress: async () => {
                try {
                  const orgRef = doc(db, 'organizations', invite.organizationId);
                  const orgDoc = await getDoc(orgRef);
                  const orgData = orgDoc.data();
                  const now = new Date().toISOString();

                  // Add user to organization members
                  await setDoc(orgRef, {
                    members: [...orgData.members, {
                      uid: user.uid,
                      email: user.email,
                      role: 'member',
                      joinedAt: now
                    }],
                    pendingInvites: orgData.pendingInvites.filter(e => e !== user.email)
                  }, { merge: true });

                  // Update user's organization reference
                  await setDoc(doc(db, 'users', user.uid), {
                    organizationId: invite.organizationId,
                    role: 'member',
                    name: user.displayName || email.split('@')[0],
                    email: user.email,
                    updatedAt: serverTimestamp()
                  }, { merge: true });

                  // Update invitation status
                  await setDoc(doc(db, 'invitations', invitesSnapshot.docs[0].id), {
                    status: 'accepted',
                    acceptedAt: serverTimestamp()
                  }, { merge: true });

                  // Fetch updated organization data
                  const updatedOrgDoc = await getDoc(orgRef);
                  setOrganizationData({ id: orgRef.id, ...updatedOrgDoc.data() });
                  
                  Alert.alert('Success', `You've successfully joined "${orgName}" as a team member.`);
                } catch (error) {
                  console.error('Error accepting invitation:', error);
                  Alert.alert('Error', 'Failed to accept invitation');
                }
              }
            }
          ]
        );
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    organizationData,
    login,
    register,
    logout,
    createOrganization,
    inviteMember,
    declineInvitation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 