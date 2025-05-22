import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import Ionicons from "@expo/vector-icons/Ionicons";

const getIconColor = (status, colorScheme) => {
  switch (status?.toLowerCase()) {
    case "in-progress":
      return colorScheme === "dark" ? "#00F0FF" : "#0047CC";
    case "completed":
      return "#4CAF50";
    case "cancelled":
      return "#F44336";
    default:
      return "#0047CC";
  }
};

const RecentOrders = ({ orders, employees, clients, colorScheme }) => {
  const renderOrderCard = ({ item: order }) => {
    const employee = employees.find((emp) => emp.id === order.employeeId);
    const employeeName = employee ? employee.fullName : "N/A";

    const client = clients.find((cli) => cli.id === order.clientId);
    const clientName = client ? client.fullName : "N/A";

    const statusColor = getIconColor(order.status, colorScheme);

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
          data={orders.slice(0, 2)}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={styles.ordersList}
          ItemSeparatorComponent={() => <View style={{ width: wp("3%") }} />}
          initialNumToRender={2}
          windowSize={3}
          ListFooterComponent={<View style={{ width: wp("3%") }} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: wp("5%"),
    marginTop: hp("0.2%"),
  },
  sectionTitle: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    marginBottom: hp("2%"),
    letterSpacing: 0.5,
  },
  ordersList: {
    flexGrow: 0,
  },
  orderItem: {
    width: wp("85%"), // Fixed width for horizontal cards
    padding: wp("3.5%"),
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

export default React.memo(RecentOrders);
