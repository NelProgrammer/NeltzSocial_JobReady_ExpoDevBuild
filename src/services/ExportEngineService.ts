// @ts-nocheck
import * as FileSystem from 'expo-file-system/legacy';
import { Platform, Clipboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExportResult {
    success: boolean;
    fileUri: string;
    fileName: string;
    message: string;
}

/**
 * Generate a deterministic filename with layout name and timestamp
 */
export const generateExportFileName = (layout: string = 'professional', format: string = 'pdf'): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');

    const ext = format === 'word_text' ? 'docx' : format.startsWith('word') ? 'doc' : format === 'google_docs' ? 'doc' : 'pdf';
    return `My_Resume_${layout.toUpperCase()}_${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${ms}.${ext}`;
};

/**
 * Direct save to app local document vault (synced with PDF Workbench)
 */
export const saveToAppVault = async (tempUri: string, fileName: string): Promise<ExportResult> => {
    try {
        const vaultDir = `${FileSystem.documentDirectory}exports/`;
        const dirInfo = await FileSystem.getInfoAsync(vaultDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(vaultDir, { intermediates: true });
        }

        const vaultUri = `${vaultDir}${fileName}`;
        await FileSystem.copyAsync({
            from: tempUri,
            to: vaultUri
        });

        // Register into PDF Workbench inventory if it's a PDF
        if (fileName.endsWith('.pdf')) {
            try {
                const existingJson = await AsyncStorage.getItem('pdf_workbench_inventory');
                const inventory = existingJson ? JSON.parse(existingJson) : [];

                const newEntry = {
                    id: `pdf_vault_${Date.now()}`,
                    name: fileName,
                    uri: vaultUri,
                    createdAt: new Date().toISOString(),
                    sizeBytes: (await FileSystem.getInfoAsync(vaultUri)).size || 0,
                    source: 'Resume Export Vault'
                };

                // Add to start of array if not present
                if (!inventory.some((i: any) => i.name === fileName)) {
                    inventory.unshift(newEntry);
                    await AsyncStorage.setItem('pdf_workbench_inventory', JSON.stringify(inventory));
                }
            } catch (invErr) {
                console.warn("Could not sync to PDF Workbench inventory:", invErr);
            }
        }

        return {
            success: true,
            fileUri: vaultUri,
            fileName,
            message: `Saved to App Vault: ${fileName}`
        };
    } catch (error) {
        console.error("saveToAppVault error:", error);
        return {
            success: false,
            fileUri: '',
            fileName,
            message: `Failed to save to App Vault: ${error.message || error}`
        };
    }
};

/**
 * Direct save to device local storage (StorageAccessFramework / Downloads)
 */
export const saveToDeviceDownloads = async (tempUri: string, fileName: string, mimeType: string = 'application/pdf'): Promise<ExportResult> => {
    try {
        if (Platform.OS === 'android') {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
                const base64Data = await FileSystem.readAsStringAsync(tempUri, {
                    encoding: FileSystem.EncodingType.Base64
                });

                const createdFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                    permissions.directoryUri,
                    fileName,
                    mimeType
                );

                await FileSystem.writeAsStringAsync(createdFileUri, base64Data, {
                    encoding: FileSystem.EncodingType.Base64
                });

                return {
                    success: true,
                    fileUri: createdFileUri,
                    fileName,
                    message: `Direct saved to device storage: ${fileName}`
                };
            } else {
                return {
                    success: false,
                    fileUri: '',
                    fileName,
                    message: 'Storage permission declined'
                };
            }
        } else {
            // iOS / fallback direct document storage
            const targetUri = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.copyAsync({
                from: tempUri,
                to: targetUri
            });

            return {
                success: true,
                fileUri: targetUri,
                fileName,
                message: `Saved to Documents: ${fileName}`
            };
        }
    } catch (error) {
        console.error("saveToDeviceDownloads error:", error);
        return {
            success: false,
            fileUri: '',
            fileName,
            message: `Could not save file: ${error.message || error}`
        };
    }
};

/**
 * Copy text or file data to clipboard
 */
export const copyContentToClipboard = async (content: string): Promise<boolean> => {
    try {
        if (Clipboard && typeof Clipboard.setString === 'function') {
            Clipboard.setString(content);
            return true;
        }
        return false;
    } catch (error) {
        console.error("copyContentToClipboard error:", error);
        return false;
    }
};
