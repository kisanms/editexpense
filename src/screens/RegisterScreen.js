import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { TextInput, Button, Text, Surface } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await register(email, password, username);
    } catch (error) {
      Alert.alert("Registration Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0047CC" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Creating account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0047CC" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -hp(2)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <LinearGradient
            colors={["#0047CC", "#0047CC"]}
            style={styles.gradient}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
            >
              <Surface style={styles.surface}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require("../../assets/icon.png")}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                  <Text style={styles.title}>Create Account</Text>
                  <Text style={styles.subtitle}>Set up your business</Text>
                </View>

                <View style={styles.formContainer}>
                  <TextInput
                    label="Username"
                    value={username}
                    onChangeText={setUsername}
                    mode="outlined"
                    style={styles.input}
                    autoCapitalize="words"
                    left={<TextInput.Icon icon="account" />}
                    theme={{ colors: { primary: "#0047CC" } }}
                    disabled={loading}
                  />
                  <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    left={<TextInput.Icon icon="email" />}
                    theme={{ colors: { primary: "#0047CC" } }}
                    disabled={loading}
                  />
                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry
                    left={<TextInput.Icon icon="lock" />}
                    theme={{ colors: { primary: "#0047CC" } }}
                    disabled={loading}
                  />
                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry
                    left={<TextInput.Icon icon="lock-check" />}
                    theme={{ colors: { primary: "#0047CC" } }}
                    disabled={loading}
                  />
                  <Button
                    mode="contained"
                    onPress={handleRegister}
                    loading={loading}
                    disabled={loading}
                    style={styles.signUpButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                  >
                    Create Account & Business
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate("Login")}
                    style={styles.signInButton}
                    labelStyle={styles.signInButtonLabel}
                    disabled={loading}
                  >
                    Already have an account? Sign In
                  </Button>
                </View>
              </Surface>
            </ScrollView>
          </LinearGradient>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0047CC",
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0047CC",
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: wp(4),
    color: "#fff",
    fontWeight: "600",
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: wp(5),
  },
  surface: {
    padding: wp(5),
    borderRadius: wp(5),
    elevation: 4,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: hp(4),
  },
  logo: {
    width: wp(25),
    height: wp(25),
    marginBottom: hp(2),
  },
  title: {
    fontSize: wp(7),
    fontWeight: "bold",
    color: "#0047CC",
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: wp(4),
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  input: {
    marginBottom: hp(2),
    backgroundColor: "transparent",
  },
  signUpButton: {
    marginTop: hp(2),
    paddingVertical: hp(1),
    borderRadius: wp(2.5),
    backgroundColor: "#0047CC",
  },
  buttonContent: {
    height: hp(6),
  },
  buttonLabel: {
    fontSize: wp(4),
    fontWeight: "bold",
  },
  signInButton: {
    marginTop: hp(2),
  },
  signInButtonLabel: {
    color: "#0047CC",
  },
});

export default RegisterScreen;
