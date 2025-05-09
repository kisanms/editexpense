import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  useColorScheme,
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
  Menu,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

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

export default function EmployeeDetailsScreen({ route, navigation }) {
  const { employee } = route.params;
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleStatusChange = async (status) => {
    try {
      const employeeRef = doc(db, "employees", employee.id);
      await updateDoc(employeeRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      navigation.setParams({ employee: { ...employee, status } });
      setMenuVisible(false);
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const employeeRef = doc(db, "employees", employee.id);
      await deleteDoc(employeeRef);
      navigation.goBack();
    } catch (error) {
      console.error("Error deleting employee: ", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
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
          <Text style={styles.headerTitle}>Employee Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("EditEmployee", { employee })}
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
          <Card
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text
                  style={[styles.employeeName, { color: theme.colors.text }]}
                >
                  {employee.fullName}
                </Text>
                <Chip
                  mode="outlined"
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        employee.status === "active"
                          ? colorScheme === "dark"
                            ? "#2DD4BF20"
                            : "#D1FAE5"
                          : colorScheme === "dark"
                          ? "#F8717120"
                          : "#FEE2E2",
                      borderColor:
                        employee.status === "active"
                          ? "#38B2AC"
                          : theme.colors.error,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          employee.status === "active"
                            ? "#38B2AC"
                            : theme.colors.error,
                      },
                    ]}
                  >
                    {employee.status.charAt(0).toUpperCase() +
                      employee.status.slice(1)}
                  </Text>
                </Chip>
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
                  Contact Information
                </Text>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="envelope"
                    size={wp(4)}
                    color={theme.colors.placeholder}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    {employee.email}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="phone"
                    size={wp(4)}
                    color={theme.colors.placeholder}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    {employee.phone}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="map-marker-alt"
                    size={wp(4)}
                    color={theme.colors.placeholder}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    {employee.address || "N/A"}
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
                  Professional Details
                </Text>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="tools"
                    size={wp(4)}
                    color={theme.colors.placeholder}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    {employee.skills}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="briefcase"
                    size={wp(4)}
                    color={theme.colors.placeholder}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    {employee.experience} years experience
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="dollar-sign"
                    size={wp(4)}
                    color={theme.colors.placeholder}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    {employee.salary ? `$${employee.salary}/month` : "N/A"}
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
                  Additional Information
                </Text>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="calendar"
                    size={wp(4)}
                    color={theme.colors.placeholder}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    Joined:{" "}
                    {employee.createdAt?.toDate().toLocaleDateString() || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="info-circle"
                    size={wp(4)}
                    color={theme.colors.placeholder}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    Notes: {employee.notes || "No additional notes"}
                  </Text>
                </View>
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
                onPress={() => handleStatusChange("active")}
                title="Active"
                leadingIcon="check-circle"
                disabled={employee.status === "active"}
                titleStyle={{ color: theme.colors.text }}
              />
              <Menu.Item
                onPress={() => handleStatusChange("inactive")}
                title="Inactive"
                leadingIcon="close-circle"
                disabled={employee.status === "inactive"}
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
              Delete Employee
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
            Delete Employee
          </Text>
          <Text style={[styles.modalText, { color: theme.colors.text }]}>
            Are you sure you want to permanently delete this employee? This
            action cannot be undone.
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
    paddingBottom: hp(10),
  },
  card: {
    elevation: 2,
    borderRadius: wp(3),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
  },
  employeeName: {
    fontSize: wp(5.5),
    fontWeight: "700",
  },
  statusChip: {
    height: hp(4),
  },
  statusText: {
    fontSize: wp(3.5),
    fontWeight: "600",
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
    marginBottom: hp(1),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1),
  },
  infoText: {
    fontSize: wp(4),
    marginLeft: wp(2),
  },
  buttonContainer: {
    marginTop: hp(4),
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusButton: {
    flex: 1,
    marginRight: wp(2),
  },
  deleteButton: {
    flex: 1,
    marginLeft: wp(2),
  },
  buttonLabel: {
    fontSize: wp(4),
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
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    marginLeft: wp(2),
  },
});
