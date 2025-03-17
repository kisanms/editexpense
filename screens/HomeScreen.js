import { useEffect } from 'react';
import { View, Button } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { setOrders } from '../redux/orderSlice';
import OrderList from '../components/OrderList';
import { exportToPDF, exportToExcel } from '../services/exportData';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const orders = useSelector((state) => state.orders.orders);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orderData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      dispatch(setOrders(orderData));
    });
    return () => unsubscribe();
  }, [dispatch]);

  return (
    <View className="flex-1 p-4">
      <Button title="Add New Order" onPress={() => navigation.navigate('AddOrder')} />
      <OrderList orders={orders} />
      <View className="mt-4">
        <Button title="Export to PDF" onPress={() => exportToPDF(orders)} />
        <Button title="Export to Excel" onPress={() => exportToExcel(orders)} color="green" />
      </View>
    </View>
  );
}
