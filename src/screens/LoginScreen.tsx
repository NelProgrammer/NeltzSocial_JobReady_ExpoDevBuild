// @ts-nocheck
import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { Text, Button, Surface, TextInput, useTheme, Divider, IconButton, Avatar, SegmentedButtons } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

type Profile = {
  id: string;
  name: string;
  isLocal?: boolean;
  email?: string;
  socialLinks?: { google?: boolean };
  lastLogin?: number;
};

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { 
    user, 
    profiles, 
    isOnline,
    login, 
    createProfile, 
    deleteProfile, 
    quickStart, 
    backendUrl, 
    updateBackendUrl, 
    testBackendConnection, 
    toggleProfileServerOptIn,
    checkServerStatus
  } = useContext(AuthContext) as any;
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [newName, setNewName] = useState<string>('');
  const [creationMode, setCreationMode] = useState<'server' | 'local'>('server');
  const lastBackPress = useRef<number>(0);

  // Server Settings Modal State
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(backendUrl || '');
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
      await createProfile(newName.trim(), {}, creationMode === 'server');
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
    Alert.alert("Server Configured", `Backend server URL updated to:\n${serverUrlInput}`);
  };

  const handleToggleOptIn = async (profile: Profile) => {
    const currentIsLocal = profile.isLocal !== undefined ? profile.isLocal : true;
    const targetOptIn = currentIsLocal; // If currently local, targetOptIn = true (opt-in to server).

    setTogglingId(profile.id);
    const res = await toggleProfileServerOptIn(profile.id, targetOptIn);
    setTogglingId(null);

    if (res.success) {
      Alert.alert(targetOptIn ? "Opted In to Server" : "Switched to Local", res.message);
    } else {
      Alert.alert("Opt-In Failed", `${res.message}\n\nPlease verify your Server Config.`);
    }
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 20) }]}>
          
          {/* Top Bar: Exit App (Left) & Live Server Status + Server Config (Right) */}
          <View style={styles.topHeaderRow}>
            <TouchableOpacity style={styles.exitBtnTopLeft} onPress={showExitConfirmation}>
              <MaterialCommunityIcons name="power" size={16} color="#fff" />
              <Text style={styles.exitBtnTopLeftText}>Exit App</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Online / Offline Status Badge */}
              <TouchableOpacity 
                style={[styles.statusBadge, isOnline ? styles.statusOnline : styles.statusOffline]} 
                onPress={() => checkServerStatus()}
              >
                <MaterialCommunityIcons 
                  name={isOnline ? "circle" : "circle-outline"} 
                  size={10} 
                  color={isOnline ? "#4ade80" : "#f87171"} 
                />
                <Text style={[styles.statusBadgeText, { color: isOnline ? "#4ade80" : "#f87171" }]}>
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.serverSettingsBtn} onPress={() => setIsServerModalOpen(true)}>
                <MaterialCommunityIcons name="server-network" size={16} color="#38bdf8" />
                <Text style={styles.serverSettingsBtnText}>Server Config</Text>
              </TouchableOpacity>
            </View>
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
                onPress={() => createProfile('Google User', { provider: 'google' }, true)} 
                style={[styles.socialBtn, { backgroundColor: '#4285F4' }]} 
                labelStyle={{ color: '#fff' }}
              >
                Google
              </Button>
              <Button 
                mode="contained" 
                icon="linkedin" 
                onPress={() => createProfile('LinkedIn User', { provider: 'linkedin' }, true)} 
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
                onPress={() => createProfile('Facebook User', { provider: 'facebook' }, true)} 
                style={[styles.socialBtn, { backgroundColor: '#1877F2' }]} 
                labelStyle={{ color: '#fff' }}
              >
                Facebook
              </Button>
              <Button 
                mode="contained" 
                icon="twitter" 
                onPress={() => createProfile('Twitter User', { provider: 'twitter' }, true)} 
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

            {/* 2. PROFILE LIST WITH CLICKABLE OPT-IN BADGES */}
            <View style={styles.profileList}>
              {[...profiles].sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0)).slice(0, 5).map((p: Profile) => {
                const isServerProfile = !p.isLocal;
                const isLoadingThis = togglingId === p.id;

                return (
                  <View key={p.id} style={styles.profileItemRow}>
                    {/* Select / Login Profile Button */}
                    <TouchableOpacity style={styles.profileSelectArea} onPress={() => login(p.id)}>
                      <Avatar.Icon 
                        size={36} 
                        icon={isServerProfile ? "cloud-check" : "account"} 
                        style={{ backgroundColor: isServerProfile ? "#0288d1" : "#6366f1" }} 
                      />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.profileName}>{p.name}</Text>
                        <Text style={styles.profileSub}>
                          {p.email ? p.email : (isServerProfile ? 'Verified Container Account' : 'Offline Device Storage')}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* CLICKABLE OPT-IN / SERVER TOGGLE BADGE */}
                    <TouchableOpacity 
                      style={[
                        styles.optInPillBtn, 
                        isServerProfile ? styles.optInPillServer : styles.optInPillLocal
                      ]}
                      onPress={() => handleToggleOptIn(p)}
                      disabled={isLoadingThis}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons 
                        name={isServerProfile ? "cloud-check" : "cloud-upload"} 
                        size={14} 
                        color={isServerProfile ? "#38bdf8" : "#fbbf24"} 
                      />
                      <Text style={[styles.optInPillText, { color: isServerProfile ? "#38bdf8" : "#fbbf24" }]}>
                        {isLoadingThis ? "SYNCING..." : (isServerProfile ? "SERVER" : "OPT-IN SERVER")}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete Profile Button */}
                    <IconButton 
                      icon="trash-can-outline" 
                      iconColor="rgba(255,0,0,0.5)" 
                      size={20} 
                      onPress={() => deleteProfile(p.id)} 
                      style={{ margin: 0 }}
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.dividerContainer}>
              <Divider style={styles.divider} />
              <Text style={styles.dividerText}>NEW USER?</Text>
              <Divider style={styles.divider} />
            </View>

            {/* 3. CREATE PROFILE WITH EXPLICIT SERVER / LOCAL OPT-IN SELECTOR */}
            <View style={{ gap: 10 }}>
              <SegmentedButtons
                value={creationMode}
                onValueChange={(val: any) => setCreationMode(val)}
                buttons={[
                  {
                    value: 'server',
                    label: 'Server Profile',
                    icon: 'cloud',
                    style: creationMode === 'server' ? { backgroundColor: 'rgba(56, 189, 248, 0.2)' } : {}
                  },
                  {
                    value: 'local',
                    label: 'Local Profile',
                    icon: 'laptop',
                    style: creationMode === 'local' ? { backgroundColor: 'rgba(148, 163, 184, 0.2)' } : {}
                  },
                ]}
                density="small"
                style={{ marginBottom: 4 }}
              />

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
              Specify the API URL for your containerized backend service (e.g. Docker container, LAN IP, or cloud host).
            </Text>

            {/* Live Connection Status Badge in Modal */}
            <View style={[styles.statusBadgeModal, isOnline ? styles.statusOnline : styles.statusOffline]}>
              <MaterialCommunityIcons 
                name={isOnline ? "check-circle" : "alert-circle"} 
                size={16} 
                color={isOnline ? "#2e7d32" : "#c62828"} 
              />
              <Text style={{ fontSize: 12, fontWeight: 'bold', marginLeft: 6, color: isOnline ? "#2e7d32" : "#c62828" }}>
                {isOnline ? `Server Online (${backendUrl})` : `Server Offline / Unreachable`}
              </Text>
            </View>

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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusOnline: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  statusOffline: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
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
  logoContainer: { alignItems: 'center', marginBottom: 24 },
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
  profileList: { gap: 10 },
  profileItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 6,
    paddingLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  profileSelectArea: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 4 
  },
  profileName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  profileSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 1 },
  optInPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 4
  },
  optInPillServer: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  optInPillLocal: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  optInPillText: {
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.3
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
    marginBottom: 12
  },
  statusBadgeModal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12
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
