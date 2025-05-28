// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Animated,
//   Alert,
//   RefreshControl,
// } from "react-native";
// import {
//   Text,
//   Card,
//   Chip,
//   Button,
//   Divider,
//   Portal,
//   Modal,
//   Avatar,
//   Surface,
// } from "react-native-paper";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { LinearGradient } from "expo-linear-gradient";
// import { FontAwesome5 } from "@expo/vector-icons";
// import {
//   widthPercentageToDP as wp,
//   heightPercentageToDP as hp,
// } from "react-native-responsive-screen";
// import {
//   doc,
//   getDoc,
//   deleteDoc,
//   collection,
//   query,
//   where,
//   onSnapshot,
// } from "firebase/firestore";
// import { db } from "../../config/firebase";
// import { useFocusEffect, useNavigation } from "@react-navigation/native";
// import { useAuth } from "../../context/AuthContext";
// import { useColorScheme } from "react-native";
// import ProjectsSection from "./Projects/ProjectsSection";

// const getTheme = (colorScheme) => ({
//   colors: {
//     primary: colorScheme === "dark" ? "#60A5FA" : "#1E3A8A",
//     error: colorScheme === "dark" ? "#F87171" : "#B91C1C",
//     background: colorScheme === "dark" ? "#1A1A1A" : "#EFF6FF",
//     text: colorScheme === "dark" ? "#F3F4F6" : "#1F2937",
//     placeholder: colorScheme === "dark" ? "#9CA3AF" : "#6B7280",
//     surface: colorScheme === "dark" ? "#2A2A2A" : "#FFFFFF",
//     accent: "#34D399",
//     emailIcon: "#E5B800",
//     phoneIcon: "#39FF14",
//   },
//   roundness: wp(3),
// });

// const ClientDetailsScreen = ({ route }) => {
//   const { client: initialClient } = route.params;
//   const { userProfile } = useAuth();
//   const navigation = useNavigation();
//   const [client, setClient] = useState(initialClient);
//   const [fadeAnim] = useState(new Animated.Value(0));
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [projects, setProjects] = useState([]);
//   const colorScheme = useColorScheme();
//   const theme = getTheme(colorScheme);

//   useEffect(() => {
//     if (
//       !userProfile?.businessId ||
//       initialClient.businessId !== userProfile.businessId
//     ) {
//       Alert.alert(
//         "Access Denied",
//         "You don't have permission to view this client.",
//         [{ text: "OK", onPress: () => navigation.goBack() }],
//         { cancelable: false }
//       );
//       return;
//     }

//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 600,
//       useNativeDriver: true,
//     }).start();

//     const projectsQuery = query(
//       collection(db, `clients/${initialClient.id}/projects`),
//       where("businessId", "==", userProfile.businessId)
//     );
//     const unsubscribeProjects = onSnapshot(
//       projectsQuery,
//       (snapshot) => {
//         const projectsData = snapshot.docs.map((doc, index) => ({
//           id: doc.id,
//           serialNo: index + 1,
//           ...doc.data(),
//         }));
//         setProjects(projectsData);
//       },
//       (error) => {
//         console.error("Error fetching projects: ", error);
//         Alert.alert("Error", "Failed to fetch projects.");
//       }
//     );

//     return () => unsubscribeProjects();
//   }, [
//     initialClient.id,
//     initialClient.businessId,
//     userProfile?.businessId,
//     navigation,
//   ]);

//   const fetchClientData = async () => {
//     try {
//       if (
//         !userProfile?.businessId ||
//         client.businessId !== userProfile.businessId
//       ) {
//         Alert.alert(
//           "Access Denied",
//           "You don't have permission to view this client.",
//           [{ text: "OK", onPress: () => navigation.goBack() }],
//           { cancelable: false }
//         );
//         return;
//       }

//       setRefreshing(true);
//       const clientRef = doc(db, "clients", client.id);
//       const clientSnap = await getDoc(clientRef);
//       if (clientSnap.exists()) {
//         const clientData = clientSnap.data();
//         if (clientData.businessId !== userProfile.businessId) {
//           Alert.alert(
//             "Access Denied",
//             "You don't have permission to view this client.",
//             [{ text: "OK", onPress: () => navigation.goBack() }],
//             { cancelable: false }
//           );
//           return;
//         }
//         setClient({ id: clientSnap.id, ...clientData });
//       } else {
//         Alert.alert("Error", "Client not found.");
//         navigation.goBack();
//       }
//     } catch (error) {
//       console.error("Error fetching client data: ", error);
//       Alert.alert("Error", "Failed to fetch client data. Please try again.");
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       fetchClientData();
//     }, [client.id])
//   );

//   const onRefresh = useCallback(() => {
//     fetchClientData();
//   }, [client.id]);

//   const getInitials = (name) => {
//     if (!name) return "?";
//     return name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   const handleDelete = async () => {
//     try {
//       if (client.businessId !== userProfile?.businessId) {
//         Alert.alert(
//           "Access Denied",
//           "You don't have permission to delete this client.",
//           [{ text: "OK" }],
//           { cancelable: false }
//         );
//         return;
//       }

//       setIsDeleting(true);
//       const clientRef = doc(db, "clients", client.id);
//       await deleteDoc(clientRef);
//       setShowDeleteModal(false);
//       Alert.alert("Success", "Client deleted successfully!", [
//         {
//           text: "OK",
//           onPress: () => navigation.goBack(),
//         },
//       ]);
//     } catch (error) {
//       console.error("Error deleting client: ", error);
//       Alert.alert("Error", "Failed to delete client. Please try again.");
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const handleEdit = () => {
//     navigation.navigate("EditClient", { client });
//   };

//   return (
//     <SafeAreaView
//       style={[{ flex: 1, backgroundColor: theme.colors.background }]}
//     >
//       <LinearGradient
//         colors={
//           colorScheme === "dark"
//             ? ["#1A1A1A", "#1A1A1A"]
//             : ["#0047CC", "#0047CC"]
//         }
//         style={[
//           {
//             paddingVertical: hp(3),
//             paddingHorizontal: wp(5),
//             elevation: 6,
//             shadowColor: "#000",
//             shadowOffset: { width: 0, height: 3 },
//             shadowOpacity: 0.25,
//             shadowRadius: 4,
//           },
//         ]}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       >
//         <View
//           style={[
//             {
//               flexDirection: "row",
//               alignItems: "center",
//               justifyContent: "space-between",
//             },
//           ]}
//         >
//           <TouchableOpacity
//             onPress={() => navigation.goBack()}
//             style={[
//               {
//                 padding: wp(2),
//                 borderRadius: wp(2),
//                 width: wp(10),
//                 height: wp(10),
//                 alignItems: "center",
//                 justifyContent: "center",
//               },
//             ]}
//           >
//             <FontAwesome5 name="arrow-left" size={wp(5)} color="#fff" />
//           </TouchableOpacity>
//           <Text
//             style={[
//               {
//                 fontSize: wp(6),
//                 fontWeight: "700",
//                 color: "#FFFFFF",
//                 letterSpacing: 0.5,
//                 textAlign: "center",
//               },
//             ]}
//           >
//             Client Details
//           </Text>
//           <View style={[{ width: wp(10) }]} />
//         </View>
//       </LinearGradient>

//       <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
//         <ScrollView
//           contentContainerStyle={[
//             {
//               paddingHorizontal: wp(5),
//               paddingTop: hp(2),
//               paddingBottom: hp(10),
//             },
//           ]}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               tintColor={theme.colors.primary}
//             />
//           }
//         >
//           <View style={[{ alignItems: "center", marginBottom: hp(2) }]}>
//             <Avatar.Text
//               size={wp(20)}
//               label={getInitials(client.fullName)}
//               style={[
//                 { marginBottom: hp(1), backgroundColor: theme.colors.primary },
//               ]}
//               labelStyle={[{ fontSize: wp(8), fontWeight: "bold" }]}
//               color="#FFFFFF"
//               theme={theme}
//             />
//             <View style={[{ alignItems: "center" }]}>
//               <Text
//                 style={[
//                   {
//                     fontSize: wp(6),
//                     fontWeight: "700",
//                     marginBottom: hp(1),
//                     color: theme.colors.text,
//                   },
//                 ]}
//               >
//                 {client.fullName}
//               </Text>
//               <Chip
//                 mode="outlined"
//                 style={[
//                   {
//                     height: hp(4),
//                     paddingHorizontal: wp(2),
//                     borderRadius: wp(2),
//                     backgroundColor:
//                       client.status === "active"
//                         ? colorScheme === "dark"
//                           ? "#2DD4BF20"
//                           : "#E6FFFA"
//                         : colorScheme === "dark"
//                         ? "#F8717120"
//                         : "#FEE2E2",
//                     borderColor:
//                       client.status === "active" ? "#38B2AC" : "#F87171",
//                   },
//                 ]}
//                 textStyle={[
//                   {
//                     fontSize: wp(3.5),
//                     fontWeight: "600",
//                     color: client.status === "active" ? "#38B2AC" : "#F87171",
//                   },
//                 ]}
//               >
//                 {client.status || "Unknown"}
//               </Chip>
//             </View>
//           </View>

//           <Card
//             style={[
//               {
//                 marginBottom: hp(2),
//                 borderRadius: wp(4),
//                 backgroundColor: theme.colors.surface,
//                 borderWidth: colorScheme === "dark" ? 0 : 1,
//                 borderColor: colorScheme === "dark" ? undefined : "#E5E7EB",
//               },
//             ]}
//           >
//             <LinearGradient
//               colors={
//                 colorScheme === "dark"
//                   ? ["#2A2A2A", "#2A2A2A80"]
//                   : ["#FFFFFF", "#FFFFFF"]
//               }
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//               style={[{ borderRadius: wp(4), padding: wp(1) }]}
//             >
//               <Card.Content>
//                 <View style={[{ marginBottom: hp(2) }]}>
//                   <Text
//                     style={[
//                       {
//                         fontSize: wp(4.5),
//                         fontWeight: "600",
//                         borderLeftWidth: 3,
//                         paddingLeft: wp(2),
//                         color: theme.colors.primary,
//                       },
//                     ]}
//                   >
//                     Contact Information
//                   </Text>
//                   <View
//                     style={[
//                       {
//                         flexDirection: "row",
//                         alignItems: "flex-start",
//                         marginBottom: hp(2),
//                       },
//                     ]}
//                   >
//                     <Surface
//                       style={[
//                         {
//                           width: wp(8),
//                           height: wp(8),
//                           borderRadius: wp(4),
//                           justifyContent: "center",
//                           alignItems: "center",
//                           backgroundColor: theme.colors.background,
//                         },
//                       ]}
//                     >
//                       <FontAwesome5
//                         name="envelope"
//                         size={wp(4)}
//                         color={theme.colors.emailIcon}
//                       />
//                     </Surface>
//                     <View style={[{ marginLeft: wp(3), flex: 1 }]}>
//                       <Text
//                         style={[
//                           {
//                             fontSize: wp(3.5),
//                             marginBottom: hp(0.5),
//                             color: theme.colors.placeholder,
//                           },
//                         ]}
//                       >
//                         Email
//                       </Text>
//                       <Text
//                         style={[{ fontSize: wp(4), color: theme.colors.text }]}
//                       >
//                         {client.email || "N/A"}
//                       </Text>
//                     </View>
//                   </View>
//                   <View
//                     style={[
//                       {
//                         flexDirection: "row",
//                         alignItems: "flex-start",
//                         marginBottom: hp(2),
//                       },
//                     ]}
//                   >
//                     <Surface
//                       style={[
//                         {
//                           width: wp(8),
//                           height: wp(8),
//                           borderRadius: wp(4),
//                           justifyContent: "center",
//                           alignItems: "center",
//                           backgroundColor: theme.colors.background,
//                         },
//                       ]}
//                     >
//                       <FontAwesome5
//                         name="phone"
//                         size={wp(4)}
//                         color={theme.colors.phoneIcon}
//                       />
//                     </Surface>
//                     <View style={[{ marginLeft: wp(3), flex: 1 }]}>
//                       <Text
//                         style={[
//                           {
//                             fontSize: wp(3.5),
//                             marginBottom: hp(0.5),
//                             color: theme.colors.placeholder,
//                           },
//                         ]}
//                       >
//                         Phone
//                       </Text>
//                       <Text
//                         style={[{ fontSize: wp(4), color: theme.colors.text }]}
//                       >
//                         {client.phone || "N/A"}
//                       </Text>
//                     </View>
//                   </View>
//                   {client.address && (
//                     <View
//                       style={[
//                         {
//                           flexDirection: "row",
//                           alignItems: "flex-start",
//                           marginBottom: hp(2),
//                         },
//                       ]}
//                     >
//                       <Surface
//                         style={[
//                           {
//                             width: wp(8),
//                             height: wp(8),
//                             borderRadius: wp(4),
//                             justifyContent: "center",
//                             alignItems: "center",
//                             backgroundColor: theme.colors.background,
//                           },
//                         ]}
//                       >
//                         <FontAwesome5
//                           name="map-marker-alt"
//                           size={wp(4)}
//                           color={theme.colors.primary}
//                         />
//                       </Surface>
//                       <View style={[{ marginLeft: wp(3), flex: 1 }]}>
//                         <Text
//                           style={[
//                             {
//                               fontSize: wp(3.5),
//                               marginBottom: hp(0.5),
//                               color: theme.colors.placeholder,
//                             },
//                           ]}
//                         >
//                           Address
//                         </Text>
//                         <Text
//                           style={[
//                             { fontSize: wp(4), color: theme.colors.text },
//                           ]}
//                         >
//                           {client.address}
//                         </Text>
//                       </View>
//                     </View>
//                   )}
//                 </View>

//                 <Divider
//                   style={[
//                     {
//                       marginVertical: hp(2),
//                       height: 1,
//                       backgroundColor: theme.colors.placeholder,
//                     },
//                   ]}
//                 />

//                 {(client.budget || client.requirements) && (
//                   <>
//                     <View style={[{ marginBottom: hp(2) }]}>
//                       <Text
//                         style={[
//                           {
//                             fontSize: wp(4.5),
//                             fontWeight: "600",
//                             borderLeftWidth: 3,
//                             paddingLeft: wp(2),
//                             color: theme.colors.primary,
//                           },
//                         ]}
//                       >
//                         Preferences
//                       </Text>
//                       {client.budget && (
//                         <View
//                           style={[
//                             {
//                               flexDirection: "row",
//                               alignItems: "flex-start",
//                               marginBottom: hp(2),
//                             },
//                           ]}
//                         >
//                           <Surface
//                             style={[
//                               {
//                                 width: wp(8),
//                                 height: wp(8),
//                                 borderRadius: wp(4),
//                                 justifyContent: "center",
//                                 alignItems: "center",
//                                 backgroundColor: theme.colors.background,
//                               },
//                             ]}
//                           >
//                             <FontAwesome5
//                               name="dollar-sign"
//                               size={wp(4)}
//                               color={theme.colors.primary}
//                             />
//                           </Surface>
//                           <View style={[{ marginLeft: wp(3), flex: 1 }]}>
//                             <Text
//                               style={[
//                                 {
//                                   fontSize: wp(3.5),
//                                   marginBottom: hp(0.5),
//                                   color: theme.colors.placeholder,
//                                 },
//                               ]}
//                             >
//                               Budget
//                             </Text>
//                             <Text
//                               style={[
//                                 { fontSize: wp(4), color: theme.colors.text },
//                               ]}
//                             >
//                               ${Number(client.budget).toLocaleString()}
//                             </Text>
//                           </View>
//                         </View>
//                       )}
//                       {client.requirements && (
//                         <View
//                           style={[
//                             {
//                               flexDirection: "row",
//                               alignItems: "flex-start",
//                               marginBottom: hp(2),
//                             },
//                           ]}
//                         >
//                           <Surface
//                             style={[
//                               {
//                                 width: wp(8),
//                                 height: wp(8),
//                                 borderRadius: wp(4),
//                                 justifyContent: "center",
//                                 alignItems: "center",
//                                 backgroundColor: theme.colors.background,
//                               },
//                             ]}
//                           >
//                             <FontAwesome5
//                               name="list-ul"
//                               size={wp(4)}
//                               color={theme.colors.primary}
//                             />
//                           </Surface>
//                           <View style={[{ marginLeft: wp(3), flex: 1 }]}>
//                             <Text
//                               style={[
//                                 {
//                                   fontSize: wp(3.5),
//                                   marginBottom: hp(0.5),
//                                   color: theme.colors.placeholder,
//                                 },
//                               ]}
//                             >
//                               Requirements
//                             </Text>
//                             <Text
//                               style={[
//                                 { fontSize: wp(4), color: theme.colors.text },
//                               ]}
//                             >
//                               {client.requirements}
//                             </Text>
//                           </View>
//                         </View>
//                       )}
//                     </View>
//                     <Divider
//                       style={[
//                         {
//                           marginVertical: hp(2),
//                           height: 1,
//                           backgroundColor: theme.colors.placeholder,
//                         },
//                       ]}
//                     />
//                   </>
//                 )}

//                 {client.tags && client.tags.length > 0 && (
//                   <>
//                     <View style={[{ marginBottom: hp(2) }]}>
//                       <Text
//                         style={[
//                           {
//                             fontSize: wp(4.5),
//                             fontWeight: "600",
//                             borderLeftWidth: 3,
//                             paddingLeft: wp(2),
//                             color: theme.colors.primary,
//                           },
//                         ]}
//                       >
//                         Tags
//                       </Text>
//                       <View
//                         style={[
//                           {
//                             flexDirection: "row",
//                             flexWrap: "wrap",
//                             marginTop: hp(1),
//                           },
//                         ]}
//                       >
//                         {client.tags.map((tag, index) => (
//                           <Chip
//                             key={index}
//                             style={[
//                               {
//                                 marginRight: wp(2),
//                                 marginBottom: hp(1),
//                                 borderWidth: 1,
//                                 borderRadius: wp(2),
//                                 backgroundColor:
//                                   colorScheme === "dark"
//                                     ? "#4B5563"
//                                     : "#EBF5FF",
//                                 borderColor:
//                                   colorScheme === "dark"
//                                     ? "#6B7280"
//                                     : "#BFDBFE",
//                               },
//                             ]}
//                             textStyle={[
//                               { fontSize: wp(3.5), color: theme.colors.text },
//                             ]}
//                           >
//                             {tag}
//                           </Chip>
//                         ))}
//                       </View>
//                     </View>
//                     <Divider
//                       style={[
//                         {
//                           marginVertical: hp(2),
//                           height: 1,
//                           backgroundColor: theme.colors.placeholder,
//                         },
//                       ]}
//                     />
//                   </>
//                 )}

//                 <View style={[{ marginBottom: hp(2) }]}>
//                   <Text
//                     style={[
//                       {
//                         fontSize: wp(4.5),
//                         fontWeight: "600",
//                         borderLeftWidth: 3,
//                         paddingLeft: wp(2),
//                         color: theme.colors.primary,
//                       },
//                     ]}
//                   >
//                     Additional Information
//                   </Text>
//                   {client.createdAt && (
//                     <View
//                       style={[
//                         {
//                           flexDirection: "row",
//                           alignItems: "flex-start",
//                           marginBottom: hp(2),
//                         },
//                       ]}
//                     >
//                       <Surface
//                         style={[
//                           {
//                             width: wp(8),
//                             height: wp(8),
//                             borderRadius: wp(4),
//                             justifyContent: "center",
//                             alignItems: "center",
//                             backgroundColor: theme.colors.background,
//                           },
//                         ]}
//                       >
//                         <FontAwesome5
//                           name="calendar"
//                           size={wp(4)}
//                           color={theme.colors.primary}
//                         />
//                       </Surface>
//                       <View style={[{ marginLeft: wp(3), flex: 1 }]}>
//                         <Text
//                           style={[
//                             {
//                               fontSize: wp(3.5),
//                               marginBottom: hp(0.5),
//                               color: theme.colors.placeholder,
//                             },
//                           ]}
//                         >
//                           Joined
//                         </Text>
//                         <Text
//                           style={[
//                             { fontSize: wp(4), color: theme.colors.text },
//                           ]}
//                         >
//                           {client.createdAt?.toDate
//                             ? client.createdAt.toDate().toLocaleDateString()
//                             : "N/A"}
//                         </Text>
//                       </View>
//                     </View>
//                   )}
//                   {client.paymentTerms && (
//                     <View
//                       style={[
//                         {
//                           flexDirection: "row",
//                           alignItems: "flex-start",
//                           marginBottom: hp(2),
//                         },
//                       ]}
//                     >
//                       <Surface
//                         style={[
//                           {
//                             width: wp(8),
//                             height: wp(8),
//                             borderRadius: wp(4),
//                             justifyContent: "center",
//                             alignItems: "center",
//                             backgroundColor: theme.colors.background,
//                           },
//                         ]}
//                       >
//                         <FontAwesome5
//                           name="credit-card"
//                           size={wp(4)}
//                           color={theme.colors.primary}
//                         />
//                       </Surface>
//                       <View style={[{ marginLeft: wp(3), flex: 1 }]}>
//                         <Text
//                           style={[
//                             {
//                               fontSize: wp(3.5),
//                               marginBottom: hp(0.5),
//                               color: theme.colors.placeholder,
//                             },
//                           ]}
//                         >
//                           Payment Terms
//                         </Text>
//                         <Text
//                           style={[
//                             { fontSize: wp(4), color: theme.colors.text },
//                           ]}
//                         >
//                           {client.paymentTerms}
//                         </Text>
//                       </View>
//                     </View>
//                   )}
//                   {client.projectDeadline && (
//                     <View
//                       style={[
//                         {
//                           flexDirection: "row",
//                           alignItems: "flex-start",
//                           marginBottom: hp(2),
//                         },
//                       ]}
//                     >
//                       <Surface
//                         style={[
//                           {
//                             width: wp(8),
//                             height: wp(8),
//                             borderRadius: wp(4),
//                             justifyContent: "center",
//                             alignItems: "center",
//                             backgroundColor: theme.colors.background,
//                           },
//                         ]}
//                       >
//                         <FontAwesome5
//                           name="clock"
//                           size={wp(4)}
//                           color={theme.colors.primary}
//                         />
//                       </Surface>
//                       <View style={[{ marginLeft: wp(3), flex: 1 }]}>
//                         <Text
//                           style={[
//                             {
//                               fontSize: wp(3.5),
//                               marginBottom: hp(0.5),
//                               color: theme.colors.placeholder,
//                             },
//                           ]}
//                         >
//                           Project Deadline
//                         </Text>
//                         <Text
//                           style={[
//                             { fontSize: wp(4), color: theme.colors.text },
//                           ]}
//                         >
//                           {client.projectDeadline?.toDate
//                             ? client.projectDeadline
//                                 .toDate()
//                                 .toLocaleDateString()
//                             : new Date(
//                                 client.projectDeadline
//                               ).toLocaleDateString()}
//                         </Text>
//                       </View>
//                     </View>
//                   )}
//                   {client.notes && (
//                     <View
//                       style={[
//                         {
//                           flexDirection: "row",
//                           alignItems: "flex-start",
//                           marginBottom: hp(2),
//                         },
//                       ]}
//                     >
//                       <Surface
//                         style={[
//                           {
//                             width: wp(8),
//                             height: wp(8),
//                             borderRadius: wp(4),
//                             justifyContent: "center",
//                             alignItems: "center",
//                             backgroundColor: theme.colors.background,
//                           },
//                         ]}
//                       >
//                         <FontAwesome5
//                           name="sticky-note"
//                           size={wp(4)}
//                           color={theme.colors.primary}
//                         />
//                       </Surface>
//                       <View style={[{ marginLeft: wp(3), flex: 1 }]}>
//                         <Text
//                           style={[
//                             {
//                               fontSize: wp(3.5),
//                               marginBottom: hp(0.5),
//                               color: theme.colors.placeholder,
//                             },
//                           ]}
//                         >
//                           Notes
//                         </Text>
//                         <Text
//                           style={[
//                             { fontSize: wp(4), color: theme.colors.text },
//                           ]}
//                         >
//                           {client.notes}
//                         </Text>
//                       </View>
//                     </View>
//                   )}
//                 </View>
//               </Card.Content>
//             </LinearGradient>
//           </Card>

//           <ProjectsSection
//             client={client}
//             projects={projects}
//             theme={theme}
//             businessId={userProfile?.businessId}
//             navigation={navigation}
//             colorScheme={colorScheme}
//           />

//           <View
//             style={[
//               {
//                 marginTop: hp(2),
//                 marginBottom: hp(4),
//                 flexDirection: "row",
//                 justifyContent: "space-between",
//                 gap: wp(2),
//               },
//             ]}
//           >
//             <Button
//               mode="contained"
//               onPress={handleEdit}
//               style={[
//                 {
//                   flex: 1,
//                   borderRadius: wp(3),
//                   height: hp(5.5),
//                   elevation: 3,
//                   borderWidth: 1.5,
//                   justifyContent: "center",
//                 },
//               ]}
//               labelStyle={[{ fontSize: wp(4.5), fontWeight: "600" }]}
//               icon="pencil"
//               theme={theme}
//             >
//               Edit Client
//             </Button>
//             <Button
//               mode="outlined"
//               onPress={() => setShowDeleteModal(true)}
//               style={[
//                 {
//                   flex: 1,
//                   borderRadius: wp(3),
//                   height: hp(5.5),
//                   elevation: 3,
//                   borderWidth: 1.5,
//                   justifyContent: "center",
//                   borderColor: theme.colors.error,
//                 },
//               ]}
//               labelStyle={[
//                 {
//                   fontSize: wp(4.5),
//                   fontWeight: "600",
//                   color: theme.colors.error,
//                 },
//               ]}
//               icon="delete"
//               theme={theme}
//             >
//               Delete Client
//             </Button>
//           </View>
//         </ScrollView>
//       </Animated.View>

//       <Portal>
//         <Modal
//           visible={showDeleteModal}
//           onDismiss={() => setShowDeleteModal(false)}
//           contentContainerStyle={[
//             {
//               padding: wp(5),
//               marginHorizontal: wp(5),
//               borderRadius: wp(4),
//               width: wp(90),
//               maxHeight: hp(80),
//               alignSelf: "center",
//               elevation: 6,
//               shadowColor: "#000",
//               shadowOffset: { width: 0, height: 3 },
//               shadowOpacity: 0.25,
//               shadowRadius: 4,
//               backgroundColor: theme.colors.surface,
//             },
//           ]}
//         >
//           <Text
//             style={[
//               {
//                 fontSize: wp(5.5),
//                 fontWeight: "700",
//                 marginBottom: hp(2),
//                 color: theme.colors.error,
//               },
//             ]}
//           >
//             Delete Client
//           </Text>
//           <Text
//             style={[
//               {
//                 fontSize: wp(4),
//                 marginBottom: hp(3),
//                 lineHeight: wp(5.5),
//                 color: theme.colors.text,
//               },
//             ]}
//           >
//             Are you sure you want to permanently delete {client.fullName}? This
//             action cannot be undone.
//           </Text>
//           <View
//             style={[
//               { flexDirection: "row", justifyContent: "flex-end", gap: wp(2) },
//             ]}
//           >
//             <Button
//               mode="outlined"
//               onPress={() => setShowDeleteModal(false)}
//               style={[{ minWidth: wp(20) }]}
//               theme={theme}
//             >
//               Cancel
//             </Button>
//             <Button
//               mode="contained"
//               onPress={handleDelete}
//               loading={isDeleting}
//               style={[
//                 { minWidth: wp(20), backgroundColor: theme.colors.error },
//               ]}
//               theme={theme}
//             >
//               Delete
//             </Button>
//           </View>
//         </Modal>
//       </Portal>
//     </SafeAreaView>
//   );
// };

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
//   },
//   backButton: {
//     padding: wp(2),
//     borderRadius: wp(2),
//     width: wp(10),
//     height: wp(10),
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   headerTitle: {
//     fontSize: wp(6),
//     fontWeight: "700",
//     color: "#FFFFFF",
//     letterSpacing: 0.5,
//     textAlign: "center",
//   },
//   content: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingHorizontal: wp(5),
//     paddingTop: hp(2),
//     paddingBottom: hp(10),
//   },
//   profileHeader: {
//     alignItems: "center",
//     marginBottom: hp(2),
//   },
//   avatar: {
//     marginBottom: hp(1),
//   },
//   avatarText: {
//     fontSize: wp(8),
//     fontWeight: "bold",
//   },
//   profileInfo: {
//     alignItems: "center",
//   },
//   clientName: {
//     fontSize: wp(6),
//     fontWeight: "700",
//     marginBottom: hp(1),
//   },
//   statusChip: {
//     height: hp(4),
//     paddingHorizontal: wp(2),
//     borderRadius: wp(2),
//   },
//   statusText: {
//     fontSize: wp(3.5),
//     fontWeight: "600",
//   },
//   card: {
//     marginBottom: hp(2),
//     borderRadius: wp(4),
//   },
//   cardGradient: {
//     borderRadius: wp(4),
//     padding: wp(1),
//   },
//   section: {
//     marginBottom: hp(2),
//   },
//   sectionTitle: {
//     fontSize: wp(4.5),
//     fontWeight: "600",
//     borderLeftWidth: 3,
//     paddingLeft: wp(2),
//   },
//   infoRow: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     marginBottom: hp(2),
//   },
//   iconSurface: {
//     width: wp(8),
//     height: wp(8),
//     borderRadius: wp(4),
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   infoContent: {
//     marginLeft: wp(3),
//     flex: 1,
//   },
//   infoLabel: {
//     fontSize: wp(3.5),
//     marginBottom: hp(0.5),
//   },
//   infoText: {
//     fontSize: wp(4),
//   },
//   divider: {
//     marginVertical: hp(2),
//     height: 1,
//   },
//   tagsContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     marginTop: hp(1),
//   },
//   tag: {
//     marginRight: wp(2),
//     marginBottom: hp(1),
//     borderWidth: 1,
//     borderRadius: wp(2),
//   },
//   tagText: {
//     fontSize: wp(3.5),
//   },
//   buttonContainer: {
//     marginTop: hp(2),
//     marginBottom: hp(4),
//     flexDirection: "row",
//     justifyContent: "space-between",
//     gap: wp(2),
//   },
//   actionButton: {
//     flex: 1,
//     borderRadius: wp(3),
//     height: hp(5.5),
//     elevation: 3,
//   },
//   editButton: {
//     borderWidth: 1.5,
//     justifyContent: "center",
//   },
//   deleteButton: {
//     borderWidth: 1.5,
//     justifyContent: "center",
//   },
//   buttonLabel: {
//     fontSize: wp(4.5),
//     fontWeight: "600",
//   },
//   modalContent: {
//     padding: wp(5),
//     marginHorizontal: wp(5),
//     borderRadius: wp(4),
//     width: wp(90),
//     maxHeight: hp(80),
//     alignSelf: "center",
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
//   modalText: {
//     fontSize: wp(4),
//     marginBottom: hp(3),
//     lineHeight: wp(5.5),
//   },
//   modalButtons: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
//     gap: wp(2),
//   },
//   modalButton: {
//     minWidth: wp(20),
//   },
// });

// export default ClientDetailsScreen;
