import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Headline, Text, Button, Card } from 'react-native-paper';

const PageSelector = ({ files, selectedFileId, buildList, onAddPage, onAddAllPages }) => {

    if (!selectedFileId || !files[selectedFileId]) {
        return (
            <View style={styles.emptyContainer}>
                <Text>Please select a PDF from the Files tab first.</Text>
            </View>
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
                    style={[styles.pageCard, used && styles.usedCard]}
                    onPress={used ? null : () => onAddPage(selectedFileId, i)}
                >
                    <Card.Content style={styles.cardContent}>
                        <Text variant="headlineMedium">{i + 1}</Text>
                        <Text variant="labelSmall">{used ? "Added" : "Tap to Add"}</Text>
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

            <Button mode="contained" onPress={() => onAddAllPages(selectedFileId)} style={styles.addAllBtn}>
                Add ALL Pages
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
        backgroundColor: '#f5f5f5',
        padding: 20
    },
    header: {
        marginBottom: 4
    },
    subText: {
        marginBottom: 16,
        color: '#666'
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 20
    },
    pageCard: {
        width: '48%',
        aspectRatio: 1,
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    usedCard: {
        opacity: 0.5,
        backgroundColor: '#e0e0e0'
    },
    cardContent: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    addAllBtn: {
        marginTop: 10,
        marginBottom: 20
    }
});

export default PageSelector;
