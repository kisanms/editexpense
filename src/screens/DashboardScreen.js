import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();

  const summaryData = [
    {
      icon: "briefcase",
      label: "Total Projects",
      value: "24",
      gradientColors: ["#0047CC", "#0047CC"],
    },
    {
      icon: "dollar-sign",
      label: "Total Profit",
      value: "$12,500",
      gradientColors: ["#4CAF50", "#4CAF50"],
    },
    {
      icon: "arrow-up",
      label: "Income",
      value: "$18,000",
      gradientColors: ["#2196F3", "#2196F3"],
    },
    {
      icon: "arrow-down",
      label: "Expenses",
      value: "$5,500",
      gradientColors: ["#F44336", "#F44336"],
    },
  ];

  const orders = [
    {
      initials: "JD",
      name: "John Doe",
      status: "In-Progress",
      due: "Apr 20",
      assigned: "Jan Smith",
      amount: "$2,500",
      gradientColors: ["#0047CC", "#0047CC"],
    },
    {
      initials: "RJ",
      name: "Robert Johnson",
      status: "Pending",
      due: "Mar 25",
      assigned: "Michael B",
      amount: "$3,200",
      gradientColors: ["#F5A623", "#F5A623"],
    },
  ];

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Sign Out */}
        <LinearGradient
          colors={["#0047CC", "#0047CC"]}
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
          {orders.map((order, i) => (
            <LinearGradient
              key={i}
              colors={order.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.orderItem}
            >
              <View style={styles.orderHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{order.initials}</Text>
                </View>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderName}>{order.name}</Text>
                  <Text style={styles.orderMeta}>
                    {order.status} · Due: {order.due}
                  </Text>
                </View>
                <Text style={styles.orderAmount}>{order.amount}</Text>
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.orderAssigned}>
                  Assigned to: {order.assigned}
                </Text>
              </View>
            </LinearGradient>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
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
      </ScrollView>

      {/* Bottom Navigation */}
      {/* <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => navigation.navigate("Dashboard")}
        >
          <FontAwesome5 name="home" size={20} color="#0047CC" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("clientScreen")}
        >
          <FontAwesome5 name="users" size={20} color="#666" />
          <Text style={styles.navText}>Clients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <FontAwesome5 name="file-invoice-dollar" size={20} color="#666" />
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <FontAwesome5 name="chart-bar" size={20} color="#666" />
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>
      </View> */}
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
    paddingVertical: hp("3%"),
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
    marginTop: hp("-3%"),
  },
  card: {
    width: width * 0.43,
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginVertical: 5,
  },
  cardLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: hp("2.5%"),
    fontWeight: "bold",
    marginBottom: hp("1%"),
    color: "#0047CC",
  },
  orderItem: {
    borderRadius: 20,
    marginBottom: 15,
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
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  orderAssigned: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    marginTop: -30,
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
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  navItem: {
    alignItems: "center",
  },
  navItemActive: {
    backgroundColor: "rgba(0, 71, 204, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  navText: {
    color: "#666666",
    fontSize: 12,
    marginTop: 4,
  },
  navTextActive: {
    color: "#0047CC",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
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
