import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height, width } = Dimensions.get('window');

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const logoAnimation = useSharedValue(0);
  const formAnimation = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const inputFocusAnimation = useSharedValue(0);

  // Add keyboard height animation
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    // Start animations when component mounts
    logoAnimation.value = withSequence(
      withTiming(1, { duration: 1200 }),
      withSpring(1.1),
      withSpring(1)
    );
    formAnimation.value = withDelay(600, withSpring(1, {
      damping: 15,
      stiffness: 100
    }));

    // Keyboard listeners
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardVisible(true);
        keyboardHeight.value = withSpring(event.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        keyboardHeight.value = withSpring(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      // Navigation will happen automatically through AuthContext
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Animated styles
  const logoStyle = useAnimatedStyle(() => {
    return {
      opacity: logoAnimation.value,
      transform: [
        { scale: logoAnimation.value },
        {
          translateY: interpolate(
            logoAnimation.value,
            [0, 1],
            [-50, 0],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const formStyle = useAnimatedStyle(() => {
    return {
      opacity: formAnimation.value,
      transform: [
        {
          translateY: interpolate(
            formAnimation.value,
            [0, 1],
            [height * 0.2, 0],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      transform: [
        {
          translateY: interpolate(
            keyboardHeight.value,
            [0, 300],
            [0, -height * 0.1],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <LinearGradient
      colors={['#1A1F2C', '#2A2F3F', '#1A1F2C']}
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView 
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -64 : 0}
      >
        <StatusBar barStyle="dark-content" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.container, containerStyle]}>
            <Animated.View style={[styles.logoContainer, logoStyle]}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../assets/icon.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>Edit Expense</Text>
              <Text style={styles.subtitle}>Manage your expenses with ease</Text>
            </Animated.View>

            <Animated.View style={[styles.form, formStyle]}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <AnimatedTextInput
                  style={[styles.input]}
                  placeholder="Email"
                  placeholderTextColor="#A0A0A0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  onFocus={() => (inputFocusAnimation.value = withSpring(1))}
                  onBlur={() => (inputFocusAnimation.value = withSpring(0))}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <AnimatedTextInput
                  style={[styles.input]}
                  placeholder="Password"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  onFocus={() => (inputFocusAnimation.value = withSpring(1))}
                  onBlur={() => (inputFocusAnimation.value = withSpring(0))}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#A0A0A0" 
                  />
                </TouchableOpacity>
              </View>

              <AnimatedTouchableOpacity
                style={[
                  styles.button,
                  loading && styles.buttonDisabled,
                  buttonStyle,
                ]}
                onPress={handleLogin}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                  </>
                )}
              </AnimatedTouchableOpacity>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
              >
                <Text style={styles.registerText}>
                  New to Edit Expense? <Text style={styles.registerTextBold}>Create Account</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: height * 0.08,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.1,
    marginBottom: 40,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logo: {
    width: 100,
    height: 100
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 20,
  },
  form: {
    padding: 24,
    
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    height: '100%',
  },
  passwordToggle: {
    padding: 8,
  },
  button: {
    backgroundColor: '#4A6FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    height: 56,
    shadowColor: '#4A6FFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#A6B7FF',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  registerButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    color: '#B0B0B0',
    fontSize: 15,
  },
  registerTextBold: {
    color: '#4A6FFF',
    fontWeight: '600',
  },
});

export default LoginScreen;
