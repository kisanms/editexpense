import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
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
import { db } from "../config/firebase";

export default function OrderDetailsScreen({ route, navigation }) {
  const { order } = route.params;
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [client, setClient] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const fetchDetails = async () => {
      try {
        const clientDoc = await getDoc(doc(db, "clients", order.clientId));
        const employeeDoc = await getDoc(
          doc(db, "employees", order.employeeId)
        );

        if (clientDoc.exists()) {
          setClient({ id: clientDoc.id, ...clientDoc.data() });
        }
        if (employeeDoc.exists()) {
          setEmployee({ id: employeeDoc.id, ...employeeDoc.data() });
        }
      } catch (error) {
        console.error("Error fetching details: ", error);
      }
    };

    fetchDetails();
  }, []);

  const handleStatusChange = async (status) => {
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      navigation.setParams({ order: { ...order, status } });
      setMenuVisible(false);
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const orderRef = doc(db, "orders", order.id);
      await deleteDoc(orderRef);
      navigation.goBack();
    } catch (error) {
      console.error("Error deleting order: ", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "in-progress":
        return { bg: "#EFF6FF", text: "#3B82F6", border: "#3B82F6" };
      case "completed":
        return { bg: "#E6FFFA", text: "#38B2AC", border: "#38B2AC" };
      case "cancelled":
        return { bg: "#FEE2E2", text: "#EF4444", border: "#EF4444" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280", border: "#6B7280" };
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

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={styles.orderTitle}>
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
                  <Text style={styles.progressLabel}>In Progress</Text>
                  <Text style={styles.progressLabel}>Completed</Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Information</Text>
                <View style={styles.infoRow}>
                  <FontAwesome5 name="calendar" size={wp(4)} color="#6B7280" />
                  <Text style={styles.infoText}>
                    Created:{" "}
                    {order.createdAt?.toDate().toLocaleDateString() || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="dollar-sign"
                    size={wp(4)}
                    color="#6B7280"
                  />
                  <Text style={styles.infoText}>Amount: ${order.amount}</Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="info-circle"
                    size={wp(4)}
                    color="#6B7280"
                  />
                  <Text style={styles.infoText}>
                    Description: {order.description}
                  </Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Client Information</Text>
                {client ? (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("ClientDetails", { client })
                    }
                  >
                    <View style={styles.infoRow}>
                      <FontAwesome5 name="user" size={wp(4)} color="#6B7280" />
                      <Text style={styles.infoText}>{client.fullName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5 name="phone" size={wp(4)} color="#6B7280" />
                      <Text style={styles.infoText}>{client.phone}</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.loadingText}>
                    Loading client details...
                  </Text>
                )}
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assigned Employee</Text>
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
                        color="#6B7280"
                      />
                      <Text style={styles.infoText}>{employee.fullName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5 name="tools" size={wp(4)} color="#6B7280" />
                      <Text style={styles.infoText}>{employee.skills}</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.loadingText}>
                    Loading employee details...
                  </Text>
                )}
              </View>

              {/* <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Notes</Text>
                <Text style={styles.notesText}>
                  {order.notes || "No additional notes"}
                </Text>
              </View> */}
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
                  style={styles.statusButton}
                  labelStyle={styles.buttonLabel}
                  icon="account-switch"
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
              />
              <Menu.Item
                onPress={() => handleStatusChange("completed")}
                title="Completed"
                leadingIcon="check-circle"
                disabled={order.status === "completed"}
              />
              <Menu.Item
                onPress={() => handleStatusChange("cancelled")}
                title="Cancelled"
                leadingIcon="close-circle"
                disabled={order.status === "cancelled"}
              />
            </Menu>
            <Button
              mode="outlined"
              onPress={() => setShowDeleteModal(true)}
              style={styles.deleteButton}
              labelStyle={[styles.buttonLabel, { color: "#EF4444" }]}
              icon="delete"
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
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Delete Order</Text>
          <Text style={styles.modalText}>
            Are you sure you want to permanently delete this order? This action
            cannot be undone.
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowDeleteModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleDelete}
              loading={isDeleting}
              style={[styles.modalButton, { backgroundColor: "#EF4444" }]}
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
  headerTitle: {
    fontSize: wp(6),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(10),
  },
  card: {
    elevation: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: wp(3),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
  },
  orderTitle: {
    fontSize: wp(5.5),
    fontWeight: "700",
    color: "#1F2937",
  },
  statusChip: {
    height: hp(4),
  },
  statusText: {
    fontSize: wp(3.5),
    fontWeight: "600",
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
    marginTop: hp(1),
  },
  progressLabel: {
    fontSize: wp(3.5),
    color: "#6B7280",
  },
  divider: {
    marginVertical: hp(2),
    backgroundColor: "#E5E7EB",
  },
  section: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: hp(1),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1),
  },
  infoText: {
    fontSize: wp(4),
    color: "#6B7280",
    marginLeft: wp(2),
  },
  loadingText: {
    fontSize: wp(4),
    color: "#6B7280",
    fontStyle: "italic",
  },
  notesText: {
    fontSize: wp(4),
    color: "#6B7280",
    lineHeight: hp(3),
  },
  buttonContainer: {
    marginTop: hp(4),
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusButton: {
    flex: 1,
    marginRight: wp(2),
    backgroundColor: "#1E3A8A",
  },
  deleteButton: {
    flex: 1,
    marginLeft: wp(2),
    borderColor: "#EF4444",
  },
  buttonLabel: {
    fontSize: wp(4),
    fontWeight: "600",
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
    marginBottom: hp(2),
  },
  modalText: {
    fontSize: wp(4),
    color: "#6B7280",
    marginBottom: hp(3),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    marginLeft: wp(2),
  },
});
