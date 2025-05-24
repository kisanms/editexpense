import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
  useColorScheme,
} from "react-native";
import {
  Text,
  Card,
  Chip,
  Searchbar,
  Menu,
  Divider,
  Button,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

const getTheme = (colorScheme) => ({
  colors: {
    primary: colorScheme === "dark" ? "#60A5FA" : "#1E3A8A",
    error: colorScheme === "dark" ? "#F87171" : "#B91C1C",
    background: colorScheme === "dark" ? "#1F2937" : "#F3F4F6",
    text: colorScheme === "dark" ? "#F3F4F6" : "#1F2937",
    placeholder: colorScheme === "dark" ? "#9CA3AF" : "#6B7280",
    surface: colorScheme === "dark" ? "#374151" : "#FFFFFF",
  },
  roundness: wp(2),
});

export default function OrdersScreen({ navigation }) {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [clients, setClients] = useState({});
  const [projects, setProjects] = useState({});
  const [employees, setEmployees] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [menuVisible, setMenuVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
    if (!userProfile?.businessId) {
      console.warn("No business ID found for user");
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const ordersQuery = query(
      collection(db, "orders"),
      where("businessId", "==", userProfile.businessId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
      const ordersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch client, project, and employee details
      const clientIds = [...new Set(ordersList.map((order) => order.clientId))];
      const employeeIds = [
        ...new Set(ordersList.map((order) => order.employeeId)),
      ];
      const projectIds = [
        ...new Set(
          ordersList
            .filter((order) => order.projectId)
            .map((order) => ({
              clientId: order.clientId,
              projectId: order.projectId,
            }))
        ),
      ];

      // Fetch clients
      const clientsData = {};
      await Promise.all(
        clientIds.map(async (clientId) => {
          const clientRef = doc(db, "clients", clientId);
          const clientDoc = await getDoc(clientRef);
          if (clientDoc.exists()) {
            clientsData[clientId] = { id: clientDoc.id, ...clientDoc.data() };
          }
        })
      );

      // Fetch projects
      const projectsData = {};
      await Promise.all(
        projectIds.map(async ({ clientId, projectId }) => {
          const projectRef = doc(db, `clients/${clientId}/projects`, projectId);
          const projectDoc = await getDoc(projectRef);
          if (projectDoc.exists()) {
            projectsData[projectId] = {
              id: projectDoc.id,
              ...projectDoc.data(),
            };
          }
        })
      );

      // Fetch employees
      const employeesData = {};
      await Promise.all(
        employeeIds.map(async (employeeId) => {
          const employeeRef = doc(db, "employees", employeeId);
          const employeeDoc = await getDoc(employeeRef);
          if (employeeDoc.exists()) {
            employeesData[employeeId] = {
              id: employeeDoc.id,
              ...employeeDoc.data(),
            };
          }
        })
      );

      setClients(clientsData);
      setProjects(projectsData);
      setEmployees(employeesData);
      setOrders(ordersList);
      applyFilters(ordersList, searchQuery, statusFilter);
    });

    return () => unsubscribe();
  }, [userProfile?.businessId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const applyFilters = (ordersList, query, status) => {
    let filtered = [...ordersList];

    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.title?.toLowerCase().includes(lowercaseQuery) ||
          order.description?.toLowerCase().includes(lowercaseQuery) ||
          clients[order.clientId]?.fullName
            ?.toLowerCase()
            .includes(lowercaseQuery) ||
          projects[order.projectId]?.projectName
            ?.toLowerCase()
            .includes(lowercaseQuery) ||
          employees[order.employeeId]?.fullName
            ?.toLowerCase()
            .includes(lowercaseQuery)
      );
    }

    if (status !== "all") {
      filtered = filtered.filter((order) => order.status === status);
    }

    setFilteredOrders(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFilters(orders, query, statusFilter);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    applyFilters(orders, searchQuery, status);
    setMenuVisible(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "in-progress":
        return {
          bg: colorScheme === "dark" ? "#3B82F620" : "#EFF6FF",
          text: theme.colors.primary,
          border: theme.colors.primary,
        };
      case "completed":
        return {
          bg: colorScheme === "dark" ? "#2DD4BF20" : "#E6FFFA",
          text: "#38B2AC",
          border: "#38B2AC",
        };
      case "cancelled":
        return {
          bg: colorScheme === "dark" ? "#F8717120" : "#FEE2E2",
          text: theme.colors.error,
          border: theme.colors.error,
        };
      default:
        return {
          bg: colorScheme === "dark" ? "#4B5563" : "#F3F4F6",
          text: theme.colors.placeholder,
          border: theme.colors.placeholder,
        };
    }
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("OrderDetails", { order: item })}
    >
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={4}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={[styles.orderTitle, { color: theme.colors.text }]}>
              {item.title}
            </Text>
            <Chip
              mode="outlined"
              style={[
                styles.statusChip,
                {
                  backgroundColor: getStatusColor(item.status).bg,
                  borderColor: getStatusColor(item.status).border,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status).text },
                ]}
              >
                {item.status}
              </Text>
            </Chip>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5
              name="user"
              size={wp(3.5)}
              color={theme.colors.placeholder}
            />
            <Text
              style={[styles.infoText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {clients[item.clientId]?.fullName || "Loading..."}
            </Text>
          </View>
          {item.projectId && (
            <View style={styles.infoRow}>
              <FontAwesome5
                name="folder"
                size={wp(3.5)}
                color={theme.colors.placeholder}
              />
              <Text
                style={[styles.infoText, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {projects[item.projectId]?.projectName || "Loading..."}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <FontAwesome5
              name="user-tie"
              size={wp(3.5)}
              color={theme.colors.placeholder}
            />
            <Text
              style={[styles.infoText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {employees[item.employeeId]?.fullName || "Loading..."}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5
              name="dollar-sign"
              size={wp(3.5)}
              color={theme.colors.placeholder}
            />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              ${item.amount}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5
              name="calendar"
              size={wp(3.5)}
              color={theme.colors.placeholder}
            />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Due: {item.deadline?.toDate?.().toLocaleDateString() || "N/A"}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#111827", "#1E40AF"]
            : ["#1E3A8A", "#3B82F6"]
        }
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Orders</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddOrder")}
            style={styles.addButton}
          >
            <FontAwesome5 name="plus" size={wp(5)} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Searchbar
          placeholder="Search orders..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          inputStyle={{ color: theme.colors.text }}
          iconColor={theme.colors.primary}
          placeholderTextColor={theme.colors.placeholder}
          theme={theme}
        />

        <View style={styles.filterContainer}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                style={styles.filterButton}
                labelStyle={{ color: theme.colors.primary }}
                icon="filter"
                theme={theme}
              >
                Filter: {statusFilter}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => handleStatusFilter("all")}
              title="All"
              leadingIcon="format-list-bulleted"
              titleStyle={{ color: theme.colors.text }}
            />
            <Divider />
            <Menu.Item
              onPress={() => handleStatusFilter("in-progress")}
              title="In Progress"
              leadingIcon="progress-clock"
              titleStyle={{ color: theme.colors.text }}
            />
            <Menu.Item
              onPress={() => handleStatusFilter("completed")}
              title="Completed"
              leadingIcon="check-circle"
              titleStyle={{ color: theme.colors.text }}
            />
            <Menu.Item
              onPress={() => handleStatusFilter("cancelled")}
              title="Cancelled"
              leadingIcon="close-circle"
              titleStyle={{ color: theme.colors.text }}
            />
          </Menu>
        </View>

        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No orders found.
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: hp(3),
    paddingHorizontal: wp(4),
    borderBottomLeftRadius: wp(6),
    borderBottomRightRadius: wp(6),
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: wp(6),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  addButton: {
    padding: wp(2.5),
    borderRadius: wp(2),
  },
  content: {
    flex: 1,
    padding: wp(4),
  },
  searchBar: {
    marginBottom: hp(2),
    borderRadius: wp(2),
    elevation: 2,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: hp(2),
  },
  filterButton: {
    borderColor: "#1E3A8A",
  },
  listContent: {
    paddingBottom: hp(2),
  },
  card: {
    marginBottom: hp(2),
    borderRadius: wp(4),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1),
  },
  orderTitle: {
    fontSize: wp(4.5),
    fontWeight: "600",
    flex: 1,
  },
  statusChip: {
    borderWidth: 1,
  },
  statusText: {
    fontSize: wp(3.5),
    fontWeight: "500",
    textTransform: "capitalize",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp(0.5),
  },
  infoText: {
    fontSize: wp(3.8),
    marginLeft: wp(2),
    flex: 1,
  },
  emptyText: {
    fontSize: wp(4),
    textAlign: "center",
    marginTop: hp(5),
  },
});
