import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  useColorScheme,
} from "react-native";
import {
  TextInput,
  Text,
  Button,
  HelperText,
  Portal,
  Modal,
  List,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import {
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

const validationSchema = Yup.object().shape({
  clientId: Yup.string().required("Client selection is required"),
  employeeId: Yup.string().required("Employee selection is required"),
  title: Yup.string().required("Order title is required"),
  description: Yup.string().required("Description is required"),
  amount: Yup.number()
    .typeError("Amount must be a number")
    .positive("Amount must be a positive number")
    .required("Amount is required"),
  deadline: Yup.date().required("Deadline is required"),
});

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

export default function EditOrderScreen({ route, navigation }) {
  const { order } = route.params;
  const { userProfile } = useAuth();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
    if (!userProfile?.businessId) {
      console.warn("No business ID found for user");
      return;
    }

    // Security check - verify order belongs to user's business
    if (order.businessId !== userProfile.businessId) {
      Alert.alert(
        "Access Denied",
        "You don't have permission to edit this order.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }

    fetchClients();
    fetchEmployees();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [userProfile?.businessId, order]);

  const fetchClients = async () => {
    try {
      const clientsQuery = query(
        collection(db, "clients"),
        where("businessId", "==", userProfile.businessId)
      );
      const querySnapshot = await getDocs(clientsQuery);
      const clientsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientsList);
    } catch (error) {
      console.error("Error fetching clients: ", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const employeesQuery = query(
        collection(db, "employees"),
        where("businessId", "==", userProfile.businessId),
        where("status", "==", "active")
      );
      const querySnapshot = await getDocs(employeesQuery);
      const employeesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmployees(employeesList);
    } catch (error) {
      console.error("Error fetching employees: ", error);
    }
  };

  const initialValues = {
    clientId: order.clientId || "",
    employeeId: order.employeeId || "",
    title: order.title || "",
    description: order.description || "",
    amount: order.amount?.toString() || "",
    deadline: order.deadline?.toDate() || new Date(),
    status: order.status || "in-progress",
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Additional security check
      if (order.businessId !== userProfile.businessId) {
        Alert.alert(
          "Access Denied",
          "You don't have permission to edit this order.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
        return;
      }

      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        ...values,
        businessId: userProfile.businessId, // Ensure businessId is preserved
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        "Success",
        "Order updated successfully!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Error updating order: ", error);
      Alert.alert(
        "Error",
        "Failed to update order. Please try again.",
        [{ text: "OK" }],
        { cancelable: false }
      );
    } finally {
      setSubmitting(false);
    }
  };

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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={wp(5)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Order</Text>
          <View style={{ width: wp(5) }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            setFieldValue,
            isSubmitting,
          }) => (
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <ScrollView style={styles.scrollView}>
                {/* Section: Order Details */}
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  Order Details
                </Text>
                <View
                  style={[
                    styles.sectionCard,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Title *
                  </Text>
                  <TextInput
                    value={values.title}
                    onChangeText={handleChange("title")}
                    onBlur={handleBlur("title")}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    error={touched.title && errors.title}
                    left={
                      <TextInput.Icon
                        icon="text-box"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    placeholder="Enter order title"
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                  {touched.title && errors.title && (
                    <HelperText
                      type="error"
                      visible={touched.title && errors.title}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.title}
                    </HelperText>
                  )}

                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Description *
                  </Text>
                  <TextInput
                    value={values.description}
                    onChangeText={handleChange("description")}
                    onBlur={handleBlur("description")}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    numberOfLines={4}
                    error={touched.description && errors.description}
                    left={
                      <TextInput.Icon
                        icon="text"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    placeholder="Enter order description"
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                  {touched.description && errors.description && (
                    <HelperText
                      type="error"
                      visible={touched.description && errors.description}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.description}
                    </HelperText>
                  )}

                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Amount *
                  </Text>
                  <TextInput
                    value={values.amount}
                    onChangeText={handleChange("amount")}
                    onBlur={handleBlur("amount")}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    keyboardType="numeric"
                    error={touched.amount && errors.amount}
                    left={
                      <TextInput.Icon
                        icon="currency-usd"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    placeholder="Enter order amount"
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                  {touched.amount && errors.amount && (
                    <HelperText
                      type="error"
                      visible={touched.amount && errors.amount}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.amount}
                    </HelperText>
                  )}

                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Deadline *
                  </Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <TextInput
                      value={values.deadline.toLocaleDateString()}
                      mode="outlined"
                      style={[
                        styles.input,
                        { backgroundColor: theme.colors.surface },
                      ]}
                      editable={false}
                      error={touched.deadline && errors.deadline}
                      left={
                        <TextInput.Icon
                          icon="calendar"
                          color={theme.colors.primary}
                        />
                      }
                      right={
                        <TextInput.Icon
                          icon="chevron-down"
                          color={theme.colors.primary}
                        />
                      }
                      theme={theme}
                      placeholder="Select deadline"
                      textColor={theme.colors.text}
                      placeholderTextColor={theme.colors.placeholder}
                    />
                  </TouchableOpacity>
                  {touched.deadline && errors.deadline && (
                    <HelperText
                      type="error"
                      visible={touched.deadline && errors.deadline}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.deadline}
                    </HelperText>
                  )}
                </View>

                {/* Section: Client & Employee Selection */}
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  Assign Order
                </Text>
                <View
                  style={[
                    styles.sectionCard,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Select Client *
                  </Text>
                  <TouchableOpacity onPress={() => setShowClientModal(true)}>
                    <TextInput
                      value={
                        clients.find((c) => c.id === values.clientId)
                          ?.fullName || ""
                      }
                      mode="outlined"
                      style={[
                        styles.input,
                        { backgroundColor: theme.colors.surface },
                      ]}
                      editable={false}
                      error={touched.clientId && errors.clientId}
                      left={
                        <TextInput.Icon
                          icon="account"
                          color={theme.colors.primary}
                        />
                      }
                      right={
                        <TextInput.Icon
                          icon="chevron-down"
                          color={theme.colors.primary}
                        />
                      }
                      theme={theme}
                      placeholder="Select client"
                      textColor={theme.colors.text}
                      placeholderTextColor={theme.colors.placeholder}
                    />
                  </TouchableOpacity>
                  {touched.clientId && errors.clientId && (
                    <HelperText
                      type="error"
                      visible={touched.clientId && errors.clientId}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.clientId}
                    </HelperText>
                  )}

                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Select Employee *
                  </Text>
                  <TouchableOpacity onPress={() => setShowEmployeeModal(true)}>
                    <TextInput
                      value={
                        employees.find((e) => e.id === values.employeeId)
                          ?.fullName || ""
                      }
                      mode="outlined"
                      style={[
                        styles.input,
                        { backgroundColor: theme.colors.surface },
                      ]}
                      editable={false}
                      error={touched.employeeId && errors.employeeId}
                      left={
                        <TextInput.Icon
                          icon="account-group"
                          color={theme.colors.primary}
                        />
                      }
                      right={
                        <TextInput.Icon
                          icon="chevron-down"
                          color={theme.colors.primary}
                        />
                      }
                      theme={theme}
                      placeholder="Select employee"
                      textColor={theme.colors.text}
                      placeholderTextColor={theme.colors.placeholder}
                    />
                  </TouchableOpacity>
                  {touched.employeeId && errors.employeeId && (
                    <HelperText
                      type="error"
                      visible={touched.employeeId && errors.employeeId}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.employeeId}
                    </HelperText>
                  )}
                </View>

                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.submitButton}
                  contentStyle={styles.buttonContent}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  theme={theme}
                  icon="check"
                >
                  Update Order
                </Button>
              </ScrollView>

              {/* Client Selection Modal */}
              <Portal>
                <Modal
                  visible={showClientModal}
                  onDismiss={() => setShowClientModal(false)}
                  contentContainerStyle={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Text
                    style={[styles.modalTitle, { color: theme.colors.primary }]}
                  >
                    Select Client
                  </Text>
                  {clients.map((client) => (
                    <React.Fragment key={client.id}>
                      <List.Item
                        title={client.fullName}
                        description={`${client.email} | ${client.phone}`}
                        titleStyle={[
                          styles.modalItem,
                          { color: theme.colors.text },
                        ]}
                        descriptionStyle={{ color: theme.colors.placeholder }}
                        onPress={() => {
                          setFieldValue("clientId", client.id);
                          setShowClientModal(false);
                        }}
                      />
                      <Divider
                        style={[
                          styles.modalDivider,
                          { backgroundColor: theme.colors.placeholder },
                        ]}
                      />
                    </React.Fragment>
                  ))}
                </Modal>
              </Portal>

              {/* Employee Selection Modal */}
              <Portal>
                <Modal
                  visible={showEmployeeModal}
                  onDismiss={() => setShowEmployeeModal(false)}
                  contentContainerStyle={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Text
                    style={[styles.modalTitle, { color: theme.colors.primary }]}
                  >
                    Select Employee
                  </Text>
                  {employees.map((employee) => (
                    <React.Fragment key={employee.id}>
                      <List.Item
                        title={employee.fullName}
                        description={`${employee.skills} | ${employee.experience} years`}
                        titleStyle={[
                          styles.modalItem,
                          { color: theme.colors.text },
                        ]}
                        descriptionStyle={{ color: theme.colors.placeholder }}
                        onPress={() => {
                          setFieldValue("employeeId", employee.id);
                          setShowEmployeeModal(false);
                        }}
                      />
                      <Divider
                        style={[
                          styles.modalDivider,
                          { backgroundColor: theme.colors.placeholder },
                        ]}
                      />
                    </React.Fragment>
                  ))}
                </Modal>
              </Portal>

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={values.deadline}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFieldValue("deadline", selectedDate);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}
            </Animated.View>
          )}
        </Formik>
      </KeyboardAvoidingView>
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
  backButton: {
    padding: wp(2.5),
    borderRadius: wp(2),
  },
  headerTitle: {
    fontSize: wp(6),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  keyboardAvoid: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  scrollView: {
    padding: wp(5),
  },
  sectionTitle: {
    fontSize: wp(5.5),
    fontWeight: "700",
    marginVertical: hp(2),
    letterSpacing: 0.3,
  },
  sectionCard: {
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(2),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  input: {
    marginBottom: hp(1.5),
    borderRadius: wp(2),
  },
  inputLabel: {
    fontSize: wp(4),
    fontWeight: "600",
    marginBottom: hp(1),
    marginTop: hp(1),
  },
  submitButton: {
    marginVertical: hp(3),
    borderRadius: wp(3),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonContent: {
    height: hp(7),
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    fontSize: wp(3.5),
    marginBottom: hp(1),
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
    marginBottom: hp(2.5),
  },
  modalItem: {
    fontSize: wp(4),
  },
  modalDivider: {},
});
