import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Text, Card, Chip } from "react-native-paper";
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
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

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

export default function RecentOrders({ navigation }) {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState({});
  const [projects, setProjects] = useState({});
  const [employees, setEmployees] = useState({});
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
    if (!userProfile?.businessId) {
      console.warn("No business ID found for user");
      return;
    }

    const ordersQuery = query(
      collection(db, "orders"),
      where("businessId", "==", userProfile.businessId),
      orderBy("createdAt", "desc"),
      limit(10)
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
    });

    return () => unsubscribe();
  }, [userProfile?.businessId]);

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
            <Text
              style={[styles.orderTitle, { color: theme.colors.text }]}
              numberOfLines={1}
            >
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
              name="dollar-sign"
              size={wp(3.5)}
              color={theme.colors.placeholder}
            />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              ${item.amount}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recent Orders
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Orders")}
          style={styles.viewAll}
        >
          <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            No recent orders found.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: wp(5.5),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  viewAll: {
    padding: wp(2),
  },
  viewAllText: {
    fontSize: wp(4),
    fontWeight: "500",
  },
  listContent: {
    paddingRight: wp(4),
  },
  card: {
    width: wp(70),
    marginRight: wp(4),
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
    fontSize: wp(4.2),
    fontWeight: "600",
    flex: 1,
  },
  statusChip: {
    borderWidth: 1,
  },
  statusText: {
    fontSize: wp(3.2),
    fontWeight: "500",
    textTransform: "capitalize",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp(0.5),
  },
  infoText: {
    fontSize: wp(3.5),
    marginLeft: wp(2),
    flex: 1,
  },
  emptyText: {
    fontSize: wp(4),
    textAlign: "center",
    marginVertical: hp(5),
  },
});
