import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Appbar, Text, Button, Surface, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { PDFDocument } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import WorkbookVignette from '../components/preview/WorkbookVignette';

import FileInventory from '../components/pdf/FileInventory';
import PageSelector from '../components/pdf/PageSelector';
import BuildList from '../components/pdf/BuildList';

const PDFWorkbenchScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [files, setFiles] = useState({});
    const [selectedFileId, setSelectedFileId] = useState(null);
    const [buildList, setBuildList] = useState([]);
    const [previewBase64, setPreviewBase64] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeSide, setActiveSide] = useState('source'); // 'source' or 'target'
    const [pdfJsSource, setPdfJsSource] = useState('');
    const [pdfWorkerSource, setPdfWorkerSource] = useState('');

    React.useEffect(() => {
        const loadPdfJsAssets = async () => {
            try {
                const pdfJsAsset = Asset.fromModule(require('../assets/pdfjs/pdf.min.js.txt'));
                const pdfWorkerAsset = Asset.fromModule(require('../assets/pdfjs/pdf.worker.min.js.txt'));

                await Promise.all([pdfJsAsset.downloadAsync(), pdfWorkerAsset.downloadAsync()]);

                const getSource = async (asset) => {
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
                                const base64 = reader.result.split(',')[1];
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
                const loadedDocs = {};

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
    const handleSelectFile = (fileId) => {
        setSelectedFileId(fileId);
        setActiveSide('source');
    };

    // 3. Page Selection Logic
    const handleAddPage = (fileId, pageIndex) => {
        setBuildList(prev => [...prev, { fileId, pageIndex }]);
        setActiveSide('target');
    };

    const handleAddAllPages = (fileId) => {
        const file = files[fileId];
        if (!file) return;

        const newPages = [];
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
    const handleRemovePage = (indexToRemove) => {
        setBuildList(prev => {
            const newList = prev.filter((_, idx) => idx !== indexToRemove);
            if (newList.length === 0) setActiveSide('source');
            return newList;
        });
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        setBuildList(prev => {
            const arr = [...prev];
            [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
            return arr;
        });
        setActiveSide('target');
    };

    const handleMoveDown = (index) => {
        if (index === buildList.length - 1) return;
        setBuildList(prev => {
            const arr = [...prev];
            [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
            return arr;
        });
        setActiveSide('target');
    };

    // 5. Generation Logic
    const handleGeneratePDF = async () => {
        try {
            Alert.alert("Processing", "Generating your combined PDF...");

            const newPdfDoc = await PDFDocument.create();
            const loadedDocs = {};

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

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={styles.gridContainer}>
                {/* Top Half: Inventory (60%) & Pages (40%) */}
                <View style={styles.topHalf}>
                    <Surface style={[styles.inventoryPane, activeSide === 'source' && styles.glowSource]} elevation={2}>
                        <FileInventory
                            files={files}
                            selectedFileId={selectedFileId}
                            onSelectFile={handleSelectFile}
                            onUploadFile={handleUploadFile}
                        />
                    </Surface>
                    <Surface style={[styles.pagesPane, activeSide === 'source' && styles.glowSource]} elevation={2}>
                        <PageSelector
                            files={files}
                            selectedFileId={selectedFileId}
                            buildList={buildList}
                            onAddPage={handleAddPage}
                            onAddAllPages={handleAddAllPages}
                        />
                    </Surface>
                </View>

                {/* Bottom Half: Build List (40%) & Live Preview (60%) */}
                <View style={styles.bottomHalf}>
                    <Surface style={[styles.buildListPane, activeSide === 'target' && styles.glowTarget]} elevation={2} onTouchEnd={() => { if (buildList.length > 0) setActiveSide('target') }}>
                        <BuildList
                            files={files}
                            buildList={buildList}
                            onRemovePage={handleRemovePage}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                        />
                    </Surface>

                    <Surface style={[styles.previewPane, activeSide === 'source' && styles.glowSource, activeSide === 'target' && styles.glowTarget]} elevation={2}>
                        <Text variant="titleSmall" style={[styles.paneHeader, activeSide === 'source' ? { color: '#0288d1' } : { color: '#388e3c' }]}>
                            {activeSide === 'source' ? 'Source Preview' : 'Draft Preview'}
                        </Text>

                        <View style={styles.previewBox}>
                            {previewBase64 === null ? (
                                <>
                                    <MaterialCommunityIcons name="file-pdf-box" size={64} color="#bdbdbd" />
                                    <Text variant="bodyMedium" style={{ marginTop: 8, color: '#757575' }}>
                                        {activeSide === 'source' ? 'No PDF Selected' : 'No Pages Added'}
                                    </Text>
                                </>
                            ) : (
                                <View style={styles.vignetteContainer}>
                                    <WorkbookVignette buildList={buildList} />
                                </View>
                            )}
                        </View>

                        <Button
                            mode="contained"
                            icon="export"
                            onPress={handleGeneratePDF}
                            disabled={buildList.length === 0}
                            style={styles.exportBtn}
                        >
                            Export PDF
                        </Button>
                    </Surface>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e0e0e0', // acts as grid gap color
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
        flex: 4,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    previewPane: {
        flex: 6,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        padding: 8,
        justifyContent: 'space-between',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    paneHeader: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8
    },
    pdfViewer: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#525659'
    },
    previewBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8
    },
    vignetteContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    exportBtn: {
        borderRadius: 8,
        paddingVertical: 4
    },
    glowSource: {
        borderColor: '#0288d1', // Light Blue 700
    },
    glowTarget: {
        borderColor: '#388e3c', // Green 700
    }
});

export default PDFWorkbenchScreen;
