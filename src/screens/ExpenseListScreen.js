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
import { format } from "date-fns";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";

const EXPENSE_CATEGORIES = [
  "office-supplies",
  "travel",
  "marketing",
  "utilities",
  "rent",
  "equipment",
  "other",
];

const EXPENSE_STATUSES = ["pending", "approved", "rejected"];

const ExpenseListScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!userProfile?.businessId) {
      setLoading(false);
      Alert.alert("Error", "Cannot load expenses: Business ID not found.");
      return;
    }

    setLoading(true);
    const expensesRef = collection(db, "expenses");
    let q;

    // Base query: Filter by business and order by date
    const baseQueryConstraints = [
      where("businessId", "==", userProfile.businessId),
      orderBy("expenseDate", "desc"),
    ];

    // Add category filter if not 'all'
    if (categoryFilter !== "all") {
      baseQueryConstraints.push(where("category", "==", categoryFilter));
    }

    // Add status filter if not 'all'
    if (statusFilter !== "all") {
      baseQueryConstraints.push(where("status", "==", statusFilter));
    }

    q = query(expensesRef, ...baseQueryConstraints);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const expensesData = [];
        querySnapshot.forEach((doc) => {
          expensesData.push({ id: doc.id, ...doc.data() });
        });
        setExpenses(expensesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching expenses: ", error);
        Alert.alert("Error", "Could not fetch expense data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile?.businessId, categoryFilter, statusFilter]);

  // Client-side search filtering
  const filteredExpenses = useMemo(() => {
    if (!searchQuery) return expenses;
    return expenses.filter(
      (expense) =>
        expense.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#ffcc00";
      case "approved":
        return "#34c759";
      case "rejected":
        return "#ff3b30";
      default:
        return "#8e8e93";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "office-supplies":
        return "desk";
      case "travel":
        return "airplane";
      case "marketing":
        return "bullhorn";
      case "utilities":
        return "lightning-bolt";
      case "rent":
        return "home";
      case "equipment":
        return "tools";
      default:
        return "cash";
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const renderExpenseItem = ({ item }) => (
    <List.Item
      title={item.description || "No description"}
      description={`${format(
        item.expenseDate?.toDate ? item.expenseDate.toDate() : new Date(),
        "PP"
      )} • ${formatCurrency(item.amount)}`}
      left={(props) => (
        <List.Icon {...props} icon={getCategoryIcon(item.category)} />
      )}
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
        navigation.navigate("ExpenseDetails", { expenseId: item.id })
      }
      rippleColor="rgba(0, 0, 0, .1)"
    />
  );

  const renderEmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No expenses found for the selected filters.
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
        <Appbar.Content title="Expenses" color="white" />
      </Appbar.Header>

      <Surface style={styles.filterSurface} elevation={4}>
        <Searchbar
          placeholder="Search expenses..."
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
            selected={categoryFilter === "all"}
            onPress={() => setCategoryFilter("all")}
            style={styles.filterChip}
          >
            All Categories
          </Chip>
          {EXPENSE_CATEGORIES.map((category) => (
            <Chip
              key={category}
              selected={categoryFilter === category}
              onPress={() => setCategoryFilter(category)}
              style={styles.filterChip}
            >
              {category.replace("-", " ")}
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
          {EXPENSE_STATUSES.map((status) => (
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
          <Text style={styles.loadingText}>Loading Expenses...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={Divider}
          ListEmptyComponent={renderEmptyListComponent}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("AddEditExpense")}
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

export default ExpenseListScreen;
