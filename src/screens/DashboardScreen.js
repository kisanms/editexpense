import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  StatusBar,
  FlatList,
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
import { scale } from "react-native-size-matters";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [summaryData, setSummaryData] = useState([
    {
      icon: "briefcase",
      label: "Total Projects",
      value: "0",
      gradientColors: ["#0047CC", "#0047CC"],
    },
    {
      icon: "dollar-sign",
      label: "Total Profit",
      value: "$0",
      gradientColors: ["#4CAF50", "#4CAF50"],
    },
    {
      icon: "arrow-up",
      label: "Income",
      value: "$0",
      gradientColors: ["#2196F3", "#2196F3"],
    },
    {
      icon: "arrow-down",
      label: "Expenses",
      value: "$0",
      gradientColors: ["#F44336", "#F44336"],
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

        // Your existing client calculations can remain here or be moved below
      },
      (error) => {
        console.error("Error fetching clients: ", error);
      }
    );
    // Listener for orders
    const ordersUnsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const ordersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
                gradientColors: ["#0047CC", "#0047CC"],
              },
              {
                icon: "dollar-sign",
                label: "Total Profit",
                value: `$${totalProfit.toLocaleString()}`,
                gradientColors: ["#4CAF50", "#4CAF50"],
              },
              {
                icon: "arrow-up",
                label: "Income",
                value: `$${totalClientBudget.toLocaleString()}`,
                gradientColors: ["#2196F3", "#2196F3"],
              },
              {
                icon: "arrow-down",
                label: "Expenses",
                value: `$${totalOrderAmount.toLocaleString()}`,
                gradientColors: ["#F44336", "#F44336"],
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

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const getGradientColors = (status) => {
    switch (status?.toLowerCase()) {
      case "in-progress":
        return ["#0047CC", "#0047CC"];
      case "completed":
        return ["#4CAF50", "#4CAF50"];
      case "cancelled":
        return ["#F44336", "#F44336"];
      default:
        return ["#0047CC", "#0047CC"];
    }
  };

  const renderOrderCard = ({ item: order }) => {
    // Find the employee with matching ID
    const employee = employees.find((emp) => emp.id === order.employeeId);
    const employeeName = employee ? employee.fullName : "N/A";

    // Find the client with matching ID
    const client = clients.find((cli) => cli.id === order.clientId);
    const clientName = client ? client.fullName : "N/A";

    return (
      <LinearGradient
        colors={getGradientColors(order.status)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.orderItem}
      >
        <View style={styles.orderHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="white" />
          </View>
          <View style={styles.orderDetails}>
            <Text style={styles.orderName}>{order.name || order.title}</Text>

            <Text style={styles.orderMeta}>
              {order.status} · Due:{" "}
              {order.due ||
                (order.deadline?.toDate
                  ? order.deadline.toDate().toLocaleDateString()
                  : "N/A")}
            </Text>
          </View>
          <Text style={styles.orderAmount}>
            ${Number(order.amount).toLocaleString()}
          </Text>
        </View>
        <View style={styles.orderFooter}>
          <Text style={styles.orderAssigned}>Assigned to: {employeeName}</Text>
          <Text style={styles.orderClient}>Client: {clientName}</Text>
        </View>
      </LinearGradient>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(12) }} // Add bottom padding to ensure content isn't hidden behind buttons
      >
        {/* Header with Sign Out */}
        <LinearGradient
          colors={["#1E3A8A", "#3B82F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Rcm</Text>
            <TouchableOpacity onPress={handleSignOut}>
              <View style={styles.signOutButton}>
                <FontAwesome5 name="sign-out-alt" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          {summaryData.map((item, index) => (
            <LinearGradient
              key={index}
              colors={item.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <FontAwesome5 name={item.icon} size={24} color="#fff" />
              <Text style={styles.cardValue}>{item.value}</Text>
              <Text style={styles.cardLabel}>{item.label}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No recent orders available.</Text>
          ) : (
            <FlatList
              data={orders}
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

      {/* Action Buttons - Now outside ScrollView with absolute positioning */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("AddClient")}
        >
          <LinearGradient
            colors={["#4158D0", "#C850C0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnGradient}
          >
            <FontAwesome5 name="user-plus" size={20} color="#fff" />
            <Text style={styles.btnText}>Add Client</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("AddOrder")}
        >
          <LinearGradient
            colors={["#0BAB64", "#3BB78F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnGradient}
          >
            <FontAwesome5 name="file-invoice" size={20} color="#fff" />
            <Text style={styles.btnText}>New Order</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: wp("5%"),
    marginTop: hp("-3.5%"),
    marginBottom: hp(-2),
  },
  card: {
    width: width * 0.43,
    padding: 15,
    borderRadius: wp(5),
    marginBottom: hp(0.7),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardValue: {
    fontSize: hp(2.5),
    fontWeight: "bold",
    color: "#fff",
    marginVertical: hp(0.01),
  },
  cardLabel: {
    fontSize: hp(1.7),
    color: "rgba(255,255,255,0.8)",
  },
  section: {
    padding: hp(2),
  },
  sectionTitle: {
    fontSize: hp("2.5%"),
    fontWeight: "bold",
    marginBottom: hp("1%"),
    color: "#0047CC",
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
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  orderDetails: {
    flex: 1,
    marginLeft: 12,
  },
  orderName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  orderMeta: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  orderAssigned: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  orderClient: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: 2,
  },
  emptyText: {
    fontSize: hp(2),
    color: "#6B7280",
    textAlign: "center",
    marginVertical: hp(2),
  },
  fixedButtonContainer: {
    position: "absolute",
    bottom: scale(70),
    // left: 0,
    // right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 5,
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 15,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  signOutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});
