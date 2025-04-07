import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Surface,
  useTheme,
  Chip,
  IconButton,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getWorkerById } from "../services/workerService";
import { format } from "date-fns";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";

const WorkerDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  const workerId = route.params?.workerId;

  useEffect(() => {
    if (workerId) {
      fetchWorker();
    }
  }, [workerId]);

  const fetchWorker = async () => {
    try {
      setLoading(true);
      const workerData = await getWorkerById(workerId);
      if (workerData) {
        setWorker(workerData);
      }
    } catch (error) {
      console.error("Error fetching worker:", error);
      Alert.alert("Error", "Could not fetch worker details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#34c759";
      case "inactive":
        return "#ff3b30";
      case "on-leave":
        return "#ffcc00";
      default:
        return "#8e8e93";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return "shield-account";
      case "manager":
        return "account-tie";
      case "worker":
        return "account-hard-hat";
      default:
        return "account";
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color="white" />
          <Text style={styles.loadingText}>Loading Worker Details...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!worker) {
    return (
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Worker not found</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#4c669f", "#3b5998", "#192f6a"]}
      style={styles.container}
    >
      <Surface style={styles.surface} elevation={4}>
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <Chip
              icon="circle-small"
              style={{ backgroundColor: getStatusColor(worker.status) }}
              textStyle={{ color: "#fff", fontWeight: "bold" }}
            >
              {worker.status}
            </Chip>
          </View>
          <IconButton
            icon="pencil"
            size={24}
            onPress={() => navigation.navigate("AddEditWorker", { workerId })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{worker.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{worker.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{worker.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleContainer}>
              <Chip icon={getRoleIcon(worker.role)} style={styles.roleChip}>
                {worker.role}
              </Chip>
            </View>
          </View>
        </View>

        {worker.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <Text style={styles.addressText}>{worker.address}</Text>
          </View>
        )}

        {worker.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{worker.notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Created At</Text>
            <Text style={styles.value}>
              {format(worker.createdAt.toDate(), "PPPp")}
            </Text>
          </View>
          {worker.updatedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Last Updated</Text>
              <Text style={styles.value}>
                {format(worker.updatedAt.toDate(), "PPPp")}
              </Text>
            </View>
          )}
        </View>
      </Surface>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: hp("2%"),
    fontSize: wp("4%"),
    color: "white",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: wp("4.5%"),
    color: "white",
  },
  surface: {
    margin: wp("4%"),
    marginTop: hp("2%"),
    padding: wp("4%"),
    borderRadius: wp("2%"),
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp("2%"),
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  section: {
    marginBottom: hp("3%"),
  },
  sectionTitle: {
    fontSize: wp("4.5%"),
    fontWeight: "bold",
    marginBottom: hp("1%"),
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp("1%"),
  },
  label: {
    fontSize: wp("4%"),
    color: "#666",
  },
  value: {
    fontSize: wp("4%"),
    color: "#333",
    fontWeight: "500",
  },
  roleContainer: {
    flexDirection: "row",
  },
  roleChip: {
    marginLeft: wp("2%"),
  },
  addressText: {
    fontSize: wp("4%"),
    color: "#333",
    lineHeight: hp("2.5%"),
  },
  notesText: {
    fontSize: wp("4%"),
    color: "#333",
    lineHeight: hp("2.5%"),
  },
});

export default WorkerDetailsScreen;
