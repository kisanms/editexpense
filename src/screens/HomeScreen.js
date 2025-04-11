import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Button, Text, Surface, Avatar, useTheme } from "react-native-paper";
import { useAuth } from "../context/AuthContext"; // Ensure this path is correct
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Font from "expo-font";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInUp } from "react-native-reanimated";

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user, userProfile, businessDetails, logout } = useAuth();
  const theme = useTheme();

  // Load custom fonts (replace with your font files or remove if using system fonts)
  const [fontsLoaded] = Font.useFonts({
    "Outfit-Regular": require("../../assets/fonts/Outfit-Regular.ttf"), // Adjust path
    "Outfit-Bold": require("../../assets/fonts/Outfit-Bold.ttf"),
    "Outfit-Medium": require("../../assets/fonts/Outfit-Medium.ttf"),
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getInitials = () =>
    userProfile?.username?.substring(0, 1).toUpperCase() || "K";
  const getUsername = () => userProfile?.username || "Kisan";
  const getRole = () =>
    userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1) ||
    "Owner";
  const getBusinessName = () =>
    businessDetails?.businessName || "Kisan's Business";

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#FF6F61" />;
  }

  return (
    <LinearGradient colors={["#4A00E0", "#8E2DE2"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            // Replace with actual settings screen navigation or modal
            alert("Settings: Invite Partner or Sign Out");
          }}
        >
          <Avatar.Text
            size={40}
            label={getInitials()}
            style={styles.profileIcon}
          />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Card */}
        <Animated.View entering={FadeInUp.duration(600)}>
          <Surface style={styles.welcomeCard}>
            <BlurView intensity={50} style={styles.blurOverlay}>
              <View style={styles.welcomeContent}>
                <Avatar.Text
                  size={56}
                  label={getInitials()}
                  style={styles.avatar}
                />
                <View style={styles.welcomeTextContainer}>
                  <Text style={styles.welcomeText}>Welcome back,</Text>
                  <Text style={styles.username}>{getUsername()}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoChip}>
                  <MaterialCommunityIcons
                    name="domain"
                    size={18}
                    color="#4A00E0"
                  />
                  <Text style={styles.infoText}>{getBusinessName()}</Text>
                </View>
                <View style={styles.infoChip}>
                  <MaterialCommunityIcons
                    name="shield-account"
                    size={18}
                    color="#4A00E0"
                  />
                  <Text style={styles.infoText}>{getRole()}</Text>
                </View>
              </View>
            </BlurView>
          </Surface>
        </Animated.View>

        {/* Quick Stats */}
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <Animated.View entering={FadeInUp.duration(600).delay(200)}>
            <Surface style={[styles.statCard, { backgroundColor: "#FF6F61" }]}>
              <MaterialCommunityIcons name="cart" size={24} color="#fff" />
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Active Orders</Text>
            </Surface>
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(600).delay(400)}>
            <Surface style={[styles.statCard, { backgroundColor: "#40C4FF" }]}>
              <MaterialCommunityIcons
                name="account-group"
                size={24}
                color="#fff"
              />
              <Text style={styles.statValue}>45</Text>
              <Text style={styles.statLabel}>Total Clients</Text>
            </Surface>
          </Animated.View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <Button
            icon="receipt"
            mode="contained"
            onPress={() => navigation.navigate("OrderList")}
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
            theme={{ colors: { primary: "#FF6F61" } }}
          >
            View Orders
          </Button>
          <Button
            icon="account-multiple"
            mode="contained"
            onPress={() => navigation.navigate("ClientList")}
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
            theme={{ colors: { primary: "#FF6F61" } }}
          >
            View Clients
          </Button>
          <Button
            icon="cash"
            mode="contained"
            onPress={() =>
              navigation.navigate("MainApp", { screen: "ExpenseList" })
            }
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
            theme={{ colors: { primary: "#FF6F61" } }}
          >
            View Expenses
          </Button>
          <Button
            icon="account-hard-hat"
            mode="contained"
            onPress={() => navigation.navigate("WorkerList")}
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
            theme={{ colors: { primary: "#FF6F61" } }}
          >
            View Workers
          </Button>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: wp("6%"),
    paddingTop: hp("6%"),
    alignItems: "flex-end",
  },
  profileIcon: {
    backgroundColor: "#FF6F61",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scrollContent: {
    padding: wp("6%"),
    paddingBottom: hp("10%"),
  },
  welcomeCard: {
    borderRadius: wp("5%"),
    overflow: "hidden",
    marginBottom: hp("4%"),
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  blurOverlay: {
    padding: wp("5%"),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp("3%"),
  },
  avatar: {
    backgroundColor: "#FF6F61",
    borderWidth: 2,
    borderColor: "#fff",
  },
  welcomeTextContainer: {
    marginLeft: wp("5%"),
  },
  welcomeText: {
    fontSize: wp("4.2%"),
    color: "#D3D3D3",
    fontFamily: "Outfit-Regular", // Replace with your font
  },
  username: {
    fontSize: wp("6.5%"),
    fontWeight: "800",
    color: "#fff",
    fontFamily: "Outfit-Bold",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6E6FA",
    paddingVertical: hp("1%"),
    paddingHorizontal: wp("4%"),
    borderRadius: wp("10%"),
  },
  infoText: {
    marginLeft: wp("2%"),
    fontSize: wp("3.8%"),
    color: "#4A00E0",
    fontWeight: "600",
    fontFamily: "Outfit-Medium",
  },
  sectionTitle: {
    fontSize: wp("5.5%"),
    fontWeight: "700",
    color: "#fff",
    marginBottom: hp("3%"),
    letterSpacing: 0.5,
    fontFamily: "Outfit-Bold",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp("4%"),
  },
  statCard: {
    borderRadius: wp("5%"),
    padding: wp("5%"),
    width: wp("44%"),
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  statValue: {
    fontSize: wp("6%"),
    fontWeight: "700",
    color: "#fff",
    marginVertical: hp("1%"),
    fontFamily: "Outfit-Bold",
  },
  statLabel: {
    fontSize: wp("3.8%"),
    color: "#fff",
    opacity: 0.9,
    fontFamily: "Outfit-Regular",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: wp("44%"),
    marginBottom: hp("3%"),
    borderRadius: wp("5%"),
  },
  actionButtonLabel: {
    color: "#fff",
    fontSize: wp("4%"),
    fontWeight: "600",
    fontFamily: "Outfit-Medium",
  },
});

export default HomeScreen;
