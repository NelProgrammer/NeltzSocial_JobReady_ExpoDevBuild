import React, { useContext, useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, Button, Surface, TextInput, useTheme, Divider } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const LoginScreen = () => {
    const { login, quickStart } = useContext(AuthContext);
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSocialLogin = (provider) => {
        // Simulate Social Login
        const dummyProfile = {
            id: `${provider}_${Date.now()}`,
            name: `User ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
            email: `user@${provider}.com`,
            photo: null,
            provider: provider
        };
        login(dummyProfile);
    };

    return (
        <LinearGradient colors={['#6200ee', '#3700b3']} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.logoContainer}>
                        <Image 
                            source={require('../../assets/logo.png')} 
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text variant="headlineMedium" style={styles.title}>JobReady</Text>
                        <Text variant="bodyLarge" style={styles.subtitle}>By NeltzSocial</Text>
                    </View>

                    <Surface style={styles.surface} elevation={4}>
                        <Text variant="titleLarge" style={styles.surfaceTitle}>Welcome Back</Text>
                        
                        <View style={styles.socialButtons}>
                            <Button
                                mode="outlined"
                                icon="google"
                                onPress={() => handleSocialLogin('google')}
                                style={styles.socialBtn}
                                contentStyle={styles.socialBtnContent}
                            >
                                Google
                            </Button>
                            <Button
                                mode="outlined"
                                icon="linkedin"
                                onPress={() => handleSocialLogin('linkedin')}
                                style={styles.socialBtn}
                                contentStyle={styles.socialBtnContent}
                            >
                                LinkedIn
                            </Button>
                        </View>

                        <View style={styles.socialButtons}>
                            <Button
                                mode="outlined"
                                icon="facebook"
                                onPress={() => handleSocialLogin('facebook')}
                                style={styles.socialBtn}
                                contentStyle={styles.socialBtnContent}
                            >
                                Facebook
                            </Button>
                            <Button
                                mode="outlined"
                                icon="twitter"
                                onPress={() => handleSocialLogin('twitter')}
                                style={styles.socialBtn}
                                contentStyle={styles.socialBtnContent}
                            >
                                X / Twitter
                            </Button>
                        </View>

                        <View style={styles.dividerContainer}>
                            <Divider style={styles.divider} />
                            <Text style={styles.dividerText}>OR</Text>
                            <Divider style={styles.divider} />
                        </View>

                        <Button
                            mode="contained"
                            onPress={quickStart}
                            style={styles.quickStartBtn}
                            contentStyle={{ height: 50 }}
                        >
                            Quick Start (Offline)
                        </Button>

                        <Text style={styles.footerNote}>
                            By continuing, you agree to our Terms and Privacy Policy.
                        </Text>
                    </Surface>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        marginTop: 10,
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    surface: {
        padding: 24,
        borderRadius: 20,
        backgroundColor: '#fff',
    },
    surfaceTitle: {
        textAlign: 'center',
        marginBottom: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    socialBtn: {
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 8,
    },
    socialBtnContent: {
        height: 44,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#888',
        fontWeight: 'bold',
    },
    quickStartBtn: {
        borderRadius: 8,
        backgroundColor: '#03dac6',
    },
    footerNote: {
        textAlign: 'center',
        fontSize: 12,
        color: '#888',
        marginTop: 20,
    }
});

export default LoginScreen;
