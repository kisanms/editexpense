import React, { useState, useEffect } from "react";
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
} from "react-native";
import { TextInput, Button, Text, Surface } from "react-native-paper";
import { useAuth } from "../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, error } = useAuth();

  useEffect(() => {
    if (user) {
      // User is signed in, navigation will be handled by the navigation container
      setLoading(false);
    }
  }, [user]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (error) {
      Alert.alert("Error", error.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="default" backgroundColor="#0047CC" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0047CC" />
          <Text style={styles.loadingText}>Signing in...</Text>
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
            <Surface style={styles.surface}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../../assets/icon.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>
              </View>

              <View style={styles.formContainer}>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textColor="#000000"
                  outlineColor="#0047CC"
                  activeOutlineColor="#0047CC"
                  left={<TextInput.Icon icon="email" color="#0047CC" />}
                  theme={{
                    colors: {
                      primary: "#0047CC",
                      onSurfaceVariant: "#666666",
                      background: "#FFFFFF",
                    },
                  }}
                  disabled={loading}
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry
                  textColor="#000000"
                  outlineColor="#0047CC"
                  activeOutlineColor="#0047CC"
                  left={<TextInput.Icon icon="lock" color="#0047CC" />}
                  theme={{
                    colors: {
                      primary: "#0047CC",
                      onSurfaceVariant: "#666666",
                      background: "#FFFFFF",
                    },
                  }}
                  disabled={loading}
                />

                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  style={styles.loginButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Sign In
                </Button>

                <Button
                  mode="text"
                  onPress={() => navigation.navigate("Register")}
                  style={styles.registerButton}
                  labelStyle={styles.registerButtonLabel}
                  disabled={loading}
                >
                  Don't have an account? Sign Up
                </Button>
              </View>
            </Surface>
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
  },
  formContainer: {
    width: "100%",
  },
  input: {
    marginBottom: hp(2),
    backgroundColor: "#FFFFFF",
    fontSize: hp(2),
    height: hp(8),
  },
  loginButton: {
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
    color: "white",
  },
  registerButton: {
    marginTop: hp(2),
  },
  registerButtonLabel: {
    color: "#0047CC",
  },
});

export default LoginScreen;
