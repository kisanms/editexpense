import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Appbar, Text, ActivityIndicator, HelperText, Card, Title, Paragraph, Button, Divider, List } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getClientById } from '../services/clientService';
import { format } from 'date-fns'; // For formatting timestamps
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ClientDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { clientId } = route.params;

    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!clientId) {
            Alert.alert('Error', 'No Client ID provided.');
            navigation.goBack();
            return;
        }

        setLoading(true);
        getClientById(clientId)
            .then(data => {
                if (data) {
                    setClient(data);
                } else {
                    setError('Client not found.');
                    Alert.alert('Error', 'Client not found.');
                    // Optional: navigate back if client not found after delay
                    // setTimeout(() => navigation.goBack(), 1500);
                }
            })
            .catch(err => {
                console.error("Error fetching client details:", err);
                setError(err.message || 'Failed to load client data.');
                Alert.alert('Error', err.message || 'Failed to load client data.');
            })
            .finally(() => setLoading(false));
    }, [clientId, navigation]);

    const handleEdit = () => {
        navigation.navigate('AddEditClient', { clientId });
    };

    // Helper function to attempt opening Dialer or Email
    const handleContactPress = (type, value) => {
        if (!value) return;
        let url = '';
        if (type === 'phone') {
            url = `tel:${value}`;
        } else if (type === 'email') {
            url = `mailto:${value}`;
        }
        Linking.canOpenURL(url)
            .then(supported => {
                if (supported) {
                    return Linking.openURL(url);
                } else {
                    Alert.alert('Error', `Cannot handle this ${type} link.`);
                }
            })
            .catch(err => console.error('An error occurred', err));
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator animating={true} size="large" />
                <HelperText>Loading Client Details...</HelperText>
            </View>
        );
    }

    if (error || !client) {
        return (
            <View style={styles.container}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => navigation.goBack()} />
                    <Appbar.Content title="Error" />
                </Appbar.Header>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error || 'Client data could not be loaded.'}</Text>
                    <Button onPress={() => navigation.goBack()}>Go Back</Button>
                </View>
            </View>
        );
    }

    // Format Timestamps
    const createdAt = client.createdAt?.toDate ? format(client.createdAt.toDate(), 'PPP p') : 'N/A';
    const updatedAt = client.updatedAt?.toDate ? format(client.updatedAt.toDate(), 'PPP p') : 'N/A';

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title={client.name || 'Client Details'} subtitle={client.status?.toUpperCase()} />
                <Appbar.Action icon="pencil" onPress={handleEdit} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title style={styles.cardTitle}>Contact Information</Title>
                        <Divider style={styles.divider}/>
                        <List.Item
                            title={client.email || "No email provided"}
                            description="Email"
                            left={props => <List.Icon {...props} icon="email" />}
                            onPress={() => handleContactPress('email', client.email)}
                            disabled={!client.email}
                            titleStyle={!client.email && styles.disabledText}
                        />
                        <List.Item
                            title={client.phone || "No phone provided"}
                            description="Phone"
                            left={props => <List.Icon {...props} icon="phone" />}
                            onPress={() => handleContactPress('phone', client.phone)}
                            disabled={!client.phone}
                            titleStyle={!client.phone && styles.disabledText}
                        />
                        <List.Item
                            title={client.address || "No address provided"}
                            description="Address"
                            left={props => <List.Icon {...props} icon="map-marker" />}
                            // onPress={() => handleAddressPress(client.address)} // Future: Open in maps
                            titleStyle={!client.address && styles.disabledText}
                            titleNumberOfLines={3} // Allow more lines for address
                        />
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Title style={styles.cardTitle}>Details & Notes</Title>
                        <Divider style={styles.divider}/>
                        {client.preferences ? (
                            <View style={styles.detailItem}>
                                <MaterialCommunityIcons name="account-heart-outline" size={20} style={styles.detailIcon}/>
                                <View>
                                    <Text style={styles.detailLabel}>Preferences</Text>
                                    <Paragraph>{client.preferences}</Paragraph>
                                </View>
                            </View>
                        ) : null}
                        {client.notes ? (
                            <View style={styles.detailItem}>
                                <MaterialCommunityIcons name="note-text-outline" size={20} style={styles.detailIcon}/>
                                <View>
                                    <Text style={styles.detailLabel}>Notes</Text>
                                    <Paragraph>{client.notes}</Paragraph>
                                </View>
                            </View>
                        ) : null}
                         {!client.preferences && !client.notes && (
                            <Paragraph style={styles.noDataText}>No preferences or notes added.</Paragraph>
                         )}
                    </Card.Content>
                </Card>
                
                <Card style={styles.card}>
                    <Card.Content>
                        <Title style={styles.cardTitle}>Record Information</Title>
                        <Divider style={styles.divider}/>
                        <Paragraph style={styles.recordText}>Status: {client.status?.toUpperCase() || 'N/A'}</Paragraph>
                        <Paragraph style={styles.recordText}>Created: {createdAt}</Paragraph>
                        <Paragraph style={styles.recordText}>Last Updated: {updatedAt}</Paragraph>
                        {/* Consider adding Created By user later */}
                    </Card.Content>
                </Card>

                {/* Placeholder for Orders List for this client - Future */}
                {/* <Card style={styles.card}><Card.Content><Title>Recent Orders</Title><Paragraph>...</Paragraph></Card.Content></Card> */}

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa' // Light background
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp('5%')
    },
    errorText: {
        fontSize: wp('4.5%'),
        color: 'red',
        textAlign: 'center',
        marginBottom: hp('2%')
    },
    scrollContainer: {
        padding: wp('4%'),
        paddingBottom: hp('5%'),
    },
    card: {
        marginBottom: hp('2%'),
        elevation: 2,
    },
    cardTitle: {
        marginBottom: hp('1%'),
        fontSize: wp('5%'),
        color: '#343a40'
    },
    divider: {
        marginBottom: hp('1.5%'),
    },
    disabledText: {
        color: '#adb5bd' // Grey out text if no data
    },
    detailItem: {
        flexDirection: 'row',
        marginBottom: hp('1.5%'),
    },
    detailIcon: {
        marginRight: wp('3%'),
        color: '#495057'
    },
    detailLabel: {
        fontSize: wp('3.8%'),
        color: '#6c757d',
        marginBottom: hp('0.5%')
    },
    recordText: {
        fontSize: wp('3.8%'),
        color: '#495057',
        marginBottom: hp('0.8%')
    },
    noDataText: {
        fontStyle: 'italic',
        color: '#adb5bd',
        textAlign: 'center',
        marginTop: hp('1%')
    }
});

export default ClientDetailsScreen; 