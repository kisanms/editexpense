import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Modal,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { TextInput, Button, Text, Surface, Portal } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { BlurView } from 'expo-blur';

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4c669f" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -hp(2)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <LinearGradient
            colors={['#4c669f', '#3b5998', '#192f6a']}
            style={styles.gradient}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4c669f',
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: wp(5),
    paddingBottom: hp(10),
  },
  surface: {
    padding: wp(5),
    borderRadius: wp(5),
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginVertical: hp(1),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  logo: {
    width: wp(25),
    height: wp(25),
    marginBottom: hp(2),
  },
  title: {
    fontSize: wp(7),
    fontWeight: 'bold',
    color: '#3b5998',
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: wp(4),
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: hp(2),
    backgroundColor: 'transparent',
  },
  roleSelectButton: {
    marginBottom: hp(2),
    borderColor: '#3b5998',
  },
  roleSelectContent: {
    height: hp(6),
  },
  roleSelectLabel: {
    color: '#3b5998',
  },
  registerButton: {
    marginTop: hp(2),
    paddingVertical: hp(1),
    borderRadius: wp(2.5),
    backgroundColor: '#3b5998',
  },
  buttonContent: {
    height: hp(6),
  },
  buttonLabel: {
    fontSize: wp(4),
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: hp(2),
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
    padding: wp(5),
    borderRadius: wp(5),
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