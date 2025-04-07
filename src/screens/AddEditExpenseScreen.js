import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  TextInput,
  Button,
  Text,
  Surface,
  useTheme,
  SegmentedButtons,
  HelperText,
  Portal,
  Modal,
  Chip,
  IconButton,
} from "react-native-paper";
import { Formik } from "formik";
import * as Yup from "yup";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  addExpense,
  updateExpense,
  getExpenseById,
} from "../services/expenseService";
import { format } from "date-fns";
import { DatePickerModal } from "react-native-paper-dates";
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

const validationSchema = Yup.object().shape({
  description: Yup.string().required("Description is required"),
  amount: Yup.number()
    .required("Amount is required")
    .min(0, "Amount must be positive"),
  category: Yup.string().required("Category is required"),
  expenseDate: Yup.date().required("Expense date is required"),
  status: Yup.string().required("Status is required"),
  notes: Yup.string(),
});

const AddEditExpenseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [expense, setExpense] = useState(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

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
        setSelectedDate(expenseData.expenseDate.toDate());
      }
    } catch (error) {
      console.error("Error fetching expense:", error);
      Alert.alert("Error", "Could not fetch expense details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const expenseData = {
        ...values,
        businessId: userProfile.businessId,
        createdByUid: userProfile.uid,
        expenseDate: selectedDate,
      };

      if (expenseId) {
        await updateExpense(expenseId, expenseData);
        Alert.alert("Success", "Expense updated successfully");
      } else {
        await addExpense(expenseData);
        Alert.alert("Success", "Expense added successfully");
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error saving expense:", error);
      Alert.alert("Error", "Could not save expense");
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

  return (
    <LinearGradient
      colors={["#4c669f", "#3b5998", "#192f6a"]}
      style={styles.container}
    >
      <Formik
        initialValues={{
          description: expense?.description || "",
          amount: expense?.amount?.toString() || "",
          category: expense?.category || "",
          status: expense?.status || "pending",
          notes: expense?.notes || "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          setFieldValue,
        }) => (
          <ScrollView style={styles.scrollView}>
            <Surface style={styles.surface} elevation={4}>
              <TextInput
                label="Description"
                value={values.description}
                onChangeText={handleChange("description")}
                onBlur={handleBlur("description")}
                error={touched.description && errors.description}
                style={styles.input}
              />
              {touched.description && errors.description && (
                <HelperText type="error">{errors.description}</HelperText>
              )}

              <TextInput
                label="Amount"
                value={values.amount}
                onChangeText={handleChange("amount")}
                onBlur={handleBlur("amount")}
                error={touched.amount && errors.amount}
                keyboardType="numeric"
                style={styles.input}
              />
              {touched.amount && errors.amount && (
                <HelperText type="error">{errors.amount}</HelperText>
              )}

              <View style={styles.dateContainer}>
                <TextInput
                  label="Expense Date"
                  value={format(selectedDate, "PPP")}
                  onPressIn={() => setDatePickerVisible(true)}
                  style={styles.input}
                  right={
                    <TextInput.Icon
                      icon="calendar"
                      onPress={() => setDatePickerVisible(true)}
                    />
                  }
                />
                <DatePickerModal
                  locale="en"
                  mode="single"
                  visible={datePickerVisible}
                  onDismiss={() => setDatePickerVisible(false)}
                  date={selectedDate}
                  onConfirm={({ date }) => {
                    setSelectedDate(date);
                    setDatePickerVisible(false);
                  }}
                />
              </View>

              <View style={styles.categoryContainer}>
                <TextInput
                  label="Category"
                  value={
                    values.category ? values.category.replace("-", " ") : ""
                  }
                  onPressIn={() => setCategoryModalVisible(true)}
                  style={styles.input}
                  right={
                    <TextInput.Icon
                      icon={getCategoryIcon(values.category)}
                      onPress={() => setCategoryModalVisible(true)}
                    />
                  }
                />
                <Portal>
                  <Modal
                    visible={categoryModalVisible}
                    onDismiss={() => setCategoryModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                  >
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Select Category</Text>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <Chip
                          key={category}
                          selected={values.category === category}
                          onPress={() => {
                            setFieldValue("category", category);
                            setCategoryModalVisible(false);
                          }}
                          style={styles.categoryChip}
                          icon={getCategoryIcon(category)}
                        >
                          {category.replace("-", " ")}
                        </Chip>
                      ))}
                    </View>
                  </Modal>
                </Portal>
              </View>
              {touched.category && errors.category && (
                <HelperText type="error">{errors.category}</HelperText>
              )}

              <View style={styles.statusContainer}>
                <Text style={styles.label}>Status</Text>
                <SegmentedButtons
                  value={values.status}
                  onValueChange={handleChange("status")}
                  buttons={EXPENSE_STATUSES.map((status) => ({
                    value: status,
                    label: status,
                    style: { backgroundColor: getStatusColor(status) },
                  }))}
                />
              </View>

              <TextInput
                label="Notes"
                value={values.notes}
                onChangeText={handleChange("notes")}
                onBlur={handleBlur("notes")}
                multiline
                numberOfLines={4}
                style={styles.input}
              />

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
              >
                {expenseId ? "Update Expense" : "Add Expense"}
              </Button>
            </Surface>
          </ScrollView>
        )}
      </Formik>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  surface: {
    margin: wp("4%"),
    marginTop: hp("2%"),
    padding: wp("4%"),
    borderRadius: wp("2%"),
    backgroundColor: "white",
  },
  input: {
    marginBottom: hp("1%"),
  },
  dateContainer: {
    marginBottom: hp("1%"),
  },
  categoryContainer: {
    marginBottom: hp("1%"),
  },
  statusContainer: {
    marginBottom: hp("2%"),
  },
  label: {
    fontSize: wp("4%"),
    marginBottom: hp("1%"),
    color: "#333",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: wp("4%"),
    margin: wp("4%"),
    borderRadius: wp("2%"),
  },
  modalContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    marginBottom: hp("2%"),
    textAlign: "center",
    width: "100%",
  },
  categoryChip: {
    margin: wp("1%"),
  },
  submitButton: {
    marginTop: hp("2%"),
  },
});

export default AddEditExpenseScreen;
