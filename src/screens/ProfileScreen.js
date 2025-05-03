import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isEditing, setIsEditing] = useState(false);

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
      });
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "#FFFFFF" },
      ]}
    >
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
            styles.title,
            { color: colorScheme === "dark" ? "#fff" : "#000" },
          ]}
        >
          Profile
        </Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Ionicons
            name={isEditing ? "checkmark" : "pencil"}
            size={wp(6)}
            color={colorScheme === "dark" ? "#3B82F6" : "#0047CC"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
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
                backgroundColor: colorScheme === "dark" ? "#2A2A2A" : "#F3F4F6",
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
                backgroundColor: colorScheme === "dark" ? "#2A2A2A" : "#F3F4F6",
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

        {isEditing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>
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
  title: {
    fontSize: hp("3%"),
    fontWeight: "bold",
  },
  formContainer: {
    paddingHorizontal: wp("5%"),
    paddingVertical: hp("3%"),
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
});
