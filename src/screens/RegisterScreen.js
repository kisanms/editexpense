import React, { useState } from 'react';
import { View, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Portal, PaperProvider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationKey, setOrganizationKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword || !selectedRole) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (selectedRole === 'partner' && !organizationKey) {
      Alert.alert('Error', 'Organization key is required for partners');
      return;
    }

    try {
      setLoading(true);
      await register(email, password, username, selectedRole, organizationKey);
      // Navigation will be handled by AuthProvider
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const RoleModal = () => (
    <Portal>
      <Modal
        visible={showRoleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Role</Text>
            
            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => {
                setSelectedRole('admin');
                setShowRoleModal(false);
              }}
            >
              <Text style={styles.roleButtonText}>Admin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => {
                setSelectedRole('partner');
                setShowRoleModal(false);
              }}
            >
              <Text style={styles.roleButtonText}>Partner</Text>
            </TouchableOpacity>
            
            <Button
              mode="text"
              onPress={() => setShowRoleModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Text style={styles.title}>Register</Text>
        
        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={styles.input}
        />
        
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
        />
        
        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
        />
        
        <Button
          mode="outlined"
          onPress={() => setShowRoleModal(true)}
          style={styles.input}
        >
          {selectedRole ? `Role: ${selectedRole}` : 'Select Role'}
        </Button>
        
        {selectedRole === 'partner' && (
          <TextInput
            label="Organization Key"
            value={organizationKey}
            onChangeText={setOrganizationKey}
            mode="outlined"
            style={styles.input}
          />
        )}
        
        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          style={styles.button}
        >
          Register
        </Button>
        
        <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
        >
          Already have an account? Login
        </Button>
        
        <RoleModal />
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  roleButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalButton: {
    marginTop: 10,
  },
});

export default RegisterScreen; 