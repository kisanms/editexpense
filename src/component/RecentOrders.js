import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { FontAwesome5 } from "@expo/vector-icons";
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
import { useColorScheme } from "react-native";

const getTheme = (colorScheme) => ({
  colors: {
    primary: colorScheme === "dark" ? "#60A5FA" : "#1E3A8A",
    error: colorScheme === "dark" ? "#F87171" : "#B91C1C",
    background: colorScheme === "dark" ? "#1F2937" : "#F3F4F6",
    text: colorScheme === "dark" ? "#F3F4F6" : "#1F2937",
    placeholder: colorScheme === "dark" ? "#9CA3AF" : "#6B7280",
    surface: colorScheme === "dark" ? "#2A2A2A" : "#FFFFFF",
  },
});

const getStatusColor = (status, colorScheme) => {
  switch (status?.toLowerCase()) {
    case "in-progress":
      return "#38B2AC";
    case "completed":
      return "#38B2AC";
    case "cancelled":
      return "#F87171";
    default:
      return colorScheme === "dark" ? "#A0A0A0" : "#6B7280";
  }
};

const RecentOrders = ({ navigation }) => {
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

  const renderOrderItem = ({ item }) => {
    const statusColor = getStatusColor(item.status, colorScheme);

    return (
      <Pressable
        onPress={() => navigation.navigate("OrderDetails", { order: item })}
        style={[styles.orderItem, { backgroundColor: theme.colors.surface }]}
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
            <FontAwesome5
              name="file-invoice"
              size={wp("4.5%")}
              color={statusColor}
            />
          </View>
          <View style={styles.orderDetails}>
            <View style={styles.headerRow}>
              <Text
                style={[
                  styles.orderName,
                  { color: colorScheme === "dark" ? "#fff" : "#000" },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[styles.orderStatus, { color: statusColor }]}
                numberOfLines={1}
              >
                {item.status}
              </Text>
            </View>
            <View style={styles.headerRow}>
              <Text
                style={[
                  styles.orderMeta,
                  { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
                ]}
                numberOfLines={1}
              >
                {clients[item.clientId]?.fullName || "Loading..."}
              </Text>
              <Text
                style={[
                  styles.orderMeta,
                  { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
                  { textAlign: "right" },
                ]}
                numberOfLines={1}
              >
                {employees[item.employeeId]?.fullName || "Loading..."}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.orderFooter,
            { borderTopColor: colorScheme === "dark" ? "#444" : "#E5E7EB" },
          ]}
        >
          <Text
            style={[
              styles.orderAmount,
              { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
            ]}
            numberOfLines={1}
          >
            {item.projectId
              ? projects[item.projectId]?.projectName || "Loading..."
              : "No Project"}
          </Text>
          <Text
            style={[
              styles.orderAmount,
              { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
              { textAlign: "right" },
            ]}
            numberOfLines={1}
          >
            ${item.amount.toLocaleString()}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colorScheme === "dark" ? "#3B82F6" : "#0047CC" },
          ]}
        >
          Recent Orders
        </Text>
        <Pressable
          onPress={() => navigation.navigate("Orders")}
          style={styles.viewAll}
        >
          <Text
            style={[
              styles.viewAllText,
              { color: colorScheme === "dark" ? "#3B82F6" : "#0047CC" },
            ]}
          >
            View All
          </Text>
        </Pressable>
      </View>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.ordersList}
        ItemSeparatorComponent={() => <View style={{ width: wp("3%") }} />}
        initialNumToRender={2}
        windowSize={3}
        ListFooterComponent={<View style={{ width: wp("3%") }} />}
        snapToInterval={wp("83%")}
        snapToAlignment="start"
        decelerationRate="fast"
        ListEmptyComponent={
          <Text
            style={[
              styles.emptyText,
              { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
            ]}
          >
            No recent orders found.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: wp("5%"),
    marginTop: hp("0.2%"),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1),
  },
  sectionTitle: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  viewAll: {
    padding: wp("2%"),
  },
  viewAllText: {
    fontSize: wp("4%"),
    fontWeight: "500",
  },
  ordersList: {
    flexGrow: 0,
    marginBottom: hp("-4%"),
  },
  orderItem: {
    width: wp("80%"),
    padding: wp("3.5%"),
    borderRadius: 12,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.15,
    // shadowRadius: 3,
    // elevation: 4,
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
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp("0.6%"),
  },
  orderName: {
    fontSize: wp("3.5%"),
    fontWeight: "bold",
    flex: 1,
  },
  orderStatus: {
    fontSize: wp("3.2%"),
    fontWeight: "500",
    textTransform: "capitalize",
    flex: 1,
    textAlign: "right",
  },
  orderMeta: {
    fontSize: wp("3.2%"),
    opacity: 0.9,
    flex: 1,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp("1.5%"),
    paddingTop: hp("1.5%"),
    borderTopWidth: 0.5,
  },
  orderAmount: {
    fontSize: wp("3.2%"),
    opacity: 0.9,
    flex: 1,
  },
  emptyText: {
    fontSize: hp("2%"),
    textAlign: "center",
    marginVertical: hp("2%"),
  },
});

export default React.memo(RecentOrders);
