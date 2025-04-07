import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, FlatList, Alert, ScrollView } from "react-native";
import {
  Appbar,
  List,
  FAB,
  ActivityIndicator,
  Text,
  Divider,
  Searchbar,
  Chip, // For status filtering
  SegmentedButtons, // Alternative filter
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const ORDER_STATUSES = [
  "pending",
  "in-progress",
  "completed",
  "delivered",
  "cancelled",
];

const OrderListScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' or specific status

  useEffect(() => {
    if (!userProfile?.businessId) {
      setLoading(false);
      Alert.alert("Error", "Cannot load orders: Business ID not found.");
      return;
    }

    setLoading(true);
    const ordersRef = collection(db, "orders");
    let q;

    // Base query: Filter by business and order by date
    const baseQueryConstraints = [
      where("businessId", "==", userProfile.businessId),
      orderBy("orderDate", "desc"), // Show newest first
    ];

    // Add status filter if not 'all'
    if (statusFilter !== "all") {
      q = query(
        ordersRef,
        ...baseQueryConstraints,
        where("status", "==", statusFilter)
      );
    } else {
      q = query(ordersRef, ...baseQueryConstraints);
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const ordersData = [];
        querySnapshot.forEach((doc) => {
          ordersData.push({ id: doc.id, ...doc.data() });
        });
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders: ", error);
        Alert.alert("Error", "Could not fetch order data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile?.businessId, statusFilter]);

  // Client-side search filtering (can be combined with server-side later if needed)
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    return orders.filter(
      (order) =>
        order.clientNameSnapshot
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.servicePackage
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) // Search by order ID too
    );
  }, [orders, searchQuery]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#ffcc00";
      case "in-progress":
        return "#007aff";
      case "completed":
        return "#34c759";
      case "delivered":
        return "#8e8e93";
      case "cancelled":
        return "#ff3b30";
      default:
        return "#8e8e93";
    }
  };

  const renderOrderItem = ({ item }) => (
    <List.Item
      title={`${item.servicePackage} - ${item.clientNameSnapshot}`}
      description={`Order Date: ${
        item.orderDate?.toDate ? format(item.orderDate.toDate(), "PP") : "N/A"
      }`}
      left={(props) => <List.Icon {...props} icon="receipt" />}
      right={(props) => (
        <View style={{ justifyContent: "center", marginRight: 8 }}>
          <Chip
            {...props}
            icon="circle-small"
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: "#fff", fontWeight: "bold" }}
          >
            {item.status?.replace("-", " ")}
          </Chip>
        </View>
      )}
      onPress={() => navigation.navigate("OrderDetails", { orderId: item.id })} // Navigate to details screen (create later)
      rippleColor="rgba(0, 0, 0, .1)"
    />
  );

  const renderEmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No orders found for the selected filter.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Orders" />
      </Appbar.Header>

      <Searchbar
        placeholder="Search Client, Service, ID..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* Status Filter Chips */}
      <View style={styles.chipContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            icon={statusFilter === "all" ? "check" : undefined}
            selected={statusFilter === "all"}
            onPress={() => setStatusFilter("all")}
            style={[styles.chip, statusFilter === "all" && styles.chipSelected]}
          >
            All
          </Chip>
          {ORDER_STATUSES.map((status) => (
            <Chip
              key={status}
              icon={statusFilter === status ? "check" : undefined}
              selected={statusFilter === status}
              onPress={() => setStatusFilter(status)}
              style={[
                styles.chip,
                { backgroundColor: getStatusColor(status) },
                statusFilter === status && styles.chipSelected,
              ]}
              textStyle={{ color: "#fff" }}
            >
              {status.replace("-", " ")}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
          <Text style={styles.loadingText}>Loading Orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={Divider}
          ListEmptyComponent={renderEmptyListComponent}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("AddEditOrder")} // Navigate to AddEditOrder screen
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: hp("2%"),
    fontSize: wp("4%"),
    color: "#666",
  },
  searchbar: {
    marginHorizontal: wp("2%"),
    marginTop: wp("2%"),
    elevation: 2,
  },
  chipContainer: {
    paddingVertical: hp("1%"),
    paddingHorizontal: wp("2%"),
  },
  chip: {
    marginRight: wp("2%"),
    height: hp(4.5),
    justifyContent: "center",
  },
  chipSelected: {
    borderColor: "#000",
    borderWidth: 1.5,
  },
  listContent: {
    flexGrow: 1, // Ensure empty list message shows correctly
    paddingBottom: hp("10%"), // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: hp("15%"),
    paddingHorizontal: wp("10%"),
  },
  emptyText: {
    fontSize: wp("4.5%"),
    color: "#888",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default OrderListScreen;
