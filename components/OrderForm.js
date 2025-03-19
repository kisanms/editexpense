import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const OrderForm = ({ navigation }) => {
  const { organizationData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    realtorName: '',
    editorName: '',
    address: '',
    chargeAmount: '',
    editorPayment: '',
    deliveryDate: '',
    email: '',
    contactNo: '',
    status: 'pending',
  });

  const validateDate = (text) => {
    // Allow only numbers and forward slashes
    const cleanedText = text.replace(/[^\d/]/g, '');
    
    // Add forward slash automatically after day and month
    let formattedText = cleanedText;
    if (cleanedText.length === 2 && !cleanedText.includes('/')) {
      formattedText = cleanedText + '/';
    } else if (cleanedText.length === 5 && cleanedText.indexOf('/', 3) === -1) {
      formattedText = cleanedText + '/';
    }
    
    // Limit the total length to 10 characters (DD/MM/YYYY)
    if (formattedText.length <= 10) {
      setFormData({ ...formData, deliveryDate: formattedText });
    }
  };

  const isValidDate = (dateString) => {
    // Check format (DD/MM/YYYY)
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return false;

    const [day, month, year] = dateString.split('/').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day);

    return date instanceof Date && !isNaN(date) &&
           date.getDate() === day &&
           date.getMonth() === month - 1 &&
           date.getFullYear() === year &&
           year >= 2000 && year <= 2100;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        Alert.alert('Error', 'Please login to add orders');
        navigation.navigate('Login');
        return;
      }

      // Validate form data
      if (!formData.realtorName || !formData.chargeAmount || !formData.editorPayment) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Validate date if provided
      if (formData.deliveryDate && !isValidDate(formData.deliveryDate)) {
        Alert.alert('Error', 'Please enter a valid date in DD/MM/YYYY format');
        return;
      }

      // Create order object with proper data types and user information
      const order = {
        realtorName: formData.realtorName.trim(),
        editorName: formData.editorName.trim(),
        address: formData.address.trim(),
        chargeAmount: parseFloat(formData.chargeAmount) || 0,
        editorPayment: parseFloat(formData.editorPayment) || 0,
        deliveryDate: formData.deliveryDate,
        email: formData.email.trim().toLowerCase(),
        contactNo: formData.contactNo.trim(),
        status: formData.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        // Add organization ID if user belongs to an organization
        ...(organizationData && { organizationId: organizationData.id })
      };

      console.log('Creating order with data:', order);

      // Add to Firestore
      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, order);

      if (docRef.id) {
        // Reset form
        setFormData({
          realtorName: '',
          editorName: '',
          address: '',
          chargeAmount: '',
          editorPayment: '',
          deliveryDate: '',
          email: '',
          contactNo: '',
          status: 'pending',
        });

        Alert.alert(
          'Success', 
          'Order added successfully',
          [{ text: 'OK', onPress: () => {
            console.log('Navigating to Home after order creation');
            navigation.navigate('Home');
          }}]
        );
      }
    } catch (error) {
      console.error('Error adding order:', error);
      Alert.alert(
        'Error',
        'Failed to add order. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Create New Order</Text>
          <Text style={styles.formSubtitle}>Fill in the details below to add a new order</Text>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Realtor Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6e6e73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter realtor name"
                value={formData.realtorName}
                onChangeText={(text) => setFormData({ ...formData, realtorName: text })}
                editable={!loading}
              />
            </View>
          </View>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Editor Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6e6e73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter editor name"
                value={formData.editorName}
                onChangeText={(text) => setFormData({ ...formData, editorName: text })}
                editable={!loading}
              />
            </View>
          </View>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#6e6e73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter property address"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                multiline
                editable={!loading}
              />
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Charge Amount (₹) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash-outline" size={20} color="#6e6e73" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.chargeAmount}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, chargeAmount: numericValue });
                  }}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
            </View>
            
            <View style={[styles.inputWrapper, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Editor Payment (₹) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="wallet-outline" size={20} color="#6e6e73" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.editorPayment}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, editorPayment: numericValue });
                  }}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Delivery Date (DD/MM/YYYY)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#6e6e73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                value={formData.deliveryDate}
                onChangeText={validateDate}
                maxLength={10}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
            {formData.deliveryDate && !isValidDate(formData.deliveryDate) && (
              <Text style={styles.errorText}>Please enter a valid date in DD/MM/YYYY format</Text>
            )}
          </View>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6e6e73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Contact Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#6e6e73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter contact number"
                value={formData.contactNo}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, contactNo: numericValue });
                }}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Add Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  formHeader: {
    padding: 20,
    paddingBottom: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6e6e73',
    marginBottom: 10,
  },
  form: {
    padding: 20,
    paddingTop: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#1c1c1e',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#4A6FFF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#4A6FFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonDisabled: {
    backgroundColor: '#a2b5ff',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderForm;
