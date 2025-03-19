import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const MembersScreen = () => {
  const { user, organizationData, inviteMember, createOrganization } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!organizationData) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.setupContentContainer}>
          <View style={styles.setupContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={48} color="#4A6FFF" />
            </View>

            <Text style={styles.title}>Create Your Organization</Text>
            
            <Text style={styles.description}>
              You need to create an organization before you can invite team members and manage expenses together.
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#6e6e73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Organization Name"
                value={orgName}
                onChangeText={setOrgName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={async () => {
                if (!orgName.trim()) {
                  Alert.alert('Error', 'Please enter an organization name');
                  return;
                }

                try {
                  setLoading(true);
                  await createOrganization(orgName.trim(), user.email);
                } catch (error) {
                  Alert.alert('Error', error.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.createButtonText}>Creating...</Text>
              ) : (
                <Text style={styles.createButtonText}>Create Organization</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    // Add email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await inviteMember(inviteEmail.trim().toLowerCase());
      Alert.alert('Success', 'Invitation sent successfully.\n\nPlease note: The invited user will see the invitation when they log in with this email address. You may want to notify them separately.');
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    try {
      if (!selectedMember) return;

      const orgRef = doc(db, 'organizations', organizationData.id);
      const updatedMembers = organizationData.members.map(member => {
        if (member.uid === selectedMember.uid) {
          return { ...member, role: newRole };
        }
        return member;
      });

      await setDoc(orgRef, { members: updatedMembers }, { merge: true });

      // Update user's role in their user document
      await setDoc(doc(db, 'users', selectedMember.uid), {
        role: newRole,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setShowRoleModal(false);
      setSelectedMember(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberToRemove) => {
    try {
      // Prevent removing the last admin
      const admins = organizationData.members.filter(m => m.role === 'admin');
      if (memberToRemove.role === 'admin' && admins.length === 1) {
        Alert.alert('Error', 'Cannot remove the last admin. Promote another member to admin first.');
        return;
      }

      Alert.alert(
        'Remove Member',
        `Are you sure you want to remove ${memberToRemove.email}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              const orgRef = doc(db, 'organizations', organizationData.id);
              const updatedMembers = organizationData.members.filter(
                member => member.uid !== memberToRemove.uid
              );

              await setDoc(orgRef, { members: updatedMembers }, { merge: true });

              // Remove organization reference from user's document
              await setDoc(doc(db, 'users', memberToRemove.uid), {
                organizationId: null,
                role: null,
                updatedAt: serverTimestamp()
              }, { merge: true });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to remove member');
    }
  };

  const renderMemberItem = (member) => {
    const isAdmin = member.role === 'admin';
    const isCurrentUser = member.uid === user.uid;
    const canManageRole = user.role === 'admin' && !isCurrentUser;

    return (
      <TouchableOpacity
        key={member.uid}
        style={styles.memberItem}
        onPress={() => {
          if (canManageRole) {
            setSelectedMember(member);
            setShowRoleModal(true);
          }
        }}
        disabled={!canManageRole}
      >
        <View style={styles.memberInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {member.email.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>
              {member.name || member.email.split('@')[0]}
              {isCurrentUser && ' (You)'}
            </Text>
            <Text style={styles.memberEmail}>{member.email}</Text>
          </View>
        </View>
        <View style={styles.memberActions}>
          <View style={[styles.roleBadge, isAdmin && styles.adminBadge]}>
            <Text style={[styles.roleText, isAdmin && styles.adminText]}>
              {member.role}
            </Text>
          </View>
          {canManageRole && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveMember(member)}
            >
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPendingInvites = () => {
    if (!organizationData?.pendingInvites?.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Invites</Text>
        {organizationData.pendingInvites.map((email) => (
          <View key={email} style={styles.inviteItem}>
            <View style={styles.inviteInfo}>
              <View style={[styles.avatarContainer, styles.pendingAvatar]}>
                <Ionicons name="mail-outline" size={16} color="#6e6e73" />
              </View>
              <View style={styles.inviteDetails}>
                <Text style={styles.inviteEmail}>{email}</Text>
                <Text style={styles.pendingText}>Waiting for response</Text>
              </View>
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Members</Text>
        {user?.role === 'admin' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowInviteModal(true)}
          >
            <Ionicons name="person-add" size={20} color="#4A6FFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.mainContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members</Text>
          {organizationData?.members.map(renderMemberItem)}
        </View>

        {renderPendingInvites()}
      </ScrollView>

      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Team Member</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color="#6e6e73" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter the email address of the person you'd like to invite to your team.
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6e6e73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity
              style={[styles.inviteButton, loading && styles.inviteButtonDisabled]}
              onPress={handleInvite}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.inviteButtonText}>Sending...</Text>
              ) : (
                <Text style={styles.inviteButtonText}>Send Invitation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRoleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Role</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Ionicons name="close" size={24} color="#6e6e73" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Select a role for {selectedMember?.name || selectedMember?.email?.split('@')[0]}
            </Text>

            <TouchableOpacity
              style={[styles.roleOption, { backgroundColor: '#4A6FFF15' }]}
              onPress={() => handleRoleChange('admin')}
            >
              <Ionicons name="shield-checkmark" size={24} color="#4A6FFF" />
              <View style={styles.roleOptionContent}>
                <Text style={[styles.roleOptionTitle, { color: '#4A6FFF' }]}>Admin</Text>
                <Text style={styles.roleOptionDescription}>
                  Can manage team members and access all features
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, { backgroundColor: '#6e6e7315' }]}
              onPress={() => handleRoleChange('member')}
            >
              <Ionicons name="person" size={24} color="#6e6e73" />
              <View style={styles.roleOptionContent}>
                <Text style={[styles.roleOptionTitle, { color: '#6e6e73' }]}>Member</Text>
                <Text style={styles.roleOptionDescription}>
                  Can view and manage orders
                </Text>
              </View>
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
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  addButton: {
    padding: 8,
  },
  mainContent: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6e6e73',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A6FFF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A6FFF',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: '#6e6e73',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#6e6e7315',
  },
  adminBadge: {
    backgroundColor: '#4A6FFF15',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6e6e73',
    textTransform: 'capitalize',
  },
  adminText: {
    color: '#4A6FFF',
  },
  inviteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inviteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingAvatar: {
    backgroundColor: '#6e6e7315',
  },
  inviteDetails: {
    flex: 1,
  },
  inviteEmail: {
    fontSize: 16,
    color: '#1c1c1e',
    marginBottom: 2,
  },
  pendingText: {
    fontSize: 14,
    color: '#6e6e73',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FF950015',
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  modalDescription: {
    fontSize: 16,
    color: '#6e6e73',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1c1c1e',
  },
  inviteButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonDisabled: {
    opacity: 0.7,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    padding: 4,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  roleOptionContent: {
    marginLeft: 12,
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleOptionDescription: {
    fontSize: 14,
    color: '#6e6e73',
  },
  setupContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  setupContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A6FFF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#6e6e73',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MembersScreen; 