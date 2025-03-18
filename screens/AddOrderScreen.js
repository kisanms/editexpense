import React from 'react';
import { View, StyleSheet } from 'react-native';
import OrderForm from '../components/OrderForm';

const AddOrderScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <OrderForm navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default AddOrderScreen;
