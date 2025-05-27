import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const DetailsHeader = ({ screenInfo, theme, navigation }) => (
  <LinearGradient colors={theme.gradient} style={styles.header}>
    <View style={styles.headerContent}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <FontAwesome5 name="arrow-left" size={wp(5)} color="#fff" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <FontAwesome5
          name={screenInfo.icon}
          size={wp(5)}
          color="#fff"
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>{screenInfo.title}</Text>
      </View>
      <View style={{ width: wp(10) }} />
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  header: {
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: wp(2),
  },
  headerTitle: {
    fontSize: wp(5),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  backButton: {
    padding: wp(2),
    borderRadius: wp(2),
    width: wp(10),
    height: wp(10),
    alignItems: "center",
    justifyContent: "center",
  },
});

export default DetailsHeader;
