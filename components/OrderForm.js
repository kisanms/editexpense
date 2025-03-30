import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const OrderForm = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    agentName: '',
    agentEmail: '',
    agentPhone: '',
    location: '',
    package: '',
    returning: '',
    payment: '',
    comment: '',
    workLink: ''
  });

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.agentName || !formData.agentEmail || !formData.agentPhone) {
      Alert.alert('Error', 'Agent Name, Email, and Phone are required fields');
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        date: new Date().toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'orders'), orderData);
      Alert.alert('Success', 'Order created successfully');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#f8f9fa', '#ffffff']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="add-circle" size={32} color="#4A6FFF" />
            </View>
            <Text style={styles.headerTitle}>New Order</Text>
            <Text style={styles.headerSubtitle}>Create a new order</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Agent Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Agent Name <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter agent name"
                    placeholderTextColor="#A0A0A0"
                    value={formData.agentName}
                    onChangeText={(text) => setFormData({ ...formData, agentName: text })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Agent Email <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter agent email"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.agentEmail}
                    onChangeText={(text) => setFormData({ ...formData, agentEmail: text })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Agent Phone <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter agent phone"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="phone-pad"
                    value={formData.agentPhone}
                    onChangeText={(text) => setFormData({ ...formData, agentPhone: text })}
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Details</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="location-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter property location"
                    placeholderTextColor="#A0A0A0"
                    value={formData.location}
                    onChangeText={(text) => setFormData({ ...formData, location: text })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Package</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="camera-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter package details"
                    placeholderTextColor="#A0A0A0"
                    value={formData.package}
                    onChangeText={(text) => setFormData({ ...formData, package: text })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="card-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter payment amount"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="numeric"
                    value={formData.payment}
                    onChangeText={(text) => setFormData({ ...formData, payment: text })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Comment</Text>
                <View style={[styles.inputWrapper, styles.textArea]}>
                  <Ionicons name="chatbox-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textAreaInput]}
                    placeholder="Add any comments"
                    placeholderTextColor="#A0A0A0"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={formData.comment}
                    onChangeText={(text) => setFormData({ ...formData, comment: text })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Work Link</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="link-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter work link"
                    placeholderTextColor="#A0A0A0"
                    autoCapitalize="none"
                    value={formData.workLink}
                    onChangeText={(text) => setFormData({ ...formData, workLink: text })}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#A6B7FF', '#8E9FE6'] : ['#4A6FFF', '#3557E5']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <Text style={styles.submitButtonText}>Creating Order...</Text>
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Create Order</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'white',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6e6e73',
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 120,
    alignItems: 'flex-start',
    paddingTop: 16,
  },
  textAreaInput: {
    height: 90,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1c1c1e',
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
});

export default OrderForm;
