import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Chip,
  Button,
  Divider,
  Portal,
  Modal,
  Snackbar,
  Avatar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function ClientDetailsScreen({ route, navigation }) {
  const { client } = route.params;
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [deletedClient, setDeletedClient] = useState(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const clientRef = doc(db, "clients", client.id);

      // First mark as inactive (soft delete)
      await updateDoc(clientRef, {
        status: "inactive",
      });

      setDeletedClient(client);
      setShowDeleteModal(false);
      setShowSnackbar(true);

      // Set timeout for permanent deletion
      setTimeout(async () => {
        if (showSnackbar) {
          // Hard delete from Firestore
          await deleteDoc(clientRef);
          navigation.goBack();
        }
      }, 5000);
    } catch (error) {
      console.error("Error deleting client: ", error);
      Alert.alert("Error", "Failed to delete client. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUndo = async () => {
    try {
      const clientRef = doc(db, "clients", deletedClient.id);
      await updateDoc(clientRef, {
        status: "active",
      });
      setShowSnackbar(false);
    } catch (error) {
      console.error("Error undoing delete: ", error);
      Alert.alert("Error", "Failed to undo deletion. Please try again.");
    }
  };

  const navigateToEditScreen = () => {
    navigation.navigate("EditClient", { client });
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
          <Text style={styles.headerTitle}>Client Details</Text>
          <View style={{ width: wp(10) }} />
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileHeader}>
            <Avatar.Text
              size={wp(20)}
              label={getInitials(client.fullName)}
              style={styles.avatar}
              labelStyle={styles.avatarText}
              color="#FFF"
              theme={{ colors: { primary: "#3B82F6" } }}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.clientName}>{client.fullName}</Text>
              <Chip
                mode="outlined"
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      client.status === "active" ? "#E6FFFA" : "#FEE2E2",
                    borderColor:
                      client.status === "active" ? "#38B2AC" : "#F87171",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: client.status === "active" ? "#38B2AC" : "#F87171",
                    },
                  ]}
                >
                  {client.status}
                </Text>
              </Chip>
            </View>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="envelope"
                    size={wp(4.5)}
                    color="#1E3A8A"
                    style={styles.icon}
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoText}>{client.email}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="phone"
                    size={wp(4.5)}
                    color="#1E3A8A"
                    style={styles.icon}
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoText}>{client.phone}</Text>
                  </View>
                </View>
                {client.address && (
                  <View style={styles.infoRow}>
                    <FontAwesome5
                      name="map-marker-alt"
                      size={wp(4.5)}
                      color="#1E3A8A"
                      style={styles.icon}
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Address</Text>
                      <Text style={styles.infoText}>{client.address}</Text>
                    </View>
                  </View>
                )}
              </View>

              <Divider style={styles.divider} />

              {(client.budget || client.requirements) && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    {client.budget && (
                      <View style={styles.infoRow}>
                        <FontAwesome5
                          name="dollar-sign"
                          size={wp(4.5)}
                          color="#1E3A8A"
                          style={styles.icon}
                        />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Budget</Text>
                          <Text style={styles.infoText}>
                            ${Number(client.budget).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    )}
                    {client.requirements && (
                      <View style={styles.infoRow}>
                        <FontAwesome5
                          name="list-ul"
                          size={wp(4.5)}
                          color="#1E3A8A"
                          style={styles.icon}
                        />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Requirements</Text>
                          <Text style={styles.infoText}>
                            {client.requirements}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <Divider style={styles.divider} />
                </>
              )}

              {client.tags && client.tags.length > 0 && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tags</Text>
                    <View style={styles.tagsContainer}>
                      {client.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          style={styles.tag}
                          textStyle={styles.tagText}
                        >
                          {tag}
                        </Chip>
                      ))}
                    </View>
                  </View>
                  <Divider style={styles.divider} />
                </>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                {client.createdAt && (
                  <View style={styles.infoRow}>
                    <FontAwesome5
                      name="calendar"
                      size={wp(4.5)}
                      color="#1E3A8A"
                      style={styles.icon}
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Joined</Text>
                      <Text style={styles.infoText}>
                        {client.createdAt.toDate?.()
                          ? client.createdAt.toDate().toLocaleDateString()
                          : "N/A"}
                      </Text>
                    </View>
                  </View>
                )}
                {client.paymentTerms && (
                  <View style={styles.infoRow}>
                    <FontAwesome5
                      name="credit-card"
                      size={wp(4.5)}
                      color="#1E3A8A"
                      style={styles.icon}
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Payment Terms</Text>
                      <Text style={styles.infoText}>{client.paymentTerms}</Text>
                    </View>
                  </View>
                )}
                {client.projectDeadline && (
                  <View style={styles.infoRow}>
                    <FontAwesome5
                      name="clock"
                      size={wp(4.5)}
                      color="#1E3A8A"
                      style={styles.icon}
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Project Deadline</Text>
                      <Text style={styles.infoText}>
                        {new Date(
                          client.projectDeadline.seconds * 1000
                        ).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                )}
                {client.notes && (
                  <View style={styles.infoRow}>
                    <FontAwesome5
                      name="sticky-note"
                      size={wp(4.5)}
                      color="#1E3A8A"
                      style={styles.icon}
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Notes</Text>
                      <Text style={styles.infoText}>{client.notes}</Text>
                    </View>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={navigateToEditScreen}
              style={styles.actionButton}
              labelStyle={styles.buttonLabel}
              icon="pencil"
            >
              Edit Client
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowDeleteModal(true)}
              style={[styles.actionButton, styles.deleteButton]}
              labelStyle={[styles.buttonLabel, { color: "#EF4444" }]}
              icon="delete"
            >
              Delete Client
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
          <Text style={styles.modalTitle}>Delete Client</Text>
          <Text style={styles.modalText}>
            Are you sure you want to delete {client.fullName}? This action
            cannot be undone after 5 seconds.
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

      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={5000}
        action={{
          label: "UNDO",
          onPress: handleUndo,
        }}
        style={styles.snackbar}
      >
        Client deleted. Tap to undo.
      </Snackbar>
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
  backButton: {
    padding: wp(2),
    borderRadius: wp(10),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: wp(10),
    height: wp(10),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: wp(5.5),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(10),
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: hp(2),
  },
  avatar: {
    backgroundColor: "#3B82F6",
    marginBottom: hp(1),
  },
  avatarText: {
    fontSize: wp(8),
    fontWeight: "bold",
  },
  profileInfo: {
    alignItems: "center",
  },
  clientName: {
    fontSize: wp(6),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: hp(1),
  },
  statusChip: {
    height: hp(4),
    paddingHorizontal: wp(2),
  },
  statusText: {
    fontSize: wp(3.5),
    fontWeight: "600",
  },
  card: {
    elevation: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: wp(4),
    marginBottom: hp(2),
    overflow: "hidden",
  },
  section: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: hp(2),
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
    paddingLeft: wp(2),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: hp(2),
  },
  icon: {
    marginTop: hp(0.5),
    width: wp(6),
  },
  infoContent: {
    marginLeft: wp(3),
    flex: 1,
  },
  infoLabel: {
    fontSize: wp(3.5),
    color: "#6B7280",
    marginBottom: hp(0.5),
  },
  infoText: {
    fontSize: wp(4),
    color: "#1F2937",
  },
  divider: {
    marginVertical: hp(2),
    backgroundColor: "#E5E7EB",
    height: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: hp(1),
  },
  tag: {
    marginRight: wp(2),
    marginBottom: hp(1),
    backgroundColor: "#EBF5FF",
    borderColor: "#BFDBFE",
  },
  tagText: {
    fontSize: wp(3.5),
    color: "#1E3A8A",
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
    height: hp(6.5),
    elevation: 3,
  },
  deleteButton: {
    borderColor: "#EF4444",
    borderWidth: 1.5,
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
    color: "#EF4444",
    marginBottom: hp(2),
  },
  modalText: {
    fontSize: wp(4),
    color: "#4B5563",
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
  snackbar: {
    backgroundColor: "#1F2937",
    marginBottom: hp(2),
  },
});
