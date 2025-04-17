import React, { useState } from "react";
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
import { db } from "../config/firebase";

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

export default function AddClientScreen({ navigation }) {
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  React.useEffect(() => {
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
      // Add the client data to Firestore
      const docRef = await addDoc(collection(db, "clients"), {
        ...values,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      });

      console.log("Document written with ID: ", docRef.id);

      // Show success message
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
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <View style={styles.sectionCard}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput
                    value={values.fullName}
                    onChangeText={handleChange("fullName")}
                    onBlur={handleBlur("fullName")}
                    mode="outlined"
                    style={styles.input}
                    error={touched.fullName && errors.fullName}
                    left={<TextInput.Icon icon="account" color="#1E3A8A" />}
                    theme={theme}
                    placeholder="please enter your full name"
                  />
                  {touched.fullName && errors.fullName && (
                    <HelperText
                      type="error"
                      visible={touched.fullName && errors.fullName}
                      style={styles.errorText}
                    >
                      {errors.fullName}
                    </HelperText>
                  )}

                  <Text style={styles.inputLabel}>Email *</Text>
                  <TextInput
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    error={touched.email && errors.email}
                    left={<TextInput.Icon icon="email" color="#1E3A8A" />}
                    theme={theme}
                    placeholder="please enter your email"
                  />
                  {touched.email && errors.email && (
                    <HelperText
                      type="error"
                      visible={touched.email && errors.email}
                      style={styles.errorText}
                    >
                      {errors.email}
                    </HelperText>
                  )}

                  <Text style={styles.inputLabel}>Phone *</Text>
                  <TextInput
                    value={values.phone}
                    onChangeText={handleChange("phone")}
                    onBlur={handleBlur("phone")}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="phone-pad"
                    error={touched.phone && errors.phone}
                    left={<TextInput.Icon icon="phone" color="#1E3A8A" />}
                    theme={theme}
                    placeholder="please enter your phone number"
                  />
                  {touched.phone && errors.phone && (
                    <HelperText
                      type="error"
                      visible={touched.phone && errors.phone}
                      style={styles.errorText}
                    >
                      {errors.phone}
                    </HelperText>
                  )}

                  <Text style={styles.inputLabel}>Address</Text>
                  <TextInput
                    value={values.address}
                    onChangeText={handleChange("address")}
                    onBlur={handleBlur("address")}
                    mode="outlined"
                    style={styles.input}
                    numberOfLines={3}
                    left={<TextInput.Icon icon="map-marker" color="#1E3A8A" />}
                    theme={theme}
                    placeholder="please enter your address"
                  />
                </View>

                {/* Section: Client Preferences */}
                <Text style={styles.sectionTitle}>Client Preferences</Text>
                <View style={styles.sectionCard}>
                  <Text style={styles.inputLabel}>Budget</Text>
                  <TextInput
                    value={values.budget}
                    onChangeText={handleChange("budget")}
                    onBlur={handleBlur("budget")}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                    error={touched.budget && errors.budget}
                    left={
                      <TextInput.Icon icon="currency-usd" color="#1E3A8A" />
                    }
                    theme={theme}
                    placeholder="e.g., 250000"
                  />
                  {touched.budget && errors.budget && (
                    <HelperText
                      type="error"
                      visible={touched.budget && errors.budget}
                      style={styles.errorText}
                    >
                      {errors.budget}
                    </HelperText>
                  )}

                  <Text style={styles.inputLabel}>Specific Requirements</Text>
                  <TextInput
                    value={values.requirements}
                    onChangeText={handleChange("requirements")}
                    onBlur={handleBlur("requirements")}
                    mode="outlined"
                    style={styles.input}
                    numberOfLines={4}
                    left={<TextInput.Icon icon="text-box" color="#1E3A8A" />}
                    theme={theme}
                    placeholder="please provide your requirements"
                  />
                </View>

                {/* Section: Categorization */}
                <Text style={styles.sectionTitle}>Categorization</Text>
                <View style={styles.sectionCard}>
                  <Text style={styles.inputLabel}>Tags</Text>
                  <View style={styles.tagsContainer}>
                    {values.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        onClose={() => removeTag(tag, setFieldValue, values)}
                        style={styles.chip}
                        textStyle={styles.chipText}
                        icon="tag"
                      >
                        {tag}
                      </Chip>
                    ))}
                    <TouchableOpacity
                      style={styles.addTagButton}
                      onPress={() => setShowTagsModal(true)}
                    >
                      <FontAwesome5 name="plus" size={wp(4)} color="#1E3A8A" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Section: Financial Details */}
                <Text style={styles.sectionTitle}>Financial Details</Text>
                <View style={styles.sectionCard}>
                  <Text style={styles.inputLabel}>Payment Terms</Text>
                  <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                    <TextInput
                      value={values.paymentTerms}
                      mode="outlined"
                      style={styles.input}
                      editable={false}
                      left={
                        <TextInput.Icon icon="credit-card" color="#1E3A8A" />
                      }
                      right={
                        <TextInput.Icon icon="chevron-down" color="#1E3A8A" />
                      }
                      theme={theme}
                      placeholder="Select payment terms"
                    />
                  </TouchableOpacity>

                  <Text style={styles.inputLabel}>Project Deadline</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <TextInput
                      value={values.projectDeadline.toLocaleDateString()}
                      mode="outlined"
                      style={styles.input}
                      editable={false}
                      left={<TextInput.Icon icon="calendar" color="#1E3A8A" />}
                      right={
                        <TextInput.Icon icon="chevron-down" color="#1E3A8A" />
                      }
                      theme={theme}
                      placeholder="Select deadline"
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
                  contentContainerStyle={styles.modalContent}
                >
                  <Text style={styles.modalTitle}>Select or Add Tags</Text>
                  <TextInput
                    label="Custom Tag"
                    value={newTag}
                    onChangeText={setNewTag}
                    mode="outlined"
                    style={styles.input}
                    right={
                      <TextInput.Icon
                        icon="plus"
                        onPress={() => {
                          addTag(newTag, setFieldValue, values);
                          setNewTag("");
                        }}
                        color="#1E3A8A"
                      />
                    }
                    theme={theme}
                  />
                  <View style={styles.commonTagsContainer}>
                    {commonTags.map((tag) => (
                      <Chip
                        key={tag}
                        onPress={() => addTag(tag, setFieldValue, values)}
                        style={styles.commonTag}
                        textStyle={styles.chipText}
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
                  contentContainerStyle={styles.modalContent}
                >
                  <Text style={styles.modalTitle}>Select Payment Terms</Text>
                  {paymentTerms.map((terms, index) => (
                    <React.Fragment key={terms}>
                      <List.Item
                        title={terms}
                        titleStyle={styles.modalItem}
                        onPress={() => {
                          setFieldValue("paymentTerms", terms);
                          setShowTermsModal(false);
                        }}
                      />
                      {index < paymentTerms.length - 1 && (
                        <Divider style={styles.modalDivider} />
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
                />
              )}
            </Animated.View>
          )}
        </Formik>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: hp(1),
  },
  chip: {
    marginRight: wp(2),
    marginBottom: hp(1),
    backgroundColor: "#E0F2FE",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: wp(5),
  },
  chipText: {
    fontSize: wp(3.5),
    color: "#1E3A8A",
    fontWeight: "600",
  },
  addTagButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: "#BFDBFE",
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
    backgroundColor: "#E0F2FE",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: wp(5),
  },
  errorText: {
    fontSize: wp(3.5),
    marginBottom: hp(1),
  },
});
