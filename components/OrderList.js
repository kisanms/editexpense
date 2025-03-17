import { FlatList, Text, View } from 'react-native';

export default function OrderList({ orders }) {
  const renderItem = ({ item }) => (
    <View className="flex-row border-b p-2">
      <Text className="flex-1">{item.realtorName}</Text>
      <Text className="flex-1">{item.address}</Text>
      <Text className="flex-1">₹{item.charge}</Text>
      <Text className="flex-1">₹{item.editorPayment}</Text>
      <Text className="flex-1">{item.deliveryDate}</Text>
    </View>
  );

  return (
    <FlatList
      data={orders}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={() => (
        <View className="flex-row bg-gray-200 p-2">
          <Text className="flex-1 font-bold">Realtor</Text>
          <Text className="flex-1 font-bold">Address</Text>
          <Text className="flex-1 font-bold">Charge</Text>
          <Text className="flex-1 font-bold">Editor Pay</Text>
          <Text className="flex-1 font-bold">Delivery</Text>
        </View>
      )}
    />
  );
}
