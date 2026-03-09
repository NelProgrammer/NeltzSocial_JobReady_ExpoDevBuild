import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Appbar } from 'react-native-paper';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import * as DocumentPicker from 'expo-document-picker';
import { PDFDocument } from 'pdf-lib';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

import FileInventory from '../components/pdf/FileInventory';
import PageSelector from '../components/pdf/PageSelector';
import BuildList from '../components/pdf/BuildList';

const Tab = createMaterialTopTabNavigator();

const PDFWorkbenchScreen = ({ navigation }) => {
    const [files, setFiles] = useState({});
    const [selectedFileId, setSelectedFileId] = useState(null);
    const [buildList, setBuildList] = useState([]);

    // 1. Upload Logic
    const handleUploadFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const asset = result.assets[0];

            // Read file to get page count using pdf-lib
            const fileUri = asset.uri;
            const fileBase64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
            const pdfDoc = await PDFDocument.load(fileBase64);
            const pageCount = pdfDoc.getPageCount();

            const newFile = {
                id: `pdf_${Date.now()}`,
                name: asset.name,
                uri: fileUri,
                pageCount: pageCount,
                base64: fileBase64 // Storing base64 purely for ease of assembly later
            };

            setFiles(prev => ({ ...prev, [newFile.id]: newFile }));
            setSelectedFileId(newFile.id); // Auto-select the newly added file

            Alert.alert("Success", `Loaded ${asset.name} (${pageCount} pages)`);

        } catch (error) {
            console.error("Error loading PDF:", error);
            Alert.alert("Error", "Could not load the PDF file. Please ensure it is a valid PDF.");
        }
    };

    // 2. Select File Logic (Navigate to Pages Tab)
    const handleSelectFile = (fileId) => {
        setSelectedFileId(fileId);
        // We'll rely on the user swiping or tapping the top tab to move to 'Pages'
    };

    // 3. Page Selection Logic
    const handleAddPage = (fileId, pageIndex) => {
        setBuildList(prev => [...prev, { fileId, pageIndex }]);
    };

    const handleAddAllPages = (fileId) => {
        const file = files[fileId];
        if (!file) return;

        const newPages = [];
        for (let i = 0; i < file.pageCount; i++) {
            // Only add if not already present
            const isUsed = buildList.some(item => item.fileId === fileId && item.pageIndex === i);
            if (!isUsed) {
                newPages.push({ fileId, pageIndex: i });
            }
        }

        setBuildList(prev => [...prev, ...newPages]);
        Alert.alert("Success", `Added ${newPages.length} pages to the build list.`);
    };

    // 4. Build List Management
    const handleRemovePage = (indexToRemove) => {
        setBuildList(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        setBuildList(prev => {
            const arr = [...prev];
            [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
            return arr;
        });
    };

    const handleMoveDown = (index) => {
        if (index === buildList.length - 1) return;
        setBuildList(prev => {
            const arr = [...prev];
            [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
            return arr;
        });
    };

    // 5. Generation Logic
    const handleGeneratePDF = async () => {
        try {
            Alert.alert("Processing", "Generating your combined PDF...");

            // 5a. Create a new empty PDF
            const newPdfDoc = await PDFDocument.create();

            // Cache of loaded source documents to avoid parsing the same base64 multiple times
            const loadedDocs = {};

            // 5b. Iterate through the build list and append pages
            for (const item of buildList) {
                const file = files[item.fileId];
                if (!file) continue;

                if (!loadedDocs[file.id]) {
                    loadedDocs[file.id] = await PDFDocument.load(file.base64);
                }

                const sourceDoc = loadedDocs[file.id];
                // Copy the specific page from the source doc
                const [copiedPage] = await newPdfDoc.copyPages(sourceDoc, [item.pageIndex]);
                newPdfDoc.addPage(copiedPage);
            }

            // 5c. Serialize to base64
            const pdfBase64Data = await newPdfDoc.saveAsBase64();

            // 5d. Write to local file system
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileUri = `${FileSystem.documentDirectory}Combined_PDF_${timestamp}.pdf`;

            await FileSystem.writeAsStringAsync(fileUri, pdfBase64Data, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // 5e. Share/Preview the file using Native Share Sheet
            await shareAsync(fileUri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error) {
            console.error("PDF Generation Error:", error);
            Alert.alert("Error", "Failed to generate the combined PDF.");
        }
    };


    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.navigate('Hub')} />
                <Appbar.Content title="PDF Workbench" />
            </Appbar.Header>

            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: '#6200ee',
                    tabBarIndicatorStyle: { backgroundColor: '#6200ee' },
                    lazy: true,
                }}
            >
                <Tab.Screen name="Files">
                    {(props) => (
                        <FileInventory
                            {...props}
                            files={files}
                            selectedFileId={selectedFileId}
                            onSelectFile={handleSelectFile}
                            onUploadFile={handleUploadFile}
                        />
                    )}
                </Tab.Screen>
                <Tab.Screen name="Pages">
                    {(props) => (
                        <PageSelector
                            {...props}
                            files={files}
                            selectedFileId={selectedFileId}
                            buildList={buildList}
                            onAddPage={handleAddPage}
                            onAddAllPages={handleAddAllPages}
                        />
                    )}
                </Tab.Screen>
                <Tab.Screen name="Assemble">
                    {(props) => (
                        <BuildList
                            {...props}
                            files={files}
                            buildList={buildList}
                            onRemovePage={handleRemovePage}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                            onGeneratePDF={handleGeneratePDF}
                        />
                    )}
                </Tab.Screen>
            </Tab.Navigator>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    }
});

export default PDFWorkbenchScreen;
