import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ResumeProvider } from './src/context/ResumeContext';
import HubScreen from './src/screens/HubScreen';
import HomeScreen from './src/screens/HomeScreen';
import EditorScreen from './src/screens/EditorScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import PDFWorkbenchScreen from './src/screens/PDFWorkbenchScreen';
import LoginScreen from './src/screens/LoginScreen';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

function NavigationStack() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      initialRouteName={user ? "Hub" : "Login"}
      screenOptions={{
        headerStyle: { backgroundColor: '#6200ee' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {!user ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Hub"
            component={HubScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ResumeHome"
            component={HomeScreen}
            options={{ title: 'NeltzSocial - JobReady: Resume Builder' }}
          />
          <Stack.Screen
            name="Editor"
            component={EditorScreen}
            options={{ title: 'NeltzSocial - JobReady: Resume Editor' }}
          />
          <Stack.Screen
            name="Preview"
            component={PreviewScreen}
            options={{ title: 'NeltzSocial - JobReady: Preview & Export' }}
          />
          <Stack.Screen
            name="PDFWorkbench"
            component={PDFWorkbenchScreen}
            options={{ title: 'NeltzSocial - JobReady: PDF Workbench' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ResumeProvider>
          <PaperProvider>
            <NavigationContainer>
              <NavigationStack />
              <StatusBar style="auto" />
            </NavigationContainer>
          </PaperProvider>
        </ResumeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
