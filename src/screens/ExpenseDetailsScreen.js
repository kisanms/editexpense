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
import { getExpenseById } from "../services/expenseService";
import { format } from "date-fns";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";

const ExpenseDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  const expenseId = route.params?.expenseId;

  useEffect(() => {
    if (expenseId) {
      fetchExpense();
    }
  }, [expenseId]);

  const fetchExpense = async () => {
    try {
      setLoading(true);
      const expenseData = await getExpenseById(expenseId);
      if (expenseData) {
        setExpense(expenseData);
      }
    } catch (error) {
      console.error("Error fetching expense:", error);
      Alert.alert("Error", "Could not fetch expense details");
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color="white" />
          <Text style={styles.loadingText}>Loading Expense Details...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!expense) {
    return (
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Expense not found</Text>
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
              style={{ backgroundColor: getStatusColor(expense.status) }}
              textStyle={{ color: "#fff", fontWeight: "bold" }}
            >
              {expense.status}
            </Chip>
          </View>
          <IconButton
            icon="pencil"
            size={24}
            onPress={() => navigation.navigate("AddEditExpense", { expenseId })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{expense.description}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatCurrency(expense.amount)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              <Chip
                icon={getCategoryIcon(expense.category)}
                style={styles.categoryChip}
              >
                {expense.category.replace("-", " ")}
              </Chip>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {format(expense.expenseDate.toDate(), "PPP")}
            </Text>
          </View>
        </View>

        {expense.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{expense.notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Created By</Text>
            <Text style={styles.value}>{expense.createdByUid}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Created At</Text>
            <Text style={styles.value}>
              {format(expense.createdAt.toDate(), "PPPp")}
            </Text>
          </View>
          {expense.updatedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Last Updated</Text>
              <Text style={styles.value}>
                {format(expense.updatedAt.toDate(), "PPPp")}
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
  categoryContainer: {
    flexDirection: "row",
  },
  categoryChip: {
    marginLeft: wp("2%"),
  },
  notesText: {
    fontSize: wp("4%"),
    color: "#333",
    lineHeight: hp("2.5%"),
  },
});

export default ExpenseDetailsScreen;
