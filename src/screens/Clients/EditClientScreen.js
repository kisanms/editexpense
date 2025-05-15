import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
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
  Chip,
  List,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import DateTimePicker from "@react-native-community/datetimepicker";

const paymentTerms = [
  "Full Payment",
  "50% Advance",
  "Monthly Installments",
  "Quarterly Payments",
];

const validationSchema = Yup.object().shape({
  fullName: Yup.string().required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  address: Yup.string(),
  budget: Yup.number()
    .typeError("Budget must be a number")
    .positive("Budget must be positive")
    .nullable(),
  requirements: Yup.string(),
  paymentTerms: Yup.string(),
  projectDeadline: Yup.date().nullable(),
  notes: Yup.string(),
  tags: Yup.array().of(Yup.string()),
});

const getTheme = (colorScheme) => ({
  colors: {
    primary: colorScheme === "dark" ? "#60A5FA" : "#1E3A8A",
    error: colorScheme === "dark" ? "#F87171" : "#B91C1C",
    background: colorScheme === "dark" ? "#1F2937" : "#FFFFFF",
    text: colorScheme === "dark" ? "#F3F4F6" : "#1F2937",
    placeholder: colorScheme === "dark" ? "#9CA3AF" : "#6B7280",
    surface: colorScheme === "dark" ? "#374151" : "#FFFFFF",
  },
  roundness: wp(2),
});

export default function EditClientScreen({ route, navigation }) {
  const { client } = route.params;
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [showTagModal, setShowTagModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newTag, setNewTag] = useState("");
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
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

  const initialValues = {
    fullName: client.fullName || "",
    email: client.email || "",
    phone: client.phone || "",
    address: client.address || "",
    budget: client.budget ? String(client.budget) : "",
    requirements: client.requirements || "",
    paymentTerms: client.paymentTerms || "",
    projectDeadline: client.projectDeadline
      ? new Date(client.projectDeadline)
      : null,
    notes: client.notes || "",
    tags: client.tags || [],
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const updatedValues = {
        ...values,
        budget: values.budget ? parseFloat(values.budget) : null,
        projectDeadline: values.projectDeadline
          ? values.projectDeadline.toISOString()
          : null,
        updatedAt: serverTimestamp(),
      };

      const clientRef = doc(db, "clients", client.id);
      await updateDoc(clientRef, updatedValues);

      Alert.alert(
        "Success",
        "Client updated successfully!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Error updating client: ", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update client. Please try again.",
        [{ text: "OK" }],
        { cancelable: false }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = (values, setFieldValue) => {
    if (newTag.trim() && !values.tags.includes(newTag.trim())) {
      setFieldValue("tags", [...values.tags, newTag.trim()]);
    }
    setNewTag("");
    setShowTagModal(false);
  };

  const removeTag = (tag, values, setFieldValue) => {
    setFieldValue(
      "tags",
      values.tags.filter((t) => t !== tag)
    );
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
          <Text style={styles.headerTitle}>Edit Client</Text>
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
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  Basic Information
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
                    Full Name *
                  </Text>
                  <TextInput
                    value={values.fullName}
                    onChangeText={handleChange("fullName")}
                    onBlur={handleBlur("fullName")}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    error={touched.fullName && errors.fullName}
                    left={
                      <TextInput.Icon
                        icon="account"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                  {touched.fullName && errors.fullName && (
                    <HelperText
                      type="error"
                      visible={touched.fullName && errors.fullName}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.fullName}
                    </HelperText>
                  )}

                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Email *
                  </Text>
                  <TextInput
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    keyboardType="email-address"
                    error={touched.email && errors.email}
                    left={
                      <TextInput.Icon
                        icon="email"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                  {touched.email && errors.email && (
                    <HelperText
                      type="error"
                      visible={touched.email && errors.email}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.email}
                    </HelperText>
                  )}

                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Phone *
                  </Text>
                  <TextInput
                    value={values.phone}
                    onChangeText={handleChange("phone")}
                    onBlur={handleBlur("phone")}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    keyboardType="phone-pad"
                    error={touched.phone && errors.phone}
                    left={
                      <TextInput.Icon
                        icon="phone"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                  {touched.phone && errors.phone && (
                    <HelperText
                      type="error"
                      visible={touched.phone && errors.phone}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.phone}
                    </HelperText>
                  )}

                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Address
                  </Text>
                  <TextInput
                    value={values.address}
                    onChangeText={handleChange("address")}
                    onBlur={handleBlur("address")}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    numberOfLines={3}
                    left={
                      <TextInput.Icon
                        icon="map-marker"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                </View>

                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  Project Details
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
                    Budget
                  </Text>
                  <TextInput
                    value={values.budget}
                    onChangeText={handleChange("budget")}
                    onBlur={handleBlur("budget")}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    keyboardType="numeric"
                    left={
                      <TextInput.Icon
                        icon="currency-usd"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                  {touched.budget && errors.budget && (
                    <HelperText
                      type="error"
                      visible={touched.budget && errors.budget}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.budget}
                    </HelperText>
                  )}

                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Requirements
                  </Text>
                  <TextInput
                    value={values.requirements}
                    onChangeText={handleChange("requirements")}
                    onBlur={handleBlur("requirements")}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    numberOfLines={4}
                    left={
                      <TextInput.Icon
                        icon="text-box"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />

                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Payment Terms
                  </Text>
                  <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                    <TextInput
                      value={values.paymentTerms}
                      mode="outlined"
                      style={[
                        styles.input,
                        { backgroundColor: theme.colors.surface },
                      ]}
                      editable={false}
                      left={
                        <TextInput.Icon
                          icon="credit-card"
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
                      placeholder="Select payment terms"
                      textColor={theme.colors.text}
                      placeholderTextColor={theme.colors.placeholder}
                    />
                  </TouchableOpacity>

                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Project Deadline
                  </Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <TextInput
                      value={
                        values.projectDeadline
                          ? values.projectDeadline.toLocaleDateString()
                          : ""
                      }
                      mode="outlined"
                      style={[
                        styles.input,
                        { backgroundColor: theme.colors.surface },
                      ]}
                      editable={false}
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
                  {touched.projectDeadline && errors.projectDeadline && (
                    <HelperText
                      type="error"
                      visible={
                        touched.projectDeadline && errors.projectDeadline
                      }
                      style={{ color: theme.colors.error }}
                    >
                      {errors.projectDeadline}
                    </HelperText>
                  )}
                </View>

                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  Additional Information
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
                    Notes
                  </Text>
                  <TextInput
                    value={values.notes}
                    onChangeText={handleChange("notes")}
                    onBlur={handleBlur("notes")}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    multiline
                    numberOfLines={4}
                    left={
                      <TextInput.Icon
                        icon="note-text"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />

                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Tags
                  </Text>
                  <View style={styles.tagsContainer}>
                    {values.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        style={[
                          styles.tag,
                          {
                            backgroundColor:
                              colorScheme === "dark" ? "#4B5563" : "#EBF5FF",
                            borderColor:
                              colorScheme === "dark" ? "#6B7280" : "#BFDBFE",
                          },
                        ]}
                        textStyle={{ color: theme.colors.text }}
                        onClose={() => removeTag(tag, values, setFieldValue)}
                      >
                        {tag}
                      </Chip>
                    ))}
                    <TouchableOpacity
                      style={[
                        styles.addTagButton,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#4B5563" : "#EBF5FF",
                          borderColor:
                            colorScheme === "dark" ? "#6B7280" : "#BFDBFE",
                        },
                      ]}
                      onPress={() => setShowTagModal(true)}
                    >
                      <FontAwesome5
                        name="plus"
                        size={wp(4)}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
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
                  Update Client
                </Button>
              </ScrollView>

              <Portal>
                <Modal
                  visible={showTagModal}
                  onDismiss={() => setShowTagModal(false)}
                  contentContainerStyle={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Text
                    style={[styles.modalTitle, { color: theme.colors.text }]}
                  >
                    Add New Tag
                  </Text>
                  <TextInput
                    value={newTag}
                    onChangeText={setNewTag}
                    mode="outlined"
                    style={[
                      styles.modalInput,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    theme={theme}
                    placeholder="Enter tag name"
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                  />
                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowTagModal(false)}
                      style={styles.modalButton}
                      theme={theme}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => addTag(values, setFieldValue)}
                      style={styles.modalButton}
                      theme={theme}
                    >
                      Add
                    </Button>
                  </View>
                </Modal>
              </Portal>

              <Portal>
                <Modal
                  visible={showTermsModal}
                  onDismiss={() => setShowTermsModal(false)}
                  contentContainerStyle={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Text
                    style={[styles.modalTitle, { color: theme.colors.text }]}
                  >
                    Select Payment Terms
                  </Text>
                  {paymentTerms.map((terms, index) => (
                    <React.Fragment key={terms}>
                      <List.Item
                        title={terms}
                        titleStyle={[
                          styles.modalItem,
                          { color: theme.colors.text },
                        ]}
                        onPress={() => {
                          setFieldValue("paymentTerms", terms);
                          setShowTermsModal(false);
                        }}
                      />
                      {index < paymentTerms.length - 1 && (
                        <Divider
                          style={[
                            styles.modalDivider,
                            { backgroundColor: theme.colors.placeholder },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </Modal>
              </Portal>

              {showDatePicker && (
                <DateTimePicker
                  value={values.projectDeadline || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFieldValue("projectDeadline", selectedDate);
                    }
                  }}
                  minimumDate={new Date()}
                  themeVariant={colorScheme}
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
    height: hp(8),
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
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: hp(1),
  },
  tag: {
    marginRight: wp(2),
    marginBottom: hp(1),
    borderWidth: 1,
  },
  addTagButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
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
    fontthrusting: "700",
    marginBottom: hp(2.5),
  },
  modalInput: {
    marginBottom: hp(2),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: wp(2),
  },
  modalButton: {
    minWidth: wp(20),
  },
  modalItem: {
    fontSize: wp(4),
  },
  modalDivider: {},
});
