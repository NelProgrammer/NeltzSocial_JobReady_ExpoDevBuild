import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Appbar, Text, Card } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { WebView } from 'react-native-webview';
import { ResumeContext } from '../context/ResumeContext';
import { VIGNETTE_CSS } from '../constants/VignetteStyles';
import SmartPreviewer from '../components/preview/SmartPreviewer';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';

const PreviewScreen = ({ navigation }) => {
    const { resumeData, updateResumeData } = useContext(ResumeContext);
    const [loading, setLoading] = useState(false);
    const [exportFormat, setExportFormat] = useState('word_layout');
    const [previewUri, setPreviewUri] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const insets = useSafeAreaInsets();

    // Layout State (Saved in Resume Data)
    const currentLayout = resumeData?.["Document Settings"]?.Layout || 'professional';

    const changeLayout = (newLayout) => {
        updateResumeData({ 
            ...resumeData, 
            "Document Settings": { 
                ...(resumeData["Document Settings"] || {}), 
                Layout: newLayout 
            } 
        });
    };

    const generateHtml = () => {
        if (!resumeData) return "<html><body><h1>No Data</h1></body></html>";

        const { 
            "personal details": pd, 
            experience: expList, 
            education: eduList, 
            "Skills": skills, 
            "References": refList, 
            "professional summary": summary, 
            "Document Settings": docSettings 
        } = resumeData;
        const Layout = docSettings?.Layout || 'professional';
        const names = pd?.names || {};
        const contact = pd?.contact || {};
        const address = pd?.address || {};
        const identity = pd?.identity || {};
        const licensing = pd?.licensing || {};
        const demographics = pd?.demographics || {};
        const legal = pd?.legal || {};
        const languages = pd?.languages || [];

        // Formatting Helpers
        const formatAddress = (addrStr) => {
            if (!addrStr) return '';
            if (address.AddressFormat === 'list') {
                return addrStr.replace(/\n/g, '<br/>');
            }
            return addrStr.replace(/\n/g, ', ');
        };

        const maskId = (idStr) => {
            if (!idStr) return '';
            if (identity.idMask !== false && idStr.length >= 6) {
                return `${idStr.substring(0, 6)} **** ***`;
            }
            return idStr;
        };

        // CSS Styles
        const styles = `
            ${VIGNETTE_CSS}
            
            body { 
                font-family: 'Helvetica', sans-serif; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background: transparent; 
            }
            
            /* Overwrite/Enhance Vignette Sheet for Mobile */
            .vignette-sheet {
                background: white;
            }
            
            /* Professional Header */
            .header-pro { border-bottom: 2px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px; }
            .header-pro h1 { margin: 0; font-size: 32px; color: #2c3e50; text-transform: uppercase; letter-spacing: 2px; }
            .header-pro .contact-info { margin-top: 10px; font-size: 14px; color: #555; }
            
            /* Modern Header */
            .header-mod { background: #2c3e50; color: white; padding: 40px; margin: -40px -40px 30px -40px; }
            .header-mod h1 { margin: 0; font-size: 36px; }
            .header-mod .contact-info { color: #ecf0f1; margin-top: 10px; }

            /* Minimalist Header */
            .header-min { text-align: center; margin-bottom: 40px; }
            .header-min h1 { margin: 0; font-size: 28px; font-weight: 300; border-bottom: 1px solid #ddd; padding-bottom: 10px; display: inline-block; }
            .header-min .contact-info { margin-top: 15px; font-size: 12px; color: #777; }

            h3 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 25px; text-transform: uppercase; font-size: 16px; letter-spacing: 1px; }
            .min-h3 { border: none; text-align: center; color: #888; font-weight: normal; margin-top: 40px; }
            
            .job-item, .edu-item { margin-bottom: 15px; }
            .job-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; }
            .job-role { font-style: italic; color: #555; margin-bottom: 5px; }
            .job-desc { font-size: 14px; line-height: 1.5; white-space: pre-line; }
            
            .ref-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .ref-item { font-size: 14px; }
            
            .meta-section { margin-top: 15px; font-size: 13px; color: #444; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 5px; }
            .meta-item strong { display: inline-block; width: 120px; color: #555; }
        `;

        let headerHtml = '';
        if (Layout === 'modern') {
            headerHtml = `
                <div class="header-mod">
                    <h1>${names.Prefix ? names.Prefix + ' ' : ''}${names.firstName || ''} ${names.MiddleName ? names.MiddleName + ' ' : ''}${names.Surname || ''}</h1>
                    <div class="contact-info">
                        ${contact.Email ? `📧 ${contact.Email} | ` : ''} 
                        ${contact.Phone ? `📱 ${contact.Phone} | ` : ''} 
                        ${contact["Phone-alt"] ? `📱 ${contact["Phone-alt"]} | ` : ''} 
                        ${contact.LinkedIn ? `🔗 ${contact.LinkedIn} | ` : ''} 
                        ${contact.Website ? `🌐 ${contact.Website} | ` : ''} 
                        ${address.AddressType ? `[${address.AddressType}] ` : ''}${address["Home Address"] ? `${formatAddress(address["Home Address"])}` : ''}
                    </div>
                </div>
            `;
        } else if (Layout === 'minimalist') {
            headerHtml = `
                <div class="header-min">
                    <h1>${names.firstName || ''} ${names.Surname || ''}</h1>
                    <div class="contact-info">
                        ${contact.Email || ''} &bull; ${contact.Phone || ''}
                    </div>
                    <div class="contact-info">
                        ${address.AddressType ? `[${address.AddressType}] ` : ''}${address["Home Address"] ? formatAddress(address["Home Address"]) : ''}
                    </div>
                </div>
            `;
        } else {
            headerHtml = `
                <div class="header-pro">
                    <h1>${names.Prefix ? names.Prefix + ' ' : ''}${names.firstName || ''} ${names.MiddleName ? names.MiddleName + ' ' : ''}${names.Surname || ''}</h1>
                    <div class="contact-info">
                        ${contact.Email ? `📧 ${contact.Email} &nbsp;|&nbsp;` : ''} 
                        ${contact.Phone ? `📱 ${contact.Phone} &nbsp;|&nbsp;` : ''} 
                        ${contact["Phone-alt"] ? `📱 ${contact["Phone-alt"]} &nbsp;|&nbsp;` : ''} 
                        ${contact.LinkedIn ? `🔗 ${contact.LinkedIn} &nbsp;|&nbsp;` : ''} 
                        ${contact.Website ? `🌐 ${contact.Website} &nbsp;|&nbsp;` : ''} 
                        ${address.AddressType ? `[${address.AddressType}] ` : ''}${address["Home Address"] ? `${formatAddress(address["Home Address"])}` : ''}
                    </div>
                </div>
            `;
        }

        const sectionHeader = (title) => Layout === 'minimalist' ? `<h3 class="min-h3">${title.toUpperCase()}</h3>` : `<h3>${title}</h3>`;

        const identityHtml = identity.idNumber || demographics.Nationality || (licensing.Drivers && licensing.DriversVisible) || (licensing.Motorcycle && licensing.MotorVisible) || (legal["Criminal Record"]) ? `
            <div class="meta-section">
                ${Layout === 'minimalist' ? sectionHeader('Personal Information') : ''}
                <div class="meta-grid">
                    ${identity.idNumber ? `<div class="meta-item"><strong>ID Number:</strong> ${maskId(identity.idNumber)}</div>` : ''}
                    ${demographics.Nationality ? `<div class="meta-item"><strong>Nationality:</strong> ${demographics.Nationality}</div>` : ''}
                    ${demographics.Gender && demographics.Gender !== 'None' ? `<div class="meta-item"><strong>Gender:</strong> ${demographics.Gender}</div>` : ''}
                    ${demographics.Race && demographics.Race !== 'Other' ? `<div class="meta-item"><strong>Race:</strong> ${demographics.Race}</div>` : ''}
                    ${licensing.DriversVisible && licensing.Drivers !== 'None' ? `<div class="meta-item"><strong>Drivers License:</strong> ${licensing.Drivers}</div>` : ''}
                    ${licensing.MotorVisible && licensing.Motorcycle !== 'None' ? `<div class="meta-item"><strong>Motorcycle:</strong> ${licensing.Motorcycle}</div>` : ''}
                    ${legal["Criminal Record"] ? `<div class="meta-item"><strong>Criminal Record:</strong> Yes ${legal.Details ? `(${legal.Details})` : ''}</div>` : ''}
                </div>
            </div>
        ` : '';

        const langHtml = languages.length > 0 ? `
            ${sectionHeader('Languages')}
            <ul>
                ${languages.filter(l => l.visible !== false).map(l => `<li><strong>${l.Language}:</strong> ${l.proficiency}</li>`).join('')}
            </ul>
        ` : '';

        const expHtml = expList && expList.length > 0 ? `
            ${sectionHeader('Professional Experience')}
            ${expList.map(job => `
                <div class="job-item">
                    <div class="job-header">
                        <span>${job.Organization}</span>
                        <span>${job["Start Date"]} - ${job["End Date"] || 'Present'}</span>
                    </div>
                    <div class="job-role">${job.Role}</div>
                    <div class="job-desc">${job["Key Responsibilities"]}</div>
                </div>
            `).join('')}
        ` : '';

        const eduHtml = (eduList?.tertiary?.length > 0 || eduList?.highschool?.["Year Completed"]) ? `
            ${sectionHeader('Education')}
            ${eduList.tertiary.map(edu => `
                 <div class="edu-item">
                    <div class="job-header">
                        <span>${edu.Institution}</span>
                        <span>${edu.Year}</span>
                    </div>
                    <div>${edu["Qualification Name"]}</div>
                </div>
            `).join('')}
            ${eduList.highschool["Year Completed"] ? `
                <div class="edu-item">
                     <div class="job-header">
                        <span>${eduList.highschool["Province Department"]}</span>
                        <span>${eduList.highschool["Year Completed"]}</span>
                    </div>
                    <div>${eduList.highschool["Highest Grade/Std"]}</div>
                </div>
            ` : ''}
        ` : '';

        const skillsHtml = (skills.Tech || skills.Soft) ? `
             ${sectionHeader('Skills')}
             ${skills.Tech ? `<p><strong>Technical:</strong> ${skills.Tech}</p>` : ''}
             ${skills.Soft ? `<p><strong>Soft Skills:</strong> ${skills.Soft}</p>` : ''}
         ` : '';

        const refHtml = refList && refList.length > 0 ? `
             ${sectionHeader('References')}
             <div class="ref-grid" style="${Layout === 'minimalist' ? 'text-align: center;' : ''}">
                ${refList.filter(r => r.visible).map(ref => `
                    <div class="ref-item">
                        <strong>${ref.name}</strong><br/>
                        ${ref.relation} at ${ref.org}<br/>
                        ${ref.phone}<br/>
                        ${ref.email}
                    </div>
                `).join('')}
             </div>
         ` : (refList && refList.length > 0 ? '' : `${sectionHeader('References')}<p style="${Layout === 'minimalist' ? 'text-align: center;' : ''}">Available upon request.</p>`);


        return `
            <html>
            <head><style>${styles}</style></head>
            <body>
                <div class="vignette-wrapper">
                    <div class="vignette-container">
                        <div class="vignette-sheet">
                            ${headerHtml}
                            ${identityHtml}
                            ${summary ? `${sectionHeader('Executive Summary')}<p>${summary}</p>` : ''}
                            ${expHtml}
                            ${eduHtml}
                            ${skillsHtml}
                            ${langHtml}
                            ${refHtml}
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    // Background PDF Generation for Preview
    useEffect(() => {
        let isMounted = true;

        // TIER 3 (Low End / SA Budget Market intercept)
        const memoryBytes = Device.totalMemory || 0;
        const yearClass = Device.deviceYearClass || 0;
        const isLowEnd = (memoryBytes > 0 && memoryBytes < 3221225472) || (yearClass > 0 && yearClass < 2019); // < 3GB or pre-2019
        const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

        if (isExpoGo || isLowEnd) {
            // Drop back instantly to Vignette. Skip generation entirely to save overhead.
            return;
        }

        // TIER 1 Threshold (Mid-range & Up)
        const isHighEnd = memoryBytes >= 4294967296; // >= 4GB Framework to safely bridge massive Base64 strings by bypassing slow eMMC storage.

        const generateBackgroundPdf = async () => {
             setIsGeneratingPdf(true);
             try {
                const html = generateHtml();
                
                if (isHighEnd && Platform.OS !== 'web') {
                    // TIER 1: In-Memory Base64 Processing (Zero local disk IO)
                    const { base64 } = await Print.printToFileAsync({ html, width: 612, height: 792, base64: true });
                    if (isMounted) setPreviewUri(`data:application/pdf;base64,${base64}`);
                } else {
                    // TIER 2: Fast Disk Caching (Offloads memory footprint)
                    const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });
                    if (isMounted) setPreviewUri(uri);
                }

             } catch (e) {
                 console.log("Background PDF generation failed", e);
             } finally {
                 if (isMounted) setIsGeneratingPdf(false);
             }
        };

        const timeout = setTimeout(generateBackgroundPdf, 400); // debounce
        return () => {
            isMounted = false;
            clearTimeout(timeout);
        }
    }, [resumeData, currentLayout, exportFormat]);

    const printToFile = async () => {
        setLoading(true);
        try {
            const html = generateHtml();
            const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 }); // Letter size

            // Generate filename with format My_Resume_+CCYY-MM-DD HH-MM-SS-MS
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ms = String(now.getMilliseconds()).padStart(3, '0');

            const fileName = `My_Resume_${year}-${month}-${day} ${hours}-${minutes}-${seconds}-${ms}.pdf`;

            // expo-print generates a random filename. We move it to a new path with our custom name 
            // so the share sheet recognizes the right filename.
            const newUri = `${FileSystem.cacheDirectory}${fileName}`;

            // Delete if a file with the same name already exists to prevent errors
            const fileInfo = await FileSystem.getInfoAsync(newUri);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(newUri);
            }

            await FileSystem.moveAsync({
                from: uri,
                to: newUri
            });

            await shareAsync(newUri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: `Share ${fileName}`
            });

        } catch (error) {
            Alert.alert("Error", "Could not generate PDF");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const generatePlainText = () => {
        if (!resumeData) return "";
        const { "personal details": pd, experience: expList, education: eduList, Skills: skills, "professional summary": summary } = resumeData;
        const names = pd?.names || {};
        
        let text = `${names.firstName} ${names.Surname}\n\n`;
        if (summary) text += `EXECUTIVE SUMMARY\n${summary}\n\n`;
        
        if (expList && expList.length > 0) {
            text += `PROFESSIONAL EXPERIENCE\n`;
            expList.forEach(job => {
                text += `${job.Organization} | ${job.Role}\n${job["Start Date"]} - ${job["End Date"] || 'Present'}\n${job["Key Responsibilities"]}\n\n`;
            });
        }
        
        if (eduList?.tertiary?.length > 0) {
            text += `EDUCATION\n`;
            eduList.tertiary.forEach(edu => {
                text += `${edu.Institution} | ${edu["Qualification Name"]}\n${edu.Year}\n\n`;
            });
        }
        
        return text;
    };

    const exportToWord = async (type) => {
        setLoading(true);
        try {
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-');
            const extension = type === 'text' ? 'docx' : 'doc';
            const fileName = `My_Resume_${type === 'google_docs' ? 'GoogleDocs' : 'Word'}_${timestamp}.${extension}`;
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
            
            let content = '';
            if (type === 'text') {
                content = generatePlainText();
            } else {
                // HTML to Word/Google Docs (Layout)
                content = `
                    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head><meta charset='utf-8'><title>Resume</title></head>
                    <body>${generateHtml()}</body>
                    </html>
                `;
            }

            await FileSystem.writeAsStringAsync(fileUri, content);

            // Google Docs on mobile intercepts standard doc/docx MIMEs.
            const mimeType = type === 'text' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword';

            await shareAsync(fileUri, {
                title: type === 'google_docs' ? `Save ${fileName} to Google Drive / Docs` : `Share ${fileName}`,
                mimeType: mimeType,
                dialogTitle: type === 'google_docs' ? 'Open with Google Docs or Save to Drive' : 'Share File'
            });

        } catch (error) {
            Alert.alert("Error", "Could not export document");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Appbar.Action
                    icon="share-variant"
                    onPress={() => {
                        if (exportFormat === 'pdf') {
                            printToFile();
                        } else {
                            exportToWord(exportFormat === 'word_text' ? 'text' : 'layout');
                        }
                    }}
                />
            ),
        });
    }, [navigation, exportFormat, resumeData]);

    return (
        <View style={styles.container}>
            <View style={styles.topContainer}>
                <Text style={styles.sectionTitle}>Select CV Format (Layout) 👉 Swipe for more</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.layoutScroll}>
                    <TouchableOpacity onPress={() => changeLayout('professional')}>
                        <Card style={[styles.layoutCard, currentLayout === 'professional' && styles.activeCard]}>
                            <Card.Content style={styles.cardContent}>
                                <Text style={[styles.layoutText, currentLayout === 'professional' && styles.activeText]}>Professional</Text>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeLayout('modern')}>
                        <Card style={[styles.layoutCard, currentLayout === 'modern' && styles.activeCard]}>
                            <Card.Content style={styles.cardContent}>
                                <Text style={[styles.layoutText, currentLayout === 'modern' && styles.activeText]}>Modern</Text>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeLayout('minimalist')}>
                        <Card style={[styles.layoutCard, currentLayout === 'minimalist' && styles.activeCard]}>
                            <Card.Content style={styles.cardContent}>
                                <Text style={[styles.layoutText, currentLayout === 'minimalist' && styles.activeText]}>Minimalist</Text>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeLayout('chronological')}>
                        <Card style={[styles.layoutCard, currentLayout === 'chronological' && styles.activeCard]}>
                            <Card.Content style={styles.cardContent}>
                                <Text style={[styles.layoutText, currentLayout === 'chronological' && styles.activeText]}>Chronological</Text>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeLayout('functional')}>
                        <Card style={[styles.layoutCard, currentLayout === 'functional' && styles.activeCard]}>
                            <Card.Content style={styles.cardContent}>
                                <Text style={[styles.layoutText, currentLayout === 'functional' && styles.activeText]}>Functional</Text>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <View style={styles.previewArea}>
                <SmartPreviewer 
                    data={resumeData} 
                    layout={currentLayout} 
                    exportFormat={exportFormat} 
                    pdfUri={previewUri} 
                    isGenerating={isGeneratingPdf} 
                />
            </View>

            <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 15) }]}>
                <Text style={styles.sectionTitle}>Select Export Format 👉 Swipe for more</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginBottom: 15 }}>
                    <TouchableOpacity onPress={() => setExportFormat('pdf')}>
                        <Card style={[styles.layoutCard, exportFormat === 'pdf' && styles.activeCard]}>
                            <Card.Content style={[styles.cardContent, { paddingHorizontal: 15 }]}>
                                <Text style={[styles.layoutText, exportFormat === 'pdf' && styles.activeText, { textAlign: 'center' }]}>PDF</Text>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setExportFormat('word_layout')}>
                        <Card style={[styles.layoutCard, exportFormat === 'word_layout' && styles.activeCard]}>
                            <Card.Content style={[styles.cardContent, { paddingHorizontal: 15 }]}>
                                <Text style={[styles.layoutText, exportFormat === 'word_layout' && styles.activeText, { textAlign: 'center' }]}>Word (Layout)</Text>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setExportFormat('word_text')}>
                        <Card style={[styles.layoutCard, exportFormat === 'word_text' && styles.activeCard]}>
                            <Card.Content style={[styles.cardContent, { paddingHorizontal: 15 }]}>
                                <Text style={[styles.layoutText, exportFormat === 'word_text' && styles.activeText, { textAlign: 'center' }]}>Word (Text)</Text>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setExportFormat('google_docs')}>
                        <Card style={[styles.layoutCard, exportFormat === 'google_docs' && styles.activeCard, { marginRight: 0 }]}>
                            <Card.Content style={[styles.cardContent, { paddingHorizontal: 15 }]}>
                                <Text style={[styles.layoutText, exportFormat === 'google_docs' && styles.activeText, { textAlign: 'center' }]}>Google Docs</Text>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                </ScrollView>
                <Button
                    mode="contained"
                    icon={exportFormat === 'pdf' ? "file-pdf-box" : exportFormat === 'google_docs' ? "google-drive" : "file-word-box"}
                    onPress={() => {
                        if (exportFormat === 'pdf') {
                            printToFile();
                        } else {
                            // Map exportFormat states to exportToWord types
                            const typeMap = {
                                'word_text': 'text',
                                'word_layout': 'layout',
                                'google_docs': 'google_docs'
                            };
                            exportToWord(typeMap[exportFormat]);
                        }
                    }}
                    loading={loading && exportFormat === 'pdf'}
                    style={styles.exportBtn}
                    contentStyle={{ height: 50 }}
                >
                    Generate File / Export
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    topContainer: { backgroundColor: '#fff', paddingHorizontal: 15, paddingTop: 5, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#eee', elevation: 2 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#777', textTransform: 'uppercase' },
    layoutScroll: { paddingBottom: 5 },
    layoutCard: { marginRight: 10, backgroundColor: '#f9f9f9', borderWidth: 2, borderColor: 'transparent', borderRadius: 8 },
    activeCard: { borderColor: '#6200ee', backgroundColor: '#efe9ff' },
    cardContent: { paddingVertical: 10, paddingHorizontal: 15 },
    layoutText: { fontWeight: 'bold', color: '#555' },
    activeText: { color: '#6200ee' },
    previewArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bottomContainer: { backgroundColor: '#fff', padding: 15, borderTopWidth: 1, borderColor: '#eee', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    exportBtn: { borderRadius: 8 }
});

export default PreviewScreen;
