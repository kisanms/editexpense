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
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const OrderForm = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    realtorName: '',
    address: '',
    chargeAmount: '',
    editorPayment: '',
    deliveryDate: '',
    email: '',
    contactNo: '',
  });

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

      // Create order object with proper data types and user information
      const order = {
        realtorName: formData.realtorName.trim(),
        address: formData.address.trim(),
        chargeAmount: parseFloat(formData.chargeAmount) || 0,
        editorPayment: parseFloat(formData.editorPayment) || 0,
        deliveryDate: formData.deliveryDate.trim(),
        email: formData.email.trim().toLowerCase(),
        contactNo: formData.contactNo.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email
      };

      // Add to Firestore
      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, order);

      if (docRef.id) {
        // Reset form
        setFormData({
          realtorName: '',
          address: '',
          chargeAmount: '',
          editorPayment: '',
          deliveryDate: '',
          email: '',
          contactNo: '',
        });

        Alert.alert(
          'Success', 
          'Order added successfully',
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
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
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Realtor Name *"
          value={formData.realtorName}
          onChangeText={(text) => setFormData({ ...formData, realtorName: text })}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          multiline
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Charge Amount (₹) *"
          value={formData.chargeAmount}
          onChangeText={(text) => {
            const numericValue = text.replace(/[^0-9]/g, '');
            setFormData({ ...formData, chargeAmount: numericValue });
          }}
          keyboardType="numeric"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Editor Payment (₹) *"
          value={formData.editorPayment}
          onChangeText={(text) => {
            const numericValue = text.replace(/[^0-9]/g, '');
            setFormData({ ...formData, editorPayment: numericValue });
          }}
          keyboardType="numeric"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Delivery Date"
          value={formData.deliveryDate}
          onChangeText={(text) => setFormData({ ...formData, deliveryDate: text })}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact Number"
          value={formData.contactNo}
          onChangeText={(text) => {
            const numericValue = text.replace(/[^0-9]/g, '');
            setFormData({ ...formData, contactNo: numericValue });
          }}
          keyboardType="phone-pad"
          editable={!loading}
        />
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Add Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#99c9ff',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderForm;
