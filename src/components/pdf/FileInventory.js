import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Headline, Button, Card, Text, IconButton, Divider } from 'react-native-paper';

const FileInventory = ({ files, selectedFileId, onSelectFile, onUploadFile }) => {

    const renderItem = ({ item }) => (
        <Card
            style={[styles.card, selectedFileId === item.id && styles.selectedCard]}
            onPress={() => onSelectFile(item.id)}
        >
            <Card.Title
                title={item.name}
                subtitle={`${item.pageCount} Pages`}
                left={(props) => <IconButton {...props} icon="file-pdf-box" />}
            />
        </Card>
    );

    return (
        <View style={styles.container}>
            <Headline style={styles.header}>Imported PDFs</Headline>

            {Object.keys(files).length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text variant="bodyMedium">No PDFs imported yet.</Text>
                </View>
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
        marginBottom: 8,
        backgroundColor: '#fff'
    },
    selectedCard: {
        borderColor: '#6200ee',
        borderWidth: 2
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    uploadBtn: {
        marginTop: 16,
        marginBottom: 32
    }
});

export default FileInventory;
