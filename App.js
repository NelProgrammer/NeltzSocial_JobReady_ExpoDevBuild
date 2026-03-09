import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { ResumeProvider } from './src/context/ResumeContext';
import HubScreen from './src/screens/HubScreen';
import HomeScreen from './src/screens/HomeScreen';
import EditorScreen from './src/screens/EditorScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import PDFWorkbenchScreen from './src/screens/PDFWorkbenchScreen';
import { StatusBar } from 'expo-status-bar';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ResumeProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Hub">
            <Stack.Screen
              name="Hub"
              component={HubScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResumeHome"
              component={HomeScreen}
              options={{ title: 'NeltzSocial - Resume Builder' }}
            />
            <Stack.Screen
              name="Editor"
              component={EditorScreen}
              options={{ title: 'NeltzSocial - Resume Editor' }}
            />
            <Stack.Screen
              name="Preview"
              component={PreviewScreen}
              options={{ title: 'NeltzSocial - PDF Preview' }}
            />
            <Stack.Screen
              name="PDFWorkbench"
              component={PDFWorkbenchScreen}
              options={{ title: 'NeltzSocial - PDF Workbench' }}
            />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </PaperProvider>
    </ResumeProvider>
  );
}
