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
  addDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [organizationData, setOrganizationData] = useState(null);

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log("Auth state changed:", authUser?.email);
      setLoading(true);
      
      try {
        if (authUser) {
          // Start with base authUser data
          let mergedUserData = { ...authUser };
          
          // Fetch user data from Firestore
          const userDocRef = doc(db, 'users', authUser.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data() || {};
          console.log("User data from Firestore:", userData);
          
          // Merge user data
          mergedUserData = { ...mergedUserData, ...userData };
          
          // Fetch organization data if user belongs to one
          if (userData.organizationId) {
            console.log("User has organization ID:", userData.organizationId);
            const orgRef = doc(db, 'organizations', userData.organizationId);
            const orgDoc = await getDoc(orgRef);
            if (orgDoc.exists()) {
              const orgData = { id: orgRef.id, ...orgDoc.data() };
              console.log("Organization data loaded:", orgData.name);
              setOrganizationData(orgData);
              
              // Make sure the user object has consistent organization data
              mergedUserData.organizationId = userData.organizationId;
              mergedUserData.role = userData.role || 'member';
            } else {
              console.log("Organization document not found even though user has organizationId");
              // Clear inconsistent organization reference
              await setDoc(userDocRef, { organizationId: null }, { merge: true });
              setOrganizationData(null);
            }
          } else {
            console.log("User has no organization");
            setOrganizationData(null);
          }
          
          // Set the fully merged user data to state
          console.log("Setting merged user data:", mergedUserData.email, "organizationId:", mergedUserData.organizationId);
          setUser(mergedUserData);
        } else {
          console.log("No authenticated user");
          setUser(null);
          setOrganizationData(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const logActivity = async (action, details) => {
    try {
      if (!user?.organizationId) return;

      const activityRef = collection(db, 'organizations', user.organizationId, 'activities');
      await addDoc(activityRef, {
        userId: user.uid,
        userEmail: user.email,
        action,
        details,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const updateUserPermissions = async (targetUserId, newPermissions) => {
    try {
      // Only main admin can update permissions
      if (!user.isMainAdmin) {
        throw new Error('Only the main administrator can update permissions');
      }

      const orgRef = doc(db, 'organizations', user.organizationId);
      const orgDoc = await getDoc(orgRef);
      
      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }

      const orgData = orgDoc.data();
      
      // Update member permissions
      const updatedMembers = orgData.members.map(member => {
        if (member.uid === targetUserId) {
          return { ...member, permissions: newPermissions };
        }
        return member;
      });

      // Update organization document
      await setDoc(orgRef, { 
        members: updatedMembers 
      }, { merge: true });

      // Update user's permissions document
      await setDoc(doc(db, 'users', targetUserId), {
        permissions: newPermissions,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Log the activity
      await logActivity('update_permissions', {
        targetUser: targetUserId,
        oldPermissions: orgData.members.find(m => m.uid === targetUserId)?.permissions || [],
        newPermissions
      });

      return true;
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  };

  const assignEditorTask = async (editorId, task) => {
    try {
      if (!user.permissions?.includes('admin')) {
        throw new Error('Only admins can assign tasks');
      }

      const taskRef = collection(db, 'organizations', user.organizationId, 'editorTasks');
      const taskDoc = await addDoc(taskRef, {
        editorId,
        ...task,
        status: 'assigned',
        assignedBy: user.uid,
        assignedAt: serverTimestamp(),
      });

      // Log the activity
      await logActivity('assign_task', {
        editorId,
        taskId: taskDoc.id,
        taskTitle: task.title
      });

      return taskDoc.id;
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  };

  const createOrganization = async (name) => {
    try {
      const orgRef = doc(collection(db, 'organizations'));
      
      // Create organization with creator as main admin
      await setDoc(orgRef, {
        name,
        createdAt: serverTimestamp(),
        members: [{
          uid: user.uid,
          email: user.email,
          permissions: ['admin'],
          isMainAdmin: true,
          joinedAt: new Date().toISOString()
        }],
        pendingInvites: []
      });

      // Update user document
      await setDoc(doc(db, 'users', user.uid), {
        organizationId: orgRef.id,
        permissions: ['admin'],
        isMainAdmin: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Log the activity
      await logActivity('create_organization', {
        organizationId: orgRef.id,
        organizationName: name
      });

      return orgRef.id;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  const inviteMember = async (email, permissions = ['read']) => {
    try {
      // Only admins can invite
      if (!user.permissions?.includes('admin')) {
        throw new Error('Only admins can invite members');
      }

      const normalizedEmail = email.toLowerCase().trim();
      
      // Generate unique access key
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 8);
      const orgPrefix = user.organizationId.substring(0, 4);
      const accessKey = `${orgPrefix}-${timestamp}-${randomStr}`;

      // Create invitation
      const inviteRef = doc(collection(db, 'invitations'));
      await setDoc(inviteRef, {
        email: normalizedEmail,
        organizationId: user.organizationId,
        accessKey,
        permissions,
        invitedBy: user.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Add to organization's pending invites
      const orgRef = doc(db, 'organizations', user.organizationId);
      await updateDoc(orgRef, {
        pendingInvites: arrayUnion({
          email: normalizedEmail,
          accessKey,
          permissions
        })
      });

      // Log the activity
      await logActivity('invite_member', {
        email: normalizedEmail,
        permissions
      });

      return { success: true, accessKey };
    } catch (error) {
      console.error('Error inviting member:', error);
      throw error;
    }
  };

  const declineInvitation = async (invitationId, email) => {
    try {
      // Normalize email to lowercase
      const normalizedEmail = email.trim().toLowerCase();
      
      // Update invitation status
      await setDoc(doc(db, 'invitations', invitationId), {
        status: 'declined',
        declinedAt: serverTimestamp()
      }, { merge: true });

      // Remove from organization's pending invites
      const invitesQuery = query(
        collection(db, 'organizations'),
        where('pendingInvites', 'array-contains', normalizedEmail)
      );
      
      const orgsSnapshot = await getDocs(invitesQuery);
      for (const orgDoc of orgsSnapshot.docs) {
        await setDoc(doc(db, 'organizations', orgDoc.id), {
          pendingInvites: orgDoc.data().pendingInvites.filter(e => e.toLowerCase() !== normalizedEmail)
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
      
      // Normalize email to lowercase
      const normalizedEmail = email.trim().toLowerCase();
      
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
        where('email', '==', normalizedEmail),
        where('status', '==', 'pending')
      );
      
      const invitesSnapshot = await getDocs(invitesQuery);
      if (!invitesSnapshot.empty) {
        const invite = invitesSnapshot.docs[0].data();
        
        // Fetch organization details to show in alert
        const orgRef = doc(db, 'organizations', invite.organizationId);
        const orgDoc = await getDoc(orgRef);
        const orgName = orgDoc.exists() ? orgDoc.data().name : 'an organization';
        
        Alert.alert(
          'Team Invitation',
          `You've been invited to join "${orgName}" as a team member. Would you like to accept?`,
          [
            {
              text: 'Decline',
              style: 'cancel',
              onPress: () => declineInvitation(invitesSnapshot.docs[0].id, normalizedEmail)
            },
            {
              text: 'Accept',
              onPress: async () => {
                try {
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
                    pendingInvites: orgData.pendingInvites.filter(e => e.toLowerCase() !== normalizedEmail)
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

  const register = async (email, password, accessKey = null) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User registered:", user.email);
      
      // Normalize email to lowercase
      const normalizedEmail = email.trim().toLowerCase();
      console.log("Normalized email:", normalizedEmail);
      
      // Create initial user document
      const initialUserData = {
        email: user.email,
        createdAt: serverTimestamp(),
        name: user.displayName || email.split('@')[0],
      };
      
      await setDoc(doc(db, 'users', user.uid), initialUserData);
      console.log("Initial user document created");
      
      // Set initial user state
      setUser({ ...user, ...initialUserData });
      
      // If access key provided, verify invitation
      if (accessKey) {
        console.log("Verifying access key:", accessKey);
        
        // Query for invitation with matching email and access key
        const invitesQuery = query(
          collection(db, 'invitations'),
          where('email', '==', normalizedEmail),
          where('accessKey', '==', accessKey),
          where('status', '==', 'pending')
        );
        
        const invitesSnapshot = await getDocs(invitesQuery);
        console.log("Found invitations with access key:", invitesSnapshot.size);
        
        if (!invitesSnapshot.empty) {
          const invite = invitesSnapshot.docs[0].data();
          const inviteId = invitesSnapshot.docs[0].id;
          console.log("Processing invitation:", invite);
          
          // Fetch organization details
          const orgRef = doc(db, 'organizations', invite.organizationId);
          const orgDoc = await getDoc(orgRef);
          
          if (orgDoc.exists()) {
            const orgData = orgDoc.data();
            console.log("Organization data found:", orgData.name);
            const now = new Date().toISOString();

            // Add user to organization members with permissions
            const updatedOrgData = {
              members: [...(orgData.members || []), {
                uid: user.uid,
                email: user.email,
                permissions: invite.permissions,
                joinedAt: now
              }],
              pendingInvites: (orgData.pendingInvites || []).filter(invite => 
                invite.email.toLowerCase() !== normalizedEmail
              )
            };
            
            await setDoc(orgRef, updatedOrgData, { merge: true });
            console.log("Organization updated with new member");

            // Update user's organization reference
            const updatedUserData = {
              organizationId: invite.organizationId,
              permissions: invite.permissions,
              updatedAt: serverTimestamp()
            };
            
            await setDoc(doc(db, 'users', user.uid), updatedUserData, { merge: true });
            console.log("User document updated with organization reference");

            // Update invitation status
            await setDoc(doc(db, 'invitations', inviteId), {
              status: 'accepted',
              acceptedAt: serverTimestamp()
            }, { merge: true });
            console.log("Invitation marked as accepted");

            // Update context with organization data
            const finalOrgData = { id: orgRef.id, ...orgData, ...updatedOrgData };
            setOrganizationData(finalOrgData);
            console.log("Organization data set in context");
            
            // Update user context with all data
            const updatedUserState = {
              ...user,
              ...initialUserData,
              ...updatedUserData
            };
            setUser(updatedUserState);
            console.log("Final user state:", updatedUserState);
            
            Alert.alert('Welcome', `You've been added to "${finalOrgData.name}" with ${invite.permissions.join(', ')} permissions.`);
          } else {
            console.log("Organization not found for invitation");
            Alert.alert('Error', 'Organization not found');
          }
        } else {
          console.log("No valid invitation found for this access key");
          Alert.alert('Error', 'Invalid access key or invitation not found');
        }
      } else {
        console.log("No access key provided - normal registration");
      }
      
      return user;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  // Function to update user state manually
  const updateUserState = (updatedUserData) => {
    console.log("Manually updating user state:", updatedUserData);
    setUser(prev => ({ ...prev, ...updatedUserData }));
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
    declineInvitation,
    updateUserState,
    updateUserPermissions,
    assignEditorTask
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 