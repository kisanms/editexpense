import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  useColorScheme,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Chip,
  Button,
  Divider,
  IconButton,
  Portal,
  Modal,
  ProgressBar,
  Menu,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

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

export default function OrderDetailsScreen({ route, navigation }) {
  const { order } = route.params;
  const { userProfile } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [client, setClient] = useState(null);
  const [project, setProject] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
    if (!userProfile?.businessId) {
      console.warn("No business ID found for user");
      return;
    }

    if (order.businessId !== userProfile.businessId) {
      Alert.alert(
        "Access Denied",
        "You don't have permission to view this order.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const fetchDetails = async () => {
      try {
        const clientRef = doc(db, "clients", order.clientId);
        const employeeRef = doc(db, "employees", order.employeeId);
        const projectRef = order.projectId
          ? doc(db, `clients/${order.clientId}/projects`, order.projectId)
          : null;

        const [clientDoc, employeeDoc, projectDoc] = await Promise.all([
          getDoc(clientRef),
          getDoc(employeeRef),
          projectRef ? getDoc(projectRef) : Promise.resolve(null),
        ]);

        if (clientDoc.exists()) {
          const clientData = clientDoc.data();
          if (clientData.businessId === userProfile.businessId) {
            setClient({ id: clientDoc.id, ...clientData });
          } else {
            console.warn("Client does not belong to this business");
          }
        }

        if (employeeDoc.exists()) {
          const employeeData = employeeDoc.data();
          if (employeeData.businessId === userProfile.businessId) {
            setEmployee({ id: employeeDoc.id, ...employeeData });
          } else {
            console.warn("Employee does not belong to this business");
          }
        }

        if (projectDoc?.exists()) {
          const projectData = projectDoc.data();
          if (projectData.businessId === userProfile.businessId) {
            setProject({ id: projectDoc.id, ...projectData });
          } else {
            console.warn("Project does not belong to this business");
          }
        }
      } catch (error) {
        console.error("Error fetching details: ", error);
        Alert.alert(
          "Error",
          "Failed to load order details. Please try again.",
          [{ text: "OK" }],
          { cancelable: false }
        );
      }
    };

    fetchDetails();
  }, [userProfile?.businessId, order]);

  const handleStatusChange = async (status) => {
    try {
      if (order.businessId !== userProfile.businessId) {
        Alert.alert(
          "Access Denied",
          "You don't have permission to modify this order.",
          [{ text: "OK" }]
        );
        return;
      }

      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      navigation.setParams({ order: { ...order, status } });
      setMenuVisible(false);
    } catch (error) {
      console.error("Error updating status: ", error);
      Alert.alert(
        "Error",
        "Failed to update status. Please try again.",
        [{ text: "OK" }],
        { cancelable: false }
      );
    }
  };

  const handleDelete = async () => {
    try {
      if (order.businessId !== userProfile.businessId) {
        Alert.alert(
          "Access Denied",
          "You don't have permission to delete this order.",
          [{ text: "OK" }]
        );
        return;
      }

      setIsDeleting(true);
      const orderRef = doc(db, "orders", order.id);
      await deleteDoc(orderRef);
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (error) {
      console.error("Error deleting order: ", error);
      Alert.alert(
        "Error",
        "Failed to delete order. Please try again.",
        [{ text: "OK" }],
        { cancelable: false }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "in-progress":
        return {
          bg: colorScheme === "dark" ? "#3B82F620" : "#EFF6FF",
          text: theme.colors.primary,
          border: theme.colors.primary,
        };
      case "completed":
        return {
          bg: colorScheme === "dark" ? "#2DD4BF20" : "#E6FFFA",
          text: "#38B2AC",
          border: "#38B2AC",
        };
      case "cancelled":
        return {
          bg: colorScheme === "dark" ? "#F8717120" : "#FEE2E2",
          text: theme.colors.error,
          border: theme.colors.error,
        };
      default:
        return {
          bg: colorScheme === "dark" ? "#4B5563" : "#F3F4F6",
          text: theme.colors.placeholder,
          border: theme.colors.placeholder,
        };
    }
  };

  const getProgressValue = (status) => {
    switch (status) {
      case "in-progress":
        return 0.5;
      case "completed":
        return 1;
      case "cancelled":
        return 0;
      default:
        return 0;
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
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("EditOrder", { order })}
            >
              <FontAwesome5 name="pencil-alt" size={wp(5)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={[styles.orderTitle, { color: theme.colors.text }]}>
                  Order #{order.id.slice(-6)}
                </Text>
                <Chip
                  mode="outlined"
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: getStatusColor(order.status).bg,
                      borderColor: getStatusColor(order.status).border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(order.status).text },
                    ]}
                  >
                    {order.status}
                  </Text>
                </Chip>
              </View>

              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={getProgressValue(order.status)}
                  color={getStatusColor(order.status).text}
                  style={styles.progressBar}
                />
                <View style={styles.progressLabels}>
                  <Text
                    style={[styles.progressLabel, { color: theme.colors.text }]}
                  >
                    In Progress
                  </Text>
                  <Text
                    style={[styles.progressLabel, { color: theme.colors.text }]}
                  >
                    Completed
                  </Text>
                </View>
              </View>

              <Divider
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.placeholder },
                ]}
              />

              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  Order Information
                </Text>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="calendar"
                    size={wp(4)}
                    color={theme.colors.placeholder}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    Created:{" "}
                    {order.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="dollar-sign"
                    size={wp(4)}
                    color={theme.colors.placeholder}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    Amount: ${Number(order.amount || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="info-circle"
                    size={wp(4)}
                    color={theme.colors.placeholder}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    Description: {order.description || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="calendar-check"
                    size={wp(4)}
                    color={theme.colors.placeholder}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    Deadline:{" "}
                    {order.deadline?.toDate?.().toLocaleDateString() || "N/A"}
                  </Text>
                </View>
              </View>

              <Divider
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.placeholder },
                ]}
              />

              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  Project Information
                </Text>
                {project ? (
                  <View>
                    <View style={styles.infoRow}>
                      <FontAwesome5
                        name="folder"
                        size={wp(4)}
                        color={theme.colors.placeholder}
                      />
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        {project.projectName || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5
                        name="dollar-sign"
                        size={wp(4)}
                        color={theme.colors.placeholder}
                      />
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        Budget: ${Number(project.budget || 0).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5
                        name="calendar"
                        size={wp(4)}
                        color={theme.colors.placeholder}
                      />
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        Deadline:{" "}
                        {project.deadline?.toDate?.().toLocaleDateString() ||
                          "N/A"}
                      </Text>
                    </View>
                  </View>
                ) : order.projectId ? (
                  <Text
                    style={[styles.loadingText, { color: theme.colors.text }]}
                  >
                    Loading project details...
                  </Text>
                ) : (
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    No project assigned
                  </Text>
                )}
              </View>

              <Divider
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.placeholder },
                ]}
              />

              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  Client Information
                </Text>
                {client ? (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("ClientDetails", { client })
                    }
                  >
                    <View style={styles.infoRow}>
                      <FontAwesome5
                        name="user"
                        size={wp(4)}
                        color={theme.colors.placeholder}
                      />
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        {client.fullName || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5
                        name="phone"
                        size={wp(4)}
                        color={theme.colors.placeholder}
                      />
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        {client.phone || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5
                        name="envelope"
                        size={wp(4)}
                        color={theme.colors.placeholder}
                      />
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        {client.email || "N/A"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text
                    style={[styles.loadingText, { color: theme.colors.text }]}
                  >
                    Loading client details...
                  </Text>
                )}
              </View>

              <Divider
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.placeholder },
                ]}
              />

              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  Assigned Employee
                </Text>
                {employee ? (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("EmployeeDetails", { employee })
                    }
                  >
                    <View style={styles.infoRow}>
                      <FontAwesome5
                        name="user-tie"
                        size={wp(4)}
                        color={theme.colors.placeholder}
                      />
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        {employee.fullName || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5
                        name="tools"
                        size={wp(4)}
                        color={theme.colors.placeholder}
                      />
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        {employee.skills || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5
                        name="suitcase"
                        size={wp(4)}
                        color={theme.colors.placeholder}
                      />
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        Experience: {employee.experience || "N/A"} years
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text
                    style={[styles.loadingText, { color: theme.colors.text }]}
                  >
                    Loading employee details...
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>

          <View style={styles.buttonContainer}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="contained"
                  onPress={() => setMenuVisible(true)}
                  style={[
                    styles.statusButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  labelStyle={styles.buttonLabel}
                  icon="account-switch"
                  theme={theme}
                >
                  Set Status
                </Button>
              }
            >
              <Menu.Item
                onPress={() => handleStatusChange("in-progress")}
                title="In Progress"
                leadingIcon="progress-clock"
                disabled={order.status === "in-progress"}
                titleStyle={{ color: theme.colors.text }}
              />
              <Menu.Item
                onPress={() => handleStatusChange("completed")}
                title="Completed"
                leadingIcon="check-circle"
                disabled={order.status === "completed"}
                titleStyle={{ color: theme.colors.text }}
              />
              <Menu.Item
                onPress={() => handleStatusChange("cancelled")}
                title="Cancelled"
                leadingIcon="close-circle"
                disabled={order.status === "cancelled"}
                titleStyle={{ color: theme.colors.text }}
              />
            </Menu>
            <Button
              mode="outlined"
              onPress={() => setShowDeleteModal(true)}
              style={[styles.deleteButton, { borderColor: theme.colors.error }]}
              labelStyle={[styles.buttonLabel, { color: theme.colors.error }]}
              icon="delete"
              theme={theme}
            >
              Delete Order
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
          <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>
            Delete Order
          </Text>
          <Text style={[styles.modalText, { color: theme.colors.text }]}>
            Are you sure you want to permanently delete this order? This action
            cannot be undone.
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="contained-tonal"
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
    flex: 1,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(3),
  },
  card: {
    borderRadius: wp(4),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    marginBottom: hp(2),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1.5),
  },
  orderTitle: {
    fontSize: wp(5),
    fontWeight: "700",
    flex: 1,
  },
  statusChip: {
    borderWidth: 1,
  },
  statusText: {
    fontSize: wp(3.5),
    fontWeight: "500",
    textTransform: "capitalize",
  },
  progressContainer: {
    marginVertical: hp(2),
  },
  progressBar: {
    height: hp(1),
    borderRadius: wp(1),
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp(0.5),
  },
  progressLabel: {
    fontSize: wp(3.5),
    fontWeight: "500",
  },
  divider: {
    marginVertical: hp(2),
  },
  section: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: "600",
    marginBottom: hp(1.5),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp(0.8),
  },
  infoText: {
    fontSize: wp(4),
    marginLeft: wp(3),
    flex: 1,
  },
  loadingText: {
    fontSize: wp(4),
    fontStyle: "italic",
    marginVertical: hp(1),
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp(2),
  },
  statusButton: {
    flex: 1,
    marginRight: wp(2),
    borderRadius: wp(3),
  },
  deleteButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: wp(3),
  },
  buttonLabel: {
    fontSize: wp(4),
    fontWeight: "500",
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
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    marginLeft: wp(2),
    borderRadius: wp(3),
  },
});
