import React, { useContext, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Appbar, List, FAB, Text, Divider, Menu, IconButton, Button } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickAndParseDocument, translateParsedTextToResume } from '../utils/FileParserHelper';
import HeadlessParser from '../components/HeadlessParser';
import { Storage } from '../utils/storage';
import { AuthContext } from '../context/AuthContext';

const HomeScreen = () => {
    const { user } = useContext(AuthContext);
    const { meta, createResume, deleteResume, switchResume, renameResume, updateResumeData } = useContext(ResumeContext);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    
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

    const onParsedError = (error) => {
        setIsParsing(false);
        setFileContext(null);
        Alert.alert("OCR Error", "Could not read this document format automatically.");
    };

    const handleOpen = async (id) => {
        await switchResume(id);
        navigation.navigate('Editor', { resumeId: id });
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Resume",
            "Are you sure you want to delete this resume?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteResume(id) }
            ]
        );
    };

    const handleRename = (id, currentName) => {
        Alert.prompt(
            "Rename Resume",
            "Enter new name:",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Rename", onPress: (newName) => renameResume(id, newName) }
            ],
            "plain-text",
            currentName
        );
    };


    const renderItem = ({ item }) => (
        <List.Item
            title={item.name}
            description={`Last Edited: ${new Date(item.lastModified).toLocaleDateString()}`}
            left={props => <List.Icon {...props} icon="file-document-outline" />}
            right={props => (
                <View style={{ flexDirection: 'row' }}>
                    <IconButton icon="pencil" onPress={() => handleRename(item.id, item.name)} />
                    <IconButton icon="delete" onPress={() => handleDelete(item.id)} />
                    <IconButton icon="chevron-right" onPress={() => handleOpen(item.id)} />
                </View>
            )}
            onPress={() => handleOpen(item.id)}

        />
    );

    return (
        <View style={styles.container}>
            {meta.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text variant="headlineSmall" style={{ marginBottom: 10 }}>No Resumes Yet</Text>
                    <Text variant="bodyMedium">Tap the + button to create your first resume.</Text>
                </View>
            ) : (
                <FlatList
                    data={meta}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ItemSeparatorComponent={Divider}
                    contentContainerStyle={{ paddingBottom: 80 }}
                />
            )}
            {isParsing && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.7)', justifyContent:'center', alignItems:'center', zIndex: 100 }]}>
                    <ActivityIndicator size="large" color="#6200ee" />
                    <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Parsing Document...</Text>
                </View>
            )}

            <HeadlessParser 
                fileContext={fileContext}
                onParsed={onParsedSuccess}
                onError={onParsedError}
            />

            <View style={[styles.fabContainer, { bottom: Math.max(insets.bottom, 16) }]}>
                <FAB
                    icon="import"
                    style={[styles.fab, { backgroundColor: '#e0e0e0', marginRight: 10 }]}
                    onPress={handleImport}
                    label="Import MS/PDF"
                    disabled={isParsing}
                />
                <FAB
                    icon="plus"
                    style={styles.fab}
                    onPress={handleCreate}
                    label="Create New"
                    disabled={isParsing}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    fabContainer: {
        position: 'absolute',
        right: 16,
        flexDirection: 'row',
    },
    fab: {
        borderRadius: 12
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    }
});

export default HomeScreen;
