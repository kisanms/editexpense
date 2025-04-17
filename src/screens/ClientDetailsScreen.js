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
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function ClientDetailsScreen({ route, navigation }) {
  const { client } = route.params;
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const clientRef = doc(db, "clients", client.id);
      await updateDoc(clientRef, {
        status: "inactive",
      });
      navigation.goBack();
    } catch (error) {
      console.error("Error deleting client: ", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
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
          <IconButton
            icon="arrow-left"
            color="#FFFFFF"
            size={wp(6)}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>Client Details</Text>
          <IconButton
            icon="pencil"
            color="#FFFFFF"
            size={wp(6)}
            onPress={() => navigation.navigate("EditClient", { client })}
          />
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
                        color:
                          client.status === "active" ? "#38B2AC" : "#F87171",
                      },
                    ]}
                  >
                    {client.status}
                  </Text>
                </Chip>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <View style={styles.infoRow}>
                  <FontAwesome5 name="envelope" size={wp(4)} color="#6B7280" />
                  <Text style={styles.infoText}>{client.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5 name="phone" size={wp(4)} color="#6B7280" />
                  <Text style={styles.infoText}>{client.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="map-marker-alt"
                    size={wp(4)}
                    color="#6B7280"
                  />
                  <Text style={styles.infoText}>{client.address}</Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                <View style={styles.infoRow}>
                  <FontAwesome5 name="calendar" size={wp(4)} color="#6B7280" />
                  <Text style={styles.infoText}>
                    Joined: {client.createdAt.toDate().toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="info-circle"
                    size={wp(4)}
                    color="#6B7280"
                  />
                  <Text style={styles.infoText}>
                    Notes: {client.notes || "No additional notes"}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate("EditClient", { client })}
              style={styles.editButton}
              labelStyle={styles.buttonLabel}
            >
              Edit Client
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowDeleteModal(true)}
              style={styles.deleteButton}
              labelStyle={[styles.buttonLabel, { color: "#EF4444" }]}
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
            Are you sure you want to delete this client? This action cannot be
            undone.
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
  clientName: {
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
  buttonContainer: {
    marginTop: hp(4),
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editButton: {
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
