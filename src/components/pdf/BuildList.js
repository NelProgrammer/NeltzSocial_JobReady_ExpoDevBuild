import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Headline, Button, Card, Text, IconButton } from 'react-native-paper';

const BuildList = ({ files, buildList, onRemovePage, onMoveUp, onMoveDown, onGeneratePDF }) => {

    const renderItem = ({ item, index }) => {
        const file = files[item.fileId];
        const fileName = file ? file.name : 'Unknown File';

        return (
            <Card style={styles.card}>
                <Card.Title
                    title={`Page ${item.pageIndex + 1}`}
                    subtitle={fileName}
                    left={(props) => <IconButton {...props} icon="file-document" />}
                    right={(props) => (
                        <View style={{ flexDirection: 'row' }}>
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
                <View style={styles.emptyContainer}>
                    <Text variant="bodyMedium">No pages added to build yet.</Text>
                </View>
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
        marginBottom: 16
    },
    card: {
        marginBottom: 10,
        backgroundColor: '#fff'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    generateBtn: {
        marginTop: 10,
        marginBottom: 30
    }
});

export default BuildList;
