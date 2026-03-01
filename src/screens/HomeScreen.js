import React, { useContext, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Appbar, List, FAB, Text, Divider, Menu, IconButton } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
    const { meta, createResume, deleteResume, switchResume, renameResume } = useContext(ResumeContext);
    const navigation = useNavigation();
    const [visible, setVisible] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
    const [selectedResumeId, setSelectedResumeId] = useState(null);

    const handleCreate = async () => {
        const id = await createResume(`Resume ${meta.length + 1}`);
        navigation.navigate('Editor', { resumeId: id });
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
            <Appbar.Header>
                <Appbar.Content title="My Resumes" />
            </Appbar.Header>
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
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={handleCreate}
                label="Create New"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    }
});

export default HomeScreen;
