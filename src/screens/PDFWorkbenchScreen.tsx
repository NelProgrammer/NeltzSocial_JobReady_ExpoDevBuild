import React, { useState, useContext, useLayoutEffect, useRef } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { Appbar, Text, Button, Surface, ActivityIndicator, IconButton, Portal, Modal, RadioButton, Switch } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { PDFDocument } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import SmartPreviewer from '../components/preview/SmartPreviewer';
import FileInventory from '../components/pdf/FileInventory';
import PageSelector from '../components/pdf/PageSelector';
import BuildList from '../components/pdf/BuildList';
import { useThemeContext } from '../context/ThemeContext';

const PDFWorkbenchScreen = ({ navigation }: { navigation: any }) => {
    const insets = useSafeAreaInsets();
    const { theme } = useThemeContext();
    const [files, setFiles] = useState<Record<string, any>>({});
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [buildList, setBuildList] = useState<{ fileId: string; pageIndex: number }[]>([]);
    const [selectedBuildIndex, setSelectedBuildIndex] = useState<number | null>(null);
    const [previewBase64, setPreviewBase64] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeSide, setActiveSide] = useState('source'); // 'source' or 'target'
    const [pdfJsSource, setPdfJsSource] = useState('');
    const [pdfWorkerSource, setPdfWorkerSource] = useState('');

    // Viewer settings
    const [fitMode, setFitMode] = useState<'page' | 'a4' | 'width'>('a4'); // 'a4' (A4 proportional fit - 1:1.414) default
    const [enableScroll, setEnableScroll] = useState(false); // Single page / locked scroll is default
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);

    // Draggable modal gesture
    const pan = useRef(new Animated.ValueXY()).current;
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value || 0,
                    y: (pan.y as any)._value || 0
                });
            },
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: () => {
                pan.flattenOffset();
            }
        })
    ).current;

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <IconButton
                    icon="cog"
                    iconColor="#fff"
                    size={22}
                    onPress={() => setIsSettingsOpen(true)}
                />
            )
        });
    }, [navigation]);

    React.useEffect(() => {
        const loadPdfJsAssets = async () => {
            try {
                const pdfJsAsset = Asset.fromModule(require('../assets/pdfjs/pdf.min.js.txt'));
                const pdfWorkerAsset = Asset.fromModule(require('../assets/pdfjs/pdf.worker.min.js.txt'));

                await Promise.all([pdfJsAsset.downloadAsync(), pdfWorkerAsset.downloadAsync()]);

                const getSource = async (asset: any): Promise<string> => {
                    // In Dev mode, localUri might be an http URL (from Metro)
                    // FileSystem.readAsStringAsync only works on file:// URIs
                    if (asset.localUri && asset.localUri.startsWith('file')) {
                        return await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
                    } else {
                        // Fallback for http URIs or missing localUri: fetch the content
                        const response = await fetch(asset.uri);
                        const blob = await response.blob();
                        return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const resultStr = typeof reader.result === 'string' ? reader.result : '';
                                const base64 = resultStr.split(',')[1] || '';
                                resolve(base64);
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                    }
                };

                const [jsSource, workerSource] = await Promise.all([
                    getSource(pdfJsAsset),
                    getSource(pdfWorkerAsset)
                ]);

                setPdfJsSource(jsSource);
                setPdfWorkerSource(workerSource);
            } catch (err) {
                console.error("Error loading local PDF.js assets:", err);
            }
        };

        loadPdfJsAssets();
    }, []);

    // Live Preview Generator
    React.useEffect(() => {
        let isMounted = true;

        const generateLivePreview = async () => {
            if (activeSide === 'source') {
                if (!selectedFileId || !files[selectedFileId]) {
                    if (isMounted) setPreviewBase64(null);
                    return;
                }
                // Show raw source file using its cached base64
                if (isMounted) setPreviewBase64(files[selectedFileId].base64);
                return;
            }

            // activeSide === 'target'
            if (buildList.length === 0) {
                if (isMounted) setPreviewBase64(null);
                return;
            }
            if (isMounted) setIsGenerating(true);
            try {
                const newPdfDoc = await PDFDocument.create();
                const loadedDocs: Record<string, PDFDocument> = {};

                for (const item of buildList) {
                    const file = files[item.fileId];
                    if (!file) continue;

                    if (!loadedDocs[file.id]) {
                        loadedDocs[file.id] = await PDFDocument.load(file.base64);
                    }

                    const sourceDoc = loadedDocs[file.id];
                    const [copiedPage] = await newPdfDoc.copyPages(sourceDoc, [item.pageIndex]);
                    newPdfDoc.addPage(copiedPage);
                }

                const base64Data = await newPdfDoc.saveAsBase64();
                if (isMounted) setPreviewBase64(base64Data);
            } catch (error) {
                console.error("Live Preview Error:", error);
            } finally {
                if (isMounted) setIsGenerating(false);
            }
        };

        generateLivePreview();

        return () => {
            isMounted = false;
        };
    }, [buildList, files, activeSide, selectedFileId]);

    // Force glow logic to source panel if list is emptied
    React.useEffect(() => {
        if (buildList.length === 0 && activeSide === 'target') {
            setActiveSide('source');
        }
    }, [buildList.length]);

    // 1. Upload Logic
    const handleUploadFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const asset = result.assets[0];

            const fileUri = asset.uri;
            const fileBase64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
            const pdfDoc = await PDFDocument.load(fileBase64);
            const pageCount = pdfDoc.getPageCount();

            const newFile = {
                id: `pdf_${Date.now()}`,
                name: asset.name,
                uri: fileUri,
                pageCount: pageCount,
                base64: fileBase64
            };

            setFiles(prev => ({ ...prev, [newFile.id]: newFile }));
            setSelectedFileId(newFile.id);
            setActiveSide('source');

        } catch (error) {
            console.error("Error loading PDF:", error);
            Alert.alert("Error", "Could not load the PDF file. Please ensure it is a valid PDF.");
        }
    };

    // 2. Select File Logic 
    const handleSelectFile = (fileId: string) => {
        setSelectedFileId(fileId);
        setActiveSide('source');
    };

    // 3. Page Selection Logic
    const handleAddPage = (fileId: string, pageIndex: number) => {
        setBuildList(prev => [...prev, { fileId, pageIndex }]);
        setActiveSide('target');
    };

    const handleAddAllPages = (fileId: string) => {
        const file = files[fileId];
        if (!file) return;

        const newPages: { fileId: string; pageIndex: number }[] = [];
        for (let i = 0; i < file.pageCount; i++) {
            const isUsed = buildList.some(item => item.fileId === fileId && item.pageIndex === i);
            if (!isUsed) {
                newPages.push({ fileId, pageIndex: i });
            }
        }

        setBuildList(prev => [...prev, ...newPages]);
        setActiveSide('target');
    };

    // 4. Build List Management
    const handleRemovePage = (indexToRemove: number) => {
        setBuildList(prev => {
            const newList = prev.filter((_, idx) => idx !== indexToRemove);
            if (newList.length === 0) setActiveSide('source');
            return newList;
        });
        setSelectedBuildIndex(prev => {
            if (prev === null) return null;
            if (prev === indexToRemove) return null;
            if (prev > indexToRemove) return prev - 1;
            return prev;
        });
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        setBuildList(prev => {
            const arr = [...prev];
            [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
            return arr;
        });
        setSelectedBuildIndex(index - 1);
        setActiveSide('target');
    };

    const handleMoveDown = (index: number) => {
        if (index === buildList.length - 1) return;
        setBuildList(prev => {
            const arr = [...prev];
            [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
            return arr;
        });
        setSelectedBuildIndex(index + 1);
        setActiveSide('target');
    };

    const handleRemoveFile = (fileIdToRemove: string) => {
        setFiles(prev => {
            const nextFiles = { ...prev };
            delete nextFiles[fileIdToRemove];
            return nextFiles;
        });
        setBuildList(prev => {
            const newList = prev.filter(item => item.fileId !== fileIdToRemove);
            if (newList.length === 0) setActiveSide('source');
            return newList;
        });
        if (selectedFileId === fileIdToRemove) {
            const remainingKeys = Object.keys(files).filter(id => id !== fileIdToRemove);
            setSelectedFileId(remainingKeys.length > 0 ? remainingKeys[0] : null);
        }
    };

    // 5. Generation Logic
    const handleGeneratePDF = async () => {
        try {
            Alert.alert("Processing", "Generating your combined PDF...");

            const newPdfDoc = await PDFDocument.create();
            const loadedDocs: Record<string, PDFDocument> = {};

            for (const item of buildList) {
                const file = files[item.fileId];
                if (!file) continue;

                if (!loadedDocs[file.id]) {
                    loadedDocs[file.id] = await PDFDocument.load(file.base64);
                }

                const sourceDoc = loadedDocs[file.id];
                const [copiedPage] = await newPdfDoc.copyPages(sourceDoc, [item.pageIndex]);
                newPdfDoc.addPage(copiedPage);
            }

            const pdfBase64Data = await newPdfDoc.saveAsBase64();

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileUri = `${FileSystem.documentDirectory}Combined_PDF_${timestamp}.pdf`;

            await FileSystem.writeAsStringAsync(fileUri, pdfBase64Data, {
                encoding: FileSystem.EncodingType.Base64,
            });

            await shareAsync(fileUri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error) {
            console.error("PDF Generation Error:", error);
            Alert.alert("Error", "Failed to generate the combined PDF.");
        }
    };

    const isSourceGlowing = activeSide === 'source' && Object.keys(files).length > 0;
    const isTargetGlowing = activeSide === 'target' && buildList.length > 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.bgDark, paddingTop: Math.max(insets.top, 16) + 8 }]}>
            {/* Header Banner */}
            {!isFullScreenPreview && (
                <View style={[styles.headerBanner, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={[styles.navBtn, { backgroundColor: theme.bgDark, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub')} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.textPrimary} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>PDF Workbench</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Client-Side Offline Processing</Text>
                        </View>
                        <View style={[styles.themeBadge, { backgroundColor: '#10b981' }]}>
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>100% Offline</Text>
                        </View>
                    </View>
                    <Text style={[styles.subtitleCentered, { color: theme.textSecondary }]}>Merge documents, split pages, and reorder files</Text>
                </View>
            )}

            {/* Body Card Container */}
            <View style={[styles.bodyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border, marginBottom: 60 + Math.max(insets.bottom, 0) }, isFullScreenPreview && { marginHorizontal: 4, marginTop: 4, marginBottom: 60 + Math.max(insets.bottom, 0) }]}>
                <View style={[styles.gridContainer, { paddingBottom: 0 }]}>
                    {/* Top Half: Inventory & Pages (Hidden in Full Screen Preview Mode) */}
                    {!isFullScreenPreview && (
                        <View style={styles.topHalf}>
                            <Surface style={[styles.inventoryPane, { backgroundColor: theme.bgDark, borderColor: theme.border }, isSourceGlowing && styles.glowSource]} elevation={2}>
                                <FileInventory
                                    files={files}
                                    selectedFileId={selectedFileId}
                                    onSelectFile={handleSelectFile}
                                    onUploadFile={handleUploadFile}
                                    onRemoveFile={handleRemoveFile}
                                />
                            </Surface>
                            <Surface style={[styles.pagesPane, { backgroundColor: theme.bgDark, borderColor: theme.border }, isSourceGlowing && styles.glowSource]} elevation={2}>
                                <PageSelector
                                    files={files}
                                    selectedFileId={selectedFileId}
                                    buildList={buildList}
                                    onAddPage={handleAddPage}
                                    onAddAllPages={handleAddAllPages}
                                />
                            </Surface>
                        </View>
                    )}

                    {/* Bottom Half: Build List & Live Preview */}
                    <View style={[styles.bottomHalf, isFullScreenPreview && { flex: 1 }]}>
                        {!isFullScreenPreview && (
                            <Surface style={[styles.buildListPane, { backgroundColor: theme.bgDark, borderColor: theme.border }, isTargetGlowing && styles.glowTarget]} elevation={2}>
                                <BuildList
                                    files={files}
                                    buildList={buildList}
                                    selectedIndex={selectedBuildIndex}
                                    onSelectIndex={(index: number) => {
                                        setSelectedBuildIndex(index);
                                        setActiveSide('target');
                                    }}
                                    onRemovePage={handleRemovePage}
                                    onMoveUp={handleMoveUp}
                                    onMoveDown={handleMoveDown}
                                />
                            </Surface>
                        )}

                        <Surface 
                            style={[
                                styles.previewPane, 
                                { backgroundColor: theme.bgDark, borderColor: theme.border },
                                isFullScreenPreview && styles.fullScreenPreviewPane,
                                isSourceGlowing && styles.glowSource, 
                                isTargetGlowing && styles.glowTarget
                            ]} 
                            elevation={2}
                        >
                            <View style={styles.previewHeaderRow}>
                                <Text variant="labelMedium" style={{ fontWeight: 'bold', color: theme.textPrimary }}>
                                    {isFullScreenPreview ? 'Full Screen Preview' : 'Preview'}
                                </Text>
                                <IconButton
                                    icon={isFullScreenPreview ? "fullscreen-exit" : "fullscreen"}
                                    size={18}
                                    iconColor={theme.accent}
                                    onPress={() => setIsFullScreenPreview(!isFullScreenPreview)}
                                    style={{ margin: 0 }}
                                />
                            </View>

                            <TouchableOpacity 
                                style={styles.previewDirectContainer}
                                activeOpacity={1}
                                onLongPress={() => setIsSettingsOpen(true)}
                                delayLongPress={500}
                            >
                                {previewBase64 === null && !isGenerating ? (
                                    <View style={styles.emptyPreviewCenter}>
                                        <MaterialCommunityIcons name="file-pdf-box" size={64} color="#757575" />
                                        <Text variant="bodyMedium" style={{ marginTop: 8, color: '#757575' }}>
                                            {activeSide === 'source' ? 'No PDF Selected' : 'No Pages Added'}
                                        </Text>
                                    </View>
                                ) : (
                                    <SmartPreviewer
                                        mode="workbook"
                                        pdfUri={previewBase64 ? `data:application/pdf;base64,${previewBase64}` : null}
                                        isGenerating={isGenerating}
                                        buildList={buildList}
                                        fitMode={fitMode}
                                        enableScroll={enableScroll}
                                    />
                                )}
                            </TouchableOpacity>

                            <Button
                                mode="contained"
                                icon="export"
                                onPress={handleGeneratePDF}
                                disabled={buildList.length === 0}
                                style={{ marginHorizontal: 8, marginBottom: 8, borderRadius: 8, backgroundColor: theme.accent }}
                            >
                                Export PDF
                            </Button>
                        </Surface>
                    </View>
                </View>
            </View>

            {/* Persistent Sticky Footer Card */}
            <View style={[styles.footerCard, { backgroundColor: theme.bgDark, borderColor: theme.border, height: 56 + Math.max(insets.bottom, 0), paddingBottom: Math.max(insets.bottom, 4) }]}>
                <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub')} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="home-outline" size={22} color={theme.textPrimary} />
                </TouchableOpacity>

                <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>PDF Workbench Suite</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 10 }}>JobReady Hub</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => setIsFullScreenPreview(!isFullScreenPreview)} activeOpacity={0.7}>
                        <MaterialCommunityIcons name={isFullScreenPreview ? "fullscreen-exit" : "crop-free"} size={22} color={theme.accent} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub', { openSettings: true })} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="cog-outline" size={22} color={theme.accent} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Viewer Settings Modal Overlay (Draggable) */}
            {isSettingsOpen && (
                <View style={styles.overlayBackdrop}>
                    <Animated.View 
                        style={[
                            styles.modalContent,
                            pan.getLayout()
                        ]}
                        {...panResponder.panHandlers}
                    >
                        <View style={styles.modalHeaderRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons name="drag" size={20} color="#757575" style={{ marginRight: 4 }} />
                                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Viewer Settings</Text>
                            </View>
                            <IconButton icon="close" size={20} onPress={() => setIsSettingsOpen(false)} />
                        </View>

                        <Text variant="labelLarge" style={styles.settingsLabel}>Scale Mode</Text>
                        <RadioButton.Group onValueChange={(val: any) => setFitMode(val)} value={fitMode}>
                            <TouchableOpacity style={styles.radioOption} onPress={() => setFitMode('a4')}>
                                <RadioButton value="a4" />
                                <Text variant="bodyMedium">A4 Proportional Fit (1 : 1.414)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.radioOption} onPress={() => setFitMode('page')}>
                                <RadioButton value="page" />
                                <Text variant="bodyMedium">Fit Page (100% Visible)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.radioOption} onPress={() => setFitMode('width')}>
                                <RadioButton value="width" />
                                <Text variant="bodyMedium">Fill Width (100% Width)</Text>
                            </TouchableOpacity>
                        </RadioButton.Group>

                        <View style={styles.switchRow}>
                            <Text variant="labelLarge" style={styles.settingsLabel}>Enable PDF Scrolling</Text>
                            <Switch value={enableScroll} onValueChange={setEnableScroll} color="#6200ee" />
                        </View>

                        <View style={styles.switchRow}>
                            <Text variant="labelLarge" style={styles.settingsLabel}>Full Screen Preview Mode</Text>
                            <Switch value={isFullScreenPreview} onValueChange={setIsFullScreenPreview} color="#0288d1" />
                        </View>
                    </Animated.View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBanner: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    navBtn: {
        padding: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    themeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    subtitleCentered: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 6,
        fontWeight: '500',
    },
    bodyCard: {
        flex: 1,
        marginHorizontal: 8,
        marginTop: 8,
        marginBottom: 60,
        borderRadius: 20,
        borderWidth: 1.5,
        padding: 8,
        overflow: 'hidden',
    },
    footerCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1.5,
        zIndex: 100,
        elevation: 10,
    },
    footerIconBtn: {
        padding: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    gridContainer: {
        flex: 1,
        padding: 6,
        gap: 6,
    },
    topHalf: {
        flex: 4,
        flexDirection: 'row',
        gap: 6,
    },
    bottomHalf: {
        flex: 6,
        flexDirection: 'row',
        gap: 6,
    },
    inventoryPane: {
        flex: 6,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    pagesPane: {
        flex: 4,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    buildListPane: {
        flex: 3.5,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    previewPane: {
        flex: 6.5,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        padding: 6,
        justifyContent: 'space-between',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    fullScreenPreviewPane: {
        flex: 1,
        width: '100%',
        height: '100%'
    },
    previewHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2
    },
    previewDirectContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#525659',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
        justifyContent: 'flex-start',
        alignItems: 'flex-start'
    },
    emptyPreviewCenter: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        padding: 16,
        backgroundColor: '#fff'
    },
    exportBtn: {
        borderRadius: 8,
        paddingVertical: 4
    },
    glowSource: {
        borderColor: '#7b1fa2', // Deep Purple
        borderWidth: 4,
    },
    glowTarget: {
        borderColor: '#0288d1', // Sky Blue
        borderWidth: 4,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 12,
        width: '85%'
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    settingsLabel: {
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 6,
        color: '#333'
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    floatingSettingsBtn: {
        position: 'absolute',
        top: 6,
        right: 6,
        zIndex: 20,
        margin: 0
    },
    overlayBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    }
});

export default PDFWorkbenchScreen;
