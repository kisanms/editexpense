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
import { useAuth } from "../../context/AuthContext";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const { user, userProfile, businessDetails } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
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

  // Fetch data from Firestore
  useEffect(() => {
    if (!userProfile?.businessId) {
      console.warn("No business ID found for user");
      return;
    }

    // Listener for employees
    const employeesUnsubscribe = onSnapshot(
      query(
        collection(db, "employees"),
        where("businessId", "==", userProfile.businessId)
      ),
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
      query(
        collection(db, "clients"),
        where("businessId", "==", userProfile.businessId)
      ),
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
      query(
        collection(db, "orders"),
        where("businessId", "==", userProfile.businessId)
      ),
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
  }, [userProfile?.businessId]);

  // Update summaryData whenever orders or clients change
  useEffect(() => {
    const totalProjects = orders.length;
    const totalClientBudget = clients.reduce((sum, client) => {
      return sum + (Number(client.budget) || 0);
    }, 0);
    const totalOrderAmount = orders.reduce((sum, order) => {
      return sum + (Number(order.amount) || 0);
    }, 0);
    const totalProfit = totalClientBudget - totalOrderAmount;

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
  }, [orders, clients]);

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
            <Ionicons name="person" size={wp("4.5%")} color={statusColor} />
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
          colors={
            colorScheme === "dark"
              ? ["#1A1A1A", "#1A1A1A"]
              : ["#2563EB", "#2563EB"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.headerGradient,
            { backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "#2563EB" }
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Rcm</Text>
              <Text style={styles.welcomeText}>
                Welcome
                {businessDetails?.name ? `, ${businessDetails.name}` : ""}
              </Text>
              <Text style={styles.subtitle}>
                Manage your finances with ease
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              style={styles.profileButtonWrapper}
              activeOpacity={0.7}
            >
              <View style={styles.profileButton}>
                <Ionicons
                  name="person-circle-sharp"
                  size={64}
                  color="#FFFFFF"
                  style={{ marginLeft: wp(1) }}
                />
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
                size={wp(5)}
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: wp("4%"),
    fontWeight: "500",
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: hp("0.5%"),
  },
  subtitle: {
    fontSize: wp("3.5%"),
    color: "#FFFFFF",
    opacity: 0.7,
    marginTop: hp("0.3%"),
  },
  profileButtonWrapper: {
    marginLeft: wp("2%"),
  },
  profileButton: {
    padding: 0,
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
    width: wp("44%"),
    padding: wp("4%"),
    marginBottom: hp("2%"),
    alignItems: "flex-start",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardLabel: {
    fontSize: wp("3.5%"),
    marginTop: hp("1%"),
    fontWeight: "600",
    opacity: 0.8,
  },
  cardValue: {
    fontSize: wp("4.2%"),
    fontWeight: "bold",
    marginTop: hp("0.8%"),
  },
  section: {
    padding: wp("5%"),
    marginTop: hp("1%"),
  },
  sectionTitle: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    marginBottom: hp("2%"),
    letterSpacing: 0.5,
  },
  ordersList: {
    maxHeight: hp(45),
  },
  orderItem: {
    padding: wp("3.5%"),
    marginBottom: hp("2%"),
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp("1.2%"),
  },
  avatar: {
    width: wp("10%"),
    height: wp("10%"),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: wp("5%"),
  },
  orderDetails: {
    flex: 1,
    marginLeft: wp("2.8%"),
  },
  orderName: {
    fontSize: wp("3.5%"),
    fontWeight: "bold",
    marginBottom: hp("0.6%"),
  },
  orderMeta: {
    fontSize: wp("3.2%"),
    opacity: 0.8,
  },
  orderAmount: {
    fontSize: wp("3.5%"),
    fontWeight: "bold",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp("1.5%"),
    paddingTop: hp("1.5%"),
    borderTopWidth: 0.5,
  },
  orderAssigned: {
    fontSize: wp("3.2%"),
    opacity: 0.9,
  },
  orderClient: {
    fontSize: wp("3.2%"),
    marginTop: hp("0.5%"),
    opacity: 0.9,
  },
  emptyText: {
    fontSize: hp(2),
    textAlign: "center",
    marginVertical: hp(2),
  },
});
