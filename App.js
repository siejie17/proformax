import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, AuthContext } from './contexts/AuthContext';

import "./global.css";
import AppStack from './stacks/AppStack';
import AuthStack from './stacks/AuthStack';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { isLoggedIn, loading } = useContext(AuthContext);

  if (loading) {
    return null; // Or a splash/loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          <Stack.Screen name="Main" component={AppStack} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}