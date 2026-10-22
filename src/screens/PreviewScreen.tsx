// @ts-nocheck
import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Appbar, Text, Card, Portal, Modal, Switch } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { WebView } from 'react-native-webview';
import { ResumeContext } from '../context/ResumeContext';
import { useThemeContext } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VIGNETTE_CSS } from '../constants/VignetteStyles';
import SmartPreviewer from '../components/preview/SmartPreviewer';
import ExportActionModal from '../components/export/ExportActionModal';
import { generateExportFileName } from '../services/ExportEngineService';
import { ResumeCompiler, CompiledResumeDocument } from '@jobready/core';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';

const PreviewScreen = ({ navigation }) => {
    const { resumeData, updateResumeData, uiSettings, updateUiSettings } = useContext(ResumeContext);
    const { theme } = useThemeContext();
    const [loading, setLoading] = useState(false);
    const [exportFormat, setExportFormat] = useState('pdf');
    const [previewUri, setPreviewUri] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Viewer Control State (Matching PDF Workbench)
    const [fitMode, setFitMode] = useState('a4'); // 'a4', 'page', 'width'
    const [enableScroll, setEnableScroll] = useState(true);
    const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // In-App Direct Export Modal State
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [exportedFileUri, setExportedFileUri] = useState(null);
    const [exportedFileName, setExportedFileName] = useState('');

    const insets = useSafeAreaInsets();

    // Layout State (Saved in UI Settings)
    const currentLayout = uiSettings?.Layout || uiSettings?.["Document Settings"]?.Layout || 'professional';

    const changeLayout = (newLayout) => {
        updateUiSettings({ 
            ...uiSettings, 
            Layout: newLayout,
            "Document Settings": { 
                ...(uiSettings?.["Document Settings"] || {}), 
                Layout: newLayout 
            } 
        });
    };

    const generateHtml = () => {
        if (!resumeData) return "<html><body><h1>No Data</h1></body></html>";

        const Layout = uiSettings?.Layout || uiSettings?.["Document Settings"]?.Layout || 'professional';

        // Authoritative Core_TS Compilation: strict visibility, POPIA masking, zero ghost headers
        const compilerConfig = {
            config_type: (uiSettings?.isMain !== false) ? 'main' : 'targeted',
            visibility_flags: uiSettings?.visibility_flags || uiSettings?.visibility || resumeData?.visibility || {},
            format_switches: uiSettings || {},
            formattingSettings: uiSettings || {}
        };

        const doc: CompiledResumeDocument = ResumeCompiler.compile(resumeData, compilerConfig);
        const { header, summary, demographics = [], workExperience = [], education = {}, skills = { categories: [], displayFormat: 'bullet' }, languages = [], references = [] } = doc;

        const fullName = header.fullName || 'Job Applicant';
        const contactSep = header.contactSeparator || '&bull;';
        const isContactBullet = uiSettings?.ContactFormat === 'bullet';
        const modernContacts = header.contactItems.map(c => c.displayString);
        if (header.addressLine) {
            modernContacts.push(`📍 ${header.addressLine}`);
        }

        const formatContactsHtml = (contactsArr) => {
            if (!contactsArr || contactsArr.length === 0) return '';
            if (isContactBullet) {
                return `<div class="contact-info" style="line-height: 1.6;">${contactsArr.map(c => `<div>&bull; ${c}</div>`).join('')}</div>`;
            }
            return `<div class="contact-info">${contactsArr.join(` &nbsp;${contactSep}&nbsp; `)}</div>`;
        };

        const sectionHeader = (title) => Layout === 'minimalist' ? `<h3 class="min-h3">${title.toUpperCase()}</h3>` : `<h3>${title}</h3>`;

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
                    <h1>${fullName}</h1>
                    ${formatContactsHtml(modernContacts)}
                </div>
            `;
        } else if (Layout === 'minimalist') {
            headerHtml = `
                <div class="header-min">
                    <h1>${fullName}</h1>
                    ${modernContacts.length > 0 ? `<div class="contact-info">${modernContacts.join(' &bull; ')}</div>` : ''}
                </div>
            `;
        } else {
            headerHtml = `
                <div class="header-pro">
                    <h1>${fullName}</h1>
                    ${formatContactsHtml(modernContacts)}
                </div>
            `;
        }

        const isDemoComma = uiSettings?.DemoFormat === 'comma';
        const identityHtml = demographics.length > 0 ? `
            <div class="meta-section">
                ${Layout === 'minimalist' ? sectionHeader('Personal Information') : ''}
                ${isDemoComma ? `<div style="font-size: 13px; color: #444; line-height: 1.6;">${demographics.map(d => `<strong>${d.label}:</strong> ${d.value}`).join(' &nbsp;·&nbsp; ')}</div>` : `
                <div class="meta-grid">
                    ${demographics.map(d => `<div class="meta-item"><strong>${d.label}:</strong> ${d.value}</div>`).join('')}
                </div>`}
            </div>
        ` : '';

        const expHtml = workExperience.length > 0 ? `
            ${sectionHeader('Professional Experience')}
            ${workExperience.map(job => `
                <div class="job-item" style="margin-bottom: 20px;">
                    <div class="job-header" style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 3px;">
                        <span>${job.organization || 'Organization'}${job.department ? ` (${job.department})` : ''}</span>
                        ${job.period ? `<span>${job.period}</span>` : ''}
                    </div>
                    ${job.role ? `<div class="job-role" style="font-style: italic; color: #555; margin-bottom: 5px;">${job.role}</div>` : ''}
                    ${job.responsibilities && job.responsibilities.length > 0 ? `
                        <div class="job-desc" style="font-size: 14px; line-height: 1.5; margin-bottom: 5px;">
                            ${job.responsibilitiesLayout === 'bullet' ? `<ul style="margin: 5px 0 10px 0; padding-left: 20px;">${job.responsibilities.map(r => `<li>${r}</li>`).join('')}</ul>` : job.responsibilities.join(', ')}
                        </div>
                    ` : ''}
                    ${job.achievements && job.achievements.length > 0 ? `<div style="font-size: 13.5px; margin-top: 5px; margin-bottom: 5px;"><strong>Key Achievements:</strong> <ul style="margin: 5px 0 10px 0; padding-left: 20px;">${job.achievements.map(a => `<li>${a}</li>`).join('')}</ul></div>` : ''}
                    ${job.systemsUsed && job.systemsUsed.length > 0 ? `<div style="font-size: 13.5px; margin-top: 5px; margin-bottom: 5px;"><strong>Systems & Tools Used:</strong> ${job.systemsUsed.join(', ')}</div>` : ''}
                    ${job.reasonForLeaving ? `<div style="font-size: 12.5px; margin-top: 5px; font-style: italic; color: #777;">Reason for leaving: ${job.reasonForLeaving}</div>` : ''}
                </div>
            `).join('')}
        ` : '';

        const hasEducationContent = !!(education.tertiary?.length || education.artisanal?.length || education.technicalCerts?.length || education.regulatoryCerts?.length || education.highschool);
        const eduHtml = hasEducationContent ? `
            ${sectionHeader('Education & Certifications')}
            ${(education.tertiary || []).map(edu => `
                <div class="edu-item" style="margin-bottom: 15px;">
                    <div class="job-header" style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 3px;">
                        <span>${edu.institution}</span>
                        <span>${edu.year || ''}</span>
                    </div>
                    <div>${edu.qualification}${edu.nqfLevel ? ` (NQF ${edu.nqfLevel})` : ''}</div>
                </div>
            `).join('')}
            ${(education.artisanal || []).map(cert => `
                <div class="edu-item" style="margin-bottom: 12px;">
                    <div class="job-header" style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 3px;">
                        <span>🔧 ${cert.trade}</span>
                        <span>${cert.dateTested || ''}</span>
                    </div>
                    <div style="font-size: 13px; color: #555;">${cert.testingCentre ? `Centre: ${cert.testingCentre}` : ''}${cert.certificateNumber ? ` (Cert: ${cert.certificateNumber})` : ''}</div>
                </div>
            `).join('')}
            ${(education.technicalCerts || []).map(cert => `
                <div class="edu-item" style="margin-bottom: 12px;">
                    <div class="job-header" style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 3px;">
                        <span>💻 ${cert.name}</span>
                        <span>${cert.dateIssued || ''}</span>
                    </div>
                    <div style="font-size: 13px; color: #555;">${cert.issuingBody || ''}</div>
                </div>
            `).join('')}
            ${(education.regulatoryCerts || []).map(cert => `
                <div class="edu-item" style="margin-bottom: 12px;">
                    <div class="job-header" style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 3px;">
                        <span>⚖️ ${cert.name}</span>
                        <span>${cert.dateIssued || ''}</span>
                    </div>
                    <div style="font-size: 13px; color: #555;">${cert.issuingBody || ''}</div>
                </div>
            `).join('')}
            ${education.highschool ? `
                <div class="edu-item" style="margin-bottom: 15px;">
                    <div class="job-header" style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 3px;">
                        <span>🏫 ${education.highschool.schoolName || education.highschool.department || 'High School'}</span>
                        <span>${education.highschool.yearCompleted || ''}</span>
                    </div>
                    <div>${education.highschool.grade || 'Completed'}${education.highschool.stream ? ` · Stream: ${education.highschool.stream}` : ''}</div>
                </div>
            ` : ''}
        ` : '';

        const skillsHtml = skills.categories && skills.categories.length > 0 ? `
            ${sectionHeader('Skills & Certifications')}
            ${skills.categories.map(cat => `
                <div style="margin-bottom: 10px; break-inside: avoid; page-break-inside: avoid;">
                    <strong>${cat.title}:</strong> ${skills.displayFormat === 'bullet' ? `<ul style="margin: 5px 0 10px 0; padding-left: 20px;">${cat.items.map(item => `<li>${item}</li>`).join('')}</ul>` : cat.items.join(', ')}
                </div>
            `).join('')}
        ` : '';

        const langHtml = languages.length > 0 ? `
            ${sectionHeader('Languages')}
            <ul>
                ${languages.map(l => `<li><strong>${l.language}:</strong> ${l.proficiency}</li>`).join('')}
            </ul>
        ` : '';

        const refHtml = references.length > 0 ? `
            ${sectionHeader('References')}
            <div class="ref-grid" style="${Layout === 'minimalist' ? 'text-align: center;' : ''}">
                ${references.map(ref => `
                    <div class="ref-item" style="margin-bottom: 10px; break-inside: avoid; page-break-inside: avoid;">
                        <strong>${ref.name}</strong><br/>
                        ${[ref.role, ref.company].filter(Boolean).join(' at ') || 'Reference'}<br/>
                        ${[ref.cellPhone || ref.workPhone, ref.email].filter(Boolean).join('<br/>')}
                    </div>
                `).join('')}
            </div>
        ` : '';

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

            const fileName = generateExportFileName(currentLayout, 'pdf');
            const newUri = `${FileSystem.cacheDirectory}${fileName}`;

            const fileInfo = await FileSystem.getInfoAsync(newUri);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(newUri);
            }

            await FileSystem.moveAsync({
                from: uri,
                to: newUri
            });

            setExportedFileUri(newUri);
            setExportedFileName(fileName);
            setExportModalVisible(true);

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
        
        let text = `${names.firstName || ''} ${names.Surname || ''}\n\n`;
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
            const fileName = generateExportFileName(currentLayout, type === 'text' ? 'word_text' : exportFormat);
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
            
            let content = '';
            if (type === 'text') {
                content = generatePlainText();
            } else {
                content = `
                    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head><meta charset='utf-8'><title>Resume</title></head>
                    <body>${generateHtml()}</body>
                    </html>
                `;
            }

            await FileSystem.writeAsStringAsync(fileUri, content);

            setExportedFileUri(fileUri);
            setExportedFileName(fileName);
            setExportModalVisible(true);

        } catch (error) {
            Alert.alert("Error", "Could not export document");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bgDark, paddingTop: Math.max(insets.top, 16) + 8 }]}>
            {/* Header Banner */}
            {!isFullScreenPreview && (
                <View style={[styles.headerBanner, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={[styles.navBtn, { backgroundColor: theme.bgDark, borderColor: theme.border }]}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                            accessibilityLabel="Back"
                            accessibilityRole="button"
                        >
                            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.textPrimary} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Resume Preview</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Format Selector & Export Engine</Text>
                        </View>
                        <View style={[styles.themeBadge, { backgroundColor: theme.accent }]}>
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>Preview Mode</Text>
                        </View>
                    </View>
                    <Text style={[styles.subtitleCentered, { color: theme.textSecondary }]}>Select template layout and export to PDF, Word or Google Docs</Text>
                </View>
            )}

            {/* Unified Body Card Container */}
            <View style={[
                styles.bodyCard, 
                { backgroundColor: theme.bgSurface, borderColor: theme.border, marginBottom: 60 + Math.max(insets.bottom, 0) },
                isFullScreenPreview && { marginHorizontal: 4, marginTop: 4, marginBottom: 60 + Math.max(insets.bottom, 0) }
            ]}>
                {!isFullScreenPreview && (
                    <View style={styles.topContainer}>
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Select CV Format (Layout)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.layoutScroll}>
                            {['professional', 'modern', 'minimalist', 'chronological', 'functional'].map((l) => (
                                <TouchableOpacity key={l} onPress={() => changeLayout(l)}>
                                    <Card style={[styles.layoutCard, { backgroundColor: theme.bgDark, borderColor: currentLayout === l ? theme.accent : theme.border }]}>
                                        <Card.Content style={styles.cardContent}>
                                            <Text style={[styles.layoutText, { color: currentLayout === l ? theme.accent : theme.textPrimary }]}>{l.toUpperCase()}</Text>
                                        </Card.Content>
                                    </Card>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={[styles.previewArea, isFullScreenPreview && { flex: 1 }]}>
                    <SmartPreviewer 
                        data={resumeData} 
                        layout={currentLayout} 
                        exportFormat={exportFormat} 
                        pdfUri={previewUri} 
                        isGenerating={isGeneratingPdf} 
                        fitMode={fitMode}
                        enableScroll={enableScroll}
                        uiSettings={uiSettings}
                    />
                </View>

                {!isFullScreenPreview && (
                    <View style={styles.exportSection}>
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Select Export Format</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                            {[
                                { key: 'pdf', label: 'PDF' },
                                { key: 'word_layout', label: 'Word (Layout)' },
                                { key: 'word_text', label: 'Word (Text)' },
                                { key: 'google_docs', label: 'Google Docs' },
                            ].map((f) => (
                                <TouchableOpacity key={f.key} onPress={() => setExportFormat(f.key)}>
                                    <Card style={[styles.layoutCard, { backgroundColor: theme.bgDark, borderColor: exportFormat === f.key ? theme.accent : theme.border }]}>
                                        <Card.Content style={styles.cardContent}>
                                            <Text style={[styles.layoutText, { color: exportFormat === f.key ? theme.accent : theme.textPrimary }]}>{f.label}</Text>
                                        </Card.Content>
                                    </Card>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* Persistent Sticky Footer Card */}
            <View style={[styles.footerCard, { backgroundColor: theme.bgDark, borderColor: theme.border, height: 56 + Math.max(insets.bottom, 0), paddingBottom: Math.max(insets.bottom, 4) }]}>
                <TouchableOpacity
                    style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('Hub')}
                    activeOpacity={0.7}
                    accessibilityLabel="JobReady Hub"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons name="home-outline" size={22} color={theme.textPrimary} />
                </TouchableOpacity>

                <View style={styles.footerCenterGroup}>
                    <TouchableOpacity 
                        style={[styles.footerIconBtn, { backgroundColor: isFullScreenPreview ? theme.accent : theme.bgSurface, borderColor: theme.border, marginRight: 8 }]} 
                        onPress={() => setIsFullScreenPreview(!isFullScreenPreview)} 
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name={isFullScreenPreview ? "fullscreen-exit" : "crop-free"} size={20} color={isFullScreenPreview ? "#fff" : theme.accent} />
                    </TouchableOpacity>

                    <Button
                        mode="contained"
                        icon={exportFormat === 'pdf' ? "file-pdf-box" : "file-word-box"}
                        onPress={() => {
                            if (exportFormat === 'pdf') {
                                printToFile();
                            } else {
                                exportToWord(exportFormat === 'word_text' ? 'text' : 'layout');
                            }
                        }}
                        loading={loading}
                        style={{ borderRadius: 20, backgroundColor: theme.accent }}
                    >
                        Export File
                    </Button>
                </View>

                <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => setIsSettingsOpen(true)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="cog-outline" size={22} color={theme.accent} />
                </TouchableOpacity>
            </View>

            {/* Viewer Settings Modal */}
            <Portal>
                <Modal visible={isSettingsOpen} onDismiss={() => setIsSettingsOpen(false)} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 4 }}>Viewer Configuration</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 16 }}>Configure document preview scale & scroll locks</Text>

                    <View style={styles.modalRow}>
                        <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }}>Fit Mode</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            {[
                                { mode: 'a4', label: 'A4' },
                                { mode: 'page', label: '1-PAGE' },
                                { mode: 'width', label: 'WIDTH' },
                            ].map((m) => (
                                <TouchableOpacity key={m.mode} onPress={() => setFitMode(m.mode)} style={[styles.modalFitPill, { backgroundColor: fitMode === m.mode ? theme.accent : theme.bgDark, borderColor: theme.border }]}>
                                    <Text style={{ color: fitMode === m.mode ? '#fff' : theme.textPrimary, fontSize: 10, fontWeight: 'bold' }}>{m.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.modalRow, { marginTop: 14 }]}>
                        <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }}>Full Canvas Mode</Text>
                        <Switch value={isFullScreenPreview} onValueChange={(val) => setIsFullScreenPreview(val)} color={theme.accent} />
                    </View>

                    <View style={[styles.modalRow, { marginTop: 14 }]}>
                        <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }}>Enable Page Scrolling</Text>
                        <Switch value={enableScroll} onValueChange={(val) => setEnableScroll(val)} color={theme.accent} />
                    </View>

                    <Button mode="contained" onPress={() => setIsSettingsOpen(false)} style={{ marginTop: 20, backgroundColor: theme.accent, borderRadius: 16 }}>
                        Close Settings
                    </Button>
                </Modal>
            </Portal>

            {/* In-App Direct Export Action Modal */}
            <ExportActionModal
                visible={exportModalVisible}
                onDismiss={() => setExportModalVisible(false)}
                fileUri={exportedFileUri}
                fileName={exportedFileName}
                exportFormat={exportFormat}
                moduleDomain="Resumes"
                rawTextContent={generatePlainText()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerBanner: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    subtitleCentered: { textAlign: 'center', fontSize: 11, marginTop: 4 },
    themeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    bodyCard: { flex: 1, marginHorizontal: 8, marginTop: 8, marginBottom: 60, borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 8 },
    topContainer: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 4 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
    layoutScroll: { paddingBottom: 4 },
    layoutCard: { marginRight: 8, borderWidth: 1.5, borderRadius: 8 },
    cardContent: { paddingVertical: 6, paddingHorizontal: 12 },
    layoutText: { fontWeight: 'bold', fontSize: 12 },
    toolbarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginVertical: 4 },
    toolbarControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    fitPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    fitPillText: { fontSize: 10, fontWeight: 'bold' },
    toolbarIconBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    previewArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 4, backgroundColor: '#1b1d22', borderRadius: 8, overflow: 'hidden' },
    exportSection: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 4 },
    footerCard: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderTopWidth: 1.5, zIndex: 100, elevation: 10 },
    footerCenterGroup: { flexDirection: 'row', alignItems: 'center' },
    footerIconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    modalContainer: { padding: 20, margin: 20, borderRadius: 16, borderWidth: 1 },
    modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalFitPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 }
});

export default PreviewScreen;
