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
import { useNetInfo } from '@react-native-community/netinfo';
import { useThemeContext } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

type Navigation = NavigationProp<any>;

const HubScreen: React.FC<any> = ({ route }: any) => {
  const navigation = useNavigation<Navigation>();
  const theme = useTheme();
  const { theme: activeTheme, themeId, setThemeId, themes } = useThemeContext();
  const insets = useSafeAreaInsets();
  const netInfo = useNetInfo();
  const isConnected = netInfo.isConnected ?? true;
  const authCtx = useContext(AuthContext) as any;
  const { user, logout, deleteProfile, profiles, login, createProfile, changeProfilePassword } = authCtx;
  const { meta } = useContext(ResumeContext) as any;

  // Profile Upgrade & Account Settings Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<'VIEW' | 'CREATE_LOCAL' | 'UPGRADE_ONLINE' | 'LINK_SOCIAL' | 'CHANGE_PASSWORD' | 'RENAME' | 'SETTINGS'>('VIEW');
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
  const [upcomingCollapsed, setUpcomingCollapsed] = useState<boolean>(true);
  const [previewItem, setPreviewItem] = useState<{ title: string; subtitle: string; icon: string; color: string; gistParagraphs: string[] } | null>(null);

  const currentScrollTop = useRef(0);
  const profileListRef = useRef<ScrollView>(null);

  // Settings & Storage Sync
  useEffect(() => {
    const loadSettings = async () => {
      const savedCount = await Storage.get(Storage.KEYS.PROFILE_LIST_VISIBLE_COUNT);
      if (savedCount) setVisibleCount(Number(savedCount));
      const savedSpeed = await Storage.get(Storage.KEYS.PROFILE_LIST_SCROLL_SPEED);
      if (savedSpeed) setScrollSpeed(Number(savedSpeed));
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (route?.params?.openSettings) {
      setMode('SETTINGS');
      setModalVisible(true);
    }
  }, [route?.params?.openSettings]);

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
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.7}>
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

  const UpcomingAppCard = ({
    title,
    description,
    icon,
    color,
    onPress,
  }: {
    title: string;
    description: string;
    icon: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.cardContainer, { opacity: 0.75 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Surface style={[styles.appCard, { borderColor: '#475569', borderWidth: 1 }]} elevation={1}>
        <LinearGradient colors={[`${color}88`, `${color}44`]} style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon} size={32} color="#cbd5e1" />
        </LinearGradient>
        <View style={styles.cardText}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: '#e2e8f0' }]}>{title}</Text>
            <View style={{ backgroundColor: '#334155', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 }}>
              <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: 'bold' }}>UPCOMING</Text>
            </View>
          </View>
          <Text variant="bodySmall" style={[styles.cardDesc, { color: '#94a3b8' }]} numberOfLines={1}>{description}</Text>
        </View>
        <MaterialCommunityIcons name="information-outline" size={22} color="#94a3b8" />
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.bgDark }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]}>
        <LinearGradient colors={activeTheme.headerGrad} style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 12 }] }>
          <TouchableOpacity style={styles.exitBtnTopLeft} onPress={showExitConfirmation}>
            <MaterialCommunityIcons name="power" size={16} color="#fff" />
            <Text style={styles.exitBtnTopLeftText}>Exit App</Text>
          </TouchableOpacity>

          <View style={styles.headerTop}>
            {/* Avatar + User Name & Email Column (Taps -> Profile Mgmt Modal) */}
            <TouchableOpacity
              style={styles.avatarUserColumn}
              onPress={() => { setMode('VIEW'); setModalVisible(true); }}
              activeOpacity={0.7}
            >
              {user?.avatar ? (
                <Avatar.Image size={46} source={{ uri: user.avatar }} />
              ) : (
                <Avatar.Text size={46} label={getInitials(user?.name)} style={[styles.avatarFallback, { backgroundColor: activeTheme.accent }]} />
              )}
              <View style={styles.userInfoTextCol}>
                <Text variant="headlineSmall" style={styles.userNameText}>{user?.name || 'Guest'}</Text>
                <Text variant="bodyMedium" style={styles.userEmailText}>{user?.email || (user?.isGuest ? 'Guest Sandbox Session' : `ID: ${user?.id}`)}</Text>
              </View>
            </TouchableOpacity>

            {/* Right Controls: Upgrade Status Pill (Taps -> Upgrade Flow) + Connectivity Status Pill */}
            <View style={styles.rightControlsCol}>
              <TouchableOpacity
                style={[styles.stagePill, { backgroundColor: stageInfo.color }]}
                onPress={() => {
                  if (user?.isGuest) {
                    setInputName(user?.name || '');
                    setMode('CREATE_LOCAL');
                  } else {
                    setMode('UPGRADE_ONLINE');
                  }
                  setModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.stagePillText}>{stageInfo.label}</Text>
              </TouchableOpacity>

              <View style={[styles.connPill, { backgroundColor: activeTheme.bgDark, borderColor: activeTheme.border }]}>
                <View style={[styles.connDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
                <Text style={styles.connText}>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</Text>
              </View>
            </View>
          </View>

          {/* Centered Dashboard Subtitle Banner */}
          <Text style={styles.dashboardSubtitleCentered}>
            Your career dashboard is ready.
          </Text>

          {/* DOB Password Countdown Warning Banner */}
          {user && user.passwordChangeCountdown !== undefined && user.passwordChangeCountdown > 0 && (
            <Surface style={styles.warningBanner} elevation={3}>
              <MaterialCommunityIcons name="clock-alert-outline" size={24} color="#f59e0b" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Security Warning: DOB Password</Text>
                <Text style={styles.warningDesc}>
                  Please change default password ({user.passwordChangeCountdown} logins remaining)
                </Text>
              </View>
              <TouchableOpacity style={styles.changePassBtn} onPress={() => { setMode('CHANGE_PASSWORD'); setModalVisible(true); }}>
                <Text style={styles.changePassBtnText}>Change</Text>
              </TouchableOpacity>
            </Surface>
          )}
        </LinearGradient>

        {/* Suites Standalone Body Card Container */}
        <Surface style={[styles.suitesCardContainer, { backgroundColor: activeTheme.bgSurface, borderColor: activeTheme.border }]} elevation={2}>
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Suites</Text>
            <AppCard title="Resume Builder" description="Professional templates & South African context features." icon="file-document-edit" color={activeTheme.accent} onPress={() => navigation.navigate('Editor')} />
            <AppCard title="PDF Workbench" description="Merge documents, split pages, and reorder files." icon="file-pdf-box" color="#f59e0b" onPress={() => navigation.navigate('PDFWorkbench')} />
          </View>
        </Surface>

        {/* Upcoming Tools Standalone Body Card Container */}
        <Surface style={[styles.upcomingCardContainer, { backgroundColor: activeTheme.bgSurface, borderColor: activeTheme.border, marginBottom: 60 + Math.max(insets.bottom, 0) }]} elevation={2}>
          <TouchableOpacity
            style={styles.upcomingHeaderBar}
            onPress={() => setUpcomingCollapsed(!upcomingCollapsed)}
            activeOpacity={0.7}
          >
            <View style={styles.upcomingHeaderLeft}>
              <Text variant="titleLarge" style={styles.sectionTitleNoMargin}>Upcoming Tools</Text>
              <View style={styles.upcomingBadge}>
                <Text style={styles.upcomingBadgeText}>3 Coming Soon</Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name={upcomingCollapsed ? 'chevron-down' : 'chevron-up'}
              size={22}
              color="#94a3b8"
            />
          </TouchableOpacity>

          {!upcomingCollapsed && (
            <ScrollView nestedScrollEnabled style={{ maxHeight: 220, marginTop: 12 }}>
              <UpcomingAppCard
                title="Publish for Review"
                description="Expert HR & Manager resume evaluation."
                icon="check-decagram"
                color="#10b981"
                onPress={() => navigation.navigate('PublishReview')}
              />
              <UpcomingAppCard
                title="Travel to Interview"
                description="Commute route planning & taxi safety."
                icon="taxi"
                color="#3b82f6"
                onPress={() => navigation.navigate('Taxi')}
              />
              <UpcomingAppCard
                title="Publish to Reviewers"
                description="Human-reviewed talent pool for recruiters."
                icon="account-group"
                color="#a855f7"
                onPress={() => setPreviewItem({
                  title: "Publish to Reviewers",
                  subtitle: "Human-reviewed talent pool for recruiters.",
                  icon: "account-group",
                  color: "#a855f7",
                  gistParagraphs: [
                    "Allows recruitment agencies and vetted employers to request anonymized candidate qualifications and work experience data.",
                    "Recruiters can filter for expert-reviewed and rated candidate profiles, drastically reducing recruitment overhead while protecting deserving candidates from flawed ATS algorithm filters."
                  ]
                })}
              />
            </ScrollView>
          )}
        </Surface>
      </ScrollView>

      {/* Persistent Sticky Footer Card */}
      <Surface style={[styles.footerCard, { backgroundColor: activeTheme.bgDark, borderColor: activeTheme.border, height: 56 + Math.max(insets.bottom, 0), paddingBottom: Math.max(insets.bottom, 4) }]} elevation={5}>
        <TouchableOpacity style={[styles.burgerBtn, { backgroundColor: activeTheme.bgSurface, borderColor: activeTheme.border }]} onPress={() => { setMode('VIEW'); setModalVisible(true); }} activeOpacity={0.7}>
          <MaterialCommunityIcons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.footerTitleCol}>
          <Text style={styles.footerTitleText}>JobReady Hub</Text>
          <Text style={styles.footerSubtitleText}>Career & Interview Suite</Text>
        </View>
        <TouchableOpacity style={[styles.footerSettingsBtn, { backgroundColor: activeTheme.bgSurface, borderColor: activeTheme.border }]} onPress={() => { setMode('SETTINGS'); setModalVisible(true); }} activeOpacity={0.7}>
          <MaterialCommunityIcons name="cog-outline" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </Surface>

      {/* Profile Upgrade & Account Settings Popup Modal */}
      <Portal>
        <Dialog
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          style={{
            backgroundColor: activeTheme.bgSurface,
            width: isExpanded ? '92%' : '70%',
            alignSelf: 'center',
            maxWidth: isExpanded ? 600 : 420,
            borderWidth: 1.5,
            borderColor: activeTheme.border,
            borderRadius: 16,
          }}
        >
          {/* Header Bar with Title, Expand Button & Gear Settings Toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold', flex: 1 }} numberOfLines={1}>
              {mode === 'VIEW' ? `Profile: ${user?.name || 'Guest'}` 
               : mode === 'SETTINGS' ? 'App Settings & Themes'
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
              {(mode === 'VIEW' || mode === 'SETTINGS') && (
                <IconButton
                  icon={mode === 'SETTINGS' ? 'cog' : 'cog-outline'}
                  iconColor={mode === 'SETTINGS' ? activeTheme.accent : '#94a3b8'}
                  size={20}
                  onPress={() => setMode(mode === 'SETTINGS' ? 'VIEW' : 'SETTINGS')}
                />
              )}
            </View>
          </View>

          <Dialog.Content style={{ paddingTop: 8 }}>
            {mode === 'SETTINGS' ? (
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={true}>
                <Text style={{ color: '#cbd5e1', fontSize: 12, marginBottom: 10 }}>
                  Configure your dashboard list display preferences:
                </Text>

                {/* Compact Number Stepper Spinner: Visible Rows */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 4, backgroundColor: activeTheme.bgDark, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: activeTheme.border }}>
                  <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' }}>Visible Rows (Default: 7)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => updateVisibleCount(Math.max(1, visibleCount - 1))}
                      disabled={visibleCount <= 1}
                      style={{ backgroundColor: activeTheme.bgSurface, borderRadius: 6, padding: 6, opacity: visibleCount <= 1 ? 0.4 : 1 }}
                    >
                      <MaterialCommunityIcons name="minus" size={18} color={activeTheme.accent} />
                    </TouchableOpacity>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginHorizontal: 12, minWidth: 20, textAlign: 'center' }}>{visibleCount}</Text>
                    <TouchableOpacity
                      onPress={() => updateVisibleCount(Math.min(20, visibleCount + 1))}
                      disabled={visibleCount >= 20}
                      style={{ backgroundColor: activeTheme.bgSurface, borderRadius: 6, padding: 6, opacity: visibleCount >= 20 ? 0.4 : 1 }}
                    >
                      <MaterialCommunityIcons name="plus" size={18} color={activeTheme.accent} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Compact Number Stepper Spinner: Scroll Speed */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 4, backgroundColor: activeTheme.bgDark, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: activeTheme.border }}>
                  <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' }}>Scroll Speed (Default: 2)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => updateScrollSpeed(Math.max(1, scrollSpeed - 1))}
                      disabled={scrollSpeed <= 1}
                      style={{ backgroundColor: activeTheme.bgSurface, borderRadius: 6, padding: 6, opacity: scrollSpeed <= 1 ? 0.4 : 1 }}
                    >
                      <MaterialCommunityIcons name="minus" size={18} color={activeTheme.accent} />
                    </TouchableOpacity>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginHorizontal: 12, minWidth: 20, textAlign: 'center' }}>{scrollSpeed}</Text>
                    <TouchableOpacity
                      onPress={() => updateScrollSpeed(Math.min(10, scrollSpeed + 1))}
                      disabled={scrollSpeed >= 10}
                      style={{ backgroundColor: activeTheme.bgSurface, borderRadius: 6, padding: 6, opacity: scrollSpeed >= 10 ? 0.4 : 1 }}
                    >
                      <MaterialCommunityIcons name="plus" size={18} color={activeTheme.accent} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 6 Preset Named Color Themes Picker */}
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginTop: 14, marginBottom: 8 }}>
                  Preset Color Themes (6):
                </Text>
                <View style={{ gap: 6 }}>
                  {themes.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setThemeId(t.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: t.bgDark,
                        borderColor: themeId === t.id ? t.accent : activeTheme.border,
                        borderWidth: themeId === t.id ? 2 : 1,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {/* Swatch Color Preview */}
                        <View style={{ flexDirection: 'row', width: 28, height: 16, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                          <View style={{ flex: 1, backgroundColor: t.bgDark }} />
                          <View style={{ flex: 1, backgroundColor: t.accent }} />
                        </View>
                        <Text style={{ color: '#fff', fontWeight: themeId === t.id ? 'bold' : '500', fontSize: 12 }}>
                          {t.name}
                        </Text>
                      </View>
                      {themeId === t.id && (
                        <MaterialCommunityIcons name="check-circle" size={18} color={t.accent} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <Button
                  mode="contained"
                  buttonColor={activeTheme.accent}
                  style={{ marginTop: 16, marginBottom: 8 }}
                  onPress={() => setMode('VIEW')}
                >
                  Done Settings
                </Button>
              </ScrollView>
            ) : mode === 'VIEW' ? (
              <View>
                <Text style={{ color: '#cbd5e1', marginBottom: 6, fontSize: 12 }}>
                  Current Stage: <Text style={{ color: stageInfo.color, fontWeight: 'bold' }}>{stageInfo.label}</Text>
                </Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, marginBottom: 10 }}>
                  Profile ID: {user?.id || 'guest_session'}
                </Text>

                {/* 1-Tap Theme & Settings Button */}
                <Button mode="outlined" textColor={activeTheme.accent} style={{ marginBottom: 10, borderColor: activeTheme.border, backgroundColor: activeTheme.bgDark }} labelStyle={{ fontSize: 12, fontWeight: 'bold' }} icon="palette" onPress={() => setMode('SETTINGS')}>
                  🎨 Preset Color Themes & Settings
                </Button>

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

                {user && !user.isGuest && (
                  <Button
                    mode="outlined"
                    textColor="#ef4444"
                    style={{ borderColor: '#ef4444', marginBottom: 8 }}
                    labelStyle={{ fontSize: 12 }}
                    icon="logout"
                    onPress={async () => {
                      await logout();
                      setModalVisible(false);
                    }}
                  >
                    Logout Profile
                  </Button>
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
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: p.id === user?.id ? '#10b981' : '#fff', fontWeight: p.id === user?.id ? 'bold' : 'normal', fontSize: 12 }}>
                          {p.name} {p.id === user?.id ? '(Active)' : ''}
                        </Text>
                        <Text style={{ color: '#94a3b8', fontSize: 10 }}>
                          {p.isGuest ? 'GUEST' : p.isLocal ? 'LOCAL' : 'ONLINE'}
                        </Text>
                      </View>

                      {!p.isGuest && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            Alert.alert(
                              'Delete Profile',
                              `Are you sure you want to delete profile "${p.name}"? This action cannot be undone.`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: async () => {
                                    await deleteProfile(p.id);
                                  },
                                },
                              ]
                            );
                          }}
                          style={{ padding: 4, marginLeft: 8 }}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      )}
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

        {/* Custom Glassmorphic Gist Preview Modal for Upcoming Tools */}
        <Dialog
          visible={!!previewItem}
          onDismiss={() => setPreviewItem(null)}
          style={{
            backgroundColor: '#1e293b',
            width: '88%',
            alignSelf: 'center',
            maxWidth: 480,
            borderWidth: 1.5,
            borderColor: '#475569',
            borderRadius: 16,
          }}
        >
          {previewItem && [
            <View key="header" style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 6 }}>
              <LinearGradient colors={[previewItem.color, `${previewItem.color}88`]} style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <MaterialCommunityIcons name={previewItem.icon} size={30} color="#fff" />
              </LinearGradient>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold', textAlign: 'center' }}>
                  {previewItem.title}
                </Text>
                <View style={{ backgroundColor: '#334155', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: 'bold' }}>COMING SOON</Text>
                </View>
              </View>
              <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: 16 }}>
                {previewItem.subtitle}
              </Text>
            </View>,

            <Dialog.Content key="content" style={{ paddingTop: 10, paddingBottom: 12 }}>
              <View style={{ backgroundColor: '#0f172a', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#334155' }}>
                {previewItem.gistParagraphs.map((para, idx) => (
                  <Text
                    key={idx}
                    style={{
                      color: '#cbd5e1',
                      fontSize: 13,
                      lineHeight: 20,
                      marginBottom: idx === previewItem.gistParagraphs.length - 1 ? 0 : 10,
                    }}
                  >
                    {para}
                  </Text>
                ))}
              </View>
            </Dialog.Content>,

            <Dialog.Actions key="actions" style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
              <TouchableOpacity
                onPress={() => setPreviewItem(null)}
                style={{
                  backgroundColor: previewItem.color,
                  borderRadius: 8,
                  width: '100%',
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Got It</Text>
              </TouchableOpacity>
            </Dialog.Actions>
          ]}
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: { paddingBottom: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, paddingHorizontal: 16 },
  exitBtnTopLeft: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  exitBtnTopLeftText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  avatarUserColumn: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  userInfoTextCol: { justifyContent: 'center', flex: 1 },
  userNameText: { color: '#fff', fontWeight: 'bold', fontSize: 19 },
  userEmailText: { color: '#94a3b8', fontSize: 12, marginTop: 1 },
  rightControlsCol: { alignItems: 'flex-end', justifyContent: 'center', gap: 6, marginLeft: 10 },
  stagePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stagePillText: { color: '#fff', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  connPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#334155', gap: 5 },
  connDot: { width: 6, height: 6, borderRadius: 3 },
  connText: { color: '#cbd5e1', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  dashboardSubtitleCentered: { color: '#e2e8f0', textAlign: 'center', marginTop: 8, fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  bodyCardContainer: { backgroundColor: '#1e293b', borderRadius: 20, borderWidth: 1.5, borderColor: '#334155', padding: 16, marginTop: 12, marginBottom: 0 },
  suitesCardContainer: { flex: 1, backgroundColor: '#1e293b', borderRadius: 20, borderWidth: 1.5, borderColor: '#334155', padding: 16, marginTop: 12 },
  upcomingCardContainer: { backgroundColor: '#1e293b', borderRadius: 20, borderWidth: 1.5, borderColor: '#334155', padding: 12, marginTop: 12 },
  footerCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0f172a', borderTopWidth: 1.5, borderColor: '#334155', paddingTop: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 100, elevation: 10 },
  burgerBtn: { backgroundColor: '#1e293b', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  footerTitleCol: { alignItems: 'center', justifyContent: 'center' },
  footerTitleText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
  footerSubtitleText: { color: '#94a3b8', fontSize: 10, marginTop: 1 },
  footerSettingsBtn: { backgroundColor: '#1e293b', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  avatarFallback: { backgroundColor: '#6366f1' },
  warningBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', padding: 10, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#f59e0b' },
  warningTitle: { color: '#f59e0b', fontSize: 11, fontWeight: 'bold' },
  warningDesc: { color: '#cbd5e1', fontSize: 10, marginTop: 2 },
  changePassBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  changePassBtnText: { color: '#0f172a', fontSize: 10, fontWeight: 'bold' },
  menuContainer: { marginTop: 20 },
  sectionTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 12, fontSize: 18 },
  upcomingHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  upcomingHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitleNoMargin: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  upcomingBadge: { backgroundColor: 'rgba(99, 102, 241, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' },
  upcomingBadgeText: { color: '#818cf8', fontSize: 10, fontWeight: 'bold' },
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
