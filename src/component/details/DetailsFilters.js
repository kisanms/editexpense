// import React from "react";
// import { View, StyleSheet } from "react-native";
// import { Searchbar, Button } from "react-native-paper";
// import { DatePickerInput } from "react-native-paper-dates";
// import {
//   widthPercentageToDP as wp,
//   heightPercentageToDP as hp,
// } from "react-native-responsive-screen";

// const DetailsFilters = ({
//   theme,
//   searchQuery,
//   setSearchQuery,
//   startDate,
//   setStartDate,
//   endDate,
//   setEndDate,
//   exportToExcel,
//   exporting,
//   loading,
//   filteredData,
// }) => (
//   <View style={styles.filterContainer}>
//     <Searchbar
//       placeholder="Search..."
//       onChangeText={setSearchQuery}
//       value={searchQuery}
//       style={[styles.searchBar, { backgroundColor: theme.surface }]}
//       iconColor={theme.primary}
//       inputStyle={{ color: theme.text }}
//       placeholderTextColor={theme.placeholder}
//     />
//     <View style={styles.dateFilterContainer}>
//       <DatePickerInput
//         locale="en"
//         label="Start Date"
//         value={startDate}
//         onChange={setStartDate}
//         inputMode="start"
//         style={[styles.datePicker, { backgroundColor: theme.surface }]}
//       />
//       <DatePickerInput
//         locale="en"
//         label="End Date"
//         value={endDate}
//         onChange={setEndDate}
//         inputMode="end"
//         style={[styles.datePicker, { backgroundColor: theme.surface }]}
//       />
//     </View>
//     <Button
//       mode="contained"
//       onPress={exportToExcel}
//       loading={exporting}
//       disabled={exporting || loading || !filteredData.length}
//       style={styles.exportButton}
//       icon="file-excel"
//       buttonColor={theme.primary}
//       textColor="#fff"
//     >
//       Export to Excel
//     </Button>
//   </View>
// );

// const styles = StyleSheet.create({
//   filterContainer: {
//     marginBottom: hp(2),
//   },
//   searchBar: {
//     marginBottom: hp(1),
//     elevation: 0,
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   dateFilterContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   datePicker: {
//     flex: 1,
//     marginHorizontal: wp(1),
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   exportButton: {
//     marginTop: hp(1),
//     marginBottom: hp(2),
//     borderRadius: wp(2),
//   },
// });

// export default DetailsFilters;
