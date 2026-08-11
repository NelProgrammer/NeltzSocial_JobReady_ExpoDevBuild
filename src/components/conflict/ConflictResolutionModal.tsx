// @ts-nocheck
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Portal, Modal, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';
import { ItemConflict } from '../../services/ConflictResolverService';

interface ConflictResolutionModalProps {
    visible: boolean;
    conflict: ItemConflict<any> | null;
    onResolve: (choice: 'local' | 'remote') => void;
    onDismiss: () => void;
}

const ConflictResolutionModal = ({
    visible,
    conflict,
    onResolve,
    onDismiss
}: ConflictResolutionModalProps) => {
    const { theme } = useThemeContext();

    if (!visible || !conflict) return null;

    const { fieldName, localItem, remoteItem } = conflict;

    const formatItemTitle = (item: any) => {
        if (!item) return 'Item Entry';
        return item.Role || item.Organization || item.Institution || item["Qualification Name"] || item.name || item.company || 'Item Entry';
    };

    const formatItemSubtitle = (item: any) => {
        if (!item) return '';
        return item["Key Responsibilities"] || item.contact || item.category || item.Year || '';
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={[styles.iconBadge, { backgroundColor: '#EF444422' }]}>
                            <MaterialCommunityIcons name="alert-decagram-outline" size={26} color="#EF4444" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.textPrimary }}>
                                Data Conflict Detected
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                                Local & online updates collided on section: {fieldName.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {/* Side-by-side comparison */}
                    <View style={styles.comparisonGroup}>
                        {/* Local Version Card */}
                        <TouchableOpacity
                            style={[styles.versionCard, { backgroundColor: theme.bgDark, borderColor: theme.accent }]}
                            onPress={() => onResolve('local')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.badgeRow}>
                                <Text style={[styles.versionTag, { color: theme.accent }]}>📱 LOCAL DEVICE VERSION</Text>
                                <Text style={styles.timestampText}>{localItem.updatedAt ? new Date(localItem.updatedAt).toLocaleTimeString() : 'Recent'}</Text>
                            </View>
                            <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
                                {formatItemTitle(localItem)}
                            </Text>
                            <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]} numberOfLines={2}>
                                {formatItemSubtitle(localItem)}
                            </Text>
                            <Button mode="contained" compact style={{ marginTop: 10, backgroundColor: theme.accent }}>
                                Keep Local Version
                            </Button>
                        </TouchableOpacity>

                        {/* Online Version Card */}
                        <TouchableOpacity
                            style={[styles.versionCard, { backgroundColor: theme.bgDark, borderColor: '#10B981' }]}
                            onPress={() => onResolve('remote')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.badgeRow}>
                                <Text style={[styles.versionTag, { color: '#10B981' }]}>☁️ ONLINE DATABASE VERSION</Text>
                                <Text style={styles.timestampText}>{remoteItem.updatedAt ? new Date(remoteItem.updatedAt).toLocaleTimeString() : 'Online'}</Text>
                            </View>
                            <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
                                {formatItemTitle(remoteItem)}
                            </Text>
                            <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]} numberOfLines={2}>
                                {formatItemSubtitle(remoteItem)}
                            </Text>
                            <Button mode="contained" compact style={{ marginTop: 10, backgroundColor: '#10B981' }}>
                                Accept Online Version
                            </Button>
                        </TouchableOpacity>
                    </View>

                    {/* Cancel Button */}
                    <Button
                        mode="outlined"
                        onPress={onDismiss}
                        style={{ marginTop: 14, borderRadius: 12 }}
                        textColor={theme.textPrimary}
                    >
                        Dismiss / Resolve Later
                    </Button>
                </ScrollView>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { padding: 18, margin: 16, borderRadius: 18, borderWidth: 1, maxHeight: '85%' },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    comparisonGroup: { gap: 12 },
    versionCard: { padding: 14, borderRadius: 14, borderWidth: 1.5 },
    badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    versionTag: { fontSize: 10, fontWeight: 'bold' },
    timestampText: { fontSize: 9, color: '#9CA3AF' },
    itemTitle: { fontSize: 13, fontWeight: 'bold' },
    itemSubtitle: { fontSize: 11, marginTop: 2 }
});

export default ConflictResolutionModal;
