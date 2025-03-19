import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const OrganizationSetupScreen = () => {
  const { user, createOrganization } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateOrganization = async () => {
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
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={48} color="#4A6FFF" />
          </View>

          <Text style={styles.title}>Create Your Organization</Text>
          
          <Text style={styles.description}>
            Set up your organization to start managing expenses with your team. You can create an organization now or later from the Team tab.
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
            onPress={handleCreateOrganization}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.createButtonText}>Creating...</Text>
            ) : (
              <Text style={styles.createButtonText}>Create Organization</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              Alert.alert(
                'Skip Organization Setup',
                'You can create an organization later from the Team tab. Some features will be limited until you create an organization.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  },
                  {
                    text: 'Skip',
                    onPress: () => {
                      // Just update the user document to indicate they've seen the setup
                      setDoc(doc(db, 'users', user.uid), {
                        hasSeenOrgSetup: true,
                        updatedAt: serverTimestamp()
                      }, { merge: true });
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6e6e73',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 24,
    width: '100%',
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
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    color: '#6e6e73',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrganizationSetupScreen; 