import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  useColorScheme,
  Linking,
  StatusBar,
  TouchableWithoutFeedback,
} from "react-native";
import {
  Text,
  Searchbar,
  Card,
  FAB,
  Portal,
  Modal,
  Button,
  Divider,
  Surface,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

const getTheme = (colorScheme) => ({
  colors: {
    primary: colorScheme === "dark" ? "#60A5FA" : "#1E3A8A",
    error: colorScheme === "dark" ? "#F87171" : "#B91C1C",
    background: colorScheme === "dark" ? "#1A1A1A" : "#EFF6FF",
    text: colorScheme === "dark" ? "#F3F4F6" : "#1F2937",
    placeholder: colorScheme === "dark" ? "#9CA3AF" : "#6B7280",
    surface: colorScheme === "dark" ? "#2A2A2A" : "#FFFFFF",
    emailIcon: "#E5B800", // Dark yellow for email icon
    phoneIcon: "#39FF14", // Neon green for phone icon
  },
  roundness: wp(3),
});

export default function ClientsScreen({ navigation }) {
  const { userProfile } = useAuth();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
    // Status bar configuration
    StatusBar.setBarStyle(
      colorScheme === "dark" ? "light-content" : "dark-content"
    );
    StatusBar.setBackgroundColor("transparent");
    StatusBar.setTranslucent(true);
  }, [colorScheme]);

  const fetchClients = async () => {
    try {
      if (!userProfile?.businessId) {
        console.warn("No business ID found for user");
        return;
      }

      setRefreshing(true);
      const q = query(
        collection(db, "clients"),
        where("businessId", "==", userProfile.businessId)
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
      if (userProfile?.businessId) {
        fetchClients();
      }
    }, [userProfile?.businessId])
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
    if (filter === "aToZ") {
      filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (filter === "zToA") {
      filtered.sort((a, b) => b.fullName.localeCompare(a.fullName));
    }
    setFilteredClients(filtered);
    setShowFilterModal(false);
  };

  const handleEmailPress = (email) => {
    Linking.openURL(`mailto:${email}`).catch((err) =>
      console.error("Error opening email: ", err)
    );
  };

  const handlePhonePress = (phone) => {
    Linking.openURL(`tel:${phone}`).catch((err) =>
      console.error("Error making call: ", err)
    );
  };

  const renderClientCard = ({ item }) => (
    <TouchableWithoutFeedback
      onPress={() => navigation.navigate("ClientDetails", { client: item })}
    >
      <Card
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderWidth: colorScheme === "dark" ? 0 : 1,
            borderColor: colorScheme === "dark" ? undefined : "#E5E7EB",
          },
        ]}
      >
        <LinearGradient
          colors={
            colorScheme === "dark"
              ? ["#2A2A2A", "#2A2A2A80"]
              : ["#FFFFFF", "#FFFFFF"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.nameContainer}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text
                      style={[
                        styles.avatarText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {item.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  {/* {item.status === "active" && (
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: theme.colors.accent },
                      ]}
                    />
                  )} */}
                </View>
                <View style={styles.nameAndIcons}>
                  <Text
                    style={[styles.clientName, { color: theme.colors.text }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.fullName}
                  </Text>
                  <View style={styles.contactRow}>
                    <TouchableWithoutFeedback
                      onPress={() => handleEmailPress(item.email)}
                    >
                      <Surface
                        style={[
                          styles.iconSurface,
                          { backgroundColor: theme.colors.background },
                        ]}
                      >
                        <FontAwesome5
                          name="envelope"
                          size={wp(4)}
                          color={theme.colors.emailIcon}
                        />
                      </Surface>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback
                      onPress={() => handlePhonePress(item.phone)}
                    >
                      <Surface
                        style={[
                          styles.iconSurface,
                          { backgroundColor: theme.colors.background },
                        ]}
                      >
                        <FontAwesome5
                          name="phone"
                          size={wp(4)}
                          color={theme.colors.phoneIcon}
                        />
                      </Surface>
                    </TouchableWithoutFeedback>
                  </View>
                </View>
              </View>
            </View>
            {item.company && (
              <Text
                style={[
                  styles.companyName,
                  { color: theme.colors.placeholder },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.company}
              </Text>
            )}
          </Card.Content>
        </LinearGradient>
      </Card>
    </TouchableWithoutFeedback>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#1A1A1A", "#1A1A1A"]
            : ["#0047CC", "#0047CC"]
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
            <FontAwesome5 name="filter" size={wp(5)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
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
              <MaterialIcons
                name="people-outline"
                size={wp(15)}
                color={theme.colors.placeholder}
              />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                No clients found
              </Text>
              <Text
                style={[
                  styles.emptySubText,
                  { color: theme.colors.placeholder },
                ]}
              >
                Add a new client to get started
              </Text>
            </View>
          }
        />

        <FAB
          style={[styles.fab, { backgroundColor: "#0047CC" }]}
          icon="plus"
          onPress={() => navigation.navigate("AddClient")}
          color="#FFFFFF"
          theme={theme}
        />
      </View>

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
            Sort Clients
          </Text>
          <Divider
            style={[
              styles.modalDivider,
              { backgroundColor: theme.colors.placeholder },
            ]}
          />
          <Button
            mode={selectedFilter === "none" ? "contained" : "outlined"}
            onPress={() => handleFilter("none")}
            style={styles.filterButton}
            theme={theme}
          >
            Default
          </Button>
          <Button
            mode={selectedFilter === "aToZ" ? "contained" : "outlined"}
            onPress={() => handleFilter("aToZ")}
            style={styles.filterButton}
            theme={theme}
          >
            Name (A to Z)
          </Button>
          <Button
            mode={selectedFilter === "zToA" ? "contained" : "outlined"}
            onPress={() => handleFilter("zToA")}
            style={styles.filterButton}
            theme={theme}
          >
            Name (Z to A)
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
    paddingHorizontal: wp(5),
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
    width: "100%",
  },
  headerTitle: {
    fontSize: wp(6),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  filterButton: {
    padding: wp(2),
    borderRadius: wp(2),
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  searchBar: {
    marginVertical: hp(2),
    elevation: 2,
    borderRadius: wp(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listContent: {
    paddingBottom: hp(20),
  },
  card: {
    marginBottom: hp(2),
    borderRadius: 20,
    backgroundColor: "#FFFFFF", // Explicit background color
  },
  cardGradient: {
    borderRadius: 16,
    padding: wp(1),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1),
    marginTop: hp(0.5),
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: wp(3),
  },
  avatar: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: wp(5),
    fontWeight: "bold",
  },
  statusDot: {
    position: "absolute",
    top: -wp(1),
    right: -wp(1),
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    // shadowColor: "#34D399",
    // shadowOffset: { width: 0, height: 0 },
    // shadowOpacity: 0.5,
    // shadowRadius: 4,
    // elevation: 2,
  },
  nameAndIcons: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clientName: {
    fontSize: wp(4.5),
    fontWeight: "600",
    flexShrink: 1,
    marginRight: wp(2),
  },
  companyName: {
    fontSize: wp(3.5),
    marginBottom: hp(1),
    opacity: 0.8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
  },
  iconContainer: {
    marginRight: wp(2),
  },
  iconSurface: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: "center",
    alignItems: "center",
    // elevation: 2,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
  },
  fab: {
    position: "absolute",
    margin: wp(4),
    right: 0,
    bottom: hp(11),
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
    fontWeight: "600",
  },
  emptySubText: {
    fontSize: wp(3.5),
    marginTop: hp(1),
    opacity: 0.8,
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
