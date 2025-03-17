import { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Successfully registered
        console.log('User registered:', userCredential.user.email);
        navigation.navigate('Login'); // Redirect to Login after registration
      })
      .catch((error) => {
        setError(error.message); // Display error if registration fails
      });
  };

  return (
    <View className="flex-1 justify-center bg-white p-4">
      <Text className="mb-4 text-center text-2xl font-bold">Register</Text>
      {error ? <Text className="mb-4 text-red-500">{error}</Text> : null}
      <TextInput
        className="mb-4 rounded border p-2"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        className="mb-4 rounded border p-2"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Register" onPress={handleRegister} />
      <Text className="mt-4 text-center text-blue-500" onPress={() => navigation.navigate('Login')}>
        Already have an account? Login
      </Text>
    </View>
  );
}
