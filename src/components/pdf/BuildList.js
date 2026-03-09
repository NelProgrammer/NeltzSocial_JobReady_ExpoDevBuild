import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BuildList = ({ files, buildList, onRemovePage, onMoveUp, onMoveDown }) => {

    const renderItem = ({ item, index }) => {
        const file = files[item.fileId];
        const fileName = file ? file.name : 'Unknown';

        return (
            <Surface style={styles.card} elevation={1}>
                <View style={styles.rankingCircle}>
                    <Text style={styles.rankingText}>{index + 1}</Text>
                </View>

                <View style={styles.textContainer}>
                    <Text variant="labelSmall" numberOfLines={1}>Pg {item.pageIndex + 1}</Text>
                    <Text variant="bodySmall" style={styles.fileName} numberOfLines={1}>{fileName}</Text>
                </View>

                <View style={styles.actions}>
                    <IconButton icon="arrow-up" size={14} disabled={index === 0} onPress={() => onMoveUp(index)} style={styles.iconBtn} />
                    <IconButton icon="arrow-down" size={14} disabled={index === buildList.length - 1} onPress={() => onMoveDown(index)} style={styles.iconBtn} />
                    <IconButton icon="close" iconColor="red" size={14} onPress={() => onRemovePage(index)} style={styles.iconBtn} />
                </View>
            </Surface>
        );
    };

    return (
        <View style={styles.container}>
            <Text variant="titleSmall" style={styles.header}>Build List</Text>

            {buildList.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="text-box-plus-outline" size={24} color="#bdbdbd" />
                    <Text variant="bodySmall" style={{ color: '#9e9e9e', textAlign: 'center', marginTop: 4 }}>
                        Empty
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={buildList}
                    keyExtractor={(item, index) => `${item.fileId}-${item.pageIndex}-${index}`}
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
    header: {
        marginBottom: 6,
        fontWeight: 'bold',
        color: '#333'
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        backgroundColor: '#fff',
        borderRadius: 6,
        padding: 4,
    },
    rankingCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#f3e5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankingText: {
        color: '#6200ee',
        fontWeight: 'bold',
        fontSize: 10
    },
    textContainer: {
        flex: 1,
        marginLeft: 6,
        justifyContent: 'center'
    },
    fileName: {
        color: '#757575',
        fontSize: 9
    },
    actions: {
        flexDirection: 'column',
        alignItems: 'center'
    },
    iconBtn: {
        margin: -6,
        padding: 0,
        width: 24,
        height: 24
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default BuildList;
