import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, TextInput, Button, ActivityIndicator, HelperText } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { addClient, updateClient, getClientById } from '../services/clientService';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

// Validation Schema
const ClientSchema = Yup.object().shape({
  name: Yup.string().required('Client name is required'),
  email: Yup.string().email('Invalid email format'),
  phone: Yup.string(),
  address: Yup.string(),
  preferences: Yup.string(),
  notes: Yup.string(),
  // status: Yup.string().required('Status is required'), // Add later if using dropdown
});

const AddEditClientScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, userProfile } = useAuth();
  
  const clientId = route.params?.clientId; // Check if editing
  const isEditMode = Boolean(clientId);

  const [initialValues, setInitialValues] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    preferences: '',
    notes: '',
    status: 'active', // Default status
  });
  const [loading, setLoading] = useState(isEditMode); // Load if editing
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && clientId) {
      setLoading(true);
      getClientById(clientId)
        .then(clientData => {
          if (clientData) {
            setInitialValues({ // Populate form with existing data
              name: clientData.name || '',
              email: clientData.email || '',
              phone: clientData.phone || '',
              address: clientData.address || '',
              preferences: clientData.preferences || '',
              notes: clientData.notes || '',
              status: clientData.status || 'active',
            });
          } else {
            Alert.alert('Error', 'Client not found.');
            navigation.goBack(); // Go back if client doesn't exist
          }
        })
        .catch(error => {
          Alert.alert('Error', error.message);
          navigation.goBack();
        })
        .finally(() => setLoading(false));
    }
  }, [clientId, isEditMode, navigation]);

  const handleFormSubmit = async (values) => {
    if (!userProfile?.businessId || !user?.uid) {
        Alert.alert('Error', 'User or Business information is missing.');
        return;
    }
    
    setSubmitLoading(true);
    try {
      if (isEditMode) {
        await updateClient(clientId, values);
        Alert.alert('Success', 'Client updated successfully.');
      } else {
        await addClient(values, userProfile.businessId, user.uid);
        Alert.alert('Success', 'Client added successfully.');
      }
      navigation.goBack(); // Go back to the list after success
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
        <HelperText>Loading client data...</HelperText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isEditMode ? 'Edit Client' : 'Add New Client'} />
      </Appbar.Header>

      <Formik
        initialValues={initialValues}
        validationSchema={ClientSchema}
        onSubmit={handleFormSubmit}
        enableReinitialize // Important for edit mode to reinitialize form
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <TextInput
              label="Client Name *"
              value={values.name}
              onChangeText={handleChange('name')}
              onBlur={handleBlur('name')}
              mode="outlined"
              style={styles.input}
              error={touched.name && !!errors.name}
              disabled={submitLoading}
            />
            <HelperText type="error" visible={touched.name && !!errors.name}>
              {errors.name}
            </HelperText>

            <TextInput
              label="Email"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              error={touched.email && !!errors.email}
              disabled={submitLoading}
            />
            <HelperText type="error" visible={touched.email && !!errors.email}>
              {errors.email}
            </HelperText>
            
            <TextInput
              label="Phone Number"
              value={values.phone}
              onChangeText={handleChange('phone')}
              onBlur={handleBlur('phone')}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              disabled={submitLoading}
            />
            {/* Add HelperText for phone if needed */}

            <TextInput
              label="Address"
              value={values.address}
              onChangeText={handleChange('address')}
              onBlur={handleBlur('address')}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              disabled={submitLoading}
            />
            {/* Add HelperText for address if needed */}

            {/* Add Status Dropdown/Picker here later */}

            <TextInput
              label="Preferences"
              value={values.preferences}
              onChangeText={handleChange('preferences')}
              onBlur={handleBlur('preferences')}
              mode="outlined"
              style={styles.input}
              multiline
              disabled={submitLoading}
            />

            <TextInput
              label="Notes"
              value={values.notes}
              onChangeText={handleChange('notes')}
              onBlur={handleBlur('notes')}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={4}
              disabled={submitLoading}
            />

            <Button 
              mode="contained" 
              onPress={handleSubmit} 
              style={styles.button}
              loading={submitLoading}
              disabled={submitLoading}
            >
              {isEditMode ? 'Update Client' : 'Add Client'}
            </Button>

          </ScrollView>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: wp('4%'),
    paddingBottom: hp('5%'),
  },
  input: {
    marginBottom: hp('1.5%'),
  },
  button: {
    marginTop: hp('3%'),
    paddingVertical: hp('0.5%'),
  },
});

export default AddEditClientScreen; 