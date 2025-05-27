import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const EmptyState = ({
  screenInfo,
  theme,
  type,
  searchQuery,
  startDate,
  endDate,
}) => (
  <View style={styles.emptyContainer}>
    <FontAwesome5
      name={screenInfo.icon}
      size={wp(15)}
      color={theme.placeholder}
      style={styles.emptyIcon}
    />
    <Text style={[styles.emptyText, { color: theme.placeholder }]}>
      No {type} found
      {searchQuery || (startDate && endDate) ? " matching your filters" : ""}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(5),
  },
  emptyIcon: {
    marginBottom: hp(2),
    opacity: 0.5,
  },
  emptyText: {
    fontSize: wp(4),
    textAlign: "center",
  },
});

export default EmptyState;
