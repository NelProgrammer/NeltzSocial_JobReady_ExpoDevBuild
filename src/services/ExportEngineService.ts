// @ts-nocheck
import * as FileSystem from 'expo-file-system/legacy';
import { Platform, Clipboard } from 'react-native';
import { shareAsync } from 'expo-sharing';

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
 * Direct save to device directory (Documents or Downloads) under /Neltz_Social/[ModuleSubFolder]/
 */
export const saveToDeviceDirectory = async (
    tempUri: string,
    fileName: string,
    targetRoot: 'documents' | 'downloads' = 'documents',
    moduleDomain: 'Resumes' | 'PDF_Workbench' = 'Resumes',
    mimeType: string = 'application/pdf'
): Promise<ExportResult> => {
    try {
        const subFolderPath = `Neltz_Social/${moduleDomain}`;
        const baseDir = targetRoot === 'downloads' 
            ? `${FileSystem.documentDirectory}downloads/` 
            : `${FileSystem.documentDirectory}documents/`;
        
        const targetDir = `${baseDir}${subFolderPath}/`;
        const dirInfo = await FileSystem.getInfoAsync(targetDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
        }

        const targetUri = `${targetDir}${fileName}`;
        await FileSystem.copyAsync({
            from: tempUri,
            to: targetUri
        });

        const rootDisplay = targetRoot === 'downloads' ? 'Downloads' : 'Documents';

        return {
            success: true,
            fileUri: targetUri,
            fileName,
            message: `Saved directly to /${rootDisplay}/${subFolderPath}/${fileName}`
        };
    } catch (error) {
        console.error("saveToDeviceDirectory error:", error);
        return {
            success: false,
            fileUri: '',
            fileName,
            message: `Could not save file: ${error.message || error}`
        };
    }
};

/**
 * Save / Upload to Cloud Provider (Google Drive, OneDrive, Dropbox)
 */
export const saveToCloudProvider = async (
    tempUri: string,
    fileName: string,
    provider: 'gdrive' | 'onedrive' | 'dropbox',
    mimeType: string = 'application/pdf'
): Promise<ExportResult> => {
    try {
        const providerNames = {
            gdrive: 'Google Drive',
            onedrive: 'Microsoft OneDrive',
            dropbox: 'Dropbox'
        };
        const title = `Save ${fileName} to ${providerNames[provider]}`;

        await shareAsync(tempUri, {
            mimeType,
            dialogTitle: title,
            UTI: mimeType === 'application/pdf' ? '.pdf' : '.doc'
        });

        return {
            success: true,
            fileUri: tempUri,
            fileName,
            message: `Opened cloud upload for ${providerNames[provider]}`
        };
    } catch (error) {
        console.error("saveToCloudProvider error:", error);
        return {
            success: false,
            fileUri: '',
            fileName,
            message: `Cloud action cancelled or failed`
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
