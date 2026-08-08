// HubScreen.tsx – Landing Dashboard with Header Profile Badge & Upgrade Hierarchy
import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { Text, useTheme, Avatar, Surface, IconButton, Portal, Dialog, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { ResumeContext } from '../context/ResumeContext';
import { Storage } from '../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type Navigation = NavigationProp<any>;

const HubScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const authCtx = useContext(AuthContext) as any;
  const { user, logout, profiles, login, createProfile, changeProfilePassword } = authCtx;
  const { meta } = useContext(ResumeContext) as any;

  // Profile Upgrade & Account Settings Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<'VIEW' | 'CREATE_LOCAL' | 'UPGRADE_ONLINE' | 'LINK_SOCIAL' | 'CHANGE_PASSWORD' | 'RENAME'>('VIEW');
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [visibleCount, setVisibleCount] = useState(7);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(true);

  const currentScrollTop = useRef(0);
  const profileListRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const savedCount = await Storage.get(Storage.KEYS.PROFILE_LIST_VISIBLE_COUNT);
      if (savedCount) setVisibleCount(Number(savedCount));
      const savedSpeed = await Storage.get(Storage.KEYS.PROFILE_LIST_SCROLL_SPEED);
      if (savedSpeed) setScrollSpeed(Number(savedSpeed));
    };
    loadSettings();
  }, []);

  const updateVisibleCount = async (val: number) => {
    setVisibleCount(val);
    await Storage.set(Storage.KEYS.PROFILE_LIST_VISIBLE_COUNT, val);
  };

  const updateScrollSpeed = async (val: number) => {
    setScrollSpeed(val);
    await Storage.set(Storage.KEYS.PROFILE_LIST_SCROLL_SPEED, val);
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollTop = contentOffset.y;
    currentScrollTop.current = scrollTop;
    setCanScrollUp(scrollTop > 5);
    setCanScrollDown(scrollTop + layoutMeasurement.height < contentSize.height - 5);
  };

  const scrollUpByStep = () => {
    const targetY = Math.max(0, currentScrollTop.current - scrollSpeed * 46);
    profileListRef.current?.scrollTo({ y: targetY, animated: true });
  };

  const scrollDownByStep = () => {
    const targetY = currentScrollTop.current + scrollSpeed * 46;
    profileListRef.current?.scrollTo({ y: targetY, animated: true });
  };

  // Double‑tap back button to exit
  const lastBackPress = useRef(0);
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

  const getStageTag = () => {
    if (!user || user.isGuest) return { label: 'GUEST', color: '#f59e0b' };
    if (user.isLocal) return { label: 'LOCAL', color: '#10b981' };
    if (user.linkedSocials && user.linkedSocials.length > 0) return { label: 'SOCIAL', color: '#8b5cf6' };
    return { label: 'ONLINE', color: '#3b82f6' };
  };

  const getInitials = (name?: string) => {
    if (!name) return 'G';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleActionSubmit = async () => {
    try {
      if (mode === 'RENAME') {
        if (!inputName.trim()) {
          Alert.alert('Error', 'Please enter a valid display name');
          return;
        }
        await authCtx.renameProfile(user.id, inputName.trim());
        Alert.alert('Success', 'Profile name updated successfully!');
      } else if (mode === 'CREATE_LOCAL') {
        if (!inputName.trim()) {
          Alert.alert('Error', 'Please enter a profile name or email');
          return;
        }
        await createProfile(inputName.trim());
        Alert.alert('Success', 'Local Profile created successfully!');
      } else if (mode === 'UPGRADE_ONLINE') {
        if (!inputEmail.trim() || !inputPassword.trim()) {
          Alert.alert('Error', 'Please enter email and password');
          return;
        }
        await createProfile(inputEmail.trim());
        Alert.alert('Success', 'Upgraded to Online Remote Profile!');
      } else if (mode === 'CHANGE_PASSWORD') {
        if (!newPassword.trim()) {
          Alert.alert('Error', 'Please enter a new password');
          return;
        }
        await changeProfilePassword(user.id, newPassword.trim());
        Alert.alert('Success', 'Password updated successfully!');
      }
      setModalVisible(false);
      setMode('VIEW');
      setInputName('');
      setInputEmail('');
      setInputPassword('');
      setNewPassword('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Operation failed');
    }
  };

  const stageInfo = getStageTag();

  const AppCard = ({ title, description, icon, color, onPress }: { title: string; description: string; icon: string; color: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <Surface style={styles.appCard} elevation={2}>
        <LinearGradient colors={[color, `${color}99`]} style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon} size={32} color="#fff" />
        </LinearGradient>
        <View style={styles.cardText}>
          <Text variant="titleMedium" style={styles.cardTitle}>{title}</Text>
          <Text variant="bodySmall" style={styles.cardDesc} numberOfLines={2}>{description}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={[styles.header, { paddingTop: insets.top + 12 }] }>
          <TouchableOpacity style={styles.exitBtnTopLeft} onPress={showExitConfirmation}>
            <MaterialCommunityIcons name="power" size={16} color="#fff" />
            <Text style={styles.exitBtnTopLeftText}>Exit App</Text>
          </TouchableOpacity>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text variant="headlineMedium" style={styles.welcomeText}>Hello, {user?.name || 'Guest'}</Text>
              <Text variant="bodyLarge" style={styles.subtitleText}>{user?.email || (user?.isGuest ? 'Guest Sandbox Session' : `ID: ${user?.id}`)}</Text>
              <Text variant="bodySmall" style={styles.dashboardSubtitle}>Your career dashboard is ready.</Text>
            </View>

            {/* Interactive Header Profile Badge */}
            <TouchableOpacity style={styles.badgeContainer} onPress={() => { setMode('VIEW'); setModalVisible(true); }}>
              <View style={[styles.stagePill, { backgroundColor: stageInfo.color }]}>
                <Text style={styles.stagePillText}>{stageInfo.label}</Text>
              </View>
              {user?.avatar ? (
                <Avatar.Image size={42} source={{ uri: user.avatar }} />
              ) : (
                <Avatar.Text size={42} label={getInitials(user?.name)} style={styles.avatarFallback} />
              )}
            </TouchableOpacity>
          </View>

          {/* DOB 5-Login Countdown Warning Banner */}
          {user && user.passwordChangeCountdown !== undefined && user.passwordChangeCountdown >= 0 && (
            <Surface style={styles.warningBanner} elevation={3}>
              <MaterialCommunityIcons name="shield-alert" size={20} color="#f59e0b" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.warningTitle}>Default Password Warning</Text>
                <Text style={styles.warningDesc}>
                  Please change your default DOB password ({user.passwordChangeCountdown} logins remaining).
                </Text>
              </View>
              <TouchableOpacity style={styles.changePassBtn} onPress={() => { setMode('CHANGE_PASSWORD'); setModalVisible(true); }}>
                <Text style={styles.changePassBtnText}>Change</Text>
              </TouchableOpacity>
            </Surface>
          )}
        </LinearGradient>

        <View style={styles.menuContainer}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Success Suite</Text>
          <AppCard title="Resume Builder" description="Professional templates & South African context features." icon="file-document-edit" color="#6366f1" onPress={() => navigation.navigate('ResumeHome')} />
          <AppCard title="PDF Workbench" description="Merge documents, split pages, and reorder files." icon="file-pdf-box" color="#f59e0b" onPress={() => navigation.navigate('PDFWorkbench')} />
          <AppCard title="Review & Publish" description="Get feedback from experts and showcase your profile." icon="check-decagram" color="#10b981" onPress={() => navigation.navigate('PublishReview')} />
          <AppCard title="Taxi 2 Interview" description="Plan your commute and stay safe." icon="car-connected" color="#3b82f6" onPress={() => navigation.navigate('Taxi')} />
        </View>

        <View style={styles.footer}>
          <IconButton icon="dots-horizontal" />
          <Text style={styles.footerText}>More Tools Coming Soon</Text>
        </View>
      </ScrollView>

      {/* Profile Upgrade & Account Settings Popup Modal */}
      <Portal>
        <Dialog
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          style={{
            backgroundColor: '#1e293b',
            width: isExpanded ? '92%' : '70%',
            alignSelf: 'center',
            maxWidth: isExpanded ? 600 : 420,
            borderWidth: 1.5,
            borderColor: '#475569',
            borderRadius: 16,
          }}
        >
          {/* Header Bar with Title, Expand Button & Gear Settings Toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold', flex: 1 }} numberOfLines={1}>
              {mode === 'VIEW' ? `Profile: ${user?.name || 'Guest'}` 
               : mode === 'RENAME' ? 'Rename Display Name'
               : mode === 'CREATE_LOCAL' ? 'Create Permanent Local Profile' 
               : mode === 'UPGRADE_ONLINE' ? 'Upgrade to Online Remote Profile' 
               : mode === 'CHANGE_PASSWORD' ? 'Change Security Password'
               : 'Account Settings'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton
                icon={isExpanded ? 'arrow-collapse-all' : 'arrow-expand-all'}
                iconColor="#94a3b8"
                size={20}
                onPress={() => setIsExpanded(!isExpanded)}
              />
              {mode === 'VIEW' && (
                <IconButton
                  icon={showSettings ? 'cog' : 'cog-outline'}
                  iconColor={showSettings ? '#10b981' : '#94a3b8'}
                  size={20}
                  onPress={() => setShowSettings(!showSettings)}
                />
              )}
            </View>
          </View>

          <Dialog.Content style={{ paddingTop: 8 }}>
            {mode === 'VIEW' ? (
              <View>
                <Text style={{ color: '#cbd5e1', marginBottom: 6, fontSize: 12 }}>
                  Current Stage: <Text style={{ color: stageInfo.color, fontWeight: 'bold' }}>{stageInfo.label}</Text>
                </Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, marginBottom: 12 }}>
                  Profile ID: {user?.id || 'guest_session'}
                </Text>

                {/* Upgrade & Management Actions */}
                {user?.isGuest && (
                  <Button mode="contained" buttonColor="#10b981" style={{ marginBottom: 8 }} labelStyle={{ fontSize: 12 }} onPress={() => { setInputName(user?.name || ''); setMode('CREATE_LOCAL'); }}>
                    Upgrade to Permanent Local Profile
                  </Button>
                )}

                {user && !user.isGuest && (
                  <Button mode="contained" buttonColor="#6366f1" style={{ marginBottom: 8 }} labelStyle={{ fontSize: 12 }} onPress={() => { setInputName(user?.name || ''); setMode('RENAME'); }}>
                    Rename Display Name
                  </Button>
                )}

                {user && !user.isGuest && user.isLocal && (
                  <Button mode="contained" buttonColor="#3b82f6" style={{ marginBottom: 8 }} labelStyle={{ fontSize: 12 }} onPress={() => setMode('UPGRADE_ONLINE')}>
                    Upgrade to Online Remote Profile
                  </Button>
                )}

                {user && !user.isGuest && (
                  <Button mode="outlined" textColor="#cbd5e1" style={{ marginBottom: 8 }} labelStyle={{ fontSize: 12 }} onPress={() => setMode('CHANGE_PASSWORD')}>
                    Change Password
                  </Button>
                )}

                {/* Settings Panel: Collapsible Items to Display & Scroll Speed Settings */}
                {showSettings && (
                  <Surface style={{ padding: 10, borderRadius: 8, backgroundColor: '#0f172a', marginVertical: 8, borderWidth: 1, borderColor: '#334155', width: '100%', maxWidth: '100%', overflow: 'hidden' }} elevation={1}>
                    <Text style={{ color: '#10b981', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
                      ⚙️ Visible Rows (*7 = default):
                    </Text>
                    <View style={{ width: '100%', overflow: 'hidden', marginBottom: 10 }}>
                      <SegmentedButtons
                        value={String(visibleCount)}
                        onValueChange={(val) => updateVisibleCount(Number(val))}
                        density="high"
                        buttons={[
                          { label: '3', value: '3' },
                          { label: '5', value: '5' },
                          { label: '7*', value: '7' },
                          { label: '10', value: '10' },
                        ]}
                        style={{ width: '100%' }}
                      />
                    </View>

                    <Text style={{ color: '#10b981', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
                      ⚡ Scroll Speed (*2 = default):
                    </Text>
                    <View style={{ width: '100%', overflow: 'hidden' }}>
                      <SegmentedButtons
                        value={String(scrollSpeed)}
                        onValueChange={(val) => updateScrollSpeed(Number(val))}
                        density="high"
                        buttons={[
                          { label: '1', value: '1' },
                          { label: '2*', value: '2' },
                          { label: '3', value: '3' },
                          { label: '5', value: '5' },
                        ]}
                        style={{ width: '100%' }}
                      />
                    </View>
                  </Surface>
                )}

                {/* Profile Switcher Header */}
                <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 8, marginBottom: 4, fontSize: 12 }}>
                  Available Profiles ({profiles.length}):
                </Text>

                {/* Scroll Up Arrow Indicator with Tap Handler */}
                {canScrollUp && (
                  <TouchableOpacity onPress={scrollUpByStep} style={{ alignItems: 'center', marginVertical: -2, paddingVertical: 2 }}>
                    <MaterialCommunityIcons name="chevron-up" size={22} color="#10b981" />
                  </TouchableOpacity>
                )}

                {/* Profile Switcher List with Dynamic Height & Step Scroll Reference */}
                <ScrollView
                  ref={profileListRef}
                  style={{ maxHeight: Math.min(visibleCount * 46, 320), marginVertical: 4 }}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {profiles.map((p: any) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.profileRow, p.id === user?.id && styles.activeProfileRow]}
                      onPress={async () => {
                        await login(p.id);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={{ color: p.id === user?.id ? '#10b981' : '#fff', fontWeight: p.id === user?.id ? 'bold' : 'normal', fontSize: 12 }}>
                        {p.name} {p.id === user?.id ? '(Active)' : ''}
                      </Text>
                      <Text style={{ color: '#94a3b8', fontSize: 10 }}>
                        {p.isGuest ? 'GUEST' : p.isLocal ? 'LOCAL' : 'ONLINE'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Scroll Down Arrow Indicator with Tap Handler */}
                {canScrollDown && profiles.length > visibleCount && (
                  <TouchableOpacity onPress={scrollDownByStep} style={{ alignItems: 'center', marginVertical: -2, paddingVertical: 2 }}>
                    <MaterialCommunityIcons name="chevron-down" size={22} color="#10b981" />
                  </TouchableOpacity>
                )}
              </View>
            ) : mode === 'RENAME' ? (
              <View>
                <TextInput
                  label="New Display Name"
                  placeholder="Enter new display name"
                  value={inputName}
                  onChangeText={setInputName}
                  mode="outlined"
                  style={{ marginBottom: 10, backgroundColor: '#0f172a' }}
                  textColor="#fff"
                />
              </View>
            ) : mode === 'CREATE_LOCAL' ? (
              <View>
                <TextInput
                  label="Profile Name or Email"
                  placeholder="e.g. sipho.nkosi@example.com"
                  value={inputName}
                  onChangeText={setInputName}
                  mode="outlined"
                  style={{ marginBottom: 10, backgroundColor: '#0f172a' }}
                  textColor="#fff"
                />
                <TextInput
                  label="Password"
                  placeholder="Enter Password"
                  secureTextEntry
                  value={inputPassword}
                  onChangeText={setInputPassword}
                  mode="outlined"
                  style={{ marginBottom: 10, backgroundColor: '#0f172a' }}
                  textColor="#fff"
                />
              </View>
            ) : mode === 'UPGRADE_ONLINE' ? (
              <View>
                <TextInput
                  label="Email Address"
                  placeholder="e.g. sipho.nkosi@example.com"
                  value={inputEmail}
                  onChangeText={setInputEmail}
                  mode="outlined"
                  style={{ marginBottom: 10, backgroundColor: '#0f172a' }}
                  textColor="#fff"
                />
                <TextInput
                  label="Password"
                  placeholder="Enter Password"
                  secureTextEntry
                  value={inputPassword}
                  onChangeText={setInputPassword}
                  mode="outlined"
                  style={{ marginBottom: 10, backgroundColor: '#0f172a' }}
                  textColor="#fff"
                />
              </View>
            ) : mode === 'CHANGE_PASSWORD' ? (
              <View>
                <TextInput
                  label="Enter Date of Birth (YYYYMMDD)"
                  placeholder="YYYYMMDD (e.g. 19950815)"
                  value={inputPassword}
                  onChangeText={setInputPassword}
                  mode="outlined"
                  style={{ marginBottom: 10, backgroundColor: '#0f172a' }}
                  textColor="#fff"
                />
                <TextInput
                  label="New Secure Password"
                  placeholder="Enter new custom password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  mode="outlined"
                  style={{ marginBottom: 10, backgroundColor: '#0f172a' }}
                  textColor="#fff"
                />
              </View>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            {mode !== 'VIEW' && (
              <Button textColor="#cbd5e1" onPress={() => setMode('VIEW')}>
                Back
              </Button>
            )}
            {mode !== 'VIEW' ? (
              <Button mode="contained" onPress={handleActionSubmit}>
                Save & Apply
              </Button>
            ) : (
              <Button textColor="#cbd5e1" onPress={() => setModalVisible(false)}>
                Close
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: { paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingHorizontal: 20 },
  exitBtnTopLeft: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  exitBtnTopLeftText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  welcomeText: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
  subtitleText: { color: 'rgba(255,255,255,0.8)', marginTop: 2, fontSize: 13 },
  dashboardSubtitle: { color: 'rgba(255,255,255,0.6)', marginTop: 2, fontSize: 11 },
  headerLeft: { flex: 1 },
  badgeContainer: { alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  stagePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginBottom: 4 },
  stagePillText: { color: '#fff', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  avatarFallback: { backgroundColor: '#6366f1' },
  warningBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', padding: 10, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#f59e0b' },
  warningTitle: { color: '#f59e0b', fontSize: 11, fontWeight: 'bold' },
  warningDesc: { color: '#cbd5e1', fontSize: 10, marginTop: 2 },
  changePassBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  changePassBtnText: { color: '#0f172a', fontSize: 10, fontWeight: 'bold' },
  menuContainer: { marginTop: 20 },
  sectionTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 12, fontSize: 18 },
  cardContainer: { marginBottom: 12 },
  appCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: '#1e293b' },
  iconContainer: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardText: { flex: 1 },
  cardTitle: { color: '#fff', fontWeight: 'bold' },
  cardDesc: { color: '#94a3b8', marginTop: 2 },
  footer: { alignItems: 'center', marginVertical: 20 },
  footerText: { color: '#64748b', fontSize: 12 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 8, backgroundColor: '#0f172a', marginBottom: 6 },
  activeProfileRow: { borderWidth: 1, borderColor: '#10b981' }
});

export default HubScreen;
