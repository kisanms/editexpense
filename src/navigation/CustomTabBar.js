import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Keyboard,
  useColorScheme,
} from "react-native";
import { Text } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";

const CustomTabBar = React.memo(({ state, descriptors, navigation }) => {
  const colorScheme = useColorScheme();
  const tabWidth = wp("100%") / state.routes.length;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const animatedValues = useRef(
    state.routes.map(() => ({
      lift: new Animated.Value(0),
      scale: new Animated.Value(1),
      pressScale: new Animated.Value(1),
    }))
  ).current;

  // Hide/show tab bar based on keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Animate lift and scale for active tab
  useEffect(() => {
    animatedValues.forEach((value, index) => {
      const isFocused = state.index === index;
      Animated.parallel([
        Animated.spring(value.lift, {
          toValue: isFocused ? -10 : 0, // Lift active tab
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.spring(value.scale, {
          toValue: isFocused ? 1.1 : 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
      ]).start();
    });
  }, [state.index, animatedValues]);

  const onPress = (index, route) => {
    const isFocused = state.index === index;
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }

    // Press animation
    Animated.sequence([
      Animated.timing(animatedValues[index].pressScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues[index].pressScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getIcon = (routeName) => {
    switch (routeName) {
      case "Home":
        return "home";
      case "Clients":
        return "users";
      case "Employees":
        return "user-tie";
      case "Orders":
        return "file-invoice-dollar";
      case "Reports":
        return "chart-bar";
      default:
        return "home";
    }
  };

  // Don't render tab bar when keyboard is visible
  if (keyboardVisible) {
    return null;
  }

  return (
    <View style={styles.bottomNav}>
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#111827", "#1F2937"]
            : ["#E0E7FF", "#F8FAFC"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.navItem, { width: tabWidth }]}
            onPress={() => onPress(index, route)}
            activeOpacity={0.8}
          >
            <Animated.View
              style={{
                transform: [
                  { translateY: animatedValues[index].lift },
                  { scale: animatedValues[index].pressScale },
                ],
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Animated.View
                style={[
                  styles.iconContainer,
                  isFocused && styles.iconContainerActive,
                  isFocused &&
                    (colorScheme === "dark"
                      ? styles.iconContainerActiveDark
                      : {}),
                  { transform: [{ scale: animatedValues[index].scale }] },
                ]}
              >
                <FontAwesome5
                  name={getIcon(route.name)}
                  size={24}
                  color={isFocused ? "#FFFFFF" : "#666"}
                />
              </Animated.View>
              <Text
                style={[
                  styles.navText,
                  {
                    color: isFocused
                      ? colorScheme === "dark"
                        ? "#3B82F6"
                        : "#0047CC"
                      : "#666",
                    fontWeight: isFocused ? "600" : "400",
                  },
                ]}
              >
                {label}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 1000,
    backgroundColor: "transparent",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  iconContainerActive: {
    backgroundColor: "#0047CC",
  },
  iconContainerActiveDark: {
    backgroundColor: "#3B82F6",
  },
});

export default CustomTabBar;
