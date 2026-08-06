// @ts-nocheck
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BuildListProps {
    files: any;
    buildList: any[];
    selectedIndex?: number | null;
    onSelectIndex: (index: number) => void;
    onRemovePage: (index: number) => void;
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
}

const BuildList: React.FC<BuildListProps> = ({ 
    files, 
    buildList, 
    selectedIndex = null, 
    onSelectIndex, 
    onRemovePage, 
    onMoveUp, 
    onMoveDown 
}) => {

    const renderItem = ({ item, index }) => {
        const file = files[item.fileId];
        const fileName = file ? file.name : 'Unknown';
        const isSelected = selectedIndex === index;

        return (
            <TouchableOpacity
                onPress={() => onSelectIndex && onSelectIndex(index)}
                activeOpacity={0.8}
            >
                <Surface style={[styles.card, isSelected && styles.selectedCard]} elevation={isSelected ? 3 : 1}>
                    <MaterialCommunityIcons 
                        name="drag-vertical" 
                        size={18} 
                        color={isSelected ? '#0288d1' : '#bdbdbd'} 
                        style={{ marginRight: 2 }} 
                    />
                    <View style={[styles.rankingCircle, isSelected && styles.selectedCircle]}>
                        <Text style={[styles.rankingText, isSelected && styles.selectedRankingText]}>{index + 1}</Text>
                    </View>

                    <View style={styles.textContainer}>
                        <Text variant="labelSmall" numberOfLines={1} style={isSelected ? styles.selectedTitleText : null}>
                            Pg {item.pageIndex + 1}
                        </Text>
                        <Text variant="bodySmall" style={styles.fileName} numberOfLines={1}>{fileName}</Text>
                    </View>

                    <IconButton 
                        icon="close" 
                        iconColor={isSelected ? '#d32f2f' : '#757575'} 
                        size={16} 
                        onPress={(e) => {
                            e?.stopPropagation?.();
                            onRemovePage(index);
                        }} 
                        style={styles.iconBtn} 
                    />
                </Surface>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text variant="titleSmall" style={styles.header}>Build List</Text>
                
                {buildList.length > 0 && (
                    <View style={styles.headerActions}>
                        <IconButton
                            icon="arrow-up"
                            size={16}
                            iconColor="#0288d1"
                            disabled={selectedIndex === null || selectedIndex === 0}
                            onPress={() => selectedIndex !== null && onMoveUp(selectedIndex)}
                            style={styles.headerActionBtn}
                        />
                        <IconButton
                            icon="arrow-down"
                            size={16}
                            iconColor="#0288d1"
                            disabled={selectedIndex === null || selectedIndex === buildList.length - 1}
                            onPress={() => selectedIndex !== null && onMoveDown(selectedIndex)}
                            style={styles.headerActionBtn}
                        />
                    </View>
                )}
            </View>

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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerActionBtn: {
        margin: 0,
        padding: 0,
        width: 24,
        height: 24
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        backgroundColor: '#fff',
        borderRadius: 6,
        padding: 6,
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    selectedCard: {
        borderColor: '#0288d1',
        borderWidth: 2,
        backgroundColor: '#e1f5fe' // Light Sky Blue highlight
    },
    rankingCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedCircle: {
        backgroundColor: '#0288d1'
    },
    rankingText: {
        color: '#555',
        fontWeight: 'bold',
        fontSize: 10
    },
    selectedRankingText: {
        color: '#fff'
    },
    selectedTitleText: {
        color: '#0288d1',
        fontWeight: 'bold'
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
    iconBtn: {
        margin: 0,
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
