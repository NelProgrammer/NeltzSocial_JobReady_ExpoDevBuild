// @ts-nocheck
import RNBlobUtil from 'react-native-blob-util';
import { Platform, Clipboard } from 'react-native';

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
 * Direct save to Real Public Device Storage (Documents or Downloads)
 * Target Path: /storage/emulated/0/Documents/Neltz_Social/[ModuleSubFolder]/
 */
export const saveToDeviceDirectory = async (
    tempUri: string,
    fileName: string,
    targetRoot: 'documents' | 'downloads' = 'documents',
    moduleDomain: 'Resumes' | 'PDF_Workbench' = 'Resumes',
    mimeType: string = 'application/pdf'
): Promise<ExportResult> => {
    try {
        const cleanSourcePath = tempUri.replace('file://', '');
        const subFolder = `Neltz_Social/${moduleDomain}`;
        const displayRoot = targetRoot === 'downloads' ? 'Downloads' : 'Documents';

        if (Platform.OS === 'android') {
            try {
                // Android Scoped Storage MediaCollection API writes directly into real public device storage
                const mediaType = targetRoot === 'downloads' ? 'Download' : 'Audio'; // 'Download' collection in MediaStore
                await RNBlobUtil.MediaCollection.copyToMediaStore(
                    {
                        name: fileName,
                        parentFolder: subFolder,
                        mimeType: mimeType
                    },
                    'Download',
                    cleanSourcePath
                );

                return {
                    success: true,
                    fileUri: `/sdcard/Download/${subFolder}/${fileName}`,
                    fileName,
                    message: `Saved directly to /${displayRoot}/${subFolder}/${fileName}`
                };
            } catch (mediaErr) {
                console.warn("copyToMediaStore fallback:", mediaErr);
                // Fallback to direct FS copy under external storage
                const extDir = `${RNBlobUtil.fs.dirs.SDCardDir}/${displayRoot}/${subFolder}`;
                if (!(await RNBlobUtil.fs.exists(extDir))) {
                    await RNBlobUtil.fs.mkdir(extDir);
                }
                const targetPath = `${extDir}/${fileName}`;
                await RNBlobUtil.fs.cp(cleanSourcePath, targetPath);
                try {
                    await RNBlobUtil.fs.scanFile([{ path: targetPath, mime: mimeType }]);
                } catch (e) {}

                return {
                    success: true,
                    fileUri: targetPath,
                    fileName,
                    message: `Saved directly to /${displayRoot}/${subFolder}/${fileName}`
                };
            }
        } else {
            // iOS / DocumentDirectory write
            const targetDir = `${RNBlobUtil.fs.dirs.DocumentDir}/${subFolder}`;
            if (!(await RNBlobUtil.fs.exists(targetDir))) {
                await RNBlobUtil.fs.mkdir(targetDir);
            }
            const targetPath = `${targetDir}/${fileName}`;
            await RNBlobUtil.fs.cp(cleanSourcePath, targetPath);

            return {
                success: true,
                fileUri: targetPath,
                fileName,
                message: `Saved to /${displayRoot}/${subFolder}/${fileName}`
            };
        }
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
