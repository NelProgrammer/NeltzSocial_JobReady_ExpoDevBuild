import React, { useContext, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, BackHandler } from 'react-native';
import { Appbar, Text, Card, useTheme, Avatar, Surface, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { ResumeContext } from '../context/ResumeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const HubScreen = () => {
    const navigation = useNavigation();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { user, logout, quickStart } = useContext(AuthContext);
    const { meta } = useContext(ResumeContext);

    const latestResume = meta.length > 0 ? meta.sort((a, b) => b.lastModified - a.lastModified)[0] : null;

    // --- Double-Tap Back Button to Exit ---
    const lastBackPress = useRef(0);

    useEffect(() => {
        const backAction = () => {
            const now = Date.now();
            // If back pressed twice within 2 seconds, show exit confirmation
            if (now - lastBackPress.current < 2000) {
                Alert.alert(
                    "Exit App",
                    "Are you sure you want to close JobReady?",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Exit", style: "destructive", onPress: () => BackHandler.exitApp() }
                    ]
                );
            } else {
                lastBackPress.current = now;
            }
            return true; // Prevent default back navigation
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => subscription.remove();
    }, []);

    // --- Exit Confirmation Dialog ---
    const showExitConfirmation = () => {
        Alert.alert(
            "Exit App",
            "Are you sure you want to close JobReady?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Exit", style: "destructive", onPress: () => BackHandler.exitApp() }
            ]
        );
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const AppCard = ({ title, description, icon, color, onPress }) => (
        <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
            <Surface style={styles.appCard} elevation={2}>
                <LinearGradient
                    colors={[color, color + '99']}
                    style={styles.iconContainer}
                >
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
                <LinearGradient
                    colors={['#0f172a', '#1e293b']}
                    style={[styles.header, { paddingTop: insets.top + 12 }]}
                >
                    {/* Exit App Button — Top Left */}
                    <TouchableOpacity style={styles.exitBtnTopLeft} onPress={showExitConfirmation}>
                        <MaterialCommunityIcons name="power" size={16} color="#fff" />
                        <Text style={styles.exitBtnTopLeftText}>Exit App</Text>
                    </TouchableOpacity>

                    <View style={styles.headerTop}>
                        <View style={styles.headerLeft}>
                            <Text variant="headlineMedium" style={styles.welcomeText}>Hello, {user?.name?.split(' ')[0] || 'User'}</Text>
                            <Text variant="bodyLarge" style={styles.subtitleText}>{user?.email || 'Guest User'}</Text>
                            <Text variant="bodySmall" style={styles.dashboardSubtitle}>Your career dashboard is ready.</Text>
                        </View>
                        <View style={styles.profileSection}>
                            {user?.avatar ? (
                                <Avatar.Image size={48} source={{ uri: user.avatar }} />
                            ) : (
                                <Avatar.Text size={48} label={getInitials(user?.name)} style={styles.avatarFallback} />
                            )}
                            {user ? (
                                <TouchableOpacity style={styles.logoutBtn} onPress={() => {
                                    Alert.alert(
                                        "Logout",
                                        "Are you sure you want to log out of your profile?",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Logout", style: "destructive", onPress: () => {
                                                logout();
                                            }}
                                        ]
                                    );
                                }}>
                                    <MaterialCommunityIcons name="logout" size={16} color="#fff" />
                                    <Text style={styles.logoutText}>Log Out</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
                                    <MaterialCommunityIcons name="login" size={16} color="#fff" />
                                    <Text style={styles.loginText}>Log In</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.menuContainer}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Success Suite</Text>
                    
                    <AppCard 
                        title="Resume Builder" 
                        description="Professional templates & South African context features."
                        icon="file-document-edit" 
                        color="#6366f1"
                        onPress={async () => {
                            if (!user) {
                                await quickStart();
                            }
                            navigation.navigate('ResumeHome');
                        }}
                    />
                    
                    <AppCard 
                        title="PDF Workbench" 
                        description="Merge documents, split pages, and reorder files."
                        icon="file-pdf-box" 
                        color="#f59e0b"
                        onPress={() => navigation.navigate('PDFWorkbench')}
                    />

                    <AppCard 
                        title="Review & Publish" 
                        description="Get feedback from experts and showcase your profile."
                        icon="check-decagram" 
                        color="#10b981"
                        onPress={() => navigation.navigate('PublishReview')}
                    />

                    <AppCard 
                        title="Taxi 2 Interview" 
                        description="Plan your commute and stay safe."
                        icon="car-connected" 
                        color="#3b82f6"
                        onPress={() => navigation.navigate('Taxi')}
                    />
                </View>

                <View style={styles.footer}>
                    <IconButton icon="dots-horizontal" />
                    <Text style={styles.footerText}>More Tools Coming Soon</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingHorizontal: 24,
    },
    exitBtnTopLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
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
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    subtitleText: {
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    headerLeft: {
        flex: 1,
    },
    dashboardSubtitle: {
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    profileSection: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarFallback: {
        backgroundColor: '#6366f1',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,50,50,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,50,50,0.3)'
    },
    logoutText: {
        color: '#ff6b6b',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
        textTransform: 'uppercase'
    },
    loginBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99,102,241,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(99,102,241,0.3)'
    },
    loginText: {
        color: '#818cf8',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
        textTransform: 'uppercase'
    },
    menuContainer: {
        marginTop: 20,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
        paddingHorizontal: 24,
    },
    cardContainer: {
        marginBottom: 16,
        paddingHorizontal: 24,
    },
    appCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardText: {
        flex: 1,
        marginLeft: 16,
        marginRight: 8,
    },
    cardTitle: {
        fontWeight: 'bold',
        color: '#333',
    },
    cardDesc: {
        color: '#777',
        marginTop: 2,
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
        opacity: 0.5,
    },
    footerText: {
        fontSize: 12,
        color: '#666',
    }
});

export default HubScreen;
