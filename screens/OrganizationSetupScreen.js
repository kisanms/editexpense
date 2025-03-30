import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LinearGradient } from 'expo-linear-gradient';
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

const { height } = Dimensions.get('window');
const AnimatedView = Animated.createAnimatedComponent(View);

const OrganizationSetupScreen = ({ navigation }) => {
  const { user, createOrganization } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  // Animation values
  const headerAnimation = useSharedValue(0);
  const formAnimation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Start animations when component mounts
    headerAnimation.value = withSequence(
      withTiming(1, { duration: 1000 }),
      withSpring(1.05),
      withSpring(1)
    );
    formAnimation.value = withDelay(400, withSpring(1, {
      damping: 15,
      stiffness: 100
    }));
  }, []);

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      Alert.alert('Error', 'Please enter an organization name');
      return;
    }

    try {
      setLoading(true);
      await createOrganization(orgName.trim(), user.email);
      navigation.replace('MainStack'); // Changed from 'MainApp' to 'MainStack'
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      // Update the user document to indicate they've seen the setup
      await setDoc(doc(db, 'users', user.uid), {
        hasSeenOrgSetup: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      navigation.replace('MainStack'); // Changed from 'MainApp' to 'MainStack'
    } catch (error) {
      console.error('Error skipping setup:', error);
      Alert.alert('Error', 'Failed to skip setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerAnimation.value,
    transform: [
      { scale: headerAnimation.value },
      {
        translateY: interpolate(
          headerAnimation.value,
          [0, 1],
          [-30, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formAnimation.value,
    transform: [
      {
        translateY: interpolate(
          formAnimation.value,
          [0, 1],
          [height * 0.1, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  return (
    <LinearGradient
      colors={['#1A1F2C', '#2A2F3F', '#1A1F2C']}
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <AnimatedView style={[styles.header, headerStyle]}>
              <View style={styles.iconContainer}>
                <Ionicons name="people" size={48} color="#4A6FFF" />
              </View>
              <Text style={styles.title}>Create Your Organization</Text>
              <Text style={styles.description}>
                Set up your organization to start managing expenses with your team. You can create an organization now or later from the Team tab.
              </Text>
            </AnimatedView>

            <AnimatedView style={[styles.formContainer, formStyle]}>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Organization Name"
                  placeholderTextColor="#A0A0A0"
                  value={orgName}
                  onChangeText={setOrgName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <Animated.View style={buttonStyle}>
                <TouchableOpacity
                  style={[styles.createButton, loading && styles.createButtonDisabled]}
                  onPress={handleCreateOrganization}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={loading}
                >
                  {loading ? (
                    <Text style={styles.createButtonText}>Creating...</Text>
                  ) : (
                    <>
                      <Text style={styles.createButtonText}>Create Organization</Text>
                      <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  Alert.alert(
                    'Skip Organization Setup',
                    'You can create an organization later from the Team tab. Some features will be limited until you create an organization.',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel'
                      },
                      {
                        text: 'Skip',
                        onPress: handleSkip
                      }
                    ]
                  );
                }}
                disabled={loading}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </AnimatedView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formContainer: {
   
    padding: 24,
    width: '100%',
    
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
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
  createButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#4A6FFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    backgroundColor: '#A6B7FF',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#B0B0B0',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrganizationSetupScreen; 