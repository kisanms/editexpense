import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Portal,
  Modal,
  Checkbox,
  Surface,
  Divider,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import * as Print from "expo-print";
import { format } from "date-fns";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../config/firebase";

const ProjectsSection = ({
  client,
  theme = {
    colors: {
      primary: "#1E3A8A",
      text: "#1F2937",
      surface: "#FFFFFF",
      accent: "#34D399",
      placeholder: "#6B7280",
      background: "#FFFFFF",
    },
  },
  businessId,
  navigation,
  colorScheme,
}) => {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDocs, setLastDocs] = useState([]); // Store lastDoc for each page
  const [hasMore, setHasMore] = useState(true);
  const projectsPerPage = 3;

  // Fetch all projects
  const fetchAllProjects = useCallback(async () => {
    try {
      if (!client?.id || !businessId) {
        Alert.alert("Error", "Invalid client or business ID.");
        return [];
      }

      const projectsQuery = query(
        collection(db, `clients/${client.id}/projects`),
        where("businessId", "==", businessId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(projectsQuery);
      const projectsData = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        serialNo: index + 1,
        ...doc.data(),
      }));

      return projectsData;
    } catch (error) {
      console.error("Error fetching all projects: ", error);
      Alert.alert("Error", "Failed to fetch all projects.");
      return [];
    }
  }, [client?.id, businessId]);

  // Fetch paginated projects
  const fetchProjects = useCallback(async () => {
    try {
      if (!client?.id || !businessId) {
        Alert.alert("Error", "Invalid client or business ID.");
        return;
      }

      // Determine the last document to start after based on the current page
      const lastDoc = currentPage > 1 ? lastDocs[currentPage - 2] : null;

      const projectsQuery = query(
        collection(db, `clients/${client.id}/projects`),
        where("businessId", "==", businessId),
        orderBy("createdAt", "desc"),
        limit(projectsPerPage),
        ...(lastDoc ? [startAfter(lastDoc)] : [])
      );

      const snapshot = await getDocs(projectsQuery);
      const projectsData = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        serialNo: (currentPage - 1) * projectsPerPage + index + 1,
        ...doc.data(),
      }));

      // Update projects state
      setProjects(projectsData);

      // Update lastDocs array
      if (snapshot.docs.length > 0) {
        const newLastDocs = [...lastDocs];
        newLastDocs[currentPage - 1] = snapshot.docs[snapshot.docs.length - 1];
        setLastDocs(newLastDocs);
      }

      // Calculate total pages based on allProjects length
      const totalPages = Math.ceil(allProjects.length / projectsPerPage);
      setHasMore(currentPage < totalPages);
    } catch (error) {
      console.error("Error fetching projects: ", error);
      Alert.alert("Error", "Failed to fetch projects.");
      setProjects([]);
    }
  }, [
    client?.id,
    businessId,
    currentPage,
    lastDocs,
    allProjects.length,
    projectsPerPage,
  ]);

  // Combined fetch function to avoid race conditions
  const fetchAllAndPaginatedProjects = useCallback(async () => {
    const allProjectsData = await fetchAllProjects();
    setAllProjects(allProjectsData);
    await fetchProjects();
  }, [fetchAllProjects, fetchProjects]);

  // Initial fetch and re-fetch when client or businessId changes
  useEffect(() => {
    fetchAllAndPaginatedProjects();
  }, [fetchAllAndPaginatedProjects]);

  // Re-fetch projects when currentPage changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, currentPage]);

  // Sync selectAll state with selectedProjects
  useEffect(() => {
    if (allProjects.length > 0) {
      setSelectAll(
        selectedProjects.length === allProjects.length &&
          allProjects.every((project) => selectedProjects.includes(project.id))
      );
    }
  }, [selectedProjects, allProjects]);

  // Listen for navigation focus to refresh projects after adding a new one
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setCurrentPage(1); // Reset to page 1 on focus
      setLastDocs([]); // Reset lastDocs
      fetchAllAndPaginatedProjects();
    });
    return unsubscribe;
  }, [navigation, fetchAllAndPaginatedProjects]);

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      // No need to reset lastDocs; we maintain them for accurate pagination
    }
  };

  const toggleProjectSelection = (projectId) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(allProjects.map((project) => project.id));
    }
    setSelectAll(!selectAll);
  };

  const handleAddProject = () => {
    navigation.navigate("AddProjectScreen", { clientId: client.id });
  };

  const generateInvoice = async (outputFormat) => {
    if (selectedProjects.length === 0) {
      Alert.alert("Error", "Please select at least one project.");
      return;
    }

    setIsGenerating(true);
    try {
      const selectedProjectData = allProjects.filter((p) =>
        selectedProjects.includes(p.id)
      );

      if (
        !selectedProjectData.every((p) => p.id && p.projectName && p.budget)
      ) {
        throw new Error("Invalid project data: Missing required fields");
      }

      const invoiceData = selectedProjectData.map((project) => ({
        projectName: project.projectName || "N/A",
        budget: project.budget
          ? `$${Number(project.budget).toLocaleString()}`
          : "N/A",
        deadline: project.deadline
          ? format(
              project.deadline.toDate
                ? project.deadline.toDate()
                : new Date(project.deadline),
              "MMM dd, yyyy"
            )
          : "N/A",
        requirements: project.requirements || "N/A",
        createdAt: project.createdAt
          ? format(
              project.createdAt.toDate
                ? project.createdAt.toDate()
                : new Date(project.createdAt),
              "MMM dd, yyyy"
            )
          : "N/A",
      }));

      const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
      const clientNameSafe = client.fullName
        ? client.fullName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
        : "unknown";
      const invoiceNumber = `INV-${client.id.slice(0, 8)}-${timestamp.replace(
        /[^0-9]/g,
        ""
      )}`;
      const totalBudget = selectedProjectData.reduce(
        (sum, p) => sum + (Number(p.budget) || 0),
        0
      );

      if (outputFormat === "pdf") {
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; color: #1F2937; }
                .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
                h2 { color: #1E3A8A; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #E5E7EB; padding: 8px; text-align: left; }
                th { background-color: #EFF6FF; color: #1E3A8A; }
                tr:nth-child(even) { background-color: #F9FAFB; }
                .total-row { font-weight: bold; background-color: #EFF6FF; }
                .footer { margin-top: 20px; text-align: center; color: #6B7280; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="invoice-details">
                <div>
                  <h2>Client Invoice</h2>
                  <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                  <p><strong>Date:</strong> ${format(
                    new Date(),
                    "MMM dd, yyyy"
                  )}</p>
                </div>
                <div>
                  <h2>Client</h2>
                  <p><strong>Name:</strong> ${client.fullName || "N/A"}</p>
                  <p><strong>Email:</strong> ${client.email || "N/A"}</p>
                  <p><strong>Phone:</strong> ${client.phone || "N/A"}</p>
                </div>
              </div>
              <h2>Project Details</h2>
              <table>
                <tr>
                  <th>Project Name</th>
                  <th>Budget</th>
                  <th>Deadline</th>
                  <th>Created</th>
                  <th>Requirements</th>
                </tr>
                ${invoiceData
                  .map(
                    (p) => `
                  <tr>
                    <td>${p.projectName}</td>
                    <td>${p.budget}</td>
                    <td>${p.deadline}</td>
                    <td>${p.createdAt}</td>
                    <td>${p.requirements}</td>
                  </tr>
                `
                  )
                  .join("")}
                <tr class="total-row">
                  <td colspan="4">Total</td>
                  <td>$${totalBudget.toLocaleString()}</td>
                </tr>
              </table>
              <div class="footer">
                <p>Generated on ${format(
                  new Date(),
                  "MMM dd, yyyy HH:mm:ss"
                )}</p>
                <p>Thank you for your business!</p>
              </div>
            </body>
          </html>
        `;

        console.log("Generating PDF with HTML length:", htmlContent.length);

        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        console.log("PDF generated at:", uri);

        const fileName = `invoice_${clientNameSafe}_${timestamp}.pdf`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        console.log("Moving PDF to:", fileUri);
        await FileSystem.moveAsync({
          from: uri,
          to: fileUri,
        });

        if (await Sharing.isAvailableAsync()) {
          console.log("Sharing PDF from:", fileUri);
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert("Success", `PDF saved to ${fileUri}`);
        }
      } else if (outputFormat === "excel") {
        const excelData = invoiceData.map((p) => ({
          "Invoice Number": invoiceNumber,
          "Client Name": client.fullName || "N/A",
          "Client Email": client.email || "N/A",
          "Project Name": p.projectName,
          Budget: p.budget,
          Deadline: p.deadline,
          "Created At": p.createdAt,
          Requirements: p.requirements,
        }));

        console.log("Excel data:", excelData);

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Invoice");

        const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
        console.log("Excel base64 length:", wbout.length);

        const fileName = `invoice_${clientNameSafe}_${timestamp}.xlsx`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        console.log("Writing Excel to:", fileUri);
        await FileSystem.writeAsStringAsync(fileUri, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          console.log("Sharing Excel from:", fileUri);
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert("Success", `Excel saved to ${fileUri}`);
        }
      }
    } catch (error) {
      console.error(`Error generating ${outputFormat}:`, error);
      Alert.alert(
        "Error",
        `Failed to generate ${outputFormat}: ${error.message}`
      );
    } finally {
      setIsGenerating(false);
      setShowInvoiceModal(false);
      setSelectedProjects([]);
      setSelectAll(false);
    }
  };

  const renderProject = ({ item }) => {
    if (!item.id || !item.clientId || !client.id) {
      console.error("Invalid project or client ID:", {
        projectId: item.id || "missing",
        clientId: item.clientId || "missing",
      });
      Alert.alert(
        "Error",
        "Failed to load project data. Please refresh and try again."
      );
      return null;
    }
    return (
      <TouchableWithoutFeedback
        onPress={() =>
          navigation.navigate("ProjectDetailsScreen", {
            project: { ...item, clientId: client.id },
          })
        }
      >
        <Card
          style={[
            {
              flex: 1,
              marginVertical: hp(0.5),
              marginHorizontal: wp(2),
              borderRadius: wp(2),
              backgroundColor: theme.colors.background,
              borderWidth: 1,
              borderColor: colorScheme === "dark" ? "#333333" : "#E5E7EB",
            },
          ]}
        >
          <LinearGradient
            colors={
              colorScheme === "dark"
                ? ["#2A2A2A", "#2A2A2A80"]
                : ["#FFFFFF", "#FFFFFF"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[{ flex: 1, borderRadius: wp(2), padding: 1 }]}
          >
            <View
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  paddingHorizontal: wp(2),
                },
              ]}
            >
              <Text
                style={[
                  {
                    fontSize: wp(3.5),
                    fontWeight: "600",
                    marginRight: wp(2),
                    color: theme.colors.text,
                  },
                ]}
              >
                {item.serialNo || "N/A"}.
              </Text>
              <Text
                style={[
                  {
                    fontSize: wp(3.5),
                    fontWeight: "500",
                    flex: 1,
                    color: theme.colors.text,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.projectName || "Unnamed Project"}
              </Text>
            </View>
          </LinearGradient>
        </Card>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <>
      <Card
        style={[
          {
            flex: 1,
            marginBottom: hp(2),
            marginVertical: hp(1),
            borderRadius: wp(4),
          },
        ]}
      >
        <LinearGradient
          colors={
            colorScheme === "dark"
              ? ["#333333", "#333333"]
              : ["#FFFFFF", "#FFFFFF"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ borderRadius: wp(4), padding: wp(2) }]}
        >
          <View style={[{ flex: 1, marginBottom: hp(2) }]}>
            <Text
              style={[
                {
                  fontSize: wp(4),
                  fontWeight: "600",
                  borderLeftWidth: 4,
                  paddingLeft: wp(2),
                  color: theme.colors.primary || "#1E3A8A",
                  marginBottom: hp(1),
                },
              ]}
            >
              Projects Section
            </Text>
            {projects.length === 0 && allProjects.length > 0 ? (
              <View style={[{ alignItems: "center", paddingVertical: hp(5) }]}>
                <Text
                  style={[
                    {
                      fontSize: wp(4),
                      textAlign: "center",
                      marginTop: hp(1),
                      color: theme.colors.text,
                    },
                  ]}
                >
                  Loading projects...
                </Text>
              </View>
            ) : projects.length === 0 ? (
              <View style={[{ alignItems: "center", paddingVertical: hp(5) }]}>
                <FontAwesome5
                  name="project-diagram"
                  size={wp(8)}
                  color={theme.colors.placeholder || "#6B7280"}
                />
                <Text
                  style={[
                    {
                      fontSize: wp(4),
                      textAlign: "center",
                      marginTop: hp(1),
                      color: theme.colors.text,
                    },
                  ]}
                >
                  No projects found
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={projects}
                  renderItem={renderProject}
                  keyExtractor={(item) => item.id}
                  ItemSeparatorComponent={() => (
                    <View style={[{ height: hp(0.5) }]} />
                  )}
                  scrollEnabled={false}
                />
                <View
                  style={[
                    {
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: hp(1),
                    },
                  ]}
                >
                  <Button
                    mode="outlined"
                    onPress={handlePrevPage}
                    disabled={currentPage === 1}
                    style={[{ minWidth: wp(20) }]}
                    theme={theme}
                  >
                    Previous
                  </Button>
                  <Text style={[{ fontSize: wp(4), color: theme.colors.text }]}>
                    Page {currentPage}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={handleNextPage}
                    disabled={!hasMore}
                    style={[{ minWidth: wp(20) }]}
                    theme={theme}
                  >
                    Next
                  </Button>
                </View>
              </>
            )}
            <View
              style={[{ flexDirection: "row", gap: wp(2), marginTop: hp(1) }]}
            >
              <Button
                mode="contained"
                onPress={() => setShowInvoiceModal(true)}
                style={[
                  {
                    flex: 1,
                    height: hp(5),
                    paddingHorizontal: wp(1),
                    borderRadius: wp(2),
                    backgroundColor: theme.colors.accent || "#34D399",
                  },
                ]}
                labelStyle={[{ fontSize: hp(2), fontWeight: "600" }]}
                icon="file-download"
                theme={theme}
              >
                Invoice
              </Button>
              <Button
                mode="contained"
                onPress={handleAddProject}
                style={[
                  {
                    flex: 1,
                    height: hp(5),
                    paddingHorizontal: wp(1),
                    borderRadius: wp(2),
                    backgroundColor: theme.colors.primary || "#1E3A8A",
                  },
                ]}
                labelStyle={[{ fontSize: hp(2), fontWeight: "600" }]}
                theme={theme}
              >
                Add Project
              </Button>
            </View>
          </View>
        </LinearGradient>
      </Card>

      <Portal>
        <Modal
          visible={showInvoiceModal}
          onDismiss={() => setShowInvoiceModal(false)}
          contentContainerStyle={[
            {
              padding: wp(5),
              marginHorizontal: wp(5),
              borderRadius: wp(4),
              width: wp(90),
              maxHeight: hp(80),
              alignSelf: "center",
              elevation: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              backgroundColor: theme.colors.surface || "#FFFFFF",
            },
          ]}
        >
          <Surface
            style={[
              {
                padding: wp(3),
                borderTopLeftRadius: wp(4),
                borderTopRightRadius: wp(4),
                backgroundColor: theme.colors.primary || "#1E3A8A",
              },
            ]}
          >
            <Text
              style={[
                {
                  fontSize: wp(5.5),
                  fontWeight: "700",
                  color: "#FFFFFF",
                  textAlign: "center",
                },
              ]}
            >
              Generate Invoice
            </Text>
          </Surface>
          <View style={[{ padding: wp(4) }]}>
            <Text
              style={[
                {
                  fontSize: wp(4),
                  fontWeight: "500",
                  marginBottom: hp(1),
                  color: theme.colors.text,
                },
              ]}
            >
              Select projects to include in the invoice
            </Text>
            {allProjects.length > 0 && (
              <TouchableOpacity
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: hp(0.5),
                    marginBottom: hp(1),
                  },
                ]}
                onPress={handleSelectAll}
              >
                <Checkbox
                  status={selectAll ? "checked" : "unchecked"}
                  color={theme.colors.primary || "#1E3A8A"}
                />
                <Text
                  style={[
                    {
                      fontSize: wp(4),
                      fontWeight: "500",
                      color: theme.colors.text,
                    },
                  ]}
                >
                  Select All
                </Text>
              </TouchableOpacity>
            )}
            {allProjects.length === 0 ? (
              <Text
                style={[
                  {
                    fontSize: wp(4),
                    marginBottom: hp(3),
                    lineHeight: wp(5.5),
                    textAlign: "center",
                    color: theme.colors.text,
                  },
                ]}
              >
                No projects available.
              </Text>
            ) : (
              <FlatList
                data={allProjects}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: hp(1.5),
                        paddingHorizontal: wp(2),
                        borderRadius: wp(2),
                        backgroundColor: theme.colors.background || "#EFF6FF",
                        marginBottom: hp(1),
                      },
                    ]}
                    onPress={() => toggleProjectSelection(item.id)}
                  >
                    <Checkbox
                      status={
                        selectedProjects.includes(item.id)
                          ? "checked"
                          : "unchecked"
                      }
                      color={theme.colors.primary || "#1E3A8A"}
                    />
                    <Text
                      style={[
                        {
                          fontSize: wp(4),
                          fontWeight: "500",
                          flex: 1,
                          color: theme.colors.text,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.projectName || "Unnamed Project"}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                style={[{ maxHeight: hp(50) }]}
              />
            )}
          </View>
          <Divider
            style={[
              {
                marginVertical: hp(2),
                backgroundColor: theme.colors.placeholder || "#6B7280",
              },
            ]}
          />
          <View
            style={[
              {
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: wp(2),
                paddingHorizontal: wp(4),
              },
            ]}
          >
            <Button
              mode="contained"
              onPress={() => generateInvoice("pdf")}
              loading={isGenerating}
              disabled={isGenerating || selectedProjects.length === 0}
              style={[{ flex: 1, minWidth: wp(20), borderRadius: wp(2) }]}
              theme={theme}
            >
              PDF
            </Button>
            <Button
              mode="contained"
              onPress={() => generateInvoice("excel")}
              loading={isGenerating}
              disabled={isGenerating || selectedProjects.length === 0}
              style={[{ flex: 1, minWidth: wp(20), borderRadius: wp(2) }]}
              theme={theme}
            >
              Excel
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowInvoiceModal(false)}
              style={[{ flex: 1, minWidth: wp(30), borderRadius: wp(2) }]}
              theme={theme}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: hp(2),
    borderRadius: wp(4),
  },
  cardGradient: {
    borderRadius: wp(4),
    padding: wp(1),
  },
  section: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: "600",
    borderLeftWidth: 3,
    paddingLeft: wp(2),
  },
  projectButtons: {
    flexDirection: "row",
    gap: wp(2),
  },
  projectButtonLabel: {
    fontSize: wp(3),
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: hp(5),
  },
  noProjectsText: {
    fontSize: wp(4),
    textAlign: "center",
    marginTop: hp(1),
  },
  projectCard: {
    marginVertical: hp(0.5),
    borderRadius: wp(2),
  },
  projectCardGradient: {
    borderRadius: wp(2),
    padding: wp(0.5),
  },
  projectCardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
  },
  projectSerial: {
    fontSize: wp(3.5),
    fontWeight: "600",
    marginRight: wp(2),
  },
  projectName: {
    fontSize: wp(3.5),
    fontWeight: "500",
    flex: 1,
  },
  projectSeparator: {
    height: hp(0.5),
  },
  modal: {
    padding: wp(5),
    marginHorizontal: wp(5),
    borderRadius: wp(4),
    width: wp(90),
    maxHeight: hp(80),
    alignSelf: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    padding: wp(3),
    borderTopLeftRadius: wp(4),
    borderTopRightRadius: wp(4),
  },
  modalHeaderText: {
    fontSize: wp(5.5),
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  modalContent: {
    padding: wp(4),
  },
  modalSubtitle: {
    fontSize: wp(4),
    fontWeight: "500",
    marginBottom: hp(2),
  },
  modalText: {
    fontSize: wp(4),
    marginBottom: hp(3),
    lineHeight: wp(5.5),
    textAlign: "center",
  },
  modalDivider: {
    marginVertical: hp(2),
  },
  modalButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: wp(2),
    paddingHorizontal: wp(4),
  },
  modalButton: {
    flex: 1,
    minWidth: wp(20),
    borderRadius: wp(2),
  },
  projectSelectList: {
    maxHeight: hp(50),
  },
  projectSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2),
    borderRadius: wp(2),
    marginBottom: hp(1),
  },
  projectSelectText: {
    fontSize: wp(4),
    fontWeight: "500",
    flex: 1,
  },
});

export default ProjectsSection;
