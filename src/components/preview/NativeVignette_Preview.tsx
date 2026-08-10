// @ts-nocheck
import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Surface, Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const A4_RATIO = 1.4142;
const VIGNETTE_PADDING = 12;

const NativeVignette_Preview = ({ data, layout = 'professional', glow = null, exportFormat = 'pdf', fitMode = 'a4' }) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    if (!data) return null;

    // Dual-axis responsive dimensions for 100% paper edge visibility
    const availableWidth = Math.max(windowWidth - 24, 280);
    const availableHeight = Math.max(windowHeight - 200, 360);

    let scale = 1;
    if (fitMode === 'a4' || fitMode === 'page') {
        const scaleX = availableWidth / 794;
        const scaleY = availableHeight / (794 * A4_RATIO);
        scale = Math.min(scaleX, scaleY) * 0.94; // 0.94 guarantees 100% sheet & shadow visibility with breathing margin
    } else {
        scale = (availableWidth - 16) / 794;
    }

    const pageWidth = Math.max(794 * scale, 260);
    const pageHeight = fitMode === 'page' ? Math.min(availableHeight * 0.94, pageWidth * A4_RATIO) : (pageWidth * A4_RATIO);

    // Glow setup
    const getGlowColor = () => {
        switch (glow) {
            case 'source': return '#A855F7'; // Purple
            case 'target': return '#0EA5E9'; // Sky Blue
            case 'amber': return '#F59E0B';  // Amber
            case 'red': return '#EF4444';    // Red
            default: return 'transparent';
        }
    };

    const glowColor = getGlowColor();

    const pd = data["personal details"] || {};
    const names = pd.names || {};
    const contact = pd.contact || {};
    const address = pd.address || {};
    const identity = pd.identity || {};
    const licensing = pd.licensing || {};
    const demographics = pd.demographics || {};
    const legal = pd.legal || {};
    const languages = pd.languages || [];
    const expList = data.experience || [];
    const eduList = data.education || { tertiary: [], highschool: {} };
    const skills = data.skills || data.Skills || {};
    const summary = data["professional summary"];
    const refList = (data.References || data.references || []).filter(r => r.visible !== false);

    // Calculate content density for 1-Page Fitting
    const totalItemCount = expList.length + (eduList.tertiary?.length || 0) + (refList.length || 0) + (skills.Tech ? 1 : 0) + (summary ? 1 : 0);
    const isDense = fitMode === 'page' || totalItemCount > 5;

    // Density Scale Tokens
    const pagePadding = isDense ? 20 : 24;
    const nameFontSize = isDense ? 20 : 24;
    const sectionMargin = isDense ? 12 : 18;
    const bodyFontSize = isDense ? 11 : 12;
    const bodyLineHeight = isDense ? 15 : 17;

    const maskId = (idStr) => {
        if (!idStr) return '';
        if (identity.idMask !== false && idStr.length >= 6) {
            return `${idStr.substring(0, 6)} **** ***`;
        }
        return idStr;
    };

    const renderHeader = () => {
        if (layout === 'modern') {
            return (
                <View style={[styles.headerModern, { marginHorizontal: -pagePadding, marginTop: -pagePadding, padding: pagePadding }]}>
                    <Text style={[styles.nameModern, { fontSize: nameFontSize }]}>{names.firstName} {names.Surname}</Text>
                    <View style={styles.contactRowModern}>
                        {contact.Email && <Text style={styles.contactTextModern}>📧 {contact.Email}</Text>}
                        {contact.Phone && <Text style={styles.contactTextModern}>📱 {contact.Phone}</Text>}
                    </View>
                </View>
            );
        } else if (layout === 'minimalist') {
            return (
                <View style={styles.headerMinimalist}>
                    <Text style={[styles.nameMinimalist, { fontSize: nameFontSize - 2 }]}>{names.firstName} {names.Surname}</Text>
                    <Divider style={{ marginVertical: 8 }} />
                    <Text style={styles.contactTextMinimalist}>
                        {contact.Email} • {contact.Phone}
                    </Text>
                </View>
            );
        } else if (layout === 'chronological') {
            return (
                <View style={styles.headerChrono}>
                    <View style={styles.headerChronoMain}>
                        <Text style={[styles.nameChrono, { fontSize: nameFontSize }]}>{names.firstName} {names.Surname}</Text>
                        <Text style={styles.titleChrono}>{expList[0]?.Role || 'Professional'}</Text>
                    </View>
                    <View style={styles.contactBoxChrono}>
                        <Text style={styles.contactTextChrono}>{contact.Phone}</Text>
                        <Text style={styles.contactTextChrono}>{contact.Email}</Text>
                    </View>
                </View>
            );
        } else if (layout === 'functional') {
            return (
                <View style={styles.headerFunc}>
                    <Text style={[styles.nameFunc, { fontSize: nameFontSize + 4 }]}>{names.firstName} {names.Surname}</Text>
                    <View style={styles.funcDivider} />
                    <Text style={styles.contactTextFunc}>{contact.Email} | {contact.Phone}</Text>
                </View>
            );
        } else {
            return (
                <View style={styles.headerPro}>
                    <Text style={[styles.namePro, { fontSize: nameFontSize }]}>{names.Prefix ? names.Prefix + ' ' : ''}{names.firstName} {names.Surname}</Text>
                    <View style={styles.contactRowPro}>
                        <Text style={styles.contactTextPro}>
                            {contact.Email} | {contact.Phone}
                        </Text>
                        {address["Home Address"] && (
                            <Text style={styles.contactTextPro}>
                                {address["Home Address"].replace(/\n/g, ', ')}
                            </Text>
                        )}
                    </View>
                </View>
            );
        }
    };

    const renderSectionHeader = (title) => {
        if (exportFormat === 'word_text') {
            return <Text style={styles.plainSectionTitle}>{title.toUpperCase()}</Text>;
        }
        const titleStyle = layout === 'minimalist' ? styles.sectionTitleMin : styles.sectionTitle;
        return <Text style={titleStyle}>{title.toUpperCase()}</Text>;
    };

    if (exportFormat === 'word_text') {
        return (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.glowWrapper, glow && { borderColor: glowColor, borderWidth: 4, elevation: 15 }]}>
                    <Surface style={[styles.page, { width: pageWidth, minHeight: pageHeight, padding: pagePadding }]} elevation={4}>
                        <Text style={styles.plainTextHeader}>{names.firstName} {names.Surname}</Text>
                        <Text style={styles.plainTextContact}>{contact.Email} | {contact.Phone}</Text>
                        <Text style={styles.plainTextContact}>{address["Home Address"] ? address["Home Address"].replace(/\n/g, ', ') : ''}</Text>
                        <Divider style={{ marginVertical: 10 }} />

                        {summary && (
                            <View style={[styles.section, { marginBottom: sectionMargin }]}>
                                {renderSectionHeader('Executive Summary')}
                                <Text style={styles.plainTextBody}>{summary}</Text>
                            </View>
                        )}
                        
                        {expList.length > 0 && (
                            <View style={[styles.section, { marginBottom: sectionMargin }]}>
                                {renderSectionHeader('Professional Experience')}
                                {expList.map((job, idx) => (
                                    <View key={idx} style={styles.entry}>
                                        <Text style={styles.plainTextBold}>{job.Organization} | {job.Role}</Text>
                                        <Text style={styles.plainTextSub}>{job["Start Date"]} - {job["End Date"] || 'Present'}</Text>
                                        <Text style={styles.plainTextBody}>{job["Key Responsibilities"]}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {(eduList.tertiary?.length > 0) && (
                            <View style={[styles.section, { marginBottom: sectionMargin }]}>
                                {renderSectionHeader('Education')}
                                {eduList.tertiary?.map((edu, idx) => (
                                    <View key={idx} style={styles.entry}>
                                        <Text style={styles.plainTextBold}>{edu.Institution} | {edu["Qualification Name"]}</Text>
                                        <Text style={styles.plainTextSub}>{edu.Year}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </Surface>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.glowWrapper, glow && { borderColor: glowColor, borderWidth: 4, elevation: 15 }]}>
                <Surface style={[styles.page, { width: pageWidth, minHeight: pageHeight, padding: pagePadding }]} elevation={4}>
                {renderHeader()}

                {/* Section Priority Logic */}
                {layout === 'functional' && (skills.Tech || skills.Soft) && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Expertise & Skills')}
                        {skills.Tech && <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}><Text style={{ fontWeight: 'bold' }}>Technical:</Text> {skills.Tech}</Text>}
                        {skills.Soft && <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}><Text style={{ fontWeight: 'bold' }}>Core Competencies:</Text> {skills.Soft}</Text>}
                    </View>
                )}

                {/* Personal Info Meta Section */}
                <View style={[styles.section, { marginBottom: sectionMargin }]}>
                    {renderSectionHeader('Personal Information')}
                    <View style={styles.metaGrid}>
                        {identity.idNumber && <View style={styles.metaItem}><Text style={styles.metaLabel}>ID Number:</Text><Text style={styles.metaValue}>{maskId(identity.idNumber)}</Text></View>}
                        {demographics.Nationality && <View style={styles.metaItem}><Text style={styles.metaLabel}>Nationality:</Text><Text style={styles.metaValue}>{demographics.Nationality}</Text></View>}
                        {licensing.DriversVisible && licensing.Drivers !== 'None' && <View style={styles.metaItem}><Text style={styles.metaLabel}>Drivers:</Text><Text style={styles.metaValue}>{licensing.Drivers}</Text></View>}
                    </View>
                </View>

                {summary && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader(layout === 'functional' ? 'Professional Profile' : 'Professional Summary')}
                        <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>{summary}</Text>
                    </View>
                )}

                {expList.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Work Experience')}
                        {expList.map((job, idx) => (
                            <View key={idx} style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>{job.Organization}</Text>
                                    <Text style={styles.entryDate}>{job["Start Date"]} - {job["End Date"] || 'Present'}</Text>
                                </View>
                                <Text style={styles.entrySubTitle}>{job.Role}</Text>
                                <Text style={[styles.entryDesc, { fontSize: bodyFontSize - 1, lineHeight: bodyLineHeight - 1 }]}>{job["Key Responsibilities"]}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {(eduList.tertiary?.length > 0 || (eduList.highschool && (eduList.highschool["Year Completed"] || eduList.highschool["Highest Grade Passed"]))) && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Education')}
                        {eduList.tertiary?.map((edu, idx) => (
                            <View key={idx} style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>{edu.Institution}</Text>
                                    <Text style={styles.entryDate}>{edu.Year}</Text>
                                </View>
                                <Text style={styles.entrySubTitle}>{edu["Qualification Name"]}</Text>
                            </View>
                        ))}
                        {eduList.highschool && (eduList.highschool["Year Completed"] || eduList.highschool["Highest Grade Passed"]) && (
                            <View style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>{eduList.highschool["Province Department"] || 'High School'}</Text>
                                    <Text style={styles.entryDate}>{eduList.highschool["Year Completed"] || ''}</Text>
                                </View>
                                <Text style={styles.entrySubTitle}>{eduList.highschool["Highest Grade Passed"] || eduList.highschool["Highest Grade/Std"] || 'Completed'}</Text>
                            </View>
                        )}
                    </View>
                )}

                {(skills.Tech || skills.Soft || skills.Certifications) && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Skills & Certifications')}
                        {skills.Tech && <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}><Text style={{ fontWeight: 'bold' }}>Technical:</Text> {skills.Tech}</Text>}
                        {skills.Soft && <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}><Text style={{ fontWeight: 'bold' }}>Soft Skills:</Text> {skills.Soft}</Text>}
                        {skills.Certifications && <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}><Text style={{ fontWeight: 'bold' }}>Certifications:</Text> {skills.Certifications}</Text>}
                    </View>
                )}

                {languages.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Languages')}
                        {languages.filter(l => l.visible !== false).map((l, idx) => (
                            <Text key={idx} style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>{l.Language}: {l.proficiency}</Text>
                        ))}
                    </View>
                )}

                {refList.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('References')}
                        <View style={styles.refGrid}>
                            {refList.map((ref, idx) => (
                                <View key={idx} style={styles.refItem}>
                                    <Text style={styles.refName}>{ref.name}</Text>
                                    <Text style={styles.refDetail}>{(ref.role || ref.relation || 'Reference')}{ref.company || ref.org ? ` at ${ref.company || ref.org}` : ''}</Text>
                                    <Text style={styles.refDetail}>{ref.contact || ref.phone}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
                </Surface>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: { padding: VIGNETTE_PADDING, alignItems: 'center', justifyContent: 'center' },
    glowWrapper: {
        borderRadius: 4,
        overflow: 'visible',
    },
    page: {
        backgroundColor: '#ffffff',
        borderRadius: 4,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
    },
    // Plain Text Settings
    plainTextHeader: { fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    plainTextContact: { fontFamily: 'monospace', fontSize: 12, marginBottom: 2 },
    plainSectionTitle: { fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', marginTop: 12, marginBottom: 8, textDecorationLine: 'underline' },
    plainTextBody: { fontFamily: 'monospace', fontSize: 11, lineHeight: 16 },
    plainTextBold: { fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
    plainTextSub: { fontFamily: 'monospace', fontSize: 11, marginBottom: 4 },

    // Professional Layout
    headerPro: { borderBottomWidth: 2, borderBottomColor: '#2c3e50', paddingBottom: 12, marginBottom: 16 },
    namePro: { fontWeight: 'bold', color: '#2c3e50', textTransform: 'uppercase', letterSpacing: 1 },
    contactRowPro: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap' },
    contactTextPro: { fontSize: 11, color: '#555' },

    // Modern Layout
    headerModern: { backgroundColor: '#2c3e50', marginBottom: 16, overflow: 'hidden' },
    nameModern: { fontWeight: 'bold', color: 'white' },
    contactRowModern: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    contactTextModern: { fontSize: 12, color: '#ecf0f1' },

    // Minimalist Layout
    headerMinimalist: { alignItems: 'center', marginBottom: 20 },
    nameMinimalist: { fontWeight: '300', color: '#333' },
    contactTextMinimalist: { fontSize: 11, color: '#888' },

    // Chronological Layout
    headerChrono: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 3, borderBottomColor: '#333', paddingBottom: 12, marginBottom: 16 },
    headerChronoMain: { flex: 1 },
    nameChrono: { fontWeight: 'bold', color: '#000' },
    titleChrono: { fontSize: 13, color: '#666', marginTop: 2, textTransform: 'uppercase' },
    contactBoxChrono: { alignItems: 'flex-end' },
    contactTextChrono: { fontSize: 11, color: '#333' },

    // Functional Layout
    headerFunc: { alignItems: 'center', marginBottom: 20 },
    nameFunc: { fontWeight: 'bold', color: '#2c3e50', letterSpacing: 2 },
    funcDivider: { width: 40, height: 3, backgroundColor: '#2c3e50', marginVertical: 8 },
    contactTextFunc: { fontSize: 11, color: '#777', textTransform: 'uppercase' },

    section: { marginBottom: 14 },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#2c3e50', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2, marginBottom: 6 },
    sectionTitleMin: { fontSize: 12, fontWeight: 'normal', color: '#888', textAlign: 'center', marginBottom: 10 },
    
    metaGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    metaItem: { width: '50%', marginBottom: 4 },
    metaLabel: { fontSize: 10, fontWeight: 'bold', color: '#777' },
    metaValue: { fontSize: 11, color: '#333' },

    bodyText: { color: '#333' },
    
    entry: { marginBottom: 10 },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    entryTitle: { fontSize: 12, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
    entryDate: { fontSize: 11, color: '#777', marginLeft: 8 },
    entrySubTitle: { fontSize: 11, fontStyle: 'italic', color: '#555', marginVertical: 1 },
    entryDesc: { color: '#333' },

    refGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    refItem: { width: '50%', marginBottom: 8 },
    refName: { fontSize: 11, fontWeight: 'bold', color: '#333' },
    refDetail: { fontSize: 10, color: '#666' }
});

export default NativeVignette_Preview;
