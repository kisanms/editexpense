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
} from "react-native-paper";
import { Formik } from "formik";
import * as Yup from "yup";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  addWorker,
  updateWorker,
  getWorkerById,
} from "../services/workerService";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";

const WORKER_ROLES = ["admin", "manager", "worker", "other"];
const WORKER_STATUSES = ["active", "inactive", "on-leave"];

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .required("Phone number is required"),
  role: Yup.string().required("Role is required"),
  status: Yup.string().required("Status is required"),
  address: Yup.string(),
  notes: Yup.string(),
});

const AddEditWorkerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [worker, setWorker] = useState(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  const workerId = route.params?.workerId;

  useEffect(() => {
    if (workerId) {
      fetchWorker();
    }
  }, [workerId]);

  const fetchWorker = async () => {
    try {
      setLoading(true);
      const workerData = await getWorkerById(workerId);
      if (workerData) {
        setWorker(workerData);
      }
    } catch (error) {
      console.error("Error fetching worker:", error);
      Alert.alert("Error", "Could not fetch worker details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const workerData = {
        ...values,
        businessId: userProfile.businessId,
      };

      if (workerId) {
        await updateWorker(workerId, workerData);
        Alert.alert("Success", "Worker updated successfully");
      } else {
        await addWorker(workerData);
        Alert.alert("Success", "Worker added successfully");
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error saving worker:", error);
      Alert.alert("Error", "Could not save worker");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <LinearGradient
      colors={["#4c669f", "#3b5998", "#192f6a"]}
      style={styles.container}
    >
      <Formik
        initialValues={{
          name: worker?.name || "",
          email: worker?.email || "",
          phone: worker?.phone || "",
          role: worker?.role || "",
          status: worker?.status || "active",
          address: worker?.address || "",
          notes: worker?.notes || "",
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
                label="Name"
                value={values.name}
                onChangeText={handleChange("name")}
                onBlur={handleBlur("name")}
                error={touched.name && errors.name}
                style={styles.input}
              />
              {touched.name && errors.name && (
                <HelperText type="error">{errors.name}</HelperText>
              )}

              <TextInput
                label="Email"
                value={values.email}
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
                error={touched.email && errors.email}
                keyboardType="email-address"
                style={styles.input}
              />
              {touched.email && errors.email && (
                <HelperText type="error">{errors.email}</HelperText>
              )}

              <TextInput
                label="Phone"
                value={values.phone}
                onChangeText={handleChange("phone")}
                onBlur={handleBlur("phone")}
                error={touched.phone && errors.phone}
                keyboardType="phone-pad"
                style={styles.input}
              />
              {touched.phone && errors.phone && (
                <HelperText type="error">{errors.phone}</HelperText>
              )}

              <View style={styles.roleContainer}>
                <TextInput
                  label="Role"
                  value={values.role}
                  onPressIn={() => setRoleModalVisible(true)}
                  style={styles.input}
                  right={
                    <TextInput.Icon
                      icon={getRoleIcon(values.role)}
                      onPress={() => setRoleModalVisible(true)}
                    />
                  }
                />
                <Portal>
                  <Modal
                    visible={roleModalVisible}
                    onDismiss={() => setRoleModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                  >
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Select Role</Text>
                      {WORKER_ROLES.map((role) => (
                        <Chip
                          key={role}
                          selected={values.role === role}
                          onPress={() => {
                            setFieldValue("role", role);
                            setRoleModalVisible(false);
                          }}
                          style={styles.roleChip}
                          icon={getRoleIcon(role)}
                        >
                          {role}
                        </Chip>
                      ))}
                    </View>
                  </Modal>
                </Portal>
              </View>
              {touched.role && errors.role && (
                <HelperText type="error">{errors.role}</HelperText>
              )}

              <View style={styles.statusContainer}>
                <Text style={styles.label}>Status</Text>
                <SegmentedButtons
                  value={values.status}
                  onValueChange={handleChange("status")}
                  buttons={WORKER_STATUSES.map((status) => ({
                    value: status,
                    label: status,
                    style: { backgroundColor: getStatusColor(status) },
                  }))}
                />
              </View>

              <TextInput
                label="Address"
                value={values.address}
                onChangeText={handleChange("address")}
                onBlur={handleBlur("address")}
                multiline
                numberOfLines={3}
                style={styles.input}
              />

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
                {workerId ? "Update Worker" : "Add Worker"}
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
  roleContainer: {
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
  roleChip: {
    margin: wp("1%"),
  },
  submitButton: {
    marginTop: hp("2%"),
  },
});

export default AddEditWorkerScreen;
