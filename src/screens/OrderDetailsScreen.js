import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Animated } from "react-native";
import {
  Appbar,
  Text,
  ActivityIndicator,
  Card,
  Title,
  Paragraph,
  Chip,
  Divider,
  Surface,
  useTheme,
  Button,
  IconButton,
} from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getOrderById } from "../services/orderService";
import { format } from "date-fns";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!orderId) {
      Alert.alert("Error", "No Order ID provided.");
      navigation.goBack();
      return;
    }

    setLoading(true);
    getOrderById(orderId)
      .then((data) => {
        if (data) {
          setOrder(data);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        } else {
          setError("Order not found.");
          Alert.alert("Error", "Order not found.");
        }
      })
      .catch((err) => {
        console.error("Error fetching order details:", err);
        setError(err.message || "Failed to load order data.");
        Alert.alert("Error", err.message || "Failed to load order data.");
      })
      .finally(() => setLoading(false));
  }, [orderId, navigation]);

  const handleEdit = () => {
    navigation.navigate("AddEditOrder", { orderId: order.id });
  };

  const handleViewClient = () => {
    navigation.navigate("ClientDetails", { clientId: order.clientId });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#ffcc00";
      case "in-progress":
        return "#007aff";
      case "completed":
        return "#34c759";
      case "delivered":
        return "#8e8e93";
      case "cancelled":
        return "#ff3b30";
      default:
        return "#8e8e93";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "clock-outline";
      case "in-progress":
        return "progress-clock";
      case "completed":
        return "check-circle";
      case "delivered":
        return "truck-delivery";
      case "cancelled":
        return "close-circle";
      default:
        return "circle-small";
    }
  };

  const getStatusProgress = (status) => {
    switch (status) {
      case "pending":
        return 0.2;
      case "in-progress":
        return 0.5;
      case "completed":
        return 0.8;
      case "delivered":
        return 1;
      case "cancelled":
        return 0;
      default:
        return 0;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Not set";
    if (timestamp.toDate) {
      return format(timestamp.toDate(), "PPP");
    }
    return format(new Date(timestamp), "PPP");
  };

  const formatCurrency = (amount) => {
    if (!amount) return "Not set";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Failed to load order"}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#4c669f", "#3b5998", "#192f6a"]}
      style={styles.container}
    >
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="white" />
        <Appbar.Content
          title="Order Details"
          subtitle={`#${order.id.slice(-6).toUpperCase()}`}
          color="white"
        />
        <Appbar.Action icon="pencil" onPress={handleEdit} color="white" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View style={[styles.statusSurface, { opacity: fadeAnim }]}>
          <View style={styles.statusHeader}>
            <Text style={styles.servicePackage}>{order.servicePackage}</Text>
            <Chip
              icon={getStatusIcon(order.status)}
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(order.status) },
              ]}
              textStyle={styles.statusChipText}
            >
              {order.status?.replace("-", " ")}
            </Chip>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getStatusProgress(order.status) * 100}%`,
                    backgroundColor: getStatusColor(order.status),
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Client Information</Title>
              <Button
                mode="contained"
                onPress={handleViewClient}
                style={styles.viewClientButton}
                icon="account-arrow-right"
              >
                View Client
              </Button>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="account"
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Client Name</Text>
                <Text style={styles.infoValue}>{order.clientNameSnapshot}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="identifier"
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Client ID</Text>
                <Text style={styles.infoValue}>{order.clientId}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Order Details</Title>
            <Divider style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Order Date</Text>
                <Text style={styles.infoValue}>
                  {formatDate(order.orderDate)}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Deadline</Text>
                <Text style={styles.infoValue}>
                  {formatDate(order.deadline)}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="cash"
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Price</Text>
                <Text style={styles.infoValue}>
                  {formatCurrency(order.pricing)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {order.requirements && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Requirements & Notes</Title>
              <Divider style={styles.divider} />
              <Paragraph style={styles.requirements}>
                {order.requirements}
              </Paragraph>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Record Information</Title>
            <Divider style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {formatDate(order.createdAt)}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="update"
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>
                  {formatDate(order.updatedAt)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "transparent",
    elevation: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: hp("2%"),
    fontSize: wp("4%"),
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp("5%"),
    backgroundColor: "#f8f9fa",
  },
  errorText: {
    fontSize: wp("4.5%"),
    color: "red",
    textAlign: "center",
    marginBottom: hp("2%"),
  },
  scrollContainer: {
    padding: wp("4%"),
    paddingBottom: hp("5%"),
  },
  statusSurface: {
    marginBottom: hp("2%"),
    borderRadius: wp("2%"),
    backgroundColor: "white",
    elevation: 4,
  },
  statusHeader: {
    padding: wp("4%"),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  servicePackage: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    flex: 1,
    marginRight: wp("2%"),
    color: "#212529",
  },
  statusChip: {
    height: hp("4%"),
  },
  statusChipText: {
    color: "white",
    fontWeight: "bold",
  },
  progressContainer: {
    paddingHorizontal: wp("4%"),
    paddingBottom: wp("4%"),
  },
  progressBar: {
    height: hp("0.5%"),
    backgroundColor: "#e9ecef",
    borderRadius: wp("0.5%"),
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: wp("0.5%"),
  },
  card: {
    marginBottom: hp("2%"),
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp("1%"),
  },
  cardTitle: {
    fontSize: wp("4.5%"),
    color: "#343a40",
    marginBottom: hp("1%"),
  },
  viewClientButton: {
    marginLeft: wp("2%"),
  },
  divider: {
    marginBottom: hp("2%"),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp("2%"),
  },
  infoContent: {
    marginLeft: wp("3%"),
    flex: 1,
  },
  infoLabel: {
    fontSize: wp("3.5%"),
    color: "#6c757d",
    marginBottom: hp("0.5%"),
  },
  infoValue: {
    fontSize: wp("4%"),
    color: "#212529",
  },
  requirements: {
    fontSize: wp("4%"),
    color: "#212529",
    lineHeight: wp("5.5%"),
  },
});

export default OrderDetailsScreen;
