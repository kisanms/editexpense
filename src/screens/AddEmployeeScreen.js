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
import { TextInput, Text, Button, HelperText } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

const validationSchema = Yup.object().shape({
  fullName: Yup.string().required("Full name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  address: Yup.string().required("Address is required"),
  skills: Yup.string().required("Skills are required"),
  experience: Yup.string().required("Experience is required"),
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

export default function AddEmployeeScreen({ navigation }) {
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
    skills: "",
    experience: "",
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const docRef = await addDoc(collection(db, "employees"), {
        ...values,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      });

      console.log("Employee added with ID: ", docRef.id);

      Alert.alert(
        "Success",
        "Employee added successfully!",
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
      console.error("Error adding employee: ", error);
      Alert.alert(
        "Error",
        "Failed to add employee. Please try again.",
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
          <Text style={styles.headerTitle}>Add New Employee</Text>
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
                {/* Section: Personal Information */}
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  Personal Information
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
                    placeholder="Enter email address"
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
                    Address *
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
                    placeholder="Enter address"
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                  {touched.address && errors.address && (
                    <HelperText
                      type="error"
                      visible={touched.address && errors.address}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.address}
                    </HelperText>
                  )}
                </View>

                {/* Section: Professional Details */}
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  Professional Details
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
                    Skills *
                  </Text>
                  <TextInput
                    value={values.skills}
                    onChangeText={handleChange("skills")}
                    onBlur={handleBlur("skills")}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    error={touched.skills && errors.skills}
                    left={
                      <TextInput.Icon
                        icon="tools"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    placeholder="Enter skills (comma separated)"
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                  {touched.skills && errors.skills && (
                    <HelperText
                      type="error"
                      visible={touched.skills && errors.skills}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.skills}
                    </HelperText>
                  )}

                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Experience *
                  </Text>
                  <TextInput
                    value={values.experience}
                    onChangeText={handleChange("experience")}
                    onBlur={handleBlur("experience")}
                    mode="outlined"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    error={touched.experience && errors.experience}
                    left={
                      <TextInput.Icon
                        icon="briefcase"
                        color={theme.colors.primary}
                      />
                    }
                    theme={theme}
                    placeholder="Enter years of experience"
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.placeholder}
                    disabled={isSubmitting}
                  />
                  {touched.experience && errors.experience && (
                    <HelperText
                      type="error"
                      visible={touched.experience && errors.experience}
                      style={{ color: theme.colors.error }}
                    >
                      {errors.experience}
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
                  Add Employee
                </Button>
              </ScrollView>
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
  errorText: {
    fontSize: wp(3.5),
    marginBottom: hp(1),
  },
});
