// @ts-nocheck
import React, { useContext, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Appbar, List, FAB, Text, Divider, Menu, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ResumeContext } from '../context/ResumeContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickAndParseDocument, translateParsedTextToResume } from '../utils/FileParserHelper';
import HeadlessParser from '../components/HeadlessParser';
import { Storage } from '../utils/storage';
import { SyncIndicator } from '../components/SyncIndicator';
import { useSyncQueue } from '../hooks/useSyncQueue';
import { AuthContext } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';

const HomeScreen = () => {
    const { user } = useContext(AuthContext);
    const { meta, createResume, deleteResume, switchResume, renameResume, updateResumeData } = useContext(ResumeContext);
    const { theme } = useThemeContext();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    useSyncQueue();
    
    // Import State
    const [fileContext, setFileContext] = useState(null);
    const [isParsing, setIsParsing] = useState(false);

    const handleCreate = async () => {
        const id = await createResume(`Resume ${meta.length + 1}`);
        navigation.navigate('Editor', { resumeId: id });
    };

    const handleImport = async () => {
        setIsParsing(true);
        const success = await pickAndParseDocument(setFileContext);
        if (!success) {
            setIsParsing(false);
        }
    };

    const onParsedSuccess = async (text) => {
        setIsParsing(false);
        setFileContext(null); // Clear context
        
        const generatedData = translateParsedTextToResume(text);
        const newId = await createResume(`Imported CV - ${new Date().toLocaleDateString()}`);
        
        // Push the json data immediately
        if (newId && user) {
            await Storage.saveResumeData(user.id, newId, generatedData);
            await switchResume(newId);
        }
        
        navigation.navigate('Editor', { resumeId: newId });
        Alert.alert("Success", "CV Imported! Please review extracted fields.");
    };

    const onParsedError = (errorMsg) => {
        setIsParsing(false);
        setFileContext(null);
        Alert.alert('Import Failed', errorMsg || 'Could not parse text content from file.');
    };

    const handleOpen = async (id) => {
        await switchResume(id);
        navigation.navigate('Editor', { resumeId: id });
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Resume',
            'Are you sure you want to delete this resume?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteResume(id) },
            ]
        );
    };

    const handleRename = (id, currentName) => {
        Alert.prompt(
            'Rename Resume',
            'Enter a new name for your resume:',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Save', 
                    onPress: (newName) => {
                        if (newName && newName.trim()) {
                            renameResume(id, newName.trim());
                        }
                    } 
                },
            ],
            'plain-text',
            currentName
        );
    };

    const renderItem = ({ item }) => (
        <List.Item
            title={item.name}
            titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
            description={`Last modified: ${item.updatedAt && !isNaN(new Date(item.updatedAt).getTime()) ? new Date(item.updatedAt).toLocaleDateString() : 'Recently'}`}
            descriptionStyle={{ color: theme.textSecondary, fontSize: 12 }}
            style={{ backgroundColor: theme.bgSurface, paddingHorizontal: 8 }}
            left={(props) => <List.Icon {...props} icon="file-document" color={theme.accent} />}
            right={(props) => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <SyncIndicator resumeId={item.id} />
                    <IconButton icon="pencil" iconColor={theme.textSecondary} onPress={() => handleRename(item.id, item.name)} />
                    <IconButton icon="delete" iconColor="#ef4444" onPress={() => handleDelete(item.id)} />
                    <IconButton icon="chevron-right" iconColor={theme.accent} onPress={() => handleOpen(item.id)} />
                </View>
            )}
            onPress={() => handleOpen(item.id)}
        />
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bgDark, paddingTop: Math.max(insets.top, 16) + 8 }]}>
            {/* Header Banner */}
            <View style={[styles.headerBanner, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={[styles.navBtn, { backgroundColor: theme.bgDark, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub')} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="arrow-left" size={20} color={theme.textPrimary} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>Resume Builder</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>South African Masters & Clones</Text>
                    </View>
                    <View style={[styles.themeBadge, { backgroundColor: theme.accent }]}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>Active Suite</Text>
                    </View>
                </View>
                <Text style={[styles.subtitleCentered, { color: theme.textSecondary }]}>Create, clone and tailor custom CV packages</Text>
            </View>

            {/* Unified Body Card Container */}
            <View style={[styles.bodyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border, marginBottom: 60 + Math.max(insets.bottom, 0) }]}>
                {meta.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={{ marginBottom: 10, color: theme.textPrimary, fontWeight: 'bold', fontSize: 18 }}>No Resumes Yet</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center' }}>Tap "Create New" or "Import MS/PDF" below to build your first resume.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={meta}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.border }} />}
                        contentContainerStyle={{ paddingBottom: 80 }}
                    />
                )}

                {/* FAB Action Controls inside Body Card */}
                <View style={styles.fabRow}>
                    <FAB
                        icon="import"
                        style={[styles.fab, { backgroundColor: theme.bgDark, borderWidth: 1, borderColor: theme.border }]}
                        color={theme.textPrimary}
                        onPress={handleImport}
                        label="Import MS/PDF"
                        disabled={isParsing}
                    />
                    <FAB
                        icon="plus"
                        style={[styles.fab, { backgroundColor: theme.accent }]}
                        color="#ffffff"
                        onPress={handleCreate}
                        label="Create New"
                        disabled={isParsing}
                    />
                </View>
            </View>

            {isParsing && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.85)', justifyContent:'center', alignItems:'center', zIndex: 100 }]}>
                    <ActivityIndicator size="large" color={theme.accent} />
                    <Text style={{ marginTop: 10, fontWeight: 'bold', color: theme.textPrimary }}>Parsing Document...</Text>
                </View>
            )}

            <HeadlessParser 
                fileContext={fileContext}
                onParsed={onParsedSuccess}
                onError={onParsedError}
            />

            {/* Persistent Sticky Footer Card */}
            <View style={[styles.footerCard, { backgroundColor: theme.bgDark, borderColor: theme.border, height: 56 + Math.max(insets.bottom, 0), paddingBottom: Math.max(insets.bottom, 4) }]}>
                <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub')} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="home-outline" size={22} color={theme.textPrimary} />
                </TouchableOpacity>

                <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Resume Builder Suite</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 10 }}>JobReady Hub</Text>
                </View>

                <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub', { openSettings: true })} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="cog-outline" size={22} color={theme.accent} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBanner: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    navBtn: {
        padding: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    themeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    subtitleCentered: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 6,
        fontWeight: '500',
    },
    bodyCard: {
        flex: 1,
        marginHorizontal: 12,
        marginTop: 10,
        marginBottom: 60,
        borderRadius: 20,
        borderWidth: 1.5,
        padding: 12,
        overflow: 'hidden',
    },
    fabRow: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        gap: 10,
    },
    fab: {
        borderRadius: 12,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    footerCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1.5,
        zIndex: 100,
        elevation: 10,
    },
    footerIconBtn: {
        padding: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
});

export default HomeScreen;
