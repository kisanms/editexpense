import { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log('User logged in:', userCredential.user.email);
        navigation.navigate('Home');
      })
      .catch((error) => {
        setError(error.message); // Display Firebase error
      });
  };

  return (
    <View className="flex-1 justify-center bg-white p-4">
      <Text className="mb-4 text-center text-2xl font-bold">Login</Text>
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
      <Button title="Login" onPress={handleLogin} />
      <Text
        className="mt-4 text-center text-blue-500"
        onPress={() => navigation.navigate('Register')}>
        Don't have an account? Register
      </Text>
    </View>
  );
}
