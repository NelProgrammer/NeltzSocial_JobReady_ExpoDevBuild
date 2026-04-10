import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Surface, Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const A4_RATIO = 1.4142;
const VIGNETTE_PADDING = 20;
const PAGE_WIDTH = SCREEN_WIDTH - (VIGNETTE_PADDING * 2);
const PAGE_HEIGHT = PAGE_WIDTH * A4_RATIO;

const NativeVignette = ({ data, layout = 'professional', glow = null, exportFormat = 'pdf' }) => {
    if (!data) return null;

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
    const skills = data.Skills || {};
    const summary = data["professional summary"];
    const refList = data["References"] || [];

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
                <View style={styles.headerModern}>
                    <Text style={styles.nameModern}>{names.firstName} {names.Surname}</Text>
                    <View style={styles.contactRowModern}>
                        {contact.Email && <Text style={styles.contactTextModern}>📧 {contact.Email}</Text>}
                        {contact.Phone && <Text style={styles.contactTextModern}>📱 {contact.Phone}</Text>}
                    </View>
                </View>
            );
        } else if (layout === 'minimalist') {
            return (
                <View style={styles.headerMinimalist}>
                    <Text style={styles.nameMinimalist}>{names.firstName} {names.Surname}</Text>
                    <Divider style={{ marginVertical: 10 }} />
                    <Text style={styles.contactTextMinimalist}>
                        {contact.Email} • {contact.Phone}
                    </Text>
                </View>
            );
        } else if (layout === 'chronological') {
            return (
                <View style={styles.headerChrono}>
                    <View style={styles.headerChronoMain}>
                        <Text style={styles.nameChrono}>{names.firstName} {names.Surname}</Text>
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
                    <Text style={styles.nameFunc}>{names.firstName} {names.Surname}</Text>
                    <View style={styles.funcDivider} />
                    <Text style={styles.contactTextFunc}>{contact.Email} | {contact.Phone}</Text>
                </View>
            );
        } else {
            return (
                <View style={styles.headerPro}>
                    <Text style={styles.namePro}>{names.Prefix ? names.Prefix + ' ' : ''}{names.firstName} {names.Surname}</Text>
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
                    <Surface style={styles.page} elevation={4}>
                        <Text style={styles.plainTextHeader}>{names.firstName} {names.Surname}</Text>
                        <Text style={styles.plainTextContact}>{contact.Email} | {contact.Phone}</Text>
                        <Text style={styles.plainTextContact}>{address["Home Address"] ? address["Home Address"].replace(/\n/g, ', ') : ''}</Text>
                        <Divider style={{ marginVertical: 15 }} />

                        {summary && (
                            <View style={styles.section}>
                                {renderSectionHeader('Executive Summary')}
                                <Text style={styles.plainTextBody}>{summary}</Text>
                            </View>
                        )}
                        
                        {expList.length > 0 && (
                            <View style={styles.section}>
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
                            <View style={styles.section}>
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
                <Surface style={styles.page} elevation={4}>
                {renderHeader()}

                {/* Section Priority Logic */}
                {layout === 'functional' && (skills.Tech || skills.Soft) && (
                    <View style={styles.section}>
                        {renderSectionHeader('Expertise & Skills')}
                        {skills.Tech && <Text style={styles.bodyText}><Text style={{ fontWeight: 'bold' }}>Technical:</Text> {skills.Tech}</Text>}
                        {skills.Soft && <Text style={styles.bodyText}><Text style={{ fontWeight: 'bold' }}>Core Competencies:</Text> {skills.Soft}</Text>}
                    </View>
                )}

                {/* Personal Info Meta Section */}
                <View style={styles.section}>
                    {renderSectionHeader('Personal Information')}
                    <View style={styles.metaGrid}>
                        {identity.idNumber && <View style={styles.metaItem}><Text style={styles.metaLabel}>ID Number:</Text><Text style={styles.metaValue}>{maskId(identity.idNumber)}</Text></View>}
                        {demographics.Nationality && <View style={styles.metaItem}><Text style={styles.metaLabel}>Nationality:</Text><Text style={styles.metaValue}>{demographics.Nationality}</Text></View>}
                        {licensing.DriversVisible && licensing.Drivers !== 'None' && <View style={styles.metaItem}><Text style={styles.metaLabel}>Drivers:</Text><Text style={styles.metaValue}>{licensing.Drivers}</Text></View>}
                    </View>
                </View>

                {summary && (
                    <View style={styles.section}>
                        {renderSectionHeader(layout === 'functional' ? 'Professional Profile' : 'Professional Summary')}
                        <Text style={styles.bodyText}>{summary}</Text>
                    </View>
                )}


                {expList.length > 0 && (
                    <View style={styles.section}>
                        {renderSectionHeader('Work Experience')}
                        {expList.map((job, idx) => (
                            <View key={idx} style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle}>{job.Organization}</Text>
                                    <Text style={styles.entryDate}>{job["Start Date"]} - {job["End Date"] || 'Present'}</Text>
                                </View>
                                <Text style={styles.entrySubTitle}>{job.Role}</Text>
                                <Text style={styles.entryDesc}>{job["Key Responsibilities"]}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {(eduList.tertiary?.length > 0 || (eduList.highschool && eduList.highschool["Year Completed"])) && (
                    <View style={styles.section}>
                        {renderSectionHeader('Education')}
                        {eduList.tertiary?.map((edu, idx) => (
                            <View key={idx} style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle}>{edu.Institution}</Text>
                                    <Text style={styles.entryDate}>{edu.Year}</Text>
                                </View>
                                <Text style={styles.entrySubTitle}>{edu["Qualification Name"]}</Text>
                            </View>
                        ))}
                        {eduList.highschool && eduList.highschool["Year Completed"] && (
                            <View style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle}>{eduList.highschool["Province Department"]}</Text>
                                    <Text style={styles.entryDate}>{eduList.highschool["Year Completed"]}</Text>
                                </View>
                                <Text style={styles.entrySubTitle}>{eduList.highschool["Highest Grade/Std"]}</Text>
                            </View>
                        )}
                    </View>
                )}

                {(skills.Tech || skills.Soft) && (
                    <View style={styles.section}>
                        {renderSectionHeader('Skills')}
                        {skills.Tech && <Text style={styles.bodyText}><Text style={{ fontWeight: 'bold' }}>Technical:</Text> {skills.Tech}</Text>}
                        {skills.Soft && <Text style={styles.bodyText}><Text style={{ fontWeight: 'bold' }}>Soft Skills:</Text> {skills.Soft}</Text>}
                    </View>
                )}

                {languages.length > 0 && (
                    <View style={styles.section}>
                        {renderSectionHeader('Languages')}
                        {languages.filter(l => l.visible !== false).map((l, idx) => (
                            <Text key={idx} style={styles.bodyText}>{l.Language}: {l.proficiency}</Text>
                        ))}
                    </View>
                )}

                {refList.length > 0 && (
                    <View style={styles.section}>
                        {renderSectionHeader('References')}
                        <View style={styles.refGrid}>
                            {refList.filter(r => r.visible).map((ref, idx) => (
                                <View key={idx} style={styles.refItem}>
                                    <Text style={styles.refName}>{ref.name}</Text>
                                    <Text style={styles.refDetail}>{ref.relation} at {ref.org}</Text>
                                    <Text style={styles.refDetail}>{ref.phone}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}


                {/* More sections can be added here (Education, Skills, etc.) */}
                
                </Surface>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: { padding: VIGNETTE_PADDING, alignItems: 'center' },
    glowWrapper: {
        borderRadius: 4,
        overflow: 'hidden',
    },
    page: {
        width: PAGE_WIDTH,
        minHeight: PAGE_HEIGHT,
        backgroundColor: 'white',
        padding: 30,
    },
    // Plain Text Settings
    plainTextHeader: { fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    plainTextContact: { fontFamily: 'monospace', fontSize: 12, marginBottom: 2 },
    plainSectionTitle: { fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 10, textDecorationLine: 'underline' },
    plainTextBody: { fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
    plainTextBold: { fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
    plainTextSub: { fontFamily: 'monospace', fontSize: 12, marginBottom: 5 },

    // Professional Layout
    headerPro: { borderBottomWidth: 2, borderBottomColor: '#2c3e50', paddingBottom: 15, marginBottom: 20 },
    namePro: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', textTransform: 'uppercase', letterSpacing: 1 },
    contactRowPro: { marginTop: 8 },
    contactTextPro: { fontSize: 12, color: '#555' },

    // Modern Layout
    headerModern: { backgroundColor: '#2c3e50', margin: -30, padding: 30, marginBottom: 20 },
    nameModern: { fontSize: 28, fontWeight: 'bold', color: 'white' },
    contactRowModern: { marginTop: 10 },
    contactTextModern: { fontSize: 13, color: '#ecf0f1', marginBottom: 2 },

    // Minimalist Layout
    headerMinimalist: { alignItems: 'center', marginBottom: 30 },
    nameMinimalist: { fontSize: 22, fontWeight: '300', color: '#333' },
    contactTextMinimalist: { fontSize: 11, color: '#888' },

    // Chronological Layout
    headerChrono: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 3, borderBottomColor: '#333', paddingBottom: 15, marginBottom: 20 },
    headerChronoMain: { flex: 1 },
    nameChrono: { fontSize: 26, fontWeight: 'bold', color: '#000' },
    titleChrono: { fontSize: 14, color: '#666', marginTop: 2, textTransform: 'uppercase' },
    contactBoxChrono: { alignItems: 'flex-end' },
    contactTextChrono: { fontSize: 11, color: '#333' },

    // Functional Layout
    headerFunc: { alignItems: 'center', marginBottom: 25 },
    nameFunc: { fontSize: 32, fontWeight: 'bold', color: '#2c3e50', letterSpacing: 2 },
    funcDivider: { width: 50, height: 4, backgroundColor: '#2c3e50', marginVertical: 10 },
    contactTextFunc: { fontSize: 12, color: '#777', textTransform: 'uppercase' },

    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 3, marginBottom: 8 },
    sectionTitleMin: { fontSize: 13, fontWeight: 'normal', color: '#888', textAlign: 'center', marginBottom: 15 },
    
    metaGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    metaItem: { width: '50%', marginBottom: 5 },
    metaLabel: { fontSize: 10, fontWeight: 'bold', color: '#777' },
    metaValue: { fontSize: 11, color: '#333' },

    bodyText: { fontSize: 12, color: '#333', lineHeight: 18 },
    
    entry: { marginBottom: 15 },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    entryTitle: { fontSize: 13, fontWeight: 'bold', color: '#2c3e50' },
    entryDate: { fontSize: 11, color: '#777' },
    entrySubTitle: { fontSize: 12, fontStyle: 'italic', color: '#555', marginVertical: 2 },
    entryDesc: { fontSize: 11, color: '#333', lineHeight: 16 },

    refGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    refItem: { width: '50%', marginBottom: 10 },
    refName: { fontSize: 12, fontWeight: 'bold', color: '#333' },
    refDetail: { fontSize: 10, color: '#666' }
});

export default NativeVignette;
