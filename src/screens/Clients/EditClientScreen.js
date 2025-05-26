import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { useAuth } from "../../context/AuthContext";

const commonTags = [
  "Video Editing",
  "Photo Editing",
  "Reels Creation",
  "HDR Photography",
  "Urgent",
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
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  address: Yup.string(),
  paymentTerms: Yup.string(),
  tags: Yup.array().of(Yup.string()),
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

const TagInput = React.memo(
  ({ onAddTag, theme, placeholder, placeholderTextColor, textColor }) => {
    const [inputValue, setInputValue] = useState("");
    const tagInputRef = useRef(null);

    const handleSubmit = useCallback(() => {
      const trimmedValue = inputValue.trim();
      if (trimmedValue) {
        onAddTag(trimmedValue);
        setInputValue("");
      }
    }, [inputValue, onAddTag]);

    const handleChangeText = useCallback((text) => {
      setInputValue(text);
    }, []);

    return (
      <TextInput
        ref={tagInputRef}
        value={inputValue}
        onChangeText={handleChangeText}
        style={[styles.input, { backgroundColor: theme.colors.surface }]}
        right={
          inputValue.trim() ? (
            <TextInput.Icon
              icon="plus"
              onPress={handleSubmit}
              color={theme.colors.primary}
            />
          ) : null
        }
        theme={theme}
        placeholder={placeholder}
        textColor={textColor}
        placeholderTextColor={placeholderTextColor}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        autoCorrect={false}
        autoCapitalize="words"
        multiline={false}
        keyboardType={
          Platform.OS === "android" ? "visible-password" : "default"
        }
      />
    );
  }
);

export default function EditClientScreen({ route, navigation }) {
  const { client } = route.params;
  const { userProfile } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [showTagModal, setShowTagModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
    if (client.businessId !== userProfile?.businessId) {
      Alert.alert(
        "Access Denied",
        "You don't have permission to edit this client.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
        { cancelable: false }
      );
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [client.businessId, userProfile?.businessId, fadeAnim, scaleAnim]);

  const initialValues = {
    fullName: client.fullName || "",
    email: client.email || "",
    phone: client.phone || "",
    address: client.address || "",
    paymentTerms: client.paymentTerms || "",
    tags: client.tags || [],
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (client.businessId !== userProfile?.businessId) {
        Alert.alert(
          "Access Denied",
          "You don't have permission to edit this client.",
          [{ text: "OK" }],
          { cancelable: false }
        );
        return;
      }

      const updatedValues = {
        ...values,
        businessId: userProfile.businessId,
        updatedAt: serverTimestamp(),
      };

      const clientRef = doc(db, "clients", client.id);
      await updateDoc(clientRef, updatedValues);

      Alert.alert(
        "Success",
        "Client updated successfully!",
        [{ text: "OK", onPress: () => navigation.goBack() }],
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

  const addTag = useCallback((tag, setFieldValue, values) => {
    if (tag && !values.tags.includes(tag)) {
      setFieldValue("tags", [...values.tags, tag]);
    }
  }, []);

  const removeTag = useCallback((tag, setFieldValue, values) => {
    setFieldValue(
      "tags",
      values.tags.filter((t) => t !== tag)
    );
  }, []);

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
                {/* Basic Information */}
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
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
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
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
                  style={[styles.submitButton, { backgroundColor: "#0047CC" }]}
                  contentStyle={styles.buttonContent}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  theme={theme}
                  icon="check"
                  labelStyle={styles.buttonLabel}
                >
                  Update Client
                </Button>
              </ScrollView>

              {/* Tags Modal */}
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
                    style={[styles.modalTitle, { color: theme.colors.primary }]}
                  >
                    Select or Add Tags
                  </Text>
                  <TagInput
                    onAddTag={(tag) => addTag(tag, setFieldValue, values)}
                    theme={theme}
                    placeholder="Enter custom tag"
                    placeholderTextColor={theme.colors.placeholder}
                    textColor={theme.colors.text}
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
                    onPress={() => setShowTagModal(false)}
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
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(2),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    marginBottom: hp(1.5),
    borderRadius: wp(3),
    height: hp(6),
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
