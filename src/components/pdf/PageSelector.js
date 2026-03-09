import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PageSelector = ({ files, selectedFileId, buildList, onAddPage, onAddAllPages }) => {

    if (!selectedFileId || !files[selectedFileId]) {
        return (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-search-outline" size={24} color="#bdbdbd" />
                <Text variant="bodySmall" style={{ color: '#9e9e9e', textAlign: 'center', marginTop: 4 }}>
                    Select PDF
                </Text>
            </View>
        );
    }

    const file = files[selectedFileId];
    const pageCount = file.pageCount;

    const isPageUsed = (pageIndex) => {
        return buildList.some(item => item.fileId === selectedFileId && item.pageIndex === pageIndex);
    };

    const renderPages = () => {
        const pages = [];
        for (let i = 0; i < pageCount; i++) {
            const used = isPageUsed(i);
            pages.push(
                <Surface
                    key={i}
                    style={[styles.pageCard, used ? styles.usedCard : styles.activeCard]}
                    onTouchEnd={used ? null : () => onAddPage(selectedFileId, i)}
                    elevation={used ? 0 : 1}
                >
                    {used ? (
                        <MaterialCommunityIcons name="check-circle" size={16} color="#4caf50" />
                    ) : (
                        <Text variant="labelMedium" style={{ color: '#6200ee', fontWeight: 'bold' }}>{i + 1}</Text>
                    )}
                </Surface>
            );
        }
        return pages;
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text variant="titleSmall" style={styles.header} numberOfLines={1}>Pages</Text>
                <IconButton
                    icon="playlist-plus"
                    size={16}
                    iconColor="#6200ee"
                    onPress={() => onAddAllPages(selectedFileId)}
                    style={{ margin: 0 }}
                />
            </View>

            <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
                {renderPages()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 6,
        backgroundColor: '#fff'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 0,
        marginBottom: 6
    },
    header: {
        fontWeight: 'bold',
        color: '#333',
        flex: 1
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 8
    },
    pageCard: {
        width: '47%',
        aspectRatio: 1,
        marginBottom: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    activeCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    usedCard: {
        backgroundColor: '#e8f5e9',
        borderWidth: 1,
        borderColor: '#c8e6c9'
    }
});

export default PageSelector;
