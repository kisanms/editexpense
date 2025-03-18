import AppNavigator from './navigation/AppNavigator';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <AppNavigator />
    </GestureHandlerRootView>
  );
}
