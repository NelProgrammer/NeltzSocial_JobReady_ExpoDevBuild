import { useContext } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
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
    const { user, logout } = useContext(AuthContext);
    const { meta } = useContext(ResumeContext);

    const latestResume = meta.length > 0 ? meta.sort((a, b) => b.lastModified - a.lastModified)[0] : null;

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
                    style={[styles.header, { paddingTop: insets.top + 20 }]}
                >
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
                            <TouchableOpacity style={styles.logoutBtn} onPress={() => {
                                Alert.alert(
                                    "Logout",
                                    "Are you sure you want to log out of your profile?",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Logout", style: "destructive", onPress: () => {
                                            logout();
                                            // Navigation is usually handled by the auth context wrapper automatically kicking out
                                        }}
                                    ]
                                );
                            }}>
                                <MaterialCommunityIcons name="logout" size={16} color="#fff" />
                                <Text style={styles.logoutText}>Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                {latestResume && (
                    <Surface style={styles.activeContextCard} elevation={4}>
                        <View style={styles.contextHeader}>
                            <Text variant="labelSmall" style={styles.contextLabel}>CONTINUE EDITING</Text>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#6366f1" />
                        </View>
                        <Text variant="titleMedium" style={styles.resumeName}>{latestResume.name}</Text>
                        <TouchableOpacity style={styles.resumeAction} onPress={() => navigation.navigate('Editor', { resumeId: latestResume.id })}>
                            <Text style={styles.resumeActionText}>Open Editor</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#6366f1" />
                        </TouchableOpacity>
                    </Surface>
                )}

                <View style={styles.menuContainer}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Success Suite</Text>
                    
                    <AppCard 
                        title="Resume Builder" 
                        description="Professional templates & South African context features."
                        icon="file-document-edit" 
                        color="#6366f1"
                        onPress={() => navigation.navigate('ResumeHome')}
                    />
                    
                    <AppCard 
                        title="PDF Workbench" 
                        description="Merge documents, split pages, and reorder files."
                        icon="pdf-box" 
                        color="#f59e0b"
                        onPress={() => navigation.navigate('PDFWorkbench')}
                    />

                    <AppCard 
                        title="Review & Publish" 
                        description="Get feedback from experts and showcase your profile."
                        icon="check-decagram" 
                        color="#10b981"
                        onPress={() => navigation.navigate('Preview')}
                    />

                    <AppCard 
                        title="Taxi 2 Interview" 
                        description="Plan your commute and stay safe. (Coming Soon)"
                        icon="car-connected" 
                        color="#3b82f6"
                        onPress={() => Alert.alert("Coming Soon", "Taxi 2 Interview feature is under development.")}
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
    activeContextCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginTop: -40, // Pulls the card up into the header area
        marginHorizontal: 24,
        marginBottom: 24,
    },
    contextHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    contextLabel: {
        color: '#6366f1',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    resumeName: {
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    resumeAction: {
        backgroundColor: '#f0eaff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    resumeActionText: {
        color: '#6366f1',
        fontWeight: 'bold',
        marginRight: 8,
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
