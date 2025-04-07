import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, Text, Divider, Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const ClientListScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!userProfile?.businessId) {
      setLoading(false);
      Alert.alert("Error", "Cannot load clients: Business ID not found.");
      return;
    }

    setLoading(true);
    const clientsRef = collection(db, 'clients');
    // Query clients for the current business, order by name
    const q = query(
      clientsRef, 
      where("businessId", "==", userProfile.businessId),
      orderBy("name", "asc") 
    );

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData = [];
      querySnapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() });
      });
      setClients(clientsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching clients: ", error);
      Alert.alert("Error", "Could not fetch client data.");
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [userProfile?.businessId]);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderClientItem = ({ item }) => (
    <List.Item
      title={item.name}
      description={item.email || item.phone || 'No contact info'}
      left={props => <List.Icon {...props} icon="account-circle" />}
      onPress={() => navigation.navigate('ClientDetails', { clientId: item.id })}
      rippleColor="rgba(0, 0, 0, .1)"
    />
  );

  const renderEmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No clients found.</Text>
      <Text style={styles.emptySubText}>Tap the + button to add your first client.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Clients" />
        {/* Add maybe a filter/sort button later */}
      </Appbar.Header>

      <Searchbar
         placeholder="Search Clients..."
         onChangeText={setSearchQuery}
         value={searchQuery}
         style={styles.searchbar}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
          <Text style={styles.loadingText}>Loading Clients...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredClients}
          renderItem={renderClientItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={Divider}
          ListEmptyComponent={renderEmptyListComponent}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddEditClient')} // Navigate to Add/Edit screen (create later)
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    color: '#666',
  },
  searchbar: {
      margin: wp('2%'),
      elevation: 2,
  },
  listContent: {
    flexGrow: 1, // Ensure empty list message shows correctly
    paddingBottom: hp('10%'), // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('20%'),
    paddingHorizontal: wp('10%'),
  },
  emptyText: {
    fontSize: wp('5%'),
    color: '#888',
    marginBottom: hp('1%'),
  },
  emptySubText: {
      fontSize: wp('4%'),
      color: '#aaa',
      textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ClientListScreen; 