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
  const [selectedPermissions, setSelectedPermissions] = useState(['read']);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accessKey, setAccessKey] = useState('');

  // Debug information
  console.log("MembersScreen - User:", user?.email, 
    "Has Org:", !!organizationData, 
    "OrgId:", user?.organizationId,
    "PendingInvites:", organizationData?.pendingInvites?.length || 0);

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
    if (!inviteEmail) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    
    try {
      setLoading(true);
      
      console.log("Sending invitation to:", inviteEmail, "with permissions:", selectedPermissions);
      const result = await inviteMember(inviteEmail, selectedPermissions);
      
      if (result.success) {
        setAccessKey(result.accessKey);
        Alert.alert(
          'Invitation Sent',
          `Access Key: ${result.accessKey}\n\nPlease share this access key with ${inviteEmail}. They will need it to join the organization.`,
          [
            {
              text: 'Copy Key',
              onPress: () => {
                if (Platform.OS === 'web') {
                  navigator.clipboard.writeText(result.accessKey);
                }
                Alert.alert('Success', 'Access key copied to clipboard');
              }
            },
            {
              text: 'Done',
              onPress: () => {
                setInviteEmail('');
                setShowInviteModal(false);
                setAccessKey('');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("Invitation error:", error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async (member, newPermissions) => {
    try {
      const orgRef = doc(db, 'organizations', organizationData.id);
      const updatedMembers = organizationData.members.map(m => {
        if (m.uid === member.uid) {
          return { ...m, permissions: newPermissions };
        }
        return m;
      });

      await setDoc(orgRef, { members: updatedMembers }, { merge: true });

      // Update user's permissions in their user document
      await setDoc(doc(db, 'users', member.uid), {
        permissions: newPermissions,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setShowRoleModal(false);
      setSelectedMember(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update member permissions');
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
    const isAdmin = member.permissions?.includes('admin');
    const isCurrentUser = member.uid === user.uid;
    const canManagePermissions = user.permissions?.includes('admin') && !isCurrentUser;

    return (
      <TouchableOpacity
        key={member.uid}
        style={styles.memberItem}
        onPress={() => {
          if (canManagePermissions) {
            setSelectedMember(member);
            setShowRoleModal(true);
          }
        }}
        disabled={!canManagePermissions}
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
            <View style={styles.permissionTags}>
              {member.permissions?.map(permission => (
                <View key={permission} style={[
                  styles.permissionTag,
                  permission === 'admin' && styles.adminTag
                ]}>
                  <Text style={[
                    styles.permissionText,
                    permission === 'admin' && styles.adminText
                  ]}>
                    {permission}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        {canManagePermissions && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedMember(member);
              setShowRoleModal(true);
            }}
          >
            <Ionicons name="settings-outline" size={20} color="#4A6FFF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderPendingInvites = () => {
    if (!organizationData?.pendingInvites?.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Invites</Text>
        {organizationData.pendingInvites.map((invite) => (
          <View key={invite.email} style={styles.inviteItem}>
            <View style={styles.inviteInfo}>
              <View style={[styles.avatarContainer, styles.pendingAvatar]}>
                <Ionicons name="mail-outline" size={16} color="#6e6e73" />
              </View>
              <View style={styles.inviteDetails}>
                <Text style={styles.inviteEmail}>{invite.email}</Text>
                <Text style={styles.pendingText}>Access Key: {invite.accessKey}</Text>
                <View style={styles.permissionTags}>
                  {invite.permissions?.map(permission => (
                    <View key={permission} style={styles.permissionTag}>
                      <Text style={styles.permissionText}>{permission}</Text>
                    </View>
                  ))}
                </View>
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
              Enter the email address and select permissions for the new team member.
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

            <Text style={styles.sectionTitle}>Permissions</Text>
            <View style={styles.permissionsContainer}>
              <TouchableOpacity
                style={[
                  styles.permissionOption,
                  selectedPermissions.includes('read') && styles.selectedPermission
                ]}
                onPress={() => {
                  setSelectedPermissions(prev => 
                    prev.includes('read') 
                      ? prev.filter(p => p !== 'read')
                      : [...prev, 'read']
                  );
                }}
              >
                <Ionicons 
                  name="eye-outline" 
                  size={20} 
                  color={selectedPermissions.includes('read') ? '#4A6FFF' : '#6e6e73'} 
                />
                <Text style={[
                  styles.permissionOptionText,
                  selectedPermissions.includes('read') && styles.selectedPermissionText
                ]}>Read</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.permissionOption,
                  selectedPermissions.includes('write') && styles.selectedPermission
                ]}
                onPress={() => {
                  setSelectedPermissions(prev => 
                    prev.includes('write') 
                      ? prev.filter(p => p !== 'write')
                      : [...prev, 'write']
                  );
                }}
              >
                <Ionicons 
                  name="create-outline" 
                  size={20} 
                  color={selectedPermissions.includes('write') ? '#4A6FFF' : '#6e6e73'} 
                />
                <Text style={[
                  styles.permissionOptionText,
                  selectedPermissions.includes('write') && styles.selectedPermissionText
                ]}>Write</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.permissionOption,
                  selectedPermissions.includes('delete') && styles.selectedPermission
                ]}
                onPress={() => {
                  setSelectedPermissions(prev => 
                    prev.includes('delete') 
                      ? prev.filter(p => p !== 'delete')
                      : [...prev, 'delete']
                  );
                }}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={20} 
                  color={selectedPermissions.includes('delete') ? '#4A6FFF' : '#6e6e73'} 
                />
                <Text style={[
                  styles.permissionOptionText,
                  selectedPermissions.includes('delete') && styles.selectedPermissionText
                ]}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.permissionOption,
                  selectedPermissions.includes('admin') && styles.selectedPermission
                ]}
                onPress={() => {
                  setSelectedPermissions(prev => 
                    prev.includes('admin') 
                      ? prev.filter(p => p !== 'admin')
                      : [...prev, 'admin']
                  );
                }}
              >
                <Ionicons 
                  name="shield-checkmark-outline" 
                  size={20} 
                  color={selectedPermissions.includes('admin') ? '#4A6FFF' : '#6e6e73'} 
                />
                <Text style={[
                  styles.permissionOptionText,
                  selectedPermissions.includes('admin') && styles.selectedPermissionText
                ]}>Admin</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.inviteButton, loading && styles.inviteButtonDisabled]}
              onPress={handleInvite}
              disabled={loading || !selectedPermissions.length}
            >
              {loading ? (
                <Text style={styles.inviteButtonText}>Sending...</Text>
              ) : (
                <Text style={styles.inviteButtonText}>Send Invitation</Text>
              )}
            </TouchableOpacity>

            {accessKey && (
              <View style={styles.accessKeyContainer}>
                <Text style={styles.accessKeyLabel}>Access Key:</Text>
                <Text style={styles.accessKeyText}>{accessKey}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      navigator.clipboard.writeText(accessKey);
                    }
                    Alert.alert('Success', 'Access key copied to clipboard');
                  }}
                >
                  <Ionicons name="copy-outline" size={20} color="#4A6FFF" />
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            )}
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
              <Text style={styles.modalTitle}>Update Permissions</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Ionicons name="close" size={24} color="#6e6e73" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Update permissions for {selectedMember?.name || selectedMember?.email?.split('@')[0]}
            </Text>

            <View style={styles.permissionsContainer}>
              <TouchableOpacity
                style={[
                  styles.permissionOption,
                  selectedMember?.permissions?.includes('read') && styles.selectedPermission
                ]}
                onPress={() => {
                  const newPermissions = selectedMember.permissions?.includes('read')
                    ? selectedMember.permissions.filter(p => p !== 'read')
                    : [...(selectedMember.permissions || []), 'read'];
                  handleUpdatePermissions(selectedMember, newPermissions);
                }}
              >
                <Ionicons name="eye-outline" size={24} color="#4A6FFF" />
                <Text style={styles.permissionOptionText}>Read</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.permissionOption,
                  selectedMember?.permissions?.includes('write') && styles.selectedPermission
                ]}
                onPress={() => {
                  const newPermissions = selectedMember.permissions?.includes('write')
                    ? selectedMember.permissions.filter(p => p !== 'write')
                    : [...(selectedMember.permissions || []), 'write'];
                  handleUpdatePermissions(selectedMember, newPermissions);
                }}
              >
                <Ionicons name="create-outline" size={24} color="#4A6FFF" />
                <Text style={styles.permissionOptionText}>Write</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.permissionOption,
                  selectedMember?.permissions?.includes('delete') && styles.selectedPermission
                ]}
                onPress={() => {
                  const newPermissions = selectedMember.permissions?.includes('delete')
                    ? selectedMember.permissions.filter(p => p !== 'delete')
                    : [...(selectedMember.permissions || []), 'delete'];
                  handleUpdatePermissions(selectedMember, newPermissions);
                }}
              >
                <Ionicons name="trash-outline" size={24} color="#4A6FFF" />
                <Text style={styles.permissionOptionText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.permissionOption,
                  selectedMember?.permissions?.includes('admin') && styles.selectedPermission
                ]}
                onPress={() => {
                  const newPermissions = selectedMember.permissions?.includes('admin')
                    ? selectedMember.permissions.filter(p => p !== 'admin')
                    : [...(selectedMember.permissions || []), 'admin'];
                  handleUpdatePermissions(selectedMember, newPermissions);
                }}
              >
                <Ionicons name="shield-checkmark-outline" size={24} color="#4A6FFF" />
                <Text style={styles.permissionOptionText}>Admin</Text>
              </TouchableOpacity>
            </View>
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
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  permissionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  permissionTag: {
    backgroundColor: '#6e6e7315',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  adminTag: {
    backgroundColor: '#4A6FFF15',
  },
  permissionText: {
    fontSize: 12,
    color: '#6e6e73',
    textTransform: 'capitalize',
  },
  accessKeyContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  accessKeyLabel: {
    fontSize: 14,
    color: '#6e6e73',
    marginBottom: 4,
  },
  accessKeyText: {
    fontSize: 16,
    color: '#1c1c1e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  copyButtonText: {
    fontSize: 14,
    color: '#4A6FFF',
    fontWeight: '600',
  },
  permissionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  permissionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    gap: 4,
  },
  selectedPermission: {
    backgroundColor: '#4A6FFF15',
  },
  permissionOptionText: {
    fontSize: 14,
    color: '#6e6e73',
  },
  selectedPermissionText: {
    color: '#4A6FFF',
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
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A6FFF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

export default MembersScreen; 