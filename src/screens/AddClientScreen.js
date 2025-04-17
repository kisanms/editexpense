import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  TextInput,
  Text,
  Button,
  Chip,
  HelperText,
  Portal,
  Modal,
  List,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const budgetRanges = [
  "< $50,000",
  "$50,000 - $100,000",
  "$100,000 - $250,000",
  "$250,000 - $500,000",
  "$500,000 - $1M",
  "> $1M",
];

const commonTags = [
  "Residential",
  "Commercial",
  "Investment",
  "Urgent",
  "VIP",
  "First-time Buyer",
  "Cash Buyer",
  "Mortgage Required",
];

const paymentTerms = [
  "Full Payment",
  "50% Advance",
  "Monthly Installments",
  "Quarterly Payments",
  "Custom Terms",
];

export default function AddClientScreen({ navigation }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    budgetRange: "",
    requirements: "",
    tags: [],
    paymentTerms: "",
    projectDeadline: new Date(),
  });

  const [errors, setErrors] = useState({});
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newTag, setNewTag] = useState("");

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.phone) newErrors.phone = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // TODO: Implement client creation logic
      console.log("Form data:", formData);
      navigation.goBack();
    }
  };

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#0047CC", "#0047CC"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Client</Text>
          <View style={{ width: 20 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.formContainer}>
          <TextInput
            label="Full Name *"
            value={formData.fullName}
            onChangeText={(text) =>
              setFormData({ ...formData, fullName: text })
            }
            mode="outlined"
            style={styles.input}
            error={!!errors.fullName}
          />
          <HelperText type="error" visible={!!errors.fullName}>
            {errors.fullName}
          </HelperText>

          <TextInput
            label="Email *"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            error={!!errors.email}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>

          <TextInput
            label="Phone *"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            error={!!errors.phone}
          />
          <HelperText type="error" visible={!!errors.phone}>
            {errors.phone}
          </HelperText>

          <TextInput
            label="Address"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity onPress={() => setShowBudgetModal(true)}>
            <TextInput
              label="Budget Range"
              value={formData.budgetRange}
              mode="outlined"
              style={styles.input}
              editable={false}
              right={<TextInput.Icon icon="chevron-down" />}
            />
          </TouchableOpacity>

          <TextInput
            label="Specific Requirements"
            value={formData.requirements}
            onChangeText={(text) =>
              setFormData({ ...formData, requirements: text })
            }
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.labelText}>Tags</Text>
          <View style={styles.tagsContainer}>
            {formData.tags.map((tag, index) => (
              <Chip
                key={index}
                onClose={() => removeTag(tag)}
                style={styles.chip}
                textStyle={styles.chipText}
              >
                {tag}
              </Chip>
            ))}
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={() => setShowTagsModal(true)}
            >
              <FontAwesome5 name="plus" size={16} color="#0047CC" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setShowTermsModal(true)}>
            <TextInput
              label="Payment Terms"
              value={formData.paymentTerms}
              mode="outlined"
              style={styles.input}
              editable={false}
              right={<TextInput.Icon icon="chevron-down" />}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <TextInput
              label="Project Deadline"
              value={formData.projectDeadline.toLocaleDateString()}
              mode="outlined"
              style={styles.input}
              editable={false}
              right={<TextInput.Icon icon="calendar" />}
            />
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            contentStyle={styles.buttonContent}
          >
            Add Client
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Budget Range Modal */}
      <Portal>
        <Modal
          visible={showBudgetModal}
          onDismiss={() => setShowBudgetModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Select Budget Range</Text>
          {budgetRanges.map((budget, index) => (
            <React.Fragment key={budget}>
              <List.Item
                title={budget}
                onPress={() => {
                  setFormData({ ...formData, budgetRange: budget });
                  setShowBudgetModal(false);
                }}
              />
              {index < budgetRanges.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Modal>
      </Portal>

      {/* Tags Modal */}
      <Portal>
        <Modal
          visible={showTagsModal}
          onDismiss={() => setShowTagsModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Select Tags</Text>
          <TextInput
            label="Add Custom Tag"
            value={newTag}
            onChangeText={setNewTag}
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon
                icon="plus"
                onPress={() => {
                  addTag(newTag);
                  setNewTag("");
                }}
              />
            }
          />
          <View style={styles.commonTagsContainer}>
            {commonTags.map((tag) => (
              <Chip
                key={tag}
                onPress={() => addTag(tag)}
                style={styles.commonTag}
                textStyle={styles.chipText}
              >
                {tag}
              </Chip>
            ))}
          </View>
          <Button mode="contained" onPress={() => setShowTagsModal(false)}>
            Done
          </Button>
        </Modal>
      </Portal>

      {/* Payment Terms Modal */}
      <Portal>
        <Modal
          visible={showTermsModal}
          onDismiss={() => setShowTermsModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Select Payment Terms</Text>
          {paymentTerms.map((terms, index) => (
            <React.Fragment key={terms}>
              <List.Item
                title={terms}
                onPress={() => {
                  setFormData({ ...formData, paymentTerms: terms });
                  setShowTermsModal(false);
                }}
              />
              {index < paymentTerms.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Modal>
      </Portal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.projectDeadline}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setFormData({ ...formData, projectDeadline: selectedDate });
            }
          }}
          minimumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: wp(5),
    borderBottomLeftRadius: wp(8),
    borderBottomRightRadius: wp(8),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: wp(5),
    fontWeight: "bold",
    color: "#fff",
  },
  keyboardAvoid: {
    flex: 1,
  },
  formContainer: {
    padding: wp(5),
  },
  input: {
    marginBottom: hp(1),
    backgroundColor: "#fff",
  },
  labelText: {
    fontSize: wp(4),
    color: "#666",
    marginVertical: hp(1),
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: hp(2),
  },
  chip: {
    margin: 4,
    backgroundColor: "#E3F2FD",
  },
  chipText: {
    color: "#0047CC",
  },
  addTagButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
  },
  submitButton: {
    marginVertical: hp(3),
    backgroundColor: "#0047CC",
    paddingVertical: hp(1),
  },
  buttonContent: {
    height: hp(6),
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: wp(5),
    margin: wp(5),
    borderRadius: wp(4),
  },
  modalTitle: {
    fontSize: wp(5),
    fontWeight: "bold",
    marginBottom: hp(2),
    color: "#0047CC",
  },
  commonTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: hp(2),
  },
  commonTag: {
    margin: 4,
    backgroundColor: "#E3F2FD",
  },
});
