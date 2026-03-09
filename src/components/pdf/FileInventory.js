import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Button, Text, IconButton, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FileInventory = ({ files, selectedFileId, onSelectFile, onUploadFile }) => {

    const renderItem = ({ item }) => {
        const isSelected = selectedFileId === item.id;
        return (
            <Surface
                style={[styles.card, isSelected && styles.selectedCard]}
                onTouchEnd={() => onSelectFile(item.id)}
                elevation={isSelected ? 2 : 1}
            >
                <View style={styles.cardContent}>
                    <MaterialCommunityIcons
                        name="file-pdf-box"
                        size={24}
                        color={isSelected ? '#6200ee' : '#757575'}
                    />
                    <View style={styles.textContainer}>
                        <Text variant="labelMedium" numberOfLines={1} style={isSelected ? styles.selectedText : null}>
                            {item.name}
                        </Text>
                        <Text variant="bodySmall" style={{ color: '#757575' }}>
                            {item.pageCount} pgs
                        </Text>
                    </View>
                    {isSelected && (
                        <MaterialCommunityIcons name="check-circle" size={18} color="#6200ee" />
                    )}
                </View>
            </Surface>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text variant="titleSmall" style={styles.header}>Inventory</Text>
                <IconButton
                    icon="plus-circle"
                    size={20}
                    iconColor="#6200ee"
                    onPress={onUploadFile}
                    style={{ margin: 0 }}
                />
            </View>

            {Object.keys(files).length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="folder-open-outline" size={32} color="#bdbdbd" style={{ marginBottom: 8 }} />
                    <Text variant="bodySmall" style={{ color: '#9e9e9e', textAlign: 'center' }}>
                        No PDFs.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={Object.values(files)}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 6,
        backgroundColor: '#fff'
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    header: {
        fontWeight: 'bold',
        color: '#333'
    },
    card: {
        marginBottom: 6,
        backgroundColor: '#fff',
        borderRadius: 6,
        padding: 6,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 6,
        marginRight: 4
    },
    selectedCard: {
        borderColor: '#6200ee',
        borderWidth: 1,
        backgroundColor: '#f3e5f5'
    },
    selectedText: {
        color: '#6200ee',
        fontWeight: 'bold'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default FileInventory;
