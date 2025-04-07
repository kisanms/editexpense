import React, { useState } from 'react';
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
  StatusBar
} from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4c669f" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -hp(2)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <LinearGradient
            colors={['#4c669f', '#3b5998', '#192f6a']}
            style={styles.gradient}
          >
            <Surface style={styles.surface}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/icon.png')}
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
                  mode="outlined"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  left={<TextInput.Icon icon="email" />}
                  theme={{ colors: { primary: '#3b5998' } }}
                />
                
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  style={styles.input}
                  secureTextEntry
                  left={<TextInput.Icon icon="lock" />}
                  theme={{ colors: { primary: '#3b5998' } }}
                />
                
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={loading}
                  style={styles.loginButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Sign In
                </Button>
                
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Register')}
                  style={styles.registerButton}
                  labelStyle={styles.registerButtonLabel}
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
    backgroundColor: '#4c669f',
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    padding: wp(5),
  },
  surface: {
    padding: wp(5),
    borderRadius: wp(5),
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  logo: {
    width: wp(25),
    height: wp(25),
    marginBottom: hp(2),
  },
  title: {
    fontSize: wp(7),
    fontWeight: 'bold',
    color: '#3b5998',
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: wp(4),
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: hp(2),
    backgroundColor: 'transparent',
  },
  loginButton: {
    marginTop: hp(2),
    paddingVertical: hp(1),
    borderRadius: wp(2.5),
    backgroundColor: '#3b5998',
  },
  buttonContent: {
    height: hp(6),
  },
  buttonLabel: {
    fontSize: wp(4),
    fontWeight: 'bold',
  },
  registerButton: {
    marginTop: hp(2),
  },
  registerButtonLabel: {
    color: '#3b5998',
  },
});

export default LoginScreen; 