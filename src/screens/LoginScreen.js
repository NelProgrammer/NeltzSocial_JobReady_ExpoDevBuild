import React, { useContext, useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Surface, TextInput, useTheme, Divider, IconButton, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const LoginScreen = () => {
    const { profiles, login, createProfile, deleteProfile, quickStart } = useContext(AuthContext);
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [newName, setNewName] = useState('');

    const handleCreateProfile = () => {
        if (newName.trim()) {
            createProfile(newName.trim());
            setNewName('');
        }
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <View style={styles.logoContainer}>
                        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                        <Text variant="headlineMedium" style={styles.title}>JobReady</Text>
                        <Text variant="bodyLarge" style={styles.subtitle}>By NeltzSocial</Text>
                    </View>

                    <Surface style={styles.surface} elevation={0}>
                        <Text variant="titleLarge" style={styles.surfaceTitle}>Welcome</Text>
                        
                        {/* 1. SOCIAL PROVIDERS (Colored to match Web) */}
                        <View style={styles.socialGrid}>
                            <Button 
                                mode="contained" 
                                icon="google" 
                                onPress={() => {}} 
                                style={[styles.socialBtn, { backgroundColor: '#4285F4' }]}
                                labelStyle={{ color: '#fff' }}
                            >
                                Google
                            </Button>
                            <Button 
                                mode="contained" 
                                icon="linkedin" 
                                onPress={() => {}} 
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
                                onPress={() => {}} 
                                style={[styles.socialBtn, { backgroundColor: '#1877F2' }]}
                                labelStyle={{ color: '#fff' }}
                            >
                                Facebook
                            </Button>
                            <Button 
                                mode="contained" 
                                icon="twitter" 
                                onPress={() => {}} 
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
                            {(profiles || []).sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0)).slice(0, 5).map(p => (
                                <View key={p.id} style={styles.profileItem}>
                                    <TouchableOpacity style={styles.profileInfo} onPress={() => login(p.id)}>
                                        <Avatar.Icon size={32} icon="account" backgroundColor="#6366f1" />
                                        <View style={{ marginLeft: 12 }}>
                                            <Text style={styles.profileName}>{p.name}</Text>
                                            <Text style={styles.profileSub}>{p.socialLinks?.google ? 'Social Account' : 'Local Profile'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <IconButton 
                                        icon="trash-can-outline" 
                                        iconColor="rgba(255,0,0,0.4)" 
                                        size={20} 
                                        onPress={() => deleteProfile(p.id)} 
                                    />
                                </View>
                            ))}
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
                            <Button mode="contained" onPress={handleCreateProfile} style={styles.createBtn} buttonColor="#6366f1">Create</Button>
                        </View>

                        <Button mode="text" onPress={quickStart} style={{ marginTop: 16 }} labelStyle={{ color: 'rgba(255,255,255,0.4)' }}>
                            Quick Start (Offline)
                        </Button>
                    </Surface>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    logoContainer: { alignItems: 'center', marginBottom: 32 },
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
    surfaceTitle: { textAlign: 'center', marginBottom: 24, fontWeight: 'bold', color: '#fff' },
    socialGrid: { flexDirection: 'row', gap: 8 },
    socialBtn: { flex: 1, borderRadius: 12 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    divider: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    dividerText: { marginHorizontal: 12, color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' },
    profileList: { gap: 12 },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 4,
        paddingLeft: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    profileInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    profileName: { color: '#fff', fontWeight: 'bold' },
    profileSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
    createContainer: { flexDirection: 'row', gap: 8 },
    input: { flex: 1, backgroundColor: 'transparent' },
    createBtn: { justifyContent: 'center', borderRadius: 12 },
    footerNote: { textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 16 }
});

export default LoginScreen;

