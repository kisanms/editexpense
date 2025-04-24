import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  RefreshControl,
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
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { useFocusEffect } from "@react-navigation/native";

export default function ClientsScreen({ navigation }) {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchClients = async () => {
    try {
      setRefreshing(true);
      // Fetch only active clients
      const q = query(
        collection(db, "clients"),
        where("status", "==", "active")
      );
      const querySnapshot = await getDocs(q);
      const clientsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientsList);
      setFilteredClients(clientsList);
    } catch (error) {
      console.error("Error fetching clients: ", error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchClients();
    }, [])
  );

  const onRefresh = useCallback(() => {
    fetchClients();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = clients.filter((client) =>
      client.fullName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredClients(filtered);
  };

  const handleFilter = (filter) => {
    setSelectedFilter(filter);
    let filtered = [...clients];
    if (filter === "active") {
      filtered = clients.filter((client) => client.status === "active");
    } else if (filter === "inactive") {
      filtered = []; // No inactive clients since we only fetch active ones
    } else {
      filtered = clients; // All clients (only active ones)
    }
    setFilteredClients(filtered);
    setShowFilterModal(false);
  };

  const renderClientCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("ClientDetails", { client: item })}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={styles.clientName}>{item.fullName}</Text>
            <Chip
              mode="outlined"
              style={[
                styles.statusChip,
                {
                  backgroundColor: "#E6FFFA",
                  borderColor: "#38B2AC",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: "#38B2AC",
                  },
                ]}
              >
                Active
              </Text>
            </Chip>
          </View>
          <View style={styles.clientInfo}>
            <View style={styles.infoRow}>
              <FontAwesome5 name="envelope" size={wp(4)} color="#6B7280" />
              <Text style={styles.infoText}>{item.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5 name="phone" size={wp(4)} color="#6B7280" />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5
                name="map-marker-alt"
                size={wp(4)}
                color="#6B7280"
              />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.address || "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5 name="dollar-sign" size={wp(4)} color="#6B7280" />
              <Text style={styles.infoText}>
                Budget:{" "}
                {item.budget
                  ? `$${Number(item.budget).toLocaleString()}`
                  : "N/A"}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#1E3A8A", "#3B82F6"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Clients</Text>
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
          placeholder="Search clients..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#1E3A8A"
        />

        <FlatList
          data={filteredClients}
          renderItem={renderClientCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No clients found</Text>
            </View>
          }
        />

        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate("AddClient")}
          color="#FFFFFF"
        />
      </Animated.View>

      <Portal>
        <Modal
          visible={showFilterModal}
          onDismiss={() => setShowFilterModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Filter Clients</Text>
          <Divider style={styles.modalDivider} />
          <Button
            mode={selectedFilter === "all" ? "contained" : "outlined"}
            onPress={() => handleFilter("all")}
            style={styles.filterButton}
          >
            All Clients
          </Button>
          <Button
            mode={selectedFilter === "active" ? "contained" : "outlined"}
            onPress={() => handleFilter("active")}
            style={styles.filterButton}
          >
            Active Clients
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
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
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    padding: wp(4),
    paddingBottom: hp(20),
  },
  card: {
    marginBottom: hp(2),
    elevation: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: wp(5),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1),
  },
  clientName: {
    fontSize: wp(4.5),
    fontWeight: "600",
    color: "#1F2937",
  },
  statusChip: {
    height: hp(4),
  },
  statusText: {
    fontSize: wp(3.5),
    fontWeight: "600",
  },
  clientInfo: {
    marginTop: hp(1),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(0.5),
  },
  infoText: {
    fontSize: wp(3.5),
    color: "#6B7280",
    marginLeft: wp(2),
  },
  fab: {
    position: "absolute",
    margin: wp(4),
    right: 0,
    bottom: hp(10),
    backgroundColor: "#1E3A8A",
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
    color: "#6B7280",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
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
    color: "#1E3A8A",
    marginBottom: hp(2),
  },
  modalDivider: {
    backgroundColor: "#E5E7EB",
    marginBottom: hp(2),
  },
  filterButton: {
    marginBottom: hp(1),
  },
});
