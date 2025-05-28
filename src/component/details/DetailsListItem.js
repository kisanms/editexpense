import React from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Card, Text, Chip } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { format } from "date-fns";

const DetailsListItem = ({ item, type, screenInfo, theme, navigation }) => {
  const colorScheme = useColorScheme();

  // Status color logic aligned with RecentOrders and OrdersScreen
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "in-progress":
      case "completed":
        return {
          bg: colorScheme === "dark" ? "#2DD4BF20" : "#E6FFFA",
          text: "#38B2AC",
          border: "#38B2AC",
        };
      case "cancelled":
        return {
          bg: colorScheme === "dark" ? "#F8717120" : "#FEE2E2",
          text: "#F87171",
          border: "#F87171",
        };
      default:
        return {
          bg: colorScheme === "dark" ? "#4B556320" : "#F3F4F620",
          text: colorScheme === "dark" ? "#A0A0A0" : "#6B7280",
          border: colorScheme === "dark" ? "#A0A0A0" : "#6B7280",
        };
    }
  };

  const statusColor =
    type === "projects"
      ? getStatusColor(item.status)
      : { text: screenInfo.color };
  const displayStatus = item.status
    ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()
    : type === "projects"
    ? "In-progress"
    : "N/A";

  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() => {
        if (type === "projects") {
          navigation.navigate("ProjectDetailsScreen", {
            project: { ...item, clientId: item.clientId },
          });
        }
      }}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <FontAwesome5
              name={screenInfo.icon}
              size={wp(4)}
              color={statusColor.text}
              style={styles.icon}
            />
            <Text
              style={[styles.itemTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {type === "projects" || type === "profits" || type === "income"
                ? item.projectName || item.title || "N/A"
                : item.title || "N/A"}
            </Text>
          </View>
          {type === "projects" ? (
            <Chip
              mode="outlined"
              style={[
                styles.statusChip,
                {
                  borderColor: statusColor.border,
                  backgroundColor: statusColor.bg,
                },
              ]}
              textStyle={[styles.chipText, { color: statusColor.text }]}
            >
              {displayStatus}
            </Chip>
          ) : (
            <Text style={[styles.amount, { color: "#38B2AC" }]}>
              {type === "profits"
                ? item.profit && !isNaN(Number(item.profit))
                  ? `$${Number(item.profit).toLocaleString()}`
                  : "N/A"
                : item.amount && !isNaN(Number(item.amount))
                ? `$${Number(item.amount).toLocaleString()}`
                : "N/A"}
            </Text>
          )}
        </View>

        <View style={styles.detailsContainer}>
          {type === "projects" || type === "income" ? (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: theme.placeholder }]}>
                  Client:
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {item.clientName || "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: theme.placeholder }]}>
                  {type === "income" ? "Amount" : "Budget"}:
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {type === "income"
                    ? item.amount && !isNaN(Number(item.amount))
                      ? `$${Number(item.amount).toLocaleString()}`
                      : "N/A"
                    : item.budget && !isNaN(Number(item.budget))
                    ? `$${Number(item.budget).toLocaleString()}`
                    : "N/A"}
                </Text>
              </View>
              {item.description && (
                <Text
                  style={[styles.description, { color: theme.placeholder }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              )}
            </>
          ) : type === "profits" ? (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: theme.placeholder }]}>
                  Client:
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {item.clientName || "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: theme.placeholder }]}>
                  In-Amount:
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {item.budget && !isNaN(Number(item.budget))
                    ? `$${Number(item.budget).toLocaleString()}`
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: theme.placeholder }]}>
                  Ex-Amount:
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {item.totalExpense && !isNaN(Number(item.totalExpense))
                    ? `$${Number(item.totalExpense).toLocaleString()}`
                    : "N/A"}
                </Text>
              </View>
              {item.description && (
                <Text
                  style={[styles.description, { color: theme.placeholder }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              )}
            </>
          ) : (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: theme.placeholder }]}>
                  Client:
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {item.clientName || "N/A"}
                </Text>
              </View>
              {item.projectId && (
                <View style={styles.detailRow}>
                  <Text style={[styles.label, { color: theme.placeholder }]}>
                    Project:
                  </Text>
                  <Text style={[styles.value, { color: theme.text }]}>
                    {item.projectName || "N/A"}
                  </Text>
                </View>
              )}
              {type === "expenses" && (
                <View style={styles.detailRow}>
                  <Text style={[styles.label, { color: theme.placeholder }]}>
                    Employee:
                  </Text>
                  <Text style={[styles.value, { color: theme.text }]}>
                    {item.employeeName || "N/A"}
                  </Text>
                </View>
              )}
              {item.description && (
                <Text
                  style={[styles.description, { color: theme.placeholder }]}
                  numberOfLines={2}
                >
                  <Text style={[styles.value, { color: theme.text }]}>
                    Description: {item.description || "N/A"}
                  </Text>
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.date, { color: theme.text }]}>
            Created Date:{" "}
            {item.createdAt?.toDate
              ? format(item.createdAt.toDate(), "MMM dd, yyyy")
              : format(new Date(item.createdAt), "MMM dd, yyyy")}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: wp(3),
    marginHorizontal: wp(1),
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1),
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: wp(2),
  },
  itemTitle: {
    fontSize: wp(4),
    fontWeight: "600",
    flex: 1,
  },
  statusChip: {
    height: hp(4),
    paddingHorizontal: wp(1),
    borderWidth: 1,
  },
  chipText: {
    textAlign: "center",
    fontSize: wp(3),
    fontWeight: "500",
  },
  amount: {
    fontSize: wp(4),
    fontWeight: "600",
  },
  detailsContainer: {
    marginBottom: hp(1),
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: hp(0.5),
  },
  label: {
    fontSize: wp(3.5),
    width: wp(20),
  },
  value: {
    fontSize: wp(3.5),
    flex: 1,
  },
  description: {
    fontSize: wp(3.5),
    marginTop: hp(0.5),
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
  },
  date: {
    fontSize: wp(3.2),
  },
});

export default DetailsListItem;
