import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useColorScheme,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

// Predefined avatar identifiers mapped to the images (same as in ProfileScreen)
const AVATARS = {
  avatar1: require("../../assets/avatar/A1.png"),
  avatar2: require("../../assets/avatar/A2.png"),
  avatar3: require("../../assets/avatar/A3.png"),
  avatar4: require("../../assets/avatar/A4.png"),
  avatar5: require("../../assets/avatar/A5.png"),
  avatar6: require("../../assets/avatar/A6.png"),
};

export default function DashboardHeader() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [username, setUsername] = useState("User"); // Default username
  const [avatar, setAvatar] = useState("avatar1"); // Default avatar

  // Fetch username and avatar from Firestore in real-time
  useEffect(() => {
    if (!userProfile?.uid) {
      console.warn("No user UID found");
      return;
    }

    const userRef = doc(db, "users", userProfile.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setUsername(userData.displayName || "User");
          setAvatar(userData.avatar || "avatar1"); // Fetch avatar from Firestore
        } else {
          console.warn("User document does not exist in Firestore");
          setUsername("User");
          setAvatar("avatar1");
        }
      },
      (error) => {
        console.error("Error fetching user data from Firestore:", error);
        setUsername("User");
        setAvatar("avatar1");
      }
    );

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [userProfile?.uid]);

  return (
    <LinearGradient
      colors={
        colorScheme === "dark" ? ["#1A1A1A", "#2A2A2A"] : ["#2563EB", "#1E4FC2"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <View style={styles.header}>
        {/* App Name and Welcome Text */}
        <View style={styles.headerTextContainer}>
          <Text style={styles.appName}>Edit-Expense</Text>
          <Text style={styles.welcomeText}>
            Hello, {username} manage your finances seamlessly.
          </Text>
        </View>

        {/* Avatar */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          style={styles.avatarButtonWrapper}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image
                source={AVATARS[avatar]}
                style={styles.avatarImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.avatarFallback}>
                {username[0]?.toUpperCase()}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(3),
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: wp(6),
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: wp(4),
    fontWeight: "400",
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: hp(0.5),
  },
  avatarButtonWrapper: {
    marginLeft: wp(3),
  },
  avatarContainer: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(10.5),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: wp(16),
    height: wp(15),
  },
  avatarFallback: {
    fontSize: wp(5),
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
