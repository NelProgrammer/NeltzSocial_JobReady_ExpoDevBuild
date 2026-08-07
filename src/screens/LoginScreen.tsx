// @ts-nocheck
import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert, BackHandler, Modal } from 'react-native';
import { Text, Button, Surface, TextInput, useTheme, Divider, IconButton, Avatar, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

type Profile = {
  id: string;
  name: string;
  isLocal?: boolean;
  socialLinks?: { google?: boolean };
  lastLogin?: number;
};

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { 
    user, 
    profiles, 
    login, 
    createProfile, 
    deleteProfile, 
    quickStart, 
    backendUrl, 
    updateBackendUrl, 
    testBackendConnection, 
    connectProfileToServer 
  } = useContext(AuthContext) as any;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [newName, setNewName] = useState<string>('');
  const lastBackPress = useRef<number>(0);

  // Server Settings Modal State
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(backendUrl || '');
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    if (backendUrl) {
      setServerUrlInput(backendUrl);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (user) {
      if (navigation.canGoBack?.()) {
        navigation.goBack();
      } else {
        navigation.navigate('Hub' as never);
      }
    }
  }, [user, navigation]);

  useEffect(() => {
    const backAction = () => {
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        Alert.alert('Exit App', 'Are you sure you want to close JobReady?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
      } else {
        lastBackPress.current = now;
      }
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, []);

  const showExitConfirmation = () => {
    Alert.alert('Exit App', 'Are you sure you want to close JobReady?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
    ]);
  };

  const handleCreateProfile = async () => {
    if (newName.trim()) {
      await createProfile(newName.trim());
      setNewName('');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testBackendConnection(serverUrlInput);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSaveServerUrl = async () => {
    await updateBackendUrl(serverUrlInput);
    setIsServerModalOpen(false);
    Alert.alert("Server Configured", `Backend server URL set to:\n${serverUrlInput}`);
  };

  const handleSyncProfile = async (profileId: string) => {
    setSyncingId(profileId);
    const res = await connectProfileToServer(profileId);
    setSyncingId(null);
    if (res.success) {
      Alert.alert("Profile Connected", res.message);
    } else {
      Alert.alert("Sync Failed", `${res.message}\n\nPlease check your Server Settings.`);
    }
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Top Bar: Exit App (Left) & Server Config (Right) */}
          <View style={styles.topHeaderRow}>
            <TouchableOpacity style={styles.exitBtnTopLeft} onPress={showExitConfirmation}>
              <MaterialCommunityIcons name="power" size={16} color="#fff" />
              <Text style={styles.exitBtnTopLeftText}>Exit App</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serverSettingsBtn} onPress={() => setIsServerModalOpen(true)}>
              <MaterialCommunityIcons name="server-network" size={16} color="#38bdf8" />
              <Text style={styles.serverSettingsBtnText}>Server Config</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text variant="headlineMedium" style={styles.title}>JobReady</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>By NeltzSocial</Text>
          </View>

          <Surface style={styles.surface} elevation={0}>
            <Text variant="titleLarge" style={styles.surfaceTitle}>Welcome</Text>

            {/* 1. SOCIAL PROVIDERS */}
            <View style={styles.socialGrid}>
              <Button 
                mode="contained" 
                icon="google" 
                onPress={() => createProfile('Google User', { provider: 'google' })} 
                style={[styles.socialBtn, { backgroundColor: '#4285F4' }]} 
                labelStyle={{ color: '#fff' }}
              >
                Google
              </Button>
              <Button 
                mode="contained" 
                icon="linkedin" 
                onPress={() => createProfile('LinkedIn User', { provider: 'linkedin' })} 
                style={[styles.socialBtn, { backgroundColor: '#0077B5' }]} 
                labelStyle={{ color: '#fff' }}
              >
                LinkedIn
              </Button>
            </View>
            <View style={[styles.socialGrid, { marginTop: 12 }]}>
              <Button 
                mode="contained" 
                icon="facebook" 
                onPress={() => createProfile('Facebook User', { provider: 'facebook' })} 
                style={[styles.socialBtn, { backgroundColor: '#1877F2' }]} 
                labelStyle={{ color: '#fff' }}
              >
                Facebook
              </Button>
              <Button 
                mode="contained" 
                icon="twitter" 
                onPress={() => createProfile('Twitter User', { provider: 'twitter' })} 
                style={[styles.socialBtn, { backgroundColor: '#000' }]} 
                labelStyle={{ color: '#fff' }}
              >
                Twitter
              </Button>
            </View>

            <View style={styles.dividerContainer}>
              <Divider style={styles.divider} />
              <Text style={styles.dividerText}>OR SELECT PROFILE</Text>
              <Divider style={styles.divider} />
            </View>

            {/* 2. PROFILE LIST */}
            <View style={styles.profileList}>
              {[...profiles].sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0)).slice(0, 5).map((p: Profile) => {
                const isServerProfile = !p.isLocal;
                return (
                  <View key={p.id} style={styles.profileItem}>
                    <TouchableOpacity style={styles.profileInfo} onPress={() => login(p.id)}>
                      <Avatar.Icon 
                        size={36} 
                        icon={isServerProfile ? "cloud-check" : "account"} 
                        style={{ backgroundColor: isServerProfile ? "#0288d1" : "#6366f1" }} 
                      />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.profileName}>{p.name}</Text>
                          {isServerProfile ? (
                            <View style={styles.serverBadge}>
                              <MaterialCommunityIcons name="cloud" size={12} color="#38bdf8" />
                              <Text style={styles.serverBadgeText}>Server Profile</Text>
                            </View>
                          ) : (
                            <View style={styles.localBadge}>
                              <MaterialCommunityIcons name="laptop" size={12} color="#94a3b8" />
                              <Text style={styles.localBadgeText}>Local Profile</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.profileSub}>
                          {p.email ? p.email : (isServerProfile ? 'Verified Container Account' : 'Offline Device Storage')}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Sync to Server action for local profiles */}
                    {!isServerProfile && (
                      <IconButton 
                        icon="cloud-upload" 
                        iconColor="#38bdf8" 
                        size={20} 
                        loading={syncingId === p.id}
                        onPress={() => handleSyncProfile(p.id)} 
                        title="Connect to Server"
                      />
                    )}

                    <IconButton icon="trash-can-outline" iconColor="rgba(255,0,0,0.5)" size={20} onPress={() => deleteProfile(p.id)} />
                  </View>
                );
              })}
            </View>

            <View style={styles.dividerContainer}>
              <Divider style={styles.divider} />
              <Text style={styles.dividerText}>NEW USER?</Text>
              <Divider style={styles.divider} />
            </View>

            {/* 3. CREATE PROFILE */}
            <View style={styles.createContainer}>
              <TextInput
                placeholder="Enter Name..."
                value={newName}
                onChangeText={setNewName}
                mode="outlined"
                style={styles.input}
                textColor="#fff"
                placeholderTextColor="rgba(255,255,255,0.4)"
                dense
              />
              <Button mode="contained" onPress={handleCreateProfile} style={styles.createBtn} buttonColor="#6366f1">
                Create
              </Button>
            </View>

            <Button mode="text" onPress={quickStart} style={{ marginTop: 16 }} labelStyle={{ color: 'rgba(255,255,255,0.4)' }}>
              Quick Start (Offline)
            </Button>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Backend Container Server Settings Modal */}
      {isServerModalOpen && (
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalSurface} elevation={5}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="server-network" size={24} color="#0288d1" style={{ marginRight: 8 }} />
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#0f172a' }}>
                  Backend Server Config
                </Text>
              </View>
              <IconButton icon="close" size={20} onPress={() => setIsServerModalOpen(false)} />
            </View>

            <Text variant="bodySmall" style={styles.modalDesc}>
              Specify the API URL for your containerized or remote backend service (e.g. Docker container, LAN IP, or cloud host).
            </Text>

            <TextInput
              label="Backend Server API URL"
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              mode="outlined"
              style={{ marginBottom: 12, backgroundColor: '#fff' }}
              placeholder="http://192.168.1.100:8000"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {testResult && (
              <View style={[styles.testResultBox, testResult.success ? styles.testSuccess : styles.testError]}>
                <MaterialCommunityIcons 
                  name={testResult.success ? "check-circle" : "alert-circle"} 
                  size={18} 
                  color={testResult.success ? "#2e7d32" : "#c62828"} 
                />
                <Text style={[styles.testResultText, { color: testResult.success ? "#2e7d32" : "#c62828" }]}>
                  {testResult.message}
                </Text>
              </View>
            )}

            <View style={styles.modalActionRow}>
              <Button 
                mode="outlined" 
                onPress={handleTestConnection} 
                loading={isTesting}
                disabled={isTesting}
                style={{ flex: 1 }}
              >
                Test Connection
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSaveServerUrl}
                buttonColor="#0288d1"
                style={{ flex: 1 }}
              >
                Save & Connect
              </Button>
            </View>
          </Surface>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  exitBtnTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  exitBtnTopLeftText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serverSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  serverSettingsBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoContainer: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 80, height: 80 },
  title: { color: '#fff', fontWeight: 'bold', marginTop: 12 },
  subtitle: { color: 'rgba(255, 255, 255, 0.6)' },
  surface: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  surfaceTitle: { textAlign: 'center', marginBottom: 20, fontWeight: 'bold', color: '#fff' },
  socialGrid: { flexDirection: 'row', gap: 8 },
  socialBtn: { flex: 1, borderRadius: 12 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { marginHorizontal: 12, color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' },
  profileList: { gap: 12 },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 6,
    paddingLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  profileInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  profileName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  profileSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  serverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8
  },
  serverBadgeText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 3
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8
  },
  localBadgeText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 3
  },
  createContainer: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: 'transparent' },
  createBtn: { justifyContent: 'center', borderRadius: 12 },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000
  },
  modalSurface: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  modalDesc: {
    color: '#64748b',
    marginBottom: 16
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16
  },
  testSuccess: {
    backgroundColor: '#e8f5e9'
  },
  testError: {
    backgroundColor: '#ffebee'
  },
  testResultText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  }
});

export default LoginScreen;
