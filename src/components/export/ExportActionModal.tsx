// @ts-nocheck
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Portal, Modal, Text, Button, ActivityIndicator, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';
import { saveToDeviceDirectory, saveToCloudProvider, copyContentToClipboard } from '../../services/ExportEngineService';
import { shareAsync } from 'expo-sharing';

interface ExportActionModalProps {
    visible: boolean;
    onDismiss: () => void;
    fileUri: string | null;
    fileName: string;
    exportFormat: string;
    moduleDomain?: 'Resumes' | 'PDF_Workbench';
    rawTextContent?: string;
}

const ExportActionModal = ({
    visible,
    onDismiss,
    fileUri,
    fileName,
    exportFormat,
    moduleDomain = 'Resumes',
    rawTextContent = ''
}: ExportActionModalProps) => {
    const { theme } = useThemeContext();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isCloudExpanded, setIsCloudExpanded] = useState<boolean>(false);

    if (!visible || !fileUri) return null;

    const getMimeType = () => {
        if (exportFormat === 'pdf') return 'application/pdf';
        if (exportFormat === 'word_text') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        return 'application/msword';
    };

    const handleSaveToDirectory = async (rootDir: 'documents' | 'downloads') => {
        setActionLoading(rootDir);
        const res = await saveToDeviceDirectory(fileUri, fileName, rootDir, moduleDomain, getMimeType());
        setActionLoading(null);
        setToastMessage(res.message);
    };

    const handleCloudUpload = async (provider: 'gdrive' | 'onedrive' | 'dropbox') => {
        setActionLoading(provider);
        const res = await saveToCloudProvider(fileUri, fileName, provider, getMimeType());
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
                            <MaterialCommunityIcons name="file-export-outline" size={26} color={theme.accent} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.textPrimary }}>Export Document</Text>
                            <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                                {fileName}
                            </Text>
                        </View>
                    </View>

                    {/* Menu Options */}
                    <View style={styles.actionList}>
                        {/* Option 1: Save to Documents */}
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}
                            onPress={() => handleSaveToDirectory('documents')}
                            disabled={actionLoading !== null}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#3B82F622' }]}>
                                {actionLoading === 'documents' ? (
                                    <ActivityIndicator size={20} color="#3B82F6" />
                                ) : (
                                    <MaterialCommunityIcons name="folder-outline" size={22} color="#3B82F6" />
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.textPrimary }}>
                                    Save to Documents
                                </Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                                    Saves directly to /Documents/Neltz_Social/{moduleDomain}/
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        {/* Option 2: Save to Downloads */}
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}
                            onPress={() => handleSaveToDirectory('downloads')}
                            disabled={actionLoading !== null}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#10B98122' }]}>
                                {actionLoading === 'downloads' ? (
                                    <ActivityIndicator size={20} color="#10B981" />
                                ) : (
                                    <MaterialCommunityIcons name="download-outline" size={22} color="#10B981" />
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.textPrimary }}>
                                    Save to Downloads
                                </Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                                    Saves directly to /Downloads/Neltz_Social/{moduleDomain}/
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        {/* Option 3: Save to Cloud (Expandable) */}
                        <View style={[styles.cloudWrapper, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                            <TouchableOpacity
                                style={styles.actionCardInner}
                                onPress={() => setIsCloudExpanded(!isCloudExpanded)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.actionIconContainer, { backgroundColor: '#0EA5E922' }]}>
                                    <MaterialCommunityIcons name="cloud-upload-outline" size={22} color="#0EA5E9" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.textPrimary }}>
                                        Save to Cloud
                                    </Text>
                                    <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                                        Google Drive, MS OneDrive, Dropbox
                                    </Text>
                                </View>
                                <MaterialCommunityIcons
                                    name={isCloudExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={theme.textSecondary}
                                />
                            </TouchableOpacity>

                            {/* Cloud Expandable Sub-Menu */}
                            {isCloudExpanded && (
                                <View style={styles.cloudSubList}>
                                    <TouchableOpacity
                                        style={[styles.cloudSubCard, { borderColor: theme.border }]}
                                        onPress={() => handleCloudUpload('gdrive')}
                                        disabled={actionLoading !== null}
                                    >
                                        <MaterialCommunityIcons name="google-drive" size={18} color="#4285F4" />
                                        <Text style={styles.cloudSubText}>Google Drive</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.cloudSubCard, { borderColor: theme.border }]}
                                        onPress={() => handleCloudUpload('onedrive')}
                                        disabled={actionLoading !== null}
                                    >
                                        <MaterialCommunityIcons name="microsoft-onedrive" size={18} color="#0078D4" />
                                        <Text style={styles.cloudSubText}>MS OneDrive</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.cloudSubCard, { borderColor: theme.border }]}
                                        onPress={() => handleCloudUpload('dropbox')}
                                        disabled={actionLoading !== null}
                                    >
                                        <MaterialCommunityIcons name="dropbox" size={18} color="#0061FF" />
                                        <Text style={styles.cloudSubText}>Dropbox</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Option 4: Copy Content to Clipboard */}
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

                        {/* Option 5: Share Via OS Intent (External) */}
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
                                    Share Via OS Intent (External)
                                </Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                                    Send file to external apps via OS share drawer
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Action Controls */}
                    <View style={styles.buttonRow}>
                        <Button
                            mode="outlined"
                            onPress={onDismiss}
                            style={styles.controlBtn}
                            textColor={theme.textSecondary}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={onDismiss}
                            style={[styles.controlBtn, { backgroundColor: theme.accent }]}
                        >
                            Done
                        </Button>
                    </View>
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
    modalContainer: { padding: 20, margin: 16, borderRadius: 18, borderWidth: 1, maxHeight: '88%' },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    actionList: { gap: 10 },
    actionCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
    actionCardInner: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    actionIconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    cloudWrapper: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
    cloudSubList: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
    cloudSubCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, borderWidth: 1, backgroundColor: '#ffffff0a' },
    cloudSubText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 18 },
    controlBtn: { borderRadius: 14, paddingHorizontal: 8 }
});

export default ExportActionModal;
