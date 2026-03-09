import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Headline, Button, Card, Text, IconButton, Divider, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FileInventory = ({ files, selectedFileId, onSelectFile, onUploadFile }) => {

    const renderItem = ({ item }) => {
        const isSelected = selectedFileId === item.id;
        return (
            <Card
                style={[styles.card, isSelected && styles.selectedCard]}
                onPress={() => onSelectFile(item.id)}
                elevation={isSelected ? 4 : 1}
            >
                <Card.Title
                    title={item.name}
                    titleStyle={isSelected ? styles.selectedText : null}
                    subtitle={`${item.pageCount} Pages`}
                    left={(props) => <IconButton {...props} icon="file-pdf-box" iconColor={isSelected ? '#6200ee' : '#757575'} />}
                    right={(props) => isSelected ? <MaterialCommunityIcons {...props} name="check-circle" size={24} color="#6200ee" style={{ marginRight: 16 }} /> : null}
                />
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <Headline style={styles.header}>Imported PDFs</Headline>

            {Object.keys(files).length === 0 ? (
                <Surface style={styles.emptyContainer} elevation={0}>
                    <MaterialCommunityIcons name="file-document-multiple-outline" size={64} color="#bdbdbd" style={{ marginBottom: 16 }} />
                    <Text variant="titleMedium" style={{ color: '#757575' }}>No PDFs imported yet</Text>
                    <Text variant="bodyMedium" style={{ color: '#9e9e9e', textAlign: 'center', marginTop: 8 }}>
                        Tap the button below to select a PDF from your device.
                    </Text>
                </Surface>
            ) : (
                <FlatList
                    data={Object.values(files)}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ItemSeparatorComponent={Divider}
                />
            )}

            <Button
                mode="contained"
                icon="upload"
                onPress={onUploadFile}
                style={styles.uploadBtn}
            >
                Import PDF
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5'
    },
    header: {
        marginBottom: 16
    },
    card: {
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    selectedCard: {
        borderColor: '#6200ee',
        borderWidth: 2,
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
        backgroundColor: 'transparent',
        paddingHorizontal: 32
    },
    uploadBtn: {
        marginTop: 16,
        marginBottom: 32,
        paddingVertical: 6,
        borderRadius: 8
    }
});

export default FileInventory;
