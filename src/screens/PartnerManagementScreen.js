import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';

const PartnerManagementScreen = () => {
  const { business } = useAuth();
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    if (business) {
      const fetchPartners = async () => {
        const q = query(collection(db, 'businessMembers'), where('businessId', '==', business.businessId));
        const querySnapshot = await getDocs(q);
        const partnerList = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const userDoc = await getDoc(doc(db, 'users', doc.data().userId));
          return { id: doc.id, ...doc.data(), user: userDoc.data() };
        }));
        setPartners(partnerList);
      };
      fetchPartners();
    }
  }, [business]);

  return (
    <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.card}>
          <Text style={styles.title}>Partners</Text>
          {partners.map(partner => (
            <View key={partner.id} style={styles.partnerItem}>
              <Text>{partner.user.name} ({partner.role})</Text>
            </View>
          ))}
        </Surface>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  card: { padding: 20, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.95)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#3b5998', marginBottom: 10 },
  partnerItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' }
});

export default PartnerManagementScreen;