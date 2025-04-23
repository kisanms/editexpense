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
  Chip,
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
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

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
  status: Yup.string().default("in-progress"),
});

const theme = {
  colors: {
    primary: "#1E3A8A",
    error: "#B91C1C",
    background: "#FFFFFF",
    text: "#1F2937",
    placeholder: "#6B7280",
  },
  roundness: wp(2),
};

export default function AddOrderScreen({ navigation }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  useEffect(() => {
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
  }, []);

  const fetchClients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
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
      const q = query(
        collection(db, "employees"),
        where("status", "==", "active")
      ); // Filter active employees
      const querySnapshot = await getDocs(q);
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
    clientId: "",
    employeeId: "",
    title: "",
    description: "",
    amount: "",
    deadline: new Date(),
    status: "in-progress",
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        ...values,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Order added with ID: ", docRef.id);

      Alert.alert(
        "Success",
        "Order added successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              navigation.goBack();
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Error adding order: ", error);
      Alert.alert(
        "Error",
        "Failed to add order. Please try again.",
        [{ text: "OK" }],
        { cancelable: false }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#1E3A8A", "#3B82F6"]}
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
          <Text style={styles.headerTitle}>Add New Order</Text>
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
                <Text style={styles.sectionTitle}>Order Details</Text>
                <View style={styles.sectionCard}>
                  <Text style={styles.inputLabel}>Title *</Text>
                  <TextInput
                    value={values.title}
                    onChangeText={handleChange("title")}
                    onBlur={handleBlur("title")}
                    mode="outlined"
                    style={styles.input}
                    error={touched.title && errors.title}
                    left={<TextInput.Icon icon="text-box" color="#1E3A8A" />}
                    theme={theme}
                    placeholder="Enter order title"
                  />
                  {touched.title && errors.title && (
                    <HelperText
                      type="error"
                      visible={touched.title && errors.title}
                      style={styles.errorText}
                    >
                      {errors.title}
                    </HelperText>
                  )}

                  <Text style={styles.inputLabel}>Description *</Text>
                  <TextInput
                    value={values.description}
                    onChangeText={handleChange("description")}
                    onBlur={handleBlur("description")}
                    mode="outlined"
                    style={styles.input}
                    numberOfLines={4}
                    error={touched.description && errors.description}
                    left={<TextInput.Icon icon="text" color="#1E3A8A" />}
                    theme={theme}
                    placeholder="Enter order description"
                  />
                  {touched.description && errors.description && (
                    <HelperText
                      type="error"
                      visible={touched.description && errors.description}
                      style={styles.errorText}
                    >
                      {errors.description}
                    </HelperText>
                  )}

                  <Text style={styles.inputLabel}>Amount *</Text>
                  <TextInput
                    value={values.amount}
                    onChangeText={handleChange("amount")}
                    onBlur={handleBlur("amount")}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                    error={touched.amount && errors.amount}
                    left={
                      <TextInput.Icon icon="currency-usd" color="#1E3A8A" />
                    }
                    theme={theme}
                    placeholder="Enter order amount"
                  />
                  {touched.amount && errors.amount && (
                    <HelperText
                      type="error"
                      visible={touched.amount && errors.amount}
                      style={styles.errorText}
                    >
                      {errors.amount}
                    </HelperText>
                  )}

                  <Text style={styles.inputLabel}>Deadline *</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <TextInput
                      value={values.deadline.toLocaleDateString()}
                      mode="outlined"
                      style={styles.input}
                      editable={false}
                      error={touched.deadline && errors.deadline}
                      left={<TextInput.Icon icon="calendar" color="#1E3A8A" />}
                      right={
                        <TextInput.Icon icon="chevron-down" color="#1E3A8A" />
                      }
                      theme={theme}
                      placeholder="Select deadline"
                    />
                  </TouchableOpacity>
                  {touched.deadline && errors.deadline && (
                    <HelperText
                      type="error"
                      visible={touched.deadline && errors.deadline}
                      style={styles.errorText}
                    >
                      {errors.deadline}
                    </HelperText>
                  )}
                </View>

                {/* Section: Client & Employee Selection */}
                <Text style={styles.sectionTitle}>Assign Order</Text>
                <View style={styles.sectionCard}>
                  <Text style={styles.inputLabel}>Select Client *</Text>
                  <TouchableOpacity onPress={() => setShowClientModal(true)}>
                    <TextInput
                      value={
                        clients.find((c) => c.id === values.clientId)
                          ?.fullName || ""
                      }
                      mode="outlined"
                      style={styles.input}
                      editable={false}
                      error={touched.clientId && errors.clientId}
                      left={<TextInput.Icon icon="account" color="#1E3A8A" />}
                      right={
                        <TextInput.Icon icon="chevron-down" color="#1E3A8A" />
                      }
                      theme={theme}
                      placeholder="Select client"
                    />
                  </TouchableOpacity>
                  {touched.clientId && errors.clientId && (
                    <HelperText
                      type="error"
                      visible={touched.clientId && errors.clientId}
                      style={styles.errorText}
                    >
                      {errors.clientId}
                    </HelperText>
                  )}

                  <Text style={styles.inputLabel}>Select Employee *</Text>
                  <TouchableOpacity onPress={() => setShowEmployeeModal(true)}>
                    <TextInput
                      value={
                        employees.find((e) => e.id === values.employeeId)
                          ?.fullName || ""
                      }
                      mode="outlined"
                      style={styles.input}
                      editable={false}
                      error={touched.employeeId && errors.employeeId}
                      left={
                        <TextInput.Icon icon="account-group" color="#1E3A8A" />
                      }
                      right={
                        <TextInput.Icon icon="chevron-down" color="#1E3A8A" />
                      }
                      theme={theme}
                      placeholder="Select employee"
                    />
                  </TouchableOpacity>
                  {touched.employeeId && errors.employeeId && (
                    <HelperText
                      type="error"
                      visible={touched.employeeId && errors.employeeId}
                      style={styles.errorText}
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
                  Create Order
                </Button>
              </ScrollView>

              {/* Client Selection Modal */}
              <Portal>
                <Modal
                  visible={showClientModal}
                  onDismiss={() => setShowClientModal(false)}
                  contentContainerStyle={styles.modalContent}
                >
                  <Text style={styles.modalTitle}>Select Client</Text>
                  {clients.map((client) => (
                    <React.Fragment key={client.id}>
                      <List.Item
                        title={client.fullName}
                        description={`${client.email} | ${client.phone}`}
                        titleStyle={styles.modalItem}
                        onPress={() => {
                          setFieldValue("clientId", client.id);
                          setShowClientModal(false);
                        }}
                      />
                      <Divider style={styles.modalDivider} />
                    </React.Fragment>
                  ))}
                </Modal>
              </Portal>

              {/* Employee Selection Modal */}
              <Portal>
                <Modal
                  visible={showEmployeeModal}
                  onDismiss={() => setShowEmployeeModal(false)}
                  contentContainerStyle={styles.modalContent}
                >
                  <Text style={styles.modalTitle}>Select Employee</Text>
                  {employees.map((employee) => (
                    <React.Fragment key={employee.id}>
                      <List.Item
                        title={employee.fullName}
                        description={`${employee.skills} | ${employee.experience} years`}
                        titleStyle={styles.modalItem}
                        onPress={() => {
                          setFieldValue("employeeId", employee.id);
                          setShowEmployeeModal(false);
                        }}
                      />
                      <Divider style={styles.modalDivider} />
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
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    padding: wp(5),
  },
  sectionTitle: {
    fontSize: wp(5.5),
    fontWeight: "700",
    color: "#1E3A8A",
    marginVertical: hp(2),
    letterSpacing: 0.3,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
    borderRadius: wp(2),
  },
  inputLabel: {
    fontSize: wp(4),
    fontWeight: "600",
    color: "#1F2937",
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
    marginBottom: hp(2.5),
  },
  modalItem: {
    fontSize: wp(4),
    color: "#1F2937",
  },
  modalDivider: {
    backgroundColor: "#E5E7EB",
  },
});
