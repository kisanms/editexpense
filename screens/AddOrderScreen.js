import OrderForm from 'components/OrderForm';
import { View, Text, TouchableOpacity } from 'react-native';

export default function AddOrderScreen({ navigation }) {
  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center bg-blue-500 p-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Text className="text-lg text-white">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Add New Order</Text>
      </View>
      <OrderForm navigation={navigation} />
    </View>
  );
}
