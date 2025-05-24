import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import Ionicons from "@expo/vector-icons/Ionicons";

const getStatusColor = (status, colorScheme) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "#38B2AC";
    case "inactive":
      return "#F87171";
    default:
      return colorScheme === "dark" ? "#A0A0A0" : "#6B7280";
  }
};

const RecentClients = ({ clients, projects, colorScheme, navigation }) => {
  const renderClientCard = ({ item: client }) => {
    const statusColor = getStatusColor(client.status, colorScheme);
    const clientProjects = projects.filter((p) => p.clientId === client.id);
    const projectCount = clientProjects.length;
    const totalBudget = clientProjects.reduce((sum, project) => {
      return sum + (Number(project.budget) || 0);
    }, 0);

    return (
      <Pressable
        onPress={() => navigation.navigate("ClientDetails", { client })}
        style={[
          styles.clientItem,
          { backgroundColor: colorScheme === "dark" ? "#2A2A2A" : "#fff" },
        ]}
      >
        <View style={styles.clientHeader}>
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
          <View style={styles.clientDetails}>
            <View style={styles.headerRow}>
              <Text
                style={[
                  styles.clientName,
                  { color: colorScheme === "dark" ? "#fff" : "#000" },
                ]}
                numberOfLines={1}
              >
                {client.fullName}
              </Text>
              <Text
                style={[
                  styles.clientPaymentTerms,
                  { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
                ]}
                numberOfLines={1}
              >
                {client.paymentTerms || "N/A"}
              </Text>
            </View>
            <View style={styles.headerRow}>
              <Text
                style={[styles.clientMeta, { color: statusColor }]}
                numberOfLines={1}
              >
                {client.status || "Unknown"}
              </Text>
              <Text
                style={[
                  styles.clientProjectCount,
                  { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
                ]}
                numberOfLines={1}
              >
                {projectCount} Project{projectCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.clientFooter,
            { borderTopColor: colorScheme === "dark" ? "#444" : "#E5E7EB" },
          ]}
        >
          <Text
            style={[
              styles.clientBudget,
              { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
            ]}
            numberOfLines={1}
          >
            Total Budget: ${totalBudget.toLocaleString()}
          </Text>
        </View>
      </Pressable>
    );
  };

  // Filter and sort clients (active only, sorted by fullName)
  const recentClients = clients
    .filter((client) => client.status === "active")
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .slice(0, 2); // Limit to 2 clients

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colorScheme === "dark" ? "#3B82F6" : "#0047CC" },
        ]}
      >
        Recent Clients
      </Text>
      {recentClients.length === 0 ? (
        <Text
          style={[
            styles.emptyText,
            { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
          ]}
        >
          No recent clients available.
        </Text>
      ) : (
        <FlatList
          data={recentClients}
          renderItem={renderClientCard}
          keyExtractor={(item) => item.id}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={styles.clientsList}
          ItemSeparatorComponent={() => <View style={{ width: wp("3%") }} />}
          initialNumToRender={2}
          windowSize={3}
          ListFooterComponent={<View style={{ width: wp("3%") }} />}
          snapToInterval={wp("83%")} // Card width (80%) + separator (3%)
          snapToAlignment="start"
          decelerationRate="fast"
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
  clientsList: {
    flexGrow: 0,
  },
  clientItem: {
    width: wp("90%"),
    padding: wp("3.5%"),
    borderRadius: 12,
    shadowColor: "#000",
  },
  clientHeader: {
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
  clientDetails: {
    flex: 1,
    marginLeft: wp("2.8%"),
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp("0.6%"),
  },
  clientName: {
    fontSize: wp("3.5%"),
    fontWeight: "bold",
    flex: 1,
  },
  clientPaymentTerms: {
    fontSize: wp("3.2%"),
    opacity: 0.9,
    flex: 1,
    textAlign: "right",
  },
  clientMeta: {
    fontSize: wp("3.2%"),
    opacity: 0.8,
    flex: 1,
  },
  clientProjectCount: {
    fontSize: wp("3.2%"),
    opacity: 0.9,
    flex: 1,
    textAlign: "right",
  },
  clientFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp("1.5%"),
    paddingTop: hp("1.5%"),
    borderTopWidth: 0.5,
  },
  clientBudget: {
    fontSize: wp("3.2%"),
    opacity: 0.9,
    flex: 1,
  },
  emptyText: {
    fontSize: hp(2),
    textAlign: "center",
    marginVertical: hp(2),
  },
});

export default React.memo(RecentClients);
