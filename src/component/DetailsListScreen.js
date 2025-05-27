// // screens/DetailsListScreen.js
// import React, { useState, useEffect } from "react";
// import {
//   View,
//   StyleSheet,
//   FlatList,
//   Alert,
//   Platform,
//   PermissionsAndroid,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import {
//   widthPercentageToDP as wp,
//   heightPercentageToDP as hp,
// } from "react-native-responsive-screen";
// import {
//   collection,
//   query,
//   where,
//   orderBy,
//   getDocs,
//   doc,
//   getDoc,
//   onSnapshot,
// } from "firebase/firestore";
// import { db } from "../config/firebase";
// import { useAuth } from "../context/AuthContext";
// import * as XLSX from "xlsx";
// import * as FileSystem from "expo-file-system";
// import * as Sharing from "expo-sharing";
// import { format } from "date-fns";
// import DetailsHeader from "../component/details/DetailsHeader";
// import DetailsFilters from "../component/details/DetailsFilters";
// import DetailsListItem from "../component/details/DetailsListItem";
// import EmptyState from "../component/details/EmptyState";
// import LoadingState from "../component/details/LoadingState";

// // Component to display detailed lists for projects, profits, income, or expenses
// const DetailsListScreen = ({ route, navigation }) => {
//   const { type } = route.params;
//   const { userProfile } = useAuth();
//   const [clients, setClients] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [exporting, setExporting] = useState(false);
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filteredData, setFilteredData] = useState([]);

//   // Theme colors
//   const theme = {
//     background: Platform.OS === "android" ? "#121212" : "#F5F5F5",
//     surface: Platform.OS === "android" ? "#1E1E1E" : "#FFFFFF",
//     text: Platform.OS === "android" ? "#E0E0E0" : "#212121",
//     placeholder: Platform.OS === "android" ? "#B0B0B0" : "#757575",
//     primary: Platform.OS === "android" ? "#BB86FC" : "#6200EE",
//     border: Platform.OS === "android" ? "#333333" : "#E5E7EB",
//     gradient:
//       Platform.OS === "android"
//         ? ["#1A1A1A", "#1A1A1A"]
//         : ["#0047CC", "#003087"],
//   };

//   // Get screen info
//   const getScreenInfo = () => {
//     switch (type) {
//       case "projects":
//         return {
//           title: "Project Details",
//           icon: "project-diagram",
//           color: "#4CAF50",
//         };
//       case "profits":
//         return {
//           title: "Profit Details",
//           icon: "chart-line",
//           color: "#2196F3",
//         };
//       case "income":
//         return {
//           title: "Income Details",
//           icon: "money-bill-wave",
//           color: "#4CAF50",
//         };
//       case "expenses":
//         return { title: "Expense Details", icon: "receipt", color: "#F44336" };
//       default:
//         return { title: "Details", icon: "list", color: "#666666" };
//     }
//   };

//   // Fetch data with real-time listeners
//   useEffect(() => {
//     if (!userProfile?.businessId) {
//       Alert.alert("Error", "No business ID found.");
//       navigation.goBack();
//       return;
//     }
//     setLoading(true);

//     const fetchData = async () => {
//       try {
//         // Fetch clients
//         const clientsQuery = query(
//           collection(db, "clients"),
//           where("businessId", "==", userProfile.businessId)
//         );
//         const clientsSnapshot = await getDocs(clientsQuery);
//         const clientsList = [];

//         // Set up real-time listener for projects
//         for (const clientDoc of clientsSnapshot.docs) {
//           const clientData = {
//             id: clientDoc.id,
//             ...clientDoc.data(),
//             projects: [],
//           };
//           const projectsQuery = query(
//             collection(db, `clients/${clientDoc.id}/projects`),
//             where("businessId", "==", userProfile.businessId),
//             orderBy("createdAt", "desc")
//           );
//           onSnapshot(projectsQuery, (projectsSnapshot) => {
//             const projects = projectsSnapshot.docs.map((doc) => ({
//               id: doc.id,
//               ...doc.data(),
//               clientId: clientDoc.id,
//               clientName: clientData.fullName || "N/A",
//             }));
//             clientData.projects = projects;
//             const updatedClients = clientsList.map((c) =>
//               c.id === clientDoc.id ? { ...c, projects } : c
//             );
//             if (!updatedClients.find((c) => c.id === clientDoc.id)) {
//               updatedClients.push(clientData);
//             }
//             setClients([...updatedClients]);
//           });
//           clientsList.push(clientData);
//         }

//         // Set up real-time listener for orders
//         const ordersQuery = query(
//           collection(db, "orders"),
//           where("businessId", "==", userProfile.businessId),
//           orderBy("createdAt", "desc")
//         );
//         onSnapshot(ordersQuery, async (ordersSnapshot) => {
//           const ordersList = [];
//           for (const orderDoc of ordersSnapshot.docs) {
//             const orderData = orderDoc.data();
//             let employeeName = "N/A";
//             if (orderData.employeeId) {
//               const employeeDoc = await getDoc(
//                 doc(db, "employees", orderData.employeeId)
//               );
//               if (employeeDoc.exists()) {
//                 employeeName = employeeDoc.data().fullName || "N/A";
//               }
//             }
//             ordersList.push({
//               id: orderDoc.id,
//               ...orderData,
//               employeeName,
//             });
//           }
//           setOrders(ordersList);
//           setLoading(false);
//         });
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         Alert.alert("Error", "Failed to fetch data. Please try again.");
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [userProfile?.businessId, navigation]);

//   // Prepare and filter data
//   useEffect(() => {
//     let items = [];
//     if (type === "projects" || type === "income") {
//       clients.forEach((client) => {
//         client.projects.forEach((project) => {
//           // Find the latest order for this project
//           const projectOrders = orders
//             .filter((o) => o.projectId === project.id)
//             .sort((a, b) => {
//               const aDate = a.createdAt?.toDate
//                 ? a.createdAt.toDate()
//                 : new Date(a.createdAt);
//               const bDate = b.createdAt?.toDate
//                 ? b.createdAt.toDate()
//                 : new Date(b.createdAt);
//               return bDate - aDate;
//             });
//           const latestOrder = projectOrders[0];
//           items.push({
//             ...project,
//             clientName: client.fullName || "N/A",
//             clientId: client.id,
//             status: latestOrder?.status || project.status || "in-progress",
//             amount: type === "income" ? Number(project.budget) || 0 : undefined,
//           });
//         });
//       });
//     } else if (type === "profits") {
//       clients.forEach((client) => {
//         client.projects.forEach((project) => {
//           const projectOrders = orders.filter(
//             (o) => o.projectId === project.id
//           );
//           const totalExpense = projectOrders.reduce(
//             (sum, o) => sum + (Number(o.amount) || 0),
//             0
//           );
//           const latestOrder = projectOrders.sort((a, b) => {
//             const aDate = a.createdAt?.toDate
//               ? a.createdAt.toDate()
//               : new Date(a.createdAt);
//             const bDate = b.createdAt?.toDate
//               ? b.createdAt.toDate()
//               : new Date(b.createdAt);
//             return bDate - aDate;
//           })[0];
//           items.push({
//             ...project,
//             clientName: client.fullName || "N/A",
//             clientId: client.id,
//             status: latestOrder?.status || project.status || "in-progress",
//             profit: (Number(project.budget) || 0) - totalExpense,
//             totalExpense,
//           });
//         });
//       });
//     } else if (type === "expenses") {
//       items = orders.map((order) => {
//         let project = null;
//         let client = null;
//         for (const c of clients) {
//           project = c.projects.find((p) => p.id === order.projectId);
//           if (project) {
//             client = c;
//             break;
//           }
//         }
//         return {
//           ...order,
//           projectName: project?.projectName || "N/A",
//           clientName: client?.fullName || "N/A",
//           amount: Number(order.amount) || 0,
//           employeeName: order.employeeName || "N/A",
//         };
//       });
//     }

//     if (startDate && endDate) {
//       items = items.filter((item) => {
//         const createdAt = item.createdAt?.toDate
//           ? item.createdAt.toDate()
//           : new Date(item.createdAt);
//         return createdAt >= startDate && createdAt <= endDate;
//       });
//     }

//     if (searchQuery) {
//       const q = searchQuery.toLowerCase();
//       items = items.filter((item) => {
//         return (
//           (item.projectName?.toLowerCase().includes(q) ?? false) ||
//           (item.clientName?.toLowerCase().includes(q) ?? false) ||
//           (item.title?.toLowerCase().includes(q) ?? false) ||
//           (item.description?.toLowerCase().includes(q) ?? false) ||
//           (item.employeeName?.toLowerCase().includes(q) ?? false)
//         );
//       });
//     }

//     items.sort((a, b) => {
//       const aDate = a.createdAt?.toDate
//         ? a.createdAt.toDate()
//         : new Date(a.createdAt);
//       const bDate = b.createdAt?.toDate
//         ? b.createdAt.toDate()
//         : new Date(b.createdAt);
//       return bDate - aDate;
//     });

//     setFilteredData(items);
//   }, [clients, orders, type, startDate, endDate, searchQuery]);

//   // Request storage permission
//   const requestStoragePermission = async () => {
//     if (Platform.OS === "android") {
//       try {
//         // Check if permission is already granted
//         const alreadyGranted = await PermissionsAndroid.check(
//           PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
//         );
//         console.log("WRITE_EXTERNAL_STORAGE already granted:", alreadyGranted);

//         if (alreadyGranted) {
//           return true;
//         }

//         const result = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
//           {
//             title: "Storage Permission",
//             message: "This app needs access to storage to export Excel files.",
//             buttonPositive: "OK",
//             buttonNegative: "Cancel",
//           }
//         );
//         console.log("Permission request result:", result);

//         if (result === PermissionsAndroid.RESULTS.GRANTED) {
//           return true;
//         } else {
//           console.warn("Permission denied by user or system:", result);
//           return false;
//         }
//       } catch (err) {
//         console.error("Error requesting permission:", err);
//         return false;
//       }
//     }
//     return true; // iOS or other platforms don't need this permission
//   };

//   // Export to Excel
//   const exportToExcel = async () => {
//     if (!filteredData.length) {
//       Alert.alert("Error", "No data to export.");
//       return;
//     }

//     // Skip permission request for Android 10+ as FileSystem.documentDirectory doesn't require it
//     let hasPermission = true;
//     if (Platform.OS === "android" && Platform.Version < 29) {
//       hasPermission = await requestStoragePermission();
//       console.log("Has permission:", hasPermission);
//     }

//     if (!hasPermission) {
//       Alert.alert(
//         "Permission Denied",
//         "Storage permission is required to export Excel files. Please enable it in your device settings."
//       );
//       return;
//     }

//     setExporting(true);
//     try {
//       let excelData = [];
//       if (type === "projects" || type === "income") {
//         excelData = filteredData.map((item) => ({
//           "Project Name": item.projectName || "N/A",
//           "Client Name": item.clientName || "N/A",
//           Budget: item.budget
//             ? `$${Number(item.budget).toLocaleString()}`
//             : "N/A",
//           Amount:
//             type === "income" && item.amount
//               ? `$${Number(item.amount).toLocaleString()}`
//               : "N/A",
//           Status: item.status
//             ? item.status.charAt(0).toUpperCase() +
//               item.status.slice(1).toLowerCase()
//             : "In-progress",
//           Deadline: item.deadline
//             ? format(
//                 item.deadline.toDate
//                   ? item.deadline.toDate()
//                   : new Date(item.deadline),
//                 "MM/dd/yyyy"
//               )
//             : "N/A",
//           "Created At": item.createdAt
//             ? format(
//                 item.createdAt.toDate
//                   ? item.createdAt.toDate()
//                   : new Date(item.createdAt),
//                 "MM/dd/yyyy"
//               )
//             : "N/A",
//           Description: item.description || "N/A",
//         }));
//       } else if (type === "expenses") {
//         excelData = filteredData.map((item) => ({
//           Title: item.title || "N/A",
//           Amount: item.amount
//             ? `$${Number(item.amount).toLocaleString()}`
//             : "N/A",
//           "Project Name": item.projectName || "N/A",
//           "Client Name": item.clientName || "N/A",
//           Employee: item.employeeName || "N/A",
//           "Created At": item.createdAt
//             ? format(
//                 item.createdAt.toDate
//                   ? item.createdAt.toDate()
//                   : new Date(item.createdAt),
//                 "MM/dd/yyyy"
//               )
//             : "N/A",
//           Description: item.description || "N/A",
//         }));
//       } else if (type === "profits") {
//         excelData = filteredData.map((item) => ({
//           "Project Name": item.projectName || "N/A",
//           "Client Name": item.clientName || "N/A",
//           Budget: item.budget
//             ? `$${Number(item.budget).toLocaleString()}`
//             : "N/A",
//           "Total Expense": item.totalExpense
//             ? `$${Number(item.totalExpense).toLocaleString()}`
//             : "$0",
//           Profit: item.profit
//             ? `$${Number(item.profit).toLocaleString()}`
//             : "$0",
//           Status: item.status
//             ? item.status.charAt(0).toUpperCase() +
//               item.status.slice(1).toLowerCase()
//             : "In-progress",
//           Deadline: item.deadline
//             ? format(
//                 item.deadline.toDate
//                   ? item.deadline.toDate()
//                   : new Date(item.deadline),
//                 "MM/dd/yyyy"
//               )
//             : "N/A",
//           "Created At": item.createdAt
//             ? format(
//                 item.createdAt.toDate
//                   ? item.createdAt.toDate()
//                   : new Date(item.createdAt),
//                 "MM/dd/yyyy"
//               )
//             : "N/A",
//           Description: item.description || "N/A",
//         }));
//       }

//       console.log("Generating Excel file...");
//       const ws = XLSX.utils.json_to_sheet(excelData);
//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(
//         wb,
//         ws,
//         type.charAt(0).toUpperCase() + type.slice(1)
//       );
//       const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

//       const fileName = `${type}_details_${format(
//         new Date(),
//         "yyyy-MM-dd"
//       )}.xlsx`;
//       const fileUri = `${FileSystem.documentDirectory}${fileName}`;
//       console.log("Writing to file:", fileUri);

//       await FileSystem.writeAsStringAsync(fileUri, wbout, {
//         encoding: FileSystem.EncodingType.Base64,
//       });

//       console.log(
//         "File written successfully. Checking sharing availability..."
//       );
//       if (await Sharing.isAvailableAsync()) {
//         console.log("Sharing file...");
//         await Sharing.shareAsync(fileUri);
//         console.log("File shared successfully.");
//       } else {
//         Alert.alert("Success", `File saved to ${fileUri}`);
//         console.log("Sharing not available. File saved to:", fileUri);
//       }
//     } catch (error) {
//       console.error("Error exporting to Excel:", error);
//       Alert.alert("Error", "Failed to export data to Excel. Please try again.");
//     } finally {
//       setExporting(false);
//       console.log("Export process completed.");
//     }
//   };

//   const screenInfo = getScreenInfo();

//   return (
//     <SafeAreaView
//       style={[styles.container, { backgroundColor: theme.background }]}
//     >
//       <DetailsHeader
//         screenInfo={screenInfo}
//         theme={theme}
//         navigation={navigation}
//       />
//       <View style={styles.content}>
//         <DetailsFilters
//           theme={theme}
//           searchQuery={searchQuery}
//           setSearchQuery={setSearchQuery}
//           startDate={startDate}
//           setStartDate={setStartDate}
//           endDate={endDate}
//           setEndDate={setEndDate}
//           exportToExcel={exportToExcel}
//           exporting={exporting}
//           loading={loading}
//           filteredData={filteredData}
//         />
//         {loading ? (
//           <LoadingState theme={theme} />
//         ) : filteredData.length === 0 ? (
//           <EmptyState
//             screenInfo={screenInfo}
//             theme={theme}
//             type={type}
//             searchQuery={searchQuery}
//             startDate={startDate}
//             endDate={endDate}
//           />
//         ) : (
//           <FlatList
//             data={filteredData}
//             renderItem={({ item }) => (
//               <DetailsListItem
//                 item={item}
//                 type={type}
//                 screenInfo={screenInfo}
//                 theme={theme}
//                 navigation={navigation}
//               />
//             )}
//             keyExtractor={(item) => item.id}
//             contentContainerStyle={styles.list}
//             ItemSeparatorComponent={() => <View style={{ height: hp(1) }} />}
//             showsVerticalScrollIndicator={false}
//           />
//         )}
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   content: {
//     flex: 1,
//     padding: wp(5),
//   },
//   list: {
//     paddingBottom: hp(2),
//   },
// });

// export default DetailsListScreen;
