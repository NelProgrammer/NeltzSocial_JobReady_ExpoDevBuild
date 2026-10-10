import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Surface, Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ResumeData } from '../../types/resume';
import { ResumeCompiler, CompiledResumeDocument } from '@jobready/core';

const A4_RATIO = 1.4142;
const VIGNETTE_PADDING = 12;

interface NativeVignetteProps {
    data: ResumeData | any;
    layout?: string;
    glow?: string | null;
    exportFormat?: string;
    fitMode?: string;
    uiSettings?: any;
}

const NativeVignette_Preview: React.FC<NativeVignetteProps> = ({ data, layout = 'professional', glow = null, exportFormat = 'pdf', fitMode = 'a4', uiSettings = null }) => {
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

    // Authoritative Core_TS Compilation: strict visibility, POPIA masking, zero ghost headers
    const compilerConfig = {
        config_type: (uiSettings?.isMain !== false) ? 'main' : 'targeted',
        visibility_flags: uiSettings?.visibility_flags || uiSettings?.visibility || data?.visibility || {},
        format_switches: uiSettings || {},
        formattingSettings: uiSettings || {}
    };

    const doc: CompiledResumeDocument = ResumeCompiler.compile(data, compilerConfig);
    const { header, summary, demographics = [], workExperience = [], education = {}, skills = { categories: [], displayFormat: 'bullet' }, languages = [], references = [], density } = doc;

    const fullName = header.fullName || 'Job Applicant';
    const contactElements = header.contactItems.map(c => c.displayString);
    const contactSep = header.contactSeparator || ' • ';
    const addressText = header.addressLine || '';

    // Calculate content density for 1-Page Fitting
    const isDense = fitMode === 'page' || density.isDense;

    // Density Scale Tokens
    const pagePadding = isDense ? 20 : 24;
    const nameFontSize = isDense ? 20 : 24;
    const sectionMargin = isDense ? 12 : 18;
    const bodyFontSize = isDense ? 11 : 12;
    const bodyLineHeight = isDense ? 15 : 17;

    const isContactBullet = uiSettings?.ContactFormat === 'bullet';

    const renderHeader = () => {
        if (layout === 'modern') {
            return (
                <View style={[styles.headerModern, { marginHorizontal: -pagePadding, marginTop: -pagePadding, padding: pagePadding }]}>
                    <Text style={[styles.nameModern, { fontSize: nameFontSize }]}>{fullName}</Text>
                    <View style={[styles.contactRowModern, isContactBullet && { flexDirection: 'column', gap: 3 }]}>
                        {contactElements.map((c, i) => (
                            <Text key={i} style={styles.contactTextModern}>{isContactBullet ? `• ${c}` : c}</Text>
                        ))}
                    </View>
                    {addressText ? (
                        <View style={{ width: '100%', marginTop: 6 }}>
                            <Text style={styles.contactTextModern}>📍 {addressText}</Text>
                        </View>
                    ) : null}
                </View>
            );
        } else if (layout === 'minimalist') {
            return (
                <View style={styles.headerMinimalist}>
                    <Text style={[styles.nameMinimalist, { fontSize: nameFontSize - 2 }]}>{fullName}</Text>
                    <Divider style={{ marginVertical: 8 }} />
                    {contactElements.length > 0 && (
                        isContactBullet ? (
                            <View style={{ alignItems: 'center' }}>
                                {contactElements.map((c, i) => (
                                    <Text key={i} style={styles.contactTextMinimalist}>• {c}</Text>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.contactTextMinimalist}>
                                {contactElements.join(contactSep)}
                            </Text>
                        )
                    )}
                    {addressText ? (
                        <Text style={[styles.contactTextMinimalist, { marginTop: 4, textAlign: 'center' }]}>
                            {addressText}
                        </Text>
                    ) : null}
                </View>
            );
        } else if (layout === 'chronological') {
            return (
                <View style={styles.headerChrono}>
                    <View style={styles.headerChronoMain}>
                        <Text style={[styles.nameChrono, { fontSize: nameFontSize }]}>{fullName}</Text>
                        <Text style={styles.titleChrono}>{workExperience[0]?.role || 'Professional'}</Text>
                        {addressText ? (
                            <Text style={[styles.contactTextChrono, { marginTop: 4 }]}>📍 {addressText}</Text>
                        ) : null}
                    </View>
                    {contactElements.length > 0 && (
                        <View style={styles.contactBoxChrono}>
                            {contactElements.map((c, i) => (
                                <Text key={i} style={styles.contactTextChrono}>{isContactBullet ? `• ${c}` : c}</Text>
                            ))}
                        </View>
                    )}
                </View>
            );
        } else if (layout === 'functional') {
            return (
                <View style={styles.headerFunc}>
                    <Text style={[styles.nameFunc, { fontSize: nameFontSize + 4 }]}>{fullName}</Text>
                    <View style={styles.funcDivider} />
                    {contactElements.length > 0 && (
                        isContactBullet ? (
                            <View style={{ alignItems: 'center' }}>
                                {contactElements.map((c, i) => (
                                    <Text key={i} style={styles.contactTextFunc}>• {c}</Text>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.contactTextFunc}>{contactElements.join(contactSep)}</Text>
                        )
                    )}
                    {addressText ? (
                        <Text style={[styles.contactTextFunc, { marginTop: 4, textAlign: 'center' }]}>
                            {addressText}
                        </Text>
                    ) : null}
                </View>
            );
        } else {
            return (
                <View style={styles.headerPro}>
                    <Text style={[styles.namePro, { fontSize: nameFontSize }]}>{fullName}</Text>
                    <View style={[styles.contactRowPro, isContactBullet && { flexDirection: 'column' }]}>
                        {contactElements.length > 0 && (
                            isContactBullet ? (
                                contactElements.map((c, i) => (
                                    <Text key={i} style={styles.contactTextPro}>• {c}</Text>
                                ))
                            ) : (
                                <Text style={styles.contactTextPro}>
                                    {contactElements.join(contactSep)}
                                </Text>
                            )
                        )}
                        {addressText ? (
                            <View style={{ width: '100%', marginTop: 4 }}>
                                <Text style={styles.contactTextPro}>
                                    📍 {addressText}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            );
        }
    };

    const renderSectionHeader = (title: string) => {
        if (exportFormat === 'word_text') {
            return <Text style={styles.plainSectionTitle}>{title.toUpperCase()}</Text>;
        }
        const titleStyle = layout === 'minimalist' ? styles.sectionTitleMin : styles.sectionTitle;
        return <Text style={titleStyle}>{title.toUpperCase()}</Text>;
    };

    if (exportFormat === 'word_text') {
        const tertiaryEdu = education.tertiary || [];

        return (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.glowWrapper, glow && { borderColor: glowColor, borderWidth: 4, elevation: 15 }]}>
                    <Surface style={[styles.page, { width: pageWidth, minHeight: pageHeight, padding: pagePadding }]} elevation={4}>
                        <Text style={styles.plainTextHeader}>{fullName}</Text>
                        {contactElements.length > 0 && <Text style={styles.plainTextContact}>{contactElements.join(' | ')}</Text>}
                        {addressText ? <Text style={styles.plainTextContact}>{addressText}</Text> : null}
                        <Divider style={{ marginVertical: 10 }} />

                        {summary && (
                            <View style={[styles.section, { marginBottom: sectionMargin }]}>
                                {renderSectionHeader('Executive Summary')}
                                <Text style={styles.plainTextBody}>{summary}</Text>
                            </View>
                        )}
                        
                        {workExperience.length > 0 && (
                            <View style={[styles.section, { marginBottom: sectionMargin }]}>
                                {renderSectionHeader('Professional Experience')}
                                {workExperience.map((job, idx) => (
                                    <View key={job.id || idx} style={styles.entry}>
                                        <Text style={styles.plainTextBold}>{job.organization} | {job.role}</Text>
                                        {job.period ? <Text style={styles.plainTextSub}>{job.period}</Text> : null}
                                        {job.responsibilities && job.responsibilities.length > 0 ? (
                                            <Text style={styles.plainTextBody}>{job.responsibilities.join('\n')}</Text>
                                        ) : null}
                                    </View>
                                ))}
                            </View>
                        )}

                        {tertiaryEdu.length > 0 && (
                            <View style={[styles.section, { marginBottom: sectionMargin }]}>
                                {renderSectionHeader('Education')}
                                {tertiaryEdu.map((edu, idx) => (
                                    <View key={edu.id || idx} style={styles.entry}>
                                        <Text style={styles.plainTextBold}>{edu.institution} | {edu.qualification}</Text>
                                        {edu.year ? <Text style={styles.plainTextSub}>{edu.year}</Text> : null}
                                    </View>
                                ))}
                            </View>
                        )}
                    </Surface>
                </View>
            </ScrollView>
        );
    }

    const isDemoComma = uiSettings?.DemoFormat === 'comma';

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.glowWrapper, glow && { borderColor: glowColor, borderWidth: 4, elevation: 15 }]}>
                <Surface style={[styles.page, { width: pageWidth, minHeight: pageHeight, padding: pagePadding }]} elevation={4}>
                {renderHeader()}

                {/* Section Priority Logic: Functional Layout Expertise */}
                {layout === 'functional' && skills.categories && skills.categories.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Expertise & Skills')}
                        {skills.categories.map((cat, idx) => (
                            <Text key={idx} style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>
                                <Text style={{ fontWeight: 'bold' }}>{cat.title}: </Text>
                                {cat.items.join(', ')}
                            </Text>
                        ))}
                    </View>
                )}

                {/* Personal Info Demographics Section */}
                {demographics.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Personal Information')}
                        {isDemoComma ? (
                            <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>
                                {demographics.map(d => `${d.label}: ${d.value}`).join(' · ')}
                            </Text>
                        ) : (
                            <View style={styles.metaGrid}>
                                {demographics.map((item, idx) => (
                                    <View key={idx} style={styles.metaItem}>
                                        <Text style={styles.metaLabel}>{item.label}:</Text>
                                        <Text style={styles.metaValue}>{item.value}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {summary ? (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader(layout === 'functional' ? 'Professional Profile' : 'Professional Summary')}
                        <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>{summary}</Text>
                    </View>
                ) : null}

                {workExperience.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Work Experience')}
                        {workExperience.map((job, idx) => (
                            <View key={job.id || idx} style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>{job.organization || 'Organization'}</Text>
                                    {job.period ? <Text style={styles.entryDate}>{job.period}</Text> : null}
                                </View>
                                {job.role ? <Text style={styles.entrySubTitle}>{job.role}</Text> : null}
                                {job.responsibilities && job.responsibilities.length > 0 ? (
                                    <Text style={[styles.entryDesc, { fontSize: bodyFontSize - 1, lineHeight: bodyLineHeight - 1 }]}>
                                        {job.responsibilitiesLayout === 'bullet'
                                            ? job.responsibilities.map(r => `• ${r}`).join('\n')
                                            : job.responsibilities.join(', ')}
                                    </Text>
                                ) : null}
                                {job.achievements && job.achievements.length > 0 ? (
                                    <Text style={[styles.entryDesc, { fontSize: bodyFontSize - 1, lineHeight: bodyLineHeight - 1, marginTop: 4 }]}>
                                        <Text style={{ fontWeight: 'bold' }}>Key Achievements:{'\n'}</Text>
                                        {job.achievements.map(a => `• ${a}`).join('\n')}
                                    </Text>
                                ) : null}
                                {job.systemsUsed && job.systemsUsed.length > 0 ? (
                                    <Text style={[styles.entryDesc, { fontSize: bodyFontSize - 1, lineHeight: bodyLineHeight - 1, marginTop: 4 }]}>
                                        <Text style={{ fontWeight: 'bold' }}>Systems Used: </Text>
                                        {job.systemsUsed.join(', ')}
                                    </Text>
                                ) : null}
                            </View>
                        ))}
                    </View>
                )}

                {(education.tertiary?.length || education.artisanal?.length || education.technicalCerts?.length || education.regulatoryCerts?.length || education.highschool) ? (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Education')}
                        {education.tertiary?.map((edu, idx) => (
                            <View key={edu.id || idx} style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>{edu.institution || 'Institution'}</Text>
                                    {edu.year ? <Text style={styles.entryDate}>{edu.year}</Text> : null}
                                </View>
                                <Text style={styles.entrySubTitle}>{[edu.qualification, edu.completed === false ? '(In Progress)' : '', edu.nqfLevel ? `NQF ${edu.nqfLevel}` : ''].filter(Boolean).join(' · ')}</Text>
                            </View>
                        ))}
                        {education.artisanal?.map((cert, idx) => (
                            <View key={cert.id || `art_${idx}`} style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>🔧 {cert.trade}</Text>
                                    {cert.dateTested ? <Text style={styles.entryDate}>{cert.dateTested}</Text> : null}
                                </View>
                                <Text style={styles.entrySubTitle}>{[cert.testingCentre ? `Centre: ${cert.testingCentre}` : '', cert.certificateNumber ? `Cert No: ${cert.certificateNumber}` : ''].filter(Boolean).join(' · ')}</Text>
                            </View>
                        ))}
                        {education.technicalCerts?.map((cert, idx) => (
                            <View key={cert.id || `tc_${idx}`} style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>💻 {cert.name}</Text>
                                    {cert.dateIssued ? <Text style={styles.entryDate}>{cert.dateIssued}</Text> : null}
                                </View>
                                {cert.issuingBody ? <Text style={styles.entrySubTitle}>{cert.issuingBody}</Text> : null}
                            </View>
                        ))}
                        {education.regulatoryCerts?.map((cert, idx) => (
                            <View key={cert.id || `rc_${idx}`} style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>⚖️ {cert.name}</Text>
                                    {cert.dateIssued ? <Text style={styles.entryDate}>{cert.dateIssued}</Text> : null}
                                </View>
                                {cert.issuingBody ? <Text style={styles.entrySubTitle}>{cert.issuingBody}</Text> : null}
                            </View>
                        ))}
                        {education.highschool ? (
                            <View style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>{education.highschool.schoolName || education.highschool.department || 'High School'}</Text>
                                    {education.highschool.yearCompleted ? <Text style={styles.entryDate}>{education.highschool.yearCompleted}</Text> : null}
                                </View>
                                <Text style={styles.entrySubTitle}>{[education.highschool.grade || 'Completed', education.highschool.stream ? `Stream: ${education.highschool.stream}` : ''].filter(Boolean).join(' · ')}</Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                {skills.categories && skills.categories.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Skills & Certifications')}
                        {skills.categories.map((cat, idx) => (
                            <View key={idx} style={{ marginBottom: 6 }}>
                                <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>
                                    <Text style={{ fontWeight: 'bold' }}>{cat.title}: </Text>
                                    {skills.displayFormat === 'bullet' ? '' : cat.items.join(', ')}
                                </Text>
                                {skills.displayFormat === 'bullet' && (
                                    <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight, paddingLeft: 8 }]}>
                                        {cat.items.map(item => `• ${item}`).join('\n')}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {languages.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Languages')}
                        {languages.map((l, idx) => (
                            <Text key={idx} style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>{l.displayString}</Text>
                        ))}
                    </View>
                )}

                {references.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('References')}
                        <View style={styles.refGrid}>
                            {references.map((ref, idx) => {
                                const roleCompany = [ref.role, ref.company].filter(Boolean).join(' at ');
                                const contact = [ref.cellPhone || ref.workPhone, ref.email].filter(Boolean).join(' · ');
                                return (
                                    <View key={ref.id || idx} style={styles.refItem}>
                                        <Text style={styles.refName}>{ref.name}</Text>
                                        {roleCompany ? <Text style={styles.refDetail}>{roleCompany}</Text> : null}
                                        {contact ? <Text style={styles.refDetail}>{contact}</Text> : null}
                                    </View>
                                );
                            })}
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
