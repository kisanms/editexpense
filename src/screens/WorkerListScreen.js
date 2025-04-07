import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, FlatList, Alert, ScrollView } from "react-native";
import {
  Appbar,
  List,
  FAB,
  ActivityIndicator,
  Text,
  Divider,
  Searchbar,
  Chip,
  Surface,
  useTheme,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";

const WORKER_ROLES = ["admin", "manager", "worker", "other"];
const WORKER_STATUSES = ["active", "inactive", "on-leave"];

const WorkerListScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!userProfile?.businessId) {
      setLoading(false);
      Alert.alert("Error", "Cannot load workers: Business ID not found.");
      return;
    }

    setLoading(true);
    const workersRef = collection(db, "workers");
    let q;

    // Base query: Filter by business and order by name
    const baseQueryConstraints = [
      where("businessId", "==", userProfile.businessId),
      orderBy("name", "asc"),
    ];

    // Add role filter if not 'all'
    if (roleFilter !== "all") {
      baseQueryConstraints.push(where("role", "==", roleFilter));
    }

    // Add status filter if not 'all'
    if (statusFilter !== "all") {
      baseQueryConstraints.push(where("status", "==", statusFilter));
    }

    q = query(workersRef, ...baseQueryConstraints);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const workersData = [];
        querySnapshot.forEach((doc) => {
          workersData.push({ id: doc.id, ...doc.data() });
        });
        setWorkers(workersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching workers: ", error);
        Alert.alert("Error", "Could not fetch worker data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile?.businessId, roleFilter, statusFilter]);

  // Client-side search filtering
  const filteredWorkers = useMemo(() => {
    if (!searchQuery) return workers;
    return workers.filter(
      (worker) =>
        worker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workers, searchQuery]);

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

  const renderWorkerItem = ({ item }) => (
    <List.Item
      title={item.name}
      description={`${item.role} • ${item.email}`}
      left={(props) => <List.Icon {...props} icon={getRoleIcon(item.role)} />}
      right={(props) => (
        <View style={{ justifyContent: "center", marginRight: 8 }}>
          <Chip
            {...props}
            icon="circle-small"
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: "#fff", fontWeight: "bold" }}
          >
            {item.status}
          </Chip>
        </View>
      )}
      onPress={() =>
        navigation.navigate("WorkerDetails", { workerId: item.id })
      }
      rippleColor="rgba(0, 0, 0, .1)"
    />
  );

  const renderEmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No workers found for the selected filters.
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={["#4c669f", "#3b5998", "#192f6a"]}
      style={styles.container}
    >
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="white" />
        <Appbar.Content title="Workers" color="white" />
      </Appbar.Header>

      <Surface style={styles.filterSurface} elevation={4}>
        <Searchbar
          placeholder="Search workers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <Chip
            selected={roleFilter === "all"}
            onPress={() => setRoleFilter("all")}
            style={styles.filterChip}
          >
            All Roles
          </Chip>
          {WORKER_ROLES.map((role) => (
            <Chip
              key={role}
              selected={roleFilter === role}
              onPress={() => setRoleFilter(role)}
              style={styles.filterChip}
            >
              {role}
            </Chip>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <Chip
            selected={statusFilter === "all"}
            onPress={() => setStatusFilter("all")}
            style={styles.filterChip}
          >
            All Statuses
          </Chip>
          {WORKER_STATUSES.map((status) => (
            <Chip
              key={status}
              selected={statusFilter === status}
              onPress={() => setStatusFilter(status)}
              style={[
                styles.filterChip,
                { backgroundColor: getStatusColor(status) },
              ]}
              textStyle={{ color: "#fff" }}
            >
              {status}
            </Chip>
          ))}
        </ScrollView>
      </Surface>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color="white" />
          <Text style={styles.loadingText}>Loading Workers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkers}
          renderItem={renderWorkerItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={Divider}
          ListEmptyComponent={renderEmptyListComponent}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("AddEditWorker")}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "transparent",
    elevation: 0,
  },
  filterSurface: {
    margin: wp("4%"),
    marginTop: hp("2%"),
    borderRadius: wp("2%"),
    backgroundColor: "white",
    elevation: 4,
  },
  searchbar: {
    margin: wp("2%"),
    elevation: 2,
  },
  filterScroll: {
    maxHeight: hp("6%"),
  },
  filterContent: {
    paddingHorizontal: wp("2%"),
    paddingBottom: hp("1%"),
  },
  filterChip: {
    marginRight: wp("2%"),
    marginBottom: hp("1%"),
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
  listContent: {
    paddingBottom: hp("10%"),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: hp("15%"),
    paddingHorizontal: wp("10%"),
  },
  emptyText: {
    fontSize: wp("4.5%"),
    color: "white",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default WorkerListScreen;
