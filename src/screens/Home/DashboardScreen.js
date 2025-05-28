// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Dimensions,
//   Alert,
//   StatusBar,
//   useColorScheme,
//   RefreshControl,
// } from "react-native";
// import {
//   widthPercentageToDP as wp,
//   heightPercentageToDP as hp,
// } from "react-native-responsive-screen";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useNavigation } from "@react-navigation/native";
// import { useAuth } from "../../context/AuthContext";
// import {
//   collection,
//   onSnapshot,
//   query,
//   where,
//   orderBy,
//   limit,
// } from "firebase/firestore";
// import { db } from "../../config/firebase";
// import RecentOrders from "../../component/RecentOrders";
// import RecentClients from "../../component/RecentClients";
// import SummaryCard from "../../component/SummaryCard";

// const { width } = Dimensions.get("window");

// // Dashboard screen component
// export default function DashboardScreen() {
//   const colorScheme = useColorScheme();
//   const navigation = useNavigation();
//   const { userProfile, businessDetails } = useAuth();
//   const [employees, setEmployees] = useState({});
//   const [clients, setClients] = useState({});
//   const [orders, setOrders] = useState([]);
//   const [projects, setProjects] = useState({});
//   const [summaryData, setSummaryData] = useState([
//     {
//       icon: "briefcase",
//       label: "Total Projects",
//       value: "0",
//       iconColor: "#0047CC",
//     },
//     {
//       icon: "dollar-sign",
//       label: "Total Profit",
//       value: "$0",
//       iconColor: "#4CAF50",
//     },
//     {
//       icon: "arrow-up",
//       label: "Income",
//       value: "$0",
//       iconColor: "#2196F3",
//     },
//     {
//       icon: "arrow-down",
//       label: "Expenses",
//       value: "$0",
//       iconColor: "#F44336",
//     },
//   ]);
//   const [refreshing, setRefreshing] = useState(false);

//   // Fetch employees, clients, and orders
//   const fetchData = useCallback(() => {
//     if (!userProfile?.businessId) {
//       console.warn("No business ID found for user");
//       return () => {};
//     }

//     const employeesUnsubscribe = onSnapshot(
//       query(
//         collection(db, "employees"),
//         where("businessId", "==", userProfile.businessId)
//       ),
//       (snapshot) => {
//         const employeesData = {};
//         snapshot.forEach((doc) => {
//           employeesData[doc.id] = { id: doc.id, ...doc.data() };
//         });
//         setEmployees(employeesData);
//       },
//       (error) => console.error("Error fetching employees:", error)
//     );

//     const clientsUnsubscribe = onSnapshot(
//       query(
//         collection(db, "clients"),
//         where("businessId", "==", userProfile.businessId)
//       ),
//       (snapshot) => {
//         const clientsData = {};
//         snapshot.forEach((doc) => {
//           clientsData[doc.id] = { id: doc.id, ...doc.data() };
//         });
//         setClients(clientsData);
//       },
//       (error) => console.error("Error fetching clients:", error)
//     );

//     const ordersUnsubscribe = onSnapshot(
//       query(
//         collection(db, "orders"),
//         where("businessId", "==", userProfile.businessId),
//         orderBy("createdAt", "desc"),
//         limit(10)
//       ),
//       (snapshot) => {
//         const ordersList = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setOrders(ordersList);
//       },
//       (error) => {
//         console.error("Error fetching orders:", error);
//         Alert.alert("Error", "Failed to load orders data. Please try again.");
//       }
//     );

//     return () => {
//       employeesUnsubscribe();
//       clientsUnsubscribe();
//       ordersUnsubscribe();
//     };
//   }, [userProfile?.businessId]);

//   useEffect(() => {
//     const unsubscribe = fetchData();
//     return unsubscribe;
//   }, [fetchData]);

//   // Fetch projects when clients are available
//   useEffect(() => {
//     if (!userProfile?.businessId || Object.keys(clients).length === 0) {
//       return;
//     }

//     const unsubscribes = [];
//     Object.keys(clients).forEach((clientId) => {
//       const projectQuery = query(
//         collection(db, `clients/${clientId}/projects`),
//         where("businessId", "==", userProfile.businessId)
//       );
//       const unsubscribe = onSnapshot(
//         projectQuery,
//         (snapshot) => {
//           const projectsList = snapshot.docs.map((doc) => ({
//             id: doc.id,
//             clientId,
//             ...doc.data(),
//           }));
//           setProjects((prev) => ({
//             ...prev,
//             ...Object.fromEntries(
//               projectsList.map((project) => [project.id, project])
//             ),
//           }));
//         },
//         (error) =>
//           console.error(
//             `Error fetching projects for client ${clientId}:`,
//             error
//           )
//       );
//       unsubscribes.push(unsubscribe);
//     });

//     return () => {
//       unsubscribes.forEach((unsub) => unsub());
//     };
//   }, [clients, userProfile?.businessId]);

//   // Update summary data
//   useEffect(() => {
//     const totalProjects = Object.keys(projects).length;
//     const totalProjectBudget = Object.values(projects).reduce(
//       (sum, project) => sum + (Number(project.budget) || 0),
//       0
//     );
//     const totalOrderAmount = orders.reduce(
//       (sum, order) => sum + (Number(order.amount) || 0),
//       0
//     );
//     const totalProfit = totalProjectBudget - totalOrderAmount;

//     setSummaryData([
//       {
//         icon: "briefcase",
//         label: "Total Projects",
//         value: totalProjects.toString(),
//         iconColor: "#0047CC",
//       },
//       {
//         icon: "dollar-sign",
//         label: "Total Profit",
//         value: `$${totalProfit.toLocaleString()}`,
//         iconColor: "#4CAF50",
//       },
//       {
//         icon: "arrow-up",
//         label: "Income",
//         value: `$${totalProjectBudget.toLocaleString()}`,
//         iconColor: "#2196F3",
//       },
//       {
//         icon: "arrow-down",
//         label: "Expenses",
//         value: `$${totalOrderAmount.toLocaleString()}`,
//         iconColor: "#F44336",
//       },
//     ]);
//   }, [orders, projects]);

//   // Handle pull-to-refresh
//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     // Reset all states to trigger re-fetch
//     setEmployees({});
//     setClients({});
//     setOrders([]);
//     setProjects({});
//     setSummaryData([
//       {
//         icon: "briefcase",
//         label: "Total Projects",
//         value: "0",
//         iconColor: "#0047CC",
//       },
//       {
//         icon: "dollar-sign",
//         label: "Total Profit",
//         value: "$0",
//         iconColor: "#4CAF50",
//       },
//       {
//         icon: "arrow-up",
//         label: "Income",
//         value: "$0",
//         iconColor: "#2196F3",
//       },
//       {
//         icon: "arrow-down",
//         label: "Expenses",
//         value: "$0",
//         iconColor: "#F44336",
//       },
//     ]);

//     // Re-fetch data
//     const unsubscribe = fetchData();

//     // Simulate a delay to ensure data is fetched (Firestore listeners are real-time)
//     setTimeout(() => {
//       setRefreshing(false);
//     }, 1000);

//     // Clean up the new listeners (they replace the old ones)
//     return unsubscribe;
//   }, [fetchData]);

//   return (
//     <SafeAreaView
//       style={[
//         styles.container,
//         { backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "#EFF6FF" },
//       ]}
//     >
//       <StatusBar
//         barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
//         backgroundColor={colorScheme === "dark" ? "#1A1A1A" : "#EFF6FF"}
//       />
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: hp(12) }}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor={colorScheme === "dark" ? "#FFFFFF" : "#2563EB"}
//             colors={[colorScheme === "dark" ? "black" : "#2563EB"]}
//           />
//         }
//       >
//         <LinearGradient
//           colors={
//             colorScheme === "dark"
//               ? ["#1A1A1A", "#1A1A1A"]
//               : ["#2563EB", "#2563EB"]
//           }
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.headerGradient}
//         >
//           <View style={styles.header}>
//             <View style={styles.headerTextContainer}>
//               <Text style={styles.title}>Rcm</Text>
//               <Text style={styles.welcomeText}>
//                 Welcome
//                 {businessDetails?.name ? `, ${businessDetails.name}` : ""}
//               </Text>
//               <Text style={styles.subtitle}>
//                 Manage your finances with ease
//               </Text>
//             </View>
//             <TouchableOpacity
//               onPress={() => navigation.navigate("Profile")}
//               style={styles.profileButtonWrapper}
//               activeOpacity={0.7}
//             >
//               <View style={styles.profileButton}>
//                 <Ionicons
//                   name="person-circle-sharp"
//                   size={64}
//                   color="#FFFFFF"
//                   style={{ marginLeft: wp(1) }}
//                 />
//               </View>
//             </TouchableOpacity>
//           </View>
//         </LinearGradient>

//         <View style={styles.summaryContainer}>
//           {summaryData.map((item, index) => (
//             <SummaryCard
//               key={index}
//               icon={item.icon}
//               label={item.label}
//               value={item.value}
//               iconColor={item.iconColor}
//               colorScheme={colorScheme}
//             />
//           ))}
//         </View>

//         <RecentOrders
//           navigation={navigation}
//           clients={clients}
//           employees={employees}
//           projects={projects}
//           colorScheme={colorScheme}
//         />
//         <RecentClients
//           clients={Object.values(clients)}
//           projects={Object.values(projects)}
//           colorScheme={colorScheme}
//           navigation={navigation}
//         />
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   headerGradient: {
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(2),
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   headerTextContainer: {
//     flex: 1,
//   },
//   title: {
//     fontSize: wp(5),
//     fontWeight: "bold",
//     color: "#FFFFFF",
//     letterSpacing: 0.5,
//   },
//   welcomeText: {
//     fontSize: wp(4),
//     fontWeight: "500",
//     color: "#FFFFFF",
//     opacity: 0.9,
//     marginTop: hp(0.5),
//   },
//   subtitle: {
//     fontSize: wp(3.5),
//     color: "#FFFFFF",
//     opacity: 0.7,
//     marginTop: hp(0.3),
//   },
//   profileButtonWrapper: {
//     marginLeft: wp(2),
//   },
//   profileButton: {
//     padding: 0,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   summaryContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(2),
//     marginBottom: hp(-4),
//     backgroundColor: "transparent",
//   },
// });
