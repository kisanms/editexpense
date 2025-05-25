import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Formik } from "formik";
import * as Yup from "yup";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { TextInput, Button, ActivityIndicator } from "react-native-paper";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useColorScheme } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const ProjectSchema = Yup.object().shape({
  projectName: Yup.string().required("Project name is required"),
  budget: Yup.number()
    .required("Budget is required")
    .positive("Budget must be positive"),
  deadline: Yup.date()
    .required("Deadline is required")
    .min(new Date(), "Deadline must be in the future"),
  requirements: Yup.string().optional(),
});

const getTheme = (colorScheme) => ({
  colors: {
    primary: colorScheme === "dark" ? "#60A5FA" : "#1E3A8A",
    error: colorScheme === "dark" ? "#F87171" : "#B91C1C",
    background: colorScheme === "dark" ? "#1A1A1A" : "#EFF6FF",
    text: colorScheme === "dark" ? "#F3F4F6" : "#1F2937",
    placeholder: colorScheme === "dark" ? "#9CA3AF" : "#6B7280",
    surface: colorScheme === "dark" ? "#2A2A2A" : "#FFFFFF",
    accent: "#34D399",
    emailIcon: "#E5B800",
    phoneIcon: "#39FF14",
  },
  roundness: wp(3),
});

const AddProjectScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { clientId } = route.params;
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    StatusBar.setBarStyle(
      colorScheme === "dark" ? "light-content" : "dark-content"
    );
    StatusBar.setBackgroundColor("transparent");
    StatusBar.setTranslucent(true);
  }, [colorScheme]);

  if (!userProfile || !userProfile.businessId) {
    Alert.alert("Error", "User or business ID not available");
    navigation.goBack();
    return null;
  }

  const handleAddProject = useCallback(
    async (values, { resetForm }) => {
      if (isSubmitting) return; // Prevent multiple submissions

      setIsSubmitting(true);
      try {
        await addDoc(collection(db, `clients/${clientId}/projects`), {
          projectName: values.projectName,
          budget: Number(values.budget),
          deadline: values.deadline,
          requirements: values.requirements || "",
          clientId,
          businessId: userProfile.businessId,
          createdAt: serverTimestamp(),
        });
        Alert.alert("Success", "Project added successfully");
        resetForm();
        navigation.goBack();
      } catch (error) {
        Alert.alert("Error", "Failed to add project: " + error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [clientId, userProfile.businessId, navigation, isSubmitting]
  );

  const formatDate = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

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
          <Text style={styles.headerTitle}>Add New Project</Text>
          <View style={{ width: wp(10) }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Formik
          initialValues={{
            projectName: "",
            budget: "",
            deadline: null,
            requirements: "",
          }}
          validationSchema={ProjectSchema}
          onSubmit={handleAddProject}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.formContainer}>
              <TextInput
                label="Project Name"
                value={values.projectName}
                onChangeText={handleChange("projectName")}
                onBlur={handleBlur("projectName")}
                style={styles.input}
                error={touched.projectName && errors.projectName}
                mode="outlined"
                theme={theme}
                placeholderTextColor={theme.colors.placeholder}
                textColor={theme.colors.text}
                left={
                  <TextInput.Icon
                    icon="briefcase"
                    color={theme.colors.primary}
                  />
                }
                disabled={isSubmitting}
              />
              {touched.projectName && errors.projectName && (
                <Text style={[styles.error, { color: theme.colors.error }]}>
                  {errors.projectName}
                </Text>
              )}

              <TextInput
                label="Budget"
                value={values.budget}
                onChangeText={handleChange("budget")}
                onBlur={handleBlur("budget")}
                keyboardType="numeric"
                style={styles.input}
                error={touched.budget && errors.budget}
                mode="outlined"
                theme={theme}
                placeholderTextColor={theme.colors.placeholder}
                textColor={theme.colors.text}
                left={
                  <TextInput.Icon
                    icon="currency-usd"
                    color={theme.colors.primary}
                  />
                }
                disabled={isSubmitting}
              />
              {touched.budget && errors.budget && (
                <Text style={[styles.error, { color: theme.colors.error }]}>
                  {errors.budget}
                </Text>
              )}

              <View style={styles.datePickerContainer}>
                <TextInput
                  label="Deadline"
                  value={formatDate(values.deadline)}
                  style={styles.input}
                  mode="outlined"
                  theme={theme}
                  placeholderTextColor={theme.colors.placeholder}
                  textColor={theme.colors.text}
                  editable={false}
                  error={touched.deadline && errors.deadline}
                  left={
                    <TextInput.Icon
                      icon="calendar"
                      color={theme.colors.primary}
                    />
                  }
                />
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.datePickerButton}
                  disabled={isSubmitting}
                >
                  <FontAwesome5
                    name="calendar-alt"
                    size={wp(5)}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
              {touched.deadline && errors.deadline && (
                <Text style={[styles.error, { color: theme.colors.error }]}>
                  {errors.deadline}
                </Text>
              )}
              {showDatePicker && (
                <DateTimePicker
                  value={values.deadline || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) {
                      setFieldValue("deadline", selectedDate);
                    }
                  }}
                  style={styles.dateTimePicker}
                  accentColor={theme.colors.primary}
                  textColor={theme.colors.text}
                />
              )}

              <TextInput
                label="Requirements"
                value={values.requirements}
                onChangeText={handleChange("requirements")}
                onBlur={handleBlur("requirements")}
                multiline
                numberOfLines={4}
                style={styles.input}
                error={touched.requirements && errors.requirements}
                mode="outlined"
                theme={theme}
                placeholderTextColor={theme.colors.placeholder}
                textColor={theme.colors.text}
                left={
                  <TextInput.Icon
                    icon="text-box"
                    color={theme.colors.primary}
                  />
                }
                disabled={isSubmitting}
              />
              {touched.requirements && errors.requirements && (
                <Text style={[styles.error, { color: theme.colors.error }]}>
                  {errors.requirements}
                </Text>
              )}

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={[styles.button, { backgroundColor: "#0047CC" }]}
                labelStyle={styles.buttonLabel}
                theme={theme}
                icon={isSubmitting ? null : "plus"}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding Project..." : "Add Project"}
              </Button>
            </View>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: hp(3),
    paddingHorizontal: wp(5),
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
  content: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(10),
  },
  formContainer: {
    backgroundColor: "transparent",
  },
  input: {
    marginBottom: hp(2),
    backgroundColor: "transparent",
    borderRadius: wp(3),
  },
  datePickerContainer: {
    position: "relative",
    marginBottom: hp(2),
  },
  datePickerButton: {
    position: "absolute",
    right: wp(3),
    top: hp(1.5),
    padding: wp(2),
  },
  dateTimePicker: {
    backgroundColor: "transparent",
    marginBottom: hp(2),
  },
  error: {
    fontSize: wp(3.5),
    marginBottom: hp(1),
  },
  button: {
    marginTop: hp(2),
    borderRadius: wp(3),
    height: hp(5.5),
    elevation: 3,
  },
  buttonLabel: {
    fontSize: wp(4.5),
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default AddProjectScreen;
