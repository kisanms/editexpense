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
  Chip,
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
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";

const commonTags = [
  "Residential",
  "Commercial",
  "Investment",
  "Urgent",
  "VIP",
  "First-time Buyer",
  "Cash Buyer",
  "Mortgage Required",
];

const paymentTerms = [
  "Full Payment",
  "50% Advance",
  "Monthly Installments",
  "Quarterly Payments",
];

const validationSchema = Yup.object().shape({
  fullName: Yup.string().required("Full name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  address: Yup.string(),
  budget: Yup.number()
    .typeError("Budget must be a number")
    .positive("Budget must be a positive number")
    .min(1, "Budget must be at least $1"),
  requirements: Yup.string(),
  tags: Yup.array(),
  paymentTerms: Yup.string(),
  projectDeadline: Yup.date(),
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

export default function AddClientScreen({ navigation }) {
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
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
    fullName: "",
    email: "",
    phone: "",
    address: "",
    budget: "",
    requirements: "",
    tags: [],
    paymentTerms: "",
    projectDeadline: new Date(),
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const docRef = await addDoc(collection(db, "clients"), {
        ...values,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      });

      console.log("Document written with ID: ", docRef.id);

      Alert.alert(
        "Success",
        "Client added successfully!",
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
      console.error("Error adding document: ", error);
      Alert.alert(
        "Error",
        "Failed to add client. Please try again.",
        [{ text: "OK" }],
        { cancelable: false }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = (tag, setFieldValue, values) => {
    if (tag && !values.tags.includes(tag)) {
      setFieldValue("tags", [...values.tags, tag]);
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove, setFieldValue, values) => {
    setFieldValue(
      "tags",
      values.tags.filter((tag) => tag !== tagToRemove)
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
          <Text style={styles.headerTitle}>Add New Client</Text>
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
            resetForm,
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
                {/* Section: Contact Information */}
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  Contact Information
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
                    placeholder="please enter your full name"
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
                    placeholder="please enter your email"
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
                    placeholder="please enter your phone number"
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
                    placeholder="please enter your address"
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                </View>

                {/* Section: Client Preferences */}
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  Client Preferences
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
                    error={touched.budget && errors.budget}
                    left={
                      <TextInput.Icon
                        icon="currency-usd"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    placeholder="e.g., 250000"
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
                    Specific Requirements
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
                    placeholder="please provide your requirements"
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                </View>

                {/* Section: Categorization */}
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  Categorization
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
                    Tags
                  </Text>
                  <View style={styles.tagsContainer}>
                    {values.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        onClose={() => removeTag(tag, setFieldValue, values)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor:
                              colorScheme === "dark" ? "#4B5563" : "#E0F2FE",
                            borderColor:
                              colorScheme === "dark" ? "#6B7280" : "#BFDBFE",
                          },
                        ]}
                        textStyle={[
                          styles.chipText,
                          { color: theme.colors.text },
                        ]}
                        icon="tag"
                      >
                        {tag}
                      </Chip>
                    ))}
                    <TouchableOpacity
                      style={[
                        styles.addTagButton,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#4B5563" : "#E0F2FE",
                          borderColor:
                            colorScheme === "dark" ? "#6B7280" : "#BFDBFE",
                        },
                      ]}
                      onPress={() => setShowTagsModal(true)}
                    >
                      <FontAwesome5
                        name="plus"
                        size={wp(4)}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Section: Financial Details */}
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  Financial Details
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
                      value={values.projectDeadline.toLocaleDateString()}
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
                  Add Client
                </Button>
              </ScrollView>

              {/* Tags Modal */}
              <Portal>
                <Modal
                  visible={showTagsModal}
                  onDismiss={() => setShowTagsModal(false)}
                  contentContainerStyle={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Text
                    style={[styles.modalTitle, { color: theme.colors.primary }]}
                  >
                    Select or Add Tags
                  </Text>
                  <TextInput
                    label="Custom Tag"
                    value={newTag}
                    onChangeText={setNewTag}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    right={
                      <TextInput.Icon
                        icon="plus"
                        onPress={() => {
                          addTag(newTag, setFieldValue, values);
                          setNewTag("");
                        }}
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                  />
                  <View style={styles.commonTagsContainer}>
                    {commonTags.map((tag) => (
                      <Chip
                        key={tag}
                        onPress={() => addTag(tag, setFieldValue, values)}
                        style={[
                          styles.commonTag,
                          {
                            backgroundColor:
                              colorScheme === "dark" ? "#4B5563" : "#E0F2FE",
                            borderColor:
                              colorScheme === "dark" ? "#6B7280" : "#BFDBFE",
                          },
                        ]}
                        textStyle={[
                          styles.chipText,
                          { color: theme.colors.text },
                        ]}
                        icon={values.tags.includes(tag) ? "check" : "tag"}
                      >
                        {tag}
                      </Chip>
                    ))}
                  </View>
                  <Button
                    mode="contained"
                    onPress={() => setShowTagsModal(false)}
                    style={styles.modalButton}
                    theme={theme}
                  >
                    Done
                  </Button>
                </Modal>
              </Portal>

              {/* Payment Terms Modal */}
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
                    style={[styles.modalTitle, { color: theme.colors.primary }]}
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

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={values.projectDeadline}
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
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: hp(1),
  },
  chip: {
    marginRight: wp(2),
    marginBottom: hp(1),
    borderWidth: 1,
    borderRadius: wp(5),
  },
  chipText: {
    fontSize: wp(3.5),
    fontWeight: "600",
  },
  addTagButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    elevation: 2,
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
  modalButton: {
    marginTop: hp(2),
    borderRadius: wp(3),
  },
  commonTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: hp(2),
  },
  commonTag: {
    marginRight: wp(2),
    marginBottom: hp(1),
    borderWidth: 1,
    borderRadius: wp(5),
  },
  errorText: {
    fontSize: wp(3.5),
    marginBottom: hp(1),
  },
});
