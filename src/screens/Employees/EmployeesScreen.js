import React, { useState, useEffect } from "react";
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
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

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

export default function EmployeesScreen({ navigation }) {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
    fetchEmployees();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "employees"));
      const employeesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmployees(employeesList);
      setFilteredEmployees(employeesList);
    } catch (error) {
      console.error("Error fetching employees: ", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = employees.filter((employee) =>
      employee.fullName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const handleFilter = (filter) => {
    setSelectedFilter(filter);
    let filtered = [...employees];
    if (filter === "active") {
      filtered = employees.filter((employee) => employee.status === "active");
    } else if (filter === "inactive") {
      filtered = employees.filter((employee) => employee.status === "inactive");
    }
    setFilteredEmployees(filtered);
    setShowFilterModal(false);
  };

  const renderEmployeeCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("EmployeeDetails", { employee: item })}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={[styles.employeeName, { color: theme.colors.text }]}>
              {item.fullName}
            </Text>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                {
                  backgroundColor:
                    item.status === "active"
                      ? colorScheme === "dark"
                        ? "#2DD4BF20"
                        : "#D1FAE5"
                      : colorScheme === "dark"
                      ? "#F8717120"
                      : "#FEE2E2",
                  borderColor:
                    item.status === "active" ? "#38B2AC" : theme.colors.error,
                },
              ]}
              textStyle={[
                styles.statusText,
                {
                  color:
                    item.status === "active" ? "#38B2AC" : theme.colors.error,
                },
              ]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Chip>
          </View>
          <View style={styles.employeeInfo}>
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
            {/* <View style={styles.infoRow}>
              <FontAwesome5
                name="tools"
                size={wp(4)}
                color={theme.colors.placeholder}
              />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                {item.skills}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5
                name="briefcase"
                size={wp(4)}
                color={theme.colors.placeholder}
              />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                {item.experience} years experience
              </Text>
            </View> */}
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
          <Text style={styles.headerTitle}>Employees</Text>
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
          placeholder="Search employees..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          iconColor={theme.colors.primary}
          placeholderTextColor={theme.colors.placeholder}
          textColor={theme.colors.text}
          theme={theme}
        />

        <FlatList
          data={filteredEmployees}
          renderItem={renderEmployeeCard}
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
                No employees found
              </Text>
            </View>
          }
        />
      </Animated.View>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate("AddEmployee")}
        color="#FFFFFF"
        theme={theme}
      />

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
            Filter Employees
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
            All Employees
          </Button>
          <Button
            mode={selectedFilter === "active" ? "contained" : "outlined"}
            onPress={() => handleFilter("active")}
            style={styles.filterButton}
            theme={theme}
          >
            Active Employees
          </Button>
          <Button
            mode={selectedFilter === "inactive" ? "contained" : "outlined"}
            onPress={() => handleFilter("inactive")}
            style={styles.filterButton}
            theme={theme}
          >
            Inactive Employees
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
    elevation: 6,
    borderRadius: wp(4),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1.5),
    paddingHorizontal: wp(2),
  },
  employeeName: {
    fontSize: wp(5),
    fontWeight: "700",
    flex: 1,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: wp(2),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
  },
  statusText: {
    fontSize: wp(3.5),
    fontWeight: "600",
  },
  employeeInfo: {
    paddingHorizontal: wp(2),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1.2),
  },
  infoText: {
    fontSize: wp(3.8),
    marginLeft: wp(2.5),
    flex: 1,
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
