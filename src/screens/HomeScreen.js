import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Button, Text, Surface, Avatar, useTheme } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
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

  // Load custom fonts
  const [fontsLoaded] = Font.useFonts({
    "Inter-Regular": require("../../assets/fonts/Inter_28pt-Regular.ttf"),
    "Inter-Bold": require("../../assets/fonts/Inter_18pt-Bold.ttf"),
    "Inter-Medium": require("../../assets/fonts/Inter_28pt-Medium.ttf"),
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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5C80BC" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#0C134F", "#1D267D"]} style={styles.container}>
      <View style={styles.header}></View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <Animated.View entering={FadeInUp.duration(600)}>
          <Surface style={styles.welcomeCard}>
            <BlurView intensity={20} style={styles.blurOverlay}>
              <View style={styles.welcomeContent}>
                <Avatar.Text
                  size={60}
                  label={getInitials()}
                  style={styles.avatar}
                  labelStyle={styles.avatarText}
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
                    color="#5C469C"
                  />
                  <Text style={styles.infoText}>{getBusinessName()}</Text>
                </View>
                <View style={styles.infoChip}>
                  <MaterialCommunityIcons
                    name="shield-account"
                    size={18}
                    color="#5C469C"
                  />
                  <Text style={styles.infoText}>{getRole()}</Text>
                </View>
              </View>
              <Button
                mode="outlined"
                onPress={handleLogout}
                style={styles.signOutButton}
                labelStyle={styles.signOutButtonLabel}
                icon="logout"
              >
                Sign Out
              </Button>
            </BlurView>
          </Surface>
        </Animated.View>

        {/* Quick Stats */}
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <Animated.View entering={FadeInUp.duration(600).delay(200)}>
            <Surface style={styles.statCard}>
              <View style={styles.iconBg}>
                <MaterialCommunityIcons name="cart" size={22} color="#5C469C" />
              </View>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Active Orders</Text>
            </Surface>
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(600).delay(400)}>
            <Surface style={styles.statCard}>
              <View style={styles.iconBg}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={22}
                  color="#5C469C"
                />
              </View>
              <Text style={styles.statValue}>45</Text>
              <Text style={styles.statLabel}>Total Clients</Text>
            </Surface>
          </Animated.View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("OrderList")}
          >
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons
                name="receipt"
                size={24}
                color="#5C80BC"
              />
            </View>
            <Text style={styles.actionText}>View Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("ClientList")}
          >
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons
                name="account-multiple"
                size={24}
                color="#5C80BC"
              />
            </View>
            <Text style={styles.actionText}>View Clients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() =>
              navigation.navigate("MainApp", { screen: "ExpenseList" })
            }
          >
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="cash" size={24} color="#5C80BC" />
            </View>
            <Text style={styles.actionText}>View Expenses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("WorkerList")}
          >
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons
                name="account-hard-hat"
                size={24}
                color="#5C80BC"
              />
            </View>
            <Text style={styles.actionText}>View Workers</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0C134F",
  },
  container: {
    flex: 1,
  },
  header: {
    padding: wp("4%"),
    paddingTop: hp("2%"),
    alignItems: "flex-end",
  },
  profileIcon: {
    backgroundColor: "#5C469C",
    borderWidth: 2,
    borderColor: "#D4ADFC",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileIconText: {
    fontFamily: "Inter-Bold",
    fontSize: wp("4%"),
    color: "#D4ADFC",
  },
  scrollContent: {
    padding: wp("4%"),
    paddingBottom: hp("4%"),
  },
  welcomeCard: {
    borderRadius: wp("4%"),
    overflow: "hidden",
    marginBottom: hp("3%"),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  blurOverlay: {
    padding: wp("4%"),
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp("2%"),
  },
  avatar: {
    backgroundColor: "#5C469C",
    borderWidth: 1,
    borderColor: "#D4ADFC",
  },
  avatarText: {
    fontFamily: "Inter-Bold",
    fontSize: wp("6%"),
    color: "#D4ADFC",
  },
  welcomeTextContainer: {
    marginLeft: wp("3%"),
  },
  welcomeText: {
    fontSize: wp("3.5%"),
    color: "#5C469C",
    fontFamily: "Inter-Regular",
  },
  username: {
    fontSize: wp("5%"),
    fontWeight: "800",
    color: "#1D267D",
    fontFamily: "Inter-Bold",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: hp("2%"),
    flexWrap: "wrap",
    gap: wp("2%"),
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 173, 252, 0.15)",
    paddingVertical: hp("0.5%"),
    paddingHorizontal: wp("3%"),
    borderRadius: wp("5%"),
    borderWidth: 1,
    borderColor: "rgba(92, 70, 156, 0.2)",
  },
  infoText: {
    marginLeft: wp("1.5%"),
    fontSize: wp("3.2%"),
    color: "#5C469C",
    fontWeight: "600",
    fontFamily: "Inter-Medium",
  },
  signOutButton: {
    borderColor: "#5C469C",
    borderWidth: 1,
    borderRadius: wp("2%"),
    alignSelf: "flex-end",
  },
  signOutButtonLabel: {
    color: "#5C469C",
    fontSize: wp("3.2%"),
    fontWeight: "600",
    fontFamily: "Inter-Medium",
  },
  sectionTitle: {
    fontSize: wp("4.5%"),
    fontWeight: "700",
    color: "#D4ADFC",
    marginBottom: hp("2%"),
    letterSpacing: 0.3,
    fontFamily: "Inter-Bold",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp("3%"),
  },
  statCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: wp("4%"),
    padding: wp("3%"),
    width: wp("44%"),
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(92, 70, 156, 0.1)",
  },
  iconBg: {
    backgroundColor: "rgba(212, 173, 252, 0.15)",
    padding: wp("2%"),
    borderRadius: wp("8%"),
    marginBottom: hp("0.5%"),
  },
  statValue: {
    fontSize: wp("5%"),
    fontWeight: "700",
    color: "#1D267D",
    marginVertical: hp("0.5%"),
    fontFamily: "Inter-Bold",
  },
  statLabel: {
    fontSize: wp("3.2%"),
    color: "#5C469C",
    fontFamily: "Inter-Regular",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    width: wp("44%"),
    height: hp("12%"),
    marginBottom: hp("2%"),
    borderRadius: wp("4%"),
    padding: wp("3%"),
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(92, 70, 156, 0.1)",
  },
  actionIconContainer: {
    backgroundColor: "rgba(212, 173, 252, 0.15)",
    padding: wp("2%"),
    borderRadius: wp("8%"),
    marginBottom: hp("1%"),
  },
  actionText: {
    color: "#1D267D",
    fontSize: wp("3.5%"),
    fontWeight: "600",
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
});

export default HomeScreen;
