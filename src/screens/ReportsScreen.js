import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Divider,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useAuth } from "../context/AuthContext";

const ReportsScreen = ({ navigation }) => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalClients: 0,
    activeClients: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
  });
  const [monthlyData, setMonthlyData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
      },
    ],
  });

  const fetchData = async () => {
    try {
      if (!userProfile?.businessId) {
        console.warn("No business ID found for user");
        return;
      }
      // Fetch orders for current business
      const ordersQuery = query(
        collection(db, "orders"),
        where("businessId", "==", userProfile.businessId)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch clients for current business
      const clientsQuery = query(
        collection(db, "clients"),
        where("businessId", "==", userProfile.businessId)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      const clients = clientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch employees for current business
      const employeesQuery = query(
        collection(db, "employees"),
        where("businessId", "==", userProfile.businessId)
      );
      const employeesSnapshot = await getDocs(employeesQuery);
      const employees = employeesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate statistics
      const totalOrders = orders.length;
      const activeOrders = orders.filter(
        (order) => order.status === "in-progress"
      ).length;
      const completedOrders = orders.filter(
        (order) => order.status === "completed"
      ).length;
      const cancelledOrders = orders.filter(
        (order) => order.status === "cancelled"
      ).length;
      const totalClients = clients.length;
      const activeClients = clients.filter(
        (client) => client.status === "active"
      ).length;
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter(
        (employee) => employee.status === "active"
      ).length;

      // Calculate financials
      const totalIncome = orders
        .filter((order) => order.status === "completed")
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const totalExpenses = employees
        .filter((employee) => employee.status === "active")
        .reduce((sum, employee) => sum + (employee.salary || 0), 0);
      const netProfit = totalIncome - totalExpenses;

      // Prepare monthly data for chart
      const monthlyIncome = {};
      orders
        .filter((order) => order.status === "completed")
        .forEach((order) => {
          const month = new Date(order.createdAt?.toDate()).toLocaleString(
            "default",
            {
              month: "short",
            }
          );
          monthlyIncome[month] =
            (monthlyIncome[month] || 0) + (order.totalAmount || 0);
        });

      const labels = Object.keys(monthlyIncome);
      const data = Object.values(monthlyIncome);

      setStats({
        totalOrders,
        activeOrders,
        completedOrders,
        cancelledOrders,
        totalClients,
        activeClients,
        totalEmployees,
        activeEmployees,
        totalIncome,
        totalExpenses,
        netProfit,
      });

      setMonthlyData({
        labels,
        datasets: [
          {
            data,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!userProfile?.businessId) {
      console.warn("No business ID found for user");
      return;
    }
    fetchData();
  }, [userProfile?.businessId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0047CC" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Business Reports</Title>
          <Paragraph style={styles.headerSubtitle}>
            Overview of your business performance
          </Paragraph>
        </View>

        {/* Financial Overview */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Financial Overview</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Income</Text>
                <Text style={[styles.statValue, styles.incomeText]}>
                  ${stats.totalIncome.toLocaleString()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Expenses</Text>
                <Text style={[styles.statValue, styles.expenseText]}>
                  ${stats.totalExpenses.toLocaleString()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Net Profit</Text>
                <Text
                  style={[
                    styles.statValue,
                    stats.netProfit >= 0 ? styles.profitText : styles.lossText,
                  ]}
                >
                  ${stats.netProfit.toLocaleString()}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Monthly Income Chart */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Monthly Income</Title>
            {monthlyData.labels.length > 0 ? (
              <LineChart
                data={monthlyData}
                width={Dimensions.get("window").width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 71, 204, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#0047CC",
                  },
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noDataText}>No data available</Text>
            )}
          </Card.Content>
        </Card>

        {/* Orders Overview */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Orders Overview</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Orders</Text>
                <Text style={styles.statValue}>{stats.totalOrders}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Active</Text>
                <Text style={styles.statValue}>{stats.activeOrders}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statValue}>{stats.completedOrders}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Cancelled</Text>
                <Text style={styles.statValue}>{stats.cancelledOrders}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Clients & Employees Overview */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Clients & Employees</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Clients</Text>
                <Text style={styles.statValue}>{stats.totalClients}</Text>
                <Text style={styles.statSubtext}>
                  {stats.activeClients} active
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Employees</Text>
                <Text style={styles.statValue}>{stats.totalEmployees}</Text>
                <Text style={styles.statSubtext}>
                  {stats.activeEmployees} active
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Export Reports Button */}
        <Button
          mode="contained"
          onPress={() => {
            // Implement export functionality
          }}
          style={styles.exportButton}
          labelStyle={styles.exportButtonLabel}
        >
          Export Reports
        </Button>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    padding: wp("5%"),
    backgroundColor: "#0047CC",
  },
  headerTitle: {
    color: "#fff",
    fontSize: wp("6%"),
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#fff",
    opacity: 0.8,
    marginTop: hp("0.5%"),
  },
  card: {
    margin: wp("4%"),
    borderRadius: 15,
    elevation: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: hp("2%"),
  },
  statItem: {
    width: "48%",
    marginBottom: hp("2%"),
    backgroundColor: "#f8f8f8",
    padding: wp("3%"),
    borderRadius: 10,
  },
  statLabel: {
    fontSize: wp("3.5%"),
    color: "#666",
    marginBottom: hp("0.5%"),
  },
  statValue: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    color: "#0047CC",
  },
  statSubtext: {
    fontSize: wp("3%"),
    color: "#666",
    marginTop: hp("0.5%"),
  },
  incomeText: {
    color: "#2ecc71",
  },
  expenseText: {
    color: "#e74c3c",
  },
  profitText: {
    color: "#2ecc71",
  },
  lossText: {
    color: "#e74c3c",
  },
  chart: {
    marginVertical: hp("2%"),
    borderRadius: 16,
  },
  noDataText: {
    textAlign: "center",
    marginVertical: hp("2%"),
    color: "#666",
  },
  exportButton: {
    margin: wp("4%"),
    marginTop: hp("1%"),
    marginBottom: hp("4%"),
    backgroundColor: "#0047CC",
    paddingVertical: hp("1.5%"),
    borderRadius: 10,
  },
  exportButtonLabel: {
    fontSize: wp("4%"),
    fontWeight: "bold",
  },
});

export default ReportsScreen;
