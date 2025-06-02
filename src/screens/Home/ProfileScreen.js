import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";

// Predefined avatar identifiers mapped to the images
const AVATARS = {
  avatar1: require("../../../assets/avatar/A1.png"),
  avatar2: require("../../../assets/avatar/A2.png"),
  avatar3: require("../../../assets/avatar/A3.png"),
  avatar4: require("../../../assets/avatar/A4.png"),
  avatar5: require("../../../assets/avatar/A5.png"),
  avatar6: require("../../../assets/avatar/A6.png"),
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState(user?.avatar || "avatar1"); // Default avatar
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);

  // Real-time listener for Firestore updates
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setName(userData.displayName || "");
        setEmail(userData.email || "");
        setAvatar(userData.avatar || "avatar1");
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [user]);

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: name,
        email: email,
        avatar: avatar, // Store avatar identifier in Firestore
      });
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
      setIsAvatarModalVisible(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleAvatarSelect = (avatarKey) => {
    setAvatar(avatarKey);
    setIsAvatarModalVisible(false);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "#FFFFFF" },
      ]}
    >
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="arrow-back"
              size={wp(6)}
              color={colorScheme === "dark" ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: colorScheme === "dark" ? "#fff" : "#000" },
            ]}
          >
            Profile Settings
          </Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Ionicons
              name={isEditing ? "" : "pencil"}
              size={wp(6)}
              color={colorScheme === "dark" ? "#3B82F6" : "#0047CC"}
            />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colorScheme === "dark" ? "#2A2A2A" : "#fff" },
          ]}
        >
          <TouchableOpacity
            onPress={() => isEditing && setIsAvatarModalVisible(true)}
            disabled={!isEditing}
          >
            <View style={styles.avatarWrapper}>
              <View
                style={[
                  styles.avatarContainer,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#3A3A3A" : "#F3F4F6",
                  },
                ]}
              >
                {avatar ? (
                  <Image
                    source={AVATARS[avatar]}
                    style={styles.avatarImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name="person"
                    size={wp(10)}
                    color={colorScheme === "dark" ? "#A0A0A0" : "#6B7280"}
                  />
                )}
              </View>
              {isEditing && (
                <View style={styles.pencilIconContainer}>
                  <Ionicons
                    name="pencil"
                    size={wp(5)}
                    color={colorScheme === "dark" ? "#3B82F6" : "#0047CC"}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text
            style={[
              styles.profileName,
              { color: colorScheme === "dark" ? "#fff" : "#000" },
            ]}
          >
            {name || "User"}
          </Text>
          <Text
            style={[
              styles.profileEmail,
              { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
            ]}
          >
            {email || "user@example.com"}
          </Text>
        </View>

        {/* Avatar Selection Modal */}
        <Modal
          visible={isAvatarModalVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#2A2A2A" : "#FFFFFF",
                },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: colorScheme === "dark" ? "#fff" : "#000" },
                ]}
              >
                Select Avatar
              </Text>
              <ScrollView horizontal style={styles.avatarList}>
                {Object.keys(AVATARS).map((avatarKey) => (
                  <TouchableOpacity
                    key={avatarKey}
                    onPress={() => handleAvatarSelect(avatarKey)}
                  >
                    <Image
                      source={AVATARS[avatarKey]}
                      style={styles.avatarOption}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsAvatarModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Edit Profile Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colorScheme === "dark" ? "#3B82F6" : "#0047CC" },
            ]}
          >
            Edit Profile
          </Text>
          <View
            style={[
              styles.formContainer,
              { backgroundColor: colorScheme === "dark" ? "#2A2A2A" : "#fff" },
            ]}
          >
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
                ]}
              >
                Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#3A3A3A" : "#F3F4F6",
                    color: colorScheme === "dark" ? "#fff" : "#000",
                  },
                ]}
                value={name}
                onChangeText={setName}
                editable={isEditing}
                placeholder="Enter your name"
                placeholderTextColor={colorScheme === "dark" ? "#666" : "#999"}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
                ]}
              >
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#3A3A3A" : "#F3F4F6",
                    color: colorScheme === "dark" ? "#fff" : "#000",
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                editable={isEditing}
                placeholder="Enter your email"
                placeholderTextColor={colorScheme === "dark" ? "#666" : "#999"}
                keyboardType="email-address"
              />
            </View>
          </View>
          {isEditing && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colorScheme === "dark" ? "#3B82F6" : "#0047CC" },
            ]}
          >
            Quick Actions
          </Text>
          <View
            style={[
              styles.actionsContainer,
              { backgroundColor: colorScheme === "dark" ? "#2A2A2A" : "#fff" },
            ]}
          >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("AddOrder")}
            >
              <Ionicons name="document-text" size={wp(6)} color="#0BAB64" />
              <Text
                style={[
                  styles.actionText,
                  { color: colorScheme === "dark" ? "#fff" : "#000" },
                ]}
              >
                New Order
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("AddClient")}
            >
              <Ionicons name="person-add" size={wp(6)} color="#C850C0" />
              <Text
                style={[
                  styles.actionText,
                  { color: colorScheme === "dark" ? "#fff" : "#000" },
                ]}
              >
                New Client
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("AddEmployee")}
            >
              <Ionicons name="people" size={wp(6)} color="#2196F3" />
              <Text
                style={[
                  styles.actionText,
                  { color: colorScheme === "dark" ? "#fff" : "#000" },
                ]}
              >
                New Employee
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp("5%"),
    paddingVertical: hp("2%"),
  },
  headerTitle: {
    fontSize: hp("3%"),
    fontWeight: "bold",
  },
  profileCard: {
    alignItems: "center",
    padding: wp("5%"),
    margin: wp("5%"),
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatarWrapper: {
    position: "relative", // Allow positioning of the pencil icon
  },
  avatarContainer: {
    width: wp("20%"),
    height: wp("20%"),
    borderRadius: wp("10%"),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp("2%"),
  },
  avatarImage: {
    width: wp("20%"),
    height: wp("20%"),
  },
  pencilIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: wp(3),
    padding: wp(1),
  },
  profileName: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    marginBottom: hp("1%"),
  },
  profileEmail: {
    fontSize: wp("4%"),
  },
  section: {
    paddingHorizontal: wp("5%"),
    marginBottom: hp("3%"),
  },
  sectionTitle: {
    fontSize: hp("2.5%"),
    fontWeight: "bold",
    marginBottom: hp("1%"),
  },
  formContainer: {
    padding: wp("4%"),
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  inputGroup: {
    marginBottom: hp("2%"),
  },
  label: {
    fontSize: wp("4%"),
    fontWeight: "600",
    marginBottom: hp("1%"),
  },
  input: {
    borderRadius: 10,
    padding: wp("3%"),
    fontSize: wp("4%"),
  },
  saveButton: {
    backgroundColor: "#0047CC",
    borderRadius: 10,
    padding: wp("4%"),
    alignItems: "center",
    marginTop: hp("2%"),
  },
  saveButtonText: {
    color: "#fff",
    fontSize: wp("4%"),
    fontWeight: "600",
  },
  actionsContainer: {
    padding: wp("4%"),
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp("1.5%"),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  actionText: {
    fontSize: wp("4%"),
    marginLeft: wp("3%"),
    fontWeight: "500",
  },
  logoutButton: {
    borderRadius: 10,
    backgroundColor: "red",
    padding: wp("4%"),
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoutButtonText: {
    fontSize: wp("5%"),
    fontWeight: "800",
    color: "white",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: wp("80%"),
    padding: wp("5%"),
    borderRadius: 15,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: hp("2.5%"),
    fontWeight: "bold",
    marginBottom: hp("2%"),
  },
  avatarList: {
    flexDirection: "row",
    marginBottom: hp("2%"),
  },
  avatarOption: {
    width: wp("15%"),
    height: wp("15%"),
    marginHorizontal: wp("2%"),
  },
  cancelButton: {
    padding: wp("3%"),
  },
  cancelButtonText: {
    color: "#F44336",
    fontSize: wp("4%"),
    fontWeight: "600",
  },
});
