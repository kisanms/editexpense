import React, { useState, useEffect, useCallback } from "react";
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
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { useFocusEffect } from "@react-navigation/native";

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

export default function ClientsScreen({ navigation }) {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

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
      filtered = [];
    } else {
      filtered = clients;
    }
    setFilteredClients(filtered);
    setShowFilterModal(false);
  };

  const renderClientCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("ClientDetails", { client: item })}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={[styles.clientName, { color: theme.colors.text }]}>
              {item.fullName}
            </Text>
            <Chip
              mode="outlined"
              style={[
                styles.statusChip,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#2DD4BF20" : "#E6FFFA",
                  borderColor: "#38B2AC",
                },
              ]}
              textStyle={[styles.statusText, { color: "#38B2AC" }]}
            >
              Active
            </Chip>
          </View>
          <View style={styles.clientInfo}>
            <View style={styles.infoRow}>
              <FontAwesome5
                name="envelope"
                size={wp(4)}
                color={theme.colors.placeholder}
              />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                {item.email}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5
                name="phone"
                size={wp(4)}
                color={theme.colors.placeholder}
              />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                {item.phone}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5
                name="map-marker-alt"
                size={wp(4)}
                color={theme.colors.placeholder}
              />
              <Text
                style={[styles.infoText, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {item.address || "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5
                name="dollar-sign"
                size={wp(4)}
                color={theme.colors.placeholder}
              />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
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
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          iconColor={theme.colors.primary}
          placeholderTextColor={theme.colors.placeholder}
          textColor={theme.colors.text}
          theme={theme}
        />

        <FlatList
          data={filteredClients}
          renderItem={renderClientCard}
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
                No clients found
              </Text>
            </View>
          }
        />

        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          onPress={() => navigation.navigate("AddClient")}
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
            Filter Clients
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
            All Clients
          </Button>
          <Button
            mode={selectedFilter === "active" ? "contained" : "outlined"}
            onPress={() => handleFilter("active")}
            style={styles.filterButton}
            theme={theme}
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
