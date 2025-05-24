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
  Surface,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { Formik } from "formik";
import * as Yup from "yup";

const commonTags = [
  "Video Editing",
  "Website Development",
  "Graphic Design",
  "Mobile App",
  "Urgent",
  "Photo Editing",
  "Social Media",
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
  tags: Yup.array(),
  paymentTerms: Yup.string(),
});

const getTheme = (colorScheme) => ({
  colors: {
    primary: colorScheme === "dark" ? "#60A5FA" : "#1E3A8A",
    error: colorScheme === "dark" ? "#F87171" : "#B91C1C",
    background: colorScheme === "dark" ? "#1A1A1A" : "#EFF6FF",
    text: colorScheme === "dark" ? "#F3F4F6" : "#1F2937",
    placeholder: colorScheme === "dark" ? "#9CA3AF" : "#6B7280",
    surface: colorScheme === "dark" ? "#2A2A2A" : "#FFFFFF",
  },
  roundness: wp(3),
});

export default function AddClientScreen({ navigation }) {
  const { userProfile } = useAuth();
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
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
    tags: [],
    paymentTerms: "",
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (!userProfile?.businessId) {
        Alert.alert("Error", "No business ID found. Please try again later.");
        return;
      }

      const clientData = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        tags: values.tags,
        paymentTerms: values.paymentTerms,
        businessId: userProfile.businessId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      };

      await addDoc(collection(db, "clients"), clientData);

      Alert.alert("Success", "Client added successfully!", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("Error adding client: ", error);
      Alert.alert("Error", "Failed to add client. Please try again.");
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

  const getSectionCardBorderStyles = () => ({
    borderWidth: colorScheme === "dark" ? 0 : 1,
    borderColor: colorScheme === "dark" ? undefined : "#E5E7EB",
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#1A1A1A", "#1A1A1A"]
            : ["#0047CC", "#0047CC"]
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
            <FontAwesome5 name="arrow-left" size={wp(5)} color="#FFFFFF" />
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
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <ScrollView style={styles.scrollView}>
                {/* Contact Information */}
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  Contact Information
                </Text>
                <Surface
                  style={[styles.sectionCard, getSectionCardBorderStyles()]}
                >
                  <LinearGradient
                    colors={
                      colorScheme === "dark"
                        ? ["#2A2A2A", "#2A2A2A80"]
                        : ["#FFFFFF", "#FFFFFF"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
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
                      placeholder="Enter full name"
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
                      placeholder="Enter email"
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
                      placeholder="Enter phone number"
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
                      placeholder="Enter address"
                      textColor={theme.colors.text}
                      placeholderTextColor={theme.colors.placeholder}
                      disabled={isSubmitting}
                    />
                  </LinearGradient>
                </Surface>

                {/* Categorization */}
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  Categorization
                </Text>
                <Surface
                  style={[styles.sectionCard, getSectionCardBorderStyles()]}
                >
                  <LinearGradient
                    colors={
                      colorScheme === "dark"
                        ? ["#2A2A2A", "#2A2A2A80"]
                        : ["#FFFFFF", "#FFFFFF"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
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
                              backgroundColor: theme.colors.surface,
                              borderColor:
                                colorScheme === "dark" ? "#6B7280" : "#E5E7EB",
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
                            backgroundColor: theme.colors.background,
                            borderColor:
                              colorScheme === "dark" ? "#6B7280" : "#E5E7EB",
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
                  </LinearGradient>
                </Surface>

                {/* Financial Details */}
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  Financial Details
                </Text>
                <Surface
                  style={[styles.sectionCard, getSectionCardBorderStyles()]}
                >
                  <LinearGradient
                    colors={
                      colorScheme === "dark"
                        ? ["#2A2A2A", "#2A2A2A80"]
                        : ["#FFFFFF", "#FFFFFF"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                  >
                    <Text
                      style={[styles.inputLabel, { color: theme.colors.text }]}
                    >
                      Payment Terms
                    </Text>
                    <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                      <TextInput
                        value={values.paymentTerms}
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
                  </LinearGradient>
                </Surface>

                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={[styles.submitButton, { backgroundColor: "#0047CC" }]}
                  contentStyle={styles.buttonContent}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  theme={theme}
                  icon="check"
                  labelStyle={styles.buttonLabel}
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
                    value={newTag}
                    onChangeText={setNewTag}
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
                    placeholder="Enter custom tag"
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
                            backgroundColor: theme.colors.surface,
                            borderColor:
                              colorScheme === "dark" ? "#6B7280" : "#E5E7EB",
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
                    style={[
                      styles.modalButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    theme={theme}
                    labelStyle={styles.buttonLabel}
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
                        <Divider style={styles.modalDivider} />
                      )}
                    </React.Fragment>
                  ))}
                </Modal>
              </Portal>
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
    paddingHorizontal: wp(5),
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
    width: "100%",
  },
  backButton: {
    padding: wp(2),
    borderRadius: wp(2),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: wp(6),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  keyboardAvoid: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(10),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: "600",
    marginVertical: hp(2),
    letterSpacing: 0.3,
  },
  sectionCard: {
    marginBottom: hp(2),
    borderRadius: 20,
  },
  cardGradient: {
    borderRadius: 16,
    padding: wp(4),
  },
  input: {
    marginBottom: hp(1.5),
    borderRadius: wp(3),
    height: hp(6),
    backgroundColor: "#FFFFFF",
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
    gap: wp(2),
  },
  chip: {
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
  },
  submitButton: {
    marginVertical: hp(3),
    borderRadius: wp(3),
  },
  buttonContent: {
    height: hp(6),
    flexDirection: "row",
    alignItems: "center",
  },
  buttonLabel: {
    fontSize: wp(4),
    color: "#FFFFFF",
  },
  modalContent: {
    padding: wp(5),
    margin: wp(5),
    borderRadius: wp(4),
  },
  modalTitle: {
    fontSize: wp(5.5),
    fontWeight: "700",
    marginBottom: hp(2),
  },
  modalItem: {
    fontSize: wp(4),
  },
  modalDivider: {
    backgroundColor: "#6B7280",
  },
  modalButton: {
    marginTop: hp(2),
    borderRadius: wp(3),
  },
  commonTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: hp(2),
    gap: wp(2),
  },
  commonTag: {
    marginBottom: hp(1),
    borderWidth: 1,
    borderRadius: wp(5),
  },
});
