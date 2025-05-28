// import React, { useState, useEffect } from "react";
// import {
//   View,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Animated,
//   useColorScheme,
//   Alert,
// } from "react-native";
// import {
//   Text,
//   Card,
//   Chip,
//   Button,
//   Divider,
//   Portal,
//   Modal,
//   Menu,
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
//   updateDoc,
//   deleteDoc,
//   serverTimestamp,
//   collection,
//   query,
//   where,
//   getDocs,
//   getDoc,
// } from "firebase/firestore";
// import { db } from "../../config/firebase";
// import { useAuth } from "../../context/AuthContext";
// import * as FileSystem from "expo-file-system";
// import * as Sharing from "expo-sharing";
// import * as XLSX from "xlsx";
// import * as Print from "expo-print";
// import { format } from "date-fns";

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

// export default function EmployeeDetailsScreen({ route, navigation }) {
//   const { employee } = route.params;
//   const { userProfile } = useAuth();
//   const [fadeAnim] = useState(new Animated.Value(0));
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [showInvoiceModal, setShowInvoiceModal] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [menuVisible, setMenuVisible] = useState(false);
//   const [projectsData, setProjectsData] = useState([]);
//   const [totalAmount, setTotalAmount] = useState(0);
//   const colorScheme = useColorScheme();
//   const theme = getTheme(colorScheme);

//   useEffect(() => {
//     if (employee.businessId !== userProfile?.businessId) {
//       Alert.alert(
//         "Access Denied",
//         "You don't have permission to view this employee.",
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

//     fetchEmployeeProjects();
//   }, [employee.businessId, userProfile?.businessId, employee.id]);

//   const fetchEmployeeProjects = async () => {
//     try {
//       const ordersQuery = query(
//         collection(db, "orders"),
//         where("employeeId", "==", employee.id),
//         where("businessId", "==", employee.businessId)
//       );

//       const ordersSnapshot = await getDocs(ordersQuery);
//       const ordersList = ordersSnapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));

//       const projectDetails = [];
//       let total = 0;

//       for (const order of ordersList) {
//         if (order.projectId && order.clientId) {
//           const projectRef = doc(
//             db,
//             `clients/${order.clientId}/projects`,
//             order.projectId
//           );
//           const projectDoc = await getDoc(projectRef);
//           if (projectDoc.exists()) {
//             const projectData = projectDoc.data();
//             const amount = Number(order.amount) || 0;
//             projectDetails.push({
//               projectName: projectData.projectName || "Unnamed Project",
//               amount: amount,
//             });
//             total += amount;
//           }
//         }
//       }

//       setProjectsData(projectDetails);
//       setTotalAmount(total);
//     } catch (error) {
//       console.error("Error fetching employee projects: ", error);
//       Alert.alert("Error", "Failed to fetch project data for invoice.");
//     }
//   };

//   const handleStatusChange = async (status) => {
//     try {
//       if (employee.businessId !== userProfile?.businessId) {
//         Alert.alert(
//           "Access Denied",
//           "You don't have permission to modify this employee.",
//           [{ text: "OK" }],
//           { cancelable: false }
//         );
//         return;
//       }

//       const employeeRef = doc(db, "employees", employee.id);
//       await updateDoc(employeeRef, {
//         status,
//         businessId: userProfile.businessId,
//         updatedAt: serverTimestamp(),
//       });
//       navigation.setParams({ employee: { ...employee, status } });
//       setMenuVisible(false);
//     } catch (error) {
//       console.error("Error updating status: ", error);
//       Alert.alert(
//         "Error",
//         "Failed to update employee status. Please try again."
//       );
//     }
//   };

//   const handleDelete = async () => {
//     try {
//       if (employee.businessId !== userProfile?.businessId) {
//         Alert.alert(
//           "Access Denied",
//           "You don't have permission to delete this employee.",
//           [{ text: "OK" }],
//           { cancelable: false }
//         );
//         return;
//       }

//       setIsDeleting(true);
//       const employeeRef = doc(db, "employees", employee.id);
//       await deleteDoc(employeeRef);
//       navigation.goBack();
//     } catch (error) {
//       console.error("Error deleting employee: ", error);
//       Alert.alert("Error", "Failed to delete employee. Please try again.");
//     } finally {
//       setIsDeleting(false);
//       setShowDeleteModal(false);
//     }
//   };

//   const generateInvoice = async (outputFormat) => {
//     if (projectsData.length === 0) {
//       Alert.alert(
//         "Error",
//         "No projects found for this employee to generate an invoice."
//       );
//       return;
//     }

//     setIsGenerating(true);
//     try {
//       const invoiceData = projectsData.map((project) => ({
//         employeeName: employee.fullName || "N/A",
//         projectName: project.projectName,
//         amount: `$${Number(project.amount).toLocaleString()}`,
//       }));

//       const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
//       const employeeNameSafe = employee.fullName
//         ? employee.fullName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
//         : "unknown";
//       const invoiceNumber = `INV-EMP-${employee.id.slice(
//         0,
//         8
//       )}-${timestamp.replace(/[^0-9]/g, "")}`;

//       if (outputFormat === "pdf") {
//         const htmlContent = `
//           <html>
//             <head>
//               <style>
//                 body { font-family: Arial, sans-serif; margin: 40px; color: #1F2937; }
//                 .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
//                 h2 { color: #1E3A8A; }
//                 table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//                 th, td { border: 1px solid #E5E7EB; padding: 8px; text-align: left; }
//                 th { background-color: #EFF6FF; color: #1E3A8A; }
//                 tr:nth-child(even) { background-color: #F9FAFB; }
//                 .total-row { font-weight: bold; background-color: #EFF6FF; }
//                 .footer { margin-top: 20px; text-align: center; color: #6B7280; font-size: 12px; }
//               </style>
//             </head>
//             <body>
//               <div class="invoice-details">
//                 <div>
//                   <h2>Employee Project Invoice</h2>
//                   <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
//                   <p><strong>Date:</strong> ${format(
//                     new Date(),
//                     "MMM dd, yyyy"
//                   )}</p>
//                   <p><strong>Business ID:</strong> ${employee.businessId}</p>
//                 </div>
//                 <div>
//                   <h2>Employee</h2>
//                   <p><strong>Name:</strong> ${employee.fullName || "N/A"}</p>
//                   <p><strong>Email:</strong> ${employee.email || "N/A"}</p>
//                   <p><strong>Phone:</strong> ${employee.phone || "N/A"}</p>
//                 </div>
//               </div>
//               <h2>Project Details</h2>
//               <table>
//                 <tr>
//                   <th>Employee Name</th>
//                   <th>Project Name</th>
//                   <th>Amount</th>
//                 </tr>
//                 ${invoiceData
//                   .map(
//                     (data) => `
//                   <tr>
//                     <td>${data.employeeName}</td>
//                     <td>${data.projectName}</td>
//                     <td>${data.amount}</td>
//                   </tr>
//                 `
//                   )
//                   .join("")}
//                 <tr class="total-row">
//                   <td colspan="2">Total Amount</td>
//                   <td>$${Number(totalAmount).toLocaleString()}</td>
//                 </tr>
//               </table>
//               <div class="footer">
//                 <p>Generated on ${format(
//                   new Date(),
//                   "MMM dd, yyyy HH:mm:ss"
//                 )}</p>
//                 <p>Thank you for your service!</p>
//               </div>
//             </body>
//           </html>
//         `;

//         const { uri } = await Print.printToFileAsync({
//           html: htmlContent,
//           base64: false,
//         });

//         const fileName = `project_invoice_${employeeNameSafe}_${timestamp}.pdf`;
//         const fileUri = `${FileSystem.documentDirectory}${fileName}`;

//         await FileSystem.moveAsync({
//           from: uri,
//           to: fileUri,
//         });

//         if (await Sharing.isAvailableAsync()) {
//           await Sharing.shareAsync(fileUri);
//         } else {
//           Alert.alert("Success", `PDF saved to ${fileUri}`);
//         }
//       } else if (outputFormat === "excel") {
//         const excelData = invoiceData.map((data) => ({
//           "Invoice Number": invoiceNumber,
//           "Business ID": employee.businessId,
//           "Employee Name": data.employeeName,
//           "Project Name": data.projectName,
//           Amount: data.amount,
//         }));

//         excelData.push({
//           "Invoice Number": "",
//           "Business ID": "",
//           "Employee Name": "",
//           "Project Name": "Total Amount",
//           Amount: `$${Number(totalAmount).toLocaleString()}`,
//         });

//         const ws = XLSX.utils.json_to_sheet(excelData);
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, "Project Invoice");

//         const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
//         const fileName = `project_invoice_${employeeNameSafe}_${timestamp}.xlsx`;
//         const fileUri = `${FileSystem.documentDirectory}${fileName}`;

//         await FileSystem.writeAsStringAsync(fileUri, wbout, {
//           encoding: FileSystem.EncodingType.Base64,
//         });

//         if (await Sharing.isAvailableAsync()) {
//           await Sharing.shareAsync(fileUri);
//         } else {
//           Alert.alert("Success", `Excel saved to ${fileUri}`);
//         }
//       }
//     } catch (error) {
//       console.error(`Error generating ${outputFormat}:`, error);
//       Alert.alert(
//         "Error",
//         `Failed to generate ${outputFormat}: ${error.message}`
//       );
//     } finally {
//       setIsGenerating(false);
//       setShowInvoiceModal(false);
//     }
//   };

//   const getInitials = (name) => {
//     if (!name) return "?";
//     return name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .toUpperCase()
//       .slice(0, 2);
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
//             Employee Details
//           </Text>
//           <TouchableOpacity
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
//             onPress={() => navigation.navigate("EditEmployee", { employee })}
//           >
//             <FontAwesome5 name="pencil-alt" size={wp(5)} color="#fff" />
//           </TouchableOpacity>
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
//         >
//           <View style={[{ alignItems: "center", marginBottom: hp(2) }]}>
//             <Avatar.Text
//               size={wp(20)}
//               label={getInitials(employee.fullName)}
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
//                 {employee.fullName}
//               </Text>
//               <Chip
//                 mode="outlined"
//                 style={[
//                   {
//                     height: hp(4),
//                     paddingHorizontal: wp(2),
//                     borderRadius: wp(2),
//                     backgroundColor:
//                       employee.status === "active"
//                         ? colorScheme === "dark"
//                           ? "#2DD4BF20"
//                           : "#E6FFFA"
//                         : colorScheme === "dark"
//                         ? "#F8717120"
//                         : "#FEE2E2",
//                     borderColor:
//                       employee.status === "active" ? "#38B2AC" : "#F87171",
//                   },
//                 ]}
//                 textStyle={[
//                   {
//                     fontSize: wp(3.5),
//                     fontWeight: "600",
//                     color: employee.status === "active" ? "#38B2AC" : "#F87171",
//                   },
//                 ]}
//               >
//                 {employee.status.charAt(0).toUpperCase() +
//                   employee.status.slice(1)}
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
//                         {employee.email}
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
//                         {employee.phone}
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
//                         name="map-marker-alt"
//                         size={wp(4)}
//                         color={theme.colors.primary}
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
//                         Address
//                       </Text>
//                       <Text
//                         style={[{ fontSize: wp(4), color: theme.colors.text }]}
//                       >
//                         {employee.address || "N/A"}
//                       </Text>
//                     </View>
//                   </View>
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
//                     Professional Details
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
//                         name="tools"
//                         size={wp(4)}
//                         color={theme.colors.primary}
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
//                         Skills
//                       </Text>
//                       <Text
//                         style={[{ fontSize: wp(4), color: theme.colors.text }]}
//                       >
//                         {employee.skills}
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
//                         name="briefcase"
//                         size={wp(4)}
//                         color={theme.colors.primary}
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
//                         Experience
//                       </Text>
//                       <Text
//                         style={[{ fontSize: wp(4), color: theme.colors.text }]}
//                       >
//                         {employee.experience} years experience
//                       </Text>
//                     </View>
//                   </View>
//                   <View
//                     style={[
//                       {
//                         flexDirection: "row",
//                         alignItems: "center",
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
//                         name="dollar-sign"
//                         size={wp(4)}
//                         color={theme.colors.primary}
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
//                         Project Invoice
//                       </Text>
//                       <Button
//                         mode="contained"
//                         onPress={() => setShowInvoiceModal(true)}
//                         style={[
//                           {
//                             borderRadius: wp(3),
//                             height: hp(5.5),
//                             justifyContent: "center",
//                             backgroundColor: theme.colors.accent,
//                           },
//                         ]}
//                         labelStyle={[
//                           {
//                             fontSize: wp(4.5),
//                             fontWeight: "600",
//                             color: theme.colors.text,
//                           },
//                         ]}
//                         icon="file-document"
//                         theme={theme}
//                         disabled={projectsData.length === 0}
//                       >
//                         Generate Invoice
//                       </Button>
//                     </View>
//                   </View>
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
//                         name="calendar"
//                         size={wp(4)}
//                         color={theme.colors.primary}
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
//                         Joined
//                       </Text>
//                       <Text
//                         style={[{ fontSize: wp(4), color: theme.colors.text }]}
//                       >
//                         {employee.createdAt?.toDate().toLocaleDateString() ||
//                           "N/A"}
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
//                   ></View>
//                 </View>
//               </Card.Content>
//             </LinearGradient>
//           </Card>

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
//             <Menu
//               visible={menuVisible}
//               onDismiss={() => setMenuVisible(false)}
//               anchor={
//                 <Button
//                   mode="contained"
//                   onPress={() => setMenuVisible(true)}
//                   style={[
//                     {
//                       flex: 1,
//                       borderRadius: wp(3),
//                       height: hp(5.5),
//                       elevation: 3,
//                       borderWidth: 1.5,
//                       justifyContent: "center",
//                       backgroundColor: theme.colors.primary,
//                     },
//                   ]}
//                   labelStyle={[{ fontSize: wp(4.5), fontWeight: "600" }]}
//                   icon="account-switch"
//                   theme={theme}
//                 >
//                   Set Status
//                 </Button>
//               }
//             >
//               <Menu.Item
//                 onPress={() => handleStatusChange("active")}
//                 title="Active"
//                 leadingIcon="check-circle"
//                 disabled={employee.status === "active"}
//                 titleStyle={{ color: theme.colors.text }}
//               />
//               <Menu.Item
//                 onPress={() => handleStatusChange("inactive")}
//                 title="Inactive"
//                 leadingIcon="close-circle"
//                 disabled={employee.status === "inactive"}
//                 titleStyle={{ color: theme.colors.text }}
//               />
//             </Menu>
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
//               Delete
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
//             Delete Employee
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
//             Are you sure you want to permanently delete {employee.fullName}?
//             This action cannot be undone.
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

//         <Modal
//           visible={showInvoiceModal}
//           onDismiss={() => setShowInvoiceModal(false)}
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
//                 color: theme.colors.primary,
//               },
//             ]}
//           >
//             Generate Project Invoice
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
//             Select the format for the project invoice for {employee.fullName}.
//           </Text>
//           <View
//             style={[
//               { flexDirection: "row", justifyContent: "flex-end", gap: wp(2) },
//             ]}
//           >
//             <Button
//               mode="contained"
//               onPress={() => generateInvoice("pdf")}
//               loading={isGenerating}
//               disabled={isGenerating}
//               style={[
//                 { minWidth: wp(20), backgroundColor: theme.colors.primary },
//               ]}
//               theme={theme}
//             >
//               PDF
//             </Button>
//             <Button
//               mode="contained"
//               onPress={() => generateInvoice("excel")}
//               loading={isGenerating}
//               disabled={isGenerating}
//               style={[
//                 { minWidth: wp(20), backgroundColor: theme.colors.accent },
//               ]}
//               theme={theme}
//             >
//               Excel
//             </Button>
//             <Button
//               mode="outlined"
//               onPress={() => setShowInvoiceModal(false)}
//               style={[{ minWidth: wp(20) }]}
//               theme={theme}
//             >
//               Cancel
//             </Button>
//           </View>
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
//   employeeName: {
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
//   statusButton: {
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
//   modalHeader: {
//     paddingVertical: hp(2),
//     paddingHorizontal: wp(4),
//     borderTopLeftRadius: wp(4),
//     borderTopRightRadius: wp(4),
//     margin: -wp(5),
//     marginBottom: wp(5),
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
