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
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import RecentOrders from "../../component/RecentOrders";
import RecentClients from "../../component/RecentClients";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const { user, userProfile, businessDetails } = useAuth();
  const [employees, setEmployees] = useState({});
  const [clients, setClients] = useState({});
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState({});
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

    // Fetch employees
    const employeesUnsubscribe = onSnapshot(
      query(
        collection(db, "employees"),
        where("businessId", "==", userProfile.businessId)
      ),
      (snapshot) => {
        const employeesData = {};
        snapshot.forEach((doc) => {
          employeesData[doc.id] = { id: doc.id, ...doc.data() };
        });
        setEmployees(employeesData);
      },
      (error) => {
        console.error("Error fetching employees: ", error);
      }
    );

    // Fetch clients
    const clientsUnsubscribe = onSnapshot(
      query(
        collection(db, "clients"),
        where("businessId", "==", userProfile.businessId)
      ),
      (snapshot) => {
        const clientsData = {};
        snapshot.forEach((doc) => {
          clientsData[doc.id] = { id: doc.id, ...doc.data() };
        });
        setClients(clientsData);
      },
      (error) => {
        console.error("Error fetching clients: ", error);
      }
    );

    // Fetch orders
    const ordersUnsubscribe = onSnapshot(
      query(
        collection(db, "orders"),
        where("businessId", "==", userProfile.businessId),
        orderBy("createdAt", "desc"),
        limit(10)
      ),
      (snapshot) => {
        const ordersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersList);
      },
      (error) => {
        console.error("Error fetching orders: ", error);
        Alert.alert("Error", "Failed to load orders data. Please try again.");
      }
    );

    // Fetch projects
    const projectsUnsubscribe = () => {
      const unsubscribes = [];
      Object.keys(clients).forEach((clientId) => {
        const projectQuery = query(
          collection(db, `clients/${clientId}/projects`),
          where("businessId", "==", userProfile.businessId)
        );
        const unsubscribe = onSnapshot(
          projectQuery,
          (snapshot) => {
            const projectsList = snapshot.docs.map((doc) => ({
              id: doc.id,
              clientId,
              ...doc.data(),
            }));
            setProjects((prev) => ({
              ...prev,
              ...Object.fromEntries(
                projectsList.map((project) => [project.id, project])
              ),
            }));
          },
          (error) => {
            console.error(
              `Error fetching projects for client ${clientId}: `,
              error
            );
          }
        );
        unsubscribes.push(unsubscribe);
      });
      return () => unsubscribes.forEach((unsub) => unsub());
    };

    // Delay project fetching until clients are loaded
    const timer = setTimeout(() => {
      if (Object.keys(clients).length > 0) {
        projectsUnsubscribe();
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      ordersUnsubscribe();
      employeesUnsubscribe();
      clientsUnsubscribe();
      projectsUnsubscribe();
    };
  }, [userProfile?.businessId, clients]);

  // Update summary data
  useEffect(() => {
    const totalProjects = Object.keys(projects).length;
    const totalProjectBudget = Object.values(projects).reduce(
      (sum, project) => {
        return sum + (Number(project.budget) || 0);
      },
      0
    );
    const totalOrderAmount = orders.reduce((sum, order) => {
      return sum + (Number(order.amount) || 0);
    }, 0);
    const totalProfit = totalProjectBudget - totalOrderAmount;

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
        value: `$${totalProjectBudget.toLocaleString()}`,
        iconColor: "#2196F3",
      },
      {
        icon: "arrow-down",
        label: "Expenses",
        value: `$${totalOrderAmount.toLocaleString()}`,
        iconColor: "#F44336",
      },
    ]);
  }, [orders, projects]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "#EFF6FF" },
      ]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colorScheme === "dark" ? "#1A1A1A" : "#EFF6FF"}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(12) }}
      >
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

        <View
          style={[styles.summaryContainer, { backgroundColor: "transparent" }]}
        >
          {summaryData.map((item, index) => (
            <View
              key={index}
              style={[
                styles.card,
                {
                  backgroundColor: colorScheme === "dark" ? "#2A2A2A" : "#fff",
                  borderWidth: colorScheme === "dark" ? 0 : 1,
                  borderColor: colorScheme === "dark" ? undefined : "#E5E7EB",
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

        <RecentOrders
          navigation={navigation}
          clients={clients}
          employees={employees}
          projects={projects}
          colorScheme={colorScheme}
        />
        <RecentClients
          clients={Object.values(clients)}
          projects={Object.values(projects)}
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
    marginBottom: hp("-4%"),
  },
  card: {
    width: wp("44%"),
    padding: wp("4%"),
    marginBottom: hp("1%"),
    alignItems: "flex-start",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
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
