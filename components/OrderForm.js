import { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function OrderForm({ navigation }) {
  const [order, setOrder] = useState({
    realtorName: '',
    address: '',
    charge: '',
    editorPayment: '',
    deliveryDate: '',
    email: '',
    contact: '',
  });

  const handleSubmit = async () => {
    await addDoc(collection(db, 'orders'), {
      ...order,
      charge: parseFloat(order.charge),
      editorPayment: parseFloat(order.editorPayment),
      createdAt: new Date(),
    });
    navigation.goBack();
  };

  return (
    <View className="p-4">
      <TextInput
        className="mb-2 border p-2"
        placeholder="Realtor Name"
        value={order.realtorName}
        onChangeText={(text) => setOrder({ ...order, realtorName: text })}
      />
      <TextInput
        className="mb-2 border p-2"
        placeholder="Address"
        value={order.address}
        onChangeText={(text) => setOrder({ ...order, address: text })}
      />
      <TextInput
        className="mb-2 border p-2"
        placeholder="Charge (₹)"
        value={order.charge}
        keyboardType="numeric"
        onChangeText={(text) => setOrder({ ...order, charge: text })}
      />
      <TextInput
        className="mb-2 border p-2"
        placeholder="Editor Payment (₹)"
        value={order.editorPayment}
        keyboardType="numeric"
        onChangeText={(text) => setOrder({ ...order, editorPayment: text })}
      />
      <TextInput
        className="mb-2 border p-2"
        placeholder="Delivery Date (e.g., 2025-03-20)"
        value={order.deliveryDate}
        onChangeText={(text) => setOrder({ ...order, deliveryDate: text })}
      />
      <TextInput
        className="mb-2 border p-2"
        placeholder="Email"
        value={order.email}
        onChangeText={(text) => setOrder({ ...order, email: text })}
      />
      <TextInput
        className="mb-2 border p-2"
        placeholder="Contact Number"
        value={order.contact}
        keyboardType="phone-pad"
        onChangeText={(text) => setOrder({ ...order, contact: text })}
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}
