import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface, Portal } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
          <Surface style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Role</Text>
            
            <TouchableOpacity
              style={[styles.roleButton, selectedRole === 'admin' && styles.selectedRoleButton]}
              onPress={() => {
                setSelectedRole('admin');
                setShowRoleModal(false);
              }}
            >
              <MaterialCommunityIcons name="account-tie" size={24} color={selectedRole === 'admin' ? '#fff' : '#3b5998'} />
              <Text style={[styles.roleButtonText, selectedRole === 'admin' && styles.selectedRoleText]}>
                Admin
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.roleButton, selectedRole === 'partner' && styles.selectedRoleButton]}
              onPress={() => {
                setSelectedRole('partner');
                setShowRoleModal(false);
              }}
            >
              <MaterialCommunityIcons name="account-group" size={24} color={selectedRole === 'partner' ? '#fff' : '#3b5998'} />
              <Text style={[styles.roleButtonText, selectedRole === 'partner' && styles.selectedRoleText]}>
                Partner
              </Text>
            </TouchableOpacity>
            
            <Button
              mode="text"
              onPress={() => setShowRoleModal(false)}
              style={styles.modalButton}
              labelStyle={styles.modalButtonLabel}
            >
              Cancel
            </Button>
          </Surface>
        </View>
      </Modal>
    </Portal>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Surface style={styles.surface}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join our community</Text>
            </View>

            <View style={styles.formContainer}>
              <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="account" />}
                theme={{ colors: { primary: '#3b5998' } }}
              />
              
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email" />}
                theme={{ colors: { primary: '#3b5998' } }}
              />
              
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                left={<TextInput.Icon icon="lock" />}
                theme={{ colors: { primary: '#3b5998' } }}
              />
              
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                left={<TextInput.Icon icon="lock-check" />}
                theme={{ colors: { primary: '#3b5998' } }}
              />
              
              <Button
                mode="outlined"
                onPress={() => setShowRoleModal(true)}
                style={styles.roleSelectButton}
                contentStyle={styles.roleSelectContent}
                labelStyle={styles.roleSelectLabel}
                icon={selectedRole ? "check-circle" : "account-cog"}
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
                  left={<TextInput.Icon icon="key" />}
                  theme={{ colors: { primary: '#3b5998' } }}
                />
              )}
              
              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                style={styles.registerButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Create Account
              </Button>
              
              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                style={styles.loginButton}
                labelStyle={styles.loginButtonLabel}
              >
                Already have an account? Sign In
              </Button>
            </View>
          </Surface>
        </ScrollView>
        <RoleModal />
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  surface: {
    padding: 20,
    borderRadius: 20,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b5998',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  roleSelectButton: {
    marginBottom: 15,
    borderColor: '#3b5998',
  },
  roleSelectContent: {
    height: 48,
  },
  roleSelectLabel: {
    color: '#3b5998',
  },
  registerButton: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#3b5998',
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 15,
  },
  loginButtonLabel: {
    color: '#3b5998',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 20,
    width: '80%',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b5998',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3b5998',
    marginBottom: 10,
  },
  selectedRoleButton: {
    backgroundColor: '#3b5998',
  },
  roleButtonText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#3b5998',
  },
  selectedRoleText: {
    color: '#fff',
  },
  modalButton: {
    marginTop: 10,
  },
  modalButtonLabel: {
    color: '#3b5998',
  },
});

export default RegisterScreen; 