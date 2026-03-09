import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Headline, Button, Card, Text, IconButton, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BuildList = ({ files, buildList, onRemovePage, onMoveUp, onMoveDown, onGeneratePDF }) => {

    const renderItem = ({ item, index }) => {
        const file = files[item.fileId];
        const fileName = file ? file.name : 'Unknown File';

        return (
            <Card style={styles.card} elevation={2}>
                <Card.Title
                    title={`Page ${item.pageIndex + 1}`}
                    subtitle={fileName}
                    left={(props) => (
                        <View style={styles.rankingCircle}>
                            <Text style={styles.rankingText}>{index + 1}</Text>
                        </View>
                    )}
                    right={(props) => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                            <IconButton icon="arrow-up" disabled={index === 0} onPress={() => onMoveUp(index)} />
                            <IconButton icon="arrow-down" disabled={index === buildList.length - 1} onPress={() => onMoveDown(index)} />
                            <IconButton icon="close" iconColor="red" onPress={() => onRemovePage(index)} />
                        </View>
                    )}
                />
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <Headline style={styles.header}>Assemble Final PDF</Headline>

            {buildList.length === 0 ? (
                <Surface style={styles.emptyContainer} elevation={0}>
                    <MaterialCommunityIcons name="text-box-plus-outline" size={64} color="#bdbdbd" style={{ marginBottom: 16 }} />
                    <Text variant="titleMedium" style={{ color: '#757575', textAlign: 'center' }}>Build List is Empty</Text>
                    <Text variant="bodyMedium" style={{ color: '#9e9e9e', textAlign: 'center', marginTop: 8 }}>
                        Switch to the "Pages" tab to select pages and add them to your final document.
                    </Text>
                </Surface>
            ) : (
                <FlatList
                    data={buildList}
                    keyExtractor={(item, index) => `${item.fileId}-${item.pageIndex}-${index}`}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}

            <Button
                mode="contained"
                icon="printer"
                onPress={onGeneratePDF}
                style={styles.generateBtn}
                disabled={buildList.length === 0}
            >
                Preview & Export PDF
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
        marginBottom: 16,
        fontWeight: 'bold'
    },
    card: {
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    rankingCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3e5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8
    },
    rankingText: {
        color: '#6200ee',
        fontWeight: 'bold',
        fontSize: 16
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingHorizontal: 32
    },
    generateBtn: {
        marginTop: 10,
        marginBottom: 32,
        paddingVertical: 6,
        borderRadius: 8
    }
});

export default BuildList;
