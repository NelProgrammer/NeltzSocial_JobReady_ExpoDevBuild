import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ResumeProvider } from './src/context/ResumeContext';
import HubScreen from './src/screens/HubScreen';
import EditorScreen from './src/screens/EditorScreen';
import FieldsSelectionScreen from './src/screens/FieldsSelectionScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import PDFWorkbenchScreen from './src/screens/PDFWorkbenchScreen';
import LoginScreen from './src/screens/LoginScreen';
import PublishReviewScreen from './src/screens/PublishReviewScreen';
import TaxiScreen from './src/screens/TaxiScreen';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { ThemeProvider, useThemeContext } from './src/context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

function NavigationStack() {
  const { user, loading } = useContext(AuthContext);
  const { theme } = useThemeContext();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bgDark }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      initialRouteName="Hub"
      screenOptions={{
        headerStyle: { backgroundColor: theme.bgSurface },
        headerTintColor: theme.textPrimary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Hub"
        component={HubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Editor"
        component={EditorScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FieldsSelection"
        component={FieldsSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Preview"
        component={PreviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PDFWorkbench"
        component={PDFWorkbenchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PublishReview"
        component={PublishReviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Taxi"
        component={TaxiScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ResumeProvider>
            <PaperProvider>
              <NavigationContainer>
                <NavigationStack />
                <StatusBar style="light" />
              </NavigationContainer>
            </PaperProvider>
          </ResumeProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
