import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  RefreshControl,
  useColorScheme,
} from "react-native";
import {
  Text,
  Searchbar,
  Card,
  Chip,
  FAB,
  Portal,
  Modal,
  Button,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

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
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
    fetchOrders();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchOrders = async () => {
    try {
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      let ordersList = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      ordersList = await Promise.all(
        ordersList.map(async (order) => {
          let clientName = "Unknown Client";
          let employeeName = "Unknown Employee";

          if (order.clientId) {
            const clientDoc = await getDoc(doc(db, "clients", order.clientId));
            if (clientDoc.exists()) {
              clientName = clientDoc.data().fullName || "Unknown Client";
            }
          }

          if (order.employeeId) {
            const employeeDoc = await getDoc(
              doc(db, "employees", order.employeeId)
            );
            if (employeeDoc.exists()) {
              employeeName = employeeDoc.data().fullName || "Unknown Employee";
            }
          }

          return {
            ...order,
            clientName,
            employeeName,
          };
        })
      );

      ordersList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });

      setOrders(ordersList);
      setFilteredOrders(ordersList);
    } catch (error) {
      console.error("Error fetching orders: ", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = orders.filter((order) =>
      order.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredOrders(filtered);
  };

  const handleFilter = (filter) => {
    setSelectedFilter(filter);
    let filtered = [...orders];
    if (filter === "in-progress") {
      filtered = orders.filter((order) => order.status === "in-progress");
    } else if (filter === "completed") {
      filtered = orders.filter((order) => order.status === "completed");
    } else if (filter === "cancelled") {
      filtered = orders.filter((order) => order.status === "cancelled");
    }
    setFilteredOrders(filtered);
    setShowFilterModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "in-progress":
        return {
          bg: colorScheme === "dark" ? "#3B82F620" : "#EFF6FF",
          border: theme.colors.primary,
          text: theme.colors.primary,
        };
      case "completed":
        return {
          bg: colorScheme === "dark" ? "#2DD4BF20" : "#ECFDF5",
          border: "#10B981",
          text: "#10B981",
        };
      case "cancelled":
        return {
          bg: colorScheme === "dark" ? "#F8717120" : "#FEF2F2",
          border: theme.colors.error,
          text: theme.colors.error,
        };
      default:
        return {
          bg: colorScheme === "dark" ? "#4B5563" : "#F3F4F6",
          border: theme.colors.placeholder,
          text: theme.colors.placeholder,
        };
    }
  };

  const renderOrderCard = ({ item }) => {
    const statusColors = getStatusColor(item.status);
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("OrderDetails", { order: item })}
      >
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
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
                    backgroundColor: statusColors.bg,
                    borderColor: statusColors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: statusColors.text,
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </Chip>
            </View>
            <View style={styles.orderInfo}>
              <View style={styles.infoRow}>
                <FontAwesome5
                  name="user"
                  size={wp(4)}
                  color={theme.colors.placeholder}
                />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  {item.clientName || "N/A"}
                </Text>
              </View>
              {/* <View style={styles.infoRow}>
                <FontAwesome5
                  name="user-tie"
                  size={wp(4)}
                  color={theme.colors.placeholder}
                />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  {item.employeeName || "N/A"}
                </Text>
              </View> */}
              {/* <View style={styles.infoRow}>
                <FontAwesome5
                  name="dollar-sign"
                  size={wp(4)}
                  color={theme.colors.placeholder}
                />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  ${item.amount}
                </Text>
              </View> */}
              <View style={styles.infoRow}>
                <FontAwesome5
                  name="calendar"
                  size={wp(4)}
                  color={theme.colors.placeholder}
                />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  Deadline:{" "}
                  {item.deadline?.toDate().toLocaleDateString() || "N/A"}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

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
            onPress={() => setShowFilterModal(true)}
            style={styles.filterButton}
          >
            <FontAwesome5 name="filter" size={wp(5)} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Searchbar
          placeholder="Search orders..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          iconColor={theme.colors.primary}
          placeholderTextColor={theme.colors.placeholder}
          textColor={theme.colors.text}
          theme={theme}
        />

        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                No orders found
              </Text>
            </View>
          }
        />

        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          onPress={() => navigation.navigate("AddOrder")}
          color="#FFFFFF"
          theme={theme}
        />
      </Animated.View>

      <Portal>
        <Modal
          visible={showFilterModal}
          onDismiss={() => setShowFilterModal(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>
            Filter Orders
          </Text>
          <Divider
            style={[
              styles.modalDivider,
              { backgroundColor: theme.colors.placeholder },
            ]}
          />
          <Button
            mode={selectedFilter === "all" ? "contained" : "outlined"}
            onPress={() => handleFilter("all")}
            style={styles.filterButton}
            theme={theme}
          >
            All Orders
          </Button>
          <Button
            mode={selectedFilter === "in-progress" ? "contained" : "outlined"}
            onPress={() => handleFilter("in-progress")}
            style={styles.filterButton}
            theme={theme}
          >
            In Progress
          </Button>
          <Button
            mode={selectedFilter === "completed" ? "contained" : "outlined"}
            onPress={() => handleFilter("completed")}
            style={styles.filterButton}
            theme={theme}
          >
            Completed
          </Button>
          <Button
            mode={selectedFilter === "cancelled" ? "contained" : "outlined"}
            onPress={() => handleFilter("cancelled")}
            style={styles.filterButton}
            theme={theme}
          >
            Cancelled
          </Button>
        </Modal>
      </Portal>
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
  filterButton: {
    padding: wp(2.5),
    borderRadius: wp(2),
  },
  content: {
    flex: 1,
  },
  searchBar: {
    margin: wp(4),
    elevation: 2,
  },
  listContent: {
    padding: wp(4),
    paddingBottom: hp(20),
  },
  card: {
    marginBottom: hp(2),
    elevation: 2,
    borderRadius: wp(3),
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
  },
  statusChip: {
    height: hp(4),
  },
  statusText: {
    fontSize: wp(3.5),
    fontWeight: "600",
  },
  orderInfo: {
    marginTop: hp(1),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(0.5),
  },
  infoText: {
    fontSize: wp(3.5),
    marginLeft: wp(2),
  },
  fab: {
    position: "absolute",
    margin: wp(4),
    right: 0,
    bottom: hp(10),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: hp(5),
  },
  emptyText: {
    fontSize: wp(4),
  },
  modalContent: {
    padding: wp(5),
    margin: wp(5),
    borderRadius: wp(4),
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: wp(5.5),
    fontWeight: "700",
    marginBottom: hp(2),
  },
  modalDivider: {
    marginBottom: hp(2),
  },
  filterButton: {
    marginBottom: hp(1),
  },
});
