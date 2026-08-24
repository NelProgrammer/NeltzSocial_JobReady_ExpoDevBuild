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

import capabilitiesSlides from '../data/suitesCapabilitiesSlides.json';

const { width } = Dimensions.get('window');

type Navigation = NavigationProp<any>;

// Dedicated Geometric Shape Components (Exact 12px x 12px dimensions with equal optical mass)
const SquareShape = ({ color }: { color: string }) => (
  <View style={{ width: 12, height: 12, borderRadius: 2.5, backgroundColor: color }} />
);

const CircleShape = ({ color }: { color: string }) => (
  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
);

const DiamondShape = ({ color }: { color: string }) => (
  <View style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 8.5, height: 8.5, borderRadius: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
  </View>
);

const HubScreen: React.FC<any> = ({ route }: any) => {
  const navigation = useNavigation<Navigation>();
  const theme = useTheme();
  const { theme: activeTheme, themeId, setThemeId, themes } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  const netInfo = useNetInfo();
  const isConnected = netInfo.isConnected ?? true;
  const authCtx = useContext(AuthContext) as any;
  const { user, logout, deleteProfile, profiles, login, createProfile, changeProfilePassword } = authCtx;
  const { meta } = useContext(ResumeContext) as any;

  // DB Connection Status
  const [dbStatus, setDbStatus] = useState<'ONLINE' | 'DEGRADED' | 'OFFLINE'>('ONLINE');
  const getDbColor = () => {
    if (dbStatus === 'ONLINE') return '#10b981';
    if (dbStatus === 'DEGRADED') return '#f59e0b';
    return '#ef4444';
  };

  // Live Database Connectivity Health Ping
  useEffect(() => {
    let isMounted = true;
    const checkDb = async () => {
      if (!isConnected) {
        if (isMounted) setDbStatus('OFFLINE');
        return;
      }
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const id = controller ? setTimeout(() => controller.abort(), 3000) : null;
        const res = await fetch(`${authCtx.backendUrl || 'http://localhost:8000'}/auth/profiles`, {
          signal: controller?.signal
        });
        if (id) clearTimeout(id);
        if (isMounted) {
          setDbStatus(res.ok ? 'ONLINE' : 'DEGRADED');
        }
      } catch (err) {
        if (isMounted) {
          setDbStatus('OFFLINE');
        }
      }
    };
    checkDb();
    const interval = setInterval(checkDb, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isConnected, authCtx.backendUrl]);

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
  const [bodyHeight, setBodyHeight] = useState<number>(0);
  const [previewItem, setPreviewItem] = useState<{ title: string; subtitle: string; icon: string; color: string; gistParagraphs: string[] } | null>(null);

  // Active Carousel Slide State & References for 1st Capabilities AppCard in Suites
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(width - 48);
  const [isCarouselVisible, setIsCarouselVisible] = useState<boolean>(true);
  const [suitesHeight, setSuitesHeight] = useState<number>(500);
  const carouselRef = useRef<ScrollView>(null);

  // Screen height category & 4-step responsive limited-space compression calculation
  const isSmallScreen = height < 750;
  const isLargeScreen = height >= 750;
  const isSpaceConstrained = !upcomingCollapsed || suitesHeight < 340;

  // Step 1: Reduce wasted space around AppCards AND around Suites Card
  const suitesPaddingHoriz = isSpaceConstrained ? 6 : 12;
  const suitesPaddingVert = isSpaceConstrained ? 4 : 8;
  const appCardPadding = isSpaceConstrained ? 8 : 14;
  const appCardMarginBottom = isSpaceConstrained ? 6 : 12;

  // Step 2: Scale AppCard text sizes (80% Large Phones / Max 90% Small Phones)
  const textScale = isSpaceConstrained ? (isLargeScreen ? 0.80 : 0.90) : 1.0;
  const cardTitleFontSize = Math.round(14 * textScale);
  const cardDescFontSize = Math.round(11 * textScale);

  // Step 3: Reduce slide feature bullets iteratively (4 -> 3 -> 2 -> 1)
  const maxHighlightsCount = !isSpaceConstrained || suitesHeight >= 420
    ? 4
    : suitesHeight >= 360
      ? 3
      : suitesHeight >= 300
        ? 2
        : 1;

  // Auto-play Carousel Timer (advances active slide item every 5.0s for uniform stay duration across all 6 slides)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => {
        const next = (prev + 1) % capabilitiesSlides.length;
        carouselRef.current?.scrollTo({ x: 0, animated: false });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
      {/* 1. Persistent Fixed Header Banner (Fixed at top; never scrolls offscreen) */}
      <LinearGradient colors={activeTheme.headerGrad} style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 12 }] }>
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

          {/* Right Controls: Profile Stage Pill (Square) + Status Pills Row (Network Circle + Database Diamond) */}
          <View style={styles.rightControlsCol}>
            <TouchableOpacity
              style={[styles.stagePill, { borderColor: stageInfo.color, backgroundColor: `${stageInfo.color}15` }]}
              onPress={() => {
                if (user?.isGuest) {
                  setMode('CREATE_LOCAL');
                  setModalVisible(true);
                } else if (user?.isLocal) {
                  setMode('UPGRADE_ONLINE');
                  setModalVisible(true);
                } else {
                  setMode('VIEW');
                  setModalVisible(true);
                }
              }}
              activeOpacity={0.8}
            >
              <SquareShape color={stageInfo.color} />
              <Text style={[styles.stagePillText, { color: stageInfo.color }]}>{stageInfo.label}</Text>
            </TouchableOpacity>

            <View style={styles.statusPillsRow}>
              <View style={[styles.statusPill, { borderColor: isConnected ? '#10b98155' : '#ef444455', backgroundColor: isConnected ? '#10b98115' : '#ef444415' }]}>
                <CircleShape color={isConnected ? '#10b981' : '#ef4444'} />
                <Text style={[styles.statusPillText, { color: isConnected ? '#10b981' : '#ef4444' }]}>
                  {isConnected ? 'NET' : 'OFFLINE'}
                </Text>
              </View>

              <View style={[styles.statusPill, { borderColor: `${getDbColor()}55`, backgroundColor: `${getDbColor()}15` }]}>
                <DiamondShape color={getDbColor()} />
                <Text style={[styles.statusPillText, { color: getDbColor() }]}>
                  {dbStatus === 'ONLINE' ? 'DB' : dbStatus === 'DEGRADED' ? 'DB WARN' : 'DB OFF'}
                </Text>
              </View>
            </View>
          </View>
        </View>

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

      {/* 2. Middle Body Container (flex: 1; elevated above sticky footer via paddingBottom; measures physical bodyHeight) */}
      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - bodyHeight) > 2) setBodyHeight(h);
        }}
        style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 56 + Math.max(insets.bottom, 0) + 6, overflow: 'hidden' }}
      >
        {/* Suites Standalone Body Card Container */}
        <Surface
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - suitesHeight) > 2) setSuitesHeight(h);
          }}
          style={[
            styles.suitesCardContainer,
            {
              backgroundColor: activeTheme.bgSurface,
              borderColor: activeTheme.border,
              flex: 1,
              paddingHorizontal: suitesPaddingHoriz,
              paddingVertical: suitesPaddingVert
            }
          ]}
          elevation={2}
        >
          <ScrollView nestedScrollEnabled style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isSpaceConstrained ? 6 : 12 }}>
              <Text variant="titleLarge" style={[styles.sectionTitle, { marginBottom: 0 }]}>Suites</Text>
              {!isCarouselVisible && (
                <TouchableOpacity
                  onPress={() => setIsCarouselVisible(true)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: `${activeTheme.accent}18`,
                    borderColor: `${activeTheme.accent}44`,
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8
                  }}
                >
                  <MaterialCommunityIcons name="eye-outline" size={13} color={activeTheme.accent} />
                  <Text style={{ color: activeTheme.accent, fontSize: 10, fontWeight: 'bold' }}>Show Highlights</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Suites Capabilities Carousel AppCard Tile (1ST IN LIST - 4-Step Responsive Compression & Dynamic Flex Expansion) */}
            {isCarouselVisible && (() => {
              const activeSlide = capabilitiesSlides[activeSlideIndex];
              const visibleHighlights = activeSlide.highlights.slice(0, maxHighlightsCount);
              return (
                <View style={[styles.cardContainer, isSpaceConstrained ? { minHeight: 160, marginBottom: appCardMarginBottom } : { flex: 1, minHeight: 180, marginBottom: appCardMarginBottom }]}>
                  <Surface style={[styles.appCard, { flex: isSpaceConstrained ? undefined : 1, flexDirection: 'column', alignItems: 'stretch', justifyContent: 'space-between', padding: appCardPadding }]} elevation={2}>
                    {/* Active Slide Header - Dynamically updates to show title, icon, color, tag badge & top-right close 'x' button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isSpaceConstrained ? 4 : 8 }}>
                      <LinearGradient colors={[activeSlide.color, `${activeSlide.color}99`]} style={[styles.iconContainer, { width: isSpaceConstrained ? 36 : 44, height: isSpaceConstrained ? 36 : 44, borderRadius: 12, marginRight: 10 }]}>
                        <MaterialCommunityIcons name={activeSlide.icon} size={isSpaceConstrained ? 20 : 24} color="#fff" />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                          <Text variant="titleMedium" style={[styles.cardTitle, { fontSize: cardTitleFontSize, flex: 1, marginRight: 4 }]} numberOfLines={1}>
                            Automations: {activeSlide.title}
                          </Text>
                          <View style={{ backgroundColor: `${activeSlide.color}22`, borderColor: `${activeSlide.color}55`, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexShrink: 0 }}>
                            <Text style={{ color: activeSlide.color, fontSize: isSpaceConstrained ? 8 : 9, fontWeight: 'bold' }}>{activeSlide.tag}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => setIsCarouselVisible(false)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{
                              backgroundColor: '#1e293b',
                              padding: 4,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: 'rgba(255,255,255,0.1)',
                              marginLeft: 4
                            }}
                          >
                            <MaterialCommunityIcons name="close" size={isSpaceConstrained ? 12 : 14} color="#94a3b8" />
                          </TouchableOpacity>
                        </View>
                        <Text variant="bodySmall" style={[styles.cardDesc, { fontSize: cardDescFontSize, color: '#94a3b8', marginTop: 2 }]} numberOfLines={2}>{activeSlide.subtitle}</Text>
                      </View>
                    </View>

                    {/* Rich Feature Highlights Inset Panel (Iteratively displaying 4 -> 3 -> 2 -> 1 bullets based on space) */}
                    <View style={{ backgroundColor: '#0f172a', borderRadius: 10, padding: isSpaceConstrained ? 6 : 10, marginVertical: isSpaceConstrained ? 4 : 6, borderWidth: 1, borderColor: '#334155', gap: isSpaceConstrained ? 4 : 6, flex: isSpaceConstrained ? undefined : 1, justifyContent: 'center' }}>
                      {visibleHighlights.map((h: string, hIdx: number) => (
                        <View key={hIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                          <MaterialCommunityIcons name="check-circle-outline" size={isSpaceConstrained ? 12 : 14} color={activeSlide.color} style={{ marginTop: 2 }} />
                          <Text style={{ color: '#cbd5e1', fontSize: cardDescFontSize, flex: 1, flexWrap: 'wrap' }}>{h}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Horizontal Feature Carousel with Pagination Dots */}
                    <ScrollView
                      ref={carouselRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      onLayout={(e) => {
                        const w = e.nativeEvent.layout.width;
                        if (w > 0 && Math.abs(w - containerWidth) > 2) setContainerWidth(w);
                      }}
                      contentContainerStyle={[styles.showcaseScrollContent, { paddingLeft: 0, paddingRight: 32 }]}
                      onMomentumScrollEnd={(e) => {
                        const x = e.nativeEvent.contentOffset.x;
                        const newIdx = Math.min(capabilitiesSlides.length - 1, Math.max(0, Math.round(x / 140)));
                        if (newIdx !== activeSlideIndex) setActiveSlideIndex(newIdx);
                      }}
                      scrollEventThrottle={16}
                    >
                      {(() => {
                        const activeSlideItem = capabilitiesSlides[activeSlideIndex];
                        const otherSlideItems = capabilitiesSlides.filter((_, i) => i !== activeSlideIndex);
                        const displaySlides = [activeSlideItem, ...otherSlideItems];
                        return displaySlides.map((slide, idx) => {
                          const isActive = idx === 0;
                          const origIdx = capabilitiesSlides.findIndex((s) => s.title === slide.title);
                          return (
                            <TouchableOpacity
                              key={slide.title}
                              onPress={() => {
                                setActiveSlideIndex(origIdx);
                                carouselRef.current?.scrollTo({ x: 0, animated: false });
                              }}
                              activeOpacity={0.8}
                              style={[
                                styles.showcasePill,
                                { borderColor: isActive ? slide.color : 'rgba(255,255,255,0.1)' },
                                isActive ? { backgroundColor: `${slide.color}22`, maxWidth: Math.max(160, containerWidth - 24) } : { flexShrink: 0 }
                              ]}
                            >
                              <MaterialCommunityIcons name={slide.icon} size={13} color={isActive ? slide.color : '#94a3b8'} />
                              <Text
                                style={[styles.showcasePillText, isActive && { color: '#fff', fontWeight: 'bold', flexShrink: 1 }]}
                                numberOfLines={isActive ? 2 : 1}
                              >
                                {slide.title}
                              </Text>
                            </TouchableOpacity>
                          );
                        });
                      })()}
                    </ScrollView>

                    {/* Carousel Pagination Dots */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      {capabilitiesSlides.map((slide, idx) => (
                        <View
                          key={idx}
                          style={{
                            width: idx === activeSlideIndex ? 14 : 5,
                            height: 5,
                            borderRadius: 2.5,
                            backgroundColor: idx === activeSlideIndex ? slide.color : '#475569'
                          }}
                        />
                      ))}
                    </View>
                  </Surface>
                </View>
              );
            })()}

            <AppCard title="Resume Builder" description="Professional templates & South African context features." icon="file-document-edit" color={activeTheme.accent} onPress={() => navigation.navigate('Editor')} />
            <AppCard title="PDF Workbench" description="Merge documents, split pages, and reorder files." icon="file-pdf-box" color="#f59e0b" onPress={() => navigation.navigate('PDFWorkbench')} />
          </ScrollView>
        </Surface>

        {/* Upcoming Tools Standalone Body Card Container */}
        <Surface style={[styles.upcomingCardContainer, { backgroundColor: activeTheme.bgSurface, borderColor: activeTheme.border, marginTop: 6, marginBottom: 2 }]} elevation={2}>
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

          {!upcomingCollapsed && (() => {
            const maxUpcomingScrollHeight = bodyHeight > 0 ? Math.min(180, Math.max(90, bodyHeight * 0.40 - 56)) : 140;
            return (
              <ScrollView nestedScrollEnabled style={{ maxHeight: maxUpcomingScrollHeight, marginTop: 8 }}>
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
            );
          })()}
        </Surface>
      </View>

      {/* 3. Persistent Sticky Footer Card (Fixed at bottom) */}
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

                {/* Prominent Exit App Action Button inside Menu Drawer */}
                <Button
                  mode="contained"
                  buttonColor="#dc2626"
                  style={{ marginBottom: 12, marginTop: 4 }}
                  labelStyle={{ fontSize: 12, fontWeight: 'bold' }}
                  icon="power"
                  onPress={() => {
                    setModalVisible(false);
                    showExitConfirmation();
                  }}
                >
                  Exit App
                </Button>

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
  stagePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  stagePillText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  statusPillsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, borderWidth: 1, gap: 5 },
  statusPillText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  dashboardSubtitleCentered: { color: '#e2e8f0', textAlign: 'center', marginTop: 8, fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  bodyCardContainer: { backgroundColor: '#1e293b', borderRadius: 20, borderWidth: 1.5, borderColor: '#334155', padding: 16, marginTop: 12, marginBottom: 0 },
  suitesCardContainer: { flex: 1, flexShrink: 1, backgroundColor: '#1e293b', borderRadius: 20, borderWidth: 1.5, borderColor: '#334155', padding: 16 },
  upcomingCardContainer: { flexShrink: 0, backgroundColor: '#1e293b', borderRadius: 20, borderWidth: 1.5, borderColor: '#334155', padding: 12 },
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
  showcaseScrollContent: { gap: 8, alignItems: 'center' },
  showcasePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, gap: 6, flexShrink: 0 },
  showcasePillText: { color: '#e2e8f0', fontSize: 11, fontWeight: '600' },
  cardContainer: { marginBottom: 12 },
  appCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#475569' },
  iconContainer: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardText: { flex: 1 },
  cardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cardDesc: { color: '#94a3b8', marginTop: 2, fontSize: 11, lineHeight: 15 },
  footer: { alignItems: 'center', marginVertical: 20 },
  footerText: { color: '#64748b', fontSize: 12 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 8, backgroundColor: '#0f172a', marginBottom: 6 },
  activeProfileRow: { borderWidth: 1, borderColor: '#10b981' }
});

export default HubScreen;
