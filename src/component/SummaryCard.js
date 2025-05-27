// components/SummaryCard.js
import React, { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { FontAwesome5 } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { useNavigation } from "@react-navigation/native";

const SummaryCard = ({ icon, label, value, iconColor, colorScheme }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    let screenName;
    switch (label.toLowerCase()) {
      case "total projects":
        screenName = "ProjectDetailsList";
        break;
      case "total profit":
        screenName = "ProfitDetailsList";
        break;
      case "income":
        screenName = "IncomeDetailsList";
        break;
      case "expenses":
        screenName = "ExpenseDetailsList";
        break;
      default:
        console.warn(`No navigation defined for label: ${label}`);
        return;
    }
    console.log(`Navigating to ${screenName}`);
    try {
      navigation.navigate(screenName);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.card,
        {
          backgroundColor: colorScheme === "dark" ? "#2A2A2A" : "#fff",
          borderWidth: colorScheme === "dark" ? 0 : 1,
          borderColor: colorScheme === "dark" ? undefined : "#E5E7EB",
        },
      ]}
    >
      <FontAwesome5 name={icon} size={wp(5)} color={iconColor} />
      <Text
        style={[
          styles.label,
          { color: colorScheme === "dark" ? "#A0A0A0" : "#6B7280" },
        ]}
      >
        {label.toUpperCase()}
      </Text>
      <Text
        style={[
          styles.value,
          { color: colorScheme === "dark" ? "#fff" : "#000" },
        ]}
      >
        {value}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: wp(44),
    padding: wp(4),
    marginBottom: hp(1),
    alignItems: "flex-start",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    fontSize: wp(3.5),
    marginTop: hp(1),
    fontWeight: "600",
    opacity: 0.8,
  },
  value: {
    fontSize: wp(4.2),
    fontWeight: "bold",
    marginTop: hp(0.8),
  },
});

SummaryCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  iconColor: PropTypes.string.isRequired,
  colorScheme: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default memo(SummaryCard);
