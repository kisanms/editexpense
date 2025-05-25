import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Divider,
  Portal,
  Modal,
  Surface,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useColorScheme } from "react-native";

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

const ProjectDetailsScreen = ({ route }) => {
  const { project } = route.params || {};
  const clientId = project?.clientId; // Extract clientId from project
  const { userProfile } = useAuth();
  const navigation = useNavigation();
  const [projectData, setProjectData] = useState(project);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const fetchProjectData = async () => {
      setIsLoading(true);
      try {
        // Validate input parameters
        if (!clientId || !project?.id) {
          console.error("Invalid navigation parameters:", {
            clientId,
            projectId: project?.id,
          });
          Alert.alert(
            "Error",
            "Invalid project or client data. Please try again.",
            [{ text: "OK", onPress: () => navigation.goBack() }],
            { cancelable: false }
          );
          return;
        }

        // Log parameters for debugging
        console.log("Fetching project with:", {
          clientId,
          projectId: project.id,
        });

        // Validate user permissions
        if (
          !userProfile?.businessId ||
          project.businessId !== userProfile.businessId
        ) {
          console.log("Permission check failed:", {
            userBusinessId: userProfile?.businessId,
            projectBusinessId: project.businessId,
          });
          Alert.alert(
            "Access Denied",
            "You don't have permission to view this project.",
            [{ text: "OK", onPress: () => navigation.goBack() }],
            { cancelable: false }
          );
          return;
        }

        const projectRef = doc(db, `clients/${clientId}/projects`, project.id);
        console.log(
          "Firestore path:",
          `clients/${clientId}/projects/${project.id}`
        );
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const data = projectSnap.data();
          console.log("Project data fetched:", data);
          setProjectData({ id: projectSnap.id, ...data, clientId }); // Ensure clientId is preserved
        } else {
          console.log(
            "Project not found at path:",
            `clients/${clientId}/projects/${project.id}`
          );
          Alert.alert(
            "Error",
            "Project not found. It may have been deleted or moved.",
            [{ text: "OK", onPress: () => navigation.goBack() }],
            { cancelable: false }
          );
        }
      } catch (error) {
        console.error("Error fetching project data:", error);
        Alert.alert(
          "Error",
          `Failed to fetch project data: ${error.message}`,
          [{ text: "OK", onPress: () => navigation.goBack() }],
          { cancelable: false }
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [project?.id, clientId, userProfile?.businessId, navigation]);

  const handleEdit = () => {
    if (!projectData?.id || !clientId) {
      Alert.alert("Error", "Cannot edit project due to invalid data.");
      return;
    }
    navigation.navigate("EditProjectScreen", {
      project: { ...projectData, clientId },
    });
  };

  const handleDelete = async () => {
    try {
      if (projectData.businessId !== userProfile?.businessId) {
        Alert.alert(
          "Access Denied",
          "You don't have permission to delete this project.",
          [{ text: "OK" }],
          { cancelable: false }
        );
        return;
      }

      setIsDeleting(true);
      const projectRef = doc(
        db,
        `clients/${clientId}/projects`,
        projectData.id
      );
      await deleteDoc(projectRef);
      setShowDeleteModal(false);
      Alert.alert("Success", "Project deleted successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error deleting project:", error);
      Alert.alert("Error", "Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
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
              <FontAwesome5 name="arrow-left" size={wp(5)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Project Details</Text>
            <View style={{ width: wp(10) }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading project...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <FontAwesome5 name="arrow-left" size={wp(5)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project Details</Text>
          <View style={{ width: wp(10) }} />
        </View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderWidth: colorScheme === "dark" ? 0 : 1,
                borderColor: colorScheme === "dark" ? undefined : "#E5E7EB",
              },
            ]}
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
              <Card.Content>
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {projectData.projectName || "Unnamed Project"}
                  </Text>
                  <View style={styles.infoRow}>
                    <Surface
                      style={[
                        styles.iconSurface,
                        { backgroundColor: theme.colors.background },
                      ]}
                    >
                      <FontAwesome5
                        name="dollar-sign"
                        size={wp(4)}
                        color={theme.colors.primary}
                      />
                    </Surface>
                    <View style={styles.infoContent}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: theme.colors.placeholder },
                        ]}
                      >
                        Budget
                      </Text>
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        {projectData.budget
                          ? `$${Number(projectData.budget).toLocaleString()}`
                          : "N/A"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <Surface
                      style={[
                        styles.iconSurface,
                        { backgroundColor: theme.colors.background },
                      ]}
                    >
                      <FontAwesome5
                        name="clock"
                        size={wp(4)}
                        color={theme.colors.primary}
                      />
                    </Surface>
                    <View style={styles.infoContent}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: theme.colors.placeholder },
                        ]}
                      >
                        Deadline
                      </Text>
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        {projectData.deadline
                          ? (projectData.deadline.toDate
                              ? projectData.deadline.toDate()
                              : new Date(projectData.deadline)
                            ).toLocaleDateString()
                          : "N/A"}
                      </Text>
                    </View>
                  </View>
                  {projectData.requirements && (
                    <View style={styles.infoRow}>
                      <Surface
                        style={[
                          styles.iconSurface,
                          { backgroundColor: theme.colors.background },
                        ]}
                      >
                        <FontAwesome5
                          name="list-ul"
                          size={wp(4)}
                          color={theme.colors.primary}
                        />
                      </Surface>
                      <View style={styles.infoContent}>
                        <Text
                          style={[
                            styles.infoLabel,
                            { color: theme.colors.placeholder },
                          ]}
                        >
                          Requirements
                        </Text>
                        <Text
                          style={[
                            styles.infoText,
                            { color: theme.colors.text },
                          ]}
                        >
                          {projectData.requirements}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </Card.Content>
            </LinearGradient>
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleEdit}
              style={[styles.actionButton, styles.editButton]}
              labelStyle={styles.buttonLabel}
              icon="pencil"
              theme={theme}
            >
              Edit Project
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowDeleteModal(true)}
              style={[
                styles.actionButton,
                styles.deleteButton,
                { borderColor: theme.colors.error },
              ]}
              labelStyle={[styles.buttonLabel, { color: theme.colors.error }]}
              icon="delete"
              theme={theme}
            >
              Delete Project
            </Button>
          </View>
        </ScrollView>
      </Animated.View>

      <Portal>
        <Modal
          visible={showDeleteModal}
          onDismiss={() => setShowDeleteModal(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.error }]}>
            Delete Project
          </Text>
          <Text style={[styles.modalText, { color: theme.colors.text }]}>
            Are you sure you want to permanently delete{" "}
            {projectData.projectName || "this project"}? This action cannot be
            undone.
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowDeleteModal(false)}
              style={styles.modalButton}
              theme={theme}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleDelete}
              loading={isDeleting}
              style={[
                styles.modalButton,
                { backgroundColor: theme.colors.error },
              ]}
              theme={theme}
            >
              Delete
            </Button>
          </View>
        </Modal>
      </Portal>
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
  },
  backButton: {
    padding: wp(2),
    borderRadius: wp(2),
    width: wp(10),
    height: wp(10),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: wp(6),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(10),
  },
  card: {
    marginBottom: hp(2),
    borderRadius: wp(4),
  },
  cardGradient: {
    borderRadius: wp(4),
    padding: wp(1),
  },
  section: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: wp(5),
    fontWeight: "600",
    marginBottom: hp(2),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: hp(2),
  },
  iconSurface: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    marginLeft: wp(3),
    flex: 1,
  },
  infoLabel: {
    fontSize: wp(3.5),
    marginBottom: hp(0.5),
  },
  infoText: {
    fontSize: wp(4),
  },
  buttonContainer: {
    marginTop: hp(2),
    marginBottom: hp(4),
    flexDirection: "row",
    justifyContent: "space-between",
    gap: wp(2),
  },
  actionButton: {
    flex: 1,
    borderRadius: wp(3),
    height: hp(5.5),
    elevation: 3,
  },
  editButton: {
    borderWidth: 1.5,
    justifyContent: "center",
  },
  deleteButton: {
    borderWidth: 1.5,
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: wp(4.5),
    fontWeight: "600",
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
    marginBottom: hp(2),
  },
  modalText: {
    fontSize: wp(4),
    marginBottom: hp(3),
    lineHeight: wp(5.5),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: wp(2),
  },
  modalButton: {
    minWidth: wp(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: hp(1),
    fontSize: wp(4),
  },
});

export default ProjectDetailsScreen;
