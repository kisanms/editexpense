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
import RecentOrders from "../../component/RecentOrders"; // Import the new component
import RecentClients from "../../component/RecentClients"; // Import the new component

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
            { backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "#2563EB" },
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

        {/* Recent Orders Component */}
        <RecentOrders
          orders={orders}
          employees={employees}
          clients={clients}
          colorScheme={colorScheme}
        />
        {/* Recent Clients Component */}
        <RecentClients
          clients={clients}
          colorScheme={colorScheme}
          navigation={navigation}
        />
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
    marginBottom: hp("-3%"),
  },
  card: {
    width: wp("44%"),
    padding: wp("4%"),
    marginBottom: hp("1%"),
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
});
