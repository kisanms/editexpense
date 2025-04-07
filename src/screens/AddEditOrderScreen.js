import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import {
    Appbar,
    TextInput,
    Button,
    ActivityIndicator,
    HelperText,
    Text,
    RadioButton, // For Status
    List, // For Client Selection (basic)
    Modal, // For Client Selection
    Portal, // For Client Selection Modal
    Searchbar // For Client Selection Modal
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { addOrder, updateOrder, getOrderById } from '../services/orderService';
import { getActiveClientsForBusiness } from '../services/clientService';
import { DatePickerModal } from 'react-native-paper-dates';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp
import { format } from 'date-fns';
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const ORDER_STATUSES = ['pending', 'in-progress', 'completed', 'delivered', 'cancelled'];

// Validation Schema
const OrderSchema = Yup.object().shape({
    clientId: Yup.string().required('Client is required'),
    clientNameSnapshot: Yup.string(), // Not directly validated, set internally
    servicePackage: Yup.string().required('Service/Package description is required'),
    status: Yup.string().oneOf(ORDER_STATUSES).required('Status is required'),
    orderDate: Yup.date().nullable(),
    deadline: Yup.date().nullable().min(Yup.ref('orderDate'), "Deadline can't be before order date"),
    pricing: Yup.number().nullable().positive('Price must be positive'),
    requirements: Yup.string(),
    // assignedWorkerId: Yup.string().nullable(), // Add later
});

const AddEditOrderScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user, userProfile } = useAuth();

    const orderId = route.params?.orderId; // Check if editing
    const preselectedClientId = route.params?.clientId; // Optional: Client preselected
    const isEditMode = Boolean(orderId);

    // State for form data
    const [initialValues, setInitialValues] = useState({
        clientId: preselectedClientId || '',
        clientNameSnapshot: '',
        servicePackage: '',
        status: 'pending',
        orderDate: null,
        deadline: null,
        pricing: '',
        requirements: '',
    });

    // State for UI
    const [loading, setLoading] = useState(isEditMode); // Load if editing
    const [submitLoading, setSubmitLoading] = useState(false);
    const [clients, setClients] = useState([]); // For client dropdown
    const [clientsLoading, setClientsLoading] = useState(true);
    const [isClientModalVisible, setClientModalVisible] = useState(false);
    const [clientSearchQuery, setClientSearchQuery] = useState('');

    // State for Date Pickers
    const [orderDatePickerOpen, setOrderDatePickerOpen] = useState(false);
    const [deadlinePickerOpen, setDeadlinePickerOpen] = useState(false);

    // --- Data Fetching --- 
    // Fetch clients for dropdown
    useEffect(() => {
        if (userProfile?.businessId) {
            setClientsLoading(true);
            getActiveClientsForBusiness(userProfile.businessId)
                .then(setClients)
                .catch(err => Alert.alert("Error", "Could not load clients for selection."))
                .finally(() => setClientsLoading(false));
        }
    }, [userProfile?.businessId]);

    // Fetch order data if in edit mode
    useEffect(() => {
        if (isEditMode && orderId) {
            setLoading(true);
            getOrderById(orderId)
                .then(orderData => {
                    if (orderData) {
                        setInitialValues({
                            clientId: orderData.clientId || '',
                            clientNameSnapshot: orderData.clientNameSnapshot || '',
                            servicePackage: orderData.servicePackage || '',
                            status: orderData.status || 'pending',
                            // Convert Firestore Timestamps to JS Date objects for date picker
                            orderDate: orderData.orderDate?.toDate ? orderData.orderDate.toDate() : null,
                            deadline: orderData.deadline?.toDate ? orderData.deadline.toDate() : null,
                            pricing: orderData.pricing?.toString() || '',
                            requirements: orderData.requirements || '',
                            // assignedWorkerId: orderData.assignedWorkerId || null,
                        });
                    } else {
                        Alert.alert('Error', 'Order not found.');
                        navigation.goBack();
                    }
                })
                .catch(error => {
                    Alert.alert('Error', error.message);
                    navigation.goBack();
                })
                .finally(() => setLoading(false));
        }
    }, [orderId, isEditMode, navigation]);

    // --- Form Submission --- 
    const handleFormSubmit = async (values) => {
        if (!userProfile?.businessId || !user?.uid) {
            Alert.alert('Error', 'User or Business information is missing.');
            return;
        }
        
        // Find the selected client name for the snapshot
        const selectedClient = clients.find(c => c.id === values.clientId);
        if (!selectedClient) {
            Alert.alert('Error', 'Invalid client selected.');
            return;
        }

        setSubmitLoading(true);
        
        // Prepare data, converting Dates back to Timestamps for Firestore
        const dataToSubmit = {
            ...values,
            clientNameSnapshot: selectedClient.name, // Add snapshot
            orderDate: values.orderDate ? Timestamp.fromDate(values.orderDate) : null,
            deadline: values.deadline ? Timestamp.fromDate(values.deadline) : null,
            pricing: values.pricing ? parseFloat(values.pricing) : null, // Convert price string to number
        };

        try {
            if (isEditMode) {
                await updateOrder(orderId, dataToSubmit);
                Alert.alert('Success', 'Order updated successfully.');
            } else {
                await addOrder(dataToSubmit, userProfile.businessId, user.uid);
                Alert.alert('Success', 'Order added successfully.');
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    // --- Date Picker Callbacks --- 
    const onDismissOrderDatePicker = useCallback(() => {
        setOrderDatePickerOpen(false);
    }, [setOrderDatePickerOpen]);

    const onConfirmOrderDate = useCallback((params, setFieldValue) => {
        setOrderDatePickerOpen(false);
        setFieldValue('orderDate', params.date); // params.date is already a JS Date
    }, [setOrderDatePickerOpen]);
    
    const onDismissDeadlinePicker = useCallback(() => {
        setDeadlinePickerOpen(false);
    }, [setDeadlinePickerOpen]);

    const onConfirmDeadline = useCallback((params, setFieldValue) => {
        setDeadlinePickerOpen(false);
        setFieldValue('deadline', params.date);
    }, [setDeadlinePickerOpen]);

    // --- Client Selection Modal --- 
    const filteredModalClients = clients.filter(client => 
        client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
    );
    
    const renderClientModalItem = ({ item }, setFieldValue) => (
        <List.Item
            title={item.name}
            onPress={() => {
                setFieldValue('clientId', item.id);
                setInitialValues(prev => ({...prev, clientNameSnapshot: item.name })); // Optimistic update for display
                setClientModalVisible(false);
                setClientSearchQuery('');
            }}
        />
    );

    // --- Loading States --- 
    if (loading || clientsLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator animating={true} size="large" />
                <HelperText>Loading data...</HelperText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title={isEditMode ? 'Edit Order' : 'Add New Order'} />
            </Appbar.Header>

            <Formik
                initialValues={initialValues}
                validationSchema={OrderSchema}
                onSubmit={handleFormSubmit}
                enableReinitialize
            >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        
                        {/* Client Selection */}
                        <TouchableOpacity onPress={() => setClientModalVisible(true)} disabled={submitLoading}>
                            <TextInput
                                label="Client *"
                                value={clients.find(c => c.id === values.clientId)?.name || 'Select Client'}
                                mode="outlined"
                                style={styles.input}
                                editable={false} // Prevent direct editing
                                right={<TextInput.Icon icon="menu-down" />} 
                                error={touched.clientId && !!errors.clientId}
                            />
                        </TouchableOpacity>
                        <HelperText type="error" visible={touched.clientId && !!errors.clientId}>
                            {errors.clientId}
                        </HelperText>
                        
                        <TextInput
                            label="Service / Package *"
                            value={values.servicePackage}
                            onChangeText={handleChange('servicePackage')}
                            onBlur={handleBlur('servicePackage')}
                            mode="outlined"
                            style={styles.input}
                            error={touched.servicePackage && !!errors.servicePackage}
                            disabled={submitLoading}
                        />
                        <HelperText type="error" visible={touched.servicePackage && !!errors.servicePackage}>
                            {errors.servicePackage}
                        </HelperText>

                        {/* Status Selection */} 
                        <View style={styles.statusContainer}>
                            <Text style={styles.statusLabel}>Status *</Text>
                            <RadioButton.Group 
                                onValueChange={newValue => setFieldValue('status', newValue)} 
                                value={values.status}
                            >
                                <View style={styles.radioGroup}>
                                    {ORDER_STATUSES.map(status => (
                                        <View key={status} style={styles.radioButtonItem}>
                                            <RadioButton value={status} disabled={submitLoading}/>
                                            <Text>{status.replace('-',' ')}</Text>
                                        </View>
                                    ))}
                                </View>
                            </RadioButton.Group>
                             <HelperText type="error" visible={touched.status && !!errors.status}>
                                {errors.status}
                            </HelperText>
                        </View>

                        {/* Date Pickers */} 
                         <TouchableOpacity onPress={() => setOrderDatePickerOpen(true)} disabled={submitLoading}>
                             <TextInput
                                label="Order Date"
                                value={values.orderDate ? format(values.orderDate, 'PPP') : 'Select Date'}
                                mode="outlined"
                                style={styles.input}
                                editable={false}
                                right={<TextInput.Icon icon="calendar" />} 
                            />
                        </TouchableOpacity>
                        {/* Add HelperText for orderDate if needed */}
                        
                        <TouchableOpacity onPress={() => setDeadlinePickerOpen(true)} disabled={submitLoading}>
                             <TextInput
                                label="Deadline"
                                value={values.deadline ? format(values.deadline, 'PPP') : 'Select Date (Optional)'}
                                mode="outlined"
                                style={styles.input}
                                editable={false}
                                right={<TextInput.Icon icon="calendar-clock" />} 
                                error={touched.deadline && !!errors.deadline}
                            />
                        </TouchableOpacity>
                        <HelperText type="error" visible={touched.deadline && !!errors.deadline}>
                            {errors.deadline}
                        </HelperText>

                        <TextInput
                            label="Price (Optional)"
                            value={values.pricing}
                            onChangeText={handleChange('pricing')}
                            onBlur={handleBlur('pricing')}
                            mode="outlined"
                            style={styles.input}
                            keyboardType="numeric"
                            error={touched.pricing && !!errors.pricing}
                            disabled={submitLoading}
                        />
                         <HelperText type="error" visible={touched.pricing && !!errors.pricing}>
                            {errors.pricing}
                        </HelperText>

                        <TextInput
                            label="Requirements / Notes"
                            value={values.requirements}
                            onChangeText={handleChange('requirements')}
                            onBlur={handleBlur('requirements')}
                            mode="outlined"
                            style={styles.input}
                            multiline
                            numberOfLines={4}
                            disabled={submitLoading}
                        />
                        {/* Add HelperText for requirements if needed */}

                        {/* Assigned Worker - Add Later */}

                        <Button 
                            mode="contained" 
                            onPress={handleSubmit} 
                            style={styles.button}
                            loading={submitLoading}
                            disabled={submitLoading}
                        >
                            {isEditMode ? 'Update Order' : 'Add Order'}
                        </Button>

                        {/* Date Picker Modals */}
                        <DatePickerModal
                            locale="en" // Or configure localization
                            mode="single"
                            visible={orderDatePickerOpen}
                            onDismiss={onDismissOrderDatePicker}
                            date={values.orderDate || undefined} // Pass current value or undefined
                            onConfirm={(params) => onConfirmOrderDate(params, setFieldValue)}
                            // Optional: validRange={{ startDate: new Date() }} 
                        />
                         <DatePickerModal
                            locale="en"
                            mode="single"
                            visible={deadlinePickerOpen}
                            onDismiss={onDismissDeadlinePicker}
                            date={values.deadline || undefined}
                            validRange={{ startDate: values.orderDate || undefined }} // Deadline cannot be before order date
                            onConfirm={(params) => onConfirmDeadline(params, setFieldValue)}
                        />
                        
                        {/* Client Selection Modal */}
                        <Portal>
                            <Modal 
                                visible={isClientModalVisible} 
                                onDismiss={() => setClientModalVisible(false)} 
                                contentContainerStyle={styles.modalContainer}
                            >
                                <Searchbar
                                    placeholder="Search Client..."
                                    onChangeText={setClientSearchQuery}
                                    value={clientSearchQuery}
                                    style={styles.modalSearchbar}
                                />
                                <FlatList
                                    data={filteredModalClients}
                                    renderItem={(props) => renderClientModalItem(props, setFieldValue)}
                                    keyExtractor={(item) => item.id}
                                    ListEmptyComponent={<Text style={styles.modalEmptyText}>No clients found</Text>}
                                />
                                <Button onPress={() => setClientModalVisible(false)}>Close</Button>
                            </Modal>
                        </Portal>
                        
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
        marginBottom: hp('0.5%'), // Reduced margin as HelperText provides space
    },
    statusContainer: {
        marginBottom: hp('1.5%'),
        borderWidth: 1,
        borderColor: '#ccc', // Adjust as needed
        borderRadius: 4,
        padding: wp('3%'),
    },
    statusLabel: {
        fontSize: wp('4%'),
        marginBottom: hp('1%'),
        color: '#666' // Adjust as needed
    },
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    radioButtonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: wp('4%'),
        marginBottom: hp('1%')
    },
    button: {
        marginTop: hp('3%'),
        paddingVertical: hp('0.5%'),
    },
    // Modal Styles
    modalContainer: {
        backgroundColor: 'white',
        padding: wp('5%'),
        margin: wp('5%'), // Margin around the modal
        borderRadius: wp('2%'),
        maxHeight: hp('70%'), // Limit modal height
    },
    modalSearchbar: {
        marginBottom: hp('2%'),
    },
    modalEmptyText: {
        textAlign: 'center',
        paddingVertical: hp('2%'),
        color: '#888'
    }
});

export default AddEditOrderScreen; 