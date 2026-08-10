// @ts-nocheck
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Portal, Modal, Text, Button, Surface, ActivityIndicator, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';
import { saveToDeviceDownloads, saveToAppVault, copyContentToClipboard } from '../../services/ExportEngineService';
import { shareAsync } from 'expo-sharing';

interface ExportActionModalProps {
    visible: boolean;
    onDismiss: () => void;
    fileUri: string | null;
    fileName: string;
    exportFormat: string;
    rawTextContent?: string;
    onOpenPreview?: () => void;
}

const ExportActionModal = ({
    visible,
    onDismiss,
    fileUri,
    fileName,
    exportFormat,
    rawTextContent = '',
    onOpenPreview
}: ExportActionModalProps) => {
    const { theme } = useThemeContext();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    if (!visible || !fileUri) return null;

    const getMimeType = () => {
        if (exportFormat === 'pdf') return 'application/pdf';
        if (exportFormat === 'word_text') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        return 'application/msword';
    };

    const handleSaveDevice = async () => {
        setActionLoading('device');
        const res = await saveToDeviceDownloads(fileUri, fileName, getMimeType());
        setActionLoading(null);
        setToastMessage(res.message);
    };

    const handleSaveVault = async () => {
        setActionLoading('vault');
        const res = await saveToAppVault(fileUri, fileName);
        setActionLoading(null);
        setToastMessage(res.message);
    };

    const handleCopyClipboard = async () => {
        setActionLoading('copy');
        const textToCopy = rawTextContent || fileName;
        const ok = await copyContentToClipboard(textToCopy);
        setActionLoading(null);
        setToastMessage(ok ? "Copied content to clipboard!" : "Could not copy to clipboard");
    };

    const handleExternalShare = async () => {
        try {
            setActionLoading('share');
            await shareAsync(fileUri, {
                mimeType: getMimeType(),
                dialogTitle: `Share ${fileName}`
            });
        } catch (err) {
            console.error(err);
            setToastMessage("Share intent error");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        <View style={[styles.iconBadge, { backgroundColor: theme.accent + '22' }]}>
                            <MaterialCommunityIcons name="file-check-outline" size={28} color={theme.accent} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.textPrimary }}>Document Export Ready</Text>
                            <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                                {fileName}
                            </Text>
                        </View>
                    </View>

                    {/* Action Cards */}
                    <View style={styles.actionList}>
                        {/* Option 1: Direct Save to Device Downloads */}
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}
                            onPress={handleSaveDevice}
                            disabled={actionLoading !== null}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#3B82F622' }]}>
                                {actionLoading === 'device' ? (
                                    <ActivityIndicator size={20} color="#3B82F6" />
                                ) : (
                                    <MaterialCommunityIcons name="download" size={22} color="#3B82F6" />
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.textPrimary }}>
                                    Save Direct to Device Downloads
                                </Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                                    Direct write to your device local storage via SAF
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        {/* Option 2: Add to App Vault & PDF Workbench */}
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}
                            onPress={handleSaveVault}
                            disabled={actionLoading !== null}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#10B98122' }]}>
                                {actionLoading === 'vault' ? (
                                    <ActivityIndicator size={20} color="#10B981" />
                                ) : (
                                    <MaterialCommunityIcons name="folder-sync-outline" size={22} color="#10B981" />
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.textPrimary }}>
                                    Save to App Vault & PDF Workbench
                                </Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                                    Store in local vault for client-side merging and splitting
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        {/* Option 3: Copy Text Content to Clipboard */}
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}
                            onPress={handleCopyClipboard}
                            disabled={actionLoading !== null}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#8B5CF622' }]}>
                                {actionLoading === 'copy' ? (
                                    <ActivityIndicator size={20} color="#8B5CF6" />
                                ) : (
                                    <MaterialCommunityIcons name="content-copy" size={22} color="#8B5CF6" />
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.textPrimary }}>
                                    Copy Content to Clipboard
                                </Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                                    Copy plain text or file data to system clipboard
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        {/* Option 4: Secondary OS Intent Share */}
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}
                            onPress={handleExternalShare}
                            disabled={actionLoading !== null}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#F59E0B22' }]}>
                                {actionLoading === 'share' ? (
                                    <ActivityIndicator size={20} color="#F59E0B" />
                                ) : (
                                    <MaterialCommunityIcons name="share-variant-outline" size={22} color="#F59E0B" />
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.textPrimary }}>
                                    Share via OS Intent (External)
                                </Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                                    Send file to external apps via OS share drawer
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Button
                        mode="contained"
                        onPress={onDismiss}
                        style={{ marginTop: 16, backgroundColor: theme.accent, borderRadius: 16 }}
                    >
                        Done
                    </Button>
                </ScrollView>

                <Snackbar
                    visible={toastMessage !== null}
                    onDismiss={() => setToastMessage(null)}
                    duration={3000}
                    style={{ backgroundColor: theme.bgDark }}
                >
                    {toastMessage}
                </Snackbar>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { padding: 20, margin: 16, borderRadius: 18, borderWidth: 1, maxHeight: '85%' },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    actionList: { gap: 10 },
    actionCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
    actionIconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }
});

export default ExportActionModal;
