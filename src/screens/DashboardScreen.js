import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  StatusBar,
  FlatList,
  useColorScheme,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [summaryData, setSummaryData] = useState([
    {
      icon: "briefcase",
      label: "Total Projects",
      value: "0",
      iconColor: "#0047CC",
    },
    {
      icon: "dollar-sign",
      label: "Total Profit",
      value: "$0",
      iconColor: "#4CAF50",
    },
    {
      icon: "arrow-up",
      label: "Income",
      value: "$0",
      iconColor: "#2196F3",
    },
    {
      icon: "arrow-down",
      label: "Expenses",
      value: "$0",
      iconColor: "#F44336",
    },
  ]);

  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Listener for employees
    const employeesUnsubscribe = onSnapshot(
      collection(db, "employees"),
      (snapshot) => {
        const employeesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployees(employeesList);
      },
      (error) => {
        console.error("Error fetching employees: ", error);
      }
    );

    // Listener for clients
    const clientsUnsubscribe = onSnapshot(
      collection(db, "clients"),
      (clientsSnapshot) => {
        const clientsList = clientsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClients(clientsList);
      },
      (error) => {
        console.error("Error fetching clients: ", error);
      }
    );

    // Listener for orders
    const ordersUnsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        let ordersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort orders by createdAt in descending order
        ordersList.sort((a, b) => {
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(0);
          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(0);
          return dateB - dateA; // Descending order
        });

        setOrders(ordersList);

        // Fetch clients and calculate summary data
        const clientsUnsubscribe = onSnapshot(
          collection(db, "clients"),
          (clientsSnapshot) => {
            const clientsList = clientsSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Calculate totals
            const totalProjects = ordersList.length;

            const totalClientBudget = clientsList.reduce((sum, client) => {
              return sum + (Number(client.budget) || 0);
            }, 0);

            const totalOrderAmount = ordersList.reduce((sum, order) => {
              return sum + (Number(order.amount) || 0);
            }, 0);

            const totalProfit = totalClientBudget - totalOrderAmount;

            // Update summaryData
            setSummaryData([
              {
                icon: "briefcase",
                label: "Total Projects",
                value: totalProjects.toString(),
                iconColor: "#0047CC",
              },
              {
                icon: "dollar-sign",
                label: "Total Profit",
                value: `$${totalProfit.toLocaleString()}`,
                iconColor: "#4CAF50",
              },
              {
                icon: "arrow-up",
                label: "Income",
                value: `$${totalClientBudget.toLocaleString()}`,
                iconColor: "#2196F3",
              },
              {
                icon: "arrow-down",
                label: "Expenses",
                value: `$${totalOrderAmount.toLocaleString()}`,
                iconColor: "#F44336",
              },
            ]);
          },
          (error) => {
            console.error("Error fetching clients: ", error);
            Alert.alert(
              "Error",
              "Failed to load clients data. Please try again."
            );
          }
        );

        // Cleanup clients listener when orders change
        return () => clientsUnsubscribe();
      },
      (error) => {
        console.error("Error fetching orders: ", error);
        Alert.alert("Error", "Failed to load orders data. Please try again.");
      }
    );

    // Cleanup listeners on component unmount
    return () => {
      ordersUnsubscribe();
      employeesUnsubscribe();
      clientsUnsubscribe();
    };
  }, []);

  const getIconColor = (status) => {
    switch (status?.toLowerCase()) {
      case "in-progress":
        return "#0047CC";
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#F44336";
      default:
        return "#0047CC";
    }
  };

  const renderOrderCard = ({ item: order }) => {
    const employee = employees.find((emp) => emp.id === order.employeeId);
    const employeeName = employee ? employee.fullName : "N/A";

    const client = clients.find((cli) => cli.id === order.clientId);
    const clientName = client ? client.fullName : "N/A";

    const statusColor = getIconColor(order.status);

    return (
      <View
        style={[
          styles.orderItem,
          { backgroundColor: colorScheme === "dark" ? "#2A2A2A" : "#fff" },
        ]}
      >
        <View style={styles.orderHeader}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: colorScheme === "dark" ? "#3A3A3A" : "#F3F4F6",
              },
            ]}
          >
            <Ionicons name="person" size={24} color={statusColor} />
          </View>
          <View style={styles.orderDetails}>
            <Text
              style={[
                styles.orderName,
                { color: colorScheme === "dark" ? "#fff" : "#000" },
              ]}
            >
              {order.name || order.title}
            </Text>
            <Text style={[styles.orderMeta, { color: statusColor }]}>
              {order.status} · Due:{" "}
              {order.due ||
                (order.deadline?.toDate
                  ? order.deadline.toDate().toLocaleDateString()
                  : "N/A")}
            </Text>
          </View>
          <Text
            style={[
              styles.orderAmount,
              { color: colorScheme === "dark" ? "#fff" : "#000" },
            ]}
          >
            ${Number(order.amount).toLocaleString()}
          </Text>
        </View>
        <View
          style={[
            styles.orderFooter,
            { borderTopColor: colorScheme === "dark" ? "#444" : "#E5E7EB" },
          ]}
        >
          <Text
            style={[
              styles.orderAssigned,
              { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
            ]}
          >
            Assigned to: {employeeName}
          </Text>
          <Text
            style={[
              styles.orderClient,
              { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
            ]}
          >
            Client: {clientName}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "#FFFFFF" },
      ]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colorScheme === "light" ? "white" : "black"}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(12) }}
      >
        {/* Header with Profile Button */}
        <LinearGradient
          colors={["#1E3A8A", "#3B82F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Rcm</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <View style={styles.profileButton}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Summary Cards */}
        <View
          style={[
            styles.summaryContainer,
            { backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "#fff" },
          ]}
        >
          {summaryData.map((item, index) => (
            <View
              key={index}
              style={[
                styles.card,
                {
                  backgroundColor: colorScheme === "dark" ? "#2A2A2A" : "#fff",
                },
              ]}
            >
              <FontAwesome5
                name={item.icon}
                size={wp(6)}
                color={item.iconColor}
              />
              <Text
                style={[
                  styles.cardLabel,
                  { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
                ]}
              >
                {item.label.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: colorScheme === "dark" ? "#fff" : "#000" },
                ]}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colorScheme === "dark" ? "#3B82F6" : "#0047CC" },
            ]}
          >
            Recent Orders
          </Text>
          {orders.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
              ]}
            >
              No recent orders available.
            </Text>
          ) : (
            <FlatList
              data={orders.slice(0, 2)} // Limit to the first two orders
              renderItem={renderOrderCard}
              keyExtractor={(item) => item.id}
              style={styles.ordersList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ListFooterComponent={<View style={{ height: hp(2) }} />}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: wp("5%"),
    paddingVertical: hp("2%"),
    borderBottomLeftRadius: wp("8%"),
    borderBottomRightRadius: wp("8%"),
    marginBottom: hp("2%"),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: hp("3%"),
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: wp("5%"),
    paddingVertical: hp("2%"),
  },
  card: {
    width: wp("42%"),
    padding: wp("4%"),
    borderRadius: wp("5%"),
    marginBottom: hp("2%"),
    alignItems: "flex-start",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardLabel: {
    fontSize: wp("3%"),
    marginTop: hp("1%"),
    fontWeight: "600",
  },
  cardValue: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    marginTop: hp("0.5%"),
  },
  section: {
    padding: hp(2),
  },
  sectionTitle: {
    fontSize: hp("2.5%"),
    fontWeight: "bold",
    marginBottom: hp("1%"),
  },
  ordersList: {
    maxHeight: hp(40),
  },
  orderItem: {
    borderRadius: 20,
    marginBottom: hp(2),
    padding: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  orderDetails: {
    flex: 1,
    marginLeft: 12,
  },
  orderName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  orderMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  orderAssigned: {
    fontSize: 14,
  },
  orderClient: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyText: {
    fontSize: hp(2),
    textAlign: "center",
    marginVertical: hp(2),
  },
});
