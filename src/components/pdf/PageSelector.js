import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Headline, Text, Button, Card, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PageSelector = ({ files, selectedFileId, buildList, onAddPage, onAddAllPages }) => {

    if (!selectedFileId || !files[selectedFileId]) {
        return (
            <Surface style={styles.emptyContainer} elevation={0}>
                <MaterialCommunityIcons name="file-search-outline" size={64} color="#bdbdbd" style={{ marginBottom: 16 }} />
                <Text variant="titleMedium" style={{ color: '#757575', textAlign: 'center' }}>No PDF Selected</Text>
                <Text variant="bodyMedium" style={{ color: '#9e9e9e', textAlign: 'center', marginTop: 8 }}>
                    Go to the "Files" tab and select a document to view its pages here.
                </Text>
            </Surface>
        );
    }

    const file = files[selectedFileId];
    const pageCount = file.pageCount;

    // Check if a page from THIS file is already in the buildList
    const isPageUsed = (pageIndex) => {
        return buildList.some(item => item.fileId === selectedFileId && item.pageIndex === pageIndex);
    };

    const renderPages = () => {
        const pages = [];
        for (let i = 0; i < pageCount; i++) {
            const used = isPageUsed(i);
            pages.push(
                <Card
                    key={i}
                    style={[styles.pageCard, used ? styles.usedCard : styles.activeCard]}
                    onPress={used ? null : () => onAddPage(selectedFileId, i)}
                    elevation={used ? 0 : 2}
                >
                    <Card.Content style={styles.cardContent}>
                        {used ? (
                            <MaterialCommunityIcons name="check-circle" size={32} color="#4caf50" style={{ marginBottom: 4 }} />
                        ) : (
                            <Text variant="headlineMedium" style={{ color: '#6200ee', fontWeight: 'bold' }}>{i + 1}</Text>
                        )}
                        <Text variant="labelSmall" style={{ color: used ? '#4caf50' : '#757575' }}>
                            {used ? "Added" : "Tap to Add"}
                        </Text>
                    </Card.Content>
                </Card>
            );
        }
        return pages;
    };

    return (
        <View style={styles.container}>
            <Headline style={styles.header}>Extract Pages</Headline>
            <Text style={styles.subText}>{file.name}</Text>

            <ScrollView contentContainerStyle={styles.gridContainer}>
                {renderPages()}
            </ScrollView>

            <Button
                mode="contained-tonal"
                icon="playlist-plus"
                onPress={() => onAddAllPages(selectedFileId)}
                style={styles.addAllBtn}
            >
                Add ALL {pageCount} Pages
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingHorizontal: 32
    },
    header: {
        marginBottom: 4,
        fontWeight: 'bold'
    },
    subText: {
        marginBottom: 16,
        color: '#6200ee',
        fontWeight: '500'
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 20
    },
    pageCard: {
        width: '47%',
        aspectRatio: 1,
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    activeCard: {
        backgroundColor: '#fff',
    },
    usedCard: {
        backgroundColor: '#e8f5e9',
        borderWidth: 1,
        borderColor: '#c8e6c9'
    },
    cardContent: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    addAllBtn: {
        marginTop: 10,
        marginBottom: 32,
        paddingVertical: 6,
        borderRadius: 8
    }
});

export default PageSelector;
