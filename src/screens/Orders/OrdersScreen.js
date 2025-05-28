// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   RefreshControl,
//   useColorScheme,
//   StatusBar,
//   TouchableWithoutFeedback,
// } from "react-native";
// import {
//   Text,
//   Card,
//   Searchbar,
//   FAB,
//   Portal,
//   Modal,
//   Button,
//   Divider,
//   Surface,
// } from "react-native-paper";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { LinearGradient } from "expo-linear-gradient";
// import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
// import {
//   widthPercentageToDP as wp,
//   heightPercentageToDP as hp,
// } from "react-native-responsive-screen";
// import {
//   collection,
//   query,
//   where,
//   orderBy,
//   limit,
//   onSnapshot,
//   getDoc,
//   doc,
// } from "firebase/firestore";
// import { db } from "../../config/firebase";
// import { useAuth } from "../../context/AuthContext";

// const getTheme = (colorScheme) => ({
//   colors: {
//     primary: colorScheme === "dark" ? "#60A5FA" : "#1E3A8A",
//     error: colorScheme === "dark" ? "#F87171" : "#B91C1C",
//     background: colorScheme === "dark" ? "#1A1A1A" : "#EFF6FF",
//     text: colorScheme === "dark" ? "#F3F4F6" : "#1F2937",
//     placeholder: colorScheme === "dark" ? "#9CA3AF" : "#6B7280",
//     surface: colorScheme === "dark" ? "#2A2A2A" : "#FFFFFF",
//     accent: "#34D399", // For status dot (e.g., in-progress, completed)
//   },
//   roundness: wp(3),
// });

// export default function OrdersScreen({ navigation }) {
//   const { userProfile } = useAuth();
//   const [orders, setOrders] = useState([]);
//   const [filteredOrders, setFilteredOrders] = useState([]);
//   const [clients, setClients] = useState({});
//   const [projects, setProjects] = useState({});
//   const [employees, setEmployees] = useState({});
//   const [searchQuery, setSearchQuery] = useState("");
//   const [refreshing, setRefreshing] = useState(false);
//   const [showFilterModal, setShowFilterModal] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState("none");
//   const colorScheme = useColorScheme();
//   const theme = getTheme(colorScheme);

//   useEffect(() => {
//     // Status bar configuration
//     StatusBar.setBarStyle(
//       colorScheme === "dark" ? "light-content" : "dark-content"
//     );
//     StatusBar.setBackgroundColor("transparent");
//     StatusBar.setTranslucent(true);

//     if (!userProfile?.businessId) {
//       console.warn("No business ID found for user");
//       return;
//     }

//     const ordersQuery = query(
//       collection(db, "orders"),
//       where("businessId", "==", userProfile.businessId),
//       orderBy("createdAt", "desc"),
//       limit(50)
//     );

//     const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
//       const ordersList = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));

//       // Fetch client, project, and employee details
//       const clientIds = [...new Set(ordersList.map((order) => order.clientId))];
//       const employeeIds = [
//         ...new Set(ordersList.map((order) => order.employeeId)),
//       ];
//       const projectIds = [
//         ...new Set(
//           ordersList
//             .filter((order) => order.projectId)
//             .map((order) => ({
//               clientId: order.clientId,
//               projectId: order.projectId,
//             }))
//         ),
//       ];

//       // Fetch clients
//       const clientsData = {};
//       await Promise.all(
//         clientIds.map(async (clientId) => {
//           const clientRef = doc(db, "clients", clientId);
//           const clientDoc = await getDoc(clientRef);
//           if (clientDoc.exists()) {
//             clientsData[clientId] = { id: clientDoc.id, ...clientDoc.data() };
//           }
//         })
//       );

//       // Fetch projects
//       const projectsData = {};
//       await Promise.all(
//         projectIds.map(async ({ clientId, projectId }) => {
//           const projectRef = doc(db, `clients/${clientId}/projects`, projectId);
//           const projectDoc = await getDoc(projectRef);
//           if (projectDoc.exists()) {
//             projectsData[projectId] = {
//               id: projectDoc.id,
//               ...projectDoc.data(),
//             };
//           }
//         })
//       );

//       // Fetch employees
//       const employeesData = {};
//       await Promise.all(
//         employeeIds.map(async (employeeId) => {
//           const employeeRef = doc(db, "employees", employeeId);
//           const employeeDoc = await getDoc(employeeRef);
//           if (employeeDoc.exists()) {
//             employeesData[employeeId] = {
//               id: employeeDoc.id,
//               ...employeeDoc.data(),
//             };
//           }
//         })
//       );

//       setClients(clientsData);
//       setProjects(projectsData);
//       setEmployees(employeesData);
//       setOrders(ordersList);
//       applyFilters(ordersList, searchQuery, selectedFilter);
//     });

//     return () => unsubscribe();
//   }, [userProfile?.businessId, searchQuery, selectedFilter]);

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     setTimeout(() => {
//       setRefreshing(false);
//     }, 1000);
//   }, []);

//   const applyFilters = (ordersList, query, filter) => {
//     let filtered = [...ordersList];

//     // Apply search query filter
//     if (query) {
//       const lowercaseQuery = query.toLowerCase();
//       filtered = filtered.filter(
//         (order) =>
//           order.title?.toLowerCase().includes(lowercaseQuery) ||
//           order.description?.toLowerCase().includes(lowercaseQuery) ||
//           clients[order.clientId]?.fullName
//             ?.toLowerCase()
//             .includes(lowercaseQuery) ||
//           projects[order.projectId]?.projectName
//             ?.toLowerCase()
//             .includes(lowercaseQuery) ||
//           employees[order.employeeId]?.fullName
//             ?.toLowerCase()
//             .includes(lowercaseQuery)
//       );
//     }

//     // Apply status filter
//     if (filter !== "none") {
//       filtered = filtered.filter((order) => order.status === filter);
//     }

//     setFilteredOrders(filtered);
//   };

//   const handleSearch = (query) => {
//     setSearchQuery(query);
//     applyFilters(orders, query, selectedFilter);
//   };

//   const handleFilter = (filter) => {
//     setSelectedFilter(filter);
//     applyFilters(orders, searchQuery, filter);
//     setShowFilterModal(false);
//   };

//   const renderOrderItem = ({ item }) => (
//     <TouchableWithoutFeedback
//       onPress={() => navigation.navigate("OrderDetails", { order: item })}
//     >
//       <Card
//         style={[
//           styles.card,
//           {
//             backgroundColor: theme.colors.surface,
//             borderWidth: colorScheme === "dark" ? 0 : 1,
//             borderColor: colorScheme === "dark" ? undefined : "#E5E7EB",
//           },
//         ]}
//       >
//         <LinearGradient
//           colors={
//             colorScheme === "dark"
//               ? ["#2A2A2A", "#2A2A2A80"]
//               : ["#FFFFFF", "#FFFFFF"]
//           }
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.cardGradient}
//         >
//           <Card.Content>
//             <View style={styles.cardHeader}>
//               <View style={styles.nameContainer}>
//                 <View style={styles.avatarContainer}>
//                   <View style={styles.avatar}>
//                     <Text
//                       style={[
//                         styles.avatarText,
//                         { color: theme.colors.primary },
//                       ]}
//                     >
//                       {item.title.charAt(0).toUpperCase()}
//                     </Text>
//                   </View>
//                 </View>
//                 <View style={styles.nameAndIcons}>
//                   <Text
//                     style={[styles.orderTitle, { color: theme.colors.text }]}
//                     numberOfLines={1}
//                     ellipsizeMode="tail"
//                   >
//                     {item.title}
//                   </Text>
//                   <View style={styles.statusRow}>
//                     <Surface
//                       style={[
//                         styles.statusSurface,
//                         { backgroundColor: theme.colors.background },
//                       ]}
//                     >
//                       <Text
//                         style={[
//                           styles.statusText,
//                           {
//                             color:
//                               item.status === "in-progress"
//                                 ? theme.colors.primary
//                                 : item.status === "completed"
//                                 ? "#38B2AC"
//                                 : theme.colors.error,
//                           },
//                         ]}
//                       >
//                         {item.status.charAt(0).toUpperCase() +
//                           item.status.slice(1)}
//                       </Text>
//                     </Surface>
//                   </View>
//                 </View>
//               </View>
//             </View>
//             <Text
//               style={[styles.infoText, { color: theme.colors.placeholder }]}
//               numberOfLines={1}
//               ellipsizeMode="tail"
//             >
//               Client: {clients[item.clientId]?.fullName || "Loading..."}
//             </Text>
//             {item.projectId && (
//               <Text
//                 style={[styles.infoText, { color: theme.colors.placeholder }]}
//                 numberOfLines={1}
//                 ellipsizeMode="tail"
//               >
//                 Project: {projects[item.projectId]?.projectName || "Loading..."}
//               </Text>
//             )}
//             <Text
//               style={[styles.infoText, { color: theme.colors.placeholder }]}
//               numberOfLines={1}
//               ellipsizeMode="tail"
//             >
//               Emp Name: {employees[item.employeeId]?.fullName || "Loading..."}
//             </Text>
//             <Text
//               style={[styles.infoText, { color: theme.colors.placeholder }]}
//             >
//               ${item.amount} | Due:{" "}
//               {item.deadline?.toDate?.().toLocaleDateString() || "N/A"}
//             </Text>
//           </Card.Content>
//         </LinearGradient>
//       </Card>
//     </TouchableWithoutFeedback>
//   );

//   return (
//     <SafeAreaView
//       style={[styles.container, { backgroundColor: theme.colors.background }]}
//     >
//       <LinearGradient
//         colors={
//           colorScheme === "dark"
//             ? ["#1A1A1A", "#1A1A1A"]
//             : ["#0047CC", "#0047CC"]
//         }
//         style={styles.header}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       >
//         <View style={styles.headerContent}>
//           <Text style={styles.headerTitle}>Orders</Text>
//           <TouchableOpacity
//             onPress={() => setShowFilterModal(true)}
//             style={styles.filterButton}
//           >
//             <FontAwesome5 name="filter" size={wp(5)} color="#FFFFFF" />
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>

//       <View style={styles.content}>
//         <Searchbar
//           placeholder="Search orders..."
//           onChangeText={handleSearch}
//           value={searchQuery}
//           style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
//           iconColor={theme.colors.primary}
//           placeholderTextColor={theme.colors.placeholder}
//           textColor={theme.colors.text}
//           theme={theme}
//         />

//         <FlatList
//           data={filteredOrders}
//           renderItem={renderOrderItem}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.listContent}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               tintColor={theme.colors.primary}
//             />
//           }
//           ListEmptyComponent={
//             <View style={styles.emptyContainer}>
//               <MaterialIcons
//                 name="shopping-cart"
//                 size={wp(15)}
//                 color={theme.colors.placeholder}
//               />
//               <Text style={[styles.emptyText, { color: theme.colors.text }]}>
//                 No orders found
//               </Text>
//               <Text
//                 style={[
//                   styles.emptySubText,
//                   { color: theme.colors.placeholder },
//                 ]}
//               >
//                 Add a new order to get started
//               </Text>
//             </View>
//           }
//         />

//         <FAB
//           style={[styles.fab, { backgroundColor: "#0047CC" }]}
//           icon="plus"
//           onPress={() => navigation.navigate("AddOrder")}
//           color="#FFFFFF"
//           theme={theme}
//         />
//       </View>

//       <Portal>
//         <Modal
//           visible={showFilterModal}
//           onDismiss={() => setShowFilterModal(false)}
//           contentContainerStyle={[
//             styles.modalContent,
//             { backgroundColor: theme.colors.surface },
//           ]}
//         >
//           <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>
//             Filter Orders by Status
//           </Text>
//           <Divider
//             style={[
//               styles.modalDivider,
//               { backgroundColor: theme.colors.placeholder },
//             ]}
//           />
//           <Button
//             mode={selectedFilter === "none" ? "contained" : "outlined"}
//             onPress={() => handleFilter("none")}
//             style={styles.filterButton}
//             theme={theme}
//           >
//             Default
//           </Button>
//           <Button
//             mode={selectedFilter === "in-progress" ? "contained" : "outlined"}
//             onPress={() => handleFilter("in-progress")}
//             style={styles.filterButton}
//             theme={theme}
//           >
//             In-progress
//           </Button>
//           <Button
//             mode={selectedFilter === "completed" ? "contained" : "outlined"}
//             onPress={() => handleFilter("completed")}
//             style={styles.filterButton}
//             theme={theme}
//           >
//             Completed
//           </Button>
//           <Button
//             mode={selectedFilter === "cancelled" ? "contained" : "outlined"}
//             onPress={() => handleFilter("cancelled")}
//             style={styles.filterButton}
//             theme={theme}
//           >
//             Cancelled
//           </Button>
//         </Modal>
//       </Portal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     paddingVertical: hp(3),
//     paddingHorizontal: wp(5),
//     elevation: 6,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   headerContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     width: "100%",
//   },
//   headerTitle: {
//     fontSize: wp(6),
//     fontWeight: "700",
//     color: "#FFFFFF",
//     letterSpacing: 0.5,
//   },
//   filterButton: {
//     padding: wp(2),
//     borderRadius: wp(2),
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: wp(5),
//   },
//   searchBar: {
//     marginVertical: hp(2),
//     elevation: 2,
//     borderRadius: wp(3),
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   listContent: {
//     paddingBottom: hp(20),
//   },
//   card: {
//     marginBottom: hp(2),
//     borderRadius: 20,
//     backgroundColor: "#FFFFFF", // Explicit background color
//   },
//   cardGradient: {
//     borderRadius: 16,
//     padding: wp(1),
//   },
//   cardHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: hp(1),
//     marginTop: hp(0.5),
//   },
//   nameContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//   },
//   avatarContainer: {
//     position: "relative",
//     marginRight: wp(3),
//   },
//   avatar: {
//     width: wp(10),
//     height: wp(10),
//     borderRadius: wp(5),
//     backgroundColor: "#E5E7EB",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   avatarText: {
//     fontSize: wp(5),
//     fontWeight: "bold",
//   },
//   statusDot: {
//     position: "absolute",
//     top: -wp(1),
//     right: -wp(1),
//     width: wp(3),
//     height: wp(3),
//     borderRadius: wp(1.5),
//   },
//   nameAndIcons: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   orderTitle: {
//     fontSize: wp(4.5),
//     fontWeight: "600",
//     flexShrink: 1,
//     marginRight: wp(2),
//   },
//   statusRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: wp(2),
//   },
//   statusSurface: {
//     borderRadius: wp(5),
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: wp(3),
//     paddingVertical: hp(0.5),
//   },
//   statusText: {
//     fontSize: wp(3.5),
//     fontWeight: "600",
//   },
//   infoText: {
//     fontSize: wp(3.5),
//     marginBottom: hp(1),
//     opacity: 0.8,
//   },
//   fab: {
//     position: "absolute",
//     margin: wp(4),
//     right: 0,
//     bottom: hp(11),
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: hp(5),
//   },
//   emptyText: {
//     fontSize: wp(4),
//     fontWeight: "600",
//   },
//   emptySubText: {
//     fontSize: wp(3.5),
//     marginTop: hp(1),
//     opacity: 0.8,
//   },
//   modalContent: {
//     padding: wp(5),
//     margin: wp(5),
//     borderRadius: wp(4),
//     elevation: 6,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   modalTitle: {
//     fontSize: wp(5.5),
//     fontWeight: "700",
//     marginBottom: hp(2),
//   },
//   modalDivider: {
//     marginBottom: hp(2),
//   },
//   filterButton: {
//     marginBottom: hp(1),
//   },
// });
